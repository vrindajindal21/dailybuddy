"use client";
import { useEffect } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app, VAPID_KEY } from "../lib/firebase";
import { toast } from "react-hot-toast";

// This hook sets up foreground notification handling (onMessage)
// Background notifications are handled in public/firebase-messaging-sw.js via onBackgroundMessage
export default function useFirebaseMessaging() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!('Notification' in window)) return;

    // Initialize messaging only in the browser
    const messaging = getMessaging(app);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          Notification.requestPermission().then(permission => {
            if (permission === "granted") {
              getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration })
                .then((currentToken) => {
                  if (currentToken) {
                    console.log('FCM Token:', currentToken);
                    // TODO: Send this token to your server
                  }
                })
                .catch((err) => {
                  console.error('An error occurred while retrieving token. ', err);
                });
            }
          });
        });
    }

    // Foreground notification handler
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('[App] Foreground message received:', payload);
      if (payload.notification) {
        toast(`${payload.notification.title}: ${payload.notification.body}`);
      }
    });
    return unsubscribe;
  }, []);
} 