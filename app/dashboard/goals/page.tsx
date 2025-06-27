"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { format, differenceInDays, addDays } from "date-fns"
import { CalendarIcon, Plus, Trash2, Edit, Target, Trophy, Flag, BarChart, ArrowUp, ArrowDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { NotificationService } from '@/lib/notification-service'

type Milestone = {
  id: number;
  title: string;
  completed: boolean;
};

type Goal = {
  id: number;
  title: string;
  description: string;
  category: string;
  targetDate: string | Date;
  progress: number;
  milestones: Milestone[];
  priority: string;
  status: string;
};

export default function GoalsPage() {
  const { toast } = useToast()
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: 1,
      title: "Complete Math Course",
      description: "Finish all modules of the advanced calculus course",
      category: "academic",
      targetDate: "2025-05-15",
      progress: 65,
      milestones: [
        { id: 1, title: "Complete Module 1", completed: true },
        { id: 2, title: "Complete Module 2", completed: true },
        { id: 3, title: "Complete Module 3", completed: true },
        { id: 4, title: "Complete Module 4", completed: false },
        { id: 5, title: "Pass Final Exam", completed: false },
      ],
      priority: "high",
      status: "in-progress",
    },
    {
      id: 2,
      title: "Read 20 Books",
      description: "Read 20 books by the end of the year",
      category: "personal",
      targetDate: "2025-12-31",
      progress: 25,
      milestones: [
        { id: 1, title: "Read 5 books", completed: true },
        { id: 2, title: "Read 10 books", completed: false },
        { id: 3, title: "Read 15 books", completed: false },
        { id: 4, title: "Read 20 books", completed: false },
      ],
      priority: "medium",
      status: "in-progress",
    },
    {
      id: 3,
      title: "Learn Spanish",
      description: "Reach intermediate level in Spanish",
      category: "learning",
      targetDate: "2025-08-30",
      progress: 40,
      milestones: [
        { id: 1, title: "Complete beginner course", completed: true },
        { id: 2, title: "Learn 500 words", completed: true },
        { id: 3, title: "Complete intermediate course", completed: false },
        { id: 4, title: "Have a 10-minute conversation", completed: false },
      ],
      priority: "medium",
      status: "in-progress",
    },
    {
      id: 4,
      title: "Run a Half Marathon",
      description: "Train and complete a half marathon",
      category: "health",
      targetDate: "2025-06-15",
      progress: 30,
      milestones: [
        { id: 1, title: "Run 5km without stopping", completed: true },
        { id: 2, title: "Run 10km without stopping", completed: false },
        { id: 3, title: "Run 15km without stopping", completed: false },
        { id: 4, title: "Complete half marathon", completed: false },
      ],
      priority: "high",
      status: "in-progress",
    },
  ])

  const [newGoal, setNewGoal] = useState<Goal>({
    title: "",
    description: "",
    category: "academic",
    targetDate: addDays(new Date(), 30),
    progress: 0,
    milestones: [{ id: Date.now(), title: "", completed: false }],
    priority: "medium",
    status: "not-started",
    id: Date.now(),
  })

  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [filter, setFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const [isMounted, setIsMounted] = useState(false)
  const [addGoalError, setAddGoalError] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)

    // Load goals from localStorage
    const savedGoals = localStorage.getItem("goals")
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals))
    }
  }, [])

  // Save goals to localStorage when they change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("goals", JSON.stringify(goals))
    }
  }, [goals, isMounted])

  useEffect(() => {
    if (!isMounted) return;
    const checkGoalNotifications = async () => {
      const today = new Date();
      for (const goal of goals as any[]) {
        if (goal.status === 'completed') continue;
        const targetDate = new Date(goal.targetDate);
        const daysUntilTarget = differenceInDays(targetDate, today);
        if (daysUntilTarget >= 0 && daysUntilTarget <= 3) {
          if (NotificationService.isSupported() && Notification.permission !== 'granted') {
            await NotificationService.requestPermission();
          }
          NotificationService.showRichNotification({
            title: `Goal Approaching: ${goal.title}`,
            body: `Only ${daysUntilTarget} day${daysUntilTarget !== 1 ? 's' : ''} left to reach your goal!`,
            type: 'goal',
            data: goal,
            requireInteraction: true,
            vibrate: [200, 100, 200],
          });
        }
      }
    };
    checkGoalNotifications();
    const interval = setInterval(checkGoalNotifications, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isMounted, goals]);

  const addGoal = () => {
    let errorMsg = ''
    if (!newGoal.title.trim()) {
      errorMsg += 'Goal title is required. '
    }
    // Filter out empty milestones
    const filteredMilestones = newGoal.milestones.filter((m: any) => m.title.trim() !== "")
    if (filteredMilestones.length === 0) {
      errorMsg += 'At least one milestone is required.'
    }
    if (errorMsg) {
      setAddGoalError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
      return
    }
    setAddGoalError(null)
    const goal = {
      id: Date.now(),
      title: newGoal.title,
      description: newGoal.description,
      category: newGoal.category,
      targetDate: format(newGoal.targetDate, "yyyy-MM-dd"),
      progress: newGoal.progress,
      milestones: filteredMilestones,
      priority: newGoal.priority,
      status: newGoal.status,
    }
    setGoals([...goals, goal])
    setNewGoal({
      title: "",
      description: "",
      category: "academic",
      targetDate: addDays(new Date(), 30),
      progress: 0,
      milestones: [{ id: Date.now(), title: "", completed: false }],
      priority: "medium",
      status: "not-started",
      id: Date.now(),
    })
    setIsAddDialogOpen(false)
    toast({
      title: "Goal added",
      description: "Your new goal has been added successfully.",
    })
  }

  const updateGoal = () => {
    if (!editingGoal) return null;
    const goal = editingGoal as any;
    if (!goal.title.trim()) {
      toast({
        title: "Error",
        description: "Goal title is required",
        variant: "destructive",
      })
      return
    }

    // Filter out empty milestones
    const filteredMilestones = goal.milestones.filter((m: any) => m.title.trim() !== "")

    if (filteredMilestones.length === 0) {
      toast({
        title: "Error",
        description: "At least one milestone is required",
        variant: "destructive",
      })
      return
    }

    // Calculate progress based on completed milestones
    const completedMilestones = filteredMilestones.filter((m: any) => m.completed).length
    const progress = Math.round((completedMilestones / filteredMilestones.length) * 100)

    setGoals(
      goals.map((goal) =>
        goal.id === editingGoal.id
          ? {
              ...goal,
              title: goal.title,
              description: goal.description,
              category: goal.category,
              targetDate:
                typeof goal.targetDate === "object"
                  ? format(goal.targetDate, "yyyy-MM-dd")
                  : goal.targetDate,
              progress: progress,
              milestones: filteredMilestones,
              priority: goal.priority,
              status: progress === 100 ? "completed" : goal.status,
            }
          : goal,
      ),
    )

    setIsEditDialogOpen(false)

    toast({
      title: "Goal updated",
      description: "Your goal has been updated successfully.",
    })
  }

  const deleteGoal = (id: number) => {
    setGoals(goals.filter((goal) => goal.id !== id))

    toast({
      title: "Goal deleted",
      description: "Your goal has been deleted.",
    })
  }

  const startEditGoal = (goal: Goal) => {
    setEditingGoal({
      ...goal,
      targetDate: new Date(goal.targetDate),
    })
    setIsEditDialogOpen(true)
  }

  const addMilestone = () => {
    setNewGoal({
      ...newGoal,
      milestones: [...newGoal.milestones, { id: Date.now(), title: "", completed: false }],
    })
  }

  const removeMilestone = (id: number) => {
    setNewGoal({
      ...newGoal,
      milestones: newGoal.milestones.filter((m) => m.id !== id),
    })
  }

  const updateMilestone = (id: number, title: string) => {
    setNewGoal({
      ...newGoal,
      milestones: newGoal.milestones.map((m) => (m.id === id ? { ...m, title } : m)),
    })
  }

  // Same functions for editing
  const addEditMilestone = () => {
    if (!editingGoal) return
    setEditingGoal({
      ...editingGoal,
      milestones: [...editingGoal.milestones, { id: Date.now(), title: "", completed: false }],
    })
  }

  const removeEditMilestone = (id: number) => {
    if (!editingGoal) return
    setEditingGoal({
      ...editingGoal,
      milestones: editingGoal.milestones.filter((m) => m.id !== id),
    })
  }

  const updateEditMilestone = (id: number, title: string) => {
    if (!editingGoal) return
    setEditingGoal({
      ...editingGoal,
      milestones: editingGoal.milestones.map((m) => (m.id === id ? { ...m, title } : m)),
    })
  }

  const toggleEditMilestone = (id: number) => {
    if (!editingGoal) return
    setEditingGoal({
      ...editingGoal,
      milestones: editingGoal.milestones.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m)),
    })
  }

  const toggleMilestone = (goalId: any, milestoneId: any) => {
    setGoals(
      goals.map((goal: any) => {
        if (goal.id === goalId) {
          const updatedMilestones = goal.milestones.map((m: any) =>
            m.id === milestoneId ? { ...m, completed: !m.completed } : m,
          );
          const completedMilestones = updatedMilestones.filter((m: any) => m.completed).length;
          const progress = Math.round((completedMilestones / updatedMilestones.length) * 100);
          const status = progress === 100 ? "completed" : goal.status;
          return {
            ...goal,
            milestones: updatedMilestones,
            progress,
            status,
          };
        }
        return goal;
      }),
    );
  }

  const getCategoryIcon = (category: any) => {
    switch (category) {
      case "academic":
        return <BookIcon className="h-4 w-4 text-blue-500" />
      case "personal":
        return <UserIcon className="h-4 w-4 text-purple-500" />
      case "health":
        return <HeartIcon className="h-4 w-4 text-red-500" />
      case "career":
        return <BriefcaseIcon className="h-4 w-4 text-green-500" />
      case "learning":
        return <GraduationCapIcon className="h-4 w-4 text-yellow-500" />
      case "financial":
        return <DollarSignIcon className="h-4 w-4 text-emerald-500" />
      default:
        return <Target className="h-4 w-4 text-gray-500" />
    }
  }

  // Custom icons for categories
  const BookIcon = ({ className }: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
  )

  const UserIcon = ({ className }: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  )

  const HeartIcon = ({ className }: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
    </svg>
  )

  const BriefcaseIcon = ({ className }: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
  )

  const GraduationCapIcon = ({ className }: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
      <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
    </svg>
  )

  const DollarSignIcon = ({ className }: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" x2="12" y1="2" y2="22"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  )

  const getPriorityBadge = (priority: any) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-500">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-500">Medium</Badge>
      case "low":
        return <Badge className="bg-green-500">Low</Badge>
      default:
        return <Badge className="bg-gray-500">Medium</Badge>
    }
  }

  const getStatusBadge = (status: any) => {
    switch (status) {
      case "not-started":
        return <Badge variant="outline">Not Started</Badge>
      case "in-progress":
        return <Badge className="bg-blue-500">In Progress</Badge>
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>
      case "on-hold":
        return <Badge className="bg-yellow-500">On Hold</Badge>
      default:
        return <Badge variant="outline">Not Started</Badge>
    }
  }

  const getDaysRemaining = (targetDate: any) => {
    const days = differenceInDays(new Date(targetDate), new Date())
    if (days < 0) return "Overdue"
    if (days === 0) return "Due today"
    return `${days} days remaining`
  }

  const filteredGoals = goals.filter((goal) => {
    // Status filter
    if (filter !== "all" && goal.status !== filter) return false

    // Category filter
    if (categoryFilter !== "all" && goal.category !== categoryFilter) return false

    return true
  })

  if (!isMounted) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Goals</h2>
          <p className="text-muted-foreground">Track your personal and academic goals</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Goal</DialogTitle>
              <DialogDescription>Create a new goal with milestones to track your progress</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Goal Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  placeholder="What do you want to achieve?"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your goal in detail"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newGoal.category}
                    onValueChange={(value) => setNewGoal({ ...newGoal, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="career">Career</SelectItem>
                      <SelectItem value="learning">Learning</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newGoal.priority}
                    onValueChange={(value) => setNewGoal({ ...newGoal, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="targetDate">Target Date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={typeof newGoal.targetDate === 'string' ? newGoal.targetDate : newGoal.targetDate.toISOString().split('T')[0]}
                  onChange={e => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Milestones <span className="text-red-500">*</span></Label>
                  <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
                    <Plus className="h-4 w-4 mr-1" /> Add Milestone
                  </Button>
                </div>

                {newGoal.milestones.map((milestone, index) => (
                  <div key={milestone.id} className="flex items-center gap-2">
                    <Input
                      placeholder={`Milestone ${index + 1}`}
                      value={milestone.title}
                      onChange={(e) => updateMilestone(milestone.id, e.target.value)}
                    />
                    {newGoal.milestones.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeMilestone(milestone.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={newGoal.status} onValueChange={(value) => setNewGoal({ ...newGoal, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-started">Not Started</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addGoal}>Add Goal</Button>
            </DialogFooter>
            {addGoalError && (
              <div className="text-red-500 text-sm mt-2 text-center">{addGoalError}</div>
            )}
            <div className="text-xs text-muted-foreground mt-2 text-center">Fields marked with <span className="text-red-500">*</span> are required.</div>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Goal</DialogTitle>
              <DialogDescription>Update your goal details and progress</DialogDescription>
            </DialogHeader>
            {editingGoal && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Goal Title</Label>
                  <Input
                    id="edit-title"
                    placeholder="What do you want to achieve?"
                    value={editingGoal.title}
                    onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Describe your goal in detail"
                    value={editingGoal.description}
                    onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select
                      value={editingGoal.category}
                      onValueChange={(value) => setEditingGoal({ ...editingGoal, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="health">Health</SelectItem>
                        <SelectItem value="career">Career</SelectItem>
                        <SelectItem value="learning">Learning</SelectItem>
                        <SelectItem value="financial">Financial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-priority">Priority</Label>
                    <Select
                      value={editingGoal.priority}
                      onValueChange={(value) => setEditingGoal({ ...editingGoal, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-targetDate">Target Date</Label>
                  <Input
                    id="edit-targetDate"
                    type="date"
                    value={editingGoal && editingGoal.targetDate ? (typeof editingGoal.targetDate === 'string' ? editingGoal.targetDate : editingGoal.targetDate.toISOString().split('T')[0]) : ''}
                    onChange={e => setEditingGoal({ ...editingGoal, targetDate: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Milestones</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addEditMilestone}>
                      <Plus className="h-4 w-4 mr-1" /> Add Milestone
                    </Button>
                  </div>

                  {editingGoal.milestones.map((milestone, index) => (
                    <div key={milestone.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={milestone.completed}
                        onChange={() => toggleEditMilestone(milestone.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Input
                        placeholder={`Milestone ${index + 1}`}
                        value={milestone.title}
                        onChange={(e) => updateEditMilestone(milestone.id, e.target.value)}
                        className={milestone.completed ? "line-through text-muted-foreground" : ""}
                      />
                      {editingGoal.milestones.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEditMilestone(milestone.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editingGoal.status}
                    onValueChange={(value) => setEditingGoal({ ...editingGoal, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-started">Not Started</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateGoal}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter:</span>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Goals</SelectItem>
            <SelectItem value="not-started">Not Started</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="on-hold">On Hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="academic">Academic</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="health">Health</SelectItem>
            <SelectItem value="career">Career</SelectItem>
            <SelectItem value="learning">Learning</SelectItem>
            <SelectItem value="financial">Financial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.length}</div>
            <p className="text-xs text-muted-foreground">
              {goals.filter((g) => g.status === "completed").length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Flag className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.filter((g) => g.status === "in-progress").length}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(
                goals.filter((g) => g.status === "in-progress").reduce((acc, g) => acc + g.progress, 0) /
                  Math.max(goals.filter((g) => g.status === "in-progress").length, 1),
              )}
              % average progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.filter((g) => g.status === "completed").length}</div>
            <p className="text-xs text-muted-foreground">
              {goals.filter((g) => g.status === "completed").length > 0
                ? `${Math.round((goals.filter((g) => g.status === "completed").length / goals.length) * 100)}% completion rate`
                : "No goals completed yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                goals.filter(
                  (g) => g.status !== "completed" && differenceInDays(new Date(g.targetDate), new Date()) <= 7,
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Due in the next 7 days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Goals</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredGoals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <Target className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No goals found</h3>
                <p className="text-sm text-muted-foreground">
                  {filter !== "all" || categoryFilter !== "all"
                    ? "Try changing your filters or add a new goal"
                    : "Add your first goal to get started"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredGoals.map((goal) => (
                <Card key={goal.id} className={goal.status === "completed" ? "border-green-500" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(goal.category)}
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => startEditGoal(goal)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteGoal(goal.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>{goal.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} />
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Milestones</div>
                        <div className="space-y-1">
                          {goal.milestones.map((milestone) => (
                            <div key={milestone.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={milestone.completed}
                                onChange={() => toggleMilestone(goal.id, milestone.id)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <span
                                className={`text-sm ${milestone.completed ? "line-through text-muted-foreground" : ""}`}
                              >
                                {milestone.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-0">
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(goal.priority)}
                      {getStatusBadge(goal.status)}
                    </div>
                    <div className="text-xs text-muted-foreground">{getDaysRemaining(goal.targetDate)}</div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Goal Progress</CardTitle>
              <CardDescription>Track your progress across all goals</CardDescription>
            </CardHeader>
            <CardContent>
              {goals.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <BarChart className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No goals yet</h3>
                  <p className="text-sm text-muted-foreground">Add your first goal to see progress tracking</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {goals
                    .sort((a, b) => b.progress - a.progress)
                    .map((goal) => (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(goal.category)}
                            <span className="font-medium">{goal.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{goal.progress}%</span>
                            {goal.progress > 0 ? (
                              <ArrowUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <ArrowDown className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>
                        <Progress value={goal.progress} />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {goal.milestones.filter((m) => m.completed).length} of {goal.milestones.length} milestones
                            completed
                          </span>
                          <span>{getDaysRemaining(goal.targetDate)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
