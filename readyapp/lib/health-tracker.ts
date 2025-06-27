// Advanced health tracking with automatic data collection
export class HealthTracker {
  private static instance: HealthTracker
  private stepCounter = 0
  private distance = 0
  private calories = 0
  private isTracking = false
  private lastPosition: GeolocationPosition | null = null
  private motionData: DeviceMotionEvent[] = []
  private trackingInterval: number | null = null

  static getInstance(): HealthTracker {
    if (!HealthTracker.instance) {
      HealthTracker.instance = new HealthTracker()
    }
    return HealthTracker.instance
  }

  async startTracking(): Promise<boolean> {
    if (this.isTracking) return true

    try {
      // Request permissions
      await this.requestPermissions()

      // Start step counting with device motion
      this.startStepCounting()

      // Start location tracking for distance
      this.startLocationTracking()

      // Start background tracking
      this.startBackgroundTracking()

      this.isTracking = true
      console.log("Health tracking started successfully")
      return true
    } catch (error) {
      console.error("Failed to start health tracking:", error)
      return false
    }
  }

  stopTracking() {
    this.isTracking = false

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval)
      this.trackingInterval = null
    }

    // Remove event listeners
    if (typeof window !== "undefined") {
      window.removeEventListener("devicemotion", this.handleDeviceMotion)
    }

    console.log("Health tracking stopped")
  }

  private async requestPermissions() {
    // Request device motion permission (iOS 13+)
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      const permission = await (DeviceMotionEvent as any).requestPermission()
      if (permission !== "granted") {
        throw new Error("Device motion permission denied")
      }
    }

    // Request geolocation permission
    if ("geolocation" in navigator) {
      return new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(),
          (error) => {
            console.warn("Geolocation permission denied:", error)
            resolve() // Continue without location
          },
          { timeout: 5000 },
        )
      })
    }
  }

  private startStepCounting() {
    if (typeof window === "undefined") return

    // Use device motion for step detection
    window.addEventListener("devicemotion", this.handleDeviceMotion.bind(this))

    // Fallback: simulate step counting for demo
    this.trackingInterval = setInterval(() => {
      if (this.isTracking) {
        // Simulate steps (in real app, this would come from actual motion detection)
        const randomSteps = Math.floor(Math.random() * 3)
        this.stepCounter += randomSteps
        this.updateCalories()
        this.saveHealthData()
      }
    }, 10000) // Update every 10 seconds
  }

  private handleDeviceMotion = (event: DeviceMotionEvent) => {
    if (!this.isTracking) return

    // Store motion data for step detection
    this.motionData.push(event)

    // Keep only last 10 readings for performance
    if (this.motionData.length > 10) {
      this.motionData.shift()
    }

    // Simple step detection algorithm
    const acceleration = event.accelerationIncludingGravity
    if (acceleration) {
      const magnitude = Math.sqrt((acceleration.x || 0) ** 2 + (acceleration.y || 0) ** 2 + (acceleration.z || 0) ** 2)

      // Detect step if magnitude exceeds threshold
      if (magnitude > 12) {
        this.stepCounter++
        this.updateCalories()
      }
    }
  }

  private startLocationTracking() {
    if (!("geolocation" in navigator)) return

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (this.lastPosition) {
          const distance = this.calculateDistance(this.lastPosition, position)
          this.distance += distance
          this.updateCalories()
          this.saveHealthData()
        }
        this.lastPosition = position
      },
      (error) => {
        console.warn("Location tracking error:", error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )

    // Store watch ID for cleanup
    ;(this as any).locationWatchId = watchId
  }

  private calculateDistance(pos1: GeolocationPosition, pos2: GeolocationPosition): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (pos1.coords.latitude * Math.PI) / 180
    const φ2 = (pos2.coords.latitude * Math.PI) / 180
    const Δφ = ((pos2.coords.latitude - pos1.coords.latitude) * Math.PI) / 180
    const Δλ = ((pos2.coords.longitude - pos1.coords.longitude) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  private updateCalories() {
    // Simple calorie calculation: ~0.04 calories per step
    this.calories = Math.round(this.stepCounter * 0.04)
  }

  private startBackgroundTracking() {
    // Register service worker for background tracking
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Send tracking data to service worker
        registration.active?.postMessage({
          type: "START_HEALTH_TRACKING",
          data: { steps: this.stepCounter, distance: this.distance, calories: this.calories },
        })
      })
    }
  }

  private saveHealthData() {
    if (typeof window === "undefined") return

    const healthData = {
      steps: this.stepCounter,
      distance: this.distance,
      calories: this.calories,
      lastUpdated: new Date().toISOString(),
    }

    localStorage.setItem("auto-health-data", JSON.stringify(healthData))

    // Dispatch event for UI updates
    window.dispatchEvent(
      new CustomEvent("healthDataUpdate", {
        detail: healthData,
      }),
    )
  }

  // Public getters
  getSteps(): number {
    return this.stepCounter
  }

  getDistance(): number {
    return this.distance
  }

  getCalories(): number {
    return this.calories
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking
  }

  // Load saved data
  loadSavedData() {
    if (typeof window === "undefined") return

    const saved = localStorage.getItem("auto-health-data")
    if (saved) {
      const data = JSON.parse(saved)
      this.stepCounter = data.steps || 0
      this.distance = data.distance || 0
      this.calories = data.calories || 0
    }
  }

  // Reset daily data (call at midnight)
  resetDailyData() {
    this.stepCounter = 0
    this.distance = 0
    this.calories = 0
    this.saveHealthData()
  }
}

// Initialize health tracker
if (typeof window !== "undefined") {
  const tracker = HealthTracker.getInstance()
  tracker.loadSavedData()

  // Auto-start tracking on user interaction
  const startTracking = () => {
    tracker.startTracking()
    document.removeEventListener("click", startTracking)
    document.removeEventListener("touchstart", startTracking)
  }

  document.addEventListener("click", startTracking)
  document.addEventListener("touchstart", startTracking)
}
