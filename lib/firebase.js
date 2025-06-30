import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDOUG0w9xqrCFrT8bnEmasbH7z2IJ6o8yg",
  authDomain: "readyapp-ddc9b.firebaseapp.com",
  projectId: "readyapp-ddc9b",
  storageBucket: "readyapp-ddc9b.firebasestorage.app",
  messagingSenderId: "160010494681",
  appId: "1:160010494681:web:e0914ed66523196a0f54c8"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
export default app; 