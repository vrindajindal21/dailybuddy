"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { X, CheckCircle, Info, Clock, Target, Coffee, Heart, Brain, Zap, Trophy, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PopupData {
  id: string
  type: string
  title: string
  message: string
  duration?: number
  priority: "low" | "medium" | "high"
  actions?: Array<{
    label: string
    action: () => void
    variant?: "default" | "outline" | "destructive"
  }>
  data?: any
}

export function SmartPopupSystem() {
  const [activePopups, setActivePopups] = useState<PopupData[]>([])
  const [dismissedPopups, setDismissedPopups] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }, [])

  // Handle popup events
  useEffect(() => {
    const handleShowPopup = (event: CustomEvent) => {
      console.log('show-popup event received:', event.detail); // DEBUG LOG
      const { type, title, message, duration = 5000, priority = "medium", actions, data } = event.detail

      // Deduplication: Only show once per event type and content
      const dedupeKey = `smart-popup-${type}-${title}-${message}`
      if (localStorage.getItem(dedupeKey)) return
      localStorage.setItem(dedupeKey, "1")

      const popupId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Don't show if already dismissed this type recently
      if (dismissedPopups.has(type)) {
        return
      }

      const popup: PopupData = {
        id: popupId,
        type,
        title,
        message,
        duration,
        priority,
        actions,
        data,
      }

      setActivePopups((prev) => {
        // Remove any existing popups of the same type
        const filtered = prev.filter((p) => p.type !== type)

        // Add new popup, sorted by priority
        const updated = [...filtered, popup].sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        })

        return updated.slice(0, 3) // Max 3 popups at once
      })

      // Auto-dismiss after duration
      if (duration > 0) {
        setTimeout(() => {
          dismissPopup(popupId)
        }, duration)
      }

      // Only play sound for new popups (not for duplicates)
      playNotificationSound()
    }

    // Listen for various app events
    const handlePomodoroComplete = (event: CustomEvent) => {
      const { duration, breakDuration, task } = event.detail

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
                label: `Start ${breakDuration}min Break`,
                action: () => {
                  toast({
                    title: "☕ Break Started",
                    description: `Enjoy your ${breakDuration}-minute break!`,
                  })
                },
              },
            ],
          },
        }),
      )
    }

    const handleBreakComplete = (event: CustomEvent) => {
      const { duration } = event.detail

      window.dispatchEvent(
        new CustomEvent("show-popup", {
          detail: {
            type: "break-complete",
            title: "☕ Break Time Over!",
            message: `Your ${duration}-minute break is over. Ready to get back to work?`,
            duration: 8000,
            priority: "high",
            actions: [
              {
                label: "Start Pomodoro",
                action: () => {
                  toast({
                    title: "🎯 Ready to Focus",
                    description: "Let's get back to productive work!",
                  })
                },
              },
            ],
          },
        }),
      )
    }

    const handleTaskReminder = (event: CustomEvent) => {
      const { task, dueTime } = event.detail

      window.dispatchEvent(
        new CustomEvent("show-popup", {
          detail: {
            type: "task-reminder",
            title: "📋 Task Reminder",
            message: `Don't forget: "${task}" is due ${dueTime}`,
            duration: 8000,
            priority: "medium",
            actions: [
              {
                label: "Mark Complete",
                action: () => {
                  toast({
                    title: "✅ Task Completed",
                    description: "Great job finishing your task!",
                  })
                },
              },
              {
                label: "Snooze 10min",
                action: () => {
                  toast({
                    title: "⏰ Reminder Snoozed",
                    description: "We'll remind you again in 10 minutes.",
                  })
                },
                variant: "outline",
              },
            ],
          },
        }),
      )
    }

    const handleHealthReminder = (event: CustomEvent) => {
      const { type, message } = event.detail

      const healthIcons: Record<string, string> = {
        hydration: "💧",
        posture: "🧘",
        exercise: "🏃",
        eyes: "👀",
        medication: "💊",
      }

      window.dispatchEvent(
        new CustomEvent("show-popup", {
          detail: {
            type: `health-${type}`,
            title: `${healthIcons[type] || "🏥"} Health Reminder`,
            message,
            duration: 6000,
            priority: "medium",
            actions: [
              {
                label: "Done",
                action: () => {
                  toast({
                    title: "✅ Health Goal Completed",
                    description: "Great job taking care of yourself!",
                  })
                },
              },
            ],
          },
        }),
      )
    }

    const handleGoalAchievement = (event: CustomEvent) => {
      const { goal, progress } = event.detail

      window.dispatchEvent(
        new CustomEvent("show-popup", {
          detail: {
            type: "goal-achievement",
            title: "🎯 Goal Achievement!",
            message: `Congratulations! You've reached ${progress}% of your goal: "${goal}"`,
            duration: 8000,
            priority: "high",
            actions: [
              {
                label: "View Progress",
                action: () => {
                  toast({
                    title: "📊 Progress Viewed",
                    description: "Keep up the excellent work!",
                  })
                },
              },
            ],
          },
        }),
      )
    }

    const handleStudySession = (event: CustomEvent) => {
      const { subject, duration, score } = event.detail

      window.dispatchEvent(
        new CustomEvent("show-popup", {
          detail: {
            type: "study-complete",
            title: "📚 Study Session Complete!",
            message: `Great work studying ${subject} for ${duration} minutes${score ? ` with a score of ${score}%` : ""}!`,
            duration: 7000,
            priority: "medium",
            actions: [
              {
                label: "Continue Learning",
                action: () => {
                  toast({
                    title: "🎓 Keep Learning",
                    description: "Your dedication to learning is inspiring!",
                  })
                },
              },
            ],
          },
        }),
      )
    }

    // Add event listeners
    window.addEventListener("show-popup", handleShowPopup as EventListener)
    window.addEventListener("pomodoro-complete", handlePomodoroComplete as EventListener)
    window.addEventListener("pomodoro-break", handleBreakComplete as EventListener)
    window.addEventListener("task-reminder", handleTaskReminder as EventListener)
    window.addEventListener("health-reminder", handleHealthReminder as EventListener)
    window.addEventListener("goal-achievement", handleGoalAchievement as EventListener)
    window.addEventListener("study-session-complete", handleStudySession as EventListener)

    return () => {
      window.removeEventListener("show-popup", handleShowPopup as EventListener)
      window.removeEventListener("pomodoro-complete", handlePomodoroComplete as EventListener)
      window.removeEventListener("pomodoro-break", handleBreakComplete as EventListener)
      window.removeEventListener("task-reminder", handleTaskReminder as EventListener)
      window.removeEventListener("health-reminder", handleHealthReminder as EventListener)
      window.removeEventListener("goal-achievement", handleGoalAchievement as EventListener)
      window.removeEventListener("study-session-complete", handleStudySession as EventListener)
    }
  }, [dismissedPopups, toast, playNotificationSound])

  const dismissPopup = useCallback((popupId: string) => {
    setActivePopups((prev) => prev.filter((p) => p.id !== popupId))
  }, [])

  const dismissAllPopups = useCallback(() => {
    setActivePopups([])
  }, [])

  const snoozePopup = useCallback(
    (popup: PopupData) => {
      dismissPopup(popup.id)
      setDismissedPopups((prev) => new Set([...prev, popup.type]))

      // Remove from dismissed after 10 minutes
      setTimeout(
        () => {
          setDismissedPopups((prev) => {
            const updated = new Set(prev)
            updated.delete(popup.type)
            return updated
          })
        },
        10 * 60 * 1000,
      )

      toast({
        title: "⏰ Popup Snoozed",
        description: "We won't show this type of popup for 10 minutes.",
      })
    },
    [dismissPopup, toast],
  )

  const getPopupIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      "pomodoro-complete": <Target className="h-5 w-5 text-red-500" />,
      "break-complete": <Coffee className="h-5 w-5 text-green-500" />,
      "task-reminder": <CheckCircle className="h-5 w-5 text-blue-500" />,
      "health-hydration": <Heart className="h-5 w-5 text-blue-400" />,
      "health-posture": <Zap className="h-5 w-5 text-purple-500" />,
      "health-exercise": <Heart className="h-5 w-5 text-red-500" />,
      "health-eyes": <Brain className="h-5 w-5 text-yellow-500" />,
      "health-medication": <Heart className="h-5 w-5 text-pink-500" />,
      "goal-achievement": <Trophy className="h-5 w-5 text-yellow-500" />,
      "study-complete": <Star className="h-5 w-5 text-indigo-500" />,
    }

    return iconMap[type] || <Info className="h-5 w-5 text-gray-500" />
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
      case "medium":
        return "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
      case "low":
        return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
      default:
        return "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950"
    }
  }

  if (activePopups.length === 0) {
    return null
  }

  return (
    <>
      <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {activePopups.length > 1 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={dismissAllPopups} className="text-xs">
            Dismiss All ({activePopups.length})
          </Button>
        </div>
      )}

      {activePopups.map((popup) => (
        <Card
          key={popup.id}
          className={`shadow-lg border-2 animate-in slide-in-from-right-full duration-300 ${getPriorityColor(popup.priority)}`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getPopupIcon(popup.type)}
                <CardTitle className="text-sm font-semibold">{popup.title}</CardTitle>
                <Badge variant="outline" className="text-xs capitalize">
                  {popup.priority}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => snoozePopup(popup)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  title="Snooze for 10 minutes"
                >
                  <Clock className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissPopup(popup.id)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-sm mb-3">{popup.message}</CardDescription>

            {popup.actions && popup.actions.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {popup.actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || "default"}
                    size="sm"
                    onClick={() => {
                      action.action()
                      dismissPopup(popup.id)
                    }}
                    className="text-xs"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}

            {popup.duration && popup.duration > 0 && (
              <div className="mt-3">
                <Progress
                  value={100}
                  className="h-1 animate-pulse"
                  style={{
                    animation: `shrink ${popup.duration}ms linear forwards`,
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
    </>
  )
}
