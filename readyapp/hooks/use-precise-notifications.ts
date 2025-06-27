"use client"

import { useCallback, useEffect, useRef } from "react"
import { NotificationService } from "@/lib/notification-service"
import { type PreciseTimer, schedulePreciseNotification } from "@/lib/timer-utils"
import { useToast } from "@/components/ui/use-toast"

export function usePreciseNotifications() {
  const activeTimers = useRef<Map<string, PreciseTimer>>(new Map())
  const { toast } = useToast()

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      activeTimers.current.forEach((timer) => timer.clear())
      activeTimers.current.clear()
    }
  }, [])

  // Schedule a notification at a precise time
  const scheduleNotification = useCallback(
    (id: string, title: string, scheduledTime: Date, options: any = {}, soundType = "default", volume = 70) => {
      // Cancel any existing timer with the same ID
      if (activeTimers.current.has(id)) {
        activeTimers.current.get(id)?.clear()
        activeTimers.current.delete(id)
      }

      // Create notification function
      const showNotification = () => {
        const notification = NotificationService.showNotification(title, options, soundType as any, volume)

        // If notification permission is denied, show in-app notification
        if (!notification) {
          NotificationService.showInAppNotification(title, options, soundType as any, volume)

          toast({
            title,
            description: options.body || "",
          })
        }

        // Remove from active timers
        activeTimers.current.delete(id)
      }

      // Schedule the notification
      const timer = schedulePreciseNotification(title, options, scheduledTime, showNotification)

      if (timer) {
        activeTimers.current.set(id, timer)
        return true
      }

      return false
    },
    [toast],
  )

  // Cancel a scheduled notification
  const cancelNotification = useCallback((id: string) => {
    if (activeTimers.current.has(id)) {
      activeTimers.current.get(id)?.clear()
      activeTimers.current.delete(id)
      return true
    }
    return false
  }, [])

  // Get all active notification timers
  const getActiveNotifications = useCallback(() => {
    return Array.from(activeTimers.current.keys())
  }, [])

  return {
    scheduleNotification,
    cancelNotification,
    getActiveNotifications,
  }
}
