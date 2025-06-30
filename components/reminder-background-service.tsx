"use client"

import { useEffect, useRef, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { NotificationService } from "@/lib/notification-service"
import { ReminderManager } from "@/lib/reminder-manager"

// Reminder state keys for localStorage
const REMINDER_STATE_KEY = "reminder_background_state"
const REMINDER_SYNC_KEY = "reminder_sync_state"

function getInitialReminderState() {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(REMINDER_STATE_KEY)
    if (saved) return JSON.parse(saved)
  }
  return {
    isActive: false,
    currentReminder: null,
    nextReminder: null,
    lastChecked: null,
    lastSync: null,
  }
}

export function ReminderBackgroundService() {
  const { toast } = useToast()
  const [reminderState, setReminderState] = useState(getInitialReminderState())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Save reminder state to localStorage
  const saveReminderState = (state: any) => {
    localStorage.setItem(REMINDER_STATE_KEY, JSON.stringify(state))
  }

  // Sync reminders with service worker
  const syncRemindersWithServiceWorker = () => {
    if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
      const allReminders = ReminderManager.getAllReminders()
      const activeReminders = allReminders.filter(r => !r.completed)
      
      // Send reminders to service worker for background scheduling
      activeReminders.forEach(reminder => {
        navigator.serviceWorker.controller?.postMessage({
          type: 'SCHEDULE_REMINDER',
          reminder: {
            id: reminder.id,
            title: `🔔 ${reminder.title}`,
            body: reminder.description || 'You have a scheduled reminder!',
            scheduledTime: reminder.scheduledTime.toISOString(),
            type: 'reminder',
            completed: reminder.completed
          }
        })
      })

      // Update sync state
      const newState = {
        ...reminderState,
        lastSync: Date.now()
      }
      setReminderState(newState)
      saveReminderState(newState)
      
      console.log('[ReminderBackgroundService] Synced', activeReminders.length, 'reminders with service worker')
    }
  }

  // Listen for reminder events from any page
  useEffect(() => {
    const handleReminderAdded = (e: any) => {
      const { reminder } = e.detail
      console.log('[ReminderBackgroundService] Reminder added:', reminder)
      
      // Update state to reflect new reminder
      const newState = {
        ...reminderState,
        isActive: true,
        lastChecked: Date.now()
      }
      setReminderState(newState)
      saveReminderState(newState)
      
      // Sync with service worker immediately
      setTimeout(() => syncRemindersWithServiceWorker(), 100)
    }

    const handleReminderUpdated = (e: any) => {
      const { reminder } = e.detail
      console.log('[ReminderBackgroundService] Reminder updated:', reminder)
      
      // Update state to reflect reminder changes
      const newState = {
        ...reminderState,
        lastChecked: Date.now()
      }
      setReminderState(newState)
      saveReminderState(newState)
      
      // Sync with service worker immediately
      setTimeout(() => syncRemindersWithServiceWorker(), 100)
    }

    const handleReminderDeleted = (e: any) => {
      const { reminderId } = e.detail
      console.log('[ReminderBackgroundService] Reminder deleted:', reminderId)
      
      // Remove from service worker
      if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
        navigator.serviceWorker.controller?.postMessage({
          type: 'REMOVE_REMINDER',
          reminderId: reminderId
        })
      }
      
      // Update state to reflect reminder removal
      const newState = {
        ...reminderState,
        lastChecked: Date.now()
      }
      setReminderState(newState)
      saveReminderState(newState)
    }

    const handleReminderCompleted = (e: any) => {
      const { reminderId } = e.detail
      console.log('[ReminderBackgroundService] Reminder completed:', reminderId)
      
      // Complete in service worker
      if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
        navigator.serviceWorker.controller?.postMessage({
          type: 'COMPLETE_REMINDER',
          reminderId: reminderId
        })
      }
    }

    // Listen for service worker messages
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data.type === 'REMINDER_COMPLETE') {
        const reminder = event.data.reminder
        showReminderNotification(reminder)
        playReminderSound(reminder)
      }
    }

    window.addEventListener("reminder-added", handleReminderAdded as EventListener)
    window.addEventListener("reminder-updated", handleReminderUpdated as EventListener)
    window.addEventListener("reminder-deleted", handleReminderDeleted as EventListener)
    window.addEventListener("reminder-completed", handleReminderCompleted as EventListener)
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage)
    
    return () => {
      window.removeEventListener("reminder-added", handleReminderAdded as EventListener)
      window.removeEventListener("reminder-updated", handleReminderUpdated as EventListener)
      window.removeEventListener("reminder-deleted", handleReminderDeleted as EventListener)
      window.removeEventListener("reminder-completed", handleReminderCompleted as EventListener)
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage)
    }
  }, [reminderState])

  // Initialize reminder manager and check for due reminders
  useEffect(() => {
    // Initialize reminder manager
    ReminderManager.initialize()
    
    // Check for due reminders every 30 seconds (more frequent than before)
    intervalRef.current = setInterval(() => {
      checkForDueReminders()
    }, 30000) // Every 30 seconds

    // Sync with service worker every 2 minutes
    syncIntervalRef.current = setInterval(() => {
      syncRemindersWithServiceWorker()
    }, 120000) // Every 2 minutes

    // Also check immediately on mount
    checkForDueReminders()
    
    // Initial sync with service worker
    setTimeout(() => syncRemindersWithServiceWorker(), 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
        syncIntervalRef.current = null
      }
    }
  }, [])

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContext) {
          audioContextRef.current = new AudioContext()
        }
      } catch (error) {
        console.warn("AudioContext not supported:", error)
      }
    }
  }, [])

  const checkForDueReminders = () => {
    const now = new Date()
    const allReminders = ReminderManager.getAllReminders()
    
    allReminders.forEach(reminder => {
      // Check if reminder is due (within 1 minute of scheduled time)
      const timeDiff = Math.abs(reminder.scheduledTime.getTime() - now.getTime())
      const isDue = timeDiff <= 60000 && !reminder.completed // Within 1 minute and not completed
      
      if (isDue) {
        showReminderNotification(reminder)
        playReminderSound(reminder)
      }
    })

    // Update state
    const newState = {
      ...reminderState,
      lastChecked: now.getTime()
    }
    setReminderState(newState)
    saveReminderState(newState)
  }

  const showReminderNotification = (reminder: any) => {
    // Deduplication: Only show once per reminder
    const dedupeKey = `reminder-shown-${reminder.id}`
    if (localStorage.getItem(dedupeKey)) return
    localStorage.setItem(dedupeKey, "1")
    
    const title = `🔔 ${reminder.title}`
    const body = reminder.description || 'You have a scheduled reminder!'
    
    // Show browser notification
    NotificationService.showNotification(title, {
      body,
      requireInteraction: true,
      tag: `reminder-${reminder.id}`,
    }, "reminder", 80)

    // Show in-app notification
    window.dispatchEvent(
      new CustomEvent("inAppNotification", {
        detail: {
          title,
          options: {
            body,
            actions: [
              {
                label: "Mark as Done",
                action: () => {
                  ReminderManager.completeReminder(reminder.id)
                  toast({
                    title: "Reminder Completed",
                    description: `${reminder.title} marked as done`,
                  })
                }
              },
              {
                label: "Snooze 5 min",
                action: () => {
                  // Snooze logic could be implemented here
                  toast({
                    title: "Reminder Snoozed",
                    description: "Reminder will show again in 5 minutes",
                  })
                }
              }
            ],
          },
        },
      })
    )

    // Show popup notification
    window.dispatchEvent(
      new CustomEvent("show-popup", {
        detail: {
          type: "reminder-due",
          title,
          message: body,
          duration: 10000,
          priority: "high",
          actions: [
            {
              label: "Mark as Done",
              action: () => {
                ReminderManager.completeReminder(reminder.id)
                toast({
                  title: "Reminder Completed",
                  description: `${reminder.title} marked as done`,
                })
              },
            },
            {
              label: "Snooze 5 min",
              action: () => {
                toast({
                  title: "Reminder Snoozed",
                  description: "Reminder will show again in 5 minutes",
                })
              },
              variant: "outline"
            }
          ],
        },
      })
    )
  }

  const playReminderSound = (reminder: any) => {
    try {
      if (!audioContextRef.current) return
      
      const audioContext = audioContextRef.current
      if (audioContext.state === "suspended") {
        audioContext.resume()
      }

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      // Reminder-specific sound (different from pomodoro and medication)
      oscillator.type = "triangle"
      oscillator.frequency.value = 440 // Standard A note

      const normalizedVolume = 0.6
      gainNode.gain.value = normalizedVolume

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      const now = audioContext.currentTime
      gainNode.gain.setValueAtTime(normalizedVolume, now)
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.0)

      oscillator.start(now)
      oscillator.stop(now + 1.0)

      // Play a sequence for reminder
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator()
        const gainNode2 = audioContext.createGain()

        oscillator2.type = "triangle"
        oscillator2.frequency.value = 554 // C# note

        gainNode2.gain.value = normalizedVolume * 0.5

        oscillator2.connect(gainNode2)
        gainNode2.connect(audioContext.destination)

        const now2 = audioContext.currentTime
        gainNode2.gain.setValueAtTime(normalizedVolume * 0.5, now2)
        gainNode2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.8)

        oscillator2.start(now2)
        oscillator2.stop(now2 + 0.8)
      }, 150)

      setTimeout(() => {
        const oscillator3 = audioContext.createOscillator()
        const gainNode3 = audioContext.createGain()

        oscillator3.type = "triangle"
        oscillator3.frequency.value = 659 // E note

        gainNode3.gain.value = normalizedVolume * 0.4

        oscillator3.connect(gainNode3)
        gainNode3.connect(audioContext.destination)

        const now3 = audioContext.currentTime
        gainNode3.gain.setValueAtTime(normalizedVolume * 0.4, now3)
        gainNode3.gain.exponentialRampToValueAtTime(0.001, now3 + 0.6)

        oscillator3.start(now3)
        oscillator3.stop(now3 + 0.6)
      }, 300)
    } catch (error) {
      console.error("Error playing reminder sound:", error)
    }
  }

  // This component doesn't render anything visible
  return null
} 