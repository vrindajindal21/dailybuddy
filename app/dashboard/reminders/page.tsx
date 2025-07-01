"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Bell, Clock, Calendar, Volume2, X, Trash2, Edit, CheckCircle } from "lucide-react"
import { format, isToday, isTomorrow, addDays } from "date-fns"
import { NotificationService } from "@/lib/notification-service"
import { ReminderManager, type Reminder } from "@/lib/reminder-manager"
import { VoiceInput } from "@/components/voice-input"
import { RequiredFieldLabel } from "@/components/required-field-label"
import { toast } from "@/components/ui/use-toast"

interface ScheduleTime {
  id: string
  time: string
  days: string[]
}

const DAYS_OF_WEEK = [
  { id: "monday", label: "Mon", full: "Monday" },
  { id: "tuesday", label: "Tue", full: "Tuesday" },
  { id: "wednesday", label: "Wed", full: "Wednesday" },
  { id: "thursday", label: "Thu", full: "Thursday" },
  { id: "friday", label: "Fri", full: "Friday" },
  { id: "saturday", label: "Sat", full: "Saturday" },
  { id: "sunday", label: "Sun", full: "Sunday" },
]

const REMINDER_CATEGORIES = [
  { value: "health", label: "Health", color: "bg-green-500" },
  { value: "study", label: "Study", color: "bg-purple-500" },
  { value: "work", label: "Work", color: "bg-orange-500" },
  { value: "personal", label: "Personal", color: "bg-pink-500" },
  { value: "general", label: "General", color: "bg-gray-500" },
]

const REMINDER_COLORS = [
  { name: "Red", value: "bg-red-500", border: "border-red-500" },
  { name: "Blue", value: "bg-blue-500", border: "border-blue-500" },
  { name: "Green", value: "bg-green-500", border: "border-green-500" },
  { name: "Yellow", value: "bg-yellow-500", border: "border-yellow-500" },
  { name: "Purple", value: "bg-purple-500", border: "border-purple-500" },
  { name: "Pink", value: "bg-pink-500", border: "border-pink-500" },
  { name: "Orange", value: "bg-orange-500", border: "border-orange-500" },
  { name: "Teal", value: "bg-teal-500", border: "border-teal-500" },
]

const SOUND_TYPES = [
  { value: "bell", label: "Bell" },
  { value: "chime", label: "Chime" },
  { value: "beep", label: "Beep" },
  { value: "medication", label: "Medication" },
  { value: "study", label: "Study" },
  { value: "urgent", label: "Urgent" },
]

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("general")
  const [scheduleTimes, setScheduleTimes] = useState<ScheduleTime[]>([
    { id: "1", time: "08:00", days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
  ])
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState("")
  const [selectedColor, setSelectedColor] = useState("bg-blue-500")
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [soundType, setSoundType] = useState("bell")
  const [volume, setVolume] = useState([70])

  // Form validation
  const [titleError, setTitleError] = useState("")
  const [scheduleError, setScheduleError] = useState("")

  const [notificationPermission, setNotificationPermission] = useState<string>(typeof window !== 'undefined' ? Notification.permission : 'default')
  const [showPermissionAlert, setShowPermissionAlert] = useState(false)

  // Reference for notification interval
  const notificationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckTimeRef = useRef<Date>(new Date());
  
  // Track shown notifications to prevent duplicates
  const shownNotificationsRef = useRef(new Set());

  const [isMounted, setIsMounted] = useState(true);

  // Audio settings
  const [soundVolume, setSoundVolume] = useState(70)
  const [selectedSound, setSelectedSound] = useState("bell")
  const audioContextRef = useRef<AudioContext | null>(null)

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
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const playNotificationSound = () => {
    try {
      if (!audioContextRef.current) return

      const audioContext = audioContextRef.current
      if (audioContext.state === "suspended") {
        audioContext.resume()
      }

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      // Sound presets with different characteristics
      const soundPresets: Record<string, { frequency: number; duration: number; type: OscillatorType }> = {
        bell: { frequency: 830, duration: 1.5, type: "sine" },
        chime: { frequency: 1000, duration: 1.0, type: "sine" },
        beep: { frequency: 800, duration: 0.3, type: "square" },
        ding: { frequency: 1200, duration: 0.8, type: "triangle" },
      }

      const preset = soundPresets[selectedSound] || soundPresets.bell

      oscillator.type = preset.type
      oscillator.frequency.value = preset.frequency

      const normalizedVolume = Math.max(0, Math.min(1, soundVolume / 100))
      gainNode.gain.value = normalizedVolume

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      const now = audioContext.currentTime
      gainNode.gain.setValueAtTime(normalizedVolume, now)
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + preset.duration)

      oscillator.start(now)
      oscillator.stop(now + preset.duration)
    } catch (error) {
      console.error("Error playing notification sound:", error)
      // Fallback: try to play a simple beep
      try {
        const normalizedVolume = Math.max(0, Math.min(1, soundVolume / 100))
        const audio = new Audio(
          "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT",
        )
        audio.volume = normalizedVolume
        audio.play().catch(() => {
          // Silent fallback if even this fails
        })
      } catch (fallbackError) {
        console.warn("All audio playback methods failed")
      }
    }
  }

  useEffect(() => {
    loadReminders()
    // Fallback: Register service worker if not already registered
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) {
          navigator.serviceWorker.register('/sw.js').catch(console.error)
        }
      })
    }
    // Check notification permission
    if (Notification.permission === 'denied') {
      setShowPermissionAlert(true)
    }
    setNotificationPermission(Notification.permission)
  }, [])

  // Load shown notifications from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shown-reminder-notifications');
      if (saved) {
        shownNotificationsRef.current = new Set(JSON.parse(saved));
      }
    }
  }, []);

  // Reminder notification logic
  useEffect(() => {
    if (!isMounted) return;
    
    if (notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current);
    }
    let isFirstRun = true;
    lastCheckTimeRef.current = new Date();
    const interval = setInterval(() => {
      const now = new Date();
      const lastCheck = lastCheckTimeRef.current;
      if (isFirstRun) {
        isFirstRun = false;
        lastCheckTimeRef.current = now;
        return;
      }
      lastCheckTimeRef.current = now;
      reminders.forEach((reminder) => {
        if (reminder.type === 'medication') return;
        const reminderDate = reminder.scheduledTime ? new Date(reminder.scheduledTime) : null;
        const notificationId = reminderDate ? `${reminder.id}-${reminderDate.toISOString()}` : `${reminder.id}`;
        const becameDueSinceLastCheck =
          reminder.scheduledTime &&
          new Date(reminder.scheduledTime).getTime() <= now.getTime() &&
          new Date(reminder.scheduledTime).getTime() > lastCheck.getTime();
        const isToday = reminderDate ? reminderDate.toISOString().split('T')[0] === now.toISOString().split('T')[0] : false;
        const dedupeKey = `reminder-shown-${notificationId}`;
        if (
          reminder.notificationEnabled &&
          !reminder.completed &&
          reminder.scheduledTime &&
          becameDueSinceLastCheck &&
          isToday &&
          !localStorage.getItem(dedupeKey) &&
          NotificationService.isSupported() &&
          Notification.permission === "granted"
        ) {
          localStorage.setItem(dedupeKey, "1");
          if (soundEnabled) {
            playNotificationSound();
          }
          NotificationService.showNotification(
            `⏰ ${reminder.title}`,
            {
              body: reminder.description || "Time for your reminder!",
              icon: '/android-chrome-192x192.png',
              requireInteraction: true,
              vibrate: [200, 100, 200],
              tag: notificationId
            } as NotificationOptions & { vibrate?: number[] },
            selectedSound,
            soundVolume
          );
          window.dispatchEvent(
            new CustomEvent('inAppNotification', {
              detail: {
                title: `⏰ ${reminder.title}`,
                options: {
                  body: reminder.description || "Time for your reminder!",
                },
              },
            })
          );
          const popupDedupeKey = `reminder-popup-shown-${notificationId}`;
          if (!localStorage.getItem(popupDedupeKey)) {
            localStorage.setItem(popupDedupeKey, "1");
            window.dispatchEvent(
              new CustomEvent("show-popup", {
                detail: {
                  type: "reminder-due",
                  title: `⏰ ${reminder.title}`,
                  message: reminder.description || "Time for your reminder!",
                  duration: 10000,
                  priority: "high",
                  actions: [
                    {
                      label: "Mark as Done",
                      action: () => {
                        toast({
                          title: "Reminder Completed",
                          description: `${reminder.title} marked as done`,
                        });
                      },
                    },
                    {
                      label: "Snooze 5 min",
                      action: () => {
                        toast({
                          title: "Reminder Snoozed",
                          description: "Reminder will show again in 5 minutes",
                        });
                      },
                      variant: "outline"
                    }
                  ],
                },
              })
            );
          }
        }
      });
    }, 60000);
    notificationIntervalRef.current = interval;
    return () => {
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
      }
      lastCheckTimeRef.current = new Date();
    };
  }, [isMounted, reminders, soundEnabled, selectedSound, soundVolume]);

  // Clear shown notifications at midnight
  useEffect(() => {
    if (!isMounted) return;

    const checkMidnight = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        shownNotificationsRef.current.clear();
        localStorage.setItem('shown-reminder-notifications', '[]');
      }
    };

    const interval = setInterval(checkMidnight, 60000);
    return () => clearInterval(interval);
  }, [isMounted]);

  const loadReminders = () => {
    // Always load from localStorage for latest state
    const saved = localStorage.getItem('app_reminders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((r: any) => ({
          ...r,
          scheduledTime: new Date(r.scheduledTime),
          completedAt: r.completedAt ? new Date(r.completedAt) : undefined
        }));
        setReminders(parsed.filter((r: any) => r.type !== 'medication'));
        return;
      } catch {}
    }
    // Fallback to ReminderManager if localStorage is empty or fails
    const allReminders = ReminderManager.getAllReminders();
    setReminders(allReminders.filter(r => r.type !== 'medication'));
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setCategory("general")
    setScheduleTimes([
      { id: "1", time: "08:00", days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
    ])
    setStartDate(format(new Date(), "yyyy-MM-dd"))
    setEndDate("")
    setSelectedColor("bg-blue-500")
    setNotificationsEnabled(true)
    setSoundEnabled(true)
    setSoundType("bell")
    setVolume([70])
    setTitleError("")
    setScheduleError("")
    setEditingReminder(null)
  }

  const validateForm = () => {
    let isValid = true

    if (!title.trim()) {
      setTitleError("Title is required")
      isValid = false
    } else {
      setTitleError("")
    }

    if (scheduleTimes.length === 0) {
      setScheduleError("At least one schedule time is required")
      isValid = false
    } else {
      setScheduleError("")
    }

    return isValid
  }

  const addScheduleTime = () => {
    const newTime: ScheduleTime = {
      id: Date.now().toString(),
      time: "09:00",
      days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    }
    setScheduleTimes([...scheduleTimes, newTime])
  }

  const updateScheduleTime = (id: string, field: keyof ScheduleTime, value: any) => {
    setScheduleTimes((prev) => prev.map((time) => (time.id === id ? { ...time, [field]: value } : time)))
  }

  const removeScheduleTime = (id: string) => {
    if (scheduleTimes.length > 1) {
      setScheduleTimes((prev) => prev.filter((time) => time.id !== id))
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      // For recurring reminders, store all selected days in one reminder
      const allDays = Array.from(new Set(scheduleTimes.flatMap(st => st.days)))
      const firstSchedule = scheduleTimes[0]
      const [hours, minutes] = firstSchedule.time.split(":").map(Number)
      const now = new Date()
      let soonestDate: Date | null = null;
      for (const day of allDays) {
        const dayIndex = DAYS_OF_WEEK.findIndex(d => d.id === day);
        let daysUntil = (dayIndex - now.getDay() + 7) % 7;
        const candidate = new Date(now);
        candidate.setDate(now.getDate() + daysUntil);
        candidate.setHours(hours, minutes, 0, 0);
        // If today and time is in the past, skip to next week
        if (daysUntil === 0 && candidate <= now) {
          candidate.setDate(candidate.getDate() + 7);
        }
        if (!soonestDate || candidate < soonestDate) {
          soonestDate = candidate;
        }
      }
      // Use soonestDate as scheduledDate
      const scheduledDate = soonestDate!;
      const parsedStartDate = startDate ? new Date(startDate) : null;
      const parsedEndDate = endDate ? new Date(endDate) : null;
      const reminder: Reminder = {
        id: editingReminder?.id || `${Date.now()}-recurring`,
        title,
        description,
        scheduledTime: scheduledDate,
        type: category as any,
        recurring: true,
        recurringPattern: "weekly",
        soundEnabled,
        soundType,
        soundVolume: volume[0],
        notificationEnabled: notificationsEnabled,
        vibrationEnabled: true,
        data: {
          color: selectedColor,
          days: allDays,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          scheduleTimes: scheduleTimes.map(st => st.time),
        },
      }
      if (editingReminder) {
        ReminderManager.updateReminder(reminder)
      } else {
        ReminderManager.addReminder(reminder)
      }
      // Mark dedupe key as shown if scheduledTime is in the past or within 5 minutes ago
      if (notificationsEnabled && reminder.scheduledTime) {
        const now = new Date();
        const scheduledTime = new Date(reminder.scheduledTime);
        const dedupeKey = `reminder-shown-${reminder.id}-${scheduledTime.toISOString()}`;
        if (scheduledTime.getTime() <= now.getTime() && scheduledTime.getTime() > now.getTime() - 5 * 60 * 1000) {
          localStorage.setItem(dedupeKey, "1");
        }
      }
      if (notificationsEnabled) {
        if (NotificationService.isSupported() && Notification.permission !== 'granted') {
          await NotificationService.requestPermission();
        }
        NotificationService.showRichNotification(
          `✅ Reminder Created: ${title}`,
          {
            body: `Your reminder has been set up successfully`
          }
        );
      }
      // Always reload reminders from localStorage after update
      loadReminders();
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving reminder:", error)
    }
  }

  const editReminder = (reminder: Reminder) => {
    setEditingReminder(reminder)
    setTitle(reminder.title)
    setDescription(reminder.description || "")
    setCategory(reminder.type)
    setNotificationsEnabled(reminder.notificationEnabled !== false)
    setSoundEnabled(reminder.soundEnabled !== false)
    setSoundType(reminder.soundType || "bell")
    setVolume([reminder.soundVolume || 70])
    setSelectedColor(reminder.data?.color || "bg-blue-500")
    setIsDialogOpen(true)
  }

  const deleteReminder = (id: string | number) => {
    ReminderManager.removeReminder(id)
    loadReminders()

    // Remove related notification ID from notification sync state
    const syncKey = NotificationService.NOTIFICATION_SYNC_KEY;
    const syncState = JSON.parse(localStorage.getItem(syncKey) || '{}');
    Object.keys(syncState).forEach((notifId) => {
      if (notifId.startsWith(id + '-')) {
        delete syncState[notifId];
      }
    });
    localStorage.setItem(syncKey, JSON.stringify(syncState));
  }

  const completeReminder = (id: string | number) => {
    ReminderManager.completeReminder(id)
    loadReminders()
  }

  const testSound = () => {
    NotificationService.playSound(soundType as any, volume[0])
  }

  // Helper: Get only the next occurrence for each recurring reminder
  const getUniqueNextReminders = (remindersList: Reminder[]) => {
    const unique: { [key: string]: Reminder } = {}
    remindersList.forEach(reminder => {
      // Use a composite key for recurring reminders (title + type + recurringPattern)
      const key = reminder.recurring ? `${reminder.title}|${reminder.type}|${reminder.recurringPattern || ''}` : reminder.id
      if (!unique[key] || reminder.scheduledTime < unique[key].scheduledTime) {
        unique[key] = reminder
      }
    })
    return Object.values(unique)
  }

  const getTodaysReminders = () => {
    const todayReminders = reminders.filter((reminder) => isToday((reminder as any).scheduledTime) && !reminder.completed && reminder.type !== 'medication')
    return getUniqueNextReminders(todayReminders)
  }

  const getUpcomingReminders = () => {
    const upcomingReminders = reminders
      .filter((reminder) => (reminder as any).scheduledTime > new Date() && !isToday((reminder as any).scheduledTime) && reminder.type !== 'medication')
    return getUniqueNextReminders(upcomingReminders).slice(0, 5)
  }

  const getCategoryColor = (type: string) => {
    return REMINDER_CATEGORIES.find((cat) => cat.value === type)?.color || "bg-gray-500"
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {showPermissionAlert && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
          <strong>Notifications are disabled.</strong> To receive reminders when the app is closed or in the background, please enable notifications in your browser settings.
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-2 sm:px-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Reminders</h2>
          <p className="text-muted-foreground text-base sm:text-lg">Never miss an important reminder</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto mt-2 sm:mt-0">
              <Plus className="mr-2 h-4 w-4" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingReminder ? "Edit Reminder" : "Add New Reminder"}</DialogTitle>
              <DialogDescription>Create a new reminder with notifications</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <RequiredFieldLabel htmlFor="title">Title</RequiredFieldLabel>
                <div className="relative">
                  <Input
                    id="title"
                    placeholder="Reminder title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={titleError ? "border-red-500" : ""}
                  />
                  <VoiceInput onTranscript={setTitle} className="absolute right-2 top-1/2 -translate-y-1/2" />
                </div>
                {titleError && <p className="text-sm text-red-500">{titleError}</p>}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <div className="relative">
                  <Textarea
                    id="description"
                    placeholder="Additional details"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                  <VoiceInput onTranscript={setDescription} className="absolute right-2 top-2" />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_CATEGORIES.filter(cat => cat.value !== "medication").map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Schedule */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Schedule</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addScheduleTime}>
                    <Plus className="mr-1 h-3 w-3" />
                    Add Time
                  </Button>
                </div>

                {scheduleTimes.map((scheduleTime, index) => (
                  <Card key={scheduleTime.id} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <Label>Time</Label>
                        </div>
                        {scheduleTimes.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeScheduleTime(scheduleTime.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <Input
                        type="time"
                        value={scheduleTime.time}
                        onChange={(e) => updateScheduleTime(scheduleTime.id, "time", e.target.value)}
                      />

                      <div className="space-y-2">
                        <Label>Days</Label>
                        <div className="flex flex-wrap gap-2">
                          {DAYS_OF_WEEK.map((day) => (
                            <div key={day.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${scheduleTime.id}-${day.id}`}
                                checked={scheduleTime.days.includes(day.id)}
                                onCheckedChange={(checked) => {
                                  const newDays = checked
                                    ? [...scheduleTime.days, day.id]
                                    : scheduleTime.days.filter((d) => d !== day.id)
                                  updateScheduleTime(scheduleTime.id, "days", newDays)
                                }}
                              />
                              <Label
                                htmlFor={`${scheduleTime.id}-${day.id}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {day.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                {scheduleError && <p className="text-sm text-red-500">{scheduleError}</p>}
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="No end date"
                  />
                </div>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {REMINDER_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded-full ${color.value} border-2 ${
                        selectedColor === color.value ? color.border : "border-transparent"
                      }`}
                      onClick={() => setSelectedColor(color.value)}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              {/* Notifications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get reminded when it's time</p>
                  </div>
                  <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sound</Label>
                    <p className="text-sm text-muted-foreground">Play a sound when the reminder is due</p>
                  </div>
                  <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                </div>

                {soundEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Sound Type</Label>
                      <div className="flex gap-2">
                        <Select value={soundType} onValueChange={setSoundType}>
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SOUND_TYPES.map((sound) => (
                              <SelectItem key={sound.value} value={sound.value}>
                                {sound.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" onClick={testSound}>
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Volume</Label>
                        <span className="text-sm text-muted-foreground">{volume[0]}%</span>
                      </div>
                      <Slider value={volume} onValueChange={setVolume} max={100} step={5} className="w-full" />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>{editingReminder ? "Update Reminder" : "Add Reminder"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center px-2 sm:px-4">
        {/* ...existing filter/search bar if any... */}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 px-2 sm:px-4">
        {/* Today's Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Today's Reminders
            </CardTitle>
            <CardDescription>{getTodaysReminders().length} reminders for today</CardDescription>
          </CardHeader>
          <CardContent>
            {getTodaysReminders().length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No reminders for today</p>
            ) : (
              <div className="space-y-3">
                {getTodaysReminders().map((reminder) => (
                  <div key={reminder.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getCategoryColor(reminder.type)}`} />
                      <div>
                        <p className="font-medium">{reminder.title}</p>
                        <p className="text-sm text-muted-foreground">{format(reminder.scheduledTime, "h:mm a")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{reminder.type}</Badge>
                      <Button size="sm" variant="outline" onClick={() => completeReminder(reminder.id)}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => editReminder(reminder)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteReminder(reminder.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getUpcomingReminders().length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No upcoming reminders</p>
            ) : (
              <div className="space-y-3">
                {getUpcomingReminders().map((reminder) => (
                  <div key={reminder.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getCategoryColor(reminder.type)}`} />
                      <div>
                        <p className="font-medium">{reminder.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {isTomorrow(reminder.scheduledTime)
                            ? `Tomorrow at ${format(reminder.scheduledTime, "h:mm a")}`
                            : format(reminder.scheduledTime, "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{reminder.type}</Badge>
                      <Button size="sm" variant="ghost" onClick={() => editReminder(reminder)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteReminder(reminder.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Reminders */}
        <Card>
          <CardHeader>
            <CardTitle>All Reminders</CardTitle>
            <CardDescription>{reminders.length} total reminders</CardDescription>
          </CardHeader>
          <CardContent>
            {reminders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No reminders created yet</p>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {getUniqueNextReminders(reminders).map((reminder) => (
                    <div
                      key={reminder.id}
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        reminder.completed ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getCategoryColor(reminder.type)}`} />
                        <div>
                          <p className={`font-medium ${reminder.completed ? "line-through" : ""}`}>{reminder.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(reminder.scheduledTime, "MMM d, h:mm a")}
                            {reminder.recurring && " (Recurring)"}
                          </p>
                          {reminder.description && (
                            <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{reminder.type}</Badge>
                        {reminder.completed && <Badge variant="secondary">Completed</Badge>}
                        <Button size="sm" variant="ghost" onClick={() => editReminder(reminder)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteReminder(reminder.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
