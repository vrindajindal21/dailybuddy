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
  const [upcomingEvents, setUpcomingEvents] = useState([
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-x-hidden">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-6 sm:space-y-8 max-w-full w-full">
        {/* Beautiful Header */}
        <div className="text-center space-y-4 py-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
            {greeting}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Ready to make today amazing? Let's get started! ✨
          </p>
          <Badge variant="secondary" className="text-sm px-4 py-2 mx-auto">
            <Calendar className="mr-2 h-4 w-4" />
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </Badge>
        </div>

        {/* Daily Quote - Top Center */}
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-3xl">
            <DailyQuoteWidget />
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Study Time Today</CardTitle>
              <div className="p-2 bg-blue-500 rounded-full">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                {Math.floor(studyStats.todayMinutes / 60)}h {studyStats.todayMinutes % 60}m
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                {studyStats.todayMinutes < studyStats.goalMinutes
                  ? `${studyStats.goalMinutes - studyStats.todayMinutes} min to goal! 🎯`
                  : "Daily goal achieved! 🏆"}
              </p>
              <Progress
                value={(studyStats.todayMinutes / studyStats.goalMinutes) * 100}
                className="h-2 bg-blue-200 dark:bg-blue-800"
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Pending Tasks</CardTitle>
              <div className="p-2 bg-green-500 rounded-full">
                <CheckSquare className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
                {upcomingTasks.filter((t: TaskType) => !t.completed).length}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">
                {upcomingTasks.filter((t: TaskType) => !t.completed && t.priority === "high").length} high priority 🔥
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Upcoming Events
              </CardTitle>
              <div className="p-2 bg-purple-500 rounded-full">
                <Calendar className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-2">
                {upcomingEvents.length}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 truncate">
                Next: {upcomingEvents[0]?.title} 📅
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Weekly Progress
              </CardTitle>
              <div className="p-2 bg-orange-500 rounded-full">
                <BarChart className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100 mb-2">
                {Math.round((studyStats.weekMinutes / (7 * studyStats.goalMinutes)) * 100)}%
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                {Math.floor(studyStats.weekMinutes / 60)}h {studyStats.weekMinutes % 60}m this week 📊
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="xl:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 h-12">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 text-xs sm:text-sm"
                >
                  <Sparkles className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Overview</span>
                  <span className="sm:hidden">Home</span>
                </TabsTrigger>
                <TabsTrigger
                  value="tasks"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 text-xs sm:text-sm"
                >
                  <CheckSquare className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger
                  value="schedule"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 text-xs sm:text-sm"
                >
                  <Calendar className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Schedule</span>
                  <span className="sm:hidden">Events</span>
                </TabsTrigger>
                <TabsTrigger
                  value="habits"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 text-xs sm:text-sm"
                >
                  <Heart className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  Habits
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="overview" className="space-y-6 mt-0 overflow-x-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-lg">
                          <CheckSquare className="h-5 w-5" />
                          Upcoming Tasks
                        </CardTitle>
                        <CardDescription>Your pending assignments and todos</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {upcomingTasks.slice(0, 3).map((task: TaskType) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border shadow-sm"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => completeTask(task.id)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                              />
                              <span
                                className={`${task.completed ? "line-through text-muted-foreground" : "font-medium"} truncate`}
                              >
                                {task.title}
                              </span>
                              {task.priority === "high" && (
                                <Badge variant="destructive" className="text-xs flex-shrink-0">
                                  High
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                        <Link href="/dashboard/tasks" className="block">
                          <Button
                            variant="outline"
                            className="w-full mt-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900"
                          >
                            View All Tasks <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300 text-lg">
                          <Calendar className="h-5 w-5" />
                          Today's Schedule
                        </CardTitle>
                        <CardDescription>Your events and classes</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {upcomingEvents.slice(0, 3).map((event: EventType) => (
                          <div key={event.id} className="p-3 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-medium text-sm flex-1 min-w-0 truncate">{event.title}</span>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {event.time}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 truncate">📍 {event.location}</div>
                          </div>
                        ))}
                        <Link href="/dashboard/timetable" className="block">
                          <Button
                            variant="outline"
                            className="w-full mt-3 bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900"
                          >
                            View Full Schedule <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="tasks" className="mt-0 overflow-x-auto">
                  <Card>
                    <CardHeader>
                      <CardTitle>All Tasks</CardTitle>
                      <CardDescription>Manage your assignments and personal tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {upcomingTasks.map((task: TaskType) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => completeTask(task.id)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
                            />
                            <span
                              className={`${task.completed ? "line-through text-muted-foreground" : "font-medium"} truncate`}
                            >
                              {task.title}
                            </span>
                            {task.priority === "high" && (
                              <Badge variant="destructive" className="flex-shrink-0">
                                High
                              </Badge>
                            )}
                            {task.priority === "medium" && (
                              <Badge variant="secondary" className="flex-shrink-0">
                                Medium
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground ml-2 flex-shrink-0">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                      <Link href="/dashboard/tasks" className="block">
                        <Button variant="outline" className="w-full mt-4">
                          Add New Task <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="schedule" className="mt-0 overflow-x-auto">
                  <Card>
                    <CardHeader>
                      <CardTitle>Weekly Schedule</CardTitle>
                      <CardDescription>Your classes, meetings, and events</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {upcomingEvents.map((event: EventType) => (
                        <div
                          key={event.id}
                          className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <span className="font-medium text-lg">{event.title}</span>
                            <Badge variant="outline" className="self-start sm:self-center">
                              {event.date} at {event.time}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-2">📍 Location: {event.location}</div>
                        </div>
                      ))}
                      <Link href="/dashboard/timetable" className="block">
                        <Button variant="outline" className="w-full mt-4">
                          Manage Schedule <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="habits" className="mt-0 overflow-x-auto">
                  <Card>
                    <CardHeader>
                      <CardTitle>Daily Habits</CardTitle>
                      <CardDescription>Track your daily habits and build streaks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {habits.map((habit: HabitType) => (
                        <div
                          key={habit.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={habit.completed}
                              onChange={() => completeHabit(habit.id)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
                            />
                            <span className={`${habit.completed ? "text-muted-foreground" : "font-medium"} truncate`}>
                              {habit.name}
                            </span>
                          </div>
                          <Badge variant="outline" className="font-medium flex-shrink-0">
                            🔥 {habit.streak} days
                          </Badge>
                        </div>
                      ))}
                      <Link href="/dashboard/habits" className="block">
                        <Button variant="outline" className="w-full mt-4">
                          View All Habits <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            <WeatherWidget />
            <AiSuggestions tasks={upcomingTasks} habits={habits} studySessions={[]} goals={[]} />

            {/* Fun Features Widget */}
            <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950 dark:to-rose-950 border-pink-200 dark:border-pink-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-pink-700 dark:text-pink-300">
                  <Sparkles className="h-5 w-5" />
                  Fun Zone
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={activeExtraWidget === "games" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveExtraWidget("games")}
                    className="flex items-center gap-1 text-xs"
                  >
                    <Brain className="h-3 w-3" />
                    Games
                  </Button>
                  <Button
                    variant={activeExtraWidget === "family" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveExtraWidget("family")}
                    className="flex items-center gap-1 text-xs"
                  >
                    <Users className="h-3 w-3" />
                    Family
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {activeExtraWidget === "games" && <BrainGames />}
                {activeExtraWidget === "family" && <FamilyFeatures />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Medicine Reminders
                </CardTitle>
                <CardDescription>Your upcoming medication schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/medications" className="block">
                  <Button variant="outline" className="w-full">
                    View Medications <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
