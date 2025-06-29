"use client"

import { useEffect, useState, useRef } from "react"
import { Pause, Play, Square } from "lucide-react"
import { cn } from "@/lib/utils"

// Key used by PomodoroBackgroundService to persist state
const POMODORO_TIMER_KEY = "global_pomodoro_timer"

interface TimerState {
  isActive: boolean
  isPaused: boolean
  timeLeft: number // seconds
  duration: number
  mode: string
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export function PomodoroFloatingWidget() {
  const [timer, setTimer] = useState<TimerState | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    // Place near bottom left by default, but not off screen
    if (typeof window !== 'undefined') {
      return { x: 20, y: window.innerHeight - 140 }
    }
    return { x: 20, y: 500 }
  })
  const dragRef = useRef<HTMLDivElement | null>(null)
  const dragging = useRef(false)
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Initialize from localStorage and sync continuously
  useEffect(() => {
    const syncFromStorage = () => {
      const stored = localStorage.getItem(POMODORO_TIMER_KEY)
      if (!stored) return setTimer(null)
      const parsed = JSON.parse(stored)
      if (parsed.isActive) {
        setTimer(parsed)
      } else {
        setTimer(null)
      }
    }
    syncFromStorage()
    const interval = setInterval(syncFromStorage, 1000)
    window.addEventListener("storage", syncFromStorage)
    // Listen for custom event for instant updates
    const handlePomodoroUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.timer) {
        setTimer(event.detail.timer)
      }
    }
    window.addEventListener("pomodoro-timer-update", handlePomodoroUpdate as EventListener)
    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", syncFromStorage)
      window.removeEventListener("pomodoro-timer-update", handlePomodoroUpdate as EventListener)
    }
  }, [])

  // Listen for global start/stop events
  useEffect(() => {
    const handleStart = (e: any) => {
      const { duration, mode } = e.detail
      setTimer({
        isActive: true,
        isPaused: false,
        timeLeft: duration,
        duration,
        mode,
      })
    }
    const handleStop = () => {
      setTimer(null)
    }

    window.addEventListener("start-pomodoro-timer", handleStart as EventListener)
    window.addEventListener("stop-pomodoro-timer", handleStop as EventListener)
    return () => {
      window.removeEventListener("start-pomodoro-timer", handleStart as EventListener)
      window.removeEventListener("stop-pomodoro-timer", handleStop as EventListener)
    }
  }, [])

  // Drag handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      dragStart.current = { x: e.clientX, y: e.clientY }
      setPosition((pos) => ({ x: pos.x + dx, y: pos.y + dy }))
    }
    const handleMouseUp = () => {
      dragging.current = false
    }
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
  }

  // Only after all hooks:
  if (!timer || !timer.isActive) {
    return null
  }

  const pauseOrResume = () => {
    if (!timer) return
    const updated = { ...timer, isPaused: !timer.isPaused }
    setTimer(updated)
    // Persist to localStorage
    const saved = JSON.parse(localStorage.getItem(POMODORO_TIMER_KEY) || "{}")
    localStorage.setItem(POMODORO_TIMER_KEY, JSON.stringify({ ...saved, isPaused: updated.isPaused }))
  }

  const stopTimer = () => {
    window.dispatchEvent(new CustomEvent("stop-pomodoro-timer"))
  }

  const resetTimer = () => {
    window.dispatchEvent(new CustomEvent("reset-pomodoro-timer"))
  }

  return (
    <div
      ref={dragRef}
      className={cn(
        "fixed z-[9999] w-48 shadow-lg rounded-lg border bg-background p-3 select-none pointer-events-auto",
        collapsed ? "opacity-70" : ""
      )}
      style={{ left: position.x, top: position.y, cursor: "move" }}
      onMouseDown={handleMouseDown}
    >
      {!collapsed && (
        <div className="flex flex-col items-center">
          <div className="text-sm font-semibold capitalize mb-2">{timer.mode}</div>
          <div className="text-3xl font-mono mb-3">{formatTime(timer.timeLeft)}</div>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                pauseOrResume()
              }}
              className="p-1 rounded hover:bg-accent"
            >
              {timer.isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                stopTimer()
              }}
              className="p-1 rounded hover:bg-destructive/20"
            >
              <Square size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setCollapsed(true)
              }}
              className="ml-auto text-xs text-muted-foreground"
            >
              hide
            </button>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="flex items-center gap-2">
          <div className="text-sm font-mono">{formatTime(timer.timeLeft)}</div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setCollapsed(false)
            }}
            className="p-1 rounded hover:bg-accent"
          >
            <Play size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
