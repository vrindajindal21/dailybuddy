// Enhanced Service Worker for rich push notifications and background timing
const CACHE_NAME = "productivity-app-v1"
const urlsToCache = ["/", "/dashboard", "/favicon.ico"]
const POMODORO_TIMER_KEY = "global_pomodoro_timer"

// Background timer and reminder management
let backgroundTimers = new Map()
let backgroundReminders = new Map()

self.addEventListener("install", (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installing...')
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activating...')
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
  if (event.data && event.data.type === 'POMODORO_TIMER_START') {
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
  } else if (event.data && event.data.type === 'SCHEDULE_REMINDER') {
    scheduleBackgroundReminder(event.data.reminder)
  } else if (event.data && event.data.type === 'REMOVE_REMINDER') {
    removeBackgroundReminder(event.data.reminderId)
  } else if (event.data && event.data.type === 'COMPLETE_REMINDER') {
    completeBackgroundReminder(event.data.reminderId)
  }
})

// Pomodoro Timer Functions
function startBackgroundTimer(timerData) {
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
  
  // Set up the countdown - this runs independently in service worker
  const countdown = setInterval(() => {
    const currentTimer = backgroundTimers.get(timerId)
    if (!currentTimer || !currentTimer.isActive || currentTimer.isPaused) {
      clearInterval(countdown)
      return
    }

    currentTimer.timeLeft -= 1
    backgroundTimers.set(timerId, currentTimer)

    // Send regular updates to main app (every second)
    sendTimerTick(currentTimer)

    // Check if timer is complete
    if (currentTimer.timeLeft <= 0) {
      clearInterval(countdown)
      handleTimerComplete(currentTimer)
      backgroundTimers.delete(timerId)
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

function stopBackgroundTimer(timerId) {
  const timer = backgroundTimers.get(timerId)
  if (timer && timer.countdownInterval) {
    clearInterval(timer.countdownInterval)
  }
  backgroundTimers.delete(timerId)
  console.log('[SW] Background Pomodoro timer stopped:', timerId)
}

function pauseBackgroundTimer(timerId) {
  const timer = backgroundTimers.get(timerId)
  if (timer) {
    timer.isPaused = true
    backgroundTimers.set(timerId, timer)
    console.log('[SW] Background Pomodoro timer paused:', timerId)
    sendTimerTick(timer)
  }
}

function resumeBackgroundTimer(timerId) {
  const timer = backgroundTimers.get(timerId)
  if (timer) {
    timer.isPaused = false
    backgroundTimers.set(timerId, timer)
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
  const notification = event.notification
  const action = event.action
  const data = notification.data

  console.log('[SW] Notification clicked:', action, data)

  if (action === "start-break") {
    // Start a break timer
    const breakTimer = {
      mode: "break",
      duration: 300, // 5 minutes
      task: "Take a break"
    }
    startBackgroundTimer(breakTimer)
  } else if (action === "start-pomodoro") {
    // Start a new pomodoro timer
    const pomodoroTimer = {
      mode: "pomodoro",
      duration: 1500, // 25 minutes
      task: ""
    }
    startBackgroundTimer(pomodoroTimer)
  } else if (action === "snooze") {
    // Snooze the reminder for 5 minutes
    if (data.type === "reminder" && data.reminderId) {
      const reminder = backgroundReminders.get(data.reminderId)
      if (reminder) {
        const snoozedReminder = {
          ...reminder,
          scheduledTime: Date.now() + (5 * 60 * 1000) // 5 minutes from now
        }
        scheduleBackgroundReminder(snoozedReminder)
      }
    }
  } else if (action === "complete") {
    // Handle complete action
    if (data.type === "reminder" && data.reminderId) {
      completeBackgroundReminder(data.reminderId)
    }
    console.log("Reminder completed")
  } else {
    // Default action - open app
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        const targetUrl = data.url || "/dashboard"
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(targetUrl)
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      }),
    )
  }

  notification.close()
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
