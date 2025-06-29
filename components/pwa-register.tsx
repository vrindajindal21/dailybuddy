'use client'
import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    // Register main PWA service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] Service Worker registered: ", registration);

          // Listen for updates to the service worker
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed") {
                  if (navigator.serviceWorker.controller) {
                    // New update available
                    console.log("[PWA] New content is available; please refresh.");
                  } else {
                    // Content cached for offline use
                    console.log("[PWA] Content is cached for offline use.");
                  }
                }
              };
            }
          };
        })
        .catch((registrationError) => {
          console.log("[PWA] Service Worker registration failed: ", registrationError);
        });
    }
  }, []);
  return null;
} 