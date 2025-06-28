import { useEffect } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import firebaseApp from "../lib/firebase";
import { saveFcmTokenToBackend } from "../lib/save-fcm-token";

const VAPID_KEY = "BDj5ugh74kaut_pCPDrg04SGaC3Z7HRUcrB6oaxgCTGOATLzaOcFhklUEniJu79_bIOJIT-jMImAvIZUQe047AY";

export default function useFirebaseMessaging() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!('Notification' in window)) {
      console.log('Notifications not supported in this browser');
      return;
    }

    console.log('Initializing Firebase messaging...');

    const messaging = getMessaging(firebaseApp);

    if ('serviceWorker' in navigator) {
      console.log('Service Worker supported, registering...');
      
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
          
          // Check current permission state
          const currentPermission = Notification.permission;
          console.log('Current notification permission:', currentPermission);
          
          if (currentPermission === "granted") {
            console.log('Permission already granted, getting token...');
            getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration })
              .then((currentToken) => {
                if (currentToken) {
                  // Generate or retrieve a unique userId
                  let userId = localStorage.getItem('userId');
                  if (!userId) {
                    userId = 'user-' + Math.random().toString(36).substr(2, 16);
                    localStorage.setItem('userId', userId);
                  }
                  // Send token and userId to backend
                  saveFcmTokenToBackend(currentToken, userId);
                  console.log('FCM Token generated successfully:', currentToken.substring(0, 20) + '...');
                  console.log('UserId:', userId);
                } else {
                  console.log('No registration token available. Request permission to generate one.');
                }
              })
              .catch((err) => {
                console.error('An error occurred while retrieving token. ', err);
              });
          } else if (currentPermission === "default") {
            console.log('Permission not requested yet. Will be handled by NotificationPermissionDialog.');
          } else {
            console.log('Permission denied by user.');
          }
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err);
        });
    } else {
      console.log('Service Worker not supported');
    }

    // Handle foreground messages
    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      if (payload.notification) {
        // Show a more user-friendly notification instead of alert
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(payload.notification.title || 'DailyBuddy', {
            body: payload.notification.body,
            icon: '/android-chrome-192x192.png',
            badge: '/android-chrome-192x192.png'
          });
        }
      }
    });
  }, []);
} 