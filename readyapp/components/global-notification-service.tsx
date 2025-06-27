"use client"

import { useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { NotificationService } from "@/lib/notification-service"

export function GlobalNotificationService() {
  const { toast } = useToast()
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastCheckRef = useRef<number>(0)

  useEffect(() => {
    // Initialize notification service
    initializeNotifications()

    // Start background monitoring
    startBackgroundMonitoring()

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [])

  const initializeNotifications = async () => {
    try {
      // Always request notification permission on app start
      if ("Notification" in window && Notification.permission === "default") {
        const permission = await Notification.requestPermission()

        if (permission === "granted") {
          toast({
            title: "🔔 Notifications Enabled",
            description: "You'll receive important reminders and updates.",
            duration: 3000,
          })
        }
      }

      // Enable notifications in settings by default
      const settings = JSON.parse(localStorage.getItem("userSettings") || "{}")
      if (!settings.preferences) {
        settings.preferences = {}
      }
      settings.preferences.notificationsEnabled = true
      localStorage.setItem("userSettings", JSON.stringify(settings))
    } catch (error) {
      console.error("Error initializing notifications:", error)
    }
  }

  const startBackgroundMonitoring = () => {
    // Check every 30 seconds for pending notifications
    checkIntervalRef.current = setInterval(() => {
      const now = Date.now()

      // Prevent too frequent checks
      if (now - lastCheckRef.current < 30000) return
      lastCheckRef.current = now

      checkPendingNotifications()
    }, 30000)

    // Also check immediately
    setTimeout(() => checkPendingNotifications(), 2000)
  }

  const checkPendingNotifications = () => {
    try {
      checkMedicationReminders()
      checkTaskDeadlines()
      checkHabitReminders()
      checkPomodoroTimer()
      checkHealthReminders()
      checkScheduledReminders()
    } catch (error) {
      console.error("Error checking pending notifications:", error)
    }
  }

  const checkMedicationReminders = () => {
    try {
      const medications = JSON.parse(localStorage.getItem("medications") || "[]")
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
      const today = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()

      medications.forEach((medication: any) => {
        if (!medication.notificationsEnabled) return

        medication.schedule?.forEach((schedule: any) => {
          if (schedule.days?.includes(today) && schedule.time === currentTime) {
            // Deduplication: Only show once per medication per day per time
            const dedupeKey = `medication-shown-${medication.id || medication.name}-${today}-${schedule.time}`
            if (localStorage.getItem(dedupeKey)) return
            localStorage.setItem(dedupeKey, "1")
            // Show notification
            NotificationService.showMedicationReminder(
              "💊 Medication Time",
              `Time to take your ${medication.name} (${medication.dosage})`,
              medication,
            )
            // Show popup
            window.dispatchEvent(
              new CustomEvent("show-popup", {
                detail: {
                  type: "medication-reminder",
                  title: "💊 Medication Time",
                  message: `Time to take your ${medication.name} (${medication.dosage}). ${medication.instructions || ""}`,
                  duration: 0, // Don't auto-dismiss medication reminders
                  priority: "high",
                  actions: [
                    {
                      label: "Taken",
                      action: () => {
                        toast({
                          title: "✅ Medication Logged",
                          description: "Great job staying on track!",
                        })
                      },
                    },
                    {
                      label: "Snooze 15min",
                      action: () => {
                        toast({
                          title: "⏰ Reminder Snoozed",
                          description: "We'll remind you again in 15 minutes.",
                        })
                      },
                    },
                  ],
                },
              }),
            )
          }
        })
      })
    } catch (error) {
      console.error("Error checking medication reminders:", error)
    }
  }

  const checkTaskDeadlines = () => {
    try {
      const tasks = JSON.parse(localStorage.getItem("tasks") || "[]")
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      tasks.forEach((task: any) => {
        if (task.completed) return

        const dueDate = new Date(task.dueDate)
        const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)

        // Notify for tasks due within 2 hours
        if (hoursUntilDue > 0 && hoursUntilDue <= 2) {
          const lastNotified = localStorage.getItem(`task-notified-${task.id}`)
          const lastNotifiedTime = lastNotified ? Number.parseInt(lastNotified) : 0

          // Only notify once per hour
          if (now.getTime() - lastNotifiedTime > 60 * 60 * 1000) {
            localStorage.setItem(`task-notified-${task.id}`, now.getTime().toString())

            NotificationService.showTaskReminder(
              "📋 Task Due Soon",
              `"${task.title}" is due in ${Math.round(hoursUntilDue)} hour(s)`,
              task,
            )

            window.dispatchEvent(
              new CustomEvent("show-popup", {
                detail: {
                  type: "task-deadline",
                  title: "📋 Task Due Soon",
                  message: `"${task.title}" is due in ${Math.round(hoursUntilDue)} hour(s)!`,
                  duration: 8000,
                  priority: "high",
                  actions: [
                    {
                      label: "Complete Now",
                      action: () => {
                        window.location.href = "/dashboard/tasks"
                      },
                    },
                  ],
                },
              }),
            )
          }
        }
      })
    } catch (error) {
      console.error("Error checking task deadlines:", error)
    }
  }

  const checkHabitReminders = () => {
    try {
      const habits = JSON.parse(localStorage.getItem("habits") || "[]")
      const now = new Date()
      const currentHour = now.getHours()
      const today = now.toISOString().split("T")[0]

      // Check habits in the evening (6-9 PM)
      if (currentHour >= 18 && currentHour <= 21) {
        habits.forEach((habit: any) => {
          const completedToday = habit.completedDates?.includes(today)
          const dedupeKey = `habit-reminded-${habit.id}-${today}`
          if (!completedToday && !localStorage.getItem(dedupeKey)) {
            localStorage.setItem(dedupeKey, now.toISOString())
            NotificationService.showHabitReminder(
              "🔄 Habit Reminder",
              `Don't forget to ${habit.name}! You're on a ${habit.streak || 0}-day streak.`,
              habit,
            )
            window.dispatchEvent(
              new CustomEvent("show-popup", {
                detail: {
                  type: "habit-reminder",
                  title: "🔄 Habit Reminder",
                  message: `Don't forget to ${habit.name}! You're on a ${habit.streak || 0}-day streak.`,
                  duration: 8000,
                  priority: "medium",
                  actions: [
                    {
                      label: "Mark Done",
                      action: () => {
                        toast({
                          title: "✅ Habit Completed",
                          description: "Great job maintaining your streak!",
                        })
                      },
                    },
                  ],
                },
              }),
            )
          }
        })
      }
    } catch (error) {
      console.error("Error checking habit reminders:", error)
    }
  }

  const checkPomodoroTimer = () => {
    try {
      const pomodoroState = JSON.parse(localStorage.getItem("pomodoro-state") || "{}")

      if (pomodoroState.isActive && pomodoroState.startTime) {
        const now = Date.now()
        const elapsed = Math.floor((now - pomodoroState.startTime) / 1000)
        const remaining = pomodoroState.originalDuration - elapsed

        // Check if timer just completed
        if (remaining <= 0 && pomodoroState.timeLeft > 0) {
          // Deduplication: Only show once per session
          const dedupeKey = `pomodoro-shown-${pomodoroState.startTime}`
          if (localStorage.getItem(dedupeKey)) return
          localStorage.setItem(dedupeKey, "1")
          // Timer completed - trigger completion event
          if (pomodoroState.mode === "pomodoro") {
            const duration = Math.floor(pomodoroState.originalDuration / 60);
            const breakDuration = (pomodoroState.sessionCount + 1) % 4 === 0 ? 15 : 5;
            const task = pomodoroState.currentTask;
            // --- NEW: Record completed session ---
            const sessions = JSON.parse(localStorage.getItem("pomodoro-sessions") || "[]");
            const session = {
              id: Date.now().toString(),
              type: "pomodoro",
              duration: pomodoroState.originalDuration,
              startTime: pomodoroState.startTime || Date.now() - pomodoroState.originalDuration * 1000,
              endTime: Date.now(),
              completed: true,
              task: task || undefined,
            };
            sessions.push(session);
            localStorage.setItem("pomodoro-sessions", JSON.stringify(sessions));
            // --- NEW: Play notification sound globally ---
            if (typeof window !== "undefined" && "Audio" in window) {
              // Deduplication: Only play sound once per session
              const soundDedupeKey = `global-pomodoro-sound-${pomodoroState.startTime}`
              if (!localStorage.getItem(soundDedupeKey)) {
                localStorage.setItem(soundDedupeKey, "1")
                try {
                  const audio = new Audio("/sounds/pomodoro-complete.mp3");
                  audio.volume = 0.7;
                  audio.play();
                } catch (e) { /* ignore */ }
              }
            }
            // --- NEW: Dispatch show-popup event for Pomodoro completion ---
            const popupDedupeKey = `global-pomodoro-popup-${pomodoroState.startTime}`;
            if (!localStorage.getItem(popupDedupeKey)) {
              localStorage.setItem(popupDedupeKey, "1");
              window.dispatchEvent(
                new CustomEvent("show-popup", {
                  detail: {
                    type: "pomodoro-complete",
                    title: "🍅 Pomodoro Complete!",
                    message: `Excellent focus! You completed ${duration} minutes${task ? ` working on: ${task}` : ""}.`,
                    duration: 10000,
                    priority: "high",
                    actions: [
                      {
                        label: "Start 5min Break",
                        action: () => {
                          toast({
                            title: "☕ Break Started",
                            description: "Enjoy your 5-minute break!",
                          });
                          window.dispatchEvent(new CustomEvent("start-pomodoro-timer", {
                            detail: { duration: 300, mode: "shortBreak" }
                          }));
                        },
                      },
                      {
                        label: "Stop Alarm",
                        action: () => {
                          window.dispatchEvent(new CustomEvent("pomodoro-stop-repeat"));
                        },
                        variant: "outline"
                      }
                    ],
                  },
                })
              );
            }
          } else {
            window.dispatchEvent(
              new CustomEvent("pomodoro-break", {
                detail: {
                  duration: Math.floor(pomodoroState.originalDuration / 60),
                },
              }),
            )
          }

          // Clear the active state
          localStorage.setItem(
            "pomodoro-state",
            JSON.stringify({
              ...pomodoroState,
              isActive: false,
              timeLeft: 0,
            }),
          )
        }
      }
    } catch (error) {
      console.error("Error checking Pomodoro timer:", error)
    }
  }

  const checkHealthReminders = () => {
    try {
      const now = Date.now()

      // Water reminder every 2 hours
      const lastWaterReminder = localStorage.getItem("lastWaterReminder")
      if (!lastWaterReminder || now - Number.parseInt(lastWaterReminder) > 2 * 60 * 60 * 1000) {
        localStorage.setItem("lastWaterReminder", now.toString())
        // Deduplication: Only show once per 2 hours
        const dedupeKey = `health-hydration-${Math.floor(now / (2 * 60 * 60 * 1000))}`
        if (!localStorage.getItem(dedupeKey)) {
          localStorage.setItem(dedupeKey, "1")
          window.dispatchEvent(
            new CustomEvent("show-popup", {
              detail: {
                type: "health-hydration",
                title: "💧 Stay Hydrated",
                message: "Remember to drink some water! Your body needs regular hydration.",
                duration: 6000,
                priority: "low",
                actions: [
                  {
                    label: "Done",
                    action: () => {
                      toast({
                        title: "💧 Hydration Logged",
                        description: "Great job staying hydrated!",
                      })
                    },
                  },
                ],
              },
            }),
          )
        }
      }

      // Posture reminder every hour during work hours
      const currentHour = new Date().getHours()
      if (currentHour >= 9 && currentHour <= 17) {
        const lastPostureReminder = localStorage.getItem("lastPostureReminder")
        if (!lastPostureReminder || now - Number.parseInt(lastPostureReminder) > 60 * 60 * 1000) {
          localStorage.setItem("lastPostureReminder", now.toString())
          // Deduplication: Only show once per hour
          const dedupeKey = `health-posture-${Math.floor(now / (60 * 60 * 1000))}`
          if (!localStorage.getItem(dedupeKey)) {
            localStorage.setItem(dedupeKey, "1")
            window.dispatchEvent(
              new CustomEvent("show-popup", {
                detail: {
                  type: "health-posture",
                  title: "🧘 Posture Check",
                  message: "Take a moment to check your posture and stretch your back!",
                  duration: 5000,
                  priority: "low",
                },
              }),
            )
          }
        }
      }
    } catch (error) {
      console.error("Error checking health reminders:", error)
    }
  }

  const checkScheduledReminders = () => {
    try {
      const reminders = JSON.parse(localStorage.getItem("reminders") || "[]")
      const now = new Date()

      reminders.forEach((reminder: any) => {
        if (reminder.completed) return

        const reminderTime = new Date(reminder.scheduledTime)
        const timeDiff = Math.abs(now.getTime() - reminderTime.getTime())

        // Trigger if within 1 minute of scheduled time
        if (timeDiff <= 60000 && reminderTime <= now) {
          // Deduplication: Only show once per reminder per scheduled time
          const dedupeKey = `reminder-shown-${reminder.id}-${reminderTime.toISOString()}`
          if (localStorage.getItem(dedupeKey)) return
          localStorage.setItem(dedupeKey, "1")
          NotificationService.showNotification(
            `🔔 ${reminder.title}`,
            {
            body: reminder.description || "You have a scheduled reminder",
            icon: "/icon-192x192.png",
            }
          )
          window.dispatchEvent(
            new CustomEvent("show-popup", {
              detail: {
                type: "scheduled-reminder",
                title: `🔔 ${reminder.title}`,
                message: reminder.description || "You have a scheduled reminder",
                duration: 10000,
                priority: reminder.priority || "medium",
                actions: [
                  {
                    label: "Mark Done",
                    action: () => {
                      toast({
                        title: "✅ Reminder Completed",
                        description: "Task marked as done.",
                      })
                    },
                  },
                ],
              },
            }),
          )
        }
      })
    } catch (error) {
      console.error("Error checking scheduled reminders:", error)
    }
  }

  // This component doesn't render anything
  return null
}
