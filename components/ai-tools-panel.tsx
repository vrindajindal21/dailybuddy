"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import {
  Brain,
  Sparkles,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  Zap,
  BarChart3,
  Wand2,
  RefreshCw,
  Send,
  Mic,
  Copy,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"

export function AIToolsPanel({ userData = {} }) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("suggestions")
  const [loading, setLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState("")
  const [userInput, setUserInput] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [insights, setInsights] = useState([])
  const [goals, setGoals] = useState([])

  // AI-powered suggestions based on user data
  useEffect(() => {
    generateSmartSuggestions()
    generateInsights()
    generateGoalRecommendations()
  }, [userData])

  const generateSmartSuggestions = async () => {
    setLoading(true)

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 1200))

    const currentHour = new Date().getHours()
    const currentDay = new Date().getDay()
    const isWeekend = currentDay === 0 || currentDay === 6

    const smartSuggestions = []

    // Time-based AI suggestions
    if (currentHour >= 6 && currentHour < 9) {
      smartSuggestions.push({
        id: 1,
        type: "productivity",
        title: "Morning Productivity Boost",
        description:
          "Based on your patterns, you're most productive in the morning. Consider tackling your most challenging tasks now.",
        action: "Schedule high-priority tasks",
        confidence: 92,
        icon: <Zap className="h-5 w-5 text-yellow-500" />,
      })
    } else if (currentHour >= 14 && currentHour < 17) {
      smartSuggestions.push({
        id: 2,
        type: "focus",
        title: "Afternoon Focus Session",
        description: "Your attention typically dips now. Try a 25-minute Pomodoro session with a specific goal.",
        action: "Start Pomodoro timer",
        confidence: 87,
        icon: <Target className="h-5 w-5 text-blue-500" />,
      })
    }

    // Habit-based suggestions
    if (userData.habits?.length > 0) {
      const lowStreakHabits = userData.habits.filter((h) => h.streak < 3)
      if (lowStreakHabits.length > 0) {
        smartSuggestions.push({
          id: 3,
          type: "habit",
          title: "Habit Recovery Strategy",
          description: `AI detected ${lowStreakHabits.length} habits with low streaks. Try the "2-minute rule" - commit to just 2 minutes.`,
          action: "Apply 2-minute rule",
          confidence: 89,
          icon: <TrendingUp className="h-5 w-5 text-green-500" />,
        })
      }
    }

    // Study pattern suggestions
    if (userData.studySessions?.length > 0) {
      const avgSessionLength =
        userData.studySessions.reduce((acc, s) => acc + s.duration, 0) / userData.studySessions.length
      if (avgSessionLength > 90) {
        smartSuggestions.push({
          id: 4,
          type: "study",
          title: "Optimize Study Sessions",
          description:
            "Your sessions average 90+ minutes. Research shows 45-50 minute sessions with breaks are more effective.",
          action: "Adjust session length",
          confidence: 94,
          icon: <Brain className="h-5 w-5 text-purple-500" />,
        })
      }
    }

    // Weekend vs weekday suggestions
    if (isWeekend) {
      smartSuggestions.push({
        id: 5,
        type: "planning",
        title: "Weekend Planning Session",
        description:
          "Perfect time for weekly review and next week's planning. AI suggests 20 minutes for optimal preparation.",
        action: "Start weekly review",
        confidence: 85,
        icon: <Calendar className="h-5 w-5 text-indigo-500" />,
      })
    }

    // Personalized suggestions based on goals
    if (userData.goals?.length > 0) {
      const stagnantGoals = userData.goals.filter((g) => g.progress < 25)
      if (stagnantGoals.length > 0) {
        smartSuggestions.push({
          id: 6,
          type: "goal",
          title: "Goal Acceleration Strategy",
          description:
            "AI identified goals with slow progress. Break them into smaller, specific milestones for better momentum.",
          action: "Break down goals",
          confidence: 91,
          icon: <Target className="h-5 w-5 text-red-500" />,
        })
      }
    }

    setSuggestions(smartSuggestions)
    setLoading(false)
  }

  const generateInsights = async () => {
    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 800))

    const aiInsights = [
      {
        id: 1,
        title: "Peak Performance Window",
        description: "Your productivity peaks between 9-11 AM with 87% task completion rate.",
        metric: "87%",
        trend: "up",
        category: "productivity",
      },
      {
        id: 2,
        title: "Habit Consistency Score",
        description: "Your habit consistency improved by 23% this month. Keep the momentum!",
        metric: "+23%",
        trend: "up",
        category: "habits",
      },
      {
        id: 3,
        title: "Focus Duration Trend",
        description: "Average focus session increased from 32 to 41 minutes over 2 weeks.",
        metric: "41 min",
        trend: "up",
        category: "focus",
      },
      {
        id: 4,
        title: "Goal Progress Velocity",
        description: "Current pace suggests you'll complete 3 out of 5 goals by target date.",
        metric: "3/5",
        trend: "neutral",
        category: "goals",
      },
    ]

    setInsights(aiInsights)
  }

  const generateGoalRecommendations = async () => {
    // AI-generated goal suggestions
    const goalRecommendations = [
      {
        id: 1,
        title: "Establish Morning Routine",
        description: "Create a consistent 30-minute morning routine to boost daily productivity",
        difficulty: "Easy",
        timeframe: "2 weeks",
        impact: "High",
      },
      {
        id: 2,
        title: "Deep Work Sessions",
        description: "Schedule 2-hour deep work blocks 3x per week for complex projects",
        difficulty: "Medium",
        timeframe: "1 month",
        impact: "Very High",
      },
      {
        id: 3,
        title: "Digital Wellness",
        description: "Implement phone-free study sessions to improve focus quality",
        difficulty: "Medium",
        timeframe: "3 weeks",
        impact: "High",
      },
    ]

    setGoals(goalRecommendations)
  }

  const handleAIChat = async () => {
    if (!userInput.trim()) return

    setLoading(true)

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Generate contextual AI response
    const responses = [
      `Based on your productivity patterns, I recommend focusing on your high-energy tasks during your peak hours (9-11 AM). Your completion rate is 87% higher during this window.`,
      `I notice you've been consistent with 4 out of 6 habits this week. For the remaining habits, try the "habit stacking" technique - attach them to existing strong habits.`,
      `Your study sessions show great improvement! The 41-minute average is in the optimal range. Consider adding a 5-minute review at the end of each session to boost retention by ~15%.`,
      `Looking at your goal progress, you're on track for 3 out of 5 goals. For the lagging goals, try breaking them into weekly milestones - this increases completion probability by 42%.`,
    ]

    const randomResponse = responses[Math.floor(Math.random() * responses.length)]
    setAiResponse(randomResponse)
    setUserInput("")
    setLoading(false)

    toast({
      title: "AI Analysis Complete",
      description: "Generated personalized insights based on your data",
    })
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "AI response copied successfully",
    })
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "Hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getImpactColor = (impact) => {
    switch (impact) {
      case "Very High":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "High":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "Medium":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          AI Tools
          <Badge variant="secondary" className="ml-2">
            <Sparkles className="h-3 w-3 mr-1" />
            Smart
          </Badge>
        </CardTitle>
        <CardDescription>AI-powered insights and recommendations for optimal productivity</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="chat">AI Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Smart Suggestions</h3>
              <Button variant="outline" size="sm" onClick={generateSmartSuggestions} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="p-4">
                    <div className="flex items-start gap-3">
                      {suggestion.icon}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{suggestion.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {suggestion.confidence}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                        <Button size="sm" variant="outline">
                          <Wand2 className="h-3 w-3 mr-1" />
                          {suggestion.action}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <h3 className="font-medium">Performance Insights</h3>
            <div className="grid gap-4">
              {insights.map((insight) => (
                <Card key={insight.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">{insight.metric}</span>
                      {insight.trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                      {insight.trend === "down" && <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />}
                      {insight.trend === "neutral" && <BarChart3 className="h-4 w-4 text-yellow-500" />}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {insight.category}
                  </Badge>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-4">
            <h3 className="font-medium">AI Goal Recommendations</h3>
            <div className="space-y-3">
              {goals.map((goal) => (
                <Card key={goal.id} className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-1">{goal.title}</h4>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getDifficultyColor(goal.difficulty)}>{goal.difficulty}</Badge>
                      <Badge className={getImpactColor(goal.impact)}>{goal.impact} Impact</Badge>
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {goal.timeframe}
                      </Badge>
                    </div>
                    <Button size="sm" className="w-full">
                      <Target className="h-3 w-3 mr-1" />
                      Add to Goals
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <h3 className="font-medium">AI Assistant</h3>

            {aiResponse && (
              <Card className="p-4 bg-muted/50">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm">{aiResponse}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(aiResponse)}>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button size="sm" variant="outline">
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <div className="space-y-3">
              <Textarea
                placeholder="Ask AI about your productivity patterns, habits, or goals..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button onClick={handleAIChat} disabled={loading || !userInput.trim()} className="flex-1">
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Ask AI
                </Button>
                <Button variant="outline" size="icon">
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              💡 Try asking: "How can I improve my morning routine?" or "What's my best study time?"
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
