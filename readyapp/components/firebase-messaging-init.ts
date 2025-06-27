import { useEffect } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import firebaseApp from "../lib/firebase";

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

    // Handle foreground messages
    onMessage(messaging, (payload) => {
      if (payload.notification) {
        alert(`${payload.notification.title}: ${payload.notification.body}`);
      }
    });
  }, []);
} 