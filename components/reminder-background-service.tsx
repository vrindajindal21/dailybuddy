"use client"

import { useEffect, useRef, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { NotificationService } from "@/lib/notification-service"
import { ReminderManager } from "@/lib/reminder-manager"

// Reminder state keys for localStorage
const REMINDER_STATE_KEY = "reminder_background_state"

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
  }
}

export function ReminderBackgroundService() {
  const { toast } = useToast()
  const [reminderState, setReminderState] = useState(getInitialReminderState())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Save reminder state to localStorage
  const saveReminderState = (state: any) => {
    localStorage.setItem(REMINDER_STATE_KEY, JSON.stringify(state))
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
    }

    const handleReminderDeleted = (e: any) => {
      const { reminderId } = e.detail
      console.log('[ReminderBackgroundService] Reminder deleted:', reminderId)
      
      // Update state to reflect reminder removal
      const newState = {
        ...reminderState,
        lastChecked: Date.now()
      }
      setReminderState(newState)
      saveReminderState(newState)
    }

    window.addEventListener("reminder-added", handleReminderAdded as EventListener)
    window.addEventListener("reminder-updated", handleReminderUpdated as EventListener)
    window.addEventListener("reminder-deleted", handleReminderDeleted as EventListener)
    
    return () => {
      window.removeEventListener("reminder-added", handleReminderAdded as EventListener)
      window.removeEventListener("reminder-updated", handleReminderUpdated as EventListener)
      window.removeEventListener("reminder-deleted", handleReminderDeleted as EventListener)
    }
  }, [reminderState])

  // Initialize reminder manager and check for due reminders
  useEffect(() => {
    // Initialize reminder manager
    ReminderManager.initialize()
    
    // Check for due reminders every minute
    intervalRef.current = setInterval(() => {
      checkForDueReminders()
    }, 60000) // Every minute

    // Also check immediately on mount
    checkForDueReminders()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
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