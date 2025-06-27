"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { format, subDays, eachDayOfInterval, isSameDay } from "date-fns"
import { Plus, Trash2, Edit, Heart, Award, Flame } from "lucide-react"

type HabitType = {
  id: number;
  name: string;
  category: string;
  streak: number;
  completedDates: string[];
};

export default function HabitsPage() {
  const { toast } = useToast()
  const [habits, setHabits] = useState<HabitType[]>([
    { id: 1, name: "Read 30 minutes", category: "learning", streak: 5, completedDates: [] },
    { id: 2, name: "Exercise", category: "health", streak: 3, completedDates: [] },
    { id: 3, name: "Drink water", category: "health", streak: 7, completedDates: [] },
    { id: 4, name: "Practice coding", category: "learning", streak: 2, completedDates: [] },
    { id: 5, name: "Meditate", category: "mindfulness", streak: 0, completedDates: [] },
  ])

  const [newHabit, setNewHabit] = useState({
    name: "",
    category: "health",
  })

  const [editingHabit, setEditingHabit] = useState<HabitType | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const [isMounted, setIsMounted] = useState(false)

  // Generate last 7 days for tracking
  const today = new Date()
  const last7Days = eachDayOfInterval({
    start: subDays(today, 6),
    end: today,
  }).reverse()

  useEffect(() => {
    setIsMounted(true)

    // Load habits from localStorage
    const savedHabits = localStorage.getItem("habits")
    if (savedHabits) {
      setHabits(JSON.parse(savedHabits))
    }

    // Initialize completed dates for today
    const todayStr = format(new Date(), "yyyy-MM-dd")
    setHabits((prevHabits) =>
      prevHabits.map((habit) => {
        if (!habit.completedDates) {
          habit.completedDates = []
        }
        return habit
      }),
    )
  }, [])

  // Save habits to localStorage when they change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("habits", JSON.stringify(habits))
    }
  }, [habits, isMounted])

  const addHabit = () => {
    if (!newHabit.name.trim()) {
      toast({
        title: "Error",
        description: "Habit name is required",
        variant: "destructive",
      })
      return
    }

    const habit = {
      id: Date.now(),
      name: newHabit.name,
      category: newHabit.category,
      streak: 0,
      completedDates: [],
    }

    setHabits([...habits, habit])
    setNewHabit({
      name: "",
      category: "health",
    })
    setIsAddDialogOpen(false)

    toast({
      title: "Habit added",
      description: "Your new habit has been added.",
    })
  }

  const updateHabit = () => {
    if (!editingHabit?.name.trim()) {
      toast({
        title: "Error",
        description: "Habit name is required",
        variant: "destructive",
      })
      return
    }

    setHabits(
      habits.map((habit: HabitType) =>
        habit.id === editingHabit.id
          ? {
              ...habit,
              name: editingHabit.name,
              category: editingHabit.category,
            }
          : habit,
      ),
    )

    setIsEditDialogOpen(false)

    toast({
      title: "Habit updated",
      description: "Your habit has been updated successfully.",
    })
  }

  const deleteHabit = (id: number) => {
    setHabits(habits.filter((habit: HabitType) => habit.id !== id))

    toast({
      title: "Habit deleted",
      description: "Your habit has been deleted.",
    })
  }

  const startEditHabit = (habit: HabitType) => {
    setEditingHabit({
      ...habit,
    })
    setIsEditDialogOpen(true)
  }

  const toggleHabitCompletion = (habitId: number, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")

    setHabits((prevHabits) =>
      prevHabits.map((habit: HabitType) => {
        if (habit.id === habitId) {
          const completedDates = habit.completedDates || []
          const isCompleted = completedDates.includes(dateStr)

          let newCompletedDates
          let newStreak = habit.streak

          if (isCompleted) {
            // Remove date if already completed
            newCompletedDates = completedDates.filter((d: string) => d !== dateStr)
            if (dateStr === format(today, "yyyy-MM-dd")) {
              newStreak = Math.max(0, newStreak - 1)
            }
          } else {
            // Add date if not completed
            newCompletedDates = [...completedDates, dateStr]
            if (dateStr === format(today, "yyyy-MM-dd")) {
              newStreak = newStreak + 1
            }
          }

          return {
            ...habit,
            completedDates: newCompletedDates,
            streak: newStreak,
          }
        }
        return habit
      }),
    )
  }

  const isHabitCompletedOnDate = (habit: HabitType, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return habit.completedDates && habit.completedDates.includes(dateStr)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "health":
        return <Heart className="h-4 w-4 text-red-500" />
      case "learning":
        return <Award className="h-4 w-4 text-blue-500" />
      case "mindfulness":
        return <Flame className="h-4 w-4 text-orange-500" />
      default:
        return <Heart className="h-4 w-4 text-gray-500" />
    }
  }

  if (!isMounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-x-hidden">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-6 sm:space-y-8 max-w-full w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Habits</h2>
            <p className="text-muted-foreground">Track your daily habits and build streaks</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Habit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Habit</DialogTitle>
                <DialogDescription>Create a new habit to track daily</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Habit Name</Label>
                  <Input
                    id="name"
                    placeholder="What habit do you want to track?"
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newHabit.category}
                    onValueChange={(value) => setNewHabit({ ...newHabit, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="learning">Learning</SelectItem>
                      <SelectItem value="mindfulness">Mindfulness</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addHabit}>Add Habit</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Habit</DialogTitle>
                <DialogDescription>Update your habit details</DialogDescription>
              </DialogHeader>
              {editingHabit && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Habit Name</Label>
                    <Input
                      id="edit-name"
                      placeholder="Habit name"
                      value={editingHabit.name}
                      onChange={(e) => setEditingHabit({ ...editingHabit, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select
                      value={editingHabit.category}
                      onValueChange={(value) => setEditingHabit({ ...editingHabit, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="health">Health</SelectItem>
                        <SelectItem value="learning">Learning</SelectItem>
                        <SelectItem value="mindfulness">Mindfulness</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={updateHabit}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daily Habit Tracker</CardTitle>
            <CardDescription>Track your habits for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto w-full">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2 min-w-[200px]">Habit</th>
                    {last7Days.map((day, i) => (
                      <th key={i} className="text-center p-2 min-w-[60px]">
                        <div className="text-xs font-normal text-muted-foreground">{format(day, "EEE")}</div>
                        <div className={`text-sm ${isSameDay(day, today) ? "font-bold" : ""}`}>{format(day, "d")}</div>
                      </th>
                    ))}
                    <th className="text-center p-2 min-w-[80px]">Streak</th>
                    <th className="text-center p-2 min-w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {habits.map((habit: HabitType) => (
                    <tr key={habit.id} className="border-t">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(habit.category)}
                          <span>{habit.name}</span>
                        </div>
                      </td>
                      {last7Days.map((day, i) => (
                        <td key={i} className="text-center p-2">
                          <button
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              isHabitCompletedOnDate(habit, day)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                            onClick={() => toggleHabitCompletion(habit.id, day)}
                          >
                            {isHabitCompletedOnDate(habit, day) ? "✓" : ""}
                          </button>
                        </td>
                      ))}
                      <td className="text-center p-2">
                        <div className="flex items-center justify-center gap-1">
                          <Flame
                            className={`h-4 w-4 ${habit.streak > 0 ? "text-orange-500" : "text-muted-foreground"}`}
                          />
                          <span className="font-medium">{habit.streak}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => startEditHabit(habit)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteHabit(habit.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {habits.map((habit: HabitType) => (
            <Card key={habit.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{habit.name}</CardTitle>
                  {getCategoryIcon(habit.category)}
                </div>
                <CardDescription>{habit.category.charAt(0).toUpperCase() + habit.category.slice(1)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Flame className={`h-5 w-5 ${habit.streak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
                  <span className="text-2xl font-bold">{habit.streak}</span>
                  <span className="text-muted-foreground">day streak</span>
                </div>
                <div className="mt-4 flex gap-1">
                  {last7Days.slice(-5).map((day, i) => (
                    <div key={i} className="flex-1">
                      <div
                        className={`h-2 rounded-full ${isHabitCompletedOnDate(habit, day) ? "bg-primary" : "bg-muted"}`}
                      ></div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  variant={isHabitCompletedOnDate(habit, today) ? "outline" : "default"}
                  className="w-full"
                  onClick={() => toggleHabitCompletion(habit.id, today)}
                >
                  {isHabitCompletedOnDate(habit, today) ? "Completed Today" : "Mark Complete"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
