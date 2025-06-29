"use client"

import { useEffect, useState, useRef } from "react"
import { Pause, Play, Square, X } from "lucide-react"
import { cn } from "@/lib/utils"

// Key used by PomodoroBackgroundService to persist state
const POMODORO_TIMER_KEY = "global_pomodoro_timer"

interface TimerState {
  isActive: boolean
  isPaused: boolean
  timeLeft: number // seconds
  duration: number
  mode: string
  task?: string
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export function PomodoroFloatingWidget() {
  const [timer, setTimer] = useState<TimerState | null>(null)
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
      if (!stored) {
        setTimer(null)
        return
      }
      
      try {
        const parsed = JSON.parse(stored)
        if (parsed.isActive && parsed.timeLeft > 0) {
          setTimer(parsed)
        } else {
          setTimer(null)
        }
      } catch (error) {
        console.error('Error parsing timer state:', error)
        setTimer(null)
      }
    }

    // Initial sync
    syncFromStorage()
    
    // Sync every second
    const interval = setInterval(syncFromStorage, 1000)
    
    // Listen for storage changes (from other tabs/windows)
    window.addEventListener("storage", syncFromStorage)
    
    // Listen for custom events for instant updates
    const handlePomodoroUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.timer) {
        setTimer(event.detail.timer)
      }
    }
    
    // Listen for timer completion events
    const handleTimerComplete = () => {
      setTimer(null)
    }
    
    // Listen for timer stop events
    const handleTimerStop = () => {
      setTimer(null)
    }
    
    window.addEventListener("pomodoro-timer-update", handlePomodoroUpdate as EventListener)
    window.addEventListener("pomodoro-timer-complete", handleTimerComplete as EventListener)
    window.addEventListener("stop-pomodoro-timer", handleTimerStop as EventListener)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", syncFromStorage)
      window.removeEventListener("pomodoro-timer-update", handlePomodoroUpdate as EventListener)
      window.removeEventListener("pomodoro-timer-complete", handleTimerComplete as EventListener)
      window.removeEventListener("stop-pomodoro-timer", handleTimerStop as EventListener)
    }
  }, [])

  // Listen for global start/stop events
  useEffect(() => {
    const handleStart = (e: any) => {
      const { duration, mode, task } = e.detail
      const newTimer = {
        isActive: true,
        isPaused: false,
        timeLeft: duration,
        duration,
        mode,
        task,
      }
      setTimer(newTimer)
    }
    
    const handleStop = () => {
      setTimer(null)
    }
    
    const handleReset = () => {
      setTimer(null)
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

  // Only render if timer is active and has time left
  if (!timer || !timer.isActive || timer.timeLeft <= 0) {
    return null
  }

  const isWarning = timer.timeLeft <= 60 // Show warning when less than 1 minute left
  const isCritical = timer.timeLeft <= 10 // Show critical warning when less than 10 seconds left

  const pauseOrResume = () => {
    if (!timer) return
    const updated = { ...timer, isPaused: !timer.isPaused }
    setTimer(updated)
    
    // Update localStorage
    const saved = JSON.parse(localStorage.getItem(POMODORO_TIMER_KEY) || "{}")
    const updatedSaved = { ...saved, isPaused: updated.isPaused }
    localStorage.setItem(POMODORO_TIMER_KEY, JSON.stringify(updatedSaved))
    
    // Dispatch event for background service
    window.dispatchEvent(new CustomEvent("pomodoro-timer-update", { 
      detail: { timer: updatedSaved } 
    }))
  }

  const stopTimer = () => {
    window.dispatchEvent(new CustomEvent("stop-pomodoro-timer"))
  }

  const closeWidget = () => {
    setTimer(null)
  }

  return (
    <div
      ref={dragRef}
      className={cn(
        "fixed z-[9999] w-48 shadow-lg rounded-lg border p-3 select-none pointer-events-auto transition-all duration-200",
        collapsed ? "opacity-70 hover:opacity-100" : "",
        isCritical ? "bg-red-50 border-red-300 shadow-red-200" : 
        isWarning ? "bg-yellow-50 border-yellow-300 shadow-yellow-200" : 
        "bg-background border-border"
      )}
      style={{ left: position.x, top: position.y, cursor: "move" }}
      onMouseDown={handleMouseDown}
    >
      {!collapsed && (
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-2">
            <div className="text-sm font-semibold capitalize">{timer.mode}</div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeWidget()
              }}
              className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
            >
              <X size={14} />
            </button>
          </div>
          
          {timer.task && (
            <div className="text-xs text-muted-foreground mb-2 text-center max-w-full truncate">
              {timer.task}
            </div>
          )}
          
          <div className={cn(
            "text-3xl font-mono mb-3",
            isCritical ? "text-red-600" : 
            isWarning ? "text-yellow-600" : 
            "text-foreground"
          )}>
            {formatTime(timer.timeLeft)}
          </div>
          
          <div className="flex gap-2 w-full justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation()
                pauseOrResume()
              }}
              className="p-2 rounded hover:bg-accent transition-colors"
              title={timer.isPaused ? "Resume" : "Pause"}
            >
              {timer.isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                stopTimer()
              }}
              className="p-2 rounded hover:bg-destructive/20 transition-colors"
              title="Stop"
            >
              <Square size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setCollapsed(true)
              }}
              className="p-2 rounded hover:bg-accent transition-colors"
              title="Minimize"
            >
              <X size={14} className="rotate-45" />
            </button>
          </div>
        </div>
      )}
      
      {collapsed && (
        <div className="flex items-center gap-2">
          <div className={cn(
            "text-sm font-mono",
            isCritical ? "text-red-600" : 
            isWarning ? "text-yellow-600" : 
            "text-foreground"
          )}>
            {formatTime(timer.timeLeft)}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setCollapsed(false)
            }}
            className="p-1 rounded hover:bg-accent transition-colors"
            title="Expand"
          >
            <Play size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              closeWidget()
            }}
            className="p-1 rounded hover:bg-destructive/20 transition-colors"
            title="Close"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
