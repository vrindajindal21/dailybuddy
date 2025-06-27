"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { format, parse } from "date-fns"
import {
  CalendarIcon,
  Clock,
  Plus,
  Trash2,
  Edit,
  Pill,
  Bell,
  BellOff,
  Check,
  X,
  Volume2,
  AlertTriangle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type MedicationType = {
  id: number;
  name: string;
  dosage: string;
  instructions: string;
  schedule: { time: string; days: string[] }[];
  notificationsEnabled: boolean;
  alarmEnabled: boolean;
  alarmSound: string;
  alarmVolume: number;
  color: string;
  startDate: string;
  endDate: string | null;
  notes: string;
  // Optional display-only properties for sorting and display
  dueTime?: string;
  formattedTime?: string;
  scheduleTime?: Date;
};

export default function MedicationsPage() {
  const { toast } = useToast()
  const [medications, setMedications] = useState<MedicationType[]>([
    {
      id: 1,
      name: "Vitamin D",
      dosage: "1000 IU",
      instructions: "Take with food",
      schedule: [{ time: "08:00", days: ["monday", "wednesday", "friday", "sunday"] }],
      notificationsEnabled: true,
      alarmEnabled: true,
      alarmSound: "bell",
      alarmVolume: 70,
      color: "blue",
      startDate: "2025-03-01",
      endDate: null, // null means indefinite
      notes: "For bone health",
    },
    {
      id: 2,
      name: "Paracetamol",
      dosage: "500mg",
      instructions: "Take as needed for pain",
      schedule: [
        { time: "08:00", days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
        { time: "20:00", days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
      ],
      notificationsEnabled: true,
      alarmEnabled: true,
      alarmSound: "bell",
      alarmVolume: 70,
      color: "red",
      startDate: "2025-03-15",
      endDate: "2025-03-22",
      notes: "For headache",
    },
    {
      id: 3,
      name: "Multivitamin",
      dosage: "1 tablet",
      instructions: "Take with breakfast",
      schedule: [
        { time: "09:00", days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
      ],
      notificationsEnabled: true,
      alarmEnabled: true,
      alarmSound: "bell",
      alarmVolume: 70,
      color: "green",
      startDate: "2025-03-01",
      endDate: null,
      notes: "General health supplement",
    },
  ])

  const [newMedication, setNewMedication] = useState<MedicationType>({
    id: 0,
    name: "",
    dosage: "",
    instructions: "",
    schedule: [{ time: "08:00", days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] }],
    notificationsEnabled: true,
    alarmEnabled: true,
    alarmSound: "bell",
    alarmVolume: 70,
    color: "blue",
    startDate: new Date().toISOString().split('T')[0],
    endDate: null,
    notes: "",
  })

  const [editingMedication, setEditingMedication] = useState<MedicationType | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState("default")
  const [todaysMedications, setTodaysMedications] = useState<MedicationType[]>([])
  const [upcomingMedications, setUpcomingMedications] = useState<MedicationType[]>([])
  const [filter, setFilter] = useState("all")
  const [isMounted, setIsMounted] = useState(false)
  const [medicationsInitialized, setMedicationsInitialized] = useState(false)
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false)
  const [currentAlarm, setCurrentAlarm] = useState<MedicationType | null>(null)
  const [showPermissionAlert, setShowPermissionAlert] = useState(false)
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false)
  const [use12HourFormat, setUse12HourFormat] = useState(true)

  // Audio context for Web Audio API
  const audioContextRef = useRef<AudioContext | null>(null)

  // Interval for periodic notifications
  const notificationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Oscillator reference for alarm sound
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  useEffect(() => {
    setIsMounted(true)
    return () => {
      // Clean up intervals on unmount
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current as NodeJS.Timeout)
      }

      // Stop any playing sounds
      stopAlarm()
    }
  }, [])

  // Initialize audio context
  useEffect(() => {
    if (isMounted && typeof window !== "undefined") {
      // Create audio context on first user interaction to comply with browser policies
      const initAudioContext = () => {
        try {
          let AudioContextClass = window.AudioContext
          if (!AudioContextClass && 'webkitAudioContext' in window) {
            AudioContextClass = (window as any).webkitAudioContext
          }
          if (AudioContextClass) {
            audioContextRef.current = new AudioContextClass()
            console.log("Audio context initialized successfully")
          } else {
            console.warn("AudioContext not supported in this browser")
          }
        } catch (error) {
          console.error("Failed to initialize audio context:", error)
        }
        document.removeEventListener("click", initAudioContext)
        document.removeEventListener("touchstart", initAudioContext)
      }

      document.addEventListener("click", initAudioContext)
      document.addEventListener("touchstart", initAudioContext)

      // Register service worker for notifications when app is closed
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("ServiceWorker registration successful with scope: ", registration.scope)
          })
          .catch((err) => {
            console.log("ServiceWorker registration failed: ", err)
          })
      }

      return () => {
        document.removeEventListener("click", initAudioContext)
        document.removeEventListener("touchstart", initAudioContext)

        // Clean up audio context
        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
          try {
            audioContextRef.current.close()
          } catch (e) {
            console.error("Error closing audio context:", e)
          }
        }
      }
    }
  }, [isMounted])

  // Load medications from localStorage
  useEffect(() => {
    if (isMounted && !medicationsInitialized) {
      const savedMedications = localStorage.getItem("medications")
      if (savedMedications) {
        try {
          setMedications(JSON.parse(savedMedications))
        } catch (e) {
          console.error("Error parsing saved medications:", e)
        }
      }

      // Check notification permission
      if (Notification.permission === "granted") {
        setNotificationPermission("granted")
      } else {
        setNotificationPermission("default")
        setShowPermissionAlert(true)
      }

      // Check time format preference
      const savedTimeFormat = localStorage.getItem("timeFormat")
      if (savedTimeFormat) {
        setUse12HourFormat(savedTimeFormat === "12h")
      }

      setMedicationsInitialized(true)
    }
  }, [isMounted, medicationsInitialized])

  // Save medications to localStorage when they change
  useEffect(() => {
    if (isMounted && medicationsInitialized) {
      try {
        localStorage.setItem("medications", JSON.stringify(medications))
      } catch (e) {
        console.error("Error saving medications to localStorage:", e)
      }
      updateTodaysMedications()
    }
  }, [medications, isMounted, medicationsInitialized])

  // Save time format preference
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("timeFormat", use12HourFormat ? "12h" : "24h")
    }
  }, [use12HourFormat, isMounted])

  // Generate a sound using Web Audio API
  const generateSound = useCallback(
    (frequency: number, duration: number, volume: number, type = "sine", isRepeat = false) => {
      if (!isMounted) return false

      try {
        // Initialize audio context if not already done
        if (!audioContextRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
          if (!AudioContextClass) {
            console.warn("AudioContext not supported in this browser")
            return false
          }
          audioContextRef.current = new AudioContextClass()
        }

        const context = audioContextRef.current

        // Stop any currently playing sound
        if (oscillatorRef.current) {
          try {
            oscillatorRef.current.stop()
            oscillatorRef.current.disconnect()
          } catch (e) {
            console.log("Error stopping oscillator:", e)
          }
        }

        // Create oscillator and gain nodes
        oscillatorRef.current = context.createOscillator()
        gainNodeRef.current = context.createGain()

        // Set oscillator properties
        oscillatorRef.current.type = type as OscillatorType
        oscillatorRef.current.frequency.value = frequency

        // Set volume (0-100 to 0-1)
        const normalizedVolume = (volume / 100) * (isRepeat ? 0.7 : 1) // Lower volume for repeats
        gainNodeRef.current.gain.value = normalizedVolume

        // Connect nodes
        if (oscillatorRef.current && gainNodeRef.current) {
          oscillatorRef.current.connect(gainNodeRef.current)
          gainNodeRef.current.connect(context.destination)
        }

        // Schedule envelope
        const now = context.currentTime
        gainNodeRef.current.gain.setValueAtTime(normalizedVolume, now)
        gainNodeRef.current.gain.exponentialRampToValueAtTime(0.001, now + duration)

        // Start and stop oscillator
        if (oscillatorRef.current && gainNodeRef.current) {
          oscillatorRef.current.start(now)
          oscillatorRef.current.stop(now + duration)
        }

        // Clean up after sound finishes
        oscillatorRef.current.onended = () => {
          if (oscillatorRef.current) {
            oscillatorRef.current.disconnect()
            oscillatorRef.current = null
          }
          if (gainNodeRef.current) {
            gainNodeRef.current.disconnect()
            gainNodeRef.current = null
          }
        }

        return true
      } catch (error) {
        console.error("Error generating sound:", error)
        return false
      }
    },
    [isMounted],
  )

  // Play alarm sound
  const playAlarm = useCallback(
    (medication: MedicationType, isRepeat = false) => {
      if (!isMounted || !medication.alarmEnabled) return

      // Set current alarm
      if (!isRepeat) {
        setCurrentAlarm(medication)
        setIsAlarmPlaying(true)
      }

      let success = false

      switch (medication.alarmSound) {
        case "bell":
          success = generateSound(830, 1.5, medication.alarmVolume, "sine", isRepeat)
          break

        case "beep":
          success = generateSound(800, 0.3, medication.alarmVolume, "square", isRepeat)
          break

        case "chime":
          success = generateSound(1000, 1.0, medication.alarmVolume, "sine", isRepeat)
          break

        default:
          success = generateSound(440, 0.5, medication.alarmVolume, "sine", isRepeat)
      }

      if (!success && !isRepeat) {
        toast({
          title: "Sound Error",
          description: "Could not play alarm sound. Audio might not be supported in this environment.",
          variant: "destructive",
        })
      }

      return success
    },
    [generateSound, isMounted, toast],
  )

  // Stop alarm sound
  const stopAlarm = useCallback(() => {
    if (!isMounted) return

    // Stop oscillator if it exists
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop()
        oscillatorRef.current.disconnect()
        oscillatorRef.current = null
      } catch (e) {
        console.log("Error stopping oscillator:", e)
      }
    }

    // Stop gain node if it exists
    if (gainNodeRef.current) {
      try {
        gainNodeRef.current.disconnect()
        gainNodeRef.current = null
      } catch (e) {
        console.log("Error disconnecting gain node:", e)
      }
    }

    // Clear any notification intervals
    if (notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current as NodeJS.Timeout)
      notificationIntervalRef.current = null
    }

    setIsAlarmPlaying(false)
    setCurrentAlarm(null)
  }, [isMounted])

  // Test alarm sound
  const testAlarmSound = useCallback(
    (sound: string, volume: number) => {
      let success = false

      switch (sound) {
        case "bell":
          success = generateSound(830, 1.5, volume, "sine")
          break

        case "beep":
          success = generateSound(800, 0.3, volume, "square")
          break

        case "chime":
          success = generateSound(1000, 1.0, volume, "sine")
          break

        default:
          success = generateSound(440, 0.5, volume, "sine")
      }

      if (!success) {
        toast({
          title: "Sound Error",
          description: "Could not play test sound. Audio might not be supported in this environment.",
          variant: "destructive",
        })
      }

      return success
    },
    [generateSound, toast],
  )

  // Update today's medications
  const updateTodaysMedications = useCallback(() => {
    if (!isMounted) return

    const now = new Date()
    // Fix: Use proper weekday format
    const today =
      now.getDay() === 0
        ? "sunday"
        : now.getDay() === 1
          ? "monday"
          : now.getDay() === 2
            ? "tuesday"
            : now.getDay() === 3
              ? "wednesday"
              : now.getDay() === 4
                ? "thursday"
                : now.getDay() === 5
                  ? "friday"
                  : "saturday"

    const todaysMeds: MedicationType[] = []
    const upcomingMeds: MedicationType[] = []

    medications.forEach((medication: MedicationType) => {
      // Check if medication is active based on start/end dates
      const startDate = medication.startDate ? new Date(medication.startDate) : null
      const endDate = medication.endDate ? new Date(medication.endDate) : null

      if (startDate && startDate > now) return
      if (endDate && endDate < now) return

      medication.schedule.forEach((schedule: { time: string; days: string[] }) => {
        if (schedule.days.includes(today)) {
          const [hours, minutes] = schedule.time.split(":").map(Number)
          const scheduleTime = new Date(now)
          scheduleTime.setHours(hours, minutes, 0, 0)

          const medicationDue: MedicationType = {
            ...medication,
            dueTime: schedule.time,
            formattedTime: formatTime(schedule.time),
            scheduleTime,
          }

          if (scheduleTime > now) {
            upcomingMeds.push(medicationDue)
          } else {
            todaysMeds.push(medicationDue)
          }
        }
      })
    })

    // Sort by time
    todaysMeds.sort((a: MedicationType, b: MedicationType) => {
      if (!a.scheduleTime || !b.scheduleTime) return 0;
      return a.scheduleTime.getTime() - b.scheduleTime.getTime();
    });
    upcomingMeds.sort((a: MedicationType, b: MedicationType) => {
      if (!a.scheduleTime || !b.scheduleTime) return 0;
      return a.scheduleTime.getTime() - b.scheduleTime.getTime();
    });

    setTodaysMedications(todaysMeds)
    setUpcomingMedications(upcomingMeds)
  }, [isMounted, medications])

  // Format time based on user preference (12h or 24h)
  const formatTime = useCallback(
    (timeString: string) => {
      if (!use12HourFormat) return timeString // Return 24h format as is

      try {
        // Parse the 24h time string
        const date = parse(timeString, "HH:mm", new Date())
        // Format as 12h time with AM/PM
        return format(date, "h:mm a")
      } catch (error) {
        console.error("Error formatting time:", error)
        return timeString
      }
    },
    [use12HourFormat],
  )

  const addMedication = useCallback(() => {
    let hasErrors = false
    const errorFields = []

    if (!newMedication.name.trim()) {
      hasErrors = true
      errorFields.push("name")
      toast({
        title: "Error",
        description: "Medication name is required",
        variant: "destructive",
      })
    }

    if (!newMedication.dosage.trim()) {
      hasErrors = true
      errorFields.push("dosage")
      toast({
        title: "Error",
        description: "Medication dosage is required",
        variant: "destructive",
      })
    }

    if (hasErrors) {
      // Highlight the error fields
      errorFields.forEach((field) => {
        const element = document.getElementById(field)
        if (element) {
          element.setAttribute("data-error", "true")
          element.classList.add("border-red-500", "focus:ring-red-500")

          // Remove error styling after 3 seconds or on input
          element.addEventListener("input", function onInput() {
            element.removeAttribute("data-error")
            element.classList.remove("border-red-500", "focus:ring-red-500")
            element.removeEventListener("input", onInput)
          })

          setTimeout(() => {
            if (element.getAttribute("data-error")) {
              element.removeAttribute("data-error")
              element.classList.remove("border-red-500", "focus:ring-red-500")
            }
          }, 3000)
        }
      })

      return
    }

    const medication = {
      id: Date.now(),
      name: newMedication.name,
      dosage: newMedication.dosage,
      instructions: newMedication.instructions,
      schedule: newMedication.schedule,
      notificationsEnabled: newMedication.notificationsEnabled,
      alarmEnabled: newMedication.alarmEnabled,
      alarmSound: newMedication.alarmSound,
      alarmVolume: newMedication.alarmVolume,
      color: newMedication.color,
      startDate: typeof newMedication.startDate === 'string' ? newMedication.startDate : format(newMedication.startDate, "yyyy-MM-dd"),
      endDate: newMedication.endDate ? (typeof newMedication.endDate === 'string' ? newMedication.endDate : format(newMedication.endDate, "yyyy-MM-dd")) : null,
      notes: newMedication.notes,
    }

    setMedications((prev) => [...prev, medication])
    setNewMedication({
      name: "",
      dosage: "",
      instructions: "",
      schedule: [
        { time: "08:00", days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
      ],
      notificationsEnabled: true,
      alarmEnabled: true,
      alarmSound: "bell",
      alarmVolume: 70,
      color: "blue",
      startDate: new Date(),
      endDate: null,
      notes: "",
    })
    setIsAddDialogOpen(false)

    toast({
      title: "Medication added",
      description: "Your medication has been added successfully.",
    })
  }, [newMedication, toast])

  const updateMedication = useCallback(() => {
    let hasErrors = false
    const errorFields = []

    if (!editingMedication || !editingMedication.name || !editingMedication.name.trim()) {
      hasErrors = true
      errorFields.push("edit-name")
      toast({
        title: "Error",
        description: "Medication name is required",
        variant: "destructive",
      })
    }

    if (!editingMedication || !editingMedication.dosage || !editingMedication.dosage.trim()) {
      hasErrors = true
      errorFields.push("edit-dosage")
      toast({
        title: "Error",
        description: "Medication dosage is required",
        variant: "destructive",
      })
    }

    if (hasErrors) {
      // Highlight the error fields
      errorFields.forEach((field) => {
        const element = document.getElementById(field)
        if (element) {
          element.setAttribute("data-error", "true")
          element.classList.add("border-red-500", "focus:ring-red-500")

          // Remove error styling after 3 seconds or on input
          element.addEventListener("input", function onInput() {
            element.removeAttribute("data-error")
            element.classList.remove("border-red-500", "focus:ring-red-500")
            element.removeEventListener("input", onInput)
          })

          setTimeout(() => {
            if (element.getAttribute("data-error")) {
              element.removeAttribute("data-error")
              element.classList.remove("border-red-500", "focus:ring-red-500")
            }
          }, 3000)
        }
      })

      return
    }

    setMedications((prev) =>
      prev.map((medication: MedicationType) =>
        editingMedication && medication.id === editingMedication.id
          ? {
              ...medication,
              name: editingMedication.name,
              dosage: editingMedication.dosage,
              instructions: editingMedication.instructions,
              schedule: editingMedication.schedule,
              notificationsEnabled: editingMedication.notificationsEnabled,
              alarmEnabled: editingMedication.alarmEnabled,
              alarmSound: editingMedication.alarmSound,
              alarmVolume: editingMedication.alarmVolume,
              color: editingMedication.color,
              startDate:
                typeof editingMedication.startDate === 'string'
                  ? editingMedication.startDate
                  : format(editingMedication.startDate, "yyyy-MM-dd"),
              endDate:
                editingMedication.endDate
                  ? (typeof editingMedication.endDate === 'string'
                      ? editingMedication.endDate
                      : format(editingMedication.endDate, "yyyy-MM-dd"))
                  : null,
              notes: editingMedication.notes,
            }
          : medication,
      ),
    )

    setIsEditDialogOpen(false)

    toast({
      title: "Medication updated",
      description: "Your medication has been updated successfully.",
    })
  }, [editingMedication, toast])

  const deleteMedication = useCallback(
    (id: number) => {
      setMedications((prev) => prev.filter((medication: MedicationType) => medication.id !== id))

      toast({
        title: "Medication deleted",
        description: "Your medication has been deleted.",
      })
    },
    [toast],
  )

  const startEditMedication = useCallback((medication: MedicationType) => {
    setEditingMedication({
      ...medication,
      startDate: typeof medication.startDate === 'string' ? medication.startDate : format(medication.startDate, "yyyy-MM-dd"),
      endDate: medication.endDate ? (typeof medication.endDate === 'string' ? medication.endDate : format(medication.endDate, "yyyy-MM-dd")) : '',
    })
    setIsEditDialogOpen(true)
  }, [])

  const requestNotificationPermission = useCallback(async () => {
    const granted = await Notification.requestPermission()
    setNotificationPermission(granted === "granted" ? "granted" : "denied")
    setShowPermissionAlert(granted === "denied")
    setIsPermissionDialogOpen(false)

    if (!granted) {
      toast({
        title: "Notification permission denied",
        description: "You won't receive medication reminders. You can enable them in your browser settings.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Notifications enabled",
        description: "You will now receive medication reminders.",
      })
    }
  }, [toast])

  const addScheduleTime = useCallback(() => {
    setNewMedication((prev) => ({
      ...prev,
      schedule: [
        ...prev.schedule,
        { time: "12:00", days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
      ],
    }))
  }, [])

  const removeScheduleTime = useCallback((index: number) => {
    setNewMedication((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index),
    }))
  }, [])

  const updateScheduleTime = useCallback((index: number, time: string) => {
    setNewMedication((prev) => {
      const updatedSchedule = [...prev.schedule]
      updatedSchedule[index] = { ...updatedSchedule[index], time }
      return { ...prev, schedule: updatedSchedule }
    })
  }, [])

  const updateScheduleDays = useCallback((index: number, day: string, checked: boolean) => {
    setNewMedication((prev) => {
      const updatedSchedule = [...prev.schedule]
      if (checked) {
        updatedSchedule[index] = {
          ...updatedSchedule[index],
          days: [...updatedSchedule[index].days, day].sort((a: string, b: string) => {
            const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
            return days.indexOf(a) - days.indexOf(b)
          }),
        }
      } else {
        updatedSchedule[index] = {
          ...updatedSchedule[index],
          days: updatedSchedule[index].days.filter((d: string) => d !== day),
        }
      }
      return { ...prev, schedule: updatedSchedule }
    })
  }, [])

  // Same functions for editing
  const addEditScheduleTime = useCallback(() => {
    if (!editingMedication) return

    setEditingMedication((prev) => prev ? {
      ...prev,
      schedule: [
        ...prev.schedule,
        { time: "12:00", days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
      ],
    } : null)
  }, [editingMedication])

  const removeEditScheduleTime = useCallback(
    (index: number) => {
      if (!editingMedication) return

      setEditingMedication((prev) => prev ? {
        ...prev,
        schedule: prev.schedule.filter((_, i) => i !== index),
      } : null)
    },
    [editingMedication],
  )

  const updateEditScheduleTime = useCallback((index: number, time: string) => {
    if (!editingMedication) return

    setEditingMedication((prev) => {
      if (!prev) return null;
      const updatedSchedule = [...prev.schedule]
      updatedSchedule[index] = { ...updatedSchedule[index], time }
      return { ...prev, schedule: updatedSchedule }
    })
  }, [editingMedication])

  const updateEditScheduleDays = useCallback((index: number, day: string, checked: boolean) => {
    if (!editingMedication) return

    setEditingMedication((prev) => {
      if (!prev) return null;
      const updatedSchedule = [...prev.schedule]
      if (checked) {
        updatedSchedule[index] = {
          ...updatedSchedule[index],
          days: [...updatedSchedule[index].days, day].sort((a: string, b: string) => {
            const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
            return days.indexOf(a) - days.indexOf(b)
          }),
        }
      } else {
        updatedSchedule[index] = {
          ...updatedSchedule[index],
          days: prev.schedule[index].days.filter((d: string) => d !== day),
        }
      }
      return { ...prev, schedule: updatedSchedule }
    })
  }, [editingMedication])

  const getMedicationColor = useCallback((color: string) => {
    switch (color) {
      case "red":
        return "bg-red-500"
      case "blue":
        return "bg-blue-500"
      case "green":
        return "bg-green-500"
      case "yellow":
        return "bg-yellow-500"
      case "purple":
        return "bg-purple-500"
      case "pink":
        return "bg-pink-500"
      case "orange":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }, [])

  const formatDaysList = useCallback((days: string[]) => {
    if (days.length === 7) return "Every day"

    const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"]
    const weekend = ["saturday", "sunday"]

    if (weekdays.every((day) => days.includes(day)) && weekend.every((day) => !days.includes(day))) {
      return "Weekdays"
    }

    if (weekend.every((day) => days.includes(day)) && weekdays.every((day) => !days.includes(day))) {
      return "Weekends"
    }

    return days.map((day) => day.charAt(0).toUpperCase() + day.slice(1, 3)).join(", ")
  }, [])

  const filteredMedications = medications.filter((medication: MedicationType) => {
    if (filter === "all") return true
    if (filter === "active") {
      const now = new Date()
      const startDate = medication.startDate ? new Date(medication.startDate) : null
      const endDate = medication.endDate ? new Date(medication.endDate) : null

      if (startDate && startDate > now) return false
      if (endDate && endDate < now) return false
      return true
    }
    return false
  })

  if (!isMounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-x-hidden">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-6 sm:space-y-8 max-w-full w-full">
        {showPermissionAlert && (
          <Alert variant="warning" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Notifications are disabled</AlertTitle>
            <AlertDescription>
              Enable notifications to receive medication reminders even when the app is in the background.
              <Button variant="outline" size="sm" className="ml-2" onClick={() => setIsPermissionDialogOpen(true)}>
                Enable Notifications
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enable Notifications</DialogTitle>
              <DialogDescription>
                Notifications allow you to receive medication reminders even when the app is in the background or closed.
                This is especially important for medication adherence.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="mb-4">By enabling notifications, you'll:</p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>Get timely medication reminders with sound</li>
                <li>Never miss important doses</li>
                <li>Receive periodic notifications for critical medications</li>
                <li>Get vibration alerts on mobile devices</li>
              </ul>
              <p>You can always change this setting later in your browser or device settings.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>
                Not Now
              </Button>
              <Button onClick={requestNotificationPermission}>Enable Notifications</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Active Alarm Dialog */}
        {isAlarmPlaying && currentAlarm && (
          <Dialog open={isAlarmPlaying} onOpenChange={(open) => !open && stopAlarm()}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Medication Reminder</DialogTitle>
                <DialogDescription>It's time to take your medication</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center gap-4 py-4">
                <div
                  className={`w-16 h-16 rounded-full ${getMedicationColor(currentAlarm.color)} flex items-center justify-center`}
                >
                  <Pill className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-bold">{currentAlarm.name}</h2>
                <p className="text-lg">{currentAlarm.dosage}</p>
                {currentAlarm.instructions && <p className="text-muted-foreground">{currentAlarm.instructions}</p>}
              </div>
              <DialogFooter>
                <Button onClick={stopAlarm}>Dismiss</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-2 sm:px-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Medications</h2>
            <p className="text-muted-foreground text-base sm:text-lg">Track your medications and schedules</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto mt-2 sm:mt-0">
                <Plus className="mr-2 h-4 w-4" />
                Add Medication
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Medication</DialogTitle>
                <DialogDescription>Add a new medication to your tracking list</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="flex items-center">
                      Medication Name <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Medication name"
                      value={newMedication.name}
                      onChange={(e) => {
                        setNewMedication({ ...newMedication, name: e.target.value })
                        // Remove error styling on input
                        e.target.removeAttribute("data-error")
                        e.target.classList.remove("border-red-500", "focus:ring-red-500")
                      }}
                      className="focus:ring-primary"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dosage" className="flex items-center">
                      Dosage <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="dosage"
                      placeholder="e.g., 500mg"
                      value={newMedication.dosage}
                      onChange={(e) => {
                        setNewMedication({ ...newMedication, dosage: e.target.value })
                        // Remove error styling on input
                        e.target.removeAttribute("data-error")
                        e.target.classList.remove("border-red-500", "focus:ring-red-500")
                      }}
                      className="focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="instructions">Instructions</Label>
                  <Input
                    id="instructions"
                    placeholder="e.g., Take with food"
                    value={newMedication.instructions}
                    onChange={(e) => setNewMedication({ ...newMedication, instructions: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Schedule</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addScheduleTime}>
                      <Plus className="h-4 w-4 mr-1" /> Add Time
                    </Button>
                  </div>

                  {newMedication.schedule.map((schedule: { time: string; days: string[] }, index: number) => (
                    <div key={index} className="space-y-3 p-3 border rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor={`time-${index}`}>Time</Label>
                        </div>
                        {newMedication.schedule.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeScheduleTime(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <Input
                        id={`time-${index}`}
                        type="time"
                        value={schedule.time}
                        onChange={(e) => updateScheduleTime(index, e.target.value)}
                      />

                      <div className="space-y-2">
                        <Label>Days</Label>
                        <div className="flex flex-wrap gap-2">
                          {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day: string) => (
                            <div key={day} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`${day}-${index}`}
                                checked={schedule.days.includes(day)}
                                onChange={(e) => updateScheduleDays(index, day, e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <Label htmlFor={`${day}-${index}`} className="text-sm">
                                {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={typeof newMedication.startDate === 'string' ? newMedication.startDate : newMedication.startDate.toISOString().split('T')[0]}
                    onChange={e => setNewMedication({ ...newMedication, startDate: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newMedication.endDate ? (typeof newMedication.endDate === 'string' ? newMedication.endDate : newMedication.endDate.toISOString().split('T')[0]) : ''}
                    onChange={e => setNewMedication({ ...newMedication, endDate: e.target.value })}
                    placeholder="No end date"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {["red", "blue", "green", "yellow", "purple", "pink", "orange"].map((color: string) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewMedication({ ...newMedication, color })}
                        className={`w-8 h-8 rounded-full ${getMedicationColor(color)} ${
                          newMedication.color === color ? "ring-2 ring-offset-2 ring-primary" : ""
                        }`}
                        aria-label={`${color} color`}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications">Notifications</Label>
                      <div className="text-xs text-muted-foreground">
                        Get reminded when it's time to take your medication
                      </div>
                    </div>
                    <Switch
                      id="notifications"
                      checked={newMedication.notificationsEnabled}
                      onCheckedChange={(checked) =>
                        setNewMedication({ ...newMedication, notificationsEnabled: checked })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="alarm">Alarm Sound</Label>
                      <div className="text-xs text-muted-foreground">
                        Play an alarm sound when it's time to take your medication
                      </div>
                    </div>
                    <Switch
                      id="alarm"
                      checked={newMedication.alarmEnabled}
                      onCheckedChange={(checked) => setNewMedication({ ...newMedication, alarmEnabled: checked })}
                    />
                  </div>

                  {newMedication.alarmEnabled && (
                    <div className="space-y-4 mt-2">
                      <div className="grid gap-2">
                        <Label htmlFor="alarmSound">Sound</Label>
                        <div className="flex gap-2">
                          <Select
                            value={newMedication.alarmSound}
                            onValueChange={(value) => setNewMedication({ ...newMedication, alarmSound: value })}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select sound" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bell">Bell</SelectItem>
                              <SelectItem value="beep">Beep</SelectItem>
                              <SelectItem value="chime">Chime</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => testAlarmSound(newMedication.alarmSound, newMedication.alarmVolume)}
                          >
                            <Volume2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <div className="flex justify-between">
                          <Label htmlFor="alarmVolume">Volume</Label>
                          <span className="text-sm text-muted-foreground">{newMedication.alarmVolume}%</span>
                        </div>
                        <Slider
                          id="alarmVolume"
                          min={0}
                          max={100}
                          step={10}
                          value={[newMedication.alarmVolume]}
                          onValueChange={(value) => setNewMedication({ ...newMedication, alarmVolume: value[0] })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes"
                    value={newMedication.notes}
                    onChange={(e) => setNewMedication({ ...newMedication, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addMedication}>Add Medication</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center px-2 sm:px-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter medications" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Medications</SelectItem>
              <SelectItem value="active">Active Medications</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 px-2 sm:px-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Medications</CardTitle>
              <CardDescription>Medications you need to take today</CardDescription>
            </CardHeader>
            <CardContent>
              {todaysMedications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <Check className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">All caught up!</h3>
                  <p className="text-sm text-muted-foreground">No more medications to take today</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todaysMedications.map((medication: MedicationType, index: number) => (
                    <div key={`${medication.id}-${index}`} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div
                        className={`w-2 h-full min-h-[40px] rounded-full ${getMedicationColor(medication.color)}`}
                      ></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{medication.name}</h4>
                          <Badge variant="outline">{medication.formattedTime || medication.dueTime}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{medication.dosage}</p>
                        {medication.instructions && (
                          <p className="text-xs text-muted-foreground mt-1">{medication.instructions}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Medications</CardTitle>
              <CardDescription>Medications scheduled for later today</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingMedications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <Check className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">All done for today!</h3>
                  <p className="text-sm text-muted-foreground">No more medications scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingMedications.map((medication: MedicationType, index: number) => (
                    <div key={`${medication.id}-${index}`} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div
                        className={`w-2 h-full min-h-[40px] rounded-full ${getMedicationColor(medication.color)}`}
                      ></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{medication.name}</h4>
                          <Badge>{medication.formattedTime || medication.dueTime}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{medication.dosage}</p>
                        {medication.instructions && (
                          <p className="text-xs text-muted-foreground mt-1">{medication.instructions}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Medications</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Medication List</CardTitle>
                <CardDescription>Manage your medications</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredMedications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <Pill className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No medications found</h3>
                    <p className="text-sm text-muted-foreground">Add your first medication to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMedications.map((medication: MedicationType, index: number) => (
                      <div key={medication.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div
                          className={`w-2 h-full min-h-[40px] rounded-full ${getMedicationColor(medication.color)}`}
                        ></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{medication.name}</h4>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => startEditMedication(medication)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteMedication(medication.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{medication.dosage}</p>

                          <div className="mt-2 space-y-1">
                            {medication.schedule.map((schedule: { time: string; days: string[] }, index: number) => (
                              <div key={index} className="flex items-center text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>
                                  {use12HourFormat
                                    ? format(parse(schedule.time, "HH:mm", new Date()), "h:mm a")
                                    : schedule.time}{" "}
                                  - {formatDaysList(schedule.days)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {medication.instructions && (
                            <p className="text-xs text-muted-foreground mt-2">{medication.instructions}</p>
                          )}

                          <div className="flex items-center gap-2 mt-2">
                            {medication.startDate && (
                              <Badge variant="outline" className="text-xs">
                                From: {format(new Date(medication.startDate), "MMM d, yyyy")}
                              </Badge>
                            )}
                            {medication.endDate && (
                              <Badge variant="outline" className="text-xs">
                                Until: {format(new Date(medication.endDate), "MMM d, yyyy")}
                              </Badge>
                            )}
                            {medication.notificationsEnabled ? (
                              <Badge variant="secondary" className="text-xs">
                                <Bell className="h-3 w-3 mr-1" /> Notifications On
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                <BellOff className="h-3 w-3 mr-1" /> Notifications Off
                              </Badge>
                            )}
                            {medication.alarmEnabled && (
                              <Badge variant="secondary" className="text-xs">
                                <Volume2 className="h-3 w-3 mr-1" /> Alarm On
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>Your medication schedule for the week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2 text-left">Time</th>
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day: string) => (
                          <th key={day} className="border p-2 text-center">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {["08:00", "12:00", "16:00", "20:00"].map((time: string) => (
                        <tr key={time}>
                          <td className="border p-2 font-medium">
                            {use12HourFormat ? format(parse(time, "HH:mm", new Date()), "h:mm a") : time}
                          </td>
                          {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day: string) => {
                            const medsForTimeAndDay = filteredMedications.filter((med: MedicationType) =>
                              med.schedule.some((s: { time: string; days: string[] }) => s.time === time && s.days.includes(day)),
                            )

                            return (
                              <td key={day} className="border p-2 text-center">
                                {medsForTimeAndDay.length > 0 ? (
                                  <div className="flex flex-col gap-1">
                                    {medsForTimeAndDay.map((med: MedicationType) => (
                                      <div
                                        key={med.id}
                                        className={`text-xs p-1 rounded-md ${getMedicationColor(med.color)} text-white`}
                                      >
                                        {med.name}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Medication</DialogTitle>
              <DialogDescription>Update your medication details</DialogDescription>
            </DialogHeader>
            {editingMedication && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name" className="flex items-center">
                      Medication Name <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="edit-name"
                      placeholder="Medication name"
                      value={editingMedication.name}
                      onChange={(e) => {
                        setEditingMedication({ ...editingMedication, name: e.target.value })
                        // Remove error styling on input
                        e.target.removeAttribute("data-error")
                        e.target.classList.remove("border-red-500", "focus:ring-red-500")
                      }}
                      className="focus:ring-primary"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-dosage" className="flex items-center">
                      Dosage <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="edit-dosage"
                      placeholder="e.g., 500mg"
                      value={editingMedication.dosage}
                      onChange={(e) => {
                        setEditingMedication({ ...editingMedication, dosage: e.target.value })
                        // Remove error styling on input
                        e.target.removeAttribute("data-error")
                        e.target.classList.remove("border-red-500", "focus:ring-red-500")
                      }}
                      className="focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-instructions">Instructions</Label>
                  <Input
                    id="edit-instructions"
                    placeholder="e.g., Take with food"
                    value={editingMedication.instructions}
                    onChange={(e) => setEditingMedication({ ...editingMedication, instructions: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Schedule</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addEditScheduleTime}>
                      <Plus className="h-4 w-4 mr-1" /> Add Time
                    </Button>
                  </div>

                  {editingMedication.schedule.map((schedule: { time: string; days: string[] }, index: number) => (
                    <div key={index} className="space-y-3 p-3 border rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor={`edit-time-${index}`}>Time</Label>
                        </div>
                        {editingMedication.schedule.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeEditScheduleTime(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <Input
                        id={`edit-time-${index}`}
                        type="time"
                        value={schedule.time}
                        onChange={(e) => updateEditScheduleTime(index, e.target.value)}
                      />

                      <div className="space-y-2">
                        <Label>Days</Label>
                        <div className="flex flex-wrap gap-2">
                          {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day: string) => (
                            <div key={day} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`edit-${day}-${index}`}
                                checked={schedule.days.includes(day)}
                                onChange={(e) => updateEditScheduleDays(index, day, e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <Label htmlFor={`edit-${day}-${index}`} className="text-sm">
                                {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={editingMedication && editingMedication.startDate ? (typeof editingMedication.startDate === 'string' ? editingMedication.startDate : editingMedication.startDate.toISOString().split('T')[0]) : ''}
                    onChange={e => setEditingMedication({ ...editingMedication, startDate: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-endDate">End Date (Optional)</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={editingMedication && editingMedication.endDate ? (typeof editingMedication.endDate === 'string' ? editingMedication.endDate : editingMedication.endDate.toISOString().split('T')[0]) : ''}
                    onChange={e => setEditingMedication({ ...editingMedication, endDate: e.target.value })}
                    placeholder="No end date"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-color">Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {["red", "blue", "green", "yellow", "purple", "pink", "orange"].map((color: string) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditingMedication({ ...editingMedication, color })}
                        className={`w-8 h-8 rounded-full ${getMedicationColor(color)} ${
                          editingMedication.color === color ? "ring-2 ring-offset-2 ring-primary" : ""
                        }`}
                        aria-label={`${color} color`}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="edit-notifications">Notifications</Label>
                      <div className="text-xs text-muted-foreground">
                        Get reminded when it's time to take your medication
                      </div>
                    </div>
                    <Switch
                      id="edit-notifications"
                      checked={editingMedication.notificationsEnabled}
                      onCheckedChange={(checked) =>
                        setEditingMedication({ ...editingMedication, notificationsEnabled: checked })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="edit-alarm">Alarm Sound</Label>
                      <div className="text-xs text-muted-foreground">
                        Play an alarm sound when it's time to take your medication
                      </div>
                    </div>
                    <Switch
                      id="edit-alarm"
                      checked={editingMedication.alarmEnabled}
                      onCheckedChange={(checked) => setEditingMedication({ ...editingMedication, alarmEnabled: checked })}
                    />
                  </div>

                  {editingMedication.alarmEnabled && (
                    <div className="space-y-4 mt-2">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-alarmSound">Sound</Label>
                        <div className="flex gap-2">
                          <Select
                            value={editingMedication.alarmSound}
                            onValueChange={(value) => setEditingMedication({ ...editingMedication, alarmSound: value })}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select sound" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bell">Bell</SelectItem>
                              <SelectItem value="beep">Beep</SelectItem>
                              <SelectItem value="chime">Chime</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => testAlarmSound(editingMedication.alarmSound, editingMedication.alarmVolume)}
                          >
                            <Volume2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <div className="flex justify-between">
                          <Label htmlFor="edit-alarmVolume">Volume</Label>
                          <span className="text-sm text-muted-foreground">{editingMedication.alarmVolume}%</span>
                        </div>
                        <Slider
                          id="edit-alarmVolume"
                          min={0}
                          max={100}
                          step={10}
                          value={[editingMedication.alarmVolume]}
                          onValueChange={(value) => setEditingMedication({ ...editingMedication, alarmVolume: value[0] })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-notes">Notes (Optional)</Label>
                  <Textarea
                    id="edit-notes"
                    placeholder="Additional notes"
                    value={editingMedication.notes}
                    onChange={(e) => setEditingMedication({ ...editingMedication, notes: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateMedication}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
