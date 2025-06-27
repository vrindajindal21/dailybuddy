"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Switch } from "@/components/ui/switch"
import { format, parseISO, differenceInDays } from "date-fns"
import { CalendarIcon, CheckSquare, Clock, Plus, Trash2, Edit, Filter, Bell } from "lucide-react"
import { NotificationService } from "@/lib/notification-service"
import * as React from 'react'

type TaskType = {
  id: number;
  title: string;
  description: string;
  dueDate: string | Date;
  completed: boolean;
  priority: string;
  category: string;
  notifyBefore: number;
  notificationEnabled: boolean;
};

export default function TasksPage() {
  const { toast } = useToast()
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Math Assignment",
      description: "Complete problems 1-20 from Chapter 5",
      dueDate: "2025-03-25",
      completed: false,
      priority: "high",
      category: "school",
      notifyBefore: 1, // days before due date
      notificationEnabled: true,
    },
    {
      id: 2,
      title: "Physics Lab Report",
      description: "Write up results from the pendulum experiment",
      dueDate: "2025-03-28",
      completed: false,
      priority: "medium",
      category: "school",
      notifyBefore: 2,
      notificationEnabled: true,
    },
    {
      id: 3,
      title: "Literature Essay",
      description: "1500 word analysis of Hamlet",
      dueDate: "2025-04-02",
      completed: false,
      priority: "medium",
      category: "school",
      notifyBefore: 3,
      notificationEnabled: true,
    },
    {
      id: 4,
      title: "Grocery Shopping",
      description: "Buy ingredients for the week",
      dueDate: "2025-03-24",
      completed: false,
      priority: "low",
      category: "personal",
      notifyBefore: 1,
      notificationEnabled: false,
    },
    {
      id: 5,
      title: "Gym Session",
      description: "30 min cardio + strength training",
      dueDate: "2025-03-23",
      completed: true,
      priority: "medium",
      category: "personal",
      notifyBefore: 0,
      notificationEnabled: false,
    },
  ])

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: new Date(),
    priority: "medium",
    category: "school",
    notifyBefore: 1,
    notificationEnabled: true,
  })

  const [editingTask, setEditingTask] = useState<TaskType | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [filter, setFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [notificationPermission, setNotificationPermission] = useState("default")

  const [isMounted, setIsMounted] = useState(false)
  const [tasksInitialized, setTasksInitialized] = useState(false)

  // Only run once on mount to set isMounted
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load tasks from localStorage only once after component is mounted
  useEffect(() => {
    if (isMounted && !tasksInitialized) {
      const savedTasks = localStorage.getItem("tasks")
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks))
      }
      setTasksInitialized(true)
    }
  }, [isMounted, tasksInitialized])

  // Check notification permission only once after component is mounted
  useEffect(() => {
    if (isMounted && NotificationService.isSupported()) {
      setNotificationPermission(Notification.permission)
    }
  }, [isMounted])

  // Set up notification checking
  useEffect(() => {
    if (!isMounted) return

    // Check for upcoming due dates
    const checkDueDates = async () => {
      const today = new Date()
      for (const task of tasks as any[]) {
        if ((task as any).completed) continue
        if ((task as any).notificationEnabled) {
          const dueDate = new Date((task as any).dueDate)
          const daysUntilDue = differenceInDays(dueDate, today)
          if (daysUntilDue === (task as any).notifyBefore) {
            // Request permission if needed
            if (NotificationService.isSupported() && Notification.permission !== 'granted') {
              await NotificationService.requestPermission()
            }
            NotificationService.showRichNotification({
              title: `Task Due Soon: ${(task as any).title}`,
              body: `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}: ${(task as any).description}`,
              type: 'task',
              data: task,
              requireInteraction: true,
              vibrate: [200, 100, 200],
            })
            toast({
              title: 'Task Due Soon',
              description: `${(task as any).title} is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
            })
          }
        }
      }
    }
    checkDueDates()
    const interval = setInterval(checkDueDates, 24 * 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [isMounted, tasks, toast])

  // Save tasks to localStorage when they change
  useEffect(() => {
    if (isMounted && tasksInitialized) {
      localStorage.setItem("tasks", JSON.stringify(tasks))
    }
  }, [tasks, isMounted, tasksInitialized])

  const addTask = () => {
    let hasErrors = false
    const errorFields = []

    if (!newTask.title.trim()) {
      hasErrors = true
      errorFields.push("title")
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      })
    }

    if (hasErrors) {
      // Highlight the error fields by setting a custom data attribute
      errorFields.forEach((field) => {
        const element = document.getElementById(field)
        if (element) {
          element.setAttribute("data-error", "true")
          element.classList.add("border-red-500", "focus:ring-red-500")

          // Remove error styling after 3 seconds or on input
          element.addEventListener("input", function onInput() {
            element.removeAttribute("data-error")
            element.classList.remove("border-red-500", "focus:ring-red-500")
            element.removeEventListener("input", onInput)
          })

          setTimeout(() => {
            if (element.getAttribute("data-error")) {
              element.removeAttribute("data-error")
              element.classList.remove("border-red-500", "focus:ring-red-500")
            }
          }, 3000)
        }
      })

      return
    }

    const task = {
      id: Date.now(),
      title: newTask.title,
      description: newTask.description,
      dueDate: format(newTask.dueDate, "yyyy-MM-dd"),
      completed: false,
      priority: newTask.priority,
      category: newTask.category,
      notifyBefore: newTask.notifyBefore,
      notificationEnabled: newTask.notificationEnabled,
    }

    setTasks([...tasks, task])
    setNewTask({
      title: "",
      description: "",
      dueDate: new Date(),
      priority: "medium",
      category: "school",
      notifyBefore: 1,
      notificationEnabled: true,
    })
    setIsAddDialogOpen(false)

    toast({
      title: "Task added",
      description: "Your new task has been added successfully.",
    })

    // If notifications are enabled, check if we need to request permission
    if (task.notificationEnabled && notificationPermission !== "granted") {
      requestNotificationPermission()
    }
  }

  const updateTask = () => {
    let hasErrors = false
    const errorFields = []

    if (!editingTask?.title?.trim()) {
      hasErrors = true
      errorFields.push("edit-title")
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      })
    }

    if (hasErrors) {
      // Highlight the error fields
      errorFields.forEach((field) => {
        const element = document.getElementById(field)
        if (element) {
          element.setAttribute("data-error", "true")
          element.classList.add("border-red-500", "focus:ring-red-500")

          // Remove error styling after 3 seconds or on input
          element.addEventListener("input", function onInput() {
            element.removeAttribute("data-error")
            element.classList.remove("border-red-500", "focus:ring-red-500")
            element.removeEventListener("input", onInput)
          })

          setTimeout(() => {
            if (element.getAttribute("data-error")) {
              element.removeAttribute("data-error")
              element.classList.remove("border-red-500", "focus:ring-red-500")
            }
          }, 3000)
        }
      })

      return
    }

    if (!editingTask) return

    setTasks(
      tasks.map((task) =>
        task.id === editingTask.id
          ? {
              ...task,
              title: editingTask.title,
              description: editingTask.description,
              dueDate:
                typeof editingTask.dueDate === "object"
                  ? format(editingTask.dueDate as Date, "yyyy-MM-dd")
                  : (editingTask.dueDate as string),
              priority: editingTask.priority,
              category: editingTask.category,
              notifyBefore: editingTask.notifyBefore,
              notificationEnabled: editingTask.notificationEnabled,
            }
          : task,
      ),
    )

    setIsEditDialogOpen(false)

    toast({
      title: "Task updated",
      description: "Your task has been updated successfully.",
    })

    // If notifications are enabled, check if we need to request permission
    if (editingTask.notificationEnabled && notificationPermission !== "granted") {
      requestNotificationPermission()
    }
  }

  const deleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id))

    toast({
      title: "Task deleted",
      description: "Your task has been deleted.",
    })
  }

  const toggleTaskCompletion = (id: number) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  const startEditTask = (task: any) => {
    setEditingTask({
      ...task,
      dueDate: new Date(task.dueDate),
    })
    setIsEditDialogOpen(true)
  }

  const requestNotificationPermission = async () => {
    const granted = await NotificationService.requestPermission()
    setNotificationPermission(granted ? "granted" : "denied")

    if (!granted) {
      toast({
        title: "Notification permission denied",
        description: "You won't receive notifications for task due dates.",
        variant: "destructive",
      })
    }
  }

  const filteredTasks = tasks.filter((task) => {
    // Status filter
    if (filter === "completed" && !task.completed) return false
    if (filter === "pending" && task.completed) return false

    // Category filter
    if (categoryFilter !== "all" && task.category !== categoryFilter) return false

    return true
  })

  if (!isMounted) {
    return null
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-2 sm:p-4 overflow-x-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-2 sm:px-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground text-base sm:text-lg">Manage your assignments and personal tasks</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto mt-2 sm:mt-0">
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
              <DialogDescription>Create a new task or assignment to track</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title" className="flex items-center">
                  Title <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={(e) => {
                    setNewTask({ ...newTask, title: e.target.value })
                    // Remove error styling on input
                    e.target.removeAttribute("data-error")
                    e.target.classList.remove("border-red-500", "focus:ring-red-500")
                  }}
                  className="focus:ring-primary"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Task details"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={typeof newTask.dueDate === 'string' ? newTask.dueDate : newTask.dueDate.toISOString().split('T')[0]}
                  onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
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
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={newTask.category} onValueChange={(value) => setNewTask({ ...newTask, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notification">Notifications</Label>
                    <div className="text-xs text-muted-foreground">Get reminded before the due date</div>
                  </div>
                  <Switch
                    id="notification"
                    checked={newTask.notificationEnabled}
                    onCheckedChange={(checked) => setNewTask({ ...newTask, notificationEnabled: checked })}
                  />
                </div>
                {newTask.notificationEnabled && (
                  <div className="grid gap-2 mt-2">
                    <Label htmlFor="notifyBefore">Notify me</Label>
                    <Select
                      value={newTask.notifyBefore.toString()}
                      onValueChange={(value) => setNewTask({ ...newTask, notifyBefore: Number.parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select when to notify" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">On the due date</SelectItem>
                        <SelectItem value="1">1 day before</SelectItem>
                        <SelectItem value="2">2 days before</SelectItem>
                        <SelectItem value="3">3 days before</SelectItem>
                        <SelectItem value="7">1 week before</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addTask}>Add Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>Update your task details</DialogDescription>
            </DialogHeader>
            {editingTask && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title" className="flex items-center">
                    Title <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="edit-title"
                    placeholder="Task title"
                    value={editingTask?.title ?? ''}
                    onChange={(e) => {
                      setEditingTask({ ...editingTask, title: e.target.value })
                      // Remove error styling on input
                      e.target.removeAttribute("data-error")
                      e.target.classList.remove("border-red-500", "focus:ring-red-500")
                    }}
                    className="focus:ring-primary"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Task details"
                    value={editingTask?.description ?? ''}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-dueDate">Due Date</Label>
                  <Input
                    id="edit-dueDate"
                    type="date"
                    value={typeof editingTask?.dueDate === 'string' ? editingTask?.dueDate : editingTask?.dueDate?.toISOString().split('T')[0]}
                    onChange={e => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
                    value={editingTask?.priority ?? ''}
                    onValueChange={(value) => setEditingTask({ ...editingTask, priority: value })}
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
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editingTask?.category ?? ''}
                    onValueChange={(value) => setEditingTask({ ...editingTask, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="school">School</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="edit-notification">Notifications</Label>
                      <div className="text-xs text-muted-foreground">Get reminded before the due date</div>
                    </div>
                    <Switch
                      id="edit-notification"
                      checked={!!editingTask?.notificationEnabled}
                      onCheckedChange={(checked) => setEditingTask({ ...editingTask, notificationEnabled: checked })}
                    />
                  </div>
                  {editingTask?.notificationEnabled && (
                    <div className="grid gap-2 mt-2">
                      <Label htmlFor="edit-notifyBefore">Notify me</Label>
                      <Select
                        value={editingTask?.notifyBefore?.toString() ?? '0'}
                        onValueChange={(value) =>
                          setEditingTask({ ...editingTask, notifyBefore: Number.parseInt(value) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select when to notify" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">On the due date</SelectItem>
                          <SelectItem value="1">1 day before</SelectItem>
                          <SelectItem value="2">2 days before</SelectItem>
                          <SelectItem value="3">3 days before</SelectItem>
                          <SelectItem value="7">1 week before</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateTask}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center px-2 sm:px-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter:</span>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="school">School</SelectItem>
            <SelectItem value="work">Work</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="list" className="space-y-2 sm:space-y-4 px-2 sm:px-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="board">Board View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-2 sm:space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-4 sm:p-8 text-center">
              <CheckSquare className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-base sm:text-lg font-medium">No tasks found</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {filter !== "all" || categoryFilter !== "all"
                  ? "Try changing your filters or add a new task"
                  : "Add your first task to get started"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <Card key={task.id} className={task.completed ? "opacity-70" : ""}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={(e) => toggleTaskCompletion(task.id)}
                          className="h-5 w-5 mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <div className="space-y-1">
                          <h3 className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Due: {task.dueDate}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full ${
                                task.priority === "high"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  : task.priority === "medium"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              }`}
                            >
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </span>
                            <span className="px-2 py-0.5 bg-muted rounded-full">
                              {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                            </span>
                            {task.notificationEnabled && (
                              <span className="flex items-center text-muted-foreground">
                                <Bell className="h-3 w-3 mr-1" />
                                {task.notifyBefore === 0
                                  ? "On due date"
                                  : `${task.notifyBefore} day${task.notifyBefore !== 1 ? "s" : ""} before`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => startEditTask(task)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="board" className="space-y-2 sm:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
            <Card>
              <CardHeader className="bg-muted/50 pb-3">
                <CardTitle className="text-sm font-medium">To Do</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {filteredTasks
                  .filter((task) => !task.completed)
                  .filter((task) => task.priority === "high")
                  .map((task) => (
                    <div key={task.id} className="p-3 bg-background border rounded-lg shadow-sm">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEditTask(task)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleTaskCompletion(task.id)}
                          >
                            <CheckSquare className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                          High
                        </span>
                        <span className="text-muted-foreground">{task.dueDate}</span>
                        {task.notificationEnabled && <Bell className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </div>
                  ))}
                {filteredTasks
                  .filter((task) => !task.completed)
                  .filter((task) => task.priority === "medium")
                  .map((task) => (
                    <div key={task.id} className="p-3 bg-background border rounded-lg shadow-sm">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEditTask(task)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleTaskCompletion(task.id)}
                          >
                            <CheckSquare className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                          Medium
                        </span>
                        <span className="text-muted-foreground">{task.dueDate}</span>
                        {task.notificationEnabled && <Bell className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </div>
                  ))}
                {filteredTasks
                  .filter((task) => !task.completed)
                  .filter((task) => task.priority === "low")
                  .map((task) => (
                    <div key={task.id} className="p-3 bg-background border rounded-lg shadow-sm">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEditTask(task)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleTaskCompletion(task.id)}
                          >
                            <CheckSquare className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                          Low
                        </span>
                        <span className="text-muted-foreground">{task.dueDate}</span>
                        {task.notificationEnabled && <Bell className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-muted/50 pb-3">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                <div className="flex flex-col items-center justify-center p-6 text-center h-32 border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">Tasks in progress will appear here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-muted/50 pb-3">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {filteredTasks
                  .filter((task) => task.completed)
                  .map((task) => (
                    <div key={task.id} className="p-3 bg-background border rounded-lg shadow-sm opacity-70">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm line-through text-muted-foreground">{task.title}</h4>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleTaskCompletion(task.id)}
                          >
                            <CheckSquare className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteTask(task.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span
                          className={`px-2 py-0.5 rounded-full ${
                            task.priority === "high"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : task.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}
                        >
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                        <span className="text-muted-foreground">{task.dueDate}</span>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
