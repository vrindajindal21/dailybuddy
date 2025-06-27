"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ChevronLeft,
  ChevronRight,
  X,
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
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"

interface TutorialStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  content: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

export function FirstTimeTutorial() {
  const { t } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    // Check if user has seen tutorial before
    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial")
    const isFirstVisit = !localStorage.getItem("userPreferences")

    // Always show tutorial if it hasn't been seen, regardless of other conditions
    if (!hasSeenTutorial) {
      // Show tutorial after a short delay
      setTimeout(() => {
        setIsVisible(true)
      }, 1000)
    }
  }, [])

  const tutorialSteps: TutorialStep[] = [
    {
      id: "welcome",
      title: `🎉 Welcome to DailyBuddy!`,
      description: "Your all-in-one productivity companion for students and professionals",
      icon: <Sparkles className="h-8 w-8 text-yellow-500" />,
      content: (
        <div className="text-center space-y-4">
          <div className="text-4xl sm:text-6xl mb-4">🚀</div>
          <p className="text-base sm:text-lg px-2">
            DailyBuddy helps you stay focused, track your health, manage tasks, and achieve your goals with AI-powered
            insights.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-6">
            <div className="p-2 sm:p-3 bg-blue-50 rounded-lg">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 mx-auto mb-2" />
              <p className="text-xs sm:text-sm font-medium">Pomodoro Timer</p>
            </div>
            <div className="p-2 sm:p-3 bg-green-50 rounded-lg">
              <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mx-auto mb-2" />
              <p className="text-xs sm:text-sm font-medium">Task Management</p>
            </div>
            <div className="p-2 sm:p-3 bg-red-50 rounded-lg">
              <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 mx-auto mb-2" />
              <p className="text-xs sm:text-sm font-medium">Health Tracking</p>
            </div>
            <div className="p-2 sm:p-3 bg-purple-50 rounded-lg">
              <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 mx-auto mb-2" />
              <p className="text-xs sm:text-sm font-medium">AI Insights</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "pomodoro",
      title: "🍅 Master the Pomodoro Technique",
      description: "Boost your focus with scientifically-proven time management",
      icon: <Clock className="h-8 w-8 text-red-500" />,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl mb-4">⏰</div>
            <p className="text-base sm:text-lg mb-4 px-2">
              Work in focused 25-minute sessions followed by 5-minute breaks.
            </p>
          </div>
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <h4 className="font-semibold mb-2 text-sm sm:text-base">How it works:</h4>
            <ol className="list-decimal list-inside space-y-1 text-xs sm:text-sm">
              <li>Choose a task to work on</li>
              <li>Set timer for 25 minutes</li>
              <li>Work with full focus until timer rings</li>
              <li>Take a 5-minute break</li>
              <li>After 4 sessions, take a longer 15-30 minute break</li>
            </ol>
          </div>
          <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center mb-1">
                <Target className="h-4 w-4 sm:h-6 sm:w-6 text-red-500" />
              </div>
              <span>Focus</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mb-1">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-green-500" />
              </div>
              <span>Break</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mb-1">
                <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500" />
              </div>
              <span>Repeat</span>
            </div>
          </div>
        </div>
      ),
      action: {
        label: "Try Pomodoro Timer",
        onClick: () => (window.location.href = "/dashboard/pomodoro"),
      },
    },
    {
      id: "tasks",
      title: "📋 Organize Your Tasks",
      description: "Keep track of everything you need to do with smart task management",
      icon: <CheckSquare className="h-8 w-8 text-green-500" />,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-4">✅</div>
            <p className="text-lg mb-4">
              Create, organize, and track your tasks with priorities, due dates, and categories.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="font-medium">High Priority</span>
              <span className="text-sm text-gray-600">- Urgent and important tasks</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="font-medium">Medium Priority</span>
              <span className="text-sm text-gray-600">- Important but not urgent</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium">Low Priority</span>
              <span className="text-sm text-gray-600">- Nice to have tasks</span>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">✨ Smart Features:</h4>
            <ul className="text-sm space-y-1">
              <li>• Voice input for quick task creation</li>
              <li>• Automatic due date reminders</li>
              <li>• Category-based organization</li>
              <li>• Progress tracking and analytics</li>
            </ul>
          </div>
        </div>
      ),
      action: {
        label: "Manage Tasks",
        onClick: () => (window.location.href = "/dashboard/tasks"),
      },
    },
    {
      id: "health",
      title: "💪 Track Your Wellness",
      description: "Monitor your health like a pro athlete with Whoop-style tracking",
      icon: <Heart className="h-8 w-8 text-red-500" />,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-4">🏃‍♂️</div>
            <p className="text-lg mb-4">
              Get comprehensive health insights including recovery, strain, and sleep analysis.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-500">85%</div>
              <div className="text-sm">Recovery Score</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-500">12.4</div>
              <div className="text-sm">Strain Score</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-500">7h 32m</div>
              <div className="text-sm">Sleep Duration</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-500">8,247</div>
              <div className="text-sm">Steps Today</div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📱 Real-time Monitoring:</h4>
            <ul className="text-sm space-y-1">
              <li>• Heart rate and HRV tracking</li>
              <li>• Sleep stage analysis</li>
              <li>• Activity and step counting</li>
              <li>• Recovery recommendations</li>
            </ul>
          </div>
        </div>
      ),
      action: {
        label: "Start Health Tracking",
        onClick: () => (window.location.href = "/dashboard/health"),
      },
    },
    {
      id: "reminders",
      title: "🔔 Smart Reminders",
      description: "Never miss important tasks with intelligent notifications",
      icon: <Bell className="h-8 w-8 text-blue-500" />,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-4">⏰</div>
            <p className="text-lg mb-4">Set up smart reminders for medications, habits, study sessions, and more.</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">💊</div>
              <div>
                <div className="font-medium">Medication Reminders</div>
                <div className="text-sm text-gray-600">Never miss your daily medications</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">🎯</div>
              <div>
                <div className="font-medium">Habit Tracking</div>
                <div className="text-sm text-gray-600">Build consistent daily habits</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">📚</div>
              <div>
                <div className="font-medium">Study Sessions</div>
                <div className="text-sm text-gray-600">Scheduled learning reminders</div>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🔥 Advanced Features:</h4>
            <ul className="text-sm space-y-1">
              <li>• Multiple notification times per day</li>
              <li>• Custom sound and vibration patterns</li>
              <li>• Snooze and reschedule options</li>
              <li>• Voice input for quick setup</li>
            </ul>
          </div>
        </div>
      ),
      action: {
        label: "Set Up Reminders",
        onClick: () => (window.location.href = "/dashboard/reminders"),
      },
    },
    {
      id: "ai-assistant",
      title: "🤖 AI-Powered Insights",
      description: "Get personalized recommendations and smart suggestions",
      icon: <Brain className="h-8 w-8 text-purple-500" />,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-4">🧠</div>
            <p className="text-lg mb-4">
              Your personal AI assistant analyzes your patterns and provides actionable insights.
            </p>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Performance Analysis</span>
              </div>
              <p className="text-sm text-gray-600">
                "You're most productive between 9-11 AM. Schedule important tasks during this time."
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Goal Recommendations</span>
              </div>
              <p className="text-sm text-gray-600">
                "Based on your progress, consider breaking down large tasks into smaller chunks."
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-green-500" />
                <span className="font-medium">Health Insights</span>
              </div>
              <p className="text-sm text-gray-600">
                "Your recovery score is low. Consider going to bed 30 minutes earlier tonight."
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">✨ AI Features:</h4>
            <ul className="text-sm space-y-1">
              <li>• Productivity pattern analysis</li>
              <li>• Personalized goal suggestions</li>
              <li>• Health and wellness recommendations</li>
              <li>• Smart scheduling optimization</li>
            </ul>
          </div>
        </div>
      ),
      action: {
        label: "Explore AI Tools",
        onClick: () => (window.location.href = "/dashboard/analytics"),
      },
    },
    {
      id: "getting-started",
      title: "🚀 You're All Set!",
      description: "Start your productivity journey with these quick actions",
      icon: <Target className="h-8 w-8 text-green-500" />,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl mb-4">🎯</div>
            <p className="text-base sm:text-lg mb-4 px-2">
              You're ready to boost your productivity! Here's what you can do next:
            </p>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <Button
              className="w-full justify-start h-auto p-3 sm:p-4 text-left"
              variant="outline"
              onClick={() => (window.location.href = "/dashboard/tasks")}
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-medium text-sm sm:text-base">Create Your First Task</div>
                  <div className="text-xs sm:text-sm text-gray-600 break-words">
                    Add something you want to accomplish today
                  </div>
                </div>
              </div>
            </Button>
            <Button
              className="w-full justify-start h-auto p-3 sm:p-4 text-left"
              variant="outline"
              onClick={() => (window.location.href = "/dashboard/pomodoro")}
            >
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-medium text-sm sm:text-base">Start a Focus Session</div>
                  <div className="text-xs sm:text-sm text-gray-600 break-words">Try a 25-minute Pomodoro session</div>
                </div>
              </div>
            </Button>
            <Button
              className="w-full justify-start h-auto p-3 sm:p-4 text-left"
              variant="outline"
              onClick={() => (window.location.href = "/dashboard/health")}
            >
              <div className="flex items-center gap-3">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-medium text-sm sm:text-base">Enable Health Tracking</div>
                  <div className="text-xs sm:text-sm text-gray-600 break-words">Start monitoring your wellness</div>
                </div>
              </div>
            </Button>
            <Button
              className="w-full justify-start h-auto p-3 sm:p-4 text-left"
              variant="outline"
              onClick={() => (window.location.href = "/dashboard/settings")}
            >
              <div className="flex items-center gap-3">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-medium text-sm sm:text-base">Customize Settings</div>
                  <div className="text-xs sm:text-sm text-gray-600 break-words">Personalize your experience</div>
                </div>
              </div>
            </Button>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 sm:p-4 rounded-lg text-center">
            <p className="text-sm font-medium mb-2">🎉 Welcome to DailyBuddy!</p>
            <p className="text-xs text-gray-600">You can always access this tutorial again from the Settings page.</p>
          </div>
        </div>
      ),
    },
  ]

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTutorial()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const skipTutorial = () => {
    completeTutorial()
  }

  const completeTutorial = () => {
    setIsCompleted(true)
    localStorage.setItem("hasSeenTutorial", "true")
    localStorage.setItem("tutorialCompletedAt", new Date().toISOString())

    setTimeout(() => {
      setIsVisible(false)
    }, 1000)
  }

  const restartTutorial = () => {
    setCurrentStep(0)
    setIsCompleted(false)
    setIsVisible(true)
  }

  // Public method to show tutorial (can be called from settings)
  useEffect(() => {
    ;(window as any).showTutorial = restartTutorial
  }, [])

  if (!isVisible) {
    return null
  }

  const currentTutorialStep = tutorialSteps[currentStep]
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-4xl mx-auto shadow-2xl border-2 animate-in slide-in-from-bottom-4 duration-300 max-h-[95vh] overflow-y-auto">
        <CardHeader className="pb-4 px-4 sm:px-6">
          <div className="flex items-start justify-between mb-4 gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">{currentTutorialStep.icon}</div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg sm:text-xl font-bold leading-tight break-words">
                  {currentTutorialStep.title}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base mt-1 break-words">
                  {currentTutorialStep.description}
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={skipTutorial} className="h-8 w-8 p-0 flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Step {currentStep + 1} of {tutorialSteps.length}
              </span>
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {Math.round(progress)}% Complete
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="pb-6 px-4 sm:px-6">
          <div className="mb-6">
            <div className="space-y-4">{currentTutorialStep.content}</div>
          </div>

          {currentTutorialStep.action && (
            <div className="mb-6">
              <Button
                onClick={currentTutorialStep.action.onClick}
                className="w-full text-sm sm:text-base py-2 sm:py-3"
                variant="outline"
              >
                <Play className="h-4 w-4 mr-2" />
                {currentTutorialStep.action.label}
              </Button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center justify-center gap-2 order-2 sm:order-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Back</span>
            </Button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 order-1 sm:order-2">
              <Button variant="ghost" onClick={skipTutorial} className="text-muted-foreground text-sm sm:text-base">
                Skip Tutorial
              </Button>

              <Button onClick={nextStep} className="flex items-center justify-center gap-2">
                {currentStep === tutorialSteps.length - 1 ? (
                  <>
                    <span className="hidden sm:inline">Get Started</span>
                    <span className="sm:hidden">Start</span>
                    <Target className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {isCompleted && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg text-center animate-in fade-in duration-500">
              <div className="text-2xl mb-2">🎉</div>
              <p className="font-medium text-green-800 text-sm sm:text-base">Tutorial Complete!</p>
              <p className="text-xs sm:text-sm text-green-600">You're ready to boost your productivity!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default FirstTimeTutorial
