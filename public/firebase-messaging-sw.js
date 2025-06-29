importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCp8ks5da7X551bduwVEUAfd9acLEImGaE",
  authDomain: "dailybuddy-5e891.firebaseapp.com",
  projectId: "dailybuddy-5e891",
  storageBucket: "dailybuddy-5e891.appspot.com",
  messagingSenderId: "723308895182",
  appId: "1:723308895182:web:9a7629f13f1def37f0e99f",
  measurementId: "G-N9LL2E2X3T"
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
}); 