// Enhanced Service Worker for rich push notifications
const CACHE_NAME = "productivity-app-v1"
const urlsToCache = ["/", "/dashboard", "/favicon.ico"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
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
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("push", (event) => {
  let data = {
    title: "DailyBuddy Reminder",
    body: "You have a new reminder",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
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
    icon: data.icon || "/favicon.ico",
    badge: data.badge || "/favicon.ico",
    tag: data.tag || "default",
    renotify: true,
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200, 100, 200],
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

  if (action === "complete") {
    // Handle complete action
    console.log("Reminder completed")
  } else if (action === "snooze") {
    // Handle snooze action
    console.log("Reminder snoozed")
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
