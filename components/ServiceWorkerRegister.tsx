"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        // Register periodic background sync for reminders and background updates
        if ("periodicSync" in registration) {
          const periodicSync = (registration as any).periodicSync;
          (async () => {
            try {
              await periodicSync.register("reminder-sync", {
                minInterval: 15 * 60 * 1000, // 15 minutes
              });
              await periodicSync.register("background-updates", {
                minInterval: 15 * 60 * 1000, // 15 minutes
              });
              console.log("[SW] Periodic background sync registered!");
            } catch (e) {
              console.log("[SW] Periodic background sync registration failed:", e);
            }
          })();
        }
      }).catch(console.error);
    }
  }, []);
  return null;
} 