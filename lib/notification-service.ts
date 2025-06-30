"use client"

// Enhanced notification service with better error handling and sound generation
export class NotificationService {
  private static instance: NotificationService | null = null
  private isInitialized = false
  private permissionState: NotificationPermission = "default"
  private audioContext: AudioContext | null = null
  private lastShownNotifications = new Map<string, number>()

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  static isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window
  }

  static getPermissionState(): NotificationPermission {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied"
    }
    return Notification.permission
  }

  static async requestPermission(): Promise<boolean> {
    const instance = NotificationService.getInstance()
    const permission = await instance.requestPermission()
    return permission === "granted"
  }

  static async showNotification(
    title: string,
    options: NotificationOptions = {},
    soundType = "default",
    volume = 70,
  ): Promise<boolean> {
    const instance = NotificationService.getInstance()
    return await instance.showNotification(title, { ...options, type: soundType }, volume)
  }

  static playSound(soundType = "default", volume = 70): boolean {
    const instance = NotificationService.getInstance()
    return instance.playSound(soundType, volume)
  }

  // Specialized notification methods for different types
  static showMedicationReminder(title: string, body: string, medicationData?: any): boolean {
    const instance = NotificationService.getInstance()
    instance.playSound("medication", 80)
    return instance.showRichNotification({
      title,
      body,
      type: "medication",
      data: medicationData,
      requireInteraction: true,
    })
  }

  static showTaskReminder(title: string, body: string, taskData?: any): boolean {
    const instance = NotificationService.getInstance()
    instance.playSound("task", 70)
    return instance.showRichNotification({
      title,
      body,
      type: "task",
      data: taskData,
    })
  }

  static showHabitReminder(title: string, body: string, habitData?: any): boolean {
    const instance = NotificationService.getInstance()
    instance.playSound("habit", 60)
    return instance.showRichNotification({
      title,
      body,
      type: "habit",
      data: habitData,
    })
  }

  static showStudyReminder(title: string, body: string, studyData?: any): boolean {
    const instance = NotificationService.getInstance()
    instance.playSound("study", 75)
    return instance.showRichNotification({
      title,
      body,
      type: "study",
      data: studyData,
    })
  }

  static showRichNotification(title: string, options: {
    body?: string
    icon?: string
    badge?: string
    tag?: string
    requireInteraction?: boolean
    data?: any
  } = {}) {
    if (!this.isSupported()) return;

    const notificationOptions: NotificationOptions = {
      body: options.body || '',
      icon: options.icon || '/android-chrome-192x192.png',
      badge: options.badge || '/android-chrome-192x192.png',
      tag: options.tag || 'default',
      requireInteraction: options.requireInteraction || false,
      data: options.data || {}
    };

    return this.showNotification(title, notificationOptions);
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true
    if (typeof window === "undefined") return false

    try {
      if (!("Notification" in window)) {
        console.warn("Notifications not supported")
        return false
      }

      this.permissionState = Notification.permission

      // Initialize audio context
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContext) {
          this.audioContext = new AudioContext()
        }
      } catch (audioError) {
        console.warn("AudioContext not supported:", audioError)
      }

      // Try to register service worker, but don't fail if it doesn't work
      if ("serviceWorker" in navigator) {
        try {
          await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          })
          console.log("ServiceWorker registered successfully")
        } catch (swError) {
          console.warn("ServiceWorker registration failed, continuing without:", swError)
        }
      }

      this.isInitialized = true
      return true
    } catch (error) {
      console.error("Failed to initialize NotificationService:", error)
      return false
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      return "denied"
    }

    if (Notification.permission === "granted") {
      this.permissionState = "granted"
      return "granted"
    }

    if (Notification.permission === "denied") {
      this.permissionState = "denied"
      return "denied"
    }

    try {
      const permission = await Notification.requestPermission()
      this.permissionState = permission

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("notificationPermissionChanged", {
            detail: { permission },
          }),
        )
      }

      return permission
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      this.permissionState = "denied"
      return "denied"
    }
  }

  async showNotification(
    title: string,
    options: NotificationOptions & {
      type?: string
      data?: any
    } = {},
    volume = 70,
  ): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      if (Notification.permission !== "granted") {
        console.warn("Notification permission not granted")
        return false
      }

      // Check if a notification with this tag was shown in the last 5 seconds
      const now = Date.now();
      const tag = options.tag || "default";
      const lastShownTime = this.lastShownNotifications.get(tag);
      if (lastShownTime && (now - lastShownTime) < 5000) {
        console.log('Debouncing notification:', tag);
        return false;
      }

      // Check if this notification was already shown on another device
      const shownNotifications = JSON.parse(localStorage.getItem('shown-medication-notifications') || '{}');
      const deviceId = localStorage.getItem('deviceId') || 'unknown';
      
      if (shownNotifications[tag]) {
        const notifInfo = shownNotifications[tag];
        const notifTime = new Date(notifInfo.timestamp).getTime();
        
        // If notification was shown on another device in the last 5 minutes, don't show it again
        if (now - notifTime < 5 * 60 * 1000 && notifInfo.deviceId !== deviceId) {
          console.log('Notification already shown on device:', notifInfo.deviceId);
          return false;
        }
      }

      // Create basic notification
      const notification = new Notification(title, {
        body: options.body || "",
        icon: options.icon || "/icon-192x192.png",
        tag: tag,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        data: {
          ...options.data,
          deviceId: deviceId,
          timestamp: now
        }
      })

      // Only play sound if notification was successfully created
      this.playSound(options.type || "default", volume)
      
      // Update last shown time
      this.lastShownNotifications.set(tag, now);

      // Update shown notifications in localStorage
      shownNotifications[tag] = {
        timestamp: new Date(now).toISOString(),
        deviceId: deviceId
      };
      localStorage.setItem('shown-medication-notifications', JSON.stringify(shownNotifications));

      notification.onclick = () => {
        window.focus()
        if (options.data?.url) {
          window.location.href = options.data.url
        }
        notification.close()
      }

      // Auto-close after 10 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 10000)
      }

      return true
    } catch (error) {
      console.error("Failed to show notification:", error)
      return false
    }
  }

  showRichNotification(options: {
    title: string
    body: string
    type: string
    data?: any
    requireInteraction?: boolean
  }): boolean {
    try {
      if (Notification.permission !== "granted") {
        console.warn("Notification permission not granted")
        return false
      }

      const notification = new Notification(options.title, {
        body: options.body,
        icon: this.getIconForType(options.type),
        tag: `${options.type}-${Date.now()}`,
        requireInteraction: options.requireInteraction || false,
        data: options.data,
      })

      notification.onclick = () => {
        window.focus()
        this.handleNotificationClick(options.type, options.data)
        notification.close()
      }

      // Auto-close based on type importance
      const autoCloseTime = this.getAutoCloseTime(options.type)
      if (autoCloseTime > 0) {
        setTimeout(() => notification.close(), autoCloseTime)
      }

      return true
    } catch (error) {
      console.error("Failed to show rich notification:", error)
      return false
    }
  }

  playSound(soundType = "default", volume = 70): boolean {
    try {
      if (!this.audioContext) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioContext) return false
        this.audioContext = new AudioContext()
      }

      const audioContext = this.audioContext
      if (audioContext.state === "suspended") {
        audioContext.resume()
      }

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      const soundPresets: Record<string, { frequency: number; duration: number; type: OscillatorType }> = {
        default: { frequency: 440, duration: 0.5, type: "sine" },
        medication: { frequency: 830, duration: 2.0, type: "sine" },
        task: { frequency: 700, duration: 0.8, type: "triangle" },
        habit: { frequency: 600, duration: 0.6, type: "sine" },
        study: { frequency: 750, duration: 1.0, type: "sine" },
        pomodoro: { frequency: 880, duration: 1.5, type: "sine" },
        bell: { frequency: 830, duration: 1.5, type: "sine" },
        beep: { frequency: 800, duration: 0.3, type: "square" },
        chime: { frequency: 1000, duration: 1.0, type: "sine" },
        urgent: { frequency: 1200, duration: 0.2, type: "square" },
        gentle: { frequency: 523, duration: 1.2, type: "sine" },
      }

      const preset = soundPresets[soundType] || soundPresets.default

      oscillator.type = preset.type
      oscillator.frequency.value = preset.frequency

      const normalizedVolume = Math.max(0, Math.min(1, volume / 100))
      gainNode.gain.value = normalizedVolume

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      const now = audioContext.currentTime
      gainNode.gain.setValueAtTime(normalizedVolume, now)
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + preset.duration)

      oscillator.start(now)
      oscillator.stop(now + preset.duration)

      return true
    } catch (error) {
      console.error("Error playing sound:", error)
      return false
    }
  }

  private getIconForType(type: string): string {
    const icons: Record<string, string> = {
      medication: "/icon-192x192.png",
      task: "/icon-192x192.png",
      habit: "/icon-192x192.png",
      study: "/icon-192x192.png",
      pomodoro: "/icon-192x192.png",
      reminder: "/icon-192x192.png",
      default: "/icon-192x192.png",
    }
    return icons[type] || icons.default
  }

  private getAutoCloseTime(type: string): number {
    const times: Record<string, number> = {
      medication: 0, // Don't auto-close medication reminders
      task: 8000,
      habit: 6000,
      study: 10000,
      pomodoro: 12000,
      reminder: 8000,
      default: 5000,
    }
    return times[type] || times.default
  }

  private handleNotificationClick(type: string, data?: any): void {
    const routes: Record<string, string> = {
      medication: "/dashboard/medications",
      task: "/dashboard/tasks",
      habit: "/dashboard/habits",
      study: "/dashboard/study",
      pomodoro: "/dashboard/pomodoro",
      reminder: "/dashboard/reminders",
      default: "/dashboard",
    }

    const route = routes[type] || routes.default
    if (typeof window !== "undefined") {
      window.location.href = route
    }
  }

  getPermissionState(): NotificationPermission {
    return this.permissionState
  }

  isSupported(): boolean {
    return NotificationService.isSupported()
  }

  static async testPushNotification() {
    if (!this.isSupported()) {
      console.log('Notifications not supported');
      return false;
    }

    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }

    try {
      // Test local notification
      this.showNotification('Test Notification', {
        body: 'This is a test notification to verify push notifications are working.',
        icon: '/android-chrome-192x192.png',
        badge: '/android-chrome-192x192.png',
        tag: 'test-notification',
        requireInteraction: true
      });

      // Test Firebase push notification (if token exists)
      const userId = localStorage.getItem('userId');
      if (userId) {
        // Send test push notification to backend
        fetch('/api/test-push-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId,
            title: 'Test Push Notification',
            body: 'This is a test push notification from DailyBuddy!'
          })
        }).catch(err => {
          console.log('Test push notification endpoint not available:', err);
        });
      }

      return true;
    } catch (error) {
      console.error('Error testing notification:', error);
      return false;
    }
  }

  // Clear old notifications (older than 24 hours)
  private clearOldNotifications() {
    try {
      const shownNotifications = JSON.parse(localStorage.getItem('shown-medication-notifications') || '{}');
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      
      let hasChanges = false;
      Object.entries(shownNotifications).forEach(([key, value]: [string, any]) => {
        const notifTime = new Date(value.timestamp).getTime();
        if (notifTime < oneDayAgo) {
          delete shownNotifications[key];
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        localStorage.setItem('shown-medication-notifications', JSON.stringify(shownNotifications));
      }
    } catch (error) {
      console.error('Error clearing old notifications:', error);
    }
  }
}

// Auto-initialize
if (typeof window !== "undefined") {
  NotificationService.getInstance().initialize()
}

export const notificationService = NotificationService.getInstance()
