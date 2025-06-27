"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Mic, MicOff, VolumeX, Loader2, MessageCircle, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format, addDays } from "date-fns"

interface VoiceAssistantProps {
  onCommand?: (command: string, data: any) => void
}

export function VoiceAssistant({ onCommand }: VoiceAssistantProps) {
  const { toast } = useToast()
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isSupported, setIsSupported] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [lastCommand, setLastCommand] = useState("")
  const [commandHistory, setCommandHistory] = useState([])
  const [isSpeaking, setIsSpeaking] = useState(false)

  const recognitionRef = useRef(null)
  const synthRef = useRef(null)

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = true
        recognition.lang = "en-US"
        recognitionRef.current = recognition
        setIsSupported(true)
      }

      // Speech Synthesis
      if (window.speechSynthesis) {
        synthRef.current = window.speechSynthesis
      }
    }
  }, [])

  // Set up recognition event handlers
  useEffect(() => {
    if (!recognitionRef.current) return

    const recognition = recognitionRef.current

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript("")
    }

    recognition.onresult = (event) => {
      let finalTranscript = ""
      let interimTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      setTranscript(finalTranscript || interimTranscript)

      if (finalTranscript) {
        processVoiceCommand(finalTranscript.trim())
      }
    }

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error)
      setIsListening(false)
      setIsProcessing(false)

      if (event.error !== "aborted") {
        toast({
          title: "Voice recognition error",
          description: "Please try again or check your microphone permissions.",
          variant: "destructive",
        })
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    return () => {
      if (recognition) {
        recognition.onstart = null
        recognition.onresult = null
        recognition.onerror = null
        recognition.onend = null
      }
    }
  }, [])

  // Process voice commands
  const processVoiceCommand = useCallback(
    async (command) => {
      setIsProcessing(true)
      setLastCommand(command)

      // Add to command history
      setCommandHistory((prev) => [{ command, timestamp: new Date(), processed: false }, ...prev.slice(0, 4)])

      try {
        const result = await parseAndExecuteCommand(command.toLowerCase())

        // Update command history with result
        setCommandHistory((prev) =>
          prev.map((item, index) => (index === 0 ? { ...item, processed: true, result } : item)),
        )

        // Speak response
        if (result.success && result.response) {
          speak(result.response)
        }

        if (onCommand) {
          onCommand(command, result)
        }
      } catch (error) {
        console.error("Command processing error:", error)
        toast({
          title: "Command failed",
          description: "Sorry, I couldn't process that command.",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
    },
    [onCommand],
  )

  // Parse and execute voice commands
  const parseAndExecuteCommand = async (command) => {
    // Task commands
    if (command.includes("add task") || command.includes("create task") || command.includes("new task")) {
      return await handleTaskCommand(command, "add")
    }

    if (command.includes("delete task") || command.includes("remove task")) {
      return await handleTaskCommand(command, "delete")
    }

    // Habit commands
    if (command.includes("add habit") || command.includes("create habit") || command.includes("new habit")) {
      return await handleHabitCommand(command, "add")
    }

    if (command.includes("delete habit") || command.includes("remove habit")) {
      return await handleHabitCommand(command, "delete")
    }

    // Goal commands
    if (command.includes("add goal") || command.includes("create goal") || command.includes("new goal")) {
      return await handleGoalCommand(command, "add")
    }

    if (command.includes("delete goal") || command.includes("remove goal")) {
      return await handleGoalCommand(command, "delete")
    }

    // Expense commands
    if (command.includes("add expense") || command.includes("spent") || command.includes("bought")) {
      return await handleExpenseCommand(command, "add")
    }

    if (command.includes("delete expense") || command.includes("remove expense")) {
      return await handleExpenseCommand(command, "delete")
    }

    // Reminder commands
    if (command.includes("remind me") || command.includes("set reminder") || command.includes("add reminder")) {
      return await handleReminderCommand(command, "add")
    }

    // Event/Timetable commands
    if (command.includes("add event") || command.includes("schedule") || command.includes("add class")) {
      return await handleEventCommand(command, "add")
    }

    // General queries
    if (command.includes("what") || command.includes("how many") || command.includes("show me")) {
      return await handleQueryCommand(command)
    }

    // Default response
    return {
      success: false,
      response:
        "I didn't understand that command. Try saying 'add task', 'create habit', 'add expense', or 'remind me to'.",
      action: "unknown",
    }
  }

  // Handle task commands
  const handleTaskCommand = async (command, action) => {
    if (action === "add") {
      // Extract task details from command
      const taskMatch = command.match(
        /(?:add task|create task|new task)\s+(.+?)(?:\s+(?:due|by)\s+(.+?))?(?:\s+priority\s+(high|medium|low))?$/i,
      )

      if (taskMatch) {
        const title = taskMatch[1].trim()
        const dueDate = taskMatch[2] ? parseDateFromText(taskMatch[2]) : format(addDays(new Date(), 1), "yyyy-MM-dd")
        const priority = taskMatch[3] || "medium"

        const task = {
          id: Date.now(),
          title,
          description: "",
          dueDate,
          completed: false,
          priority,
          category: "personal",
          notifyBefore: 1,
          notificationEnabled: true,
        }

        // Save to localStorage
        const savedTasks = localStorage.getItem("tasks")
        const tasks = savedTasks ? JSON.parse(savedTasks) : []
        tasks.push(task)
        localStorage.setItem("tasks", JSON.stringify(tasks))

        // Trigger page refresh event
        window.dispatchEvent(new Event("tasksUpdated"))

        return {
          success: true,
          response: `Task "${title}" added successfully for ${format(new Date(dueDate), "MMMM do")}.`,
          action: "add_task",
          data: task,
        }
      }
    } else if (action === "delete") {
      // Extract task name to delete
      const deleteMatch = command.match(/(?:delete task|remove task)\s+(.+)/i)

      if (deleteMatch) {
        const taskName = deleteMatch[1].trim()

        const savedTasks = localStorage.getItem("tasks")
        const tasks = savedTasks ? JSON.parse(savedTasks) : []

        const taskIndex = tasks.findIndex((task) => task.title.toLowerCase().includes(taskName.toLowerCase()))

        if (taskIndex !== -1) {
          const deletedTask = tasks[taskIndex]
          tasks.splice(taskIndex, 1)
          localStorage.setItem("tasks", JSON.stringify(tasks))

          // Trigger page refresh event
          window.dispatchEvent(new Event("tasksUpdated"))

          return {
            success: true,
            response: `Task "${deletedTask.title}" deleted successfully.`,
            action: "delete_task",
            data: deletedTask,
          }
        } else {
          return {
            success: false,
            response: `I couldn't find a task with "${taskName}" in the name.`,
            action: "delete_task_not_found",
          }
        }
      }
    }

    return {
      success: false,
      response: "I couldn't understand the task command. Try 'add task study for exam' or 'delete task homework'.",
      action: "task_command_failed",
    }
  }

  // Handle habit commands
  const handleHabitCommand = async (command, action) => {
    if (action === "add") {
      const habitMatch = command.match(/(?:add habit|create habit|new habit)\s+(.+)/i)

      if (habitMatch) {
        const name = habitMatch[1].trim()

        const habit = {
          id: Date.now(),
          name,
          category: "health",
          streak: 0,
          completedDates: [],
        }

        const savedHabits = localStorage.getItem("habits")
        const habits = savedHabits ? JSON.parse(savedHabits) : []
        habits.push(habit)
        localStorage.setItem("habits", JSON.stringify(habits))

        window.dispatchEvent(new Event("habitsUpdated"))

        return {
          success: true,
          response: `Habit "${name}" added successfully. Start building your streak!`,
          action: "add_habit",
          data: habit,
        }
      }
    } else if (action === "delete") {
      const deleteMatch = command.match(/(?:delete habit|remove habit)\s+(.+)/i)

      if (deleteMatch) {
        const habitName = deleteMatch[1].trim()

        const savedHabits = localStorage.getItem("habits")
        const habits = savedHabits ? JSON.parse(savedHabits) : []

        const habitIndex = habits.findIndex((habit) => habit.name.toLowerCase().includes(habitName.toLowerCase()))

        if (habitIndex !== -1) {
          const deletedHabit = habits[habitIndex]
          habits.splice(habitIndex, 1)
          localStorage.setItem("habits", JSON.stringify(habits))

          window.dispatchEvent(new Event("habitsUpdated"))

          return {
            success: true,
            response: `Habit "${deletedHabit.name}" deleted successfully.`,
            action: "delete_habit",
            data: deletedHabit,
          }
        } else {
          return {
            success: false,
            response: `I couldn't find a habit with "${habitName}" in the name.`,
            action: "delete_habit_not_found",
          }
        }
      }
    }

    return {
      success: false,
      response: "I couldn't understand the habit command. Try 'add habit drink water' or 'delete habit exercise'.",
      action: "habit_command_failed",
    }
  }

  // Handle goal commands
  const handleGoalCommand = async (command, action) => {
    if (action === "add") {
      const goalMatch = command.match(/(?:add goal|create goal|new goal)\s+(.+)/i)

      if (goalMatch) {
        const title = goalMatch[1].trim()

        const goal = {
          id: Date.now(),
          title,
          description: "",
          category: "personal",
          targetDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
          progress: 0,
          milestones: [{ id: Date.now(), title: "Get started", completed: false }],
          priority: "medium",
          status: "not-started",
        }

        const savedGoals = localStorage.getItem("goals")
        const goals = savedGoals ? JSON.parse(savedGoals) : []
        goals.push(goal)
        localStorage.setItem("goals", JSON.stringify(goals))

        window.dispatchEvent(new Event("goalsUpdated"))

        return {
          success: true,
          response: `Goal "${title}" added successfully with a target date of ${format(addDays(new Date(), 30), "MMMM do")}.`,
          action: "add_goal",
          data: goal,
        }
      }
    }

    return {
      success: false,
      response: "I couldn't understand the goal command. Try 'add goal learn Spanish' or 'create goal run marathon'.",
      action: "goal_command_failed",
    }
  }

  // Handle expense commands
  const handleExpenseCommand = async (command, action) => {
    if (action === "add") {
      // Extract amount and description
      const expenseMatch = command.match(
        /(?:add expense|spent|bought)\s+(?:(\d+(?:\.\d{2})?)\s+(?:dollars?|rupees?|on)\s+)?(.+?)(?:\s+for\s+(\d+(?:\.\d{2})?)\s*(?:dollars?|rupees?)?)?/i,
      )

      if (expenseMatch) {
        const amount = expenseMatch[1] || expenseMatch[3] || "10"
        const title = expenseMatch[2].trim()

        const expense = {
          id: Date.now(),
          title,
          amount: Number.parseFloat(amount),
          date: format(new Date(), "yyyy-MM-dd"),
          category: "personal",
          notes: "Added via voice command",
        }

        const savedExpenses = localStorage.getItem("expenses")
        const expenses = savedExpenses ? JSON.parse(savedExpenses) : []
        expenses.push(expense)
        localStorage.setItem("expenses", JSON.stringify(expenses))

        window.dispatchEvent(new Event("expensesUpdated"))

        return {
          success: true,
          response: `Expense "${title}" for $${amount} added successfully.`,
          action: "add_expense",
          data: expense,
        }
      }
    }

    return {
      success: false,
      response:
        "I couldn't understand the expense command. Try 'spent 20 dollars on coffee' or 'add expense lunch for 15'.",
      action: "expense_command_failed",
    }
  }

  // Handle reminder commands
  const handleReminderCommand = async (command, action) => {
    const reminderMatch = command.match(/(?:remind me to|set reminder|add reminder)\s+(.+?)(?:\s+(?:at|in)\s+(.+?))?$/i)

    if (reminderMatch) {
      const title = reminderMatch[1].trim()
      const timeText = reminderMatch[2] || "1 hour"

      const reminder = {
        id: Date.now(),
        title,
        description: "Voice reminder",
        schedule: [
          { time: "09:00", days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
        ],
        notificationsEnabled: true,
        soundEnabled: true,
        soundType: "bell",
        soundVolume: 70,
        color: "blue",
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: null,
        category: "personal",
      }

      const savedReminders = localStorage.getItem("reminders")
      const reminders = savedReminders ? JSON.parse(savedReminders) : []
      reminders.push(reminder)
      localStorage.setItem("reminders", JSON.stringify(reminders))

      window.dispatchEvent(new Event("remindersUpdated"))

      return {
        success: true,
        response: `Reminder "${title}" set successfully.`,
        action: "add_reminder",
        data: reminder,
      }
    }

    return {
      success: false,
      response:
        "I couldn't understand the reminder command. Try 'remind me to call mom' or 'set reminder take medicine'.",
      action: "reminder_command_failed",
    }
  }

  // Handle event commands
  const handleEventCommand = async (command, action) => {
    const eventMatch = command.match(
      /(?:add event|schedule|add class)\s+(.+?)(?:\s+(?:at|on)\s+(.+?))?(?:\s+(?:from|at)\s+(.+?))?$/i,
    )

    if (eventMatch) {
      const title = eventMatch[1].trim()
      const dateText = eventMatch[2] || "tomorrow"
      const timeText = eventMatch[3] || "10:00"

      const event = {
        id: Date.now(),
        title,
        date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
        startTime: "10:00",
        endTime: "11:00",
        location: "",
        type: "personal",
      }

      const savedEvents = localStorage.getItem("events")
      const events = savedEvents ? JSON.parse(savedEvents) : []
      events.push(event)
      localStorage.setItem("events", JSON.stringify(events))

      window.dispatchEvent(new Event("eventsUpdated"))

      return {
        success: true,
        response: `Event "${title}" scheduled successfully for tomorrow.`,
        action: "add_event",
        data: event,
      }
    }

    return {
      success: false,
      response: "I couldn't understand the event command. Try 'schedule meeting tomorrow' or 'add class math at 2pm'.",
      action: "event_command_failed",
    }
  }

  // Handle query commands
  const handleQueryCommand = async (command) => {
    if (command.includes("how many tasks") || command.includes("show me tasks")) {
      const savedTasks = localStorage.getItem("tasks")
      const tasks = savedTasks ? JSON.parse(savedTasks) : []
      const pendingTasks = tasks.filter((task) => !task.completed)

      return {
        success: true,
        response: `You have ${pendingTasks.length} pending tasks and ${tasks.length - pendingTasks.length} completed tasks.`,
        action: "query_tasks",
      }
    }

    if (command.includes("how many habits") || command.includes("show me habits")) {
      const savedHabits = localStorage.getItem("habits")
      const habits = savedHabits ? JSON.parse(savedHabits) : []

      return {
        success: true,
        response: `You have ${habits.length} habits tracked.`,
        action: "query_habits",
      }
    }

    return {
      success: true,
      response:
        "I can help you add tasks, habits, goals, expenses, reminders, and events. Just say what you want to do!",
      action: "general_help",
    }
  }

  // Parse date from natural language
  const parseDateFromText = (text) => {
    const today = new Date()

    if (text.includes("today")) {
      return format(today, "yyyy-MM-dd")
    } else if (text.includes("tomorrow")) {
      return format(addDays(today, 1), "yyyy-MM-dd")
    } else if (text.includes("next week")) {
      return format(addDays(today, 7), "yyyy-MM-dd")
    } else {
      return format(addDays(today, 1), "yyyy-MM-dd")
    }
  }

  // Text-to-speech
  const speak = (text) => {
    if (synthRef.current && text) {
      // Cancel any ongoing speech
      synthRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      synthRef.current.speak(utterance)
    }
  }

  // Start/stop listening
  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice recognition not supported",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive",
      })
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error("Failed to start recognition:", error)
        toast({
          title: "Voice recognition failed",
          description: "Please check your microphone permissions.",
          variant: "destructive",
        })
      }
    }
  }

  // Stop speaking
  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <>
      {/* Floating Voice Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className={`rounded-full w-14 h-14 shadow-lg ${
            isListening
              ? "bg-red-500 hover:bg-red-600"
              : isProcessing
                ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-primary hover:bg-primary/90"
          }`}
        >
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isListening ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Voice Assistant Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80">
          <Card className="shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Voice Assistant</CardTitle>
                  <CardDescription>Say commands to add or remove items</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Voice Controls */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleListening}
                  variant={isListening ? "destructive" : "default"}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-4 w-4 mr-2" />
                      Stop Listening
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Start Listening
                    </>
                  )}
                </Button>

                {isSpeaking && (
                  <Button onClick={stopSpeaking} variant="outline" size="icon">
                    <VolumeX className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Current Transcript */}
              {(isListening || transcript) && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">{isListening ? "Listening..." : "Last Command:"}</p>
                  <p className="text-sm">{transcript || "Speak now..."}</p>
                </div>
              )}

              {/* Processing Status */}
              {isProcessing && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Processing command...</span>
                </div>
              )}

              {/* Command History */}
              {commandHistory.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recent Commands:</p>
                  {commandHistory.slice(0, 3).map((item, index) => (
                    <div key={index} className="p-2 bg-muted rounded text-xs">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-3 w-3" />
                        <span className="truncate">{item.command}</span>
                        <Badge variant={item.processed ? "default" : "secondary"} className="text-xs">
                          {item.processed ? "✓" : "..."}
                        </Badge>
                      </div>
                      {item.result?.response && <p className="mt-1 text-muted-foreground">{item.result.response}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Commands */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Try saying:</p>
                <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
                  <p>• "Add task study for exam"</p>
                  <p>• "Create habit drink water"</p>
                  <p>• "Spent 20 dollars on lunch"</p>
                  <p>• "Remind me to call mom"</p>
                  <p>• "Schedule meeting tomorrow"</p>
                  <p>• "How many tasks do I have?"</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
