"use client"

import { useState, useEffect } from "react"
import { X, Bell } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface InAppNotificationProps {
  autoClose?: boolean
  autoCloseTime?: number
}

export function InAppNotification({ autoClose = true, autoCloseTime = 5000 }: InAppNotificationProps) {
  const [notifications, setNotifications] = useState<
    Array<{
      id: string
      title: string
      body?: string
      timestamp: number
      actions?: { label: string; action: () => void }[]
    }>
  >([])

  useEffect(() => {
    // Listen for in-app notifications
    const handleInAppNotification = (event: CustomEvent) => {
      console.log('Received inAppNotification event', event.detail);
      const { title, options } = event.detail

      // Deduplication: Only show once per event
      const dedupeKey = `inapp-notification-${title}-${options.body}-${Date.now()}`
      if (localStorage.getItem(dedupeKey)) return
      localStorage.setItem(dedupeKey, "1")

      const newNotification = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        body: options.body,
        timestamp: Date.now(),
        actions: options.actions || [],
      }

      setNotifications((prev) => [...prev, newNotification])

      // Auto close notification after specified time
      if (autoClose) {
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id))
        }, autoCloseTime)
      }
    }

    // Listen for browser notifications when permission is granted
    const handleNotificationClick = (event: CustomEvent) => {
      const { notification } = event.detail

      // You can handle notification clicks here
      console.log("Notification clicked:", notification)
    }

    window.addEventListener("inAppNotification", handleInAppNotification as EventListener)
    window.addEventListener("notificationclick", handleNotificationClick as EventListener)

    return () => {
      window.removeEventListener("inAppNotification", handleInAppNotification as EventListener)
      window.removeEventListener("notificationclick", handleNotificationClick as EventListener)
    }
  }, [autoClose, autoCloseTime])

  const closeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {notifications.map((notification) => {
        // Defensive: ensure actions is always an array of valid objects
        const actions = Array.isArray(notification.actions)
          ? notification.actions.filter(
              (a) => a && typeof a.label === 'string' && typeof a.action === 'function'
            )
          : []
        return (
          <Card key={notification.id} className="w-full shadow-lg border-primary/20 animate-in slide-in-from-right">
            <CardHeader className="pb-2 pt-4 flex flex-row items-start justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                {notification.title}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => closeNotification(notification.id)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            {notification.body && (
              <CardContent className="pb-3 pt-0">
                <p className="text-sm text-muted-foreground">{notification.body}</p>
                {actions.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {actions.map((action, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        onClick={() => {
                          action.action()
                          closeNotification(notification.id)
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
            <CardFooter className="pt-0 pb-3">
              <p className="text-xs text-muted-foreground">{new Date(notification.timestamp).toLocaleTimeString()}</p>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
