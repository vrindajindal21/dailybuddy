import { useEffect } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import firebaseApp from "../lib/firebase";
import { saveFcmTokenToBackend } from "../lib/save-fcm-token";

const VAPID_KEY = "BDj5ugh74kaut_pCPDrg04SGaC3Z7HRUcrB6oaxgCTGOATLzaOcFhklUEniJu79_bIOJIT-jMImAvIZUQe047AY";

export default function useFirebaseMessaging() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!('Notification' in window)) return;

    const messaging = getMessaging(firebaseApp);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          Notification.requestPermission().then(permission => {
            if (permission === "granted") {
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
                    console.log('FCM Token:', currentToken, 'UserId:', userId);
                  }
                })
                .catch((err) => {
                  console.error('An error occurred while retrieving token. ', err);
                });
            }
          });
        });
    }

    // Handle foreground messages
    onMessage(messaging, (payload) => {
      if (payload.notification) {
        alert(`${payload.notification.title}: ${payload.notification.body}`);
      }
    });
  }, []);
} 