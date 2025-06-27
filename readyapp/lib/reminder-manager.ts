// Enhanced reminder manager with better notifications
import { NotificationService } from "./notification-service"

export type ReminderType = "medication" | "task" | "habit" | "goal" | "timer" | "study" | "general" | "health"

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

export class ReminderManager {
  private static reminders: Map<string | number, Reminder> = new Map()
  private static scheduledTimers: Map<string | number, NodeJS.Timeout> = new Map()
  private static isInitialized = false

  static initialize() {
    if (this.isInitialized) return

    this.loadReminders()

    // Check reminders every 30 seconds for better accuracy
    setInterval(() => this.checkReminders(), 30000)

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

    return reminder.id
  }

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
    return true
  }

  static completeReminder(id: string | number): boolean {
    const reminder = this.reminders.get(id)
    if (!reminder) return false

    reminder.completed = true
    reminder.completedAt = new Date()

    this.cancelReminder(id)
    this.saveReminders()

    return true
  }

  static removeReminder(id: string | number): boolean {
    if (!this.reminders.has(id)) {
      return false
    }

    this.cancelReminder(id)
    this.reminders.delete(id)
    this.saveReminders()

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

  private static scheduleReminder(reminder: Reminder) {
    const now = new Date()
    const scheduledTime = reminder.scheduledTime

    if (scheduledTime > now && !reminder.completed) {
      const delayMs = scheduledTime.getTime() - now.getTime()

      // Use setTimeout to schedule the notification, like medications
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

  private static checkReminders() {
    const now = new Date()

    this.reminders.forEach((reminder, id) => {
      const scheduledTime = reminder.scheduledTime

      // Check if reminder is due and not completed
      if (!reminder.completed && scheduledTime <= now && scheduledTime >= new Date(now.getTime() - 30000)) {
        // Unified deduplication: Only show once per reminder per scheduled time
        const dedupeKey = `reminder-shown-${reminder.id}-${scheduledTime.toISOString()}`
        if (localStorage.getItem(dedupeKey)) return
        localStorage.setItem(dedupeKey, "1")
        
        // Trigger notification
        if (reminder.notificationEnabled) {
          NotificationService.showNotification(
            reminder.title,
            {
              body: this.getNotificationDescription(reminder),
              tag: `${reminder.type}-${reminder.id}`,
              requireInteraction: true,
              vibrate: reminder.vibrationEnabled ? [200, 100, 200] : undefined,
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
        }

        // Handle recurring reminders
        if (reminder.recurring && reminder.recurringPattern) {
          const nextOccurrence = this.calculateNextOccurrence(reminder)
          if (nextOccurrence) {
            const updatedReminder = {
              ...reminder,
              scheduledTime: nextOccurrence,
              completed: false,
              completedAt: undefined,
            }
            this.updateReminder(updatedReminder)
          } else {
            this.removeReminder(id)
          }
        } else {
          // For non-recurring reminders, mark as completed but don't remove
          reminder.completed = true
          reminder.completedAt = new Date()
          this.saveReminders()
        }
      }
    })

    try {
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
    } catch (error: any) {
      console.error("Error checking scheduled reminders:", error)
    }
  }

  private static calculateNextOccurrence(reminder: Reminder): Date | null {
    const pattern = reminder.recurringPattern
    const currentDate = new Date()

    if (!pattern) return null

    if (pattern === "daily") {
      const nextDay = new Date(reminder.scheduledTime)
      nextDay.setDate(nextDay.getDate() + 1)
      return nextDay
    }

    if (pattern === "weekly" && reminder.data?.days) {
      const days: string[] = reminder.data.days;
      const dayMap: { [key: string]: number } = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
      const now = new Date();
      let soonest: Date | null = null;
      for (const day of days) {
        const dayIdx = dayMap[day as string];
        let daysToAdd = (dayIdx - now.getDay() + 7) % 7;
        const candidate = new Date(now);
        candidate.setDate(now.getDate() + daysToAdd);
        candidate.setHours(reminder.scheduledTime.getHours());
        candidate.setMinutes(reminder.scheduledTime.getMinutes());
        candidate.setSeconds(0);
        candidate.setMilliseconds(0);
        // If today and time is in the past, skip to next week
        if (daysToAdd === 0 && candidate <= now) {
          candidate.setDate(candidate.getDate() + 7);
        }
        if (!soonest || candidate < soonest) {
          soonest = candidate;
        }
      }
      return soonest;
    }

    if (pattern === "weekly") {
      const nextWeek = new Date(reminder.scheduledTime)
      nextWeek.setDate(nextWeek.getDate() + 7)
      return nextWeek
    }

    if (pattern === "monthly") {
      const nextMonth = new Date(reminder.scheduledTime)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      return nextMonth
    }

    if (pattern.includes(",")) {
      const days = pattern.split(",")
      const dayMap: { [key: string]: number } = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
      }

      const currentDayOfWeek = currentDate.getDay()
      let daysToAdd = 7

      for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (currentDayOfWeek + i) % 7
        const nextDayName = Object.keys(dayMap).find((key) => dayMap[key] === nextDayIndex)

        if (nextDayName && days.includes(nextDayName)) {
          daysToAdd = i
          break
        }
      }

      const nextOccurrence = new Date(reminder.scheduledTime)
      nextOccurrence.setDate(nextOccurrence.getDate() + daysToAdd)
      nextOccurrence.setHours(reminder.scheduledTime.getHours())
      nextOccurrence.setMinutes(reminder.scheduledTime.getMinutes())
      nextOccurrence.setSeconds(0)

      return nextOccurrence
    }

    return null
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
}

// Initialize the reminder manager
if (typeof window !== "undefined") {
  ReminderManager.initialize()
}
