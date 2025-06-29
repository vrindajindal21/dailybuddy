"use client";
import { useState } from "react";
import { messaging, getToken } from "@/lib/firebase";

const VAPID_KEY = "BDhloLCXMaJBH0Hqcegnyt8nHr3uE5sN7Gvipqk8V84q99ZVkLNvR7BkiM9R-nV8NWn2bram5xrDlRQk4anuRV0";

export function EnableFcmPush() {
  const [status, setStatus] = useState<string>("");
  const [token, setToken] = useState<string>("");

  async function handleEnablePush() {
    setStatus("Requesting permission...");
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setStatus("Getting FCM token...");
        const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY });
        setToken(fcmToken);
        setStatus("Saving token to backend...");
        await fetch("/api/save-fcm-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: fcmToken }),
        });
        setStatus("Push notifications enabled!");
      } else {
        setStatus("Notification permission denied");
      }
    } catch (err: any) {
      setStatus("Error: " + err.message);
    }
  }

  return (
    <div className="flex flex-col gap-2 items-start">
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={handleEnablePush}
      >
        Enable Push Notifications
      </button>
      {status && <div className="text-sm text-gray-700">{status}</div>}
      {token && (
        <div className="break-all text-xs text-green-700">FCM Token: {token}</div>
      )}
    </div>
  );
} 