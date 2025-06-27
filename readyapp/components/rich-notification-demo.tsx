"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NotificationService } from "@/lib/notification-service"
import { Bell, Pill, BookOpen, CheckSquare, Target, Timer } from "lucide-react"

export function RichNotificationDemo() {
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default")

  const requestPermission = async () => {
    const permission = await NotificationService.requestPermission()
    setPermissionState(permission)
  }

  const showMedicationNotification = () => {
    NotificationService.showMedicationReminder("💊 Time for your medication", "Take your daily vitamin D supplement", {
      medicationId: "vitamin-d",
      dosage: "1000 IU",
    })
  }

  const showStudyNotification = () => {
    NotificationService.showStudyReminder("📚 Study Session Starting", "Time to review your JavaScript concepts", {
      subject: "JavaScript",
      duration: 30,
    })
  }

  const showTaskNotification = () => {
    NotificationService.showTaskReminder("📋 Task Due Soon", "Complete the project proposal by 5 PM", {
      taskId: "proposal",
      priority: "high",
    })
  }

  const showHabitNotification = () => {
    NotificationService.showHabitReminder("🏃‍♂️ Daily Exercise", "Time for your 30-minute workout", {
      habitId: "exercise",
      streak: 7,
    })
  }

  const showCustomNotification = () => {
    NotificationService.showRichNotification({
      title: "🎉 Achievement Unlocked!",
      body: "You've completed 7 days of consistent study habits",
      type: "goal",
      image: "/images/achievement-badge.png",
      requireInteraction: true,
      actions: [
        { action: "share", title: "📤 Share" },
        { action: "view", title: "👁 View Progress" },
        { action: "continue", title: "🚀 Keep Going" },
      ],
      data: { achievement: "7-day-streak", points: 100 },
    })
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Rich Push Notifications Demo
        </CardTitle>
        <CardDescription>Test WhatsApp-style rich notifications with interactive actions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">Notification Permission:</span>
          <div className="flex items-center gap-2">
            <Badge variant={permissionState === "granted" ? "default" : "secondary"}>{permissionState}</Badge>
            {permissionState !== "granted" && (
              <Button size="sm" onClick={requestPermission}>
                Enable
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button variant="outline" className="flex items-center gap-2 h-auto p-4" onClick={showMedicationNotification}>
            <Pill className="h-5 w-5 text-blue-500" />
            <div className="text-left">
              <div className="font-medium">Medication</div>
              <div className="text-xs text-muted-foreground">With take/skip actions</div>
            </div>
          </Button>

          <Button variant="outline" className="flex items-center gap-2 h-auto p-4" onClick={showStudyNotification}>
            <BookOpen className="h-5 w-5 text-green-500" />
            <div className="text-left">
              <div className="font-medium">Study Session</div>
              <div className="text-xs text-muted-foreground">Start/snooze options</div>
            </div>
          </Button>

          <Button variant="outline" className="flex items-center gap-2 h-auto p-4" onClick={showTaskNotification}>
            <CheckSquare className="h-5 w-5 text-orange-500" />
            <div className="text-left">
              <div className="font-medium">Task Reminder</div>
              <div className="text-xs text-muted-foreground">Complete/view actions</div>
            </div>
          </Button>

          <Button variant="outline" className="flex items-center gap-2 h-auto p-4" onClick={showHabitNotification}>
            <Target className="h-5 w-5 text-purple-500" />
            <div className="text-left">
              <div className="font-medium">Habit Tracker</div>
              <div className="text-xs text-muted-foreground">Done/skip actions</div>
            </div>
          </Button>
        </div>

        <Button className="w-full h-auto p-4" onClick={showCustomNotification}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Timer className="h-6 w-6" />
            </div>
            <div className="text-left">
              <div className="font-medium">Custom Rich Notification</div>
              <div className="text-xs opacity-90">With image, multiple actions & data</div>
            </div>
          </div>
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Notifications work even when the app is closed</p>
          <p>• Interactive actions allow quick responses</p>
          <p>• Rich content includes images and custom styling</p>
          <p>• Background sync keeps notifications in sync</p>
        </div>
      </CardContent>
    </Card>
  )
}
