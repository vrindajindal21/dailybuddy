// Enhanced Service Worker for rich push notifications and background timing
const CACHE_NAME = "productivity-app-v1"
const urlsToCache = ["/", "/dashboard", "/favicon.ico"]
const POMODORO_TIMER_KEY = "global_pomodoro_timer"

// Background timer and reminder management
let backgroundTimers = new Map()
let backgroundReminders = new Map()

// --- OFFLINE SUPPORT: Cache all static assets and main routes ---
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/analytics',
  '/dashboard/budget',
  '/dashboard/fun',
  '/dashboard/goals',
  '/dashboard/habits',
  '/dashboard/health',
  '/dashboard/medications',
  '/dashboard/pomodoro',
  '/dashboard/reminders',
  '/dashboard/study',
  '/dashboard/tasks',
  '/dashboard/timetable',
  '/dashboard/tutorial',
  '/favicon.ico',
  '/manifest.json',
  '/site.webmanifest',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/placeholder-logo.svg',
  '/placeholder-user.jpg',
  '/placeholder.jpg',
  '/placeholder.svg',
  // Add more static assets as needed
];

self.addEventListener("install", (event) => {
  console.log('[sw.js] Service Worker installing...')
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll([...urlsToCache, ...STATIC_ASSETS]))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  console.log('[sw.js] Service Worker activating...')
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => self.clients.claim())
      .then(() => {
        // Start keep-alive mechanism
        startKeepAlive()
        return Promise.resolve()
      })
  )
})

// Handle background sync for timers and reminders
self.addEventListener('sync', (event) => {
  if (event.tag === 'pomodoro-timer-sync') {
    event.waitUntil(handlePomodoroSync())
  } else if (event.tag === 'reminder-sync') {
    event.waitUntil(handleReminderSync())
  } else if (event.tag === 'background-timer-sync') {
    event.waitUntil(syncPomodoroTimers())
  }
})

// Handle periodic background sync for updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'background-updates') {
    event.waitUntil(updateBackgroundItems())
  } else if (event.tag === 'pomodoro-sync') {
    event.waitUntil(syncPomodoroTimers())
  }
})

// Handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data)
  if (event.data && event.data.type === "POMODORO_TIMER_START") {
    console.log('[SW] Starting background Pomodoro timer:', event.data.timer)
    startBackgroundTimer(event.data.timer)
  } else if (event.data && event.data.type === 'POMODORO_TIMER_STOP') {
    stopBackgroundTimer(event.data.timerId)
  } else if (event.data && event.data.type === 'POMODORO_TIMER_PAUSE') {
    pauseBackgroundTimer(event.data.timerId)
  } else if (event.data && event.data.type === 'POMODORO_TIMER_RESUME') {
    resumeBackgroundTimer(event.data.timerId)
  } else if (event.data && event.data.type === 'POMODORO_SYNC_REQUEST') {
    sendTimerSync(event.data.timerId)
  } else if (event.data && event.data.type === 'MEDICATION_SYNC_REQUEST') {
    sendMedicationSync()
  } else if (event.data && event.data.type === 'REMOVE_REMINDER') {
    removeBackgroundReminder(event.data.reminderId)
  } else if (event.data && event.data.type === 'COMPLETE_REMINDER') {
    completeBackgroundReminder(event.data.reminderId)
  } else if (event.data && event.data.type === 'SCHEDULE_REMINDER' && event.data.reminder && event.data.reminder.type === 'medication') {
    const reminder = event.data.reminder;
    saveMedicationReminderToDB(reminder);
    scheduleOrFireMedicationReminder(reminder);
  } else if (event.data && event.data.type === 'REMOVE_REMINDER' && event.data.reminderId) {
    removeMedicationReminderFromDB(event.data.reminderId);
  } else if (event.data && event.data.type === 'COMPLETE_REMINDER' && event.data.reminderId) {
    // Mark as completed in DB
    openMedicationDB().then(db => {
      const tx = db.transaction('reminders', 'readwrite');
      const store = tx.objectStore('reminders');
      const req = store.get(event.data.reminderId);
      req.onsuccess = () => {
        const reminder = req.result;
        if (reminder) {
          reminder.completed = true;
          store.put(reminder);
        }
      };
    });
  } else if (event.data && event.data.type === 'SCHEDULE_REMINDER' && event.data.reminder && event.data.reminder.type !== 'medication') {
    const reminder = event.data.reminder;
    saveGeneralReminderToDB(reminder);
    scheduleOrFireGeneralReminder(reminder);
  }
})

// --- IndexedDB Helper for Persistent Timers ---
function openPomodoroDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PomodoroDB', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('timers')) {
        db.createObjectStore('timers', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveTimerToDB(timer) {
  const db = await openPomodoroDB();
  const tx = db.transaction('timers', 'readwrite');
  tx.objectStore('timers').put(timer);
  return tx.complete || tx.done || new Promise((res) => tx.oncomplete = res);
}

async function removeTimerFromDB(timerId) {
  const db = await openPomodoroDB();
  const tx = db.transaction('timers', 'readwrite');
  tx.objectStore('timers').delete(timerId);
  return tx.complete || tx.done || new Promise((res) => tx.oncomplete = res);
}

async function getAllTimersFromDB() {
  const db = await openPomodoroDB();
  const tx = db.transaction('timers', 'readonly');
  const store = tx.objectStore('timers');
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// --- IndexedDB Helper for Persistent Medication Reminders ---
function openMedicationDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MedicationDB', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('reminders')) {
        db.createObjectStore('reminders', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveMedicationReminderToDB(reminder) {
  const db = await openMedicationDB();
  const tx = db.transaction('reminders', 'readwrite');
  tx.objectStore('reminders').put(reminder);
  return tx.complete || tx.done || new Promise((res) => tx.oncomplete = res);
}

async function removeMedicationReminderFromDB(reminderId) {
  const db = await openMedicationDB();
  const tx = db.transaction('reminders', 'readwrite');
  tx.objectStore('reminders').delete(reminderId);
  return tx.complete || tx.done || new Promise((res) => tx.oncomplete = res);
}

async function getAllMedicationRemindersFromDB() {
  const db = await openMedicationDB();
  const tx = db.transaction('reminders', 'readonly');
  const store = tx.objectStore('reminders');
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// --- IndexedDB Helper for Persistent General Reminders ---
function openReminderDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ReminderDB', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('reminders')) {
        db.createObjectStore('reminders', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveGeneralReminderToDB(reminder) {
  const db = await openReminderDB();
  const tx = db.transaction('reminders', 'readwrite');
  tx.objectStore('reminders').put(reminder);
  return tx.complete || tx.done || new Promise((res) => tx.oncomplete = res);
}

async function removeGeneralReminderFromDB(reminderId) {
  const db = await openReminderDB();
  const tx = db.transaction('reminders', 'readwrite');
  tx.objectStore('reminders').delete(reminderId);
  return tx.complete || tx.done || new Promise((res) => tx.oncomplete = res);
}

async function getAllGeneralRemindersFromDB() {
  const db = await openReminderDB();
  const tx = db.transaction('reminders', 'readonly');
  const store = tx.objectStore('reminders');
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Pomodoro Timer Functions
async function startBackgroundTimer(timerData) {
  const timerId = `pomodoro-${Date.now()}`
  const timer = {
    id: timerId,
    mode: timerData.mode,
    duration: timerData.duration,
    timeLeft: timerData.duration,
    startTime: timerData.startTime || Date.now(),
    isActive: true,
    isPaused: false,
    task: timerData.task || '',
    endTime: (timerData.startTime || Date.now()) + (timerData.duration * 1000)
  }

  backgroundTimers.set(timerId, timer)
  await saveTimerToDB(timer)
  // Set up the countdown - this runs independently in service worker
  const countdown = setInterval(async () => {
    const currentTimer = backgroundTimers.get(timerId)
    if (!currentTimer || !currentTimer.isActive || currentTimer.isPaused) {
      clearInterval(countdown)
      return
    }
    currentTimer.timeLeft -= 1
    backgroundTimers.set(timerId, currentTimer)
    await saveTimerToDB(currentTimer)
    // Send regular updates to main app (every second)
    sendTimerTick(currentTimer)
    // Check if timer is complete
    if (currentTimer.timeLeft <= 0) {
      clearInterval(countdown)
      handleTimerComplete(currentTimer)
      backgroundTimers.delete(timerId)
      await removeTimerFromDB(timerId)
    }
  }, 1000)
  // Store the interval reference
  timer.countdownInterval = countdown
  backgroundTimers.set(timerId, timer)
  console.log('[SW] Background Pomodoro timer started (Primary Timer):', timer)
  // Send initial state to main app
  sendTimerTick(timer)
}

function sendTimerTick(timer) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'POMODORO_STATE_UPDATE',
        timer: timer
      })
    })
  })
}

function sendTimerSync(timerId) {
  const timer = backgroundTimers.get(timerId)
  if (timer) {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'POMODORO_SYNC',
          timers: [timer]
        })
      })
    })
  }
}

async function stopBackgroundTimer(timerId) {
  const timer = backgroundTimers.get(timerId)
  if (timer && timer.countdownInterval) {
    clearInterval(timer.countdownInterval)
  }
  backgroundTimers.delete(timerId)
  await removeTimerFromDB(timerId)
  console.log('[SW] Background Pomodoro timer stopped:', timerId)
}

async function pauseBackgroundTimer(timerId) {
  const timer = backgroundTimers.get(timerId)
  if (timer) {
    timer.isPaused = true
    backgroundTimers.set(timerId, timer)
    await saveTimerToDB(timer)
    console.log('[SW] Background Pomodoro timer paused:', timerId)
    sendTimerTick(timer)
  }
}

async function resumeBackgroundTimer(timerId) {
  const timer = backgroundTimers.get(timerId)
  if (timer) {
    timer.isPaused = false
    backgroundTimers.set(timerId, timer)
    await saveTimerToDB(timer)
    console.log('[SW] Background Pomodoro timer resumed:', timerId)
    sendTimerTick(timer)
  }
}

function handleTimerComplete(timer) {
  const isPomodoro = timer.mode === "pomodoro"
  const duration = timer.duration / 60
  let durationStr = ""
  
  if (duration < 1) {
    durationStr = `${Math.round(duration * 60)} seconds`
  } else if (duration < 2) {
    durationStr = `${duration} minute`
  } else {
    durationStr = `${duration} minutes`
  }

  const notificationTitle = isPomodoro ? "🍅 Pomodoro Complete!" : "☕ Break Time Over!"
  const notificationBody = isPomodoro
    ? `Excellent focus! You completed ${durationStr}${timer.task ? ` working on: ${timer.task}` : ""}.`
    : `Your ${durationStr} break is over. Time to get back to work!`

  const options = {
    body: notificationBody,
    icon: "/android-chrome-192x192.png",
    badge: "/android-chrome-192x192.png",
    tag: `pomodoro-${timer.id}`,
    requireInteraction: true,
    silent: false,
    data: {
      url: "/dashboard/pomodoro",
      type: "pomodoro",
      timerId: timer.id,
      mode: timer.mode
    },
    actions: [
      {
        action: "start-break",
        title: "☕ Start Break"
      },
      {
        action: "start-pomodoro",
        title: "🍅 Start Pomodoro"
      },
      {
        action: "view",
        title: "👁 View"
      }
    ]
  }

  self.registration.showNotification(notificationTitle, options)
  
  // Also send a message to any open clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'POMODORO_COMPLETE',
        timer: timer
      })
    })
  })

  console.log('[SW] Pomodoro timer completed:', timer)
}

// Reminder Functions
function scheduleBackgroundReminder(reminder) {
  const reminderId = reminder.id
  const scheduledTime = new Date(reminder.scheduledTime).getTime()
  const now = Date.now()
  
  if (scheduledTime <= now) {
    // Reminder is already due, show it immediately
    handleReminderComplete(reminder)
    return
  }

  const delay = scheduledTime - now
  const timeoutId = setTimeout(() => {
    handleReminderComplete(reminder)
    backgroundReminders.delete(reminderId)
  }, delay)

  backgroundReminders.set(reminderId, {
    ...reminder,
    timeoutId: timeoutId,
    scheduledTime: scheduledTime
  })

  console.log('[SW] Background reminder scheduled:', reminder, 'for', new Date(scheduledTime))
}

function removeBackgroundReminder(reminderId) {
  const reminder = backgroundReminders.get(reminderId)
  if (reminder && reminder.timeoutId) {
    clearTimeout(reminder.timeoutId)
  }
  backgroundReminders.delete(reminderId)
  console.log('[SW] Background reminder removed:', reminderId)
}

function completeBackgroundReminder(reminderId) {
  const reminder = backgroundReminders.get(reminderId)
  if (reminder) {
    reminder.completed = true
    if (reminder.timeoutId) {
      clearTimeout(reminder.timeoutId)
    }
    backgroundReminders.delete(reminderId)
  }
  console.log('[SW] Background reminder completed:', reminderId)
}

function handleReminderComplete(reminder) {
  const notificationOptions = {
    body: reminder.body,
    icon: "/android-chrome-192x192.png",
    badge: "/android-chrome-192x192.png",
    tag: `reminder-${reminder.id}`,
    requireInteraction: reminder.type === "medication",
    silent: false,
    data: {
      url: getReminderUrl(reminder.type),
      type: reminder.type,
      reminderId: reminder.id
    },
    actions: [
      {
        action: "complete",
        title: "✓ Complete"
      },
      {
        action: "snooze",
        title: "⏰ Snooze 5min"
      },
      {
        action: "view",
        title: "👁 View"
      }
    ]
  }

  self.registration.showNotification(reminder.title, notificationOptions)
  
  // Send message to any open clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'REMINDER_COMPLETE',
        reminder: reminder
      })
    })
  })

  console.log('[SW] Reminder completed:', reminder)
}

function getReminderUrl(type) {
  switch (type) {
    case "medication":
      return "/dashboard/medications"
    case "task":
      return "/dashboard/tasks"
    case "habit":
      return "/dashboard/habits"
    default:
      return "/dashboard"
  }
}

async function handlePomodoroSync() {
  console.log('[SW] Handling Pomodoro sync')
  const clients = await self.clients.matchAll()
  clients.forEach(client => {
    client.postMessage({
      type: 'POMODORO_SYNC',
      timers: Array.from(backgroundTimers.values())
    })
  })
}

async function handleReminderSync() {
  console.log('[SW] Handling reminder sync')
  const clients = await self.clients.matchAll()
  clients.forEach(client => {
    client.postMessage({
      type: 'REMINDER_SYNC',
      reminders: Array.from(backgroundReminders.values())
    })
  })
}

async function updateBackgroundItems() {
  console.log('[SW] Updating background items')
  const clients = await self.clients.matchAll()
  clients.forEach(client => {
    client.postMessage({
      type: 'BACKGROUND_UPDATE',
      timers: Array.from(backgroundTimers.values()),
      reminders: Array.from(backgroundReminders.values())
    })
  })
}

// Keep service worker alive and sync timers periodically
function syncPomodoroTimers() {
  console.log('[SW] Periodic Pomodoro sync - keeping timers alive')
  
  // Send current timer states to any open clients
  const activeTimers = Array.from(backgroundTimers.values())
  if (activeTimers.length > 0) {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'POMODORO_SYNC',
          timers: activeTimers
        })
      })
    })
  }
  
  // Register next periodic sync
  if ('periodicSync' in self.registration) {
    self.registration.periodicSync.register('pomodoro-sync', {
      minInterval: 30 * 1000 // 30 seconds
    }).catch(err => {
      console.log('[SW] Periodic sync registration failed:', err)
    })
  }
}

self.addEventListener("push", (event) => {
  let data = {
    title: "DailyBuddy Reminder",
    body: "You have a new reminder",
    icon: "/android-chrome-192x192.png",
    badge: "/android-chrome-192x192.png",
    tag: "reminder",
    data: {},
  }

  try {
    if (event.data) {
      const pushData = event.data.json()
      data = { ...data, ...pushData }
    }
  } catch (e) {
    console.error("Error parsing push data:", e)
  }

  const options = {
    body: data.body,
    icon: data.icon || "/android-chrome-192x192.png",
    badge: data.badge || "/android-chrome-192x192.png",
    tag: data.tag || "default",
    renotify: true,
    requireInteraction: true,
    silent: false,
    timestamp: Date.now(),
    data: {
      url: data.url || "/dashboard",
      type: data.type || "reminder",
      ...data.data,
    },
    actions: [
      {
        action: "complete",
        title: "✓ Complete",
      },
      {
        action: "snooze",
        title: "⏰ Snooze",
      },
      {
        action: "view",
        title: "👁 View",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const url = data.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Try to focus an open tab
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(url) && 'focus' in client) {
          client.focus();
          // Post message to show popup if possible
          client.postMessage({
            type: 'show-popup',
            detail: {
              type: data.type === 'medication' ? 'medication-due' : 'reminder-due',
              reminderId: data.reminderId,
              // Optionally, add more details if needed
            }
          });
          return;
        }
      }
      // Otherwise, open a new tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
})

self.addEventListener("notificationclose", (event) => {
  console.log("Notification dismissed")
})

function sendMedicationSync() {
  const medicationReminders = Array.from(backgroundReminders.values())
    .filter(reminder => reminder.type === 'medication')
  
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'MEDICATION_SYNC',
        reminders: medicationReminders
      })
    })
  })
}

// Keep service worker alive
function startKeepAlive() {
  console.log('[SW] Starting keep-alive mechanism')
  
  // Send periodic keep-alive messages
  setInterval(() => {
    const activeTimers = Array.from(backgroundTimers.values())
    const activeReminders = Array.from(backgroundReminders.values())
    
    if (activeTimers.length > 0 || activeReminders.length > 0) {
      console.log('[SW] Keep-alive: Active timers:', activeTimers.length, 'Active reminders:', activeReminders.length)
      
      // Send sync to any open clients
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'KEEP_ALIVE',
            timers: activeTimers,
            reminders: activeReminders
          })
        })
      })
    }
  }, 10000) // Every 10 seconds
}

self.addEventListener("activate", (event) => {
  console.log('[sw.js] Service Worker activating...')
  event.waitUntil(
    (async () => {
      // ... existing cache cleanup ...
      // Restore timers from DB
      const timers = await getAllTimersFromDB()
      const now = Date.now()
      for (const timer of timers) {
        // If timer should have completed while app was closed, fire notification
        if (timer.isActive && !timer.isPaused) {
          const elapsed = Math.floor((now - timer.startTime) / 1000)
          const timeLeft = timer.duration - elapsed
          if (timeLeft <= 0) {
            handleTimerComplete(timer)
            await removeTimerFromDB(timer.id)
            backgroundTimers.delete(timer.id)
          } else {
            timer.timeLeft = timeLeft
            backgroundTimers.set(timer.id, timer)
            // Resume countdown
            startBackgroundTimer({ ...timer, startTime: timer.startTime, duration: timeLeft })
          }
        }
      }
      // Restore medication reminders from DB
      const medReminders = await getAllMedicationRemindersFromDB()
      for (const reminder of medReminders) {
        scheduleOrFireMedicationReminder(reminder)
      }
      // Restore general reminders from DB
      const genReminders = await getAllGeneralRemindersFromDB()
      for (const reminder of genReminders) {
        scheduleOrFireGeneralReminder(reminder)
      }
      // ... existing keep-alive ...
    })()
  )
})

// --- Medication Reminder Scheduling ---
async function scheduleOrFireMedicationReminder(reminder) {
  const now = Date.now();
  const scheduledTime = new Date(reminder.scheduledTime).getTime();
  console.log('[SW] scheduleOrFireMedicationReminder:', { scheduledTime, now, diff: scheduledTime - now, reminder });
  if (reminder.completed) return;
  if (scheduledTime > now + 30000) {
    // Only schedule if at least 30 seconds in the future
    const timeout = scheduledTime - now;
    console.log('[SW] Scheduling medication reminder in', timeout, 'ms');
    setTimeout(() => handleMedicationReminder(reminder), timeout);
  } else {
    // Do NOT fire instantly for old/overdue reminders
    console.log('[SW] Skipping old/overdue medication reminder:', reminder);
  }
}

// Add a handler for medication reminders similar to Pomodoro
function handleMedicationReminder(reminder) {
  const dedupeKey = `medication-shown-${reminder.id}-${reminder.scheduledTime}`;
  // Only show if not already shown
  self.caches.open('medication-dedupe').then(async (cache) => {
    const match = await cache.match(dedupeKey);
    if (!match) {
      await cache.put(dedupeKey, new Response('1'));
      const notificationTitle = `💊 Time to take ${reminder.name || reminder.title}`;
      const notificationBody = `Dosage: ${reminder.dosage || ''}${reminder.instructions ? '\n' + reminder.instructions : ''}`;
      const options = {
        body: notificationBody,
        icon: "/android-chrome-192x192.png",
        badge: "/android-chrome-192x192.png",
        tag: dedupeKey,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        silent: false,
        data: {
          url: "/dashboard/medications",
          type: "medication",
          reminderId: reminder.id,
        },
        actions: [
          { action: "taken", title: "Mark as Taken" },
          { action: "snooze", title: "Snooze 5 min" }
        ]
      };
      self.registration.showNotification(notificationTitle, options);
      // Post message to all clients for in-app popup
      self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "show-popup",
            detail: {
              type: "medication-due",
              title: notificationTitle,
              message: notificationBody,
              actions: [
                { label: "Mark as Taken", action: "taken" },
                { label: "Snooze 5 min", action: "snooze", variant: "outline" }
              ]
            }
          });
        });
      });
    }
  });
}

// --- General Reminder Scheduling ---
async function scheduleOrFireGeneralReminder(reminder) {
  const now = Date.now();
  const scheduledTime = new Date(reminder.scheduledTime).getTime();
  console.log('[SW] scheduleOrFireGeneralReminder:', { scheduledTime, now, diff: scheduledTime - now, reminder });
  if (reminder.completed) return;
  if (scheduledTime > now + 30000) {
    // Only schedule if at least 30 seconds in the future
    const timeout = scheduledTime - now;
    console.log('[SW] Scheduling general reminder in', timeout, 'ms');
    setTimeout(() => handleReminderNotification(reminder), timeout);
  } else {
    // Do NOT fire instantly for old/overdue reminders
    console.log('[SW] Skipping old/overdue general reminder:', reminder);
  }
}

// --- General Reminder Notification Handler ---
function handleReminderNotification(reminder) {
  const dedupeKey = `reminder-shown-${reminder.id}-${reminder.scheduledTime}`;
  self.caches.open('reminder-dedupe').then(async (cache) => {
    const match = await cache.match(dedupeKey);
    if (!match) {
      await cache.put(dedupeKey, new Response('1'));
      const notificationTitle = `⏰ ${reminder.title || 'Reminder'}`;
      const notificationBody = reminder.description || 'Time for your reminder!';
      const options = {
        body: notificationBody,
        icon: "/android-chrome-192x192.png",
        badge: "/android-chrome-192x192.png",
        tag: dedupeKey,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        silent: false,
        data: {
          url: "/dashboard/reminders",
          type: "reminder",
          reminderId: reminder.id,
        },
        actions: [
          { action: "done", title: "Mark as Done" },
          { action: "snooze", title: "Snooze 5 min" }
        ]
      };
      self.registration.showNotification(notificationTitle, options);
      // Post message to all clients for in-app popup
      self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "show-popup",
            detail: {
              type: "reminder-due",
              title: notificationTitle,
              message: notificationBody,
              actions: [
                { label: "Mark as Done", action: "done" },
                { label: "Snooze 5 min", action: "snooze", variant: "outline" }
              ]
            }
          });
        });
      });
    }
  });
}

// --- OFFLINE FETCH HANDLER ---
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Serve from cache if available
      if (response) return response;
      // Otherwise, fetch from network and cache dynamically
      return fetch(event.request).then((networkResponse) => {
        // Only cache GET requests and successful responses
        if (event.request.method === 'GET' && networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // Optionally, return a fallback page or asset if offline and not cached
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
