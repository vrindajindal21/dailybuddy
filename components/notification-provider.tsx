"use client"

// Notification provider component for app-wide notification management
import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useNotifications } from "@/hooks/use-notifications"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, AlertTriangle } from "lucide-react"

interface NotificationContextType {
  isSupported: boolean
  permissionState: NotificationPermission
  requestPermission: () => Promise<boolean>
  showNotification: (
    title: string,
    options?: NotificationOptions,
    soundType?: string,
    volume?: number,
  ) => Notification | null
  playSound: (soundType?: string, volume?: number) => boolean
  scheduleReminder: (title: string, scheduledTime: Date, type?: string, options?: any) => string | number
  getUpcomingReminders: (minutes?: number) => any[]
  cancelReminder: (id: string | number) => boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

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
    }
  }

  return (
    <NotificationContext.Provider value={notifications}>
      {showPermissionAlert && (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Notifications are disabled</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Enable notifications to receive important reminders even when the app is in the background.</span>
            <Button variant="outline" size="sm" className="ml-2" onClick={handleRequestPermission}>
              {notifications.permissionState === "denied" ? (
                <BellOff className="mr-2 h-4 w-4" />
              ) : (
                <Bell className="mr-2 h-4 w-4" />
              )}
              Enable Notifications
            </Button>
          </AlertDescription>
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
