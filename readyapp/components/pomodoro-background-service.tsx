"use client"

import { useEffect, useRef, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { NotificationService } from "@/lib/notification-service"
import { PomodoroManager } from "@/lib/pomodoro-manager"

// Timer state keys for localStorage
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

export function PomodoroBackgroundService() {
  const { toast } = useToast()
  const [timer, setTimer] = useState(getInitialTimerState())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Save timer state to localStorage
  const saveTimer = (t: any) => {
    localStorage.setItem(POMODORO_TIMER_KEY, JSON.stringify(t))
    // Also sync to 'pomodoro-state' for global notifications
    localStorage.setItem("pomodoro-state", JSON.stringify({
      isActive: t.isActive,
      startTime: t.startTimestamp,
      originalDuration: t.duration,
      timeLeft: t.timeLeft,
      mode: t.mode,
      sessionCount: t.sessionCount || 0,
      currentTask: t.task || "",
    }))
  }

  // Listen for start/stop events from any page
  useEffect(() => {
    const handleStart = (e: any) => {
      const { duration, mode, task } = e.detail
      const now = Date.now()
      const newTimer = {
        isActive: true,
        isPaused: false,
        mode: mode || "pomodoro",
        duration,
        timeLeft: duration,
        startTimestamp: now,
        task: task || "",
      }
      setTimer(newTimer)
      saveTimer(newTimer)
    }
    const handleStop = () => {
      setTimer({ ...getInitialTimerState(), isActive: false })
      saveTimer({ ...getInitialTimerState(), isActive: false })
    }
    const handleReset = () => {
      setTimer(getInitialTimerState())
      saveTimer(getInitialTimerState())
    }
    window.addEventListener("start-pomodoro-timer", handleStart as EventListener)
    window.addEventListener("stop-pomodoro-timer", handleStop as EventListener)
    window.addEventListener("reset-pomodoro-timer", handleReset as EventListener)
    return () => {
      window.removeEventListener("start-pomodoro-timer", handleStart as EventListener)
      window.removeEventListener("stop-pomodoro-timer", handleStop as EventListener)
      window.removeEventListener("reset-pomodoro-timer", handleReset as EventListener)
    }
  }, [])

  // Resume timer from localStorage on mount
  useEffect(() => {
    const saved = getInitialTimerState()
    if (saved.isActive && saved.startTimestamp) {
      const elapsed = Math.floor((Date.now() - saved.startTimestamp) / 1000)
      const newTimeLeft = Math.max(saved.duration - elapsed, 0)
      if (newTimeLeft > 0) {
        setTimer({ ...saved, timeLeft: newTimeLeft })
      } else {
        setTimer({ ...getInitialTimerState(), isActive: false })
      }
    }
  }, [])

  // Timer countdown effect
  useEffect(() => {
    if (timer.isActive && !timer.isPaused && timer.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimer((prev: any) => {
          const newTimeLeft = prev.timeLeft - 1
          const updated = { ...prev, timeLeft: newTimeLeft }
          saveTimer(updated)
          if (newTimeLeft <= 0) {
            handleTimerComplete(prev)
            return { ...getInitialTimerState(), isActive: false }
          }
          return updated
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timer.isActive, timer.isPaused, timer.timeLeft])

  // Timer completion logic
  const handleTimerComplete = (prevTimer: any) => {
    showCompletionNotification(prevTimer.mode, prevTimer.duration / 60, prevTimer.task)
    playCompletionSound(prevTimer.mode)
    // Optionally, dispatch a global event for other listeners
    window.dispatchEvent(new CustomEvent("pomodoro-timer-complete", { detail: prevTimer }))
    // Clear timer state
    setTimer({ ...getInitialTimerState(), isActive: false })
    saveTimer({ ...getInitialTimerState(), isActive: false })
  }

  useEffect(() => {
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

    // Listen for Pomodoro completion events
    const handlePomodoroComplete = (event: CustomEvent) => {
      const { duration, breakDuration, task } = event.detail

      // Show completion popup/notification immediately
      showCompletionNotification("pomodoro", duration, task)

      // Play completion sound
      playCompletionSound("pomodoro")
    }

    const handleBreakComplete = (event: CustomEvent) => {
      const { duration } = event.detail

      // Show break completion notification
      showCompletionNotification("break", duration)

      // Play completion sound
      playCompletionSound("break")
    }

    // Add event listeners
    window.addEventListener("pomodoro-complete", handlePomodoroComplete as EventListener)
    window.addEventListener("pomodoro-break", handleBreakComplete as EventListener)

    return () => {
      // Cleanup
      window.removeEventListener("pomodoro-complete", handlePomodoroComplete as EventListener)
      window.removeEventListener("pomodoro-break", handleBreakComplete as EventListener)

      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [toast])

  const showCompletionNotification = (type: "pomodoro" | "break", duration: number, task?: string, sessionStartTime?: number) => {
    const isPomodoro = type === "pomodoro"
    // Use sessionStartTime for deduplication, fallback to Date.now() if not provided
    const stableSessionKey = sessionStartTime || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem("pomodoro-state") || '{}').startTime : Date.now());
    // Unified deduplication: Only show once per session
    const dedupeKey = `pomodoro-shown-${stableSessionKey}`
    if (localStorage.getItem(dedupeKey)) return
    localStorage.setItem(dedupeKey, "1")
    // Format duration for display
    let durationStr = "";
    if (duration < 1) {
      durationStr = `${Math.round(duration * 60)} seconds`;
    } else if (duration < 2) {
      durationStr = `${duration} minute`;
    } else {
      durationStr = `${duration} minutes`;
    }
    // Unified browser notification with NotificationService
    NotificationService.showNotification(
      isPomodoro ? "🍅 Pomodoro Complete!" : "☕ Break Time Over!",
      {
        body: isPomodoro
          ? `Excellent focus! You completed ${durationStr}${task ? ` working on: ${task}` : ""}.`
          : `Your ${durationStr} break is over. Time to get back to work!`,
        requireInteraction: true,
        tag: `pomodoro-${stableSessionKey}`,
      },
      isPomodoro ? "pomodoro" : "break",
      80
    )
    // Repeat alarm logic (sound every 30s for up to 5min or until dismissed)
    let repeatCount = 0;
    let repeatAlarm: NodeJS.Timeout | null = null;
    const playRepeatSound = () => {
      // Unified deduplication: Only play repeat sound once per session
      const soundDedupeKey = `pomodoro-shown-${stableSessionKey}`
      if (localStorage.getItem(soundDedupeKey)) return
      localStorage.setItem(soundDedupeKey, "1")
      playCompletionSound(type, stableSessionKey)
      repeatCount++
      if (repeatCount < 10 && repeatAlarm) {
        repeatAlarm = setTimeout(playRepeatSound, 30000)
      }
    }
    // Start repeat alarm
    repeatAlarm = setTimeout(playRepeatSound, 30000)
    // Stop repeat alarm when popup action is clicked
    const stopRepeat = () => {
      if (repeatAlarm) clearTimeout(repeatAlarm)
      repeatAlarm = null
      window.removeEventListener("pomodoro-stop-repeat", stopRepeat)
    }
    window.addEventListener("pomodoro-stop-repeat", stopRepeat)
    // In-app popup with action to stop repeat
    window.dispatchEvent(
      new CustomEvent("inAppNotification", {
        detail: {
          title: isPomodoro ? "🍅 Pomodoro Complete!" : "☕ Break Time Over!",
          options: {
            body: isPomodoro
              ? `Excellent focus! You completed ${durationStr}${task ? ` working on: ${task}` : ""}.`
              : `Your ${durationStr} break is over. Time to get back to work!`,
            actions: isPomodoro ? [
              {
                label: "Stop Alarm",
                action: () => {
                  window.dispatchEvent(new CustomEvent("pomodoro-stop-repeat"))
                }
              },
              {
                label: "Start 5min Break",
                action: () => {
                  window.dispatchEvent(new CustomEvent("pomodoro-stop-repeat"))
                  window.dispatchEvent(new CustomEvent("start-pomodoro-timer", {
                    detail: { duration: 300, mode: "shortBreak" }
                  }))
                }
              }
            ] : []
          },
        },
      })
    )
    // --- NEW: Dispatch show-popup event for SmartPopupSystem ---
    if (isPomodoro) {
      window.dispatchEvent(
        new CustomEvent("show-popup", {
          detail: {
            type: "pomodoro-complete",
            title: "🍅 Pomodoro Complete!",
            message: `Excellent focus! You completed ${durationStr}${task ? ` working on: ${task}` : ""}.`,
            duration: 10000,
            priority: "high",
            actions: [
              {
                label: "Start 5min Break",
                action: () => {
                  toast({
                    title: "☕ Break Started",
                    description: "Enjoy your 5-minute break!",
                  })
                  window.dispatchEvent(new CustomEvent("start-pomodoro-timer", {
                    detail: { duration: 300, mode: "shortBreak" }
                  }))
                },
              },
              {
                label: "Stop Alarm",
                action: () => {
                  window.dispatchEvent(new CustomEvent("pomodoro-stop-repeat"))
                },
                variant: "outline"
              }
            ],
          },
        })
      )
    }
  }

  const playCompletionSound = (type: "pomodoro" | "break", sessionKey?: number) => {
    try {
      if (!audioContextRef.current) return
      // Unified deduplication: Only play sound once per session
      const soundDedupeKey = `pomodoro-shown-${sessionKey || ''}`
      if (localStorage.getItem(soundDedupeKey)) return
      localStorage.setItem(soundDedupeKey, "1")
      const audioContext = audioContextRef.current
      if (audioContext.state === "suspended") {
        audioContext.resume()
      }

      // Get sound settings from localStorage
      const settings = JSON.parse(localStorage.getItem("pomodoro-settings") || "{}")
      const soundEnabled = settings.soundEnabled ?? true
      const soundVolume = settings.soundVolume || 70
      const selectedSound = settings.selectedSound || "bell"

      if (!soundEnabled) return

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      // Different sounds for pomodoro vs break completion
      const soundPresets: Record<string, { frequency: number; duration: number; type: OscillatorType }> = {
        bell: { frequency: type === "pomodoro" ? 830 : 660, duration: 1.5, type: "sine" },
        chime: { frequency: type === "pomodoro" ? 1000 : 800, duration: 1.0, type: "sine" },
        beep: { frequency: type === "pomodoro" ? 800 : 600, duration: 0.3, type: "square" },
        ding: { frequency: type === "pomodoro" ? 1200 : 900, duration: 0.8, type: "triangle" },
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

      // For pomodoro completion, play a sequence of sounds
      if (type === "pomodoro") {
        setTimeout(() => {
          const oscillator2 = audioContext.createOscillator()
          const gainNode2 = audioContext.createGain()

          oscillator2.type = preset.type
          oscillator2.frequency.value = preset.frequency * 1.2

          gainNode2.gain.value = normalizedVolume * 0.7

          oscillator2.connect(gainNode2)
          gainNode2.connect(audioContext.destination)

          const now2 = audioContext.currentTime
          gainNode2.gain.setValueAtTime(normalizedVolume * 0.7, now2)
          gainNode2.gain.exponentialRampToValueAtTime(0.001, now2 + preset.duration * 0.8)

          oscillator2.start(now2)
          oscillator2.stop(now2 + preset.duration * 0.8)
        }, 200)
      }
    } catch (error) {
      console.error("Error playing completion sound:", error)
    }
  }

  useEffect(() => {
    PomodoroManager.initialize()
  }, [])

  // This component doesn't render anything visible
  return null
}
