"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useToast } from "@/components/ui/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns"
import { CalendarIcon, Plus, ChevronLeft, ChevronRight, Upload, ImageIcon, Check, X, Mic, MicOff } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"

export default function TimetablePage() {
  const { toast } = useToast()
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "Math Lecture",
      date: "2025-03-23",
      startTime: "10:00",
      endTime: "11:30",
      location: "Room 101",
      type: "class",
    },
    {
      id: 2,
      title: "Group Study Session",
      date: "2025-03-24",
      startTime: "14:00",
      endTime: "16:00",
      location: "Library",
      type: "study",
    },
    {
      id: 3,
      title: "Physics Lab",
      date: "2025-03-26",
      startTime: "13:00",
      endTime: "15:00",
      location: "Science Building",
      type: "class",
    },
    {
      id: 4,
      title: "Meeting with Advisor",
      date: "2025-03-25",
      startTime: "09:00",
      endTime: "09:30",
      location: "Office 305",
      type: "meeting",
    },
    {
      id: 5,
      title: "English Seminar",
      date: "2025-03-27",
      startTime: "11:00",
      endTime: "12:30",
      location: "Humanities Building",
      type: "class",
    },
  ])

  const [newEvent, setNewEvent] = useState({
    title: "",
    date: new Date(),
    startTime: "09:00",
    endTime: "10:00",
    location: "",
    type: "class",
  })

  const [editingEvent, setEditingEvent] = useState(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [view, setView] = useState("week") // week or month

  // Image upload states
  const [isImageUploadDialogOpen, setIsImageUploadDialogOpen] = useState(false)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedEvents, setExtractedEvents] = useState([])
  const fileInputRef = useRef(null)

  // Voice input states
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false)
  const [voiceInputField, setVoiceInputField] = useState(null)
  const [voiceInputText, setVoiceInputText] = useState("")
  const [voiceRecognitionSupported, setVoiceRecognitionSupported] = useState(false)

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // Load events from localStorage
    const savedEvents = localStorage.getItem("events")
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents))
    }

    // Check if voice recognition is supported
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      setVoiceRecognitionSupported(true)
    }
  }, [])

  // Save events to localStorage when they change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("events", JSON.stringify(events))
    }
  }, [events, isMounted])

  const addEvent = () => {
    if (!newEvent.title.trim()) {
      toast({
        title: "Error",
        description: "Event title is required",
        variant: "destructive",
      })
      return
    }

    const event = {
      id: Date.now(),
      title: newEvent.title,
      date: format(newEvent.date, "yyyy-MM-dd"),
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      location: newEvent.location,
      type: newEvent.type,
    }

    setEvents([...events, event])
    setNewEvent({
      title: "",
      date: new Date(),
      startTime: "09:00",
      endTime: "10:00",
      location: "",
      type: "class",
    })
    setIsAddDialogOpen(false)

    toast({
      title: "Event added",
      description: "Your new event has been added to your schedule.",
    })
  }

  const updateEvent = () => {
    if (!editingEvent.title.trim()) {
      toast({
        title: "Error",
        description: "Event title is required",
        variant: "destructive",
      })
      return
    }

    setEvents(
      events.map((event) =>
        event.id === editingEvent.id
          ? {
              ...event,
              title: editingEvent.title,
              date: typeof editingEvent.date === "object" ? format(editingEvent.date, "yyyy-MM-dd") : editingEvent.date,
              startTime: editingEvent.startTime,
              endTime: editingEvent.endTime,
              location: editingEvent.location,
              type: editingEvent.type,
            }
          : event,
      ),
    )

    setIsEditDialogOpen(false)

    toast({
      title: "Event updated",
      description: "Your event has been updated successfully.",
    })
  }

  const deleteEvent = (id) => {
    setEvents(events.filter((event) => event.id !== id))

    toast({
      title: "Event deleted",
      description: "Your event has been removed from your schedule.",
    })
  }

  const startEditEvent = (event) => {
    setEditingEvent({
      ...event,
      date: new Date(event.date),
    })
    setIsEditDialogOpen(true)
  }

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 })
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const previousWeek = () => {
    setCurrentWeek((prevWeek) => addDays(prevWeek, -7))
  }

  const nextWeek = () => {
    setCurrentWeek((prevWeek) => addDays(prevWeek, 7))
  }

  const goToToday = () => {
    setCurrentWeek(new Date())
  }

  const getEventsForDay = (day) => {
    const formattedDay = format(day, "yyyy-MM-dd")
    return events.filter((event) => event.date === formattedDay)
  }

  const timeSlots = Array.from({ length: 14 }, (_, i) => i + 8) // 8 AM to 9 PM

  const getEventTypeColor = (type) => {
    switch (type) {
      case "class":
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800"
      case "study":
        return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-800"
      case "meeting":
        return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800"
      case "personal":
        return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
    }
  }

  // Enhanced image processing with better OCR simulation
  const processImage = () => {
    setIsProcessing(true)

    // Simulate more sophisticated image processing
    setTimeout(() => {
      // Enhanced mock extraction based on common timetable patterns
      const mockExtractedEvents = [
        {
          id: Date.now(),
          title: "Mathematics 101",
          date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
          startTime: "09:00",
          endTime: "10:30",
          location: "Room A-101",
          type: "class",
        },
        {
          id: Date.now() + 1,
          title: "Physics Laboratory",
          date: format(addDays(new Date(), 2), "yyyy-MM-dd"),
          startTime: "14:00",
          endTime: "16:00",
          location: "Physics Lab 1",
          type: "class",
        },
        {
          id: Date.now() + 2,
          title: "Computer Science Lecture",
          date: format(addDays(new Date(), 3), "yyyy-MM-dd"),
          startTime: "11:00",
          endTime: "12:30",
          location: "Computer Lab",
          type: "class",
        },
        {
          id: Date.now() + 3,
          title: "Chemistry Tutorial",
          date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
          startTime: "15:30",
          endTime: "16:30",
          location: "Chemistry Building",
          type: "class",
        },
        {
          id: Date.now() + 4,
          title: "Study Group Meeting",
          date: format(addDays(new Date(), 4), "yyyy-MM-dd"),
          startTime: "13:00",
          endTime: "15:00",
          location: "Library Room 205",
          type: "study",
        },
        {
          id: Date.now() + 5,
          title: "Office Hours - Prof. Smith",
          date: format(addDays(new Date(), 5), "yyyy-MM-dd"),
          startTime: "10:00",
          endTime: "11:00",
          location: "Faculty Office 312",
          type: "meeting",
        },
      ]

      setExtractedEvents(mockExtractedEvents)
      setIsProcessing(false)

      toast({
        title: "Image processed successfully",
        description: `We've extracted ${mockExtractedEvents.length} events from your timetable image.`,
      })
    }, 3000) // Longer processing time to simulate real OCR
  }

  const confirmExtractedEvents = () => {
    setEvents([...events, ...extractedEvents])
    setUploadedImage(null)
    setExtractedEvents([])
    setIsImageUploadDialogOpen(false)

    toast({
      title: "Events added",
      description: `${extractedEvents.length} events have been added to your schedule.`,
    })
  }

  const cancelImageUpload = () => {
    setUploadedImage(null)
    setExtractedEvents([])
    setIsImageUploadDialogOpen(false)
  }

  // Enhanced file handling
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB.",
          variant: "destructive",
        })
        return
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (PNG, JPG, JPEG).",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Voice input handlers
  const startVoiceInput = (field) => {
    if (!voiceRecognitionSupported) {
      toast({
        title: "Voice input not supported",
        description: "Your browser does not support voice recognition.",
        variant: "destructive",
      })
      return
    }

    setVoiceInputField(field)
    setIsVoiceInputActive(true)
    setVoiceInputText("")

    toast({
      title: "Voice input activated",
      description: `Speak now to enter ${field}...`,
    })

    // Enhanced voice recognition simulation
    setTimeout(() => {
      let recognizedText = ""

      switch (field) {
        case "title":
          recognizedText = "Advanced Programming Workshop"
          setNewEvent((prev) => ({ ...prev, title: recognizedText }))
          break
        case "location":
          recognizedText = "Computer Science Building Room 204"
          setNewEvent((prev) => ({ ...prev, location: recognizedText }))
          break
        case "edit-title":
          recognizedText = "Data Structures and Algorithms"
          setEditingEvent((prev) => ({ ...prev, title: recognizedText }))
          break
        case "edit-location":
          recognizedText = "Engineering Building Lab 101"
          setEditingEvent((prev) => ({ ...prev, location: recognizedText }))
          break
        default:
          break
      }

      setVoiceInputText(recognizedText)
      setIsVoiceInputActive(false)

      toast({
        title: "Voice input completed",
        description: `Recognized: "${recognizedText}"`,
      })
    }, 4000) // Longer recognition time for better simulation
  }

  const stopVoiceInput = () => {
    setIsVoiceInputActive(false)

    toast({
      title: "Voice input stopped",
      description: "Voice recognition has been stopped.",
    })
  }

  if (!isMounted) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Timetable</h2>
          <p className="text-muted-foreground">Manage your schedule and events</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Event</DialogTitle>
                <DialogDescription>Add a new event to your timetable.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="title">Title</Label>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => startVoiceInput("title")}
                      className={isVoiceInputActive && voiceInputField === "title" ? "bg-red-100 dark:bg-red-900" : ""}
                    >
                      {isVoiceInputActive && voiceInputField === "title" ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Input
                    id="title"
                    placeholder="Event title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newEvent.date ? format(newEvent.date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newEvent.date}
                        onSelect={(date) => setNewEvent({ ...newEvent, date: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="location">Location</Label>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => startVoiceInput("location")}
                      className={
                        isVoiceInputActive && voiceInputField === "location" ? "bg-red-100 dark:bg-red-900" : ""
                      }
                    >
                      {isVoiceInputActive && voiceInputField === "location" ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Input
                    id="location"
                    placeholder="Event location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Event Type</Label>
                  <Select value={newEvent.type} onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="class">Class</SelectItem>
                      <SelectItem value="study">Study</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addEvent}>Add Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isImageUploadDialogOpen} onOpenChange={setIsImageUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ImageIcon className="mr-2 h-4 w-4" />
                Import from Image
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Import Timetable from Image</DialogTitle>
                <DialogDescription>Upload an image of your timetable to automatically extract events</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                  <TabsTrigger value="review" disabled={!uploadedImage}>
                    Review
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="py-4">
                  {!uploadedImage ? (
                    <div className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-lg">
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Drag and drop your timetable image, or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Supports PNG, JPG, or JPEG up to 10MB</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                          Choose File
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => startVoiceInput("timetable")}
                          className={
                            isVoiceInputActive && voiceInputField === "timetable" ? "bg-red-100 dark:bg-red-900" : ""
                          }
                        >
                          {isVoiceInputActive && voiceInputField === "timetable" ? (
                            <MicOff className="h-4 w-4 mr-2" />
                          ) : (
                            <Mic className="h-4 w-4 mr-2" />
                          )}
                          Voice Input
                        </Button>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleFileChange}
                      />

                      {isVoiceInputActive && voiceInputField === "timetable" && (
                        <div className="mt-4 p-4 border rounded-lg w-full">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">Voice Input</h4>
                            <Button variant="ghost" size="sm" onClick={stopVoiceInput}>
                              <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                          </div>
                          <Textarea
                            placeholder="Speak your timetable details..."
                            value={voiceInputText}
                            className="min-h-[100px]"
                            readOnly
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Example: "I have Math class on Monday at 9 AM in Room 101, and Physics lab on Wednesday from
                            2 PM to 4 PM"
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative aspect-video rounded-lg overflow-hidden border">
                        <Image
                          src={uploadedImage || "/placeholder.svg"}
                          alt="Uploaded timetable"
                          width={640}
                          height={360}
                          className="object-contain w-full h-full"
                        />
                      </div>
                      <div className="flex justify-between">
                        <Button variant="outline" onClick={() => setUploadedImage(null)}>
                          Choose Different Image
                        </Button>
                        <Button onClick={processImage} disabled={isProcessing}>
                          {isProcessing ? "Processing..." : "Extract Events"}
                        </Button>
                      </div>
                      {isProcessing && (
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">
                            Analyzing image and extracting schedule information...
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="review" className="py-4">
                  {extractedEvents.length > 0 ? (
                    <div className="space-y-4">
                      <Alert>
                        <Check className="h-4 w-4" />
                        <AlertTitle>Events extracted successfully</AlertTitle>
                        <AlertDescription>
                          We found {extractedEvents.length} events in your timetable image. Review them below before
                          adding to your schedule.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {extractedEvents.map((event, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{event.title}</h4>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(event.date), "PPP")} • {event.startTime} - {event.endTime}
                                </div>
                                <div className="text-sm text-muted-foreground">{event.location}</div>
                              </div>
                              <div className={`px-2 py-1 text-xs rounded-full ${getEventTypeColor(event.type)}`}>
                                {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between">
                        <Button variant="outline" onClick={cancelImageUpload}>
                          Cancel
                        </Button>
                        <Button onClick={confirmExtractedEvents}>Add All Events</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 p-8">
                      <X className="h-10 w-10 text-muted-foreground" />
                      <p className="text-center text-muted-foreground">
                        No events were extracted. Try uploading a clearer image with better contrast.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={previousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h3 className="text-lg font-medium">
          {format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")}
        </h3>
        <Select value={view} onValueChange={setView}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="View" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {view === "week" ? (
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-8 border-b">
            <div className="p-2 border-r bg-muted/50"></div>
            {daysOfWeek.map((day, i) => (
              <div
                key={i}
                className={`p-2 text-center font-medium border-r ${
                  isSameDay(day, new Date()) ? "bg-primary/10" : "bg-muted/50"
                }`}
              >
                <div>{format(day, "EEE")}</div>
                <div className="text-sm">{format(day, "d")}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-8">
            <div className="border-r">
              {timeSlots.map((hour, i) => (
                <div key={i} className="h-20 border-b p-1 text-xs text-muted-foreground">
                  {hour}:00
                </div>
              ))}
            </div>

            {daysOfWeek.map((day, dayIndex) => (
              <div key={dayIndex} className="relative border-r">
                {timeSlots.map((hour, i) => (
                  <div key={i} className="h-20 border-b"></div>
                ))}

                {getEventsForDay(day).map((event) => {
                  const startHour = Number.parseInt(event.startTime.split(":")[0])
                  const startMinute = Number.parseInt(event.startTime.split(":")[1])
                  const endHour = Number.parseInt(event.endTime.split(":")[0])
                  const endMinute = Number.parseInt(event.endTime.split(":")[1])

                  const startPosition = (startHour - 8) * 80 + (startMinute / 60) * 80
                  const duration = (((endHour - startHour) * 60 + (endMinute - startMinute)) / 60) * 80

                  return (
                    <div
                      key={event.id}
                      className={`absolute p-1 rounded-md border text-xs overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${getEventTypeColor(event.type)}`}
                      style={{
                        top: `${startPosition}px`,
                        height: `${duration}px`,
                        left: "4px",
                        right: "4px",
                      }}
                      onClick={() => startEditEvent(event)}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="truncate">
                        {event.startTime} - {event.endTime}
                      </div>
                      <div className="truncate">{event.location}</div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }, (_, i) => {
            const day = addDays(startOfWeek(currentWeek, { weekStartsOn: 0 }), i - 7)
            const isCurrentMonth = day.getMonth() === currentWeek.getMonth()
            const isToday = isSameDay(day, new Date())
            const dayEvents = getEventsForDay(day)

            return (
              <div
                key={i}
                className={`min-h-28 p-1 border rounded-md ${isCurrentMonth ? "" : "opacity-40"} ${
                  isToday ? "bg-primary/10 border-primary/30" : ""
                }`}
              >
                <div className="text-right text-sm font-medium mb-1">{format(day, "d")}</div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded truncate cursor-pointer ${getEventTypeColor(event.type)}`}
                      onClick={() => startEditEvent(event)}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useToast } from "@/components/ui/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns"
import { CalendarIcon, Plus, ChevronLeft, ChevronRight, Upload, ImageIcon, Check, X, Mic, MicOff } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"

export default function TimetablePage() {
  const { toast } = useToast()
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "Math Lecture",
      date: "2025-03-23",
      startTime: "10:00",
      endTime: "11:30",
      location: "Room 101",
      type: "class",
    },
    {
      id: 2,
      title: "Group Study Session",
      date: "2025-03-24",
      startTime: "14:00",
      endTime: "16:00",
      location: "Library",
      type: "study",
    },
    {
      id: 3,
      title: "Physics Lab",
      date: "2025-03-26",
      startTime: "13:00",
      endTime: "15:00",
      location: "Science Building",
      type: "class",
    },
    {
      id: 4,
      title: "Meeting with Advisor",
      date: "2025-03-25",
      startTime: "09:00",
      endTime: "09:30",
      location: "Office 305",
      type: "meeting",
    },
    {
      id: 5,
      title: "English Seminar",
      date: "2025-03-27",
      startTime: "11:00",
      endTime: "12:30",
      location: "Humanities Building",
      type: "class",
    },
  ])

  const [newEvent, setNewEvent] = useState({
    title: "",
    date: new Date(),
    startTime: "09:00",
    endTime: "10:00",
    location: "",
    type: "class",
  })

  const [editingEvent, setEditingEvent] = useState(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [view, setView] = useState("week") // week or month

  // Image upload states
  const [isImageUploadDialogOpen, setIsImageUploadDialogOpen] = useState(false)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedEvents, setExtractedEvents] = useState([])
  const fileInputRef = useRef(null)

  // Voice input states
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false)
  const [voiceInputField, setVoiceInputField] = useState(null)
  const [voiceInputText, setVoiceInputText] = useState("")
  const [voiceRecognitionSupported, setVoiceRecognitionSupported] = useState(false)

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // Load events from localStorage
    const savedEvents = localStorage.getItem("events")
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents))
    }

    // Check if voice recognition is supported
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      setVoiceRecognitionSupported(true)
    }
  }, [])

  // Save events to localStorage when they change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("events", JSON.stringify(events))
    }
  }, [events, isMounted])

  const addEvent = () => {
    if (!newEvent.title.trim()) {
      toast({
        title: "Error",
        description: "Event title is required",
        variant: "destructive",
      })
      return
    }

    const event = {
      id: Date.now(),
      title: newEvent.title,
      date: format(newEvent.date, "yyyy-MM-dd"),
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      location: newEvent.location,
      type: newEvent.type,
    }

    setEvents([...events, event])
    setNewEvent({
      title: "",
      date: new Date(),
      startTime: "09:00",
      endTime: "10:00",
      location: "",
      type: "class",
    })
    setIsAddDialogOpen(false)

    toast({
      title: "Event added",
      description: "Your new event has been added to your schedule.",
    })
  }

  const updateEvent = () => {
    if (!editingEvent.title.trim()) {
      toast({
        title: "Error",
        description: "Event title is required",
        variant: "destructive",
      })
      return
    }

    setEvents(
      events.map((event) =>
        event.id === editingEvent.id
          ? {
              ...event,
              title: editingEvent.title,
              date: typeof editingEvent.date === "object" ? format(editingEvent.date, "yyyy-MM-dd") : editingEvent.date,
              startTime: editingEvent.startTime,
              endTime: editingEvent.endTime,
              location: editingEvent.location,
              type: editingEvent.type,
            }
          : event,
      ),
    )

    setIsEditDialogOpen(false)

    toast({
      title: "Event updated",
      description: "Your event has been updated successfully.",
    })
  }

  const deleteEvent = (id) => {
    setEvents(events.filter((event) => event.id !== id))

    toast({
      title: "Event deleted",
      description: "Your event has been removed from your schedule.",
    })
  }

  const startEditEvent = (event) => {
    setEditingEvent({
      ...event,
      date: new Date(event.date),
    })
    setIsEditDialogOpen(true)
  }

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 })
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const previousWeek = () => {
    setCurrentWeek((prevWeek) => addDays(prevWeek, -7))
  }

  const nextWeek = () => {
    setCurrentWeek((prevWeek) => addDays(prevWeek, 7))
  }

  const goToToday = () => {
    setCurrentWeek(new Date())
  }

  const getEventsForDay = (day) => {
    const formattedDay = format(day, "yyyy-MM-dd")
    return events.filter((event) => event.date === formattedDay)
  }

  const timeSlots = Array.from({ length: 14 }, (_, i) => i + 8) // 8 AM to 9 PM

  const getEventTypeColor = (type) => {
    switch (type) {
      case "class":
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800"
      case "study":
        return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-800"
      case "meeting":
        return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800"
      case "personal":
        return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
    }
  }

  // Enhanced image processing with better OCR simulation
  const processImage = () => {
    setIsProcessing(true)

    // Simulate more sophisticated image processing
    setTimeout(() => {
      // Enhanced mock extraction based on common timetable patterns
      const mockExtractedEvents = [
        {
          id: Date.now(),
          title: "Mathematics 101",
          date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
          startTime: "09:00",
          endTime: "10:30",
          location: "Room A-101",
          type: "class",
        },
        {
          id: Date.now() + 1,
          title: "Physics Laboratory",
          date: format(addDays(new Date(), 2), "yyyy-MM-dd"),
          startTime: "14:00",
          endTime: "16:00",
          location: "Physics Lab 1",
          type: "class",
        },
        {
          id: Date.now() + 2,
          title: "Computer Science Lecture",
          date: format(addDays(new Date(), 3), "yyyy-MM-dd"),
          startTime: "11:00",
          endTime: "12:30",
          location: "Computer Lab",
          type: "class",
        },
        {
          id: Date.now() + 3,
          title: "Chemistry Tutorial",
          date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
          startTime: "15:30",
          endTime: "16:30",
          location: "Chemistry Building",
          type: "class",
        },
        {
          id: Date.now() + 4,
          title: "Study Group Meeting",
          date: format(addDays(new Date(), 4), "yyyy-MM-dd"),
          startTime: "13:00",
          endTime: "15:00",
          location: "Library Room 205",
          type: "study",
        },
        {
          id: Date.now() + 5,
          title: "Office Hours - Prof. Smith",
          date: format(addDays(new Date(), 5), "yyyy-MM-dd"),
          startTime: "10:00",
          endTime: "11:00",
          location: "Faculty Office 312",
          type: "meeting",
        },
      ]

      setExtractedEvents(mockExtractedEvents)
      setIsProcessing(false)

      toast({
        title: "Image processed successfully",
        description: `We've extracted ${mockExtractedEvents.length} events from your timetable image.`,
      })
    }, 3000) // Longer processing time to simulate real OCR
  }

  const confirmExtractedEvents = () => {
    setEvents([...events, ...extractedEvents])
    setUploadedImage(null)
    setExtractedEvents([])
    setIsImageUploadDialogOpen(false)

    toast({
      title: "Events added",
      description: `${extractedEvents.length} events have been added to your schedule.`,
    })
  }

  const cancelImageUpload = () => {
    setUploadedImage(null)
    setExtractedEvents([])
    setIsImageUploadDialogOpen(false)
  }

  // Enhanced file handling
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB.",
          variant: "destructive",
        })
        return
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (PNG, JPG, JPEG).",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Voice input handlers
  const startVoiceInput = (field) => {
    if (!voiceRecognitionSupported) {
      toast({
        title: "Voice input not supported",
        description: "Your browser does not support voice recognition.",
        variant: "destructive",
      })
      return
    }

    setVoiceInputField(field)
    setIsVoiceInputActive(true)
    setVoiceInputText("")

    toast({
      title: "Voice input activated",
      description: `Speak now to enter ${field}...`,
    })

    // Enhanced voice recognition simulation
    setTimeout(() => {
      let recognizedText = ""

      switch (field) {
        case "title":
          recognizedText = "Advanced Programming Workshop"
          setNewEvent((prev) => ({ ...prev, title: recognizedText }))
          break
        case "location":
          recognizedText = "Computer Science Building Room 204"
          setNewEvent((prev) => ({ ...prev, location: recognizedText }))
          break
        case "edit-title":
          recognizedText = "Data Structures and Algorithms"
          setEditingEvent((prev) => ({ ...prev, title: recognizedText }))
          break
        case "edit-location":
          recognizedText = "Engineering Building Lab 101"
          setEditingEvent((prev) => ({ ...prev, location: recognizedText }))
          break
        default:
          break
      }

      setVoiceInputText(recognizedText)
      setIsVoiceInputActive(false)

      toast({
        title: "Voice input completed",
        description: `Recognized: "${recognizedText}"`,
      })
    }, 4000) // Longer recognition time for better simulation
  }

  const stopVoiceInput = () => {
    setIsVoiceInputActive(false)

    toast({
      title: "Voice input stopped",
      description: "Voice recognition has been stopped.",
    })
  }

  if (!isMounted) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Timetable</h2>
          <p className="text-muted-foreground">Manage your schedule and events</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
                <DialogDescription>Add a new event to your schedule</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="title">Title</Label>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => startVoiceInput("title")}
                      className={isVoiceInputActive && voiceInputField === "title" ? "bg-red-100 dark:bg-red-900" : ""}
                    >
                      {isVoiceInputActive && voiceInputField === "title" ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Input
                    id="title"
                    placeholder="Event title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newEvent.date ? format(newEvent.date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newEvent.date}
                        onSelect={(date) => setNewEvent({ ...newEvent, date: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="location">Location</Label>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => startVoiceInput("location")}
                      className={
                        isVoiceInputActive && voiceInputField === "location" ? "bg-red-100 dark:bg-red-900" : ""
                      }
                    >
                      {isVoiceInputActive && voiceInputField === "location" ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Input
                    id="location"
                    placeholder="Event location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Event Type</Label>
                  <Select value={newEvent.type} onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="class">Class</SelectItem>
                      <SelectItem value="study">Study</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addEvent}>Add Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isImageUploadDialogOpen} onOpenChange={setIsImageUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ImageIcon className="mr-2 h-4 w-4" />
                Import from Image
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Import Timetable from Image</DialogTitle>
                <DialogDescription>Upload an image of your timetable to automatically extract events</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                  <TabsTrigger value="review" disabled={!uploadedImage}>
                    Review
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="py-4">
                  {!uploadedImage ? (
                    <div className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-lg">
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          Drag and drop your timetable image, or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Supports PNG, JPG, or JPEG up to 10MB</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                          Choose File
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => startVoiceInput("timetable")}
                          className={
                            isVoiceInputActive && voiceInputField === "timetable" ? "bg-red-100 dark:bg-red-900" : ""
                          }
                        >
                          {isVoiceInputActive && voiceInputField === "timetable" ? (
                            <MicOff className="h-4 w-4 mr-2" />
                          ) : (
                            <Mic className="h-4 w-4 mr-2" />
                          )}
                          Voice Input
                        </Button>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleFileChange}
                      />

                      {isVoiceInputActive && voiceInputField === "timetable" && (
                        <div className="mt-4 p-4 border rounded-lg w-full">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">Voice Input</h4>
                            <Button variant="ghost" size="sm" onClick={stopVoiceInput}>
                              <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                          </div>
                          <Textarea
                            placeholder="Speak your timetable details..."
                            value={voiceInputText}
                            className="min-h-[100px]"
                            readOnly
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Example: "I have Math class on Monday at 9 AM in Room 101, and Physics lab on Wednesday from
                            2 PM to 4 PM"
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative aspect-video rounded-lg overflow-hidden border">
                        <Image
                          src={uploadedImage || "/placeholder.svg"}
                          alt="Uploaded timetable"
                          width={640}
                          height={360}
                          className="object-contain w-full h-full"
                        />
                      </div>
                      <div className="flex justify-between">
                        <Button variant="outline" onClick={() => setUploadedImage(null)}>
                          Choose Different Image
                        </Button>
                        <Button onClick={processImage} disabled={isProcessing}>
                          {isProcessing ? "Processing..." : "Extract Events"}
                        </Button>
                      </div>
                      {isProcessing && (
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">
                            Analyzing image and extracting schedule information...
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="review" className="py-4">
                  {extractedEvents.length > 0 ? (
                    <div className="space-y-4">
                      <Alert>
                        <Check className="h-4 w-4" />
                        <AlertTitle>Events extracted successfully</AlertTitle>
                        <AlertDescription>
                          We found {extractedEvents.length} events in your timetable image. Review them below before
                          adding to your schedule.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {extractedEvents.map((event, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{event.title}</h4>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(event.date), "PPP")} • {event.startTime} - {event.endTime}
                                </div>
                                <div className="text-sm text-muted-foreground">{event.location}</div>
                              </div>
                              <div className={`px-2 py-1 text-xs rounded-full ${getEventTypeColor(event.type)}`}>
                                {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between">
                        <Button variant="outline" onClick={cancelImageUpload}>
                          Cancel
                        </Button>
                        <Button onClick={confirmExtractedEvents}>Add All Events</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 p-8">
                      <X className="h-10 w-10 text-muted-foreground" />
                      <p className="text-center text-muted-foreground">
                        No events were extracted. Try uploading a clearer image with better contrast.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={previousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h3 className="text-lg font-medium">
          {format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")}
        </h3>
        <Select value={view} onValueChange={setView}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="View" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {view === "week" ? (
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-8 border-b">
            <div className="p-2 border-r bg-muted/50"></div>
            {daysOfWeek.map((day, i) => (
              <div
                key={i}
                className={`p-2 text-center font-medium border-r ${
                  isSameDay(day, new Date()) ? "bg-primary/10" : "bg-muted/50"
                }`}
              >
                <div>{format(day, "EEE")}</div>
                <div className="text-sm">{format(day, "d")}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-8">
            <div className="border-r">
              {timeSlots.map((hour, i) => (
                <div key={i} className="h-20 border-b p-1 text-xs text-muted-foreground">
                  {hour}:00
                </div>
              ))}
            </div>

            {daysOfWeek.map((day, dayIndex) => (
              <div key={dayIndex} className="relative border-r">
                {timeSlots.map((hour, i) => (
                  <div key={i} className="h-20 border-b"></div>
                ))}

                {getEventsForDay(day).map((event) => {
                  const startHour = Number.parseInt(event.startTime.split(":")[0])
                  const startMinute = Number.parseInt(event.startTime.split(":")[1])
                  const endHour = Number.parseInt(event.endTime.split(":")[0])
                  const endMinute = Number.parseInt(event.endTime.split(":")[1])

                  const startPosition = (startHour - 8) * 80 + (startMinute / 60) * 80
                  const duration = (((endHour - startHour) * 60 + (endMinute - startMinute)) / 60) * 80

                  return (
                    <div
                      key={event.id}
                      className={`absolute p-1 rounded-md border text-xs overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${getEventTypeColor(event.type)}`}
                      style={{
                        top: `${startPosition}px`,
                        height: `${duration}px`,
                        left: "4px",
                        right: "4px",
                      }}
                      onClick={() => startEditEvent(event)}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="truncate">
                        {event.startTime} - {event.endTime}
                      </div>
                      <div className="truncate">{event.location}</div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }, (_, i) => {
            const day = addDays(startOfWeek(currentWeek, { weekStartsOn: 0 }), i - 7)
            const isCurrentMonth = day.getMonth() === currentWeek.getMonth()
            const isToday = isSameDay(day, new Date())
            const dayEvents = getEventsForDay(day)

            return (
              <div
                key={i}
                className={`min-h-28 p-1 border rounded-md ${isCurrentMonth ? "" : "opacity-40"} ${
                  isToday ? "bg-primary/10 border-primary/30" : ""
                }`}
              >
                <div className="text-right text-sm font-medium mb-1">{format(day, "d")}</div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded truncate cursor-pointer ${getEventTypeColor(event.type)}`}
                      onClick={() => startEditEvent(event)}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update your event details</DialogDescription>
          </DialogHeader>
          {editingEvent && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-title">Title</Label>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => startVoiceInput("edit-title")}
                    className={
                      isVoiceInputActive && voiceInputField === "edit-title" ? "bg-red-100 dark:bg-red-900" : ""
                    }
                  >
                    {isVoiceInputActive && voiceInputField === "edit-title" ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Input
                  id="edit-title"
                  placeholder="Event title"
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editingEvent.date instanceof Date
                        ? format(editingEvent.date, "PPP")
                        : format(new Date(editingEvent.date), "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editingEvent.date instanceof Date ? editingEvent.date : new Date(editingEvent.date)}
                      onSelect={(date) => setEditingEvent({ ...editingEvent, date: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-startTime">Start Time</Label>
                  <Input
                    id="edit-startTime"
                    type="time"
                    value={editingEvent.startTime}
                    onChange={(e) => setEditingEvent({ ...editingEvent, startTime: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-endTime">End Time</Label>
                  <Input
                    id="edit-endTime"
                    type="time"
                    value={editingEvent.endTime}
                    onChange={(e) => setEditingEvent({ ...editingEvent, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-location">Location</Label>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => startVoiceInput("edit-location")}
                    className={
                      isVoiceInputActive && voiceInputField === "edit-location" ? "bg-red-100 dark:bg-red-900" : ""
                    }
                  >
                    {isVoiceInputActive && voiceInputField === "edit-location" ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Input
                  id="edit-location"
                  placeholder="Event location"
                  value={editingEvent.location}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Event Type</Label>
                <Select
                  value={editingEvent.type}
                  onValueChange={(value) => setEditingEvent({ ...editingEvent, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class">Class</SelectItem>
                    <SelectItem value="study">Study</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteEvent(editingEvent?.id)}>
              Delete
            </Button>
            <Button onClick={updateEvent}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
