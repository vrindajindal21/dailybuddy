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
  static isInitialized = false
  static currentTimerId: string | null = null

  static initialize() {
    if (this.isInitialized) return
    this.loadTimer()
    window.addEventListener("start-pomodoro-timer", this.handleStart as EventListener)
    window.addEventListener("stop-pomodoro-timer", this.handleStop as EventListener)
    this.setupServiceWorkerCommunication()
    this.requestServiceWorkerSync() // Get current state on startup
    this.isInitialized = true
    console.log('[PomodoroManager] Initialized - Service Worker Primary Timer')
  }

  static setupServiceWorkerCommunication() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'POMODORO_COMPLETE') {
          this.handleServiceWorkerTimerComplete(event.data.timer)
        } else if (event.data.type === 'POMODORO_SYNC') {
          this.syncWithServiceWorker(event.data.timers)
        } else if (event.data.type === 'POMODORO_TICK') {
          this.updateTimerFromServiceWorker(event.data.timer)
        } else if (event.data.type === 'POMODORO_STATE_UPDATE') {
          this.updateTimerFromServiceWorker(event.data.timer)
        }
      })
    }
  }

  static requestServiceWorkerSync() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'POMODORO_SYNC_REQUEST'
      })
    }
  }

  static updateTimerFromServiceWorker(serviceWorkerTimer: any) {
    if (serviceWorkerTimer) {
      this.timer = {
        isActive: serviceWorkerTimer.isActive,
        isPaused: serviceWorkerTimer.isPaused,
        mode: serviceWorkerTimer.mode,
        duration: serviceWorkerTimer.duration,
        timeLeft: serviceWorkerTimer.timeLeft,
        startTimestamp: serviceWorkerTimer.startTime,
        task: serviceWorkerTimer.task || ""
      }
      this.currentTimerId = serviceWorkerTimer.id
      this.saveTimer()
      
      // Dispatch update event for UI
      window.dispatchEvent(new CustomEvent("pomodoro-timer-update", {
        detail: { timer: this.timer }
      }))
    }
  }

  static handleStart = (e: any) => {
    window.dispatchEvent(new CustomEvent("pomodoro-stop-repeat"));
    const { duration, mode, task } = e.detail
    const now = Date.now()
    
    // Create timer data for service worker
    const timerData = {
      id: `pomodoro-${now}-${Math.random().toString(36).substr(2, 9)}`,
      mode: mode || "pomodoro",
      duration,
      task: task || "",
      startTime: now
    }
    
    // Send to service worker - it will handle all timing
    this.sendToServiceWorker('POMODORO_TIMER_START', {
      timer: timerData
    })
    
    console.log('[PomodoroManager] Timer start requested to service worker:', timerData)
  }

  static handleStop = () => {
    // Stop service worker timer
    if (this.currentTimerId) {
      this.sendToServiceWorker('POMODORO_TIMER_STOP', { timerId: this.currentTimerId })
    }
    
    // Reset local state
    this.timer = { ...getInitialTimerState(), isActive: false }
    this.currentTimerId = null
    this.saveTimer()
    
    console.log('[PomodoroManager] Timer stop requested to service worker')
  }

  static handlePause = () => {
    if (this.currentTimerId) {
      this.sendToServiceWorker('POMODORO_TIMER_PAUSE', { timerId: this.currentTimerId })
    }
  }

  static handleResume = () => {
    if (this.currentTimerId) {
      this.sendToServiceWorker('POMODORO_TIMER_RESUME', { timerId: this.currentTimerId })
    }
  }

  static sendToServiceWorker(type: string, data: any) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      console.log('[PomodoroManager] Sending to SW:', type, data)
      navigator.serviceWorker.controller.postMessage({
        type,
        ...data
      })
    } else {
      console.warn('[PomodoroManager] No SW controller!')
    }
  }

  static handleServiceWorkerTimerComplete(timer: any) {
    console.log('[PomodoroManager] Service worker timer completed:', timer)
    this.showCompletionNotification(timer.mode, timer.duration / 60, timer.task)
    
    // Reset local state
    this.timer = { ...getInitialTimerState(), isActive: false }
    this.currentTimerId = null
    this.saveTimer()
  }

  static syncWithServiceWorker(serviceWorkerTimers: any[]) {
    // Sync timer state with service worker
    if (serviceWorkerTimers.length > 0) {
      const activeTimer = serviceWorkerTimers[0] // Get the first active timer
      if (activeTimer && activeTimer.isActive) {
        this.updateTimerFromServiceWorker(activeTimer)
        console.log('[PomodoroManager] Synced with service worker:', this.timer)
      } else {
        // No active timer, reset state
        this.timer = { ...getInitialTimerState(), isActive: false }
        this.currentTimerId = null
        this.saveTimer()
      }
    } else {
      // No timers, reset state
      this.timer = { ...getInitialTimerState(), isActive: false }
      this.currentTimerId = null
      this.saveTimer()
    }
  }

  static loadTimer() {
    this.timer = getInitialTimerState()
  }

  static saveTimer() {
    if (typeof window !== "undefined") {
      localStorage.setItem(POMODORO_TIMER_KEY, JSON.stringify(this.timer))
    }
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
            type: isPomodoro ? "success" : "info",
            duration: 5000,
          },
        },
      })
    )
  }

  static getTimer() {
    return this.timer
  }
} 