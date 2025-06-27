"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useTheme } from "next-themes"
import { NotificationService } from "@/lib/notification-service"
import { useLanguage } from "@/components/language-provider"
import {
  Mic,
  MicOff,
  Bell,
  BellOff,
  Moon,
  Sun,
  Laptop,
  IndianRupee,
  DollarSign,
  Volume2,
  VolumeX,
  Save,
  Check,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"

export default function SettingsPage() {
  const { toast } = useToast()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()

  const [userSettings, setUserSettings] = useState({
    profile: {
      name: "John Doe",
      email: "john.doe@example.com",
      avatar: "/placeholder.svg?height=100&width=100",
    },
    preferences: {
      theme: "system",
      language: "en",
      timeFormat: "12h",
      currency: "inr",
      notificationsEnabled: true,
      emailNotifications: true,
      soundEnabled: true,
      voiceInputEnabled: true,
    },
    privacy: {
      showOnlineStatus: true,
      shareActivityStats: false,
      allowDataCollection: true,
    },
  })

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")
  const [isMounted, setIsMounted] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [currentTheme, setCurrentTheme] = useState("system")

  const languageOptions = [
    { value: "hi", label: "हिंदी", flag: "🇮🇳" },
    { value: "en", label: "English", flag: "🇺🇸" },
    { value: "es", label: "Español", flag: "🇪🇸" },
    { value: "fr", label: "Français", flag: "🇫🇷" },
    { value: "de", label: "Deutsch", flag: "🇩🇪" },
    { value: "it", label: "Italiano", flag: "🇮🇹" },
    { value: "pt", label: "Português", flag: "🇵🇹" },
    { value: "ru", label: "Русский", flag: "🇷🇺" },
    { value: "zh", label: "中文", flag: "🇨🇳" },
    { value: "ja", label: "日本語", flag: "🇯🇵" },
    { value: "ko", label: "한국어", flag: "🇰🇷" },
  ]

  const currencyOptions = [
    { value: "inr", label: "Indian Rupee (₹)", symbol: "₹", icon: IndianRupee },
    { value: "usd", label: "US Dollar ($)", symbol: "$", icon: DollarSign },
  ]

  // Check notification permission on mount and periodically
  const checkNotificationPermission = useCallback(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const currentPermission = Notification.permission
        setNotificationPermission(currentPermission)
        return currentPermission
      } catch (error) {
        console.error("Error checking notification permission:", error)
        return "default"
      }
    }
    return "default"
  }, [])

  // Load settings from localStorage only once on mount
  useEffect(() => {
    setIsMounted(true)

    const savedSettings = localStorage.getItem("userSettings")
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        setUserSettings(parsedSettings)
        setCurrentTheme(parsedSettings.preferences.theme || "system")

        // Apply language from saved settings
        if (parsedSettings.preferences.language) {
          setLanguage(parsedSettings.preferences.language)
        }
      } catch (error) {
        console.error("Failed to parse saved settings:", error)
      }
    }

    // Check notification permission
    checkNotificationPermission()

    // Listen for permission changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkNotificationPermission()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Check permission every 2 seconds when page is visible
    const permissionInterval = setInterval(() => {
      if (!document.hidden) {
        checkNotificationPermission()
      }
    }, 2000)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      clearInterval(permissionInterval)
    }
  }, [setLanguage, checkNotificationPermission])

  // Update current theme when theme changes
  useEffect(() => {
    if (theme) {
      setCurrentTheme(theme)
    }
  }, [theme])

  // Save settings to localStorage
  const saveSettings = useCallback(() => {
    if (isMounted) {
      try {
        const settingsToSave = {
          ...userSettings,
          preferences: {
            ...userSettings.preferences,
            theme: currentTheme,
          },
        }
        localStorage.setItem("userSettings", JSON.stringify(settingsToSave))
        setHasUnsavedChanges(false)

        toast({
          title: "Settings Saved",
          description: "Your settings have been saved successfully.",
        })
      } catch (error) {
        console.error("Failed to save settings:", error)
        toast({
          title: "Error",
          description: "Failed to save settings. Please try again.",
          variant: "destructive",
        })
      }
    }
  }, [userSettings, currentTheme, isMounted, toast])

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    if (hasUnsavedChanges) {
      const timer = setTimeout(() => {
        saveSettings()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [hasUnsavedChanges, saveSettings])

  const updateSettings = (section: string, key: string, value: any) => {
    setUserSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value,
      },
    }))
    setHasUnsavedChanges(true)

    // Apply changes immediately for certain settings
    if (section === "preferences") {
      if (key === "language") {
        setLanguage(value)
      } else if (key === "currency") {
        // Force re-render to show currency change
        setTimeout(() => {
          window.dispatchEvent(new Event("currencyChanged"))
        }, 100)
      }
    }
  }

  const handleThemeChange = (newTheme: string) => {
    console.log("Changing theme to:", newTheme)
    setCurrentTheme(newTheme)
    setTheme(newTheme)
    updateSettings("preferences", "theme", newTheme)

    // Force a re-render to update button states
    setTimeout(() => {
      setHasUnsavedChanges(true)
    }, 100)
  }

  const handleEnableNotifications = async () => {
    try {
      console.log("Requesting notification permission...")

      // First check if notifications are supported
      if (!NotificationService.isSupported()) {
        toast({
          title: "Not Supported",
          description: "Notifications are not supported in this browser.",
          variant: "destructive",
        })
        return
      }

      // Request permission with user interaction
      const permission = await NotificationService.requestPermission()
      console.log("Permission result:", permission)

      setNotificationPermission(permission)

      if (permission === "granted") {
        updateSettings("preferences", "notificationsEnabled", true)

        // Send a welcome notification
        setTimeout(() => {
          NotificationService.show({
            title: "Notifications Enabled!",
            body: "You will now receive important reminders and updates.",
            icon: "/favicon.ico",
          })
        }, 500)

        toast({
          title: "Notifications Enabled",
          description: "You will now receive notifications for reminders, tasks, and important updates.",
        })
      } else if (permission === "denied") {
        toast({
          title: "Permission Denied",
          description:
            "Notifications were blocked. You can enable them in your browser settings by clicking the lock icon in the address bar.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Permission Required",
          description: "Please allow notifications when prompted by your browser.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to enable notifications:", error)
      toast({
        title: "Error",
        description: "Failed to enable notifications. Please try refreshing the page and try again.",
        variant: "destructive",
      })
    }
  }

  const handleSendTestNotification = () => {
    const currentPermission = checkNotificationPermission()

    if (currentPermission === "granted") {
      NotificationService.show({
        title: "Test Notification",
        body: "This is a test notification to confirm they're working properly.",
        icon: "/favicon.ico",
      })

      toast({
        title: "Test Notification Sent",
        description: "Check if you received the notification.",
      })
    } else {
      toast({
        title: "Notifications Not Enabled",
        description: "Please enable notifications first by clicking the Enable Notifications button.",
        variant: "destructive",
      })
    }
  }

  const resetToDefaults = () => {
    const defaultSettings = {
      profile: {
        name: "John Doe",
        email: "john.doe@example.com",
        avatar: "/placeholder.svg?height=100&width=100",
      },
      preferences: {
        theme: "system",
        language: "en",
        timeFormat: "12h",
        currency: "inr",
        notificationsEnabled: true,
        emailNotifications: true,
        soundEnabled: true,
        voiceInputEnabled: true,
      },
      privacy: {
        showOnlineStatus: true,
        shareActivityStats: false,
        allowDataCollection: true,
      },
    }

    setUserSettings(defaultSettings)
    setCurrentTheme("system")
    setTheme("system")
    setHasUnsavedChanges(true)

    toast({
      title: "Settings Reset",
      description: "All settings have been reset to default values.",
    })
  }

  // Format currency display
  const formatCurrency = (amount: number) => {
    const currency = currencyOptions.find((c) => c.value === userSettings.preferences.currency)
    if (currency) {
      if (currency.value === "usd") {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount)
      } else if (currency.value === "inr") {
        return new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(amount)
      }
    }
    return `₹${amount.toFixed(2)}`
  }

  if (!isMounted) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={saveSettings} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
            {hasUnsavedChanges && <span className="ml-1 h-2 w-2 bg-orange-500 rounded-full" />}
          </Button>
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
        </div>
      </div>

      {/* Notification Status Banner - Only show when needed and not on settings page */}
      {notificationPermission !== "granted" && userSettings.preferences.notificationsEnabled && (
        <Card
          className={`border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950 ${
            notificationPermission === "denied" ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950" : ""
          }`}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {notificationPermission === "denied" ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <BellOff className="h-5 w-5 text-orange-600" />
              )}
              <div>
                <p
                  className={`font-medium ${
                    notificationPermission === "denied"
                      ? "text-red-800 dark:text-red-200"
                      : "text-orange-800 dark:text-orange-200"
                  }`}
                >
                  {notificationPermission === "denied" ? "Permission Denied" : "Notifications are disabled"}
                </p>
                <p
                  className={`text-sm ${
                    notificationPermission === "denied"
                      ? "text-red-600 dark:text-red-300"
                      : "text-orange-600 dark:text-orange-300"
                  }`}
                >
                  {notificationPermission === "denied"
                    ? "Notifications were blocked. You can enable them in your browser settings by clicking the lock icon in the address bar."
                    : "Enable notifications to receive important reminders even when the app is in the background."}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {notificationPermission === "denied" ? (
                <Button
                  variant="outline"
                  onClick={() => window.open("https://support.google.com/chrome/answer/3220216", "_blank")}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Browser Settings
                </Button>
              ) : (
                <Button onClick={handleEnableNotifications} className="bg-orange-600 hover:bg-orange-700">
                  <Bell className="mr-2 h-4 w-4" />
                  Enable Notifications
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <img
                  src={userSettings.profile.avatar || "/placeholder.svg"}
                  alt="Avatar"
                  className="h-20 w-20 rounded-full object-cover"
                />
                <Button variant="outline">Change Avatar</Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={userSettings.profile.name}
                    onChange={(e) => updateSettings("profile", "name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userSettings.profile.email}
                    onChange={(e) => updateSettings("profile", "email", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the app looks and feels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={currentTheme === "light" ? "default" : "outline"}
                    onClick={() => handleThemeChange("light")}
                    className="flex items-center gap-2"
                  >
                    <Sun className="h-4 w-4" />
                    Light
                    {currentTheme === "light" && <Check className="h-4 w-4 ml-auto" />}
                  </Button>
                  <Button
                    variant={currentTheme === "dark" ? "default" : "outline"}
                    onClick={() => handleThemeChange("dark")}
                    className="flex items-center gap-2"
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                    {currentTheme === "dark" && <Check className="h-4 w-4 ml-auto" />}
                  </Button>
                  <Button
                    variant={currentTheme === "system" ? "default" : "outline"}
                    onClick={() => handleThemeChange("system")}
                    className="flex items-center gap-2"
                  >
                    <Laptop className="h-4 w-4" />
                    System
                    {currentTheme === "system" && <Check className="h-4 w-4 ml-auto" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Current theme: <span className="font-medium">{currentTheme}</span>
                  {resolvedTheme && currentTheme === "system" && <span className="ml-1">({resolvedTheme})</span>}
                </p>
              </div>

              <div className="space-y-3">
                <Label>Language</Label>
                <Select
                  value={userSettings.preferences.language}
                  onValueChange={(value) => updateSettings("preferences", "language", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <span>{option.flag}</span>
                          <span>{option.label}</span>
                          {userSettings.preferences.language === option.value && <Check className="h-4 w-4 ml-auto" />}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Time Format</Label>
                  <Select
                    value={userSettings.preferences.timeFormat}
                    onValueChange={(value) => updateSettings("preferences", "timeFormat", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                      <SelectItem value="24h">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={userSettings.preferences.currency}
                    onValueChange={(value) => updateSettings("preferences", "currency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="h-4 w-4" />
                            <span>{option.label}</span>
                            {userSettings.preferences.currency === option.value && (
                              <Check className="h-4 w-4 ml-auto" />
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Currency Preview:</p>
                <p className="text-lg">{formatCurrency(100)}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Voice Input</Label>
                    <p className="text-sm text-muted-foreground">Enable voice commands and input</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {userSettings.preferences.voiceInputEnabled ? (
                      <Mic className="h-4 w-4 text-green-600" />
                    ) : (
                      <MicOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={userSettings.preferences.voiceInputEnabled}
                      onCheckedChange={(checked) => updateSettings("preferences", "voiceInputEnabled", checked)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sound Effects</Label>
                    <p className="text-sm text-muted-foreground">Enable sound effects and audio feedback</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {userSettings.preferences.soundEnabled ? (
                      <Volume2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={userSettings.preferences.soundEnabled}
                      onCheckedChange={(checked) => updateSettings("preferences", "soundEnabled", checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {notificationPermission === "granted" ? (
                      <Bell className="h-5 w-5 text-green-600" />
                    ) : notificationPermission === "denied" ? (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    ) : (
                      <BellOff className="h-5 w-5 text-orange-600" />
                    )}
                    <h4 className="font-medium">
                      {notificationPermission === "granted"
                        ? "Notifications Enabled"
                        : notificationPermission === "denied"
                          ? "Permission Denied"
                          : "Notifications Disabled"}
                    </h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {notificationPermission === "granted"
                      ? "You will receive notifications for important updates"
                      : notificationPermission === "denied"
                        ? "Notifications were blocked. Check your browser settings."
                        : "Enable notifications to receive important reminders"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {notificationPermission === "granted" ? (
                    <Button variant="outline" onClick={handleSendTestNotification}>
                      Send Test Notification
                    </Button>
                  ) : notificationPermission === "denied" ? (
                    <Button
                      variant="outline"
                      onClick={() => window.open("https://support.google.com/chrome/answer/3220216", "_blank")}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Browser Settings
                    </Button>
                  ) : (
                    <Button onClick={handleEnableNotifications}>Enable Notifications Now</Button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications on this device</p>
                  </div>
                  <Switch
                    checked={userSettings.preferences.notificationsEnabled}
                    onCheckedChange={(checked) => {
                      updateSettings("preferences", "notificationsEnabled", checked)
                      if (checked && notificationPermission !== "granted" && notificationPermission !== "denied") {
                        // Only prompt if not already granted or denied
                        setTimeout(() => handleEnableNotifications(), 500)
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={userSettings.preferences.emailNotifications}
                    onCheckedChange={(checked) => updateSettings("preferences", "emailNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sound Notifications</Label>
                    <p className="text-sm text-muted-foreground">Play sound when notifications arrive</p>
                  </div>
                  <Switch
                    checked={userSettings.preferences.soundEnabled}
                    onCheckedChange={(checked) => updateSettings("preferences", "soundEnabled", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Manage your privacy and data preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Online Status</Label>
                  <p className="text-sm text-muted-foreground">Allow others to see when you're online</p>
                </div>
                <Switch
                  checked={userSettings.privacy.showOnlineStatus}
                  onCheckedChange={(checked) => updateSettings("privacy", "showOnlineStatus", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Share Activity Stats</Label>
                  <p className="text-sm text-muted-foreground">Share your activity statistics with others</p>
                </div>
                <Switch
                  checked={userSettings.privacy.shareActivityStats}
                  onCheckedChange={(checked) => updateSettings("privacy", "shareActivityStats", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Data Collection</Label>
                  <p className="text-sm text-muted-foreground">Collect data to improve the app experience</p>
                </div>
                <Switch
                  checked={userSettings.privacy.allowDataCollection}
                  onCheckedChange={(checked) => updateSettings("privacy", "allowDataCollection", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
