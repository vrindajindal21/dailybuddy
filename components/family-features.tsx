"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Users, Heart, Star, Gift, Calendar, MessageCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FamilyGoal {
  id: string
  title: string
  description: string
  assignedTo: string
  dueDate: string
  completed: boolean
  points: number
}

interface Appreciation {
  id: string
  from: string
  to: string
  message: string
  date: string
  type: "thank-you" | "achievement" | "encouragement"
}

export default function FamilyFeatures() {
  const [activeTab, setActiveTab] = useState<"goals" | "appreciation" | "rewards">("goals")
  const [familyGoals, setFamilyGoals] = useState<FamilyGoal[]>([
    {
      id: "1",
      title: "Read 30 minutes daily",
      description: "Develop a reading habit for better learning",
      assignedTo: "Everyone",
      dueDate: "2024-02-01",
      completed: false,
      points: 10,
    },
    {
      id: "2",
      title: "Exercise together",
      description: "Family workout or walk for 20 minutes",
      assignedTo: "Family",
      dueDate: "2024-01-25",
      completed: true,
      points: 15,
    },
  ])

  const [appreciations, setAppreciations] = useState<Appreciation[]>([
    {
      id: "1",
      from: "Mom",
      to: "Sarah",
      message: "Great job completing your homework early today!",
      date: "2024-01-20",
      type: "achievement",
    },
    {
      id: "2",
      from: "Dad",
      to: "Everyone",
      message: "Thank you all for helping with the house cleaning!",
      date: "2024-01-19",
      type: "thank-you",
    },
  ])

  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: "",
    points: 10,
  })

  const [newAppreciation, setNewAppreciation] = useState({
    from: "",
    to: "",
    message: "",
    type: "thank-you" as const,
  })

  const { toast } = useToast()

  const addFamilyGoal = () => {
    if (!newGoal.title || !newGoal.assignedTo) {
      toast({
        title: "Missing information",
        description: "Please fill in the title and assign to someone",
        variant: "destructive",
      })
      return
    }

    const goal: FamilyGoal = {
      id: Date.now().toString(),
      ...newGoal,
      completed: false,
    }

    setFamilyGoals((prev) => [...prev, goal])
    setNewGoal({
      title: "",
      description: "",
      assignedTo: "",
      dueDate: "",
      points: 10,
    })

    toast({
      title: "Family goal added! 🎯",
      description: `${goal.title} has been assigned to ${goal.assignedTo}`,
    })
  }

  const toggleGoalCompletion = (goalId: string) => {
    setFamilyGoals((prev) =>
      prev.map((goal) => {
        if (goal.id === goalId) {
          const updated = { ...goal, completed: !goal.completed }
          if (updated.completed) {
            toast({
              title: "Goal completed! 🎉",
              description: `Great job! You earned ${goal.points} points!`,
            })
          }
          return updated
        }
        return goal
      }),
    )
  }

  const addAppreciation = () => {
    if (!newAppreciation.from || !newAppreciation.to || !newAppreciation.message) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const appreciation: Appreciation = {
      id: Date.now().toString(),
      ...newAppreciation,
      date: new Date().toISOString().split("T")[0],
    }

    setAppreciations((prev) => [appreciation, ...prev])
    setNewAppreciation({
      from: "",
      to: "",
      message: "",
      type: "thank-you",
    })

    toast({
      title: "Appreciation sent! ❤️",
      description: `Your kind words have been shared with ${appreciation.to}`,
    })
  }

  const getTotalPoints = () => {
    return familyGoals.filter((goal) => goal.completed).reduce((sum, goal) => sum + goal.points, 0)
  }

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case "thank-you":
        return "🙏"
      case "achievement":
        return "🏆"
      case "encouragement":
        return "💪"
      default:
        return "❤️"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-green-600" />
          Family Hub
          <Badge variant="secondary" className="ml-auto">
            {getTotalPoints()} points earned
          </Badge>
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant={activeTab === "goals" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("goals")}
          >
            Goals
          </Button>
          <Button
            variant={activeTab === "appreciation" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("appreciation")}
          >
            Appreciation
          </Button>
          <Button
            variant={activeTab === "rewards" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("rewards")}
          >
            Rewards
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeTab === "goals" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  placeholder="Goal title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal((prev) => ({ ...prev, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Assigned to"
                    value={newGoal.assignedTo}
                    onChange={(e) => setNewGoal((prev) => ({ ...prev, assignedTo: e.target.value }))}
                  />
                  <Input
                    type="date"
                    value={newGoal.dueDate}
                    onChange={(e) => setNewGoal((prev) => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Points"
                    value={newGoal.points}
                    onChange={(e) => setNewGoal((prev) => ({ ...prev, points: Number.parseInt(e.target.value) || 10 }))}
                    min="1"
                    max="100"
                    className="w-24"
                  />
                  <Button onClick={addFamilyGoal} className="flex-1">
                    Add Goal
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Family Goals</h3>
              {familyGoals.map((goal) => (
                <div
                  key={goal.id}
                  className={`p-3 rounded-lg border ${
                    goal.completed
                      ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                      : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium ${goal.completed ? "line-through text-gray-500" : ""}`}>
                          {goal.title}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {goal.points} pts
                        </Badge>
                      </div>
                      {goal.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{goal.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>👤 {goal.assignedTo}</span>
                        {goal.dueDate && <span>📅 {goal.dueDate}</span>}
                      </div>
                    </div>
                    <Button
                      variant={goal.completed ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => toggleGoalCompletion(goal.id)}
                    >
                      {goal.completed ? "✓ Done" : "Mark Done"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "appreciation" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="From"
                    value={newAppreciation.from}
                    onChange={(e) => setNewAppreciation((prev) => ({ ...prev, from: e.target.value }))}
                  />
                  <Input
                    placeholder="To"
                    value={newAppreciation.to}
                    onChange={(e) => setNewAppreciation((prev) => ({ ...prev, to: e.target.value }))}
                  />
                </div>
                <Textarea
                  placeholder="Your appreciation message..."
                  value={newAppreciation.message}
                  onChange={(e) => setNewAppreciation((prev) => ({ ...prev, message: e.target.value }))}
                  rows={3}
                />
                <div className="flex gap-2">
                  <select
                    value={newAppreciation.type}
                    onChange={(e) => setNewAppreciation((prev) => ({ ...prev, type: e.target.value as any }))}
                    className="px-3 py-2 border rounded-md flex-1"
                  >
                    <option value="thank-you">Thank You</option>
                    <option value="achievement">Achievement</option>
                    <option value="encouragement">Encouragement</option>
                  </select>
                  <Button onClick={addAppreciation}>
                    <Heart className="h-4 w-4 mr-1" />
                    Send
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Recent Appreciations</h3>
              {appreciations.map((appreciation) => (
                <div
                  key={appreciation.id}
                  className="p-3 rounded-lg bg-pink-50 border border-pink-200 dark:bg-pink-950 dark:border-pink-800"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{getTypeEmoji(appreciation.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{appreciation.from}</span>
                        <span>→</span>
                        <span className="font-medium">{appreciation.to}</span>
                        <span className="ml-auto">{appreciation.date}</span>
                      </div>
                      <p className="mt-1 text-gray-800 dark:text-gray-200">{appreciation.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "rewards" && (
          <div className="space-y-4">
            <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 rounded-lg border-2 border-yellow-200 dark:border-yellow-800">
              <Gift className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
              <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-200">Family Rewards System</h3>
              <p className="text-yellow-700 dark:text-yellow-300 mt-2">
                You've earned {getTotalPoints()} points together!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <h4 className="font-semibold">Movie Night</h4>
                  <Badge variant="outline">50 points</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose a family movie and enjoy popcorn together
                </p>
                <Button variant="outline" size="sm" className="mt-2" disabled={getTotalPoints() < 50}>
                  {getTotalPoints() >= 50 ? "Claim Reward" : "Need more points"}
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <h4 className="font-semibold">Family Outing</h4>
                  <Badge variant="outline">100 points</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Plan a special family trip or activity</p>
                <Button variant="outline" size="sm" className="mt-2" disabled={getTotalPoints() < 100}>
                  {getTotalPoints() >= 100 ? "Claim Reward" : "Need more points"}
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-5 w-5 text-green-500" />
                  <h4 className="font-semibold">Special Treat</h4>
                  <Badge variant="outline">25 points</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ice cream, favorite meal, or small gift</p>
                <Button variant="outline" size="sm" className="mt-2" disabled={getTotalPoints() < 25}>
                  {getTotalPoints() >= 25 ? "Claim Reward" : "Need more points"}
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-5 w-5 text-purple-500" />
                  <h4 className="font-semibold">Extra Screen Time</h4>
                  <Badge variant="outline">15 points</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  30 minutes of extra screen time for entertainment
                </p>
                <Button variant="outline" size="sm" className="mt-2" disabled={getTotalPoints() < 15}>
                  {getTotalPoints() >= 15 ? "Claim Reward" : "Need more points"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
