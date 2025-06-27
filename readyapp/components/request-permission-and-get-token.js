import { getToken } from "firebase/messaging";
import { messaging, VAPID_KEY } from "../lib/firebase";

export function requestPermissionAndGetToken() {
  console.log('Requesting permission...');
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      getToken(messaging, { vapidKey: VAPID_KEY })
        .then((currentToken) => {
          if (currentToken) {
            console.log('FCM Token:', currentToken);
            // TODO: Send this token to your server if you want to send notifications later
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        })
        .catch((err) => {
          console.log('An error occurred while retrieving token. ', err);
        });
    } else {
      console.log('Notification permission not granted.');
    }
  });
} 