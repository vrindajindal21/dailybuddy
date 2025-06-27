"use client"

// Custom hook for working with notifications
import { useState, useEffect, useCallback } from "react"
import { NotificationService } from "@/lib/notification-service"
import { ReminderManager, type Reminder, type ReminderType } from "@/lib/reminder-manager"

export function useNotifications() {
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default")
  const [isSupported, setIsSupported] = useState(false)

  // Initialize on mount
  useEffect(() => {
    const supported = NotificationService.isSupported()
    setIsSupported(supported)

    if (supported) {
      setPermissionState(NotificationService.getPermissionState())
    }

    // Listen for permission changes
    const handlePermissionChange = (event: CustomEvent) => {
      setPermissionState(event.detail.permission)
    }

    window.addEventListener("notificationPermissionChanged", handlePermissionChange as EventListener)

    return () => {
      window.removeEventListener("notificationPermissionChanged", handlePermissionChange as EventListener)
    }
  }, [])

  // Request permission
  const requestPermission = useCallback(async () => {
    const granted = await NotificationService.requestPermission()
    setPermissionState(granted ? "granted" : "denied")
    return granted
  }, [])

  // Show notification
  const showNotification = useCallback(
    (title: string, options: NotificationOptions = {}, soundType = "default", volume = 70) => {
      return NotificationService.showNotification(title, options, soundType, volume)
    },
    [],
  )

  // Play sound
  const playSound = useCallback((soundType = "default", volume = 70) => {
    return NotificationService.playSound(soundType, volume)
  }, [])

  // Schedule a reminder
  const scheduleReminder = useCallback(
    (
      title: string,
      scheduledTime: Date,
      type: ReminderType = "general",
      options: {
        description?: string
        recurring?: boolean
        recurringPattern?: string
        soundEnabled?: boolean
        soundType?: string
        soundVolume?: number
        notificationEnabled?: boolean
        vibrationEnabled?: boolean
        data?: any
      } = {},
    ) => {
      const reminder: Reminder = {
        id: Date.now().toString(),
        title,
        description: options.description || "",
        scheduledTime,
        type,
        recurring: options.recurring || false,
        recurringPattern: options.recurringPattern,
        soundEnabled: options.soundEnabled !== undefined ? options.soundEnabled : true,
        soundType: options.soundType || type,
        soundVolume: options.soundVolume || 70,
        notificationEnabled: options.notificationEnabled !== undefined ? options.notificationEnabled : true,
        vibrationEnabled: options.vibrationEnabled !== undefined ? options.vibrationEnabled : true,
        data: options.data,
      }

      return ReminderManager.addReminder(reminder)
    },
    [],
  )

  // Get upcoming reminders
  const getUpcomingReminders = useCallback((minutes = 60) => {
    return ReminderManager.getUpcomingReminders(minutes)
  }, [])

  // Cancel a reminder
  const cancelReminder = useCallback((id: string | number) => {
    return ReminderManager.removeReminder(id)
  }, [])

  return {
    isSupported,
    permissionState,
    requestPermission,
    showNotification,
    playSound,
    scheduleReminder,
    getUpcomingReminders,
    cancelReminder,
  }
}
