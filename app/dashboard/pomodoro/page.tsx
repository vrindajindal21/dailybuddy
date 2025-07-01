"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Settings,
  Clock,
  Coffee,
  Target,
  TrendingUp,
  Volume2,
  Plus,
  Save,
  Trash2,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/components/language-provider"
import { NotificationService } from '../../../lib/notification-service'

interface PomodoroSession {
  id: string
  type: "pomodoro" | "shortBreak" | "longBreak"
  duration: number
  startTime: number
  endTime?: number
  completed: boolean
  task?: string
}

interface PomodoroStats {
  totalSessions: number
  completedSessions: number
  totalFocusTime: number
  averageSessionLength: number
  streak: number
  todaySessions: number
}

const PRESET_TIMERS = [
  { name: "Classic Pomodoro", pomodoro: 25, shortBreak: 5, longBreak: 15 },
  { name: "Extended Focus", pomodoro: 45, shortBreak: 10, longBreak: 30 },
  { name: "Quick Sprints", pomodoro: 15, shortBreak: 3, longBreak: 10 },
  { name: "Deep Work", pomodoro: 90, shortBreak: 20, longBreak: 45 },
  { name: "Study Session", pomodoro: 50, shortBreak: 10, longBreak: 25 },
]

const POMODORO_TIMER_KEY = "global_pomodoro_timer"

export default function PomodoroPage() {
  const { toast } = useToast()
  const { t } = useLanguage()

  // Timer state from global manager
  const [timer, setTimer] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(POMODORO_TIMER_KEY)
      if (saved) return JSON.parse(saved)
    }
    return {
      isActive: false,
      isPaused: false,
      mode: "pomodoro",
      duration: 1500,
      timeLeft: 1500,
      startTimestamp: null,
      task: "",
    }
  })

  // Listen for timer updates via storage event and poll every second
  useEffect(() => {
    const updateTimer = () => {
      const saved = localStorage.getItem(POMODORO_TIMER_KEY)
      if (saved) setTimer(JSON.parse(saved))
    }
    
    // Listen for storage changes
    window.addEventListener("storage", updateTimer)
    
    // Listen for timer updates from service worker
    const handleTimerUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.timer) {
        setTimer(event.detail.timer)
      }
    }
    
    // Listen for service worker messages
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data.type === 'POMODORO_STATE_UPDATE' || 
          event.data.type === 'POMODORO_SYNC' || 
          event.data.type === 'KEEP_ALIVE') {
        if (event.data.timer) {
          setTimer(event.data.timer)
        } else if (event.data.timers && event.data.timers.length > 0) {
          setTimer(event.data.timers[0])
        }
      }
    }
    
    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)
    }
    
    // Poll every second for updates (fallback)
    const interval = setInterval(updateTimer, 1000)
    
    return () => {
      window.removeEventListener("storage", updateTimer)
      window.removeEventListener("pomodoro-timer-update", handleTimerUpdate as EventListener)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
      }
      clearInterval(interval)
    }
  }, [])

  // Timer state
  const [sessionCount, setSessionCount] = useState(0)
  const [currentTask, setCurrentTask] = useState("")

  // Custom timer settings
  const [customPomodoro, setCustomPomodoro] = useState(25)
  const [customShortBreak, setCustomShortBreak] = useState(5)
  const [customLongBreak, setCustomLongBreak] = useState(15)
  const [longBreakInterval, setLongBreakInterval] = useState(4)
  const [selectedPreset, setSelectedPreset] = useState("Classic Pomodoro")

  // Quick custom time inputs
  const [customMinutes, setCustomMinutes] = useState(25)
  const [customSeconds, setCustomSeconds] = useState(0)

  // Custom timer creation
  const [showCustomTimerDialog, setShowCustomTimerDialog] = useState(false)
  const [newTimerName, setNewTimerName] = useState("")
  const [newTimerPomodoro, setNewTimerPomodoro] = useState(25)
  const [newTimerShortBreak, setNewTimerShortBreak] = useState(5)
  const [newTimerLongBreak, setNewTimerLongBreak] = useState(15)
  const [customTimers, setCustomTimers] = useState<typeof PRESET_TIMERS>([])

  // Audio settings
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [soundVolume, setSoundVolume] = useState(70)
  const [selectedSound, setSelectedSound] = useState("bell")

  // Notification settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [autoStartBreaks, setAutoStartBreaks] = useState(false)
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(false)

  // Session tracking
  const [sessions, setSessions] = useState<PomodoroSession[]>([])
  const [stats, setStats] = useState<PomodoroStats>({
    totalSessions: 0,
    completedSessions: 0,
    totalFocusTime: 0,
    averageSessionLength: 0,
    streak: 0,
    todaySessions: 0,
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const startTimeRef = useRef<number | null>(null)

  // Load saved data on mount
  useEffect(() => {
    loadSavedData()
    loadSettings()

    // Initialize audio context
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const loadSavedData = () => {
    try {
      const savedSessions = localStorage.getItem("pomodoro-sessions")
      if (savedSessions) {
        const parsedSessions = JSON.parse(savedSessions)
        setSessions(parsedSessions)
        calculateStats(parsedSessions)
      }

      const savedState = localStorage.getItem("pomodoro-state")
      if (savedState) {
        const state = JSON.parse(savedState)
        const now = Date.now()

        // Check if the saved session is still valid (within last hour)
        if (state.timestamp && now - state.timestamp < 60 * 60 * 1000) {
          setTimer({
            ...timer,
            mode: state.mode,
            sessionCount: state.sessionCount,
            currentTask: state.currentTask || "",
            startTime: state.startTime,
            duration: state.originalDuration,
            timeLeft: Math.max(0, state.originalDuration - (now - state.startTime) / 1000),
            isActive: state.startTime !== null,
            startTimestamp: state.startTime,
          })
        } else {
          setTimer({
            ...timer,
            timeLeft: state.timeLeft || getDefaultDuration(state.mode),
            isActive: state.isActive,
            startTimestamp: state.startTime,
          })
        }
      }

      loadCustomTimers()
    } catch (error) {
      console.error("Error loading saved data:", error)
    }
  }

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem("pomodoro-settings")
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        setCustomPomodoro(settings.customPomodoro || 25)
        setCustomShortBreak(settings.customShortBreak || 5)
        setCustomLongBreak(settings.customLongBreak || 15)
        setLongBreakInterval(settings.longBreakInterval || 4)
        setSelectedPreset(settings.selectedPreset || "Classic Pomodoro")
        setSoundEnabled(settings.soundEnabled ?? true)
        setSoundVolume(settings.soundVolume || 70)
        setSelectedSound(settings.selectedSound || "bell")
        setNotificationsEnabled(settings.notificationsEnabled ?? true)
        setAutoStartBreaks(settings.autoStartBreaks || false)
        setAutoStartPomodoros(settings.autoStartPomodoros || false)
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const saveCurrentState = () => {
    const state = {
      mode: timer.mode,
      timeLeft: timer.timeLeft,
      isActive: timer.isActive,
      sessionCount: sessionCount,
      currentTask: currentTask,
      timestamp: Date.now(),
      startTime: timer.startTimestamp,
      originalDuration: timer.duration,
    }
    localStorage.setItem("pomodoro-state", JSON.stringify(state))
  }

  const saveSettings = () => {
    const settings = {
      customPomodoro,
      customShortBreak,
      customLongBreak,
      longBreakInterval,
      selectedPreset,
      soundEnabled,
      soundVolume,
      selectedSound,
      notificationsEnabled,
      autoStartBreaks,
      autoStartPomodoros,
    }
    localStorage.setItem("pomodoro-settings", JSON.stringify(settings))
  }

  const getDefaultDuration = (timerMode: string) => {
    switch (timerMode) {
      case "pomodoro":
        return customPomodoro * 60
      case "shortBreak":
        return customShortBreak * 60
      case "longBreak":
        return customLongBreak * 60
      default:
        return 25 * 60
    }
  }

  const calculateStats = (sessionList: PomodoroSession[]) => {
    const today = new Date().toDateString()
    const todaySessions = sessionList.filter((s) => new Date(s.startTime).toDateString() === today)

    const completedSessions = sessionList.filter((s) => s.completed)
    const pomodoroSessions = completedSessions.filter((s) => s.type === "pomodoro")

    const totalFocusTime = pomodoroSessions.reduce((total, session) => {
      return total + (session.duration || 0)
    }, 0)

    const averageSessionLength = pomodoroSessions.length > 0 ? totalFocusTime / pomodoroSessions.length : 0

    // Calculate streak (consecutive days with at least one completed pomodoro)
    let streak = 0
    const dates = [...new Set(pomodoroSessions.map((s) => new Date(s.startTime).toDateString()))].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    )

    for (let i = 0; i < dates.length; i++) {
      const date = new Date(dates[i])
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() - i)

      if (date.toDateString() === expectedDate.toDateString()) {
        streak++
      } else {
        break
      }
    }

    setStats({
      totalSessions: sessionList.length,
      completedSessions: completedSessions.length,
      totalFocusTime,
      averageSessionLength,
      streak,
      todaySessions: todaySessions.filter((s) => s.completed && s.type === "pomodoro").length,
    })
  }

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

  const handleTimerComplete = useCallback(async () => {
    if (soundEnabled) {
      playNotificationSound()
    }
    if (notificationsEnabled && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted') {
        await NotificationService.requestPermission()
      }
      NotificationService.showNotification(
        timer.mode === 'pomodoro' ? '🍅 Pomodoro Complete!' : '☕ Break Time Over!',
        {
          body:
            timer.mode === 'pomodoro'
              ? `Great work! You completed a ${customPomodoro}-minute focus session.`
              : `Break time is over. Ready to get back to work?`,
          icon: '/icon-192x192.png',
          requireInteraction: true,
          vibrate: [200, 100, 200],
        } as NotificationOptions & { vibrate?: number[] },
        selectedSound,
        soundVolume
      )
      // Dispatch in-app popup globally
      window.dispatchEvent(
        new CustomEvent('inAppNotification', {
          detail: {
            title: timer.mode === 'pomodoro' ? '🍅 Pomodoro Complete!' : '☕ Break Time Over!',
            options: {
              body:
                timer.mode === 'pomodoro'
                  ? `Great work! You completed a ${customPomodoro}-minute focus session.`
                  : `Break time is over. Ready to get back to work?`,
            },
          },
        })
      )
    }
    setTimer({
      ...timer,
      isActive: false,
      isPaused: false,
      timeLeft: getDefaultDuration(timer.mode),
      startTimestamp: null,
    })

    // Create session record
    const session: PomodoroSession = {
      id: Date.now().toString(),
      type: timer.mode,
      duration: getDefaultDuration(timer.mode),
      startTime: timer.startTimestamp || Date.now(),
      endTime: Date.now(),
      completed: true,
      task: currentTask || undefined,
    }

    // Update sessions
    const updatedSessions = [...sessions, session]
    setSessions(updatedSessions)
    localStorage.setItem("pomodoro-sessions", JSON.stringify(updatedSessions))
    calculateStats(updatedSessions)

    // Dispatch events for popup system - ONLY ON COMPLETION
    if (timer.mode === "pomodoro") {
      window.dispatchEvent(
        new CustomEvent("pomodoro-complete", {
          detail: {
            duration: customPomodoro,
            breakDuration: (sessionCount + 1) % longBreakInterval === 0 ? customLongBreak : customShortBreak,
            task: currentTask,
          },
        }),
      )
      setSessionCount((prev) => prev + 1)
    } else {
      window.dispatchEvent(
        new CustomEvent("pomodoro-break", {
          detail: {
            duration: timer.mode === "shortBreak" ? customShortBreak : customLongBreak,
          },
        }),
      )
    }

    // Auto-start next session
    if (timer.mode === "pomodoro" && autoStartBreaks) {
      startTimer()
    } else if (timer.mode !== "pomodoro" && autoStartPomodoros) {
      startTimer()
    }
  }, [
    timer,
    sessionCount,
    currentTask,
    soundEnabled,
    notificationsEnabled,
    autoStartBreaks,
    autoStartPomodoros,
    customPomodoro,
    customShortBreak,
    customLongBreak,
    longBreakInterval,
  ])

  // Refactored timer control functions to dispatch global events
  const startTimer = () => {
    window.dispatchEvent(
      new CustomEvent("start-pomodoro-timer", {
        detail: {
          duration: timer.timeLeft, // or getDefaultDuration(timer.mode)
          mode: timer.mode,
          task: currentTask,
        },
      })
    )
    toast({
      title: timer.mode === "pomodoro" ? "🎯 Focus Session Started" : "☕ Break Started",
      description:
        timer.mode === "pomodoro"
          ? `Stay focused for ${Math.floor(timer.timeLeft / 60)} minutes!`
          : `Enjoy your ${Math.floor(timer.timeLeft / 60)}-minute break!`,
    })
  }

  const pauseTimer = () => {
    window.dispatchEvent(new CustomEvent("pause-pomodoro-timer"))
  }

  const resumeTimer = () => {
    window.dispatchEvent(new CustomEvent("resume-pomodoro-timer"))
  }

  const stopTimer = () => {
    window.dispatchEvent(new CustomEvent("stop-pomodoro-timer"))
    toast({
      title: "⏹️ Timer Stopped",
      description: "Session ended early.",
    })
  }

  const resetTimer = () => {
    window.dispatchEvent(new CustomEvent("reset-pomodoro-timer"))
    setTimer({
      isActive: false,
      isPaused: false,
      mode: "pomodoro",
      duration: 1500,
      timeLeft: 1500,
      startTimestamp: null,
      task: "",
    })
  }

  const switchMode = (newMode: "pomodoro" | "shortBreak" | "longBreak") => {
    stopTimer()
    window.dispatchEvent(
      new CustomEvent("start-pomodoro-timer", {
        detail: {
          duration: getDefaultDuration(newMode),
          mode: newMode,
          task: currentTask,
        },
      })
    )
  }

  const applyPreset = (preset: (typeof PRESET_TIMERS)[0]) => {
    setCustomPomodoro(preset.pomodoro)
    setCustomShortBreak(preset.shortBreak)
    setCustomLongBreak(preset.longBreak)
    setSelectedPreset(preset.name)

    // Update current timer if not active
    if (!timer.isActive) {
      setTimer({
        ...timer,
        timeLeft: getDefaultDuration(timer.mode),
        startTimestamp: null,
      })
    }

    toast({
      title: "⚙️ Preset Applied",
      description: `Using ${preset.name} settings.`,
    })
  }

  const handleSetCustomTime = () => {
    const totalSeconds = customMinutes * 60 + customSeconds
    if (totalSeconds > 0) {
      window.dispatchEvent(
        new CustomEvent("start-pomodoro-timer", {
          detail: {
            duration: totalSeconds,
            mode: "pomodoro",
            task: currentTask,
          },
        })
      )
      toast({
        title: "⏰ Custom Timer Set!",
        description: `Timer set to ${customMinutes}:${customSeconds.toString().padStart(2, "0")}`,
      })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getProgress = () => {
    const total = getDefaultDuration(timer.mode)
    return ((total - timer.timeLeft) / total) * 100
  }

  const getModeColor = () => {
    switch (timer.mode) {
      case "pomodoro":
        return "bg-red-500"
      case "shortBreak":
        return "bg-green-500"
      case "longBreak":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getModeIcon = () => {
    switch (timer.mode) {
      case "pomodoro":
        return <Target className="h-5 w-5" />
      case "shortBreak":
        return <Coffee className="h-5 w-5" />
      case "longBreak":
        return <Coffee className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  const saveCustomTimer = () => {
    if (!newTimerName.trim()) {
      toast({
        title: "❌ Name Required",
        description: "Please enter a name for your custom timer.",
        variant: "destructive",
      })
      return
    }

    const newTimer = {
      name: newTimerName.trim(),
      pomodoro: newTimerPomodoro,
      shortBreak: newTimerShortBreak,
      longBreak: newTimerLongBreak,
    }

    const updatedCustomTimers = [...customTimers, newTimer]
    setCustomTimers(updatedCustomTimers)
    localStorage.setItem("custom-pomodoro-timers", JSON.stringify(updatedCustomTimers))

    // Reset form
    setNewTimerName("")
    setNewTimerPomodoro(25)
    setNewTimerShortBreak(5)
    setNewTimerLongBreak(15)
    setShowCustomTimerDialog(false)

    toast({
      title: "✅ Custom Timer Saved",
      description: `"${newTimer.name}" has been added to your presets.`,
    })
  }

  const deleteCustomTimer = (timerName: string) => {
    const updatedCustomTimers = customTimers.filter((timer) => timer.name !== timerName)
    setCustomTimers(updatedCustomTimers)
    localStorage.setItem("custom-pomodoro-timers", JSON.stringify(updatedCustomTimers))

    toast({
      title: "🗑️ Timer Deleted",
      description: `"${timerName}" has been removed.`,
    })
  }

  const loadCustomTimers = () => {
    try {
      const saved = localStorage.getItem("custom-pomodoro-timers")
      if (saved) {
        setCustomTimers(JSON.parse(saved))
      }
    } catch (error) {
      console.error("Error loading custom timers:", error)
    }
  }

  // Save settings when they change
  useEffect(() => {
    saveSettings()
  }, [
    customPomodoro,
    customShortBreak,
    customLongBreak,
    longBreakInterval,
    selectedPreset,
    soundEnabled,
    soundVolume,
    selectedSound,
    notificationsEnabled,
    autoStartBreaks,
    autoStartPomodoros,
  ])

  // Timer effect
  return (
    <div className="w-full max-w-3xl mx-auto p-2 sm:p-4">
      <div className="mb-6 px-2 sm:px-4">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">🍅 {t("pomodoroTimer")}</h1>
        <p className="text-muted-foreground text-base sm:text-lg">{t("pomodoroDescription")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-2 sm:px-4">
        {/* Main Timer */}
        <div className="md:col-span-2 lg:col-span-2">
          {/* Quick Custom Time Input */}
          <Card className="mb-4 sm:mb-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200 text-lg sm:text-xl">
                <Clock className="h-5 w-5" />
                Quick Custom Time
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Set any custom time instantly - no need to go to settings!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="999"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(Math.max(0, Math.min(999, Number.parseInt(e.target.value) || 0)))}
                    className="w-16 sm:w-20 text-center"
                    placeholder="25"
                  />
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={customSeconds}
                    onChange={(e) => setCustomSeconds(Math.max(0, Math.min(59, Number.parseInt(e.target.value) || 0)))}
                    className="w-16 sm:w-20 text-center"
                    placeholder="00"
                  />
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">sec</span>
                </div>
                <Button
                  onClick={handleSetCustomTime}
                  disabled={timer.isActive || (customMinutes === 0 && customSeconds === 0)}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm px-3 sm:px-4"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Set Timer
                </Button>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Total: {customMinutes}:{customSeconds.toString().padStart(2, "0")}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-4 sm:mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  {getModeIcon()}
                  {timer.mode === "pomodoro" ? "Focus Time" : timer.mode === "shortBreak" ? "Short Break" : "Long Break"}
                </CardTitle>
                <Badge variant="outline" className="capitalize text-xs sm:text-sm">
                  Session {sessionCount + 1}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Mode Selector */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={timer.mode === "pomodoro" ? "default" : "outline"}
                  size="sm"
                  onClick={() => switchMode("pomodoro")}
                  disabled={timer.isActive}
                  className={timer.mode === "pomodoro" ? "bg-red-500 hover:bg-red-600" : ""}
                >
                  <Target className="h-4 w-4 mr-1" />
                  Pomodoro
                </Button>
                <Button
                  variant={timer.mode === "shortBreak" ? "default" : "outline"}
                  size="sm"
                  onClick={() => switchMode("shortBreak")}
                  disabled={timer.isActive}
                  className={timer.mode === "shortBreak" ? "bg-green-500 hover:bg-green-600" : ""}
                >
                  <Coffee className="h-4 w-4 mr-1" />
                  Short Break
                </Button>
                <Button
                  variant={timer.mode === "longBreak" ? "default" : "outline"}
                  size="sm"
                  onClick={() => switchMode("longBreak")}
                  disabled={timer.isActive}
                  className={timer.mode === "longBreak" ? "bg-blue-500 hover:bg-blue-600" : ""}
                >
                  <Coffee className="h-4 w-4 mr-1" />
                  Long Break
                </Button>
              </div>

              {/* Timer Display */}
              <div className="text-center space-y-2 sm:space-y-4">
                <div className="text-5xl sm:text-6xl font-mono font-bold tracking-wider">{formatTime(timer.timeLeft)}</div>
                <Progress value={getProgress()} className="h-2 sm:h-3" />
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                  {!timer.isActive ? (
                    <Button onClick={startTimer} size="lg" className="px-8">
                      <Play className="h-5 w-5 mr-2" />
                      Start
                    </Button>
                  ) : timer.isPaused ? (
                    <Button onClick={resumeTimer} size="lg" className="px-8">
                      <Play className="h-5 w-5 mr-2" />
                      Resume
                    </Button>
                  ) : (
                    <Button onClick={pauseTimer} size="lg" variant="secondary" className="px-8">
                      <Pause className="h-5 w-5 mr-2" />
                      Pause
                    </Button>
                  )}

                  <Button onClick={stopTimer} variant="outline" size="lg" disabled={!timer.isActive && !timer.isPaused}>
                    <Square className="h-5 w-5 mr-2" />
                    Stop
                  </Button>

                  <Button onClick={resetTimer} variant="outline" size="lg">
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>

              {/* Current Task */}
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="current-task" className="text-xs sm:text-sm">What are you working on?</Label>
                <Input
                  id="current-task"
                  value={currentTask}
                  onChange={(e) => setCurrentTask(e.target.value)}
                  placeholder="Enter your current task..."
                  disabled={timer.isActive && !timer.isPaused}
                  className="text-xs sm:text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats & Settings */}
        <div className="space-y-4 sm:space-y-6">
          {/* Today's Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Today's Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{stats.todaySessions}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{stats.streak}</div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-lg font-semibold">{formatDuration(stats.totalFocusTime)}</div>
                <div className="text-sm text-muted-foreground">Total Focus Time</div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="timer" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="timer">Timer</TabsTrigger>
                  <TabsTrigger value="audio">Audio</TabsTrigger>
                  <TabsTrigger value="behavior">Behavior</TabsTrigger>
                </TabsList>

                <TabsContent value="timer" className="space-y-4">
                  {/* Preset Timers */}
                  <div className="space-y-3">
                    <Label>Preset Timers</Label>
                    <div className="grid gap-2">
                      {[...PRESET_TIMERS, ...customTimers].map((preset) => (
                        <div key={preset.name} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{preset.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {preset.pomodoro}m / {preset.shortBreak}m / {preset.longBreak}m
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => applyPreset(preset)} disabled={timer.isActive}>
                              Use
                            </Button>
                            {customTimers.some((t) => t.name === preset.name) && (
                              <Button size="sm" variant="outline" onClick={() => deleteCustomTimer(preset.name)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomTimerDialog(true)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Custom Timer
                    </Button>
                  </div>

                  {/* Manual Timer Settings */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Pomodoro Duration: {customPomodoro} minutes</Label>
                      <Slider
                        value={[customPomodoro]}
                        onValueChange={(value) => setCustomPomodoro(value[0])}
                        max={120}
                        min={1}
                        step={1}
                        disabled={timer.isActive}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Short Break: {customShortBreak} minutes</Label>
                      <Slider
                        value={[customShortBreak]}
                        onValueChange={(value) => setCustomShortBreak(value[0])}
                        max={30}
                        min={1}
                        step={1}
                        disabled={timer.isActive}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Long Break: {customLongBreak} minutes</Label>
                      <Slider
                        value={[customLongBreak]}
                        onValueChange={(value) => setCustomLongBreak(value[0])}
                        max={60}
                        min={1}
                        step={1}
                        disabled={timer.isActive}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Long Break Interval: Every {longBreakInterval} sessions</Label>
                      <Slider
                        value={[longBreakInterval]}
                        onValueChange={(value) => setLongBreakInterval(value[0])}
                        max={10}
                        min={2}
                        step={1}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="audio" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sound-enabled">Enable Sound</Label>
                    <Switch id="sound-enabled" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                  </div>

                  {soundEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Volume: {soundVolume}%</Label>
                        <Slider
                          value={[soundVolume]}
                          onValueChange={(value) => setSoundVolume(value[0])}
                          max={100}
                          min={0}
                          step={5}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Sound Type</Label>
                        <Select value={selectedSound} onValueChange={setSelectedSound}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bell">🔔 Bell</SelectItem>
                            <SelectItem value="chime">🎵 Chime</SelectItem>
                            <SelectItem value="beep">📢 Beep</SelectItem>
                            <SelectItem value="ding">🔊 Ding</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={playNotificationSound}
                        className="w-full"
                        disabled={!soundEnabled}
                      >
                        <Volume2 className="h-4 w-4 mr-2" />
                        Test Sound
                      </Button>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="behavior" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications-enabled">Browser Notifications</Label>
                    <Switch
                      id="notifications-enabled"
                      checked={notificationsEnabled}
                      onCheckedChange={setNotificationsEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-start-breaks">Auto-start Breaks</Label>
                    <Switch id="auto-start-breaks" checked={autoStartBreaks} onCheckedChange={setAutoStartBreaks} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-start-pomodoros">Auto-start Pomodoros</Label>
                    <Switch
                      id="auto-start-pomodoros"
                      checked={autoStartPomodoros}
                      onCheckedChange={setAutoStartPomodoros}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Custom Timer Creation Dialog */}
      {showCustomTimerDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <Card className="w-full max-w-xs sm:max-w-md">
            <CardHeader>
              <CardTitle>Create Custom Timer</CardTitle>
              <CardDescription>Design your own Pomodoro preset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timer-name">Timer Name</Label>
                <Input
                  id="timer-name"
                  value={newTimerName}
                  onChange={(e) => setNewTimerName(e.target.value)}
                  placeholder="My Custom Timer"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Pomodoro</Label>
                  <Input
                    type="number"
                    value={newTimerPomodoro}
                    onChange={(e) => setNewTimerPomodoro(Number.parseInt(e.target.value) || 25)}
                    min="1"
                    max="120"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Short Break</Label>
                  <Input
                    type="number"
                    value={newTimerShortBreak}
                    onChange={(e) => setNewTimerShortBreak(Number.parseInt(e.target.value) || 5)}
                    min="1"
                    max="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Long Break</Label>
                  <Input
                    type="number"
                    value={newTimerLongBreak}
                    onChange={(e) => setNewTimerLongBreak(Number.parseInt(e.target.value) || 15)}
                    min="1"
                    max="60"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={saveCustomTimer} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Timer
                </Button>
                <Button variant="outline" onClick={() => setShowCustomTimerDialog(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
