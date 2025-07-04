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
import { Checkbox } from "@/components/ui/checkbox"
import { MedicationManager } from "@/lib/medication-manager"
import { NotificationService } from "../../../lib/notification-service"
import { MedicationBackgroundService } from "@/components/medication-background-service"

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
  completed?: boolean;
};

// Add a new type for scheduled doses
interface ScheduledDose extends MedicationType {
  dayName: string;
  date: Date;
  scheduleTime: Date;
}

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
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: "",
    notes: "",
  })

  const [editingMedication, setEditingMedication] = useState<MedicationType | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState("default")
  const [todaysMedications, setTodaysMedications] = useState<ScheduledDose[]>([])
  const [upcomingMedications, setUpcomingMedications] = useState<ScheduledDose[]>([])
  const [filter, setFilter] = useState("all")
  const [isMounted, setIsMounted] = useState(false)
  const [medicationsInitialized, setMedicationsInitialized] = useState(false)
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false)
  const [currentAlarm, setCurrentAlarm] = useState<MedicationType | null>(null)
  const [showPermissionAlert, setShowPermissionAlert] = useState(false)
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false)
  const [use12HourFormat, setUse12HourFormat] = useState(true)

  // Audio settings
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [soundVolume, setSoundVolume] = useState(70)
  const [selectedSound, setSelectedSound] = useState("bell")
  const audioContextRef = useRef<AudioContext | null>(null)

  // Interval for periodic notifications
  const notificationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Oscillator reference for alarm sound
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  // Add state for error messages
  const [addError, setAddError] = useState("");
  const [editError, setEditError] = useState("");

  // Track shown notifications to prevent duplicates
  const shownNotificationsRef = useRef<Set<string>>(new Set());
  const lastCheckTimeRef = useRef<Date>(new Date());

  // Load shown notifications from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shown-medication-notifications');
      if (saved) {
        shownNotificationsRef.current = new Set(JSON.parse(saved));
      }
    }
  }, []);

  useEffect(() => {
    setIsMounted(true)
    
    // Initialize medication manager for background scheduling
    if (typeof window !== "undefined") {
      MedicationManager.initialize()
    }
    
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
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Load medications from localStorage
  useEffect(() => {
    if (isMounted) {
      const savedMedications = localStorage.getItem("medications")
      if (savedMedications) {
        const parsed = JSON.parse(savedMedications)
        // Ensure dates are properly parsed and only include future or current medications
        const withDates = parsed.map((med: any) => ({
          ...med,
          scheduleTime: new Date(med.scheduleTime)
        }))
        setMedications(withDates)

        // Set last sync time for this device if not set
        if (!localStorage.getItem('lastDeviceSync')) {
          localStorage.setItem('lastDeviceSync', new Date().toISOString());
        }
      }
    }
  }, [isMounted])

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

  // Refined function to update today's and upcoming medications
  const updateTodaysAndUpcomingMedications = useCallback(() => {
    if (!isMounted) return;

    const now = new Date();
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
        : "saturday";

    const todaysMeds: ScheduledDose[] = [];
    const upcomingMeds: ScheduledDose[] = [];

    medications.forEach((medication) => {
      // Check if medication is active based on start/end dates
      const startDate = medication.startDate ? new Date(medication.startDate) : null;
      const endDate = medication.endDate ? new Date(medication.endDate) : null;

      if (startDate && startDate > now) return;
      if (endDate && endDate < now) return;

      medication.schedule.forEach((schedule) => {
        if (schedule.days.includes(today)) {
          const [hours, minutes] = schedule.time.split(":").map(Number);
          const scheduleTime = new Date(now);
          scheduleTime.setHours(hours, minutes, 0, 0);

          const medicationDue: ScheduledDose = {
            ...medication,
            dueTime: schedule.time,
            formattedTime: formatTime(schedule.time),
            scheduleTime,
            dayName: today,
            date: new Date(now),
          };

          // Filter out taken doses
          if (isDoseTaken(medicationDue)) return;

          if (scheduleTime > now) {
            upcomingMeds.push(medicationDue);
          } else {
            todaysMeds.push(medicationDue);
          }
        }
      });
    });

    // Sort by time (with null checks)
    todaysMeds.sort((a, b) => (a.scheduleTime && b.scheduleTime ? a.scheduleTime.getTime() - b.scheduleTime.getTime() : 0));
    upcomingMeds.sort((a, b) => (a.scheduleTime && b.scheduleTime ? a.scheduleTime.getTime() - b.scheduleTime.getTime() : 0));

    setTodaysMedications(todaysMeds);
    setUpcomingMedications(upcomingMeds);
  }, [isMounted, medications, formatTime]);

  // Call the new update function when medications change or on mount
  useEffect(() => {
    if (isMounted) {
      updateTodaysAndUpcomingMedications();
    }
  }, [medications, isMounted, updateTodaysAndUpcomingMedications]);

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

  // Helper: Generate all scheduled doses for the next N days
  const getAllScheduledDoses = (daysAhead = 7): ScheduledDose[] => {
    const doses: ScheduledDose[] = [];
    const now = new Date();
    for (let offset = 0; offset < daysAhead; offset++) {
      const date = new Date(now);
      date.setDate(now.getDate() + offset);
      const dayName = date.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
      medications.forEach((med: MedicationType) => {
        // Check if medication is active on this date
        const startDate = med.startDate ? new Date(med.startDate) : null;
        const endDate = med.endDate ? new Date(med.endDate) : null;
        if (startDate && startDate > date) return;
        if (endDate && endDate < date) return;
        med.schedule.forEach((sch: { time: string; days: string[] }) => {
          if (sch.days.includes(dayName)) {
            const [hours, minutes] = sch.time.split(":").map(Number);
            const doseDate = new Date(date);
            doseDate.setHours(hours, minutes, 0, 0);
            doses.push({
              ...med,
              dueTime: sch.time,
              formattedTime: formatTime(sch.time),
              scheduleTime: doseDate,
              dayName,
              date: doseDate,
            });
          }
        });
      });
    }
    // Sort by date/time
    doses.sort((a: ScheduledDose, b: ScheduledDose) => a.scheduleTime!.getTime() - b.scheduleTime!.getTime());
    return doses;
  };

  // Helper: Check if a dose is taken (by id and scheduleTime)
  const isDoseTaken = (dose: ScheduledDose) => {
    // You may need to adjust this logic if you track taken doses differently
    // For now, assume a 'takenDoses' array in localStorage with keys like `${dose.id}-${dose.scheduleTime?.toISOString()}`
    if (!dose.scheduleTime) return false;
    const takenDoses = JSON.parse(localStorage.getItem('takenDoses') || '[]');
    return takenDoses.includes(`${dose.id}-${dose.scheduleTime.toISOString()}`);
  };

  const addMedication = useCallback(() => {
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
      startDate: newMedication.startDate ? format(new Date(newMedication.startDate), "yyyy-MM-dd") : "",
      endDate: newMedication.endDate ? format(new Date(newMedication.endDate), "yyyy-MM-dd") : "",
      notes: newMedication.notes,
    }

    // Mark notification as shown only if the scheduled time is now or in the past
    const now = new Date();
    const syncKey = NotificationService.NOTIFICATION_SYNC_KEY;
    const syncState = JSON.parse(localStorage.getItem(syncKey) || '{}');
    medication.schedule.forEach((schedule) => {
      const [hours, minutes] = schedule.time.split(":").map(Number);
      const scheduleTime = new Date(now);
      scheduleTime.setHours(hours, minutes, 0, 0);
      const notificationId = `${medication.id}-${scheduleTime.toISOString().split('T')[0]}-${scheduleTime.getHours()}-${scheduleTime.getMinutes()}`;
      // Only mark as shown if the time is more than 5 minutes in the past
      if (scheduleTime.getTime() < now.getTime() - 5 * 60 * 1000) {
        syncState[notificationId] = {
          timestamp: now.getTime(),
          deviceId: localStorage.getItem('deviceId') || 'unknown',
          title: `🍊 Time to take ${medication.name}`,
          type: 'medication'
        };
        console.log('[Medication] Marked as already shown on add:', notificationId);
      } else if (scheduleTime.getTime() > now.getTime()) {
        // Only schedule for future times
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          console.log('[Medication] Sending SCHEDULE_REMINDER to service worker:', {
            id: notificationId,
            name: medication.name,
            dosage: medication.dosage,
            instructions: medication.instructions,
            scheduledTime: scheduleTime.toISOString(),
            type: 'medication',
            title: `💊 Time to take ${medication.name}`,
          });
          navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_REMINDER',
            reminder: {
              id: notificationId,
              name: medication.name,
              dosage: medication.dosage,
              instructions: medication.instructions,
              scheduledTime: scheduleTime.toISOString(),
              type: 'medication',
              title: `💊 Time to take ${medication.name}`,
            }
          });
        }
      }
    });
    localStorage.setItem(syncKey, JSON.stringify(syncState));

    setMedications((prev) => {
      const updated = [...prev, medication];
      localStorage.setItem("medications", JSON.stringify(updated));
      return updated;
    });
    setNewMedication({
      id: 0,
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
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: "",
      notes: "",
    });
    setIsAddDialogOpen(false);
    toast({
      title: "Medication added",
      description: "Your medication has been added successfully.",
    });
    setTimeout(() => {
      updateTodaysAndUpcomingMedications();
    }, 100);
  }, [newMedication, toast, updateTodaysAndUpcomingMedications]);

  const updateMedication = useCallback(() => {
    if (!editingMedication) return;
    let hasErrors = false
    const errorFields = []

    if (!editingMedication || !editingMedication.name.trim()) {
      hasErrors = true
      errorFields.push("edit-name")
      toast({
        title: "Error",
        description: "Medication name is required",
        variant: "destructive",
      })
    }

    if (!editingMedication || !editingMedication.dosage.trim()) {
      hasErrors = true
      errorFields.push("edit-dosage")
      toast({
        title: "Error",
        description: "Medication dosage is required",
        variant: "destructive",
      })
    }

    if (hasErrors) {
      errorFields.forEach((field) => {
        const element = document.getElementById(field)
        if (element) {
          element.setAttribute("data-error", "true")
          element.classList.add("border-red-500", "focus:ring-red-500")
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

    // Remove old notification IDs from sync state
    const syncKey = NotificationService.NOTIFICATION_SYNC_KEY;
    const syncState = JSON.parse(localStorage.getItem(syncKey) || '{}');
    Object.keys(syncState).forEach((notifId) => {
      if (notifId.startsWith(editingMedication.id + '-')) {
        delete syncState[notifId];
        console.log('[Medication] Removed old notificationId on edit:', notifId);
      }
    });
    localStorage.setItem(syncKey, JSON.stringify(syncState));

    const updatedMedication = {
      ...editingMedication,
      name: editingMedication.name,
      dosage: editingMedication.dosage,
      instructions: editingMedication.instructions,
      schedule: editingMedication.schedule,
      notificationsEnabled: editingMedication.notificationsEnabled,
      alarmEnabled: editingMedication.alarmEnabled,
      alarmSound: editingMedication.alarmSound,
      alarmVolume: editingMedication.alarmVolume,
      color: editingMedication.color,
      startDate: editingMedication.startDate ? format(new Date(editingMedication.startDate), "yyyy-MM-dd") : "",
      endDate: editingMedication.endDate ? format(new Date(editingMedication.endDate), "yyyy-MM-dd") : "",
      notes: editingMedication.notes,
    }

    // Schedule new reminders for future times
    const now = new Date();
    updatedMedication.schedule.forEach((schedule) => {
      const [hours, minutes] = schedule.time.split(":").map(Number);
      const scheduleTime = new Date(now);
      scheduleTime.setHours(hours, minutes, 0, 0);
      const notificationId = `${updatedMedication.id}-${scheduleTime.toISOString().split('T')[0]}-${scheduleTime.getHours()}-${scheduleTime.getMinutes()}`;
      if (scheduleTime.getTime() > now.getTime()) {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_REMINDER',
            reminder: {
              id: notificationId,
              name: updatedMedication.name,
              dosage: updatedMedication.dosage,
              instructions: updatedMedication.instructions,
              scheduledTime: scheduleTime.toISOString(),
              type: 'medication',
              title: `💊 Time to take ${updatedMedication.name}`,
            }
          });
        }
      }
    });

    setMedications((prev) => {
      const updated = prev.map((medication) =>
        medication.id === editingMedication.id
          ? updatedMedication
          : medication,
      );
      localStorage.setItem("medications", JSON.stringify(updated));
      return updated;
    });
    setIsEditDialogOpen(false)
    toast({
      title: "Medication updated",
      description: "Your medication has been updated successfully.",
    })
    setTimeout(() => {
      updateTodaysAndUpcomingMedications();
    }, 100);
  }, [editingMedication, toast, updateTodaysAndUpcomingMedications]);

  const deleteMedication = useCallback(
    (id: number) => {
      // Remove from medication manager (removes from schedules/reminders)
      MedicationManager.deleteMedication(id);

      // Remove from medications array and update localStorage
      setMedications((prev) => {
        const updated = prev.filter((medication: MedicationType) => medication.id !== id);
        localStorage.setItem("medications", JSON.stringify(updated));
        return updated;
      });

      // Remove all related notification IDs from notification sync state
      const syncKey = NotificationService.NOTIFICATION_SYNC_KEY;
      const syncState = JSON.parse(localStorage.getItem(syncKey) || '{}');
      Object.keys(syncState).forEach((notifId) => {
        if (notifId.startsWith(id + '-')) {
          delete syncState[notifId];
        }
      });
      localStorage.setItem(syncKey, JSON.stringify(syncState));

      toast({
        title: "Medication deleted",
        description: "Your medication has been deleted and reminders cancelled.",
      });
    },
    [toast],
  )

  const startEditMedication = useCallback((medication: MedicationType) => {
    setEditingMedication({
      ...medication,
      startDate: medication.startDate ? format(new Date(medication.startDate), "yyyy-MM-dd") : "",
      endDate: medication.endDate ? format(new Date(medication.endDate), "yyyy-MM-dd") : "",
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

  // Stat calculations
  const totalMedications = medications.length;
  const activeToday = medications.filter(med => {
    const today = new Date();
    return med.schedule.some(sch => sch.days.includes(today.toLocaleString('en-US', { weekday: 'long' }).toLowerCase()));
  }).length;
  const withNotifications = medications.filter(med => med.notificationsEnabled).length;
  const withAlarms = medications.filter(med => med.alarmEnabled).length;

  // Filter state
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Filtering logic
  const filteredMedications = medications.filter((med) => {
    // Status filter (all, active, completed)
    if (statusFilter === "active") {
      // Active: has a schedule for today
      const today = new Date();
      if (!med.schedule.some(sch => sch.days.includes(today.toLocaleString('en-US', { weekday: 'long' }).toLowerCase()))) return false;
    } else if (statusFilter === "completed") {
      // Completed: not active today (for demo, you can adjust logic)
      const today = new Date();
      if (med.schedule.some(sch => sch.days.includes(today.toLocaleString('en-US', { weekday: 'long' }).toLowerCase()))) return false;
    }
    // Category filter (by color as a proxy for type)
    if (categoryFilter !== "all" && med.color !== categoryFilter) return false;
    return true;
  });

  // Handle adding new medication
  const handleAddMedication = (newMedication: any) => {
    MedicationManager.addMedication(newMedication);
    setMedications((prev) => [...prev, newMedication]);
  };

  // Medication notification logic
  useEffect(() => {
    if (!isMounted) return;
    
    // Get or set device sync time
    const lastDeviceSync = localStorage.getItem('lastDeviceSync') 
      ? new Date(localStorage.getItem('lastDeviceSync')!)
      : new Date();

    // Debug log current state
    console.log('[Medication] Current medications:', todaysMedications.map(med => ({
      name: med.name,
      scheduleTime: med.scheduleTime,
      notificationsEnabled: med.notificationsEnabled
    })));

    // Clear any previous interval
    if (notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current as NodeJS.Timeout);
    }

    // On first mount, set lastCheckTimeRef to now and skip the first notification check
    let isFirstRun = true;
    lastCheckTimeRef.current = new Date();

    // Set up interval to check for due medications every minute
    notificationIntervalRef.current = setInterval(() => {
      const now = new Date();
      const lastCheck = lastCheckTimeRef.current;
      // Debug log check times
      console.log('[Medication] Checking medications at:', now.toISOString());
      console.log('[Medication] Last check was at:', lastCheck.toISOString());

      // Skip the first run to avoid spamming notifications on load
      if (isFirstRun) {
        isFirstRun = false;
        lastCheckTimeRef.current = now;
        return;
      }

      todaysMedications.forEach((dose) => {
        // Create a unique ID for this dose's notification
        const doseDate = new Date(dose.scheduleTime);
        const notificationId = `${dose.id}-${doseDate.toISOString().split('T')[0]}-${doseDate.getHours()}-${doseDate.getMinutes()}`;

        // Check if this dose is in the past (more than 5 minutes ago)
        const isTooOld = doseDate.getTime() < now.getTime() - 5 * 60 * 1000;

        // Check if this dose was scheduled before this device was synced
        const isBeforeDeviceSync = doseDate.getTime() < lastDeviceSync.getTime();

        // Get notification sync state
        const syncState = JSON.parse(localStorage.getItem(NotificationService.NOTIFICATION_SYNC_KEY) || '{}');
        const isAlreadyShown = syncState[notificationId] && 
          (Date.now() - syncState[notificationId].timestamp < 5 * 60 * 1000);

        // If medication is overdue by more than 5 minutes, mark as shown and complete it for that occurrence
        if (isTooOld && !dose.completed) {
          syncState[notificationId] = {
            timestamp: now.getTime(),
            deviceId: localStorage.getItem('deviceId') || 'unknown',
            title: `💊 Time to take ${dose.name}`,
            type: 'medication'
          };
          localStorage.setItem(NotificationService.NOTIFICATION_SYNC_KEY, JSON.stringify(syncState));
          MedicationManager.completeReminder(String(dose.id));
          return;
        }

        // Calculate if this dose became due since our last check
        const becameDueSinceLastCheck = 
          // Check if it's within 1 minute of scheduled time
          Math.abs(dose.scheduleTime.getTime() - now.getTime()) <= 60000 && // is due now (within 1 minute)
          dose.scheduleTime.getTime() > lastCheck.getTime(); // became due after our last check

        // Check if this is today's dose
        const isToday = doseDate.toISOString().split('T')[0] === now.toISOString().split('T')[0];

        // Debug log notification check
        if (becameDueSinceLastCheck && isToday) {
          console.log('[Medication] Potential notification for:', {
            name: dose.name,
            scheduleTime: dose.scheduleTime,
            notificationId,
            alreadyShown: isAlreadyShown,
            isTooOld,
            isBeforeDeviceSync
          });
        }

        if (
          dose.notificationsEnabled &&
          becameDueSinceLastCheck &&
          isToday &&
          !isAlreadyShown &&
          !isTooOld &&
          !isBeforeDeviceSync &&
          NotificationService.isSupported() &&
          Notification.permission === "granted"
        ) {
          // Debug log actual notification
          console.log('[Medication] Showing notification for:', {
            name: dose.name,
            scheduleTime: dose.scheduleTime,
            notificationId
          });

          // Play notification sound if enabled (for both browser and in-app)
          if (soundEnabled) {
            playAlarm(dose);
          }

          NotificationService.showNotification(
            `💊 Time to take ${dose.name}`,
            {
              body: `Dosage: ${dose.dosage}${dose.instructions ? "\n" + dose.instructions : ""}`,
              icon: '/android-chrome-192x192.png',
              requireInteraction: true,
              vibrate: [200, 100, 200],
              tag: notificationId,
              data: {
                type: 'medication',
                id: dose.id,
                scheduleTime: dose.scheduleTime.toISOString()
              }
            } as NotificationOptions & { vibrate?: number[] },
            selectedSound,
            soundVolume
          );

          // In-app notification
          window.dispatchEvent(
            new CustomEvent('inAppNotification', {
              detail: {
                title: `💊 Time to take ${dose.name}`,
                options: {
                  body: `Dosage: ${dose.dosage}${dose.instructions ? "\n" + dose.instructions : ""}`,
                },
              },
            })
          );

          // --- NEW: show-popup event for SmartPopupSystem ---
          const popupDedupeKey = `medication-popup-shown-${notificationId}`;
          if (!localStorage.getItem(popupDedupeKey)) {
            localStorage.setItem(popupDedupeKey, "1");
            window.dispatchEvent(
              new CustomEvent("show-popup", {
                detail: {
                  type: "medication-due",
                  title: `💊 Time to take ${dose.name}`,
                  message: `Dosage: ${dose.dosage}${dose.instructions ? "\n" + dose.instructions : ""}`,
                  duration: 10000,
                  priority: "high",
                  actions: [
                    {
                      label: "Mark as Taken",
                      action: () => {
                        MedicationManager.completeReminder(String(dose.id));
                        toast({
                          title: "Medication Taken",
                          description: `${dose.name} marked as taken`,
                        });
                      },
                    },
                    {
                      label: "Snooze 5 min",
                      action: () => {
                        toast({
                          title: "Medication Snoozed",
                          description: "Reminder will show again in 5 minutes",
                        });
                      },
                      variant: "outline"
                    }
                  ],
                },
              })
            );
          }
          // Mark as completed for this occurrence
          MedicationManager.completeReminder(String(dose.id));
        }
      });
    }, 60000); // check every minute

    return () => {
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current as NodeJS.Timeout);
      }
      // Reset last check time on unmount
      lastCheckTimeRef.current = new Date();
    };
  }, [isMounted, todaysMedications, soundEnabled, selectedSound, soundVolume]);

  // Generate unique device ID on component mount if not exists
  useEffect(() => {
    if (!localStorage.getItem('deviceId')) {
      const deviceId = `device_${Math.random().toString(36).substring(2)}${Date.now()}`;
      localStorage.setItem('deviceId', deviceId);
    }
  }, []);

  const playNotificationSound = () => {
    try {
      if (!audioContextRef.current) return

      const audioContext = audioContextRef.current
      if (audioContext.state === "suspended") {
        audioContext.resume()
      }

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      // Sound presets with different characteristics
      const soundPresets: Record<string, { frequency: number; duration: number; type: OscillatorType }> = {
        bell: { frequency: 830, duration: 1.5, type: "sine" },
        chime: { frequency: 1000, duration: 1.0, type: "sine" },
        beep: { frequency: 800, duration: 0.3, type: "square" },
        ding: { frequency: 1200, duration: 0.8, type: "triangle" },
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
    } catch (error) {
      console.error("Error playing notification sound:", error)
      // Fallback: try to play a simple beep
      try {
        const normalizedVolume = Math.max(0, Math.min(1, soundVolume / 100))
        const audio = new Audio(
          "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT",
        )
        audio.volume = normalizedVolume
        audio.play().catch(() => {
          // Silent fallback if even this fails
        })
      } catch (fallbackError) {
        console.warn("All audio playback methods failed")
      }
    }
  }

  if (!isMounted) {
    return null
  }

  return (
    <>
      <MedicationBackgroundService />
      <div className="space-y-6 px-2 sm:px-4 md:px-6 lg:px-8">
        {showPermissionAlert && (
          <Alert variant="destructive" className="mb-4">
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
              <DialogTitle>Permission Required</DialogTitle>
              <DialogDescription>
                Enable notifications to receive medication reminders.
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
                <DialogTitle>Medication Alarm</DialogTitle>
                <DialogDescription>It's time to take your medication.</DialogDescription>
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

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Medications</h2>
            <p className="text-muted-foreground">Track your medications and get reminders</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="time-format" className="text-sm">Use 12-hour format (AM/PM)</Label>
              <Switch id="time-format" checked={use12HourFormat} onCheckedChange={setUse12HourFormat} />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      if (!audioContextRef.current && typeof window !== "undefined") {
                        try {
                          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
                          if (AudioContextClass) {
                            audioContextRef.current = new AudioContextClass()
                          }
                        } catch (e) {
                          console.error("Failed to initialize audio context:", e)
                        }
                      }
                    }}
                  >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Medication
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Medication</DialogTitle>
                  <DialogDescription>Add a new medication to your list.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Medication Name & Dosage */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Medication Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="name"
                        placeholder="Medication name"
                        value={newMedication.name}
                        onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dosage">Dosage <span className="text-red-500">*</span></Label>
                      <Input
                        id="dosage"
                        placeholder="e.g., 500mg"
                        value={newMedication.dosage}
                        onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                      />
                    </div>
                  </div>
                  {addError && <div className="text-red-500 text-sm">{addError}</div>}

                  {/* Instructions */}
                  <div className="grid gap-2">
                    <Label htmlFor="instructions">Instructions</Label>
                    <Textarea
                      id="instructions"
                      placeholder="e.g., Take with food"
                      value={newMedication.instructions}
                      onChange={(e) => setNewMedication({ ...newMedication, instructions: e.target.value })}
                    />
                  </div>

                  {/* SCHEDULE SECTION */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Schedule</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addScheduleTime}>
                        <Plus className="mr-1 h-3 w-3" />
                        Add Time
                      </Button>
                    </div>
                    {newMedication.schedule.map((schedule, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <Label>Time</Label>
                            </div>
                            {newMedication.schedule.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeScheduleTime(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <Input
                            type="time"
                            value={schedule.time}
                            onChange={(e) => updateScheduleTime(index, e.target.value)}
                          />
                          <div className="space-y-2">
                            <Label>Days</Label>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { id: "monday", label: "Mon" },
                                { id: "tuesday", label: "Tue" },
                                { id: "wednesday", label: "Wed" },
                                { id: "thursday", label: "Thu" },
                                { id: "friday", label: "Fri" },
                                { id: "saturday", label: "Sat" },
                                { id: "sunday", label: "Sun" },
                              ].map((day) => (
                                <div key={day.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`new-${index}-${day.id}`}
                                    checked={schedule.days.includes(day.id)}
                                    onCheckedChange={(checked: boolean) => updateScheduleDays(index, day.id, checked)}
                                  />
                                  <Label
                                    htmlFor={`new-${index}-${day.id}`}
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    {day.label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* DATES */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={newMedication.startDate}
                        onChange={(e) => setNewMedication({ ...newMedication, startDate: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endDate">End Date (Optional)</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={newMedication.endDate || ""}
                        onChange={(e) => setNewMedication({ ...newMedication, endDate: e.target.value || null })}
                      />
                    </div>
                  </div>

                  {/* COLOR PICKER */}
                  <div className="grid gap-2">
                    <Label>Color</Label>
                    <div className="flex gap-3">
                      {[
                        { value: "red", color: "bg-red-500 border-red-600" },
                        { value: "blue", color: "bg-blue-500 border-blue-600" },
                        { value: "green", color: "bg-green-500 border-green-600" },
                        { value: "yellow", color: "bg-yellow-400 border-yellow-500" },
                        { value: "purple", color: "bg-purple-500 border-purple-600" },
                        { value: "pink", color: "bg-pink-400 border-pink-500" },
                        { value: "orange", color: "bg-orange-400 border-orange-500" },
                      ].map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center focus:outline-none transition-all ${c.color} ${newMedication.color === c.value ? "ring-2 ring-offset-2 ring-blue-500 border-4" : "border-transparent"}`}
                          onClick={() => setNewMedication({ ...newMedication, color: c.value })}
                          aria-label={c.value}
                        >
                          {newMedication.color === c.value && <span className="w-3 h-3 rounded-full bg-white block" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* NOTIFICATIONS SWITCH */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifications">Notifications</Label>
                      <div className="text-xs text-muted-foreground">Get reminded when it's time to take your medication</div>
                    </div>
                    <Switch
                      id="notifications"
                      checked={newMedication.notificationsEnabled}
                      onCheckedChange={(checked) => setNewMedication({ ...newMedication, notificationsEnabled: checked })}
                    />
                  </div>

                  {/* ALARM SOUND SWITCH */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="alarm">Alarm Sound</Label>
                      <div className="text-xs text-muted-foreground">Play an alarm sound when it's time to take your medication</div>
                    </div>
                    <Switch
                      id="alarm"
                      checked={newMedication.alarmEnabled}
                      onCheckedChange={(checked) => setNewMedication({ ...newMedication, alarmEnabled: checked })}
                    />
                  </div>

                  {/* SOUND DROPDOWN & TEST BUTTON */}
                  <div className="grid gap-2">
                    <Label htmlFor="alarmSound">Sound</Label>
                    <div className="flex gap-2 items-center">
                      <Select
                        value={newMedication.alarmSound}
                        onValueChange={(value) => setNewMedication({ ...newMedication, alarmSound: value })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bell">Bell</SelectItem>
                          <SelectItem value="beep">Beep</SelectItem>
                          <SelectItem value="chime">Chime</SelectItem>
                          <SelectItem value="alert">Alert</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="icon" aria-label="Test sound">
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* VOLUME SLIDER */}
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="alarmVolume">Volume</Label>
                      <span className="text-sm text-muted-foreground">{newMedication.alarmVolume}%</span>
                    </div>
                    <input
                      id="alarmVolume"
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={newMedication.alarmVolume}
                      onChange={(e) => setNewMedication({ ...newMedication, alarmVolume: Number(e.target.value) })}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  {/* NOTES */}
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
                <DialogFooter className="flex flex-col gap-2 pt-2">
                  <Button className="w-full" onClick={() => {
                    if (!newMedication.name.trim() || !newMedication.dosage.trim()) {
                      setAddError("Medication Name and Dosage are required.");
                      return;
                    }
                    setAddError("");
                    addMedication();
                  }}>Add Medication</Button>
                  <Button className="w-full" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Today's Medications</CardTitle>
              <CardDescription>Medications you need to take today (already due)</CardDescription>
            </CardHeader>
            <CardContent>
              {todaysMedications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <Check className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">All caught up!</h3>
                  <p className="text-sm text-muted-foreground">No more medications to take right now</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todaysMedications.map((medication, index) => (
                    <div key={`${medication.id}-${index}`} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div
                        className={`w-2 h-full min-h-[40px] rounded-full ${getMedicationColor(medication.color)}`}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium truncate">{medication.name}</h4>
                          <Badge variant="outline" className="shrink-0 ml-2">{medication.formattedTime || medication.dueTime}</Badge>
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
                  {upcomingMedications.map((medication, index) => (
                    <div key={`${medication.id}-${index}`} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div
                        className={`w-2 h-full min-h-[40px] rounded-full ${getMedicationColor(medication.color)}`}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium truncate">{medication.name}</h4>
                          <Badge className="shrink-0 ml-2">{medication.formattedTime || medication.dueTime}</Badge>
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
          <TabsList className="grid w-full grid-cols-2">
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
                    {filteredMedications.map((medication) => (
                      <div key={medication.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div
                          className={`w-2 h-full min-h-[40px] rounded-full ${getMedicationColor(medication.color)}`}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">{medication.name}</h4>
                            <div className="flex gap-1 shrink-0 ml-2">
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
                            {medication.schedule.map((schedule, index) => (
                              <div key={index} className="flex items-center text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1 shrink-0" />
                                <span className="truncate">
                                  {use12HourFormat
                                    ? format(parse(schedule.time, "HH:mm", new Date()), "h:mm a")
                                    : schedule.time}{" "}
                                  - {formatDaysList(schedule.days)}
                                </span>
                              </div>
                            ))}
                          </div>
                          {medication.instructions && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{medication.instructions}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
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
                {(() => {
                  // Dynamically collect all unique times from all medication schedules
                  const allTimesSet = new Set<string>();
                  medications.forEach((med) => {
                    med.schedule.forEach((sch) => {
                      allTimesSet.add(sch.time);
                    });
                  });
                  const allTimes = Array.from(allTimesSet).sort();
                  const daysOfWeek = [
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                    "sunday",
                  ];
                  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                  if (allTimes.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center p-6 text-center">
                        <Pill className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No scheduled doses found</h3>
                        <p className="text-sm text-muted-foreground">Add medications and schedules to see them here</p>
                      </div>
                    );
                  }
                  return (
                    <div className="w-full overflow-x-auto">
                      <table className="w-full border-collapse text-xs md:text-sm min-w-[600px]">
                        <thead>
                          <tr>
                            <th className="border p-1 md:p-2 text-left whitespace-nowrap">Time</th>
                            {dayLabels.map((day) => (
                              <th key={day} className="border p-1 md:p-2 text-center whitespace-nowrap">{day}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {allTimes.map((time) => (
                            <tr key={time}>
                              <td className="border p-1 md:p-2 font-medium whitespace-nowrap">
                                {use12HourFormat ? format(parse(time, "HH:mm", new Date()), "h:mm a") : time}
                              </td>
                              {daysOfWeek.map((day) => {
                                const medsForTimeAndDay = medications.filter((med) =>
                                  med.schedule.some((s) => s.time === time && s.days.includes(day)),
                                );
                                return (
                                  <td key={day} className="border p-1 md:p-2 text-center align-top">
                                    {medsForTimeAndDay.length > 0 ? (
                                      <div className="flex flex-col gap-1">
                                        {medsForTimeAndDay.map((med) => (
                                          <div
                                            key={med.id}
                                            className={`text-xs p-1 rounded-md ${getMedicationColor(med.color)} text-white break-words`}
                                          >
                                            {med.name}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Medication</DialogTitle>
              <DialogDescription>Edit the details of the medication</DialogDescription>
            </DialogHeader>
            {editingMedication && (
              <div className="grid gap-4 py-4">
                {/* Medication Name & Dosage */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Medication Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="edit-name"
                      placeholder="Medication name"
                      value={editingMedication.name || ""}
                      onChange={(e) => setEditingMedication({ ...editingMedication, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-dosage">Dosage <span className="text-red-500">*</span></Label>
                    <Input
                      id="edit-dosage"
                      placeholder="e.g., 500mg"
                      value={editingMedication.dosage || ""}
                      onChange={(e) => setEditingMedication({ ...editingMedication, dosage: e.target.value })}
                    />
                  </div>
                </div>
                {editError && <div className="text-red-500 text-sm">{editError}</div>}

                {/* Instructions */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-instructions">Instructions</Label>
                  <Textarea
                    id="edit-instructions"
                    placeholder="e.g., Take with food"
                    value={editingMedication.instructions || ""}
                    onChange={(e) => setEditingMedication({ ...editingMedication, instructions: e.target.value })}
                  />
                </div>

                {/* SCHEDULE SECTION */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Schedule</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addEditScheduleTime}>
                      <Plus className="mr-1 h-3 w-3" />
                      Add Time
                    </Button>
                  </div>
                  {editingMedication.schedule.map((schedule, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <Label>Time</Label>
                          </div>
                          {editingMedication.schedule.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEditScheduleTime(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Input
                          type="time"
                          value={schedule.time}
                          onChange={(e) => updateEditScheduleTime(index, e.target.value)}
                        />
                        <div className="space-y-2">
                          <Label>Days</Label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { id: "monday", label: "Mon" },
                              { id: "tuesday", label: "Tue" },
                              { id: "wednesday", label: "Wed" },
                              { id: "thursday", label: "Thu" },
                              { id: "friday", label: "Fri" },
                              { id: "saturday", label: "Sat" },
                              { id: "sunday", label: "Sun" },
                            ].map((day) => (
                              <div key={day.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`edit-${index}-${day.id}`}
                                  checked={schedule.days.includes(day.id)}
                                  onCheckedChange={(checked: boolean) => updateEditScheduleDays(index, day.id, checked)}
                                />
                                <Label
                                  htmlFor={`edit-${index}-${day.id}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {day.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* DATES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-startDate">Start Date</Label>
                    <Input
                      id="edit-startDate"
                      type="date"
                      value={editingMedication.startDate || ""}
                      onChange={(e) => setEditingMedication({ ...editingMedication, startDate: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-endDate">End Date (Optional)</Label>
                    <Input
                      id="edit-endDate"
                      type="date"
                      value={editingMedication.endDate || ""}
                      onChange={(e) => setEditingMedication({ ...editingMedication, endDate: e.target.value || null })}
                    />
                  </div>
                </div>

                {/* COLOR PICKER */}
                <div className="grid gap-2">
                  <Label>Color</Label>
                  <div className="flex gap-3">
                    {[
                      { value: "red", color: "bg-red-500 border-red-600" },
                      { value: "blue", color: "bg-blue-500 border-blue-600" },
                      { value: "green", color: "bg-green-500 border-green-600" },
                      { value: "yellow", color: "bg-yellow-400 border-yellow-500" },
                      { value: "purple", color: "bg-purple-500 border-purple-600" },
                      { value: "pink", color: "bg-pink-400 border-pink-500" },
                      { value: "orange", color: "bg-orange-400 border-orange-500" },
                    ].map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center focus:outline-none transition-all ${c.color} ${editingMedication.color === c.value ? "ring-2 ring-offset-2 ring-blue-500 border-4" : "border-transparent"}`}
                        onClick={() => setEditingMedication({ ...editingMedication, color: c.value })}
                        aria-label={c.value}
                      >
                        {editingMedication.color === c.value && <span className="w-3 h-3 rounded-full bg-white block" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* NOTIFICATIONS SWITCH */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="edit-notifications">Notifications</Label>
                    <div className="text-xs text-muted-foreground">Get reminded when it's time to take your medication</div>
                  </div>
                  <Switch
                    id="edit-notifications"
                    checked={editingMedication.notificationsEnabled || false}
                    onCheckedChange={(checked) => setEditingMedication({ ...editingMedication, notificationsEnabled: checked })}
                  />
                </div>

                {/* ALARM SOUND SWITCH */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="edit-alarm">Alarm Sound</Label>
                    <div className="text-xs text-muted-foreground">Play an alarm sound when it's time to take your medication</div>
                  </div>
                  <Switch
                    id="edit-alarm"
                    checked={editingMedication.alarmEnabled || false}
                    onCheckedChange={(checked) => setEditingMedication({ ...editingMedication, alarmEnabled: checked })}
                  />
                </div>

                {/* SOUND DROPDOWN & TEST BUTTON */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-alarmSound">Sound</Label>
                  <div className="flex gap-2 items-center">
                    <Select
                      value={editingMedication.alarmSound}
                      onValueChange={(value) => setEditingMedication({ ...editingMedication, alarmSound: value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bell">Bell</SelectItem>
                        <SelectItem value="beep">Beep</SelectItem>
                        <SelectItem value="chime">Chime</SelectItem>
                        <SelectItem value="alert">Alert</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="icon" aria-label="Test sound">
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* VOLUME SLIDER */}
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-alarmVolume">Volume</Label>
                    <span className="text-sm text-muted-foreground">{editingMedication.alarmVolume}%</span>
                  </div>
                  <input
                    id="edit-alarmVolume"
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={editingMedication.alarmVolume}
                    onChange={(e) => setEditingMedication({ ...editingMedication, alarmVolume: Number(e.target.value) })}
                    className="w-full accent-blue-500"
                  />
                </div>

                {/* NOTES */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-notes">Notes (Optional)</Label>
                  <Textarea
                    id="edit-notes"
                    placeholder="Additional notes"
                    value={editingMedication.notes || ""}
                    onChange={(e) => setEditingMedication({ ...editingMedication, notes: e.target.value })}
                  />
                </div>
              </div>
            )}
            <DialogFooter className="flex flex-col gap-2 pt-2">
              <Button className="w-full" onClick={() => {
                if (!editingMedication?.name?.trim() || !editingMedication?.dosage?.trim()) {
                  setEditError("Medication Name and Dosage are required.");
                  return;
                }
                setEditError("");
                updateMedication();
              }}>Update Medication</Button>
              <Button className="w-full" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
