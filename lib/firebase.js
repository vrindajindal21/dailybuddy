import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCp8ks5da7X551bduwVEUAfd9acLEImGaE",
  authDomain: "dailybuddy-5e891.firebaseapp.com",
  projectId: "dailybuddy-5e891",
  storageBucket: "dailybuddy-5e891.appspot.com",
  messagingSenderId: "723308895182",
  appId: "1:723308895182:web:9a7629f13f1def37f0e99f",
  measurementId: "G-N9LL2E2X3T"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { app, messaging, getToken, onMessage }; 