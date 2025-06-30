import { NotificationService } from "./notification-service"
import { ReminderManager } from "./reminder-manager"

export interface MedicationSchedule {
  id: string
  medicationId: number
  name: string
  dosage: string
  instructions: string
  time: string
  days: string[]
  notificationsEnabled: boolean
  alarmEnabled: boolean
  alarmSound: string
  alarmVolume: number
  color: string
  startDate: string
  endDate: string | null
  notes: string
}

export interface MedicationReminder {
  id: string
  medicationId: number
  name: string
  dosage: string
  instructions: string
  scheduledTime: Date
  color: string
  notes: string
  completed: boolean
  completedAt?: Date
}

const MEDICATION_SCHEDULES_KEY = "medication_schedules"
const MEDICATION_REMINDERS_KEY = "medication_reminders"

export class MedicationManager {
  private static schedules: Map<string, MedicationSchedule> = new Map()
  private static reminders: Map<string, MedicationReminder> = new Map()
  private static isInitialized = false
  private static syncInterval: NodeJS.Timeout | null = null

  static initialize() {
    if (this.isInitialized) return
    
    this.loadSchedules()
    this.loadReminders()
    this.setupServiceWorkerCommunication()
    this.startSyncWithServiceWorker()
    this.generateReminders()
    
    this.isInitialized = true
    console.log('[MedicationManager] Initialized')
  }

  static setupServiceWorkerCommunication() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'MEDICATION_REMINDER_COMPLETE') {
          this.handleServiceWorkerReminderComplete(event.data.reminder)
        } else if (event.data.type === 'MEDICATION_SYNC') {
          this.syncWithServiceWorker(event.data.reminders)
        }
      })
    }
  }

  static startSyncWithServiceWorker() {
    // Sync with service worker every minute when app is active
    this.syncInterval = setInterval(() => {
      this.requestServiceWorkerSync()
    }, 60000) // Every minute
  }

  static requestServiceWorkerSync() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'MEDICATION_SYNC_REQUEST'
      })
    }
  }

  static sendToServiceWorker(type: string, data: any) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type,
        ...data
      })
    }
  }

  static handleServiceWorkerReminderComplete(reminder: MedicationReminder) {
    console.log('[MedicationManager] Service worker reminder completed:', reminder)
    this.completeReminder(reminder.id)
  }

  static syncWithServiceWorker(serviceWorkerReminders: MedicationReminder[]) {
    // Sync reminder state with service worker
    serviceWorkerReminders.forEach(swReminder => {
      const localReminder = this.reminders.get(swReminder.id)
      if (localReminder && !localReminder.completed && swReminder.completed) {
        this.completeReminder(swReminder.id)
      }
    })
  }

  static loadSchedules() {
    if (typeof window === "undefined") return

    try {
      const savedSchedules = localStorage.getItem(MEDICATION_SCHEDULES_KEY)
      if (savedSchedules) {
        const parsedSchedules = JSON.parse(savedSchedules)
        parsedSchedules.forEach((schedule: MedicationSchedule) => {
          this.schedules.set(schedule.id, schedule)
        })
        console.log(`Loaded ${this.schedules.size} medication schedules`)
      }
    } catch (error) {
      console.error("Error loading medication schedules:", error)
    }
  }

  static saveSchedules() {
    if (typeof window === "undefined") return

    try {
      const schedulesArray = Array.from(this.schedules.values())
      localStorage.setItem(MEDICATION_SCHEDULES_KEY, JSON.stringify(schedulesArray))
    } catch (error) {
      console.error("Error saving medication schedules:", error)
    }
  }

  static loadReminders() {
    if (typeof window === "undefined") return

    try {
      const savedReminders = localStorage.getItem(MEDICATION_REMINDERS_KEY)
      if (savedReminders) {
        const parsedReminders = JSON.parse(savedReminders)
        parsedReminders.forEach((reminder: any) => {
          reminder.scheduledTime = new Date(reminder.scheduledTime)
          if (reminder.completedAt) {
            reminder.completedAt = new Date(reminder.completedAt)
          }
          this.reminders.set(reminder.id, reminder)
        })
        console.log(`Loaded ${this.reminders.size} medication reminders`)
      }
    } catch (error) {
      console.error("Error loading medication reminders:", error)
    }
  }

  static saveReminders() {
    if (typeof window === "undefined") return

    try {
      const remindersArray = Array.from(this.reminders.values())
      localStorage.setItem(MEDICATION_REMINDERS_KEY, JSON.stringify(remindersArray))
    } catch (error) {
      console.error("Error saving medication reminders:", error)
    }
  }

  static addMedication(medication: any): number {
    const medicationId = Date.now()
    
    // Create schedules for each time slot
    medication.schedule.forEach((schedule: any) => {
      const scheduleId = `${medicationId}-${schedule.time}-${schedule.days.join(',')}`
      const medicationSchedule: MedicationSchedule = {
        id: scheduleId,
        medicationId,
        name: medication.name,
        dosage: medication.dosage,
        instructions: medication.instructions,
        time: schedule.time,
        days: schedule.days,
        notificationsEnabled: medication.notificationsEnabled,
        alarmEnabled: medication.alarmEnabled,
        alarmSound: medication.alarmSound,
        alarmVolume: medication.alarmVolume,
        color: medication.color,
        startDate: medication.startDate,
        endDate: medication.endDate,
        notes: medication.notes
      }
      
      this.schedules.set(scheduleId, medicationSchedule)
    })
    
    this.saveSchedules()
    this.generateReminders()
    
    return medicationId
  }

  static updateMedication(medicationId: number, medication: any): boolean {
    // Remove old schedules for this medication
    const oldSchedules = Array.from(this.schedules.values()).filter(s => s.medicationId === medicationId)
    oldSchedules.forEach(schedule => {
      this.schedules.delete(schedule.id)
    })
    
    // Remove old reminders for this medication
    const oldReminders = Array.from(this.reminders.values()).filter(r => r.medicationId === medicationId)
    oldReminders.forEach(reminder => {
      this.reminders.delete(reminder.id)
      this.sendToServiceWorker('REMOVE_REMINDER', { reminderId: reminder.id })
    })
    
    // Add new schedules
    medication.schedule.forEach((schedule: any) => {
      const scheduleId = `${medicationId}-${schedule.time}-${schedule.days.join(',')}`
      const medicationSchedule: MedicationSchedule = {
        id: scheduleId,
        medicationId,
        name: medication.name,
        dosage: medication.dosage,
        instructions: medication.instructions,
        time: schedule.time,
        days: schedule.days,
        notificationsEnabled: medication.notificationsEnabled,
        alarmEnabled: medication.alarmEnabled,
        alarmSound: medication.alarmSound,
        alarmVolume: medication.alarmVolume,
        color: medication.color,
        startDate: medication.startDate,
        endDate: medication.endDate,
        notes: medication.notes
      }
      
      this.schedules.set(scheduleId, medicationSchedule)
    })
    
    this.saveSchedules()
    this.generateReminders()
    
    return true
  }

  static deleteMedication(medicationId: number): boolean {
    // Remove schedules for this medication
    const schedules = Array.from(this.schedules.values()).filter(s => s.medicationId === medicationId)
    schedules.forEach(schedule => {
      this.schedules.delete(schedule.id)
    })
    
    // Remove reminders for this medication
    const reminders = Array.from(this.reminders.values()).filter(r => r.medicationId === medicationId)
    reminders.forEach(reminder => {
      this.reminders.delete(reminder.id)
      this.sendToServiceWorker('REMOVE_REMINDER', { reminderId: reminder.id })
    })
    
    this.saveSchedules()
    this.saveReminders()
    
    return true
  }

  static generateReminders() {
    const now = new Date()
    const today = this.getDayOfWeek(now)
    
    // Clear existing reminders
    this.reminders.clear()
    
    // Generate reminders for the next 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDate = new Date(now)
      targetDate.setDate(now.getDate() + dayOffset)
      const targetDay = this.getDayOfWeek(targetDate)
      
      this.schedules.forEach(schedule => {
        // Check if medication is active on this date
        const startDate = schedule.startDate ? new Date(schedule.startDate) : null
        const endDate = schedule.endDate ? new Date(schedule.endDate) : null
        
        if (startDate && startDate > targetDate) return
        if (endDate && endDate < targetDate) return
        
        // Check if this schedule applies to this day
        if (schedule.days.includes(targetDay)) {
          const [hours, minutes] = schedule.time.split(':').map(Number)
          const scheduledTime = new Date(targetDate)
          scheduledTime.setHours(hours, minutes, 0, 0)
          
          // Only create reminders for future times
          if (scheduledTime > now) {
            const reminderId = `${schedule.id}-${targetDate.toISOString().split('T')[0]}`
            const reminder: MedicationReminder = {
              id: reminderId,
              medicationId: schedule.medicationId,
              name: schedule.name,
              dosage: schedule.dosage,
              instructions: schedule.instructions,
              scheduledTime,
              color: schedule.color,
              notes: schedule.notes,
              completed: false
            }
            
            this.reminders.set(reminderId, reminder)
            
            // Send to service worker for background scheduling
            if (schedule.notificationsEnabled) {
              const reminderObj = {
                ...reminder,
                type: 'medication' as const,
                title: `💊 ${schedule.name}`,
                description: `Time to take ${schedule.dosage}`,
                soundEnabled: schedule.alarmEnabled,
                soundType: schedule.alarmSound,
                soundVolume: schedule.alarmVolume
              }
              this.sendToServiceWorker('SCHEDULE_REMINDER', { reminder: reminderObj })
              // Also add to ReminderManager for in-app notifications
              ReminderManager.addReminder(reminderObj)
              // Dispatch in-app popup (show-popup) for medication
              if (typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent('show-popup', {
                    detail: {
                      type: 'medication-reminder',
                      title: `💊 Medication Time: ${schedule.name}`,
                      message: `Time to take your ${schedule.name} (${schedule.dosage}). ${schedule.instructions || ''}`,
                      duration: 0, // Don't auto-dismiss medication reminders
                      priority: 'high',
                      actions: [
                        {
                          label: 'Taken',
                          action: () => {
                            // Mark as taken (could call MedicationManager.completeReminder if needed)
                            window.dispatchEvent(new CustomEvent('medication-taken', { detail: { id: reminderObj.id } }))
                          }
                        },
                        {
                          label: 'Snooze 15min',
                          action: () => {
                            window.dispatchEvent(new CustomEvent('medication-snooze', { detail: { id: reminderObj.id, snooze: 15 } }))
                          }
                        }
                      ]
                    }
                  })
                )
              }
            }
          }
        }
      })
    }
    
    this.saveReminders()
    console.log(`Generated ${this.reminders.size} medication reminders`)
  }

  static completeReminder(reminderId: string): boolean {
    const reminder = this.reminders.get(reminderId)
    if (!reminder) return false
    
    reminder.completed = true
    reminder.completedAt = new Date()
    
    this.saveReminders()
    
    // Notify service worker
    this.sendToServiceWorker('COMPLETE_REMINDER', { reminderId })
    
    return true
  }

  static getTodaysReminders(): MedicationReminder[] {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    return Array.from(this.reminders.values())
      .filter(reminder => {
        const reminderDate = reminder.scheduledTime.toISOString().split('T')[0]
        return reminderDate === today && !reminder.completed
      })
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())
  }

  static getUpcomingReminders(): MedicationReminder[] {
    const now = new Date()
    
    return Array.from(this.reminders.values())
      .filter(reminder => reminder.scheduledTime > now && !reminder.completed)
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())
  }

  static getAllSchedules(): MedicationSchedule[] {
    return Array.from(this.schedules.values())
  }

  static getSchedulesByMedicationId(medicationId: number): MedicationSchedule[] {
    return Array.from(this.schedules.values()).filter(s => s.medicationId === medicationId)
  }

  private static getDayOfWeek(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[date.getDay()]
  }
} 