importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDOUG0w9xqrCFrT8bnEmasbH7z2IJ6o8yg",
  authDomain: "readyapp-ddc9b.firebaseapp.com",
  projectId: "readyapp-ddc9b",
  storageBucket: "readyapp-ddc9b.firebasestorage.app",
  messagingSenderId: "160010494681",
  appId: "1:160010494681:web:e0914ed66523196a0f54c8"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload?.notification?.title || 'DailyBuddy';
  const notificationOptions = {
    body: payload?.notification?.body || 'You have a new notification.',
    icon: payload?.notification?.icon || '/android-chrome-192x192.png',
    badge: '/android-chrome-192x192.png',
    tag: 'dailybuddy-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ],
    data: payload.data || {}
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  
  event.notification.close();

  if (event.action === 'open') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installing...');
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activating...');
  event.waitUntil(self.clients.claim());
}); 