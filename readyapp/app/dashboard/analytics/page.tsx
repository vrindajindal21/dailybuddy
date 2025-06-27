"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { format, subDays, startOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns"
import { Clock, CheckSquare, Target, Heart, BookOpen, TrendingUp, TrendingDown } from "lucide-react"

export default function AnalyticsPage() {
  const { toast } = useToast()
  const [timeRange, setTimeRange] = useState("week")
  const [studySessions, setStudySessions] = useState([])
  const [tasks, setTasks] = useState([])
  const [habits, setHabits] = useState([])
  const [goals, setGoals] = useState([])
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // Load data from localStorage
    const savedSessions = localStorage.getItem("studySessions")
    if (savedSessions) {
      setStudySessions(JSON.parse(savedSessions))
    }

    const savedTasks = localStorage.getItem("tasks")
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    }

    const savedHabits = localStorage.getItem("habits")
    if (savedHabits) {
      setHabits(JSON.parse(savedHabits))
    }

    const savedGoals = localStorage.getItem("goals")
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals))
    }
  }, [])

  // Helper functions for analytics
  const getDateRange = () => {
    const today = new Date()

    switch (timeRange) {
      case "week":
        return eachDayOfInterval({
          start: startOfWeek(today),
          end: today,
        })
      case "month":
        return eachDayOfInterval({
          start: subDays(today, 30),
          end: today,
        })
      case "year":
        return Array.from({ length: 12 }, (_, i) => {
          const date = new Date()
          date.setMonth(date.getMonth() - i)
          return date
        }).reverse()
      default:
        return eachDayOfInterval({
          start: startOfWeek(today),
          end: today,
        })
    }
  }

  const formatStudyTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  // Study time analytics
  const getStudyTimeByDay = () => {
    const dateRange = getDateRange()

    return dateRange.map((date) => {
      const sessionsOnDay = studySessions.filter((session) => isSameDay(parseISO(session.date), date))

      const totalMinutes = sessionsOnDay.reduce((total, session) => total + session.duration, 0)

      return {
        date: timeRange === "year" ? format(date, "MMM") : format(date, "EEE"),
        minutes: totalMinutes,
      }
    })
  }

  const getStudyTimeBySubject = () => {
    return Object.entries(
      studySessions.reduce((acc, session) => {
        acc[session.subject] = (acc[session.subject] || 0) + session.duration
        return acc
      }, {}),
    ).map(([subject, minutes]) => ({
      subject: subject.charAt(0).toUpperCase() + subject.slice(1),
      minutes,
    }))
  }

  // Task analytics
  const getTasksCompletedByDay = () => {
    const dateRange = getDateRange()

    // This is a mock implementation since we don't track when tasks are completed
    // In a real app, you would store completion dates
    return dateRange.map((date) => {
      // Randomly generate between 0-5 tasks completed per day for demo purposes
      const completed = Math.floor(Math.random() * 6)

      return {
        date: timeRange === "year" ? format(date, "MMM") : format(date, "EEE"),
        completed,
      }
    })
  }

  const getTasksByCategory = () => {
    return Object.entries(
      tasks.reduce((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1
        return acc
      }, {}),
    ).map(([category, count]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      count,
    }))
  }

  const getTaskCompletionRate = () => {
    if (tasks.length === 0) return 0
    return Math.round((tasks.filter((task) => task.completed).length / tasks.length) * 100)
  }

  // Habit analytics
  const getHabitStreaks = () => {
    return habits
      .map((habit) => ({
        name: habit.name,
        streak: habit.streak,
      }))
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 5)
  }

  const getHabitCompletionByDay = () => {
    const dateRange = getDateRange().slice(-7) // Last 7 days

    // This is a mock implementation since we don't track daily habit completions over time
    // In a real app, you would store completion dates
    return dateRange.map((date) => {
      // Randomly generate between 0-habits.length habits completed per day for demo purposes
      const completed = Math.floor(Math.random() * (habits.length + 1))

      return {
        date: format(date, "EEE"),
        completed,
        total: habits.length,
      }
    })
  }

  // Goal analytics
  const getGoalProgress = () => {
    return goals
      .map((goal) => ({
        title: goal.title,
        progress: goal.progress,
      }))
      .sort((a, b) => b.progress - a.progress)
  }

  const getAverageGoalProgress = () => {
    if (goals.length === 0) return 0
    return Math.round(goals.reduce((total, goal) => total + goal.progress, 0) / goals.length)
  }

  // Overall productivity score (mock implementation)
  const getProductivityScore = () => {
    const taskScore = getTaskCompletionRate() / 100
    const habitScore =
      habits.length > 0 ? habits.reduce((total, habit) => total + habit.streak, 0) / (habits.length * 10) : 0
    const goalScore = getAverageGoalProgress() / 100
    const studyScore =
      studySessions.length > 0
        ? Math.min(studySessions.reduce((total, session) => total + session.duration, 0) / 1000, 1)
        : 0

    // Weight the scores
    const weightedScore = taskScore * 0.3 + habitScore * 0.2 + goalScore * 0.3 + studyScore * 0.2

    // Scale to 0-100
    return Math.round(weightedScore * 100)
  }

  // Productivity trends (mock implementation)
  const getProductivityTrend = () => {
    const currentScore = getProductivityScore()
    // Randomly generate a previous score for demo purposes
    const previousScore = Math.max(0, currentScore + (Math.random() > 0.5 ? -1 : 1) * Math.floor(Math.random() * 15))

    return {
      current: currentScore,
      previous: previousScore,
      change: currentScore - previousScore,
    }
  }

  if (!isMounted) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">Track your productivity and progress over time</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getProductivityScore()}/100</div>
            <div className="flex items-center mt-1">
              {getProductivityTrend().change >= 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <p className="text-xs text-green-500">
                    +{getProductivityTrend().change} pts from last {timeRange}
                  </p>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  <p className="text-xs text-red-500">
                    {getProductivityTrend().change} pts from last {timeRange}
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatStudyTime(studySessions.reduce((total, session) => total + session.duration, 0))}
            </div>
            <p className="text-xs text-muted-foreground">{studySessions.length} study sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTaskCompletionRate()}%</div>
            <p className="text-xs text-muted-foreground">
              {tasks.filter((task) => task.completed).length} of {tasks.length} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goal Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageGoalProgress()}%</div>
            <p className="text-xs text-muted-foreground">Average across {goals.length} goals</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="study" className="space-y-4">
        <TabsList>
          <TabsTrigger value="study">Study Time</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="habits">Habits</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="study" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Study Time by Day</CardTitle>
                <CardDescription>Hours spent studying each day</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {studySessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Clock className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No study data</h3>
                    <p className="text-sm text-muted-foreground">Record study sessions to see analytics</p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col justify-end">
                    <div className="flex items-end justify-between h-[220px]">
                      {getStudyTimeByDay().map((day, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div
                            className="w-8 bg-primary rounded-t-md transition-all duration-500"
                            style={{
                              height: `${Math.min(day.minutes / 5, 220)}px`,
                              opacity: day.minutes > 0 ? 1 : 0.3,
                            }}
                          ></div>
                          <div className="mt-2 text-xs">{day.date}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Study Time by Subject</CardTitle>
                <CardDescription>Distribution of study time across subjects</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {studySessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <BookOpen className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No study data</h3>
                    <p className="text-sm text-muted-foreground">Record study sessions to see analytics</p>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-full max-w-xs">
                      {getStudyTimeBySubject().map((subject, i) => (
                        <div key={i} className="mb-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{subject.subject}</span>
                            <span className="text-sm text-muted-foreground">{formatStudyTime(subject.minutes)}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5">
                            <div
                              className="bg-primary h-2.5 rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min((subject.minutes / (getStudyTimeBySubject()[0]?.minutes || 1)) * 100, 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tasks Completed by Day</CardTitle>
                <CardDescription>Number of tasks completed each day</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <CheckSquare className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No task data</h3>
                    <p className="text-sm text-muted-foreground">Add tasks to see analytics</p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col justify-end">
                    <div className="flex items-end justify-between h-[220px]">
                      {getTasksCompletedByDay().map((day, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div
                            className="w-8 bg-primary rounded-t-md transition-all duration-500"
                            style={{
                              height: `${Math.min(day.completed * 40, 220)}px`,
                              opacity: day.completed > 0 ? 1 : 0.3,
                            }}
                          ></div>
                          <div className="mt-2 text-xs">{day.date}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tasks by Category</CardTitle>
                <CardDescription>Distribution of tasks across categories</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <CheckSquare className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No task data</h3>
                    <p className="text-sm text-muted-foreground">Add tasks to see analytics</p>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-full max-w-xs">
                      {getTasksByCategory().map((category, i) => (
                        <div key={i} className="mb-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{category.category}</span>
                            <span className="text-sm text-muted-foreground">{category.count} tasks</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5">
                            <div
                              className="bg-primary h-2.5 rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min((category.count / (getTasksByCategory()[0]?.count || 1)) * 100, 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="habits" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Habit Streaks</CardTitle>
                <CardDescription>Your longest running habits</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {habits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Heart className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No habit data</h3>
                    <p className="text-sm text-muted-foreground">Add habits to see analytics</p>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-full max-w-xs">
                      {getHabitStreaks().map((habit, i) => (
                        <div key={i} className="mb-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{habit.name}</span>
                            <span className="text-sm text-muted-foreground">{habit.streak} days</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5">
                            <div
                              className="bg-primary h-2.5 rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min((habit.streak / (getHabitStreaks()[0]?.streak || 1)) * 100, 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Habit Completion Rate</CardTitle>
                <CardDescription>Daily habit completion over the last week</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {habits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Heart className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No habit data</h3>
                    <p className="text-sm text-muted-foreground">Add habits to see analytics</p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col justify-end">
                    <div className="flex items-end justify-between h-[220px]">
                      {getHabitCompletionByDay().map((day, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div
                            className="w-8 bg-primary rounded-t-md transition-all duration-500"
                            style={{
                              height: `${Math.min((day.completed / day.total) * 220, 220)}px`,
                              opacity: day.completed > 0 ? 1 : 0.3,
                            }}
                          ></div>
                          <div className="mt-2 text-xs">{day.date}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Goal Progress</CardTitle>
                <CardDescription>Progress towards your goals</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {goals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Target className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No goal data</h3>
                    <p className="text-sm text-muted-foreground">Add goals to see analytics</p>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-full max-w-xs">
                      {getGoalProgress().map((goal, i) => (
                        <div key={i} className="mb-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{goal.title}</span>
                            <span className="text-sm text-muted-foreground">{goal.progress}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5">
                            <div
                              className="bg-primary h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${goal.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Goal Completion Rate</CardTitle>
                <CardDescription>Overall progress towards your goals</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {goals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Target className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No goal data</h3>
                    <p className="text-sm text-muted-foreground">Add goals to see analytics</p>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="relative w-48 h-48">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                          className="text-muted stroke-current"
                          strokeWidth="10"
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                        ></circle>

                        {/* Progress circle */}
                        <circle
                          className="text-primary stroke-current"
                          strokeWidth="10"
                          strokeLinecap="round"
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - getAverageGoalProgress() / 100)}`}
                          transform="rotate(-90 50 50)"
                        ></circle>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-4xl font-bold">{getAverageGoalProgress()}%</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
