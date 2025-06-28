import { NotificationService } from "./notification-service"

const POMODORO_TIMER_KEY = "global_pomodoro_timer"

function getInitialTimerState() {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(POMODORO_TIMER_KEY)
    if (saved) return JSON.parse(saved)
  }
  return {
    isActive: false,
    isPaused: false,
    mode: "pomodoro",
    duration: 1500, // 25 min default
    timeLeft: 1500,
    startTimestamp: null,
    task: "",
  }
}

export class PomodoroManager {
  static timer = getInitialTimerState()
  static intervalRef: NodeJS.Timeout | null = null
  static isInitialized = false
  static currentTimerId: string | null = null

  static initialize() {
    if (this.isInitialized) return
    this.loadTimer()
    window.addEventListener("start-pomodoro-timer", this.handleStart as EventListener)
    window.addEventListener("stop-pomodoro-timer", this.handleStop as EventListener)
    this.startBackgroundCountdown()
    this.setupServiceWorkerCommunication()
    this.isInitialized = true
    console.log('[PomodoroManager] Initialized')
  }

  static setupServiceWorkerCommunication() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'POMODORO_COMPLETE') {
          this.handleServiceWorkerTimerComplete(event.data.timer)
        } else if (event.data.type === 'POMODORO_SYNC') {
          this.syncWithServiceWorker(event.data.timers)
        }
      })
    }
  }

  static handleStart = (e: any) => {
    window.dispatchEvent(new CustomEvent("pomodoro-stop-repeat"));
    const { duration, mode, task } = e.detail
    const now = Date.now()
    this.timer = {
      isActive: true,
      isPaused: false,
      mode: mode || "pomodoro",
      duration,
      timeLeft: duration,
      startTimestamp: now,
      task: task || "",
    }
    this.saveTimer()
    this.startBackgroundCountdown()
    
    // Send to service worker for background timing
    this.sendToServiceWorker('POMODORO_TIMER_START', {
      timer: {
        mode: this.timer.mode,
        duration: this.timer.duration,
        task: this.timer.task
      }
    })
    
    console.log('[PomodoroManager] Timer started', this.timer)
  }

  static handleStop = () => {
    this.timer = { ...getInitialTimerState(), isActive: false }
    this.saveTimer()
    this.clearCountdown()
    
    // Stop service worker timer
    if (this.currentTimerId) {
      this.sendToServiceWorker('POMODORO_TIMER_STOP', { timerId: this.currentTimerId })
      this.currentTimerId = null
    }
    
    console.log('[PomodoroManager] Timer stopped')
  }

  static sendToServiceWorker(type: string, data: any) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type,
        ...data
      })
    }
  }

  static handleServiceWorkerTimerComplete(timer: any) {
    console.log('[PomodoroManager] Service worker timer completed:', timer)
    this.showCompletionNotification(timer.mode, timer.duration / 60, timer.task)
    this.timer = { ...getInitialTimerState(), isActive: false }
    this.saveTimer()
    this.currentTimerId = null
  }

  static syncWithServiceWorker(serviceWorkerTimers: any[]) {
    // Sync timer state with service worker
    if (serviceWorkerTimers.length > 0) {
      const activeTimer = serviceWorkerTimers[0] // Get the first active timer
      if (activeTimer && activeTimer.isActive) {
        this.timer = {
          isActive: activeTimer.isActive,
          isPaused: activeTimer.isPaused,
          mode: activeTimer.mode,
          duration: activeTimer.duration,
          timeLeft: activeTimer.timeLeft,
          startTimestamp: activeTimer.startTime,
          task: activeTimer.task
        }
        this.currentTimerId = activeTimer.id
        this.saveTimer()
        console.log('[PomodoroManager] Synced with service worker:', this.timer)
      }
    }
  }

  static loadTimer() {
    this.timer = getInitialTimerState()
  }

  static saveTimer() {
    localStorage.setItem(POMODORO_TIMER_KEY, JSON.stringify(this.timer))
  }

  static startBackgroundCountdown() {
    this.clearCountdown()
    if (this.timer.isActive && !this.timer.isPaused && this.timer.timeLeft > 0) {
      this.intervalRef = setInterval(() => {
        this.timer.timeLeft -= 1
        this.saveTimer()
        console.log('[PomodoroManager] Timer tick', this.timer.timeLeft)
        if (this.timer.timeLeft <= 0) {
          this.handleTimerComplete()
          this.clearCountdown()
        }
      }, 1000)
      console.log('[PomodoroManager] Countdown started')
    }
  }

  static clearCountdown() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef)
      this.intervalRef = null
    }
  }

  static handleTimerComplete() {
    console.log('[PomodoroManager] Timer complete, dispatching notifications')
    this.showCompletionNotification(this.timer.mode, this.timer.duration / 60, this.timer.task)
    this.timer = { ...getInitialTimerState(), isActive: false }
    this.saveTimer()
  }

  static showCompletionNotification(type: "pomodoro" | "break", duration: number, task?: string) {
    const isPomodoro = type === "pomodoro"
    let durationStr = ""
    if (duration < 1) {
      durationStr = `${Math.round(duration * 60)} seconds`
    } else if (duration < 2) {
      durationStr = `${duration} minute`
    } else {
      durationStr = `${duration} minutes`
    }
    console.log('[PomodoroManager] Showing notification and in-app popup')
    NotificationService.showNotification(
      isPomodoro ? "🍅 Pomodoro Complete!" : "☕ Break Time Over!",
      {
        body: isPomodoro
          ? `Excellent focus! You completed ${durationStr}${task ? ` working on: ${task}` : ""}.`
          : `Your ${durationStr} break is over. Time to get back to work!`,
        requireInteraction: true,
        tag: `pomodoro-${Date.now()}`,
      },
      isPomodoro ? "pomodoro" : "break",
      80
    )
    window.dispatchEvent(
      new CustomEvent("inAppNotification", {
        detail: {
          key: `pomodoro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: isPomodoro ? "🍅 Pomodoro Complete!" : "☕ Break Time Over!",
          options: {
            body: isPomodoro
              ? `Excellent focus! You completed ${durationStr}${task ? ` working on: ${task}` : ""}.`
              : `Your ${durationStr} break is over. Time to get back to work!`,
          },
        },
      })
    )
  }

  static getTimer() {
    return getInitialTimerState()
  }
} 