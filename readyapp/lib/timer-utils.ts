// Utility for precise timing
export class PreciseTimer {
  private timerId: number | null = null
  private startTime = 0
  private remaining = 0
  private callback: () => void
  private isRunning = false

  constructor(callback: () => void, delay: number) {
    this.callback = callback
    this.remaining = delay
  }

  start() {
    this.isRunning = true
    this.startTime = Date.now()

    // Clear any existing timer
    if (this.timerId !== null) {
      clearTimeout(this.timerId)
    }

    this.timerId = window.setTimeout(() => {
      this.callback()
      this.isRunning = false
      this.timerId = null
    }, this.remaining)

    return this
  }

  pause() {
    if (!this.isRunning) {
      return this
    }

    clearTimeout(this.timerId!)
    this.timerId = null
    this.remaining -= Date.now() - this.startTime
    this.isRunning = false

    return this
  }

  resume() {
    if (this.isRunning) {
      return this
    }

    this.start()
    return this
  }

  clear() {
    if (this.timerId !== null) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
    this.isRunning = false

    return this
  }

  getTimeRemaining() {
    if (this.isRunning) {
      return this.remaining - (Date.now() - this.startTime)
    }
    return this.remaining
  }

  isActive() {
    return this.isRunning
  }
}

// Function to schedule a precise notification
export function schedulePreciseNotification(
  title: string,
  options: any,
  targetTime: Date,
  notificationFn: (title: string, options: any) => void,
) {
  const now = new Date()
  const delay = targetTime.getTime() - now.getTime()

  if (delay <= 0) {
    // If the time has already passed, show immediately
    notificationFn(title, options)
    return null
  }

  // Create a precise timer
  const timer = new PreciseTimer(() => {
    notificationFn(title, options)
  }, delay)

  // Start the timer
  timer.start()

  return timer
}
