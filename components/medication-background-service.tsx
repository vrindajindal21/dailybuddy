"use client"

import { useEffect, useRef, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { NotificationService } from "@/lib/notification-service"
import { MedicationManager } from "@/lib/medication-manager"

// Medication state keys for localStorage
const MEDICATION_STATE_KEY = "medication_background_state"

function getInitialMedicationState() {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(MEDICATION_STATE_KEY)
    if (saved) return JSON.parse(saved)
  }
  return {
    isActive: false,
    currentMedication: null,
    nextReminder: null,
    lastChecked: null,
  }
}

export function MedicationBackgroundService() {
  const { toast } = useToast()
  const [medicationState, setMedicationState] = useState(getInitialMedicationState())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Save medication state to localStorage
  const saveMedicationState = (state: any) => {
    localStorage.setItem(MEDICATION_STATE_KEY, JSON.stringify(state))
  }

  // Listen for medication events from any page
  useEffect(() => {
    const handleMedicationAdded = (e: any) => {
      const { medication } = e.detail
      console.log('[MedicationBackgroundService] Medication added:', medication)
      
      // Update state to reflect new medication
      const newState = {
        ...medicationState,
        isActive: true,
        lastChecked: Date.now()
      }
      setMedicationState(newState)
      saveMedicationState(newState)
    }

    const handleMedicationUpdated = (e: any) => {
      const { medication } = e.detail
      console.log('[MedicationBackgroundService] Medication updated:', medication)
      
      // Update state to reflect medication changes
      const newState = {
        ...medicationState,
        lastChecked: Date.now()
      }
      setMedicationState(newState)
      saveMedicationState(newState)
    }

    const handleMedicationDeleted = (e: any) => {
      const { medicationId } = e.detail
      console.log('[MedicationBackgroundService] Medication deleted:', medicationId)
      
      // Update state to reflect medication removal
      const newState = {
        ...medicationState,
        lastChecked: Date.now()
      }
      setMedicationState(newState)
      saveMedicationState(newState)
    }

    window.addEventListener("medication-added", handleMedicationAdded as EventListener)
    window.addEventListener("medication-updated", handleMedicationUpdated as EventListener)
    window.addEventListener("medication-deleted", handleMedicationDeleted as EventListener)
    
    return () => {
      window.removeEventListener("medication-added", handleMedicationAdded as EventListener)
      window.removeEventListener("medication-updated", handleMedicationUpdated as EventListener)
      window.removeEventListener("medication-deleted", handleMedicationDeleted as EventListener)
    }
  }, [medicationState])

  // Initialize medication manager and check for due medications
  useEffect(() => {
    // Initialize medication manager
    MedicationManager.initialize()
    
    // Check for due medications every minute
    intervalRef.current = setInterval(() => {
      checkForDueMedications()
    }, 60000) // Every minute

    // Also check immediately on mount
    checkForDueMedications()

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

  const checkForDueMedications = () => {
    const now = new Date()
    const todaysReminders = MedicationManager.getTodaysReminders()
    
    todaysReminders.forEach(reminder => {
      // Check if medication is due (within 1 minute of scheduled time)
      const timeDiff = Math.abs(reminder.scheduledTime.getTime() - now.getTime())
      const isDue = timeDiff <= 60000 && !reminder.completed // Within 1 minute and not completed
      
      if (isDue) {
        showMedicationNotification(reminder)
        playMedicationSound(reminder)
      }
    })

    // Update state
    const newState = {
      ...medicationState,
      lastChecked: now.getTime()
    }
    setMedicationState(newState)
    saveMedicationState(newState)
  }

  const showMedicationNotification = (reminder: any) => {
    const title = `💊 ${reminder.name}`
    const body = `Time to take ${reminder.dosage}${reminder.instructions ? ` - ${reminder.instructions}` : ''}`
    
    // Show browser notification
    NotificationService.showNotification(title, {
      body,
      requireInteraction: true,
      tag: `medication-${reminder.id}`,
    }, "medication", 80)

    // Show in-app notification
    window.dispatchEvent(
      new CustomEvent("inAppNotification", {
        detail: {
          title,
          options: {
            body,
            actions: [
              {
                label: "Mark as Taken",
                action: () => {
                  MedicationManager.completeReminder(reminder.id)
                  toast({
                    title: "Medication Taken",
                    description: `${reminder.name} marked as taken`,
                  })
                }
              },
              {
                label: "Snooze 5 min",
                action: () => {
                  // Snooze logic could be implemented here
                  toast({
                    title: "Medication Snoozed",
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
          type: "medication-due",
          title,
          message: body,
          duration: 10000,
          priority: "high",
          actions: [
            {
              label: "Mark as Taken",
              action: () => {
                MedicationManager.completeReminder(reminder.id)
                toast({
                  title: "Medication Taken",
                  description: `${reminder.name} marked as taken`,
                })
              },
            },
            {
              label: "Snooze 5 min",
              action: () => {
                toast({
                  title: "Medication Snoozed",
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

  const playMedicationSound = (reminder: any) => {
    try {
      if (!audioContextRef.current) return
      
      const audioContext = audioContextRef.current
      if (audioContext.state === "suspended") {
        audioContext.resume()
      }

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      // Medication-specific sound (different from pomodoro)
      oscillator.type = "sine"
      oscillator.frequency.value = 660 // Lower frequency for medication

      const normalizedVolume = 0.7
      gainNode.gain.value = normalizedVolume

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      const now = audioContext.currentTime
      gainNode.gain.setValueAtTime(normalizedVolume, now)
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5)

      oscillator.start(now)
      oscillator.stop(now + 1.5)

      // Play a second tone for medication
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator()
        const gainNode2 = audioContext.createGain()

        oscillator2.type = "sine"
        oscillator2.frequency.value = 880

        gainNode2.gain.value = normalizedVolume * 0.6

        oscillator2.connect(gainNode2)
        gainNode2.connect(audioContext.destination)

        const now2 = audioContext.currentTime
        gainNode2.gain.setValueAtTime(normalizedVolume * 0.6, now2)
        gainNode2.gain.exponentialRampToValueAtTime(0.001, now2 + 1.0)

        oscillator2.start(now2)
        oscillator2.stop(now2 + 1.0)
      }, 200)
    } catch (error) {
      console.error("Error playing medication sound:", error)
    }
  }

  // This component doesn't render anything visible
  return null
} 