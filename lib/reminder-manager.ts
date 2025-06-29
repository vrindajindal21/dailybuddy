// Enhanced reminder manager with better notifications
import { NotificationService } from "./notification-service"

// Unified ReminderType for all supported reminders
export type ReminderType =
  | "pomodoro"
  | "habit"
  | "medication"
  | "task"
  | "goal"
  | "timer"
  | "study"
  | "general"
  | "health"

// Unified Reminder interface
export interface Reminder {
  id: string | number
  title: string
  description?: string
  scheduledTime: Date
  type: ReminderType
  recurring?: boolean
  recurringPattern?: string
  soundEnabled?: boolean
  soundType?: string
  soundVolume?: number
  notificationEnabled?: boolean
  vibrationEnabled?: boolean
  data?: any
  completed?: boolean
  completedAt?: Date
}

/**
 * Unified ReminderManager for all reminder types.
 * Handles scheduling, updating, and removing reminders for both in-app and background (service worker) notifications.
 */
export class ReminderManager {
  private static reminders: Map<string | number, Reminder> = new Map()
  private static scheduledTimers: Map<string | number, NodeJS.Timeout> = new Map()
  private static isInitialized = false
  private static checkInterval: NodeJS.Timeout | null = null

  static initialize() {
    if (this.isInitialized) return

    this.loadReminders()
    this.startBackgroundChecking()
    this.setupServiceWorkerCommunication()

    // Check reminders every 30 seconds for better accuracy
    setInterval(() => this.checkDueReminders(), 30000)

    // Register for periodic background sync if available
    if (
      "serviceWorker" in navigator &&
      "ready" in navigator.serviceWorker &&
      navigator.serviceWorker.ready instanceof Promise
    ) {
      navigator.serviceWorker.ready.then((registration) => {
        if ("periodicSync" in registration) {
          (registration as any).periodicSync
            .register("check-reminders", {
              minInterval: 5 * 60 * 1000, // 5 minutes
            })
            .catch((error: any) => {
              console.error("Error registering periodic sync:", error)
            })
        }
      })
    }

    this.isInitialized = true
    console.log('[ReminderManager] Initialized')
  }

  static setupServiceWorkerCommunication() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'REMINDER_COMPLETE') {
          this.handleServiceWorkerReminderComplete(event.data.reminder)
        }
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

  private static loadReminders() {
    if (typeof window === "undefined") return

    try {
      const savedReminders = localStorage.getItem("app_reminders")
      if (savedReminders) {
        const parsedReminders = JSON.parse(savedReminders)

        parsedReminders.forEach((reminder: any) => {
          reminder.scheduledTime = new Date(reminder.scheduledTime)
          if (reminder.completedAt) {
            reminder.completedAt = new Date(reminder.completedAt)
          }
          this.reminders.set(reminder.id, reminder)
        })

        console.log(`Loaded ${this.reminders.size} reminders`)
      }
    } catch (error: any) {
      console.error("Error loading reminders:", error)
    }
  }

  private static saveReminders() {
    if (typeof window === "undefined") return

    try {
      const remindersArray = Array.from(this.reminders.values())
      localStorage.setItem("app_reminders", JSON.stringify(remindersArray))
    } catch (error) {
      console.error("Error saving reminders:", error)
    }
  }

  /**
   * Add a new reminder of any type (pomodoro, habit, medication, etc.).
   * Schedules both in-app and background notifications.
   */
  static addReminder(reminder: Reminder): string | number {
    if (!reminder.id) {
      reminder.id = Date.now().toString()
    }
    reminder = {
      soundEnabled: true,
      soundType: reminder.type,
      soundVolume: 70,
      notificationEnabled: true,
      vibrationEnabled: true,
      completed: false,
      ...reminder,
    }
    this.reminders.set(reminder.id, reminder)
    this.scheduleReminder(reminder)
    this.saveReminders()
    // Send to service worker for background scheduling
    this.sendToServiceWorker('SCHEDULE_REMINDER', { reminder })
    return reminder.id
  }

  /**
   * Update an existing reminder.
   */
  static updateReminder(reminder: Reminder): boolean {
    if (!this.reminders.has(reminder.id)) {
      return false
    }
    this.cancelReminder(reminder.id)
    this.reminders.set(reminder.id, reminder)
    if (!reminder.completed) {
      this.scheduleReminder(reminder)
    }
    this.saveReminders()
    // Update in service worker
    this.sendToServiceWorker('SCHEDULE_REMINDER', { reminder })
    return true
  }

  /**
   * Remove a reminder by ID.
   */
  static removeReminder(id: string | number): boolean {
    if (!this.reminders.has(id)) {
      return false
    }
    this.cancelReminder(id)
    this.reminders.delete(id)
    this.saveReminders()
    // Remove from service worker
    this.sendToServiceWorker('REMOVE_REMINDER', { reminderId: id })
    return true
  }

  /**
   * Mark a reminder as complete.
   */
  static completeReminder(id: string | number): boolean {
    const reminder = this.reminders.get(id)
    if (!reminder) return false
    reminder.completed = true
    reminder.completedAt = new Date()
    this.cancelReminder(id)
    this.saveReminders()
    // Notify service worker
    this.sendToServiceWorker('COMPLETE_REMINDER', { reminderId: id })
    return true
  }

  static getReminder(id: string | number): Reminder | undefined {
    return this.reminders.get(id)
  }

  static getAllReminders(): Reminder[] {
    return Array.from(this.reminders.values())
  }

  static getRemindersByType(type: ReminderType): Reminder[] {
    return Array.from(this.reminders.values()).filter((reminder) => reminder.type === type)
  }

  static getUpcomingReminders(minutes = 60): Reminder[] {
    const now = new Date()
    const cutoff = new Date(now.getTime() + minutes * 60000)

    return Array.from(this.reminders.values())
      .filter((reminder) => {
        return !reminder.completed && reminder.scheduledTime >= now && reminder.scheduledTime <= cutoff
      })
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())
  }

  /**
   * Schedule an in-app notification for the reminder.
   */
  private static scheduleReminder(reminder: Reminder) {
    const now = new Date()
    const scheduledTime = reminder.scheduledTime
    if (scheduledTime > now && !reminder.completed) {
      const delayMs = scheduledTime.getTime() - now.getTime()
      // Use setTimeout to schedule the notification
      const timerId = setTimeout(() => {
        NotificationService.showNotification(
          reminder.title,
          {
            body: this.getNotificationDescription(reminder),
            tag: `${reminder.type}-${reminder.id}`,
            requireInteraction: true,
            vibrate: reminder.vibrationEnabled ? [200, 100, 200] : undefined as any,
            data: {
              url: this.getUrlForReminderType(reminder.type),
              reminderData: reminder.data,
              reminderId: reminder.id,
            },
          } as any,
          reminder.soundType as any,
          reminder.soundVolume || 70,
        )
        // Dispatch in-app notification popup
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('inAppNotification', {
              detail: {
                title: `🔔 Reminder: ${reminder.title}`,
                options: {
                  body: this.getNotificationDescription(reminder),
                },
              },
            })
          )
        }
      }, delayMs)
      this.scheduledTimers.set(reminder.id, timerId)
    }
  }

  private static getNotificationDescription(reminder: Reminder): string {
    const baseDescription = reminder.description || ""

    switch (reminder.type) {
      case "medication":
        return `${baseDescription} - Time to take your medication. Tap to mark as taken.`
      case "task":
        return `${baseDescription} - Task deadline approaching. Tap to view details.`
      case "habit":
        return `${baseDescription} - Don't forget your daily habit! Tap to mark as complete.`
      case "goal":
        return `${baseDescription} - Goal deadline reminder. Tap to check progress.`
      case "timer":
        return `${baseDescription} - Timer completed! Time for a break.`
      case "study":
        return `${baseDescription} - Study session reminder. Tap to start studying.`
      case "health":
        return `${baseDescription} - Health tracking reminder. Tap to log your data.`
      default:
        return baseDescription || "Reminder notification"
    }
  }

  private static cancelReminder(id: string | number) {
    const timerId = this.scheduledTimers.get(id)
    if (timerId) {
      clearTimeout(timerId)
      this.scheduledTimers.delete(id)
    }
  }

  static startBackgroundChecking() {
    // Check for due reminders every minute
    this.checkInterval = setInterval(() => {
      this.checkDueReminders()
    }, 60000) // Check every minute
    
    // Also check immediately
    this.checkDueReminders()
  }

  static checkDueReminders() {
    const now = Date.now()
    const dueReminders = Array.from(this.reminders.values()).filter(
      reminder => !reminder.completed && 
      reminder.scheduledTime.getTime() <= now && 
      reminder.scheduledTime.getTime() > now - 60000 // Within the last minute
    )

    dueReminders.forEach(reminder => {
      this.showReminderNotification(reminder)
    })
  }

  static showReminderNotification(reminder: Reminder) {
    if (!reminder.notificationEnabled) return

    const notificationOptions = {
      body: this.getNotificationDescription(reminder),
      requireInteraction: reminder.type === "medication",
      tag: `reminder-${reminder.id}`,
      data: {
        url: this.getUrlForReminderType(reminder.type),
        type: reminder.type,
        reminderId: reminder.id
      },
      actions: [
        {
          action: "complete",
          title: "✓ Complete"
        },
        {
          action: "snooze",
          title: "⏰ Snooze 5min"
        },
        {
          action: "view",
          title: "👁 View"
        }
      ]
    }

    NotificationService.showNotification(reminder.title, notificationOptions)
    
    // Also show in-app notification
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent("inAppNotification", {
          detail: {
            key: `reminder-${reminder.id}`,
            title: reminder.title,
            options: {
              body: this.getNotificationDescription(reminder),
              type: reminder.type
            },
          },
        })
      )
    }

    console.log('[ReminderManager] Reminder notification shown:', reminder)
  }

  private static getUrlForReminderType(type: ReminderType): string {
    switch (type) {
      case "medication":
        return "/dashboard/medications"
      case "task":
        return "/dashboard/tasks"
      case "habit":
        return "/dashboard/habits"
      case "goal":
        return "/dashboard/goals"
      case "timer":
        return "/dashboard/pomodoro"
      case "study":
        return "/dashboard/study"
      case "health":
        return "/dashboard/health"
      default:
        return "/dashboard"
    }
  }

  static handleServiceWorkerReminderComplete(reminder: Reminder) {
    console.log('[ReminderManager] Service worker reminder completed:', reminder)
    this.showReminderNotification(reminder)
  }
}

// Initialize the reminder manager
if (typeof window !== "undefined") {
  ReminderManager.initialize()
}
