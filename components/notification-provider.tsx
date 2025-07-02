"use client"

// Notification provider component for app-wide notification management
import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useNotifications } from "@/hooks/use-notifications"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, AlertTriangle } from "lucide-react"

interface NotificationContextType {
  permissionState: NotificationPermission
  showNotification: (
    title: string,
    options?: NotificationOptions,
    soundType?: string,
    volume?: number,
  ) => Promise<boolean>
  playSound: (soundType?: string, volume?: number) => boolean
  requestPermission: () => Promise<boolean>
  isSupported: boolean
  scheduleReminder: (title: string, scheduledTime: Date, type?: any, options?: any) => string | number
  getUpcomingReminders: (minutes?: number) => any[]
  cancelReminder: (id: string | number) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

async function subscribeUserToPush() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY
    });
    await fetch('/api/save-push-subscription', {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const notifications = useNotifications()
  const [showPermissionAlert, setShowPermissionAlert] = useState(false)

  // Check permission on mount
  useEffect(() => {
    if (notifications.isSupported && notifications.permissionState !== "granted") {
      setShowPermissionAlert(true)
    }
  }, [notifications.isSupported, notifications.permissionState])

  // Handle permission request
  const handleRequestPermission = async () => {
    const granted = await notifications.requestPermission()
    if (granted) {
      setShowPermissionAlert(false)
      subscribeUserToPush()
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && Notification.permission === 'granted') {
      subscribeUserToPush();
    }
  }, []);

  return (
    <NotificationContext.Provider value={{
      permissionState: notifications.permissionState,
      showNotification: notifications.showNotification,
      playSound: notifications.playSound,
      requestPermission: notifications.requestPermission,
      isSupported: notifications.isSupported,
      scheduleReminder: notifications.scheduleReminder,
      getUpcomingReminders: notifications.getUpcomingReminders,
      cancelReminder: notifications.cancelReminder,
    }}>
      {showPermissionAlert && (
        <Alert variant="default" className="mb-4">
          <AlertTitle>Notifications are disabled</AlertTitle>
          <span>Enable notifications to receive important reminders even when the app is in the background.</span>
          {notifications.permissionState === "denied" ? (
            <AlertDescription>
              You have denied notification permissions. Please enable them in your browser settings.
            </AlertDescription>
          ) : (
            <Button onClick={handleRequestPermission}>
              Enable Notifications
            </Button>
          )}
        </Alert>
      )}
      {children}
    </NotificationContext.Provider>
  )
}

// Custom hook to use the notification context
export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotificationContext must be used within a NotificationProvider")
  }
  return context
}
