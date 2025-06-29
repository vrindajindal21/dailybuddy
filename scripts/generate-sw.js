const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const swTemplate = `importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}",
  authDomain: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}",
  projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}",
  storageBucket: "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}",
  appId: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}",
  measurementId: "${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}"
});

const messaging = firebase.messaging();

// Handle background push notifications with custom payload
messaging.onBackgroundMessage(function(payload) {
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || 'Reminder';
  const options = {
    body: notification.body || data.body || '',
    icon: '/android-chrome-192x192.png',
    badge: '/android-chrome-192x192.png',
    data: data,
    actions: [
      { action: 'view', title: 'View' }
    ]
  };
  self.registration.showNotification(title, options);
});

// Handle notification click to open the correct page
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const data = event.notification.data || {};
  let url = '/';
  if (data.type === 'medication') url = '/dashboard/medications';
  else if (data.type === 'pomodoro') url = '/dashboard/pomodoro';
  else if (data.type === 'habit') url = '/dashboard/habits';
  else if (data.type === 'task') url = '/dashboard/tasks';
  else if (data.type === 'reminder') url = '/dashboard/reminders';
  else if (data.url) url = data.url;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});`;

const swPath = path.join(__dirname, '../public/firebase-messaging-sw.js');
fs.writeFileSync(swPath, swTemplate);
console.log('Service worker generated successfully!'); 