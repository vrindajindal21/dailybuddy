"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Play,
  CheckSquare,
  Heart,
  Bell,
  Brain,
  Target,
  Sparkles,
  Clock,
  TrendingUp,
  Settings,
  BookOpen,
  HelpCircle,
  Star,
  Zap,
  Coffee,
  Calendar,
  BarChart3,
  Gamepad2,
  Pill,
  Users,
  Shield,
  Smartphone,
  Trophy,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TutorialSection {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  content: React.ReactNode
  videoUrl?: string
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "secondary"
  }>
}

export default function TutorialPage() {
  const { toast } = useToast()
  const [activeSection, setActiveSection] = useState("getting-started")
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set())
  const [showFirstTimeHelp, setShowFirstTimeHelp] = useState(false)

  useEffect(() => {
    // Check if user is new
    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial")
    if (!hasSeenTutorial) {
      setShowFirstTimeHelp(true)
    }

    // Load completed sections
    const completed = localStorage.getItem("completedTutorialSections")
    if (completed) {
      setCompletedSections(new Set(JSON.parse(completed)))
    }
  }, [])

  const markSectionComplete = (sectionId: string) => {
    const updated = new Set([...completedSections, sectionId])
    setCompletedSections(updated)
    localStorage.setItem("completedTutorialSections", JSON.stringify([...updated]))

    toast({
      title: "Section Completed! ✅",
      description: "Great job! You're making excellent progress.",
    })
  }

  const startFirstTimeTutorial = () => {
    if (typeof window !== "undefined" && (window as any).showTutorial) {
      ;(window as any).showTutorial()
    } else {
      toast({
        title: "Tutorial Starting...",
        description: "The interactive tutorial will begin shortly.",
      })
    }
  }

  const tutorialSections: TutorialSection[] = [
    {
      id: "getting-started",
      title: "🚀 Getting Started",
      description: "Learn the basics of StudyFlow and set up your workspace",
      icon: <Sparkles className="h-6 w-6 text-yellow-500" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold mb-4">Welcome to StudyFlow!</h3>
            <p className="text-lg text-muted-foreground mb-6">
              Your all-in-one productivity companion designed to help you focus, learn, and achieve your goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-8 w-8 text-red-500" />
                <div>
                  <h4 className="font-semibold">Pomodoro Timer</h4>
                  <p className="text-sm text-muted-foreground">Focus in 25-minute sessions</p>
                </div>
              </div>
              <p className="text-sm">Boost your productivity with scientifically-proven time management techniques.</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <CheckSquare className="h-8 w-8 text-green-500" />
                <div>
                  <h4 className="font-semibold">Task Management</h4>
                  <p className="text-sm text-muted-foreground">Organize your work efficiently</p>
                </div>
              </div>
              <p className="text-sm">Create, prioritize, and track your tasks with smart organization tools.</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Heart className="h-8 w-8 text-red-500" />
                <div>
                  <h4 className="font-semibold">Health Tracking</h4>
                  <p className="text-sm text-muted-foreground">Monitor your wellness</p>
                </div>
              </div>
              <p className="text-sm">Track your health metrics like a pro athlete with comprehensive insights.</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Brain className="h-8 w-8 text-purple-500" />
                <div>
                  <h4 className="font-semibold">AI Insights</h4>
                  <p className="text-sm text-muted-foreground">Get personalized recommendations</p>
                </div>
              </div>
              <p className="text-sm">Receive smart suggestions based on your productivity patterns.</p>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-6 rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Quick Start Checklist
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-green-500" />
                <span className="text-sm">Enable notifications for reminders</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-green-500" />
                <span className="text-sm">Set up your first task</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-green-500" />
                <span className="text-sm">Try a 25-minute Pomodoro session</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-green-500" />
                <span className="text-sm">Customize your settings</span>
              </div>
            </div>
          </div>
        </div>
      ),
      actions: [
        {
          label: "Start Interactive Tutorial",
          onClick: startFirstTimeTutorial,
          variant: "default",
        },
        {
          label: "Go to Dashboard",
          onClick: () => (window.location.href = "/dashboard"),
          variant: "outline",
        },
      ],
    },
    {
      id: "pomodoro-mastery",
      title: "🍅 Pomodoro Mastery",
      description: "Master the art of focused work sessions",
      icon: <Clock className="h-6 w-6 text-red-500" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-4">⏰</div>
            <h3 className="text-xl font-bold mb-4">The Pomodoro Technique</h3>
            <p className="text-muted-foreground mb-6">
              Work in focused 25-minute sessions followed by 5-minute breaks to maximize productivity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <Target className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Focus</h4>
              <p className="text-sm text-muted-foreground">25 minutes of deep work</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <Coffee className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Short Break</h4>
              <p className="text-sm text-muted-foreground">5 minutes to recharge</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Repeat</h4>
              <p className="text-sm text-muted-foreground">Continue the cycle</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <Zap className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Long Break</h4>
              <p className="text-sm text-muted-foreground">15-30 minutes after 4 cycles</p>
            </div>
          </div>

          <Card className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Pro Tips for Success
            </h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <div>
                  <p className="font-medium">Choose One Task</p>
                  <p className="text-sm text-muted-foreground">
                    Focus on a single task during each Pomodoro session for maximum effectiveness.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-green-600 dark:text-green-400">2</span>
                </div>
                <div>
                  <p className="font-medium">Eliminate Distractions</p>
                  <p className="text-sm text-muted-foreground">
                    Turn off notifications, close unnecessary tabs, and create a focused environment.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400">3</span>
                </div>
                <div>
                  <p className="font-medium">Take Real Breaks</p>
                  <p className="text-sm text-muted-foreground">
                    Step away from your work completely during breaks to recharge effectively.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">4</span>
                </div>
                <div>
                  <p className="font-medium">Track Your Progress</p>
                  <p className="text-sm text-muted-foreground">
                    Monitor your completed sessions to understand your productivity patterns.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ),
      actions: [
        {
          label: "Start Pomodoro Timer",
          onClick: () => (window.location.href = "/dashboard/pomodoro"),
          variant: "default",
        },
        {
          label: "View Analytics",
          onClick: () => (window.location.href = "/dashboard/analytics"),
          variant: "outline",
        },
      ],
    },
    {
      id: "task-management",
      title: "📋 Task Management",
      description: "Organize and prioritize your work effectively",
      icon: <CheckSquare className="h-6 w-6 text-green-500" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-bold mb-4">Smart Task Organization</h3>
            <p className="text-muted-foreground mb-6">
              Create, organize, and track your tasks with intelligent prioritization and categorization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h4 className="font-semibold text-red-700 dark:text-red-300">High Priority</h4>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400">
                Urgent and important tasks that need immediate attention.
              </p>
            </Card>

            <Card className="p-4 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <h4 className="font-semibold text-yellow-700 dark:text-yellow-300">Medium Priority</h4>
              </div>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Important tasks that can be scheduled for later completion.
              </p>
            </Card>

            <Card className="p-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h4 className="font-semibold text-green-700 dark:text-green-300">Low Priority</h4>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">
                Nice-to-have tasks that can be done when time permits.
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Smart Features
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Smart Reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Automatic notifications based on due dates and priorities.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Due Date Tracking</p>
                    <p className="text-sm text-muted-foreground">Visual indicators for upcoming deadlines.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <BarChart3 className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Progress Analytics</p>
                    <p className="text-sm text-muted-foreground">Track completion rates and productivity trends.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Goal Integration</p>
                    <p className="text-sm text-muted-foreground">Link tasks to your larger goals and objectives.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 p-6 rounded-lg">
            <h4 className="font-semibold mb-3">🎯 Task Management Best Practices</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckSquare className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Break large tasks into smaller, manageable subtasks</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckSquare className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Set realistic deadlines and buffer time for unexpected delays</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckSquare className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Review and update your task list regularly</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckSquare className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Use categories to organize tasks by project or context</span>
              </li>
            </ul>
          </div>
        </div>
      ),
      actions: [
        {
          label: "Create Your First Task",
          onClick: () => (window.location.href = "/dashboard/tasks"),
          variant: "default",
        },
        {
          label: "Set Up Goals",
          onClick: () => (window.location.href = "/dashboard/goals"),
          variant: "outline",
        },
      ],
    },
    {
      id: "health-wellness",
      title: "💪 Health & Wellness",
      description: "Track your physical and mental well-being",
      icon: <Heart className="h-6 w-6 text-red-500" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🏃‍♂️</div>
            <h3 className="text-xl font-bold mb-4">Comprehensive Health Tracking</h3>
            <p className="text-muted-foreground mb-6">
              Monitor your health metrics like a professional athlete with real-time insights and recommendations.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h4 className="font-semibold text-sm">Heart Rate</h4>
              <p className="text-xs text-muted-foreground">Real-time monitoring</p>
            </Card>
            <Card className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h4 className="font-semibold text-sm">Recovery</h4>
              <p className="text-xs text-muted-foreground">HRV-based scoring</p>
            </Card>
            <Card className="p-4 text-center">
              <Zap className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <h4 className="font-semibold text-sm">Strain</h4>
              <p className="text-xs text-muted-foreground">Activity intensity</p>
            </Card>
            <Card className="p-4 text-center">
              <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h4 className="font-semibold text-sm">Sleep</h4>
              <p className="text-xs text-muted-foreground">Stage analysis</p>
            </Card>
          </div>

          <Card className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              Health Metrics Dashboard
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium mb-3">Daily Tracking</h5>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Steps</span>
                    <span className="text-sm font-medium">8,247 / 10,000</span>
                  </div>
                  <Progress value={82} className="h-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Water Intake</span>
                    <span className="text-sm font-medium">6 / 8 glasses</span>
                  </div>
                  <Progress value={75} className="h-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Minutes</span>
                    <span className="text-sm font-medium">45 / 60 min</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </div>
              <div>
                <h5 className="font-medium mb-3">Recovery Insights</h5>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">Good Recovery</span>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Your body is well-recovered. Great day for intense training.
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Sleep Quality</span>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      7h 32m sleep with 85% efficiency. Consider earlier bedtime.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 p-6 rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Health & Safety Features
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium mb-2">Medication Reminders</h5>
                <p className="text-sm text-muted-foreground mb-3">
                  Never miss your medications with smart, persistent reminders.
                </p>
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Multiple daily reminders</span>
                </div>
              </div>
              <div>
                <h5 className="font-medium mb-2">Posture Alerts</h5>
                <p className="text-sm text-muted-foreground mb-3">
                  Regular reminders to maintain good posture and take breaks.
                </p>
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Smart break notifications</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      actions: [
        {
          label: "Start Health Tracking",
          onClick: () => (window.location.href = "/dashboard/health"),
          variant: "default",
        },
        {
          label: "Set Up Medications",
          onClick: () => (window.location.href = "/dashboard/medications"),
          variant: "outline",
        },
      ],
    },
    {
      id: "notifications-reminders",
      title: "🔔 Smart Notifications",
      description: "Never miss important tasks with intelligent reminders",
      icon: <Bell className="h-6 w-6 text-blue-500" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-4">⏰</div>
            <h3 className="text-xl font-bold mb-4">Intelligent Notification System</h3>
            <p className="text-muted-foreground mb-6">
              Stay on top of your tasks, health, and goals with smart, context-aware notifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <Pill className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h4 className="font-semibold">Medication Reminders</h4>
                  <p className="text-sm text-muted-foreground">Never miss your medications</p>
                </div>
              </div>
              <p className="text-sm">
                Persistent, impossible-to-miss reminders for your daily medications with snooze options.
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <Target className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h4 className="font-semibold">Habit Tracking</h4>
                  <p className="text-sm text-muted-foreground">Build consistent routines</p>
                </div>
              </div>
              <p className="text-sm">Smart reminders to help you maintain streaks and build lasting habits.</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <CheckSquare className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-semibold">Task Deadlines</h4>
                  <p className="text-sm text-muted-foreground">Stay ahead of due dates</p>
                </div>
              </div>
              <p className="text-sm">Proactive notifications for upcoming deadlines and overdue tasks.</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <Heart className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h4 className="font-semibold">Health Alerts</h4>
                  <p className="text-sm text-muted-foreground">Wellness check-ins</p>
                </div>
              </div>
              <p className="text-sm">Gentle reminders for hydration, posture breaks, and movement.</p>
            </Card>
          </div>

          <Card className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-500" />
              Cross-Platform Notifications
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bell className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <h5 className="font-medium">Browser Notifications</h5>
                  <p className="text-sm text-muted-foreground">
                    Native browser notifications that work even when the app is in the background.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Zap className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <h5 className="font-medium">Smart Popups</h5>
                  <p className="text-sm text-muted-foreground">
                    Contextual in-app popups with quick actions for immediate response.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <h5 className="font-medium">Adaptive Timing</h5>
                  <p className="text-sm text-muted-foreground">
                    Notifications adapt to your schedule and productivity patterns.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-6 rounded-lg">
            <h4 className="font-semibold mb-3">🎯 Notification Best Practices</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium mb-2">✅ Do's</h5>
                <ul className="space-y-1 text-sm">
                  <li>• Enable browser notifications for important reminders</li>
                  <li>• Set realistic reminder times that fit your schedule</li>
                  <li>• Use snooze options when you need a few more minutes</li>
                  <li>• Customize notification sounds for different types</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-2">❌ Don'ts</h5>
                <ul className="space-y-1 text-sm">
                  <li>• Don't ignore medication reminders</li>
                  <li>• Don't set too many overlapping notifications</li>
                  <li>• Don't disable all notifications - you'll miss important alerts</li>
                  <li>• Don't forget to update reminder times when your schedule changes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ),
      actions: [
        {
          label: "Set Up Reminders",
          onClick: () => (window.location.href = "/dashboard/reminders"),
          variant: "default",
        },
        {
          label: "Configure Notifications",
          onClick: () => (window.location.href = "/dashboard/settings"),
          variant: "outline",
        },
      ],
    },
    {
      id: "ai-insights",
      title: "🤖 AI-Powered Insights",
      description: "Get personalized recommendations and smart analytics",
      icon: <Brain className="h-6 w-6 text-purple-500" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-bold mb-4">Your Personal AI Assistant</h3>
            <p className="text-muted-foreground mb-6">
              Get intelligent insights, personalized recommendations, and predictive analytics to optimize your
              productivity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="h-8 w-8 text-purple-500" />
                <div>
                  <h4 className="font-semibold">Performance Analysis</h4>
                  <p className="text-sm text-muted-foreground">Understand your productivity patterns</p>
                </div>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                "You're most productive between 9-11 AM. Schedule important tasks during this time."
              </p>
            </Card>

            <Card className="p-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <div className="flex items-center gap-3 mb-3">
                <Target className="h-8 w-8 text-blue-500" />
                <div>
                  <h4 className="font-semibold">Goal Optimization</h4>
                  <p className="text-sm text-muted-foreground">Smart recommendations for success</p>
                </div>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                "Based on your progress, consider breaking down large tasks into smaller chunks."
              </p>
            </Card>

            <Card className="p-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <div className="flex items-center gap-3 mb-3">
                <Heart className="h-8 w-8 text-green-500" />
                <div>
                  <h4 className="font-semibold">Health Insights</h4>
                  <p className="text-sm text-muted-foreground">Wellness recommendations</p>
                </div>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                "Your recovery score is low. Consider going to bed 30 minutes earlier tonight."
              </p>
            </Card>

            <Card className="p-4 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-8 w-8 text-orange-500" />
                <div>
                  <h4 className="font-semibold">Time Management</h4>
                  <p className="text-sm text-muted-foreground">Optimize your schedule</p>
                </div>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                "You have 2 hours of free time tomorrow. Perfect for working on your long-term project."
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              AI Analytics Dashboard
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">87%</div>
                <div className="text-sm text-muted-foreground">Productivity Score</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">↑ 12% from last week</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">23</div>
                <div className="text-sm text-muted-foreground">Tasks Completed</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">↑ 5 more than average</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">4.2h</div>
                <div className="text-sm text-muted-foreground">Focus Time</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">↑ 30min improvement</div>
              </div>
            </div>
          </Card>

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 p-6 rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              AI-Powered Features
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium mb-2">🎯 Smart Scheduling</h5>
                <p className="text-sm text-muted-foreground mb-3">
                  AI analyzes your energy levels and suggests optimal times for different types of work.
                </p>
              </div>
              <div>
                <h5 className="font-medium mb-2">📊 Predictive Analytics</h5>
                <p className="text-sm text-muted-foreground mb-3">
                  Forecast your productivity and identify potential bottlenecks before they happen.
                </p>
              </div>
              <div>
                <h5 className="font-medium mb-2">🎨 Personalized Insights</h5>
                <p className="text-sm text-muted-foreground mb-3">
                  Tailored recommendations based on your unique work patterns and preferences.
                </p>
              </div>
              <div>
                <h5 className="font-medium mb-2">🔄 Continuous Learning</h5>
                <p className="text-sm text-muted-foreground mb-3">
                  The AI gets smarter over time, providing increasingly accurate suggestions.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      actions: [
        {
          label: "View Analytics",
          onClick: () => (window.location.href = "/dashboard/analytics"),
          variant: "default",
        },
        {
          label: "Explore AI Tools",
          onClick: () => (window.location.href = "/dashboard"),
          variant: "outline",
        },
      ],
    },
    {
      id: "fun-games",
      title: "🎮 Fun & Games",
      description: "Take breaks with brain training games and entertainment",
      icon: <Gamepad2 className="h-6 w-6 text-pink-500" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-4">Brain Training & Fun Zone</h3>
            <p className="text-muted-foreground mb-6">
              Take productive breaks with brain training games, memory challenges, and fun activities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 border-pink-200 bg-pink-50 dark:border-pink-800 dark:bg-pink-950">
              <div className="flex items-center gap-3 mb-3">
                <Brain className="h-8 w-8 text-pink-500" />
                <div>
                  <h4 className="font-semibold">Memory Games</h4>
                  <p className="text-sm text-muted-foreground">Enhance your cognitive abilities</p>
                </div>
              </div>
              <p className="text-sm">
                Challenge your memory with card matching, sequence recall, and pattern recognition games.
              </p>
            </Card>

            <Card className="p-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="h-8 w-8 text-blue-500" />
                <div>
                  <h4 className="font-semibold">Reflex Training</h4>
                  <p className="text-sm text-muted-foreground">Improve reaction time</p>
                </div>
              </div>
              <p className="text-sm">Test and improve your reflexes with lightning-fast reaction time challenges.</p>
            </Card>

            <Card className="p-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <div className="flex items-center gap-3 mb-3">
                <Target className="h-8 w-8 text-green-500" />
                <div>
                  <h4 className="font-semibold">Logic Puzzles</h4>
                  <p className="text-sm text-muted-foreground">Sharpen problem-solving skills</p>
                </div>
              </div>
              <p className="text-sm">Solve number puzzles, pattern games, and logical reasoning challenges.</p>
            </Card>

            <Card className="p-4 border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950">
              <div className="flex items-center gap-3 mb-3">
                <Star className="h-8 w-8 text-purple-500" />
                <div>
                  <h4 className="font-semibold">Achievement System</h4>
                  <p className="text-sm text-muted-foreground">Track your progress</p>
                </div>
              </div>
              <p className="text-sm">Earn points, unlock achievements, and compete with your personal best scores.</p>
            </Card>
          </div>

          <Card className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Available Games
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                    🎲
                  </div>
                  <div>
                    <h5 className="font-medium">Dice Master</h5>
                    <p className="text-xs text-muted-foreground">Roll to match target numbers</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    🔍
                  </div>
                  <div>
                    <h5 className="font-medium">Number Detective</h5>
                    <p className="text-xs text-muted-foreground">Guess the secret number</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    🌈
                  </div>
                  <div>
                    <h5 className="font-medium">Color Memory</h5>
                    <p className="text-xs text-muted-foreground">Remember color sequences</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                    ⚡
                  </div>
                  <div>
                    <h5 className="font-medium">Lightning Reflexes</h5>
                    <p className="text-xs text-muted-foreground">Test your reaction time</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 p-6 rounded-lg">
            <h4 className="font-semibold mb-3">🧠 Benefits of Brain Training</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium mb-2">🎯 Cognitive Benefits</h5>
                <ul className="space-y-1 text-sm">
                  <li>• Improved working memory and attention span</li>
                  <li>• Enhanced problem-solving abilities</li>
                  <li>• Better pattern recognition skills</li>
                  <li>• Increased mental flexibility</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-2">😌 Wellness Benefits</h5>
                <ul className="space-y-1 text-sm">
                  <li>• Stress relief during work breaks</li>
                  <li>• Mental stimulation and engagement</li>
                  <li>• Improved mood and motivation</li>
                  <li>• Better work-life balance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ),
      actions: [
        {
          label: "Play Brain Games",
          onClick: () => (window.location.href = "/dashboard/fun"),
          variant: "default",
        },
        {
          label: "View High Scores",
          onClick: () => (window.location.href = "/dashboard/fun"),
          variant: "outline",
        },
      ],
    },
    {
      id: "advanced-features",
      title: "⚡ Advanced Features",
      description: "Explore powerful tools for productivity optimization",
      icon: <Zap className="h-6 w-6 text-yellow-500" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold mb-4">Power User Features</h3>
            <p className="text-muted-foreground mb-6">
              Unlock the full potential of StudyFlow with advanced productivity tools and integrations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <h4 className="font-semibold">Family Features</h4>
                  <p className="text-sm text-muted-foreground">Collaborate with family members</p>
                </div>
              </div>
              <p className="text-sm">
                Share tasks, coordinate schedules, and track family goals together with built-in collaboration tools.
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="h-8 w-8 text-green-500" />
                <div>
                  <h4 className="font-semibold">Smart Timetables</h4>
                  <p className="text-sm text-muted-foreground">Automated scheduling</p>
                </div>
              </div>
              <p className="text-sm">
                AI-powered timetable generation that optimizes your schedule based on priorities and energy levels.
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <BarChart3 className="h-8 w-8 text-purple-500" />
                <div>
                  <h4 className="font-semibold">Budget Tracking</h4>
                  <p className="text-sm text-muted-foreground">Financial wellness</p>
                </div>
              </div>
              <p className="text-sm">
                Track expenses, set budgets, and monitor your financial health alongside your productivity goals.
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="h-8 w-8 text-orange-500" />
                <div>
                  <h4 className="font-semibold">Study Tools</h4>
                  <p className="text-sm text-muted-foreground">Enhanced learning</p>
                </div>
              </div>
              <p className="text-sm">
                Flashcards, note-taking, progress tracking, and spaced repetition for effective learning.
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              Customization Options
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h5 className="font-medium mb-2">🎨 Themes & Appearance</h5>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Light, dark, and system themes</li>
                  <li>• Custom color schemes</li>
                  <li>• Font size adjustments</li>
                  <li>• Layout preferences</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-2">🔔 Notification Settings</h5>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Custom notification sounds</li>
                  <li>• Timing preferences</li>
                  <li>• Priority-based filtering</li>
                  <li>• Cross-device synchronization</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-2">⚙️ Advanced Settings</h5>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Data export/import</li>
                  <li>• Privacy controls</li>
                  <li>• Performance optimization</li>
                  <li>• Integration settings</li>
                </ul>
              </div>
            </div>
          </Card>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 p-6 rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Pro Tips for Power Users
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium mb-2">🎯 Productivity Hacks</h5>
                <ul className="space-y-1 text-sm">
                  <li>• Use keyboard shortcuts for quick navigation</li>
                  <li>• Set up custom notification schedules</li>
                  <li>• Create task templates for recurring work</li>
                  <li>• Use voice input for hands-free task creation</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-2">📊 Data Insights</h5>
                <ul className="space-y-1 text-sm">
                  <li>• Review weekly analytics for patterns</li>
                  <li>• Export data for external analysis</li>
                  <li>• Set up automated reports</li>
                  <li>• Use AI suggestions for optimization</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ),
      actions: [
        {
          label: "Explore All Features",
          onClick: () => (window.location.href = "/dashboard"),
          variant: "default",
        },
        {
          label: "Advanced Settings",
          onClick: () => (window.location.href = "/dashboard/settings"),
          variant: "outline",
        },
      ],
    },
  ]

  const currentSection = tutorialSections.find((section) => section.id === activeSection)
  const completionPercentage = (completedSections.size / tutorialSections.length) * 100

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tutorial & Help Center</h2>
          <p className="text-muted-foreground">Learn how to make the most of StudyFlow</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-medium">Progress: {Math.round(completionPercentage)}%</div>
            <Progress value={completionPercentage} className="w-32 h-2" />
          </div>
          {showFirstTimeHelp && (
            <Button onClick={startFirstTimeTutorial} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Start Interactive Tutorial
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          {tutorialSections.map((section) => (
            <TabsTrigger key={section.id} value={section.id} className="text-xs">
              <div className="flex items-center gap-1">
                {section.icon}
                <span className="hidden sm:inline">{section.title.split(" ")[1] || section.title}</span>
                {completedSections.has(section.id) && <CheckSquare className="h-3 w-3 text-green-500" />}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {tutorialSections.map((section) => (
          <TabsContent key={section.id} value={section.id} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">{section.icon}</div>
                    <div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                      <CardDescription className="text-base">{section.description}</CardDescription>
                    </div>
                  </div>
                  {completedSections.has(section.id) ? (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      <CheckSquare className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markSectionComplete(section.id)}
                      className="flex items-center gap-2"
                    >
                      <CheckSquare className="h-4 w-4" />
                      Mark Complete
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {section.content}

                {section.actions && section.actions.length > 0 && (
                  <div className="flex gap-3 mt-6 pt-6 border-t">
                    {section.actions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.variant || "default"}
                        onClick={action.onClick}
                        className="flex items-center gap-2"
                      >
                        <Play className="h-4 w-4" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {showFirstTimeHelp && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">New to StudyFlow?</h3>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  Take our interactive tutorial to get started quickly and learn all the essential features.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowFirstTimeHelp(false)}>
                Maybe Later
              </Button>
              <Button onClick={startFirstTimeTutorial} className="bg-blue-600 hover:bg-blue-700">
                Start Tutorial
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
