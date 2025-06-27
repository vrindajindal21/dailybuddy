// Enhanced Whoop-style health tracking with real device integration
export class WhoopHealthTracker {
  private static instance: WhoopHealthTracker
  private isTracking = false
  private sensors = {
    heartRate: null as number | null,
    hrv: null as number | null,
    respiratoryRate: null as number | null,
    skinTemp: null as number | null,
    bloodOxygen: null as number | null,
    steps: 0,
    calories: 0,
    distance: 0,
    activeMinutes: 0,
    sleep: {
      duration: 0,
      efficiency: 0,
      deepSleep: 0,
      remSleep: 0,
      lightSleep: 0,
      awakenings: 0,
      bedTime: null as Date | null,
      wakeTime: null as Date | null,
    },
    recovery: {
      score: 0,
      hrv: 0,
      restingHR: 0,
      sleepPerformance: 0,
      strain: 0,
    },
    strain: {
      score: 0,
      maxHR: 0,
      avgHR: 0,
      caloriesBurned: 0,
      duration: 0,
    },
  }

  private trackingInterval: number | null = null
  private stepDetectionInterval: number | null = null
  private lastPosition: GeolocationPosition | null = null
  private motionData: DeviceMotionEvent[] = []
  private sleepStartTime: Date | null = null
  private lastStepTime = 0
  private stepThreshold = 12
  private dailyGoals = {
    steps: 10000,
    calories: 2000,
    activeMinutes: 30,
    sleep: 8 * 60, // 8 hours in minutes
  }

  static getInstance(): WhoopHealthTracker {
    if (!WhoopHealthTracker.instance) {
      WhoopHealthTracker.instance = new WhoopHealthTracker()
    }
    return WhoopHealthTracker.instance
  }

  async startTracking(): Promise<boolean> {
    if (this.isTracking) return true

    try {
      console.log("🏃 Starting enhanced health tracking...")

      // Request all permissions
      await this.requestAllPermissions()

      // Load saved data
      this.loadSavedData()

      // Start all tracking systems
      this.startMotionTracking()
      this.startLocationTracking()
      this.startBiometricSimulation()
      this.startSleepDetection()
      this.startContinuousMonitoring()

      this.isTracking = true

      // Dispatch tracking started event
      this.dispatchHealthEvent("trackingStarted", {
        timestamp: Date.now(),
        message: "Health tracking started successfully",
      })

      console.log("✅ Health tracking started successfully")
      return true
    } catch (error) {
      console.error("❌ Failed to start health tracking:", error)
      return false
    }
  }

  stopTracking() {
    this.isTracking = false

    // Clear all intervals
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval)
      this.trackingInterval = null
    }

    if (this.stepDetectionInterval) {
      clearInterval(this.stepDetectionInterval)
      this.stepDetectionInterval = null
    }

    // Remove event listeners
    if (typeof window !== "undefined") {
      window.removeEventListener("devicemotion", this.handleDeviceMotion)
      window.removeEventListener("deviceorientation", this.handleDeviceOrientation)
    }

    // Save final data
    this.saveHealthData()

    console.log("🛑 Health tracking stopped")
    this.dispatchHealthEvent("trackingStopped", { timestamp: Date.now() })
  }

  private async requestAllPermissions() {
    const permissions = []

    // Device motion permission (iOS 13+)
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission()
        if (permission !== "granted") {
          throw new Error("Device motion permission denied")
        }
        permissions.push("motion")
      } catch (error) {
        console.warn("Motion permission error:", error)
      }
    }

    // Device orientation permission
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission()
        if (permission === "granted") {
          permissions.push("orientation")
        }
      } catch (error) {
        console.warn("Orientation permission error:", error)
      }
    }

    // Geolocation permission
    if ("geolocation" in navigator) {
      try {
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              permissions.push("location")
              resolve()
            },
            (error) => {
              console.warn("Location permission denied:", error)
              resolve() // Continue without location
            },
            { timeout: 5000 },
          )
        })
      } catch (error) {
        console.warn("Geolocation error:", error)
      }
    }

    console.log("📱 Permissions granted:", permissions)
    return permissions
  }

  private startMotionTracking() {
    if (typeof window === "undefined") return

    // Enhanced motion detection
    window.addEventListener("devicemotion", this.handleDeviceMotion.bind(this), { passive: true })
    window.addEventListener("deviceorientation", this.handleDeviceOrientation.bind(this), { passive: true })

    // Step detection with improved algorithm
    this.stepDetectionInterval = window.setInterval(() => {
      if (!this.isTracking) return
      this.processMotionData()
    }, 100) // Process every 100ms for better accuracy
  }

  private handleDeviceMotion = (event: DeviceMotionEvent) => {
    if (!this.isTracking) return

    const acceleration = event.accelerationIncludingGravity
    if (!acceleration) return

    const motionData = {
      timestamp: Date.now(),
      x: acceleration.x || 0,
      y: acceleration.y || 0,
      z: acceleration.z || 0,
      interval: event.interval || 0,
    }

    this.motionData.push(motionData)

    // Keep only last 50 readings for performance
    if (this.motionData.length > 50) {
      this.motionData.shift()
    }
  }

  private handleDeviceOrientation = (event: DeviceOrientationEvent) => {
    if (!this.isTracking) return

    // Use orientation data for activity classification
    const orientation = {
      alpha: event.alpha || 0,
      beta: event.beta || 0,
      gamma: event.gamma || 0,
    }

    // Detect if device is being carried (walking) vs stationary
    this.classifyActivity(orientation)
  }

  private processMotionData() {
    if (this.motionData.length < 10) return

    const recent = this.motionData.slice(-10)
    const magnitudes = recent.map((data) => Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z))

    // Advanced step detection algorithm
    const avgMagnitude = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length
    const variance = magnitudes.reduce((sum, mag) => sum + Math.pow(mag - avgMagnitude, 2), 0) / magnitudes.length
    const stdDev = Math.sqrt(variance)

    // Detect step if magnitude exceeds dynamic threshold
    const dynamicThreshold = this.stepThreshold + stdDev * 0.5
    const currentTime = Date.now()

    magnitudes.forEach((magnitude, index) => {
      if (
        magnitude > dynamicThreshold &&
        currentTime - this.lastStepTime > 300 && // Minimum 300ms between steps
        this.isWalkingPattern(magnitudes, index)
      ) {
        this.recordStep()
        this.lastStepTime = currentTime
      }
    })
  }

  private isWalkingPattern(magnitudes: number[], currentIndex: number): boolean {
    // Check for walking pattern (peak followed by valley)
    if (currentIndex < 2 || currentIndex >= magnitudes.length - 2) return false

    const current = magnitudes[currentIndex]
    const prev = magnitudes[currentIndex - 1]
    const next = magnitudes[currentIndex + 1]

    return current > prev && current > next // Peak detection
  }

  private recordStep() {
    this.sensors.steps++

    // Update calories (rough estimate: 0.04 calories per step)
    this.sensors.calories += 0.04

    // Update active minutes (every 100 steps = ~1 minute of activity)
    if (this.sensors.steps % 100 === 0) {
      this.sensors.activeMinutes++
    }

    // Dispatch step event
    this.dispatchHealthEvent("stepDetected", {
      steps: this.sensors.steps,
      calories: Math.round(this.sensors.calories),
      activeMinutes: this.sensors.activeMinutes,
    })
  }

  private classifyActivity(orientation: any) {
    // Simple activity classification based on device orientation
    const { beta, gamma } = orientation

    if (Math.abs(beta) < 30 && Math.abs(gamma) < 30) {
      // Device is relatively flat - might be on desk/table
      this.updateActivityState("sedentary")
    } else if (Math.abs(beta) > 45 || Math.abs(gamma) > 45) {
      // Device is tilted - likely being carried/used
      this.updateActivityState("active")
    }
  }

  private updateActivityState(state: "active" | "sedentary") {
    // Update strain based on activity state
    if (state === "active") {
      this.sensors.strain.score = Math.min(21, this.sensors.strain.score + 0.1)
    }
  }

  private startLocationTracking() {
    if (!("geolocation" in navigator)) return

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (this.lastPosition) {
          const distance = this.calculateDistance(this.lastPosition, position)
          this.sensors.distance += distance

          // Update calories based on distance
          this.sensors.calories += distance * 50 // ~50 calories per km

          this.dispatchHealthEvent("locationUpdate", {
            distance: this.sensors.distance,
            position: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          })
        }
        this.lastPosition = position
      },
      (error) => console.warn("Location tracking error:", error),
      options,
    )

    // Store watch ID for cleanup
    ;(this as any).locationWatchId = watchId
  }

  private calculateDistance(pos1: GeolocationPosition, pos2: GeolocationPosition): number {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRad(pos2.coords.latitude - pos1.coords.latitude)
    const dLon = this.toRad(pos2.coords.longitude - pos1.coords.longitude)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(pos1.coords.latitude)) *
        Math.cos(this.toRad(pos2.coords.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  private startBiometricSimulation() {
    // Simulate realistic biometric data
    setInterval(() => {
      if (!this.isTracking) return

      this.sensors.heartRate = this.generateRealisticHeartRate()
      this.sensors.hrv = this.generateHRV()
      this.sensors.respiratoryRate = this.generateRespiratoryRate()
      this.sensors.skinTemp = this.generateSkinTemperature()
      this.sensors.bloodOxygen = this.generateBloodOxygen()

      this.calculateRecoveryScore()
      this.calculateStrainScore()

      this.dispatchHealthEvent("biometricUpdate", {
        heartRate: this.sensors.heartRate,
        hrv: this.sensors.hrv,
        recovery: this.sensors.recovery.score,
        strain: this.sensors.strain.score,
      })
    }, 5000) // Update every 5 seconds
  }

  private generateRealisticHeartRate(): number {
    const now = new Date()
    const hour = now.getHours()

    // Base heart rate varies by time and activity
    let baseHR = 65

    if (hour >= 6 && hour <= 22) {
      // Awake hours
      baseHR = 70 + Math.sin(((hour - 6) * Math.PI) / 16) * 15
    } else {
      // Sleep hours
      baseHR = 55 + Math.random() * 10
    }

    // Activity-based adjustment
    const activityMultiplier = this.getActivityMultiplier()
    baseHR *= activityMultiplier

    // Add realistic variation
    return Math.round(baseHR + (Math.random() - 0.5) * 8)
  }

  private generateHRV(): number {
    const baseHRV = 35
    const sleepBonus = this.sensors.sleep.efficiency > 85 ? 10 : 0
    const stressReduction = this.sensors.strain.score > 15 ? -8 : 0

    return Math.max(15, Math.round(baseHRV + sleepBonus + stressReduction + (Math.random() - 0.5) * 12))
  }

  private generateRespiratoryRate(): number {
    const baseRate = 16
    const sleepReduction = this.isAsleep() ? -2 : 0
    const activityIncrease = this.getActivityMultiplier() > 1.2 ? 4 : 0

    return Math.max(
      10,
      Math.min(25, Math.round(baseRate + sleepReduction + activityIncrease + (Math.random() - 0.5) * 3)),
    )
  }

  private generateSkinTemperature(): number {
    const baseTemp = 33.5
    const hourVariation = Math.sin(((new Date().getHours() - 6) * Math.PI) / 12) * 1.5
    const sleepVariation = this.isAsleep() ? -0.8 : 0

    return Math.round((baseTemp + hourVariation + sleepVariation + (Math.random() - 0.5) * 0.8) * 10) / 10
  }

  private generateBloodOxygen(): number {
    const baseSpO2 = 98
    const sleepReduction = this.isAsleep() ? -1 : 0
    const variation = (Math.random() - 0.5) * 2

    return Math.max(94, Math.min(100, Math.round(baseSpO2 + sleepReduction + variation)))
  }

  private getActivityMultiplier(): number {
    const recentSteps = this.sensors.steps % 100 // Steps in last period
    return 1 + (recentSteps / 100) * 0.8
  }

  private startSleepDetection() {
    setInterval(() => {
      if (!this.isTracking) return

      const sleepState = this.detectSleepState()

      if (sleepState.isAsleep && !this.sleepStartTime) {
        this.sleepStartTime = new Date()
        this.sensors.sleep.bedTime = this.sleepStartTime
        this.dispatchHealthEvent("sleepStarted", {
          bedTime: this.sleepStartTime,
          timestamp: Date.now(),
        })
      } else if (!sleepState.isAsleep && this.sleepStartTime) {
        this.processSleepSession()
        this.sleepStartTime = null
      }

      if (this.sleepStartTime) {
        this.updateSleepMetrics(sleepState)
      }
    }, 30000) // Check every 30 seconds
  }

  private detectSleepState() {
    const now = new Date()
    const hour = now.getHours()

    const isNightTime = hour >= 22 || hour <= 6
    const lowActivity = this.getRecentActivityLevel() < 0.1
    const lowHeartRate = (this.sensors.heartRate || 70) < 65
    const stableMotion = this.getMotionStability() > 0.8

    const sleepProbability =
      (isNightTime ? 0.4 : 0.1) + (lowActivity ? 0.3 : 0) + (lowHeartRate ? 0.2 : 0) + (stableMotion ? 0.1 : 0)

    return {
      isAsleep: sleepProbability > 0.6,
      probability: sleepProbability,
      stage: this.determineSleepStage(sleepProbability),
    }
  }

  private determineSleepStage(probability: number): string {
    if (probability < 0.6) return "awake"
    if (probability < 0.7) return "light"
    if (probability < 0.85) return "deep"
    return "rem"
  }

  private updateSleepMetrics(sleepState: any) {
    if (!this.sleepStartTime) return

    const duration = (Date.now() - this.sleepStartTime.getTime()) / (1000 * 60)
    this.sensors.sleep.duration = duration

    // Update sleep stage durations
    switch (sleepState.stage) {
      case "light":
        this.sensors.sleep.lightSleep += 0.5
        break
      case "deep":
        this.sensors.sleep.deepSleep += 0.5
        break
      case "rem":
        this.sensors.sleep.remSleep += 0.5
        break
    }

    const totalSleep = this.sensors.sleep.lightSleep + this.sensors.sleep.deepSleep + this.sensors.sleep.remSleep
    this.sensors.sleep.efficiency = Math.min(100, (totalSleep / duration) * 100)
  }

  private processSleepSession() {
    if (!this.sleepStartTime) return

    const endTime = new Date()
    this.sensors.sleep.wakeTime = endTime
    const duration = (endTime.getTime() - this.sleepStartTime.getTime()) / (1000 * 60 * 60)

    this.sensors.sleep.duration = duration * 60

    this.dispatchHealthEvent("sleepEnded", {
      duration: this.sensors.sleep.duration,
      efficiency: this.sensors.sleep.efficiency,
      bedTime: this.sleepStartTime,
      wakeTime: endTime,
    })

    this.saveSleepSession({
      startTime: this.sleepStartTime,
      endTime,
      duration: this.sensors.sleep.duration,
      efficiency: this.sensors.sleep.efficiency,
      stages: {
        light: this.sensors.sleep.lightSleep,
        deep: this.sensors.sleep.deepSleep,
        rem: this.sensors.sleep.remSleep,
      },
    })
  }

  private getRecentActivityLevel(): number {
    if (this.motionData.length === 0) return 0

    const recent = this.motionData.slice(-10)
    const avgMagnitude =
      recent.reduce((sum, data) => {
        return sum + Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z)
      }, 0) / recent.length

    return Math.min(1, Math.max(0, (avgMagnitude - 9) / 10))
  }

  private getMotionStability(): number {
    if (this.motionData.length < 5) return 0

    const recent = this.motionData.slice(-5)
    const magnitudes = recent.map((data) => Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z))

    const avg = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length
    const variance = magnitudes.reduce((sum, mag) => sum + (mag - avg) ** 2, 0) / magnitudes.length

    return Math.max(0, 1 - variance / 10)
  }

  private isAsleep(): boolean {
    return this.sleepStartTime !== null
  }

  private calculateRecoveryScore() {
    const hrvScore = Math.min(100, (this.sensors.hrv || 35) * 2)
    const sleepScore = this.sensors.sleep.efficiency
    const restingHRScore = Math.max(0, 100 - ((this.sensors.heartRate || 70) - 50) * 2)

    this.sensors.recovery.score = Math.round(hrvScore * 0.4 + sleepScore * 0.4 + restingHRScore * 0.2)
    this.sensors.recovery.hrv = this.sensors.hrv || 0
    this.sensors.recovery.restingHR = this.sensors.heartRate || 0
    this.sensors.recovery.sleepPerformance = sleepScore
  }

  private calculateStrainScore() {
    const maxHR = this.sensors.strain.maxHR || this.sensors.heartRate || 70
    const avgHR = this.sensors.strain.avgHR || this.sensors.heartRate || 70
    const duration = this.sensors.activeMinutes
    const calories = this.sensors.calories

    const hrReserve = maxHR - 50
    const intensity = hrReserve / 120
    const durationFactor = Math.min(1, duration / 60)
    const calorieFactor = Math.min(1, calories / 500)

    this.sensors.strain.score = Math.min(21, Math.round(intensity * 10 + durationFactor * 6 + calorieFactor * 5))
    this.sensors.strain.maxHR = Math.max(this.sensors.strain.maxHR, this.sensors.heartRate || 70)
    this.sensors.strain.avgHR = (this.sensors.strain.avgHR + (this.sensors.heartRate || 70)) / 2
    this.sensors.strain.caloriesBurned = calories
    this.sensors.strain.duration = duration
  }

  private startContinuousMonitoring() {
    this.trackingInterval = window.setInterval(() => {
      if (!this.isTracking) return

      this.saveHealthData()
      this.checkGoals()

      this.dispatchHealthEvent("periodicUpdate", {
        timestamp: Date.now(),
        sensors: { ...this.sensors },
        progress: this.getGoalProgress(),
      })
    }, 60000) // Every minute
  }

  private checkGoals() {
    const progress = this.getGoalProgress()

    // Check if goals are reached and notify
    Object.entries(progress).forEach(([key, data]) => {
      if (data.percentage >= 100 && !this.hasGoalBeenReached(key)) {
        this.dispatchHealthEvent("goalReached", {
          goal: key,
          value: data.current,
          target: data.target,
        })
        this.markGoalAsReached(key)
      }
    })
  }

  private hasGoalBeenReached(goal: string): boolean {
    const today = new Date().toDateString()
    const reached = JSON.parse(localStorage.getItem("goalsReachedToday") || "{}")
    return reached[today]?.[goal] || false
  }

  private markGoalAsReached(goal: string) {
    const today = new Date().toDateString()
    const reached = JSON.parse(localStorage.getItem("goalsReachedToday") || "{}")
    if (!reached[today]) reached[today] = {}
    reached[today][goal] = true
    localStorage.setItem("goalsReachedToday", JSON.stringify(reached))
  }

  private saveHealthData() {
    const data = {
      timestamp: Date.now(),
      date: new Date().toDateString(),
      sensors: { ...this.sensors },
    }

    localStorage.setItem("whoopHealthData", JSON.stringify(data))

    // Save daily summary
    const dailyData = JSON.parse(localStorage.getItem("whoopDailyData") || "[]")
    const today = data.date
    const existingIndex = dailyData.findIndex((d: any) => d.date === today)

    if (existingIndex >= 0) {
      dailyData[existingIndex] = data
    } else {
      dailyData.push(data)
    }

    // Keep only last 90 days
    if (dailyData.length > 90) {
      dailyData.splice(0, dailyData.length - 90)
    }

    localStorage.setItem("whoopDailyData", JSON.stringify(dailyData))
  }

  private loadSavedData() {
    try {
      const saved = localStorage.getItem("whoopHealthData")
      if (saved) {
        const data = JSON.parse(saved)
        const savedDate = new Date(data.timestamp)
        const now = new Date()

        // Only load if data is from today
        if (savedDate.toDateString() === now.toDateString()) {
          this.sensors = { ...this.sensors, ...data.sensors }
        }
      }
    } catch (error) {
      console.error("Error loading health data:", error)
    }
  }

  private saveSleepSession(session: any) {
    const sessions = JSON.parse(localStorage.getItem("whoopSleepSessions") || "[]")
    sessions.push(session)

    if (sessions.length > 30) {
      sessions.splice(0, sessions.length - 30)
    }

    localStorage.setItem("whoopSleepSessions", JSON.stringify(sessions))
  }

  private dispatchHealthEvent(eventName: string, data: any) {
    if (typeof window === "undefined") return

    const event = new CustomEvent(`health-${eventName}`, { detail: data })
    window.dispatchEvent(event)
  }

  // Public methods
  getCurrentData() {
    return { ...this.sensors }
  }

  getTodaysSummary() {
    return {
      steps: this.sensors.steps,
      calories: Math.round(this.sensors.calories),
      distance: Math.round(this.sensors.distance * 100) / 100,
      activeMinutes: this.sensors.activeMinutes,
      heartRate: this.sensors.heartRate,
      recovery: this.sensors.recovery.score,
      strain: this.sensors.strain.score,
      sleep: {
        duration: Math.round(this.sensors.sleep.duration),
        efficiency: Math.round(this.sensors.sleep.efficiency),
      },
    }
  }

  getGoalProgress() {
    return {
      steps: {
        current: this.sensors.steps,
        target: this.dailyGoals.steps,
        percentage: Math.round((this.sensors.steps / this.dailyGoals.steps) * 100),
      },
      calories: {
        current: Math.round(this.sensors.calories),
        target: this.dailyGoals.calories,
        percentage: Math.round((this.sensors.calories / this.dailyGoals.calories) * 100),
      },
      activeMinutes: {
        current: this.sensors.activeMinutes,
        target: this.dailyGoals.activeMinutes,
        percentage: Math.round((this.sensors.activeMinutes / this.dailyGoals.activeMinutes) * 100),
      },
      sleep: {
        current: Math.round(this.sensors.sleep.duration),
        target: this.dailyGoals.sleep,
        percentage: Math.round((this.sensors.sleep.duration / this.dailyGoals.sleep) * 100),
      },
    }
  }

  setDailyGoals(goals: Partial<typeof this.dailyGoals>) {
    this.dailyGoals = { ...this.dailyGoals, ...goals }
    localStorage.setItem("healthGoals", JSON.stringify(this.dailyGoals))
  }

  getHistoricalData(days = 7) {
    const data = JSON.parse(localStorage.getItem("whoopDailyData") || "[]")
    return data.slice(-days)
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking
  }

  resetDailyData() {
    this.sensors.steps = 0
    this.sensors.calories = 0
    this.sensors.distance = 0
    this.sensors.activeMinutes = 0
    this.saveHealthData()
  }
}

export const whoopTracker = WhoopHealthTracker.getInstance()
