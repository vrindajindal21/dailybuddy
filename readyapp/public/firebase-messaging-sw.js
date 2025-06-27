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

  const notificationTitle = payload?.notification?.title || 'Background Message Title';
  const notificationOptions = {
    body: payload?.notification?.body || 'Background Message body.',
    icon: payload?.notification?.icon || '/android-chrome-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
}); 