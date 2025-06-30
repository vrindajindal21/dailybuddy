"use client"

import { useEffect, useRef, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { NotificationService } from "@/lib/notification-service"
import { MedicationManager } from "@/lib/medication-manager"

// Medication state keys for localStorage
const MEDICATION_STATE_KEY = "medication_background_state"
const MEDICATION_SYNC_KEY = "medication_sync_state"

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
    lastSync: null,
  }
}

export function MedicationBackgroundService() {
  const { toast } = useToast()
  const [medicationState, setMedicationState] = useState(getInitialMedicationState())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Save medication state to localStorage
  const saveMedicationState = (state: any) => {
    localStorage.setItem(MEDICATION_STATE_KEY, JSON.stringify(state))
  }

  // Sync medications with service worker
  const syncMedicationsWithServiceWorker = () => {
    if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
      const todaysReminders = MedicationManager.getTodaysReminders()
      const activeReminders = todaysReminders.filter(r => !r.completed)
      
      // Send medications to service worker for background scheduling
      activeReminders.forEach(reminder => {
        navigator.serviceWorker.controller?.postMessage({
          type: 'SCHEDULE_REMINDER',
          reminder: {
            id: reminder.id,
            title: `💊 ${reminder.name}`,
            body: `Time to take ${reminder.dosage}${reminder.instructions ? ` - ${reminder.instructions}` : ''}`,
            scheduledTime: reminder.scheduledTime.toISOString(),
            type: 'medication',
            completed: reminder.completed
          }
        })
      })

      // Update sync state
      const newState = {
        ...medicationState,
        lastSync: Date.now()
      }
      setMedicationState(newState)
      saveMedicationState(newState)
      
      console.log('[MedicationBackgroundService] Synced', activeReminders.length, 'medications with service worker')
    }
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
      
      // Sync with service worker immediately
      setTimeout(() => syncMedicationsWithServiceWorker(), 100)
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
      
      // Sync with service worker immediately
      setTimeout(() => syncMedicationsWithServiceWorker(), 100)
    }

    const handleMedicationDeleted = (e: any) => {
      const { medicationId } = e.detail
      console.log('[MedicationBackgroundService] Medication deleted:', medicationId)
      
      // Remove from service worker
      if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
        navigator.serviceWorker.controller?.postMessage({
          type: 'REMOVE_REMINDER',
          reminderId: medicationId
        })
      }
      
      // Update state to reflect medication removal
      const newState = {
        ...medicationState,
        lastChecked: Date.now()
      }
      setMedicationState(newState)
      saveMedicationState(newState)
    }

    const handleMedicationCompleted = (e: any) => {
      const { reminderId } = e.detail
      console.log('[MedicationBackgroundService] Medication completed:', reminderId)
      
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
      if (event.data.type === 'REMINDER_COMPLETE' && event.data.reminder.type === 'medication') {
        const reminder = event.data.reminder
        showMedicationNotification(reminder)
        playMedicationSound(reminder)
      }
    }

    window.addEventListener("medication-added", handleMedicationAdded as EventListener)
    window.addEventListener("medication-updated", handleMedicationUpdated as EventListener)
    window.addEventListener("medication-deleted", handleMedicationDeleted as EventListener)
    window.addEventListener("medication-completed", handleMedicationCompleted as EventListener)
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage)
    
    return () => {
      window.removeEventListener("medication-added", handleMedicationAdded as EventListener)
      window.removeEventListener("medication-updated", handleMedicationUpdated as EventListener)
      window.removeEventListener("medication-deleted", handleMedicationDeleted as EventListener)
      window.removeEventListener("medication-completed", handleMedicationCompleted as EventListener)
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage)
    }
  }, [medicationState])

  // Initialize medication manager and check for due medications
  useEffect(() => {
    // Initialize medication manager
    MedicationManager.initialize()
    
    // Check for due medications every 30 seconds (more frequent than before)
    intervalRef.current = setInterval(() => {
      checkForDueMedications()
    }, 30000) // Every 30 seconds

    // Sync with service worker every 2 minutes
    syncIntervalRef.current = setInterval(() => {
      syncMedicationsWithServiceWorker()
    }, 120000) // Every 2 minutes

    // Also check immediately on mount
    checkForDueMedications()
    
    // Initial sync with service worker
    setTimeout(() => syncMedicationsWithServiceWorker(), 1000)

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
    // Deduplication: Only show once per medication
    const dedupeKey = `medication-shown-${reminder.id}`
    if (localStorage.getItem(dedupeKey)) return
    localStorage.setItem(dedupeKey, "1")
    
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