"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Lightbulb, RefreshCw, ThumbsUp, ThumbsDown, Sparkles } from "lucide-react"
import React from "react"

// Define prop types
export type TaskType = {
  id: number;
  title: string;
  dueDate: string;
  completed: boolean;
  priority: string;
};

export type HabitType = {
  id: number;
  name: string;
  completed: boolean;
  streak: number;
};

export type StudySessionType = {
  id: number;
  date: string;
  duration: number;
  subject: string;
};

export type GoalType = {
  id: number;
  title: string;
  progress: number;
};

export type SuggestionType = {
  id: string | number;
  type: string;
  text: string;
  actionText: string;
  actionLink: string;
};

interface AiSuggestionsProps {
  tasks?: TaskType[];
  habits?: HabitType[];
  studySessions?: StudySessionType[];
  goals?: GoalType[];
}

export function AiSuggestions({ tasks = [], habits = [], studySessions = [], goals = [] }: AiSuggestionsProps) {
  const { toast } = useToast()
  const [suggestions, setSuggestions] = useState<SuggestionType[]>([])
  const [loading, setLoading] = useState(true)

  // Generate dynamic suggestions based on user data
  useEffect(() => {
    const generateSuggestions = async () => {
      setLoading(true)

      try {
        await new Promise((resolve) => setTimeout(resolve, 800))

        const dynamicSuggestions = []
        const currentHour = new Date().getHours()
        const currentDay = new Date().getDay()
        const isWeekend = currentDay === 0 || currentDay === 6

        // Time-based suggestions
        if (currentHour >= 6 && currentHour < 12) {
          dynamicSuggestions.push({
            id: `morning-${Date.now()}`,
            type: "general",
            text: "Good morning! Start your day with a quick review of today's priorities.",
            actionText: "View Tasks",
            actionLink: "/dashboard/tasks",
          })
        } else if (currentHour >= 12 && currentHour < 17) {
          dynamicSuggestions.push({
            id: `afternoon-${Date.now()}`,
            type: "study",
            text: "Afternoon is great for focused work. Consider starting a Pomodoro session.",
            actionText: "Start Pomodoro",
            actionLink: "/dashboard/pomodoro",
          })
        } else if (currentHour >= 17 && currentHour < 22) {
          dynamicSuggestions.push({
            id: `evening-${Date.now()}`,
            type: "habit",
            text: "Evening time! Perfect for reviewing your habits and planning tomorrow.",
            actionText: "Check Habits",
            actionLink: "/dashboard/habits",
          })
        }

        // Task-based dynamic suggestions
        if (tasks.length > 0) {
          const incompleteTasks = tasks.filter((task) => !task.completed)
          const highPriorityTasks = incompleteTasks.filter((task) => task.priority === "high")
          const dueTodayTasks = incompleteTasks.filter((task) => {
            const dueDate = new Date(task.dueDate)
            const today = new Date()
            return dueDate.toDateString() === today.toDateString()
          })

          if (dueTodayTasks.length > 0) {
            dynamicSuggestions.push({
              id: `due-today-${Date.now()}`,
              type: "task",
              text: `You have ${dueTodayTasks.length} task${dueTodayTasks.length > 1 ? "s" : ""} due today. Focus on completing them first!`,
              actionText: "View Due Tasks",
              actionLink: "/dashboard/tasks",
            })
          } else if (highPriorityTasks.length > 0) {
            dynamicSuggestions.push({
              id: `high-priority-${Date.now()}`,
              type: "task",
              text: `${highPriorityTasks.length} high priority task${highPriorityTasks.length > 1 ? "s" : ""} need${highPriorityTasks.length === 1 ? "s" : ""} your attention.`,
              actionText: "View Priority Tasks",
              actionLink: "/dashboard/tasks",
            })
          } else if (incompleteTasks.length > 5) {
            dynamicSuggestions.push({
              id: `many-tasks-${Date.now()}`,
              type: "task",
              text: "You have many pending tasks. Consider breaking them into smaller, manageable chunks.",
              actionText: "Organize Tasks",
              actionLink: "/dashboard/tasks",
            })
          }
        } else {
          dynamicSuggestions.push({
            id: `no-tasks-${Date.now()}`,
            type: "task",
            text: "No tasks yet? Start by adding your daily goals and priorities.",
            actionText: "Add Tasks",
            actionLink: "/dashboard/tasks",
          })
        }

        // Habit-based dynamic suggestions
        if (habits.length > 0) {
          const lowStreakHabits = habits.filter((habit) => habit.streak < 3)
          const goodStreakHabits = habits.filter((habit) => habit.streak >= 7)

          if (lowStreakHabits.length > 0) {
            dynamicSuggestions.push({
              id: `low-streak-${Date.now()}`,
              type: "habit",
              text: `${lowStreakHabits.length} habit${lowStreakHabits.length > 1 ? "s" : ""} need${lowStreakHabits.length === 1 ? "s" : ""} attention. Small consistent actions build strong habits!`,
              actionText: "Build Habits",
              actionLink: "/dashboard/habits",
            })
          } else if (goodStreakHabits.length > 0) {
            dynamicSuggestions.push({
              id: `good-streak-${Date.now()}`,
              type: "habit",
              text: `Great job! You have ${goodStreakHabits.length} habit${goodStreakHabits.length > 1 ? "s" : ""} with strong streaks. Keep it up!`,
              actionText: "View Progress",
              actionLink: "/dashboard/habits",
            })
          }
        }

        // Study session suggestions
        if (studySessions.length > 0) {
          const todaysSessions = studySessions.filter((session) => {
            const sessionDate = new Date(session.date)
            const today = new Date()
            return sessionDate.toDateString() === today.toDateString()
          })

          const totalTodayTime = todaysSessions.reduce((total, session) => total + session.duration, 0)

          if (totalTodayTime < 120) {
            // Less than 2 hours
            dynamicSuggestions.push({
              id: `study-time-${Date.now()}`,
              type: "study",
              text: `You've studied ${Math.round(totalTodayTime / 60)} minutes today. Consider adding another study session!`,
              actionText: "Start Studying",
              actionLink: "/dashboard/study",
            })
          } else if (totalTodayTime > 300) {
            // More than 5 hours
            dynamicSuggestions.push({
              id: `study-break-${Date.now()}`,
              type: "general",
              text: "You've been studying hard today! Remember to take breaks and stay hydrated.",
              actionText: "Take a Break",
              actionLink: "/dashboard/pomodoro",
            })
          }
        }

        // Goal-based suggestions
        if (goals.length > 0) {
          const lowProgressGoals = goals.filter((goal) => goal.progress < 25)
          const nearCompleteGoals = goals.filter((goal) => goal.progress >= 80)

          if (nearCompleteGoals.length > 0) {
            dynamicSuggestions.push({
              id: `near-complete-${Date.now()}`,
              type: "goal",
              text: `You're almost there! ${nearCompleteGoals.length} goal${nearCompleteGoals.length > 1 ? "s are" : " is"} nearly complete.`,
              actionText: "Finish Goals",
              actionLink: "/dashboard/goals",
            })
          } else if (lowProgressGoals.length > 0) {
            dynamicSuggestions.push({
              id: `low-progress-${Date.now()}`,
              type: "goal",
              text: `${lowProgressGoals.length} goal${lowProgressGoals.length > 1 ? "s need" : " needs"} more attention. Break them into smaller milestones.`,
              actionText: "Update Goals",
              actionLink: "/dashboard/goals",
            })
          }
        }

        // Weekend vs weekday suggestions
        if (isWeekend) {
          dynamicSuggestions.push({
            id: `weekend-${Date.now()}`,
            type: "general",
            text: "Weekend time! Perfect for planning next week and reviewing your progress.",
            actionText: "Weekly Review",
            actionLink: "/dashboard/analytics",
          })
        } else {
          dynamicSuggestions.push({
            id: `weekday-${Date.now()}`,
            type: "general",
            text: "Stay focused during the week! Use the Pomodoro technique to maintain productivity.",
            actionText: "Start Pomodoro",
            actionLink: "/dashboard/pomodoro",
          })
        }

        // Motivational suggestions based on data
        if (tasks.length === 0 && habits.length === 0 && goals.length === 0) {
          dynamicSuggestions.push({
            id: `getting-started-${Date.now()}`,
            type: "general",
            text: "Welcome! Start by setting up your first task, habit, or goal to begin your productivity journey.",
            actionText: "Get Started",
            actionLink: "/dashboard/tasks",
          })
        }

        // Limit to 3-4 most relevant suggestions
        const shuffled = [...dynamicSuggestions].sort(() => 0.5 - Math.random())
        setSuggestions(shuffled.slice(0, Math.min(4, shuffled.length)))
        setLoading(false)
      } catch (error) {
        console.error("Error generating suggestions:", error)
        setSuggestions([
          {
            id: 0,
            type: "error",
            text: "Unable to generate suggestions right now. Please try again.",
            actionText: "Retry",
            actionLink: "#",
          },
        ])
        setLoading(false)
      }
    }

    generateSuggestions()
  }, [tasks, habits, studySessions, goals])

  const handleFeedback = (suggestionId: string | number, isPositive: boolean) => {
    toast({
      title: isPositive ? "Thanks for the feedback!" : "We'll improve our suggestions",
      description: isPositive
        ? "We're glad you found this suggestion helpful."
        : "We'll use your feedback to provide better suggestions.",
    })

    setSuggestions(suggestions.filter((s) => s.id !== suggestionId))
  }

  const refreshSuggestions = () => {
    setSuggestions([])
    setLoading(true)

    // Regenerate suggestions
    setTimeout(() => {
      const event = new Event("refresh-suggestions")
      window.dispatchEvent(event)
    }, 100)
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "task":
        return (
          <div className="bg-blue-100 p-2 rounded-full dark:bg-blue-900">
            <Lightbulb className="h-5 w-5 text-blue-500 dark:text-blue-300" />
          </div>
        )
      case "habit":
        return (
          <div className="bg-green-100 p-2 rounded-full dark:bg-green-900">
            <Lightbulb className="h-5 w-5 text-green-500 dark:text-green-300" />
          </div>
        )
      case "study":
        return (
          <div className="bg-purple-100 p-2 rounded-full dark:bg-purple-900">
            <Lightbulb className="h-5 w-5 text-purple-500 dark:text-purple-300" />
          </div>
        )
      case "goal":
        return (
          <div className="bg-yellow-100 p-2 rounded-full dark:bg-yellow-900">
            <Lightbulb className="h-5 w-5 text-yellow-500 dark:text-yellow-300" />
          </div>
        )
      default:
        return (
          <div className="bg-gray-100 p-2 rounded-full dark:bg-gray-800">
            <Lightbulb className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
        )
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <CardTitle>AI Suggestions</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={refreshSuggestions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <CardDescription>Smart recommendations based on your current activity</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-6">
            <RefreshCw className="h-10 w-10 text-muted-foreground animate-spin mb-2" />
            <p className="text-sm text-muted-foreground">Analyzing your data...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-sm text-muted-foreground">No suggestions available right now.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={refreshSuggestions}>
              Refresh
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="flex gap-3 p-3 border rounded-lg">
                {getSuggestionIcon(suggestion.type)}
                <div className="flex-1">
                  <p className="text-sm">{suggestion.text}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                      <a href={suggestion.actionLink}>{suggestion.actionText}</a>
                    </Button>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleFeedback(suggestion.id, true)}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleFeedback(suggestion.id, false)}
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
