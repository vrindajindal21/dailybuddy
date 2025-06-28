"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckSquare, Calendar, BarChart, ArrowRight, Sparkles, Brain, Users, Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { WeatherWidget } from "@/components/weather-widget"
import { AiSuggestions } from "@/components/ai-suggestions"
import { useLanguage } from "@/components/language-provider"
import DailyQuoteWidget from "@/components/daily-quote-widget"
import BrainGames from "@/components/brain-games"
import FamilyFeatures from "@/components/family-features"

type TaskType = {
  id: number;
  title: string;
  dueDate: string;
  completed: boolean;
  priority: string;
};

type EventType = {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
};

type HabitType = {
  id: number;
  name: string;
  completed: boolean;
  streak: number;
};

type StudySessionType = {
  id: number;
  date: string;
  duration: number;
  subject: string;
};

export default function DashboardPage() {
  const { toast } = useToast()
  const { t } = useLanguage()
  const [upcomingTasks, setUpcomingTasks] = useState<TaskType[]>([
    { id: 1, title: "Math Assignment", dueDate: "2025-03-25", completed: false, priority: "high" },
    { id: 2, title: "Physics Lab Report", dueDate: "2025-03-28", completed: false, priority: "medium" },
    { id: 3, title: "Literature Essay", dueDate: "2025-04-02", completed: false, priority: "medium" },
  ])
  const [upcomingEvents, setUpcomingEvents] = useState<EventType[]>([
    { id: 1, title: "Math Lecture", date: "2025-03-23", time: "10:00 AM", location: "Room 101" },
    { id: 2, title: "Group Study Session", date: "2025-03-24", time: "2:00 PM", location: "Library" },
    { id: 3, title: "Physics Lab", date: "2025-03-26", time: "1:00 PM", location: "Science Building" },
  ])
  const [studyStats, setStudyStats] = useState({
    todayMinutes: 120,
    weekMinutes: 540,
    monthMinutes: 2160,
    goalMinutes: 180,
  })
  const [habits, setHabits] = useState<HabitType[]>([
    { id: 1, name: "Read 30 minutes", completed: true, streak: 5 },
    { id: 2, name: "Exercise", completed: false, streak: 3 },
    { id: 3, name: "Drink water", completed: true, streak: 7 },
  ])

  const [isMounted, setIsMounted] = useState(false)
  const [dataInitialized, setDataInitialized] = useState(false)
  const [activeExtraWidget, setActiveExtraWidget] = useState<"games" | "family">("games")
  const [greeting, setGreeting] = useState("")

  useEffect(() => {
    setIsMounted(true)

    // Set greeting based on time of day
    const hour = new Date().getHours()
    if (hour < 12) {
      setGreeting("Good Morning! ☀️")
    } else if (hour < 17) {
      setGreeting("Good Afternoon! 🌤️")
    } else {
      setGreeting("Good Evening! 🌙")
    }
  }, [])

  // Load data from localStorage
  useEffect(() => {
    if (isMounted && !dataInitialized) {
      // Load tasks
      const savedTasks = localStorage.getItem("tasks")
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks)
        // Get upcoming incomplete tasks
        const upcoming = parsedTasks
          .filter((task: TaskType) => !task.completed)
          .sort((a: TaskType, b: TaskType) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
          .slice(0, 3)

        if (upcoming.length > 0) {
          setUpcomingTasks(upcoming)
        }
      }

      // Load events
      const savedEvents = localStorage.getItem("events")
      if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents)
        // Get upcoming events
        const upcoming = parsedEvents.sort((a: EventType, b: EventType) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3)

        if (upcoming.length > 0) {
          setUpcomingEvents(upcoming)
        }
      }

      // Load habits
      const savedHabits = localStorage.getItem("habits")
      if (savedHabits) {
        const parsedHabits = JSON.parse(savedHabits)
        if (parsedHabits.length > 0) {
          setHabits(parsedHabits.slice(0, 3))
        }
      }

      // Load study stats
      const savedSessions = localStorage.getItem("studySessions")
      if (savedSessions) {
        const parsedSessions = JSON.parse(savedSessions)

        // Calculate study stats
        const today = new Date()
        const todaySessions = parsedSessions.filter(
          (session: StudySessionType) => new Date(session.date).toDateString() === today.toDateString(),
        )

        const weekStart = new Date()
        weekStart.setDate(today.getDate() - today.getDay())
        const weekSessions = parsedSessions.filter((session: StudySessionType) => new Date(session.date).getTime() >= weekStart.getTime())

        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const monthSessions = parsedSessions.filter((session: StudySessionType) => new Date(session.date).getTime() >= monthStart.getTime())

        const todayMinutes = todaySessions.reduce((total: number, session: StudySessionType) => total + session.duration, 0)
        const weekMinutes = weekSessions.reduce((total: number, session: StudySessionType) => total + session.duration, 0)
        const monthMinutes = monthSessions.reduce((total: number, session: StudySessionType) => total + session.duration, 0)

        if (parsedSessions.length > 0) {
          setStudyStats({
            todayMinutes: todayMinutes || 120,
            weekMinutes: weekMinutes || 540,
            monthMinutes: monthMinutes || 2160,
            goalMinutes: 180,
          })
        }
      }

      setDataInitialized(true)
    }
  }, [isMounted, dataInitialized])

  const completeTask = (id: number) => {
    setUpcomingTasks((tasks: TaskType[]) => tasks.map((task: TaskType) => (task.id === id ? { ...task, completed: !task.completed } : task)))
    toast({
      title: "Task updated! ✅",
      description: "Great job staying productive!",
    })
  }

  const completeHabit = (id: number) => {
    setHabits((habits: HabitType[]) =>
      habits.map((habit: HabitType) =>
        habit.id === id
          ? { ...habit, completed: !habit.completed, streak: habit.completed ? habit.streak - 1 : habit.streak + 1 }
          : habit,
      ),
    )
    toast({
      title: "Habit tracked! 🎯",
      description: "Building great habits one day at a time!",
    })
  }

  if (!isMounted) {
    return null
  }

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-6 lg:px-8 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Header and Greeting - Centered */}
      <div className="text-center space-y-4 w-full max-w-full min-w-0 overflow-x-hidden">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight truncate w-full max-w-full min-w-0">
          {greeting}
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg break-words w-full max-w-full min-w-0">Welcome to your dashboard. Here's a quick overview of your productivity and upcoming items.</p>
        <div className="w-full max-w-full min-w-0 overflow-x-hidden">
          <DailyQuoteWidget />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 w-full max-w-full min-w-0 overflow-x-hidden sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 min-w-0 w-full max-w-full overflow-x-hidden">
            <CardTitle className="text-sm font-medium truncate w-full max-w-full min-w-0">Upcoming Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-blue-500 shrink-0" />
          </CardHeader>
          <CardContent className="w-full max-w-full min-w-0">
            <div className="text-2xl font-bold">{upcomingTasks.length}</div>
            <p className="text-xs text-muted-foreground">tasks due soon</p>
          </CardContent>
        </Card>
        <Card className="p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 min-w-0 w-full max-w-full overflow-x-hidden">
            <CardTitle className="text-sm font-medium truncate w-full max-w-full min-w-0">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-green-500 shrink-0" />
          </CardHeader>
          <CardContent className="w-full max-w-full min-w-0">
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">events scheduled</p>
          </CardContent>
        </Card>
        <Card className="p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 min-w-0 w-full max-w-full overflow-x-hidden">
            <CardTitle className="text-sm font-medium truncate w-full max-w-full min-w-0">Medications</CardTitle>
            <Heart className="h-4 w-4 text-red-500 shrink-0" />
          </CardHeader>
          <CardContent className="w-full max-w-full min-w-0">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">active medications</p>
          </CardContent>
        </Card>
        <Card className="p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 min-w-0 w-full max-w-full overflow-x-hidden">
            <CardTitle className="text-sm font-medium truncate w-full max-w-full min-w-0">Tracked Habits</CardTitle>
            <Heart className="h-4 w-4 text-pink-500 shrink-0" />
          </CardHeader>
          <CardContent className="w-full max-w-full min-w-0">
            <div className="text-2xl font-bold">{habits.length}</div>
            <p className="text-xs text-muted-foreground">habits tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grids */}
      <div className="flex flex-col gap-4 w-full max-w-full min-w-0 overflow-x-hidden">
        {/* Upcoming Tasks */}
        <Card className="p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
          <CardHeader className="w-full max-w-full min-w-0">
            <CardTitle className="truncate w-full max-w-full min-w-0">Upcoming Tasks</CardTitle>
            <CardDescription className="truncate w-full max-w-full min-w-0">Your next tasks to complete</CardDescription>
          </CardHeader>
          <CardContent className="w-full max-w-full min-w-0">
            {upcomingTasks.length === 0 ? (
              <div className="text-center text-muted-foreground">No upcoming tasks</div>
            ) : (
              <ul className="space-y-2 w-full max-w-full min-w-0">
                {upcomingTasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between min-w-0 w-full max-w-full">
                    <span className="truncate flex-1 mr-2 min-w-0 w-full max-w-full">{task.title}</span>
                    <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} className="shrink-0">{task.priority}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        {/* Upcoming Events */}
        <Card className="p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
          <CardHeader className="w-full max-w-full min-w-0">
            <CardTitle className="truncate w-full max-w-full min-w-0">Upcoming Events</CardTitle>
            <CardDescription className="truncate w-full max-w-full min-w-0">Your next scheduled events</CardDescription>
          </CardHeader>
          <CardContent className="w-full max-w-full min-w-0">
            {upcomingEvents.length === 0 ? (
              <div className="text-center text-muted-foreground">No upcoming events</div>
            ) : (
              <ul className="space-y-2 w-full max-w-full min-w-0">
                {upcomingEvents.map((event) => (
                  <li key={event.id} className="flex items-center justify-between min-w-0 w-full max-w-full">
                    <span className="truncate flex-1 mr-2 min-w-0 w-full max-w-full">{event.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{event.date} {event.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        {/* Tracked Habits */}
        <Card className="p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
          <CardHeader className="w-full max-w-full min-w-0">
            <CardTitle className="truncate w-full max-w-full min-w-0">Tracked Habits</CardTitle>
            <CardDescription className="truncate w-full max-w-full min-w-0">Your recent habit activity</CardDescription>
          </CardHeader>
          <CardContent className="w-full max-w-full min-w-0">
            {habits.length === 0 ? (
              <div className="text-center text-muted-foreground">No habits tracked</div>
            ) : (
              <ul className="space-y-2 w-full max-w-full min-w-0">
                {habits.map((habit) => (
                  <li key={habit.id} className="flex items-center justify-between min-w-0 w-full max-w-full">
                    <span className="truncate flex-1 mr-2 min-w-0 w-full max-w-full">{habit.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">Streak: {habit.streak}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Extra Widgets (Weather, AI, Games, Family) */}
      <div className="grid grid-cols-1 gap-4 w-full max-w-full min-w-0 overflow-x-hidden sm:grid-cols-2">
        <Card className="p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
          <CardHeader className="w-full max-w-full min-w-0">
            <CardTitle className="truncate w-full max-w-full min-w-0">Weather</CardTitle>
            <CardDescription className="truncate w-full max-w-full min-w-0">Stay updated with the latest weather</CardDescription>
          </CardHeader>
          <CardContent className="w-full max-w-full min-w-0">
            <WeatherWidget />
          </CardContent>
        </Card>
        <Card className="p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
          <CardHeader className="w-full max-w-full min-w-0">
            <CardTitle className="truncate w-full max-w-full min-w-0">AI Suggestions</CardTitle>
            <CardDescription className="truncate w-full max-w-full min-w-0">Personalized productivity tips</CardDescription>
          </CardHeader>
          <CardContent className="w-full max-w-full min-w-0">
            <AiSuggestions 
              tasks={upcomingTasks} 
              habits={habits} 
              studySessions={[]} 
              goals={[]} 
            />
          </CardContent>
        </Card>
        <Card className="p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
          <CardHeader className="w-full max-w-full min-w-0">
            <CardTitle className="truncate w-full max-w-full min-w-0">Brain Games</CardTitle>
            <CardDescription className="truncate w-full max-w-full min-w-0">Sharpen your mind</CardDescription>
          </CardHeader>
          <CardContent className="w-full max-w-full min-w-0">
            <BrainGames />
          </CardContent>
        </Card>
        <Card className="p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
          <CardHeader className="w-full max-w-full min-w-0">
            <CardTitle className="truncate w-full max-w-full min-w-0">Family Features</CardTitle>
            <CardDescription className="truncate w-full max-w-full min-w-0">Connect with your family</CardDescription>
          </CardHeader>
          <CardContent className="w-full max-w-full min-w-0">
            <FamilyFeatures />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
