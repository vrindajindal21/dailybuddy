"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import {
  CalendarIcon,
  Plus,
  Trash2,
  Edit,
  DollarSign,
  PieChart,
  BarChart3,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react"

type Expense = {
  id: number;
  title: string;
  amount: number | string;
  date: string;
  category: string;
  notes: string;
};

type Budget = {
  category: string;
  limit: number | string;
  color: string;
};

export default function BudgetPage() {
  const { toast } = useToast()
  const [expenses, setExpenses] = useState([
    {
      id: 1,
      title: "Textbooks",
      amount: 120,
      date: "2025-03-15",
      category: "education",
      notes: "Semester textbooks",
    },
    {
      id: 2,
      title: "Groceries",
      amount: 85.5,
      date: "2025-03-18",
      category: "food",
      notes: "Weekly groceries",
    },
    {
      id: 3,
      title: "Bus Pass",
      amount: 60,
      date: "2025-03-10",
      category: "transportation",
      notes: "Monthly bus pass",
    },
    {
      id: 4,
      title: "Coffee",
      amount: 4.75,
      date: "2025-03-22",
      category: "food",
      notes: "Study session coffee",
    },
    {
      id: 5,
      title: "Printer Paper",
      amount: 12.99,
      date: "2025-03-20",
      category: "supplies",
      notes: "For assignments",
    },
  ])

  const [budgets, setBudgets] = useState([
    { category: "food", limit: 200, color: "bg-blue-500" },
    { category: "education", limit: 300, color: "bg-green-500" },
    { category: "transportation", limit: 100, color: "bg-purple-500" },
    { category: "supplies", limit: 50, color: "bg-yellow-500" },
    { category: "entertainment", limit: 75, color: "bg-pink-500" },
  ])

  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    category: "food",
    notes: "",
  })

  const [newBudget, setNewBudget] = useState({
    category: "",
    limit: "",
  })

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false)
  const [isEditExpenseDialogOpen, setIsEditExpenseDialogOpen] = useState(false)
  const [isAddBudgetDialogOpen, setIsAddBudgetDialogOpen] = useState(false)
  const [isEditBudgetDialogOpen, setIsEditBudgetDialogOpen] = useState(false)

  const [isMounted, setIsMounted] = useState(false)
  const [currency, setCurrency] = useState("inr")

  useEffect(() => {
    setIsMounted(true)

    // Load data from localStorage
    const savedExpenses = localStorage.getItem("expenses")
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses))
    }

    const savedBudgets = localStorage.getItem("budgets")
    if (savedBudgets) {
      setBudgets(JSON.parse(savedBudgets))
    }

    // Load currency from user settings
    const savedSettings = localStorage.getItem("userSettings")
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setCurrency(settings.preferences?.currency || "inr")
    }

    // Listen for currency changes
    const handleCurrencyChange = () => {
      const savedSettings = localStorage.getItem("userSettings")
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        setCurrency(settings.preferences?.currency || "inr")
      }
    }

    window.addEventListener("currencyChanged", handleCurrencyChange)
    window.addEventListener("storage", handleCurrencyChange)

    return () => {
      window.removeEventListener("currencyChanged", handleCurrencyChange)
      window.removeEventListener("storage", handleCurrencyChange)
    }
  }, [])

  // Save data to localStorage when they change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("expenses", JSON.stringify(expenses))
      localStorage.setItem("budgets", JSON.stringify(budgets))
    }
  }, [expenses, budgets, isMounted])

  // Format currency based on user preference
  const formatCurrency = (amount: number) => {
    if (currency === "usd") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
    } else {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount)
    }
  }

  const addExpense = () => {
    if (!newExpense.title.trim() || !newExpense.amount) {
      toast({
        title: "Error",
        description: "Title and amount are required",
        variant: "destructive",
      })
      return
    }

    const expense = {
      id: Date.now(),
      title: newExpense.title,
      amount: Number.parseFloat(newExpense.amount),
      date: newExpense.date,
      category: newExpense.category,
      notes: newExpense.notes,
    }

    setExpenses([...expenses, expense])
    setNewExpense({
      title: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      category: "food",
      notes: "",
    })
    setIsAddExpenseDialogOpen(false)

    toast({
      title: "Expense added",
      description: "Your expense has been recorded.",
    })
  }

  const updateExpense = () => {
    if (!editingExpense?.title.trim() || !editingExpense?.amount) {
      toast({
        title: "Error",
        description: "Title and amount are required",
        variant: "destructive",
      })
      return
    }

    setExpenses(
      expenses.map((expense) =>
        expense.id === editingExpense.id
          ? {
              ...expense,
              title: editingExpense.title,
              amount: typeof editingExpense.amount === 'string' ? Number.parseFloat(editingExpense.amount) : editingExpense.amount,
              date: editingExpense.date,
              category: editingExpense.category,
              notes: editingExpense.notes,
            }
          : expense,
      ),
    )

    setIsEditExpenseDialogOpen(false)

    toast({
      title: "Expense updated",
      description: "Your expense has been updated.",
    })
  }

  const deleteExpense = (id: number) => {
    setExpenses(expenses.filter((expense) => expense.id !== id))

    toast({
      title: "Expense deleted",
      description: "Your expense has been deleted.",
    })
  }

  const startEditExpense = (expense: Expense) => {
    setEditingExpense({
      ...expense,
      amount: expense.amount.toString(),
    })
    setIsEditExpenseDialogOpen(true)
  }

  const addBudget = () => {
    if (!newBudget.category.trim() || !newBudget.limit) {
      toast({
        title: "Error",
        description: "Category and limit are required",
        variant: "destructive",
      })
      return
    }

    // Check if category already exists
    if (budgets.some((budget) => budget.category.toLowerCase() === newBudget.category.toLowerCase())) {
      toast({
        title: "Error",
        description: "This category already exists",
        variant: "destructive",
      })
      return
    }

    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-yellow-500",
      "bg-pink-500",
      "bg-orange-500",
      "bg-teal-500",
    ]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    const budget = {
      category: newBudget.category.toLowerCase(),
      limit: Number.parseFloat(newBudget.limit),
      color: randomColor,
    }

    setBudgets([...budgets, budget])
    setNewBudget({
      category: "",
      limit: "",
    })
    setIsAddBudgetDialogOpen(false)

    toast({
      title: "Budget added",
      description: "Your budget category has been added.",
    })
  }

  const updateBudget = () => {
    if (!editingBudget?.limit) {
      toast({
        title: "Error",
        description: "Budget limit is required",
        variant: "destructive",
      })
      return
    }

    setBudgets(
      budgets.map((budget) =>
        budget.category === editingBudget.category
          ? {
              ...budget,
              limit: typeof editingBudget.limit === 'string' ? Number.parseFloat(editingBudget.limit) : editingBudget.limit,
            }
          : budget,
      ),
    )

    setIsEditBudgetDialogOpen(false)

    toast({
      title: "Budget updated",
      description: "Your budget limit has been updated.",
    })
  }

  const startEditBudget = (budget: Budget) => {
    setEditingBudget({
      ...budget,
      limit: budget.limit.toString(),
    })
    setIsEditBudgetDialogOpen(true)
  }

  const deleteBudget = (category: string) => {
    setBudgets(budgets.filter((budget) => budget.category !== category))

    toast({
      title: "Budget deleted",
      description: "Your budget category has been deleted.",
    })
  }

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0)
  }

  const getExpensesByCategory = (category: string) => {
    return expenses
      .filter((expense) => expense.category === category)
      .reduce((total, expense) => total + expense.amount, 0)
  }

  const getBudgetProgress = (category: string) => {
    const budget = budgets.find((b) => b.category === category)
    if (!budget) return 0

    const spent = getExpensesByCategory(category)
    return Math.min((spent / budget.limit) * 100, 100)
  }

  const getCategoryColor = (category: string) => {
    const budget = budgets.find((b) => b.category === category)
    return budget ? budget.color : "bg-gray-500"
  }

  if (!isMounted) {
    return null
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-8 py-2 sm:py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Budget</h2>
          <p className="text-muted-foreground text-base sm:text-lg">Manage your expenses and budgets</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <Dialog open={isAddExpenseDialogOpen} onOpenChange={setIsAddExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>Record a new expense to track your spending</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Expense title"
                    value={newExpense.title}
                    onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pl-8"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newExpense.date}
                    onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newExpense.category}
                    onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {budgets.map((budget) => (
                        <SelectItem key={budget.category} value={budget.category}>
                          {budget.category.charAt(0).toUpperCase() + budget.category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional details"
                    value={newExpense.notes}
                    onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddExpenseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addExpense}>Add Expense</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddBudgetDialogOpen} onOpenChange={setIsAddBudgetDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Budget</DialogTitle>
                <DialogDescription>Add a new budget category</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="Enter category name"
                    value={newBudget.category}
                    onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="limit">Monthly Limit</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="limit"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pl-8"
                      value={newBudget.limit}
                      onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddBudgetDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addBudget}>Add Budget</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center mt-2 mb-4">
        {/* ...existing filter/search bar if any... */}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalExpenses())}</div>
            <p className="text-xs text-muted-foreground">{expenses.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Largest Expense</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(Math.max(...expenses.map((e) => e.amount), 0))}</div>
            <p className="text-xs text-muted-foreground">
              {expenses.length > 0
                ? expenses.reduce((max, e) => (e.amount > max.amount ? e : max), expenses[0]).title
                : "No expenses"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Categories</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgets.length}</div>
            <p className="text-xs text-muted-foreground">
              Total budget: {formatCurrency(budgets.reduce((sum, b) => sum + b.limit, 0))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Math.max(budgets.reduce((sum, b) => sum + b.limit, 0) - getTotalExpenses(), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(
                (getTotalExpenses() /
                  Math.max(
                    budgets.reduce((sum, b) => sum + b.limit, 0),
                    1,
                  )) *
                  100,
              )}
              % of total budget used
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4 overflow-x-auto">
          <Card>
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>Your recent spending history</CardDescription>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <DollarSign className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No expenses yet</h3>
                  <p className="text-sm text-muted-foreground">Add your first expense to start tracking</p>
                </div>
              ) : (
                <div className="overflow-x-auto w-full hidden md:block">
                  <div className="space-y-2 overflow-x-auto">
                    {expenses
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((expense) => (
                        <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-10 rounded-full ${getCategoryColor(expense.category)}`}></div>
                            <div>
                              <h4 className="font-medium">{expense.title}</h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{expense.date}</span>
                                <span>•</span>
                                <span>{expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-medium">{formatCurrency(expense.amount)}</span>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => startEditExpense(expense)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteExpense(expense.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="block md:hidden space-y-4">
            {expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <DollarSign className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No expenses yet</h3>
                <p className="text-sm text-muted-foreground">Add your first expense to start tracking</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-x-auto">
                {expenses
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-10 rounded-full ${getCategoryColor(expense.category)}`}></div>
                        <div>
                          <h4 className="font-medium">{expense.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{expense.date}</span>
                            <span>•</span>
                            <span>{expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{formatCurrency(expense.amount)}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => startEditExpense(expense)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteExpense(expense.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <Dialog open={isEditExpenseDialogOpen} onOpenChange={setIsEditExpenseDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Expense</DialogTitle>
                <DialogDescription>Update your expense details</DialogDescription>
              </DialogHeader>
              {editingExpense && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      placeholder="Expense title"
                      value={editingExpense.title}
                      onChange={(e) => setEditingExpense({ ...editingExpense, title: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-amount">Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="edit-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-8"
                        value={editingExpense.amount}
                        onChange={(e) => setEditingExpense({ ...editingExpense, amount: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-date">Date</Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={editingExpense && editingExpense.date ? editingExpense.date : ''}
                      onChange={e => setEditingExpense({ ...editingExpense, date: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select
                      value={editingExpense.category}
                      onValueChange={(value) => setEditingExpense({ ...editingExpense, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgets.map((budget) => (
                          <SelectItem key={budget.category} value={budget.category}>
                            {budget.category.charAt(0).toUpperCase() + budget.category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-notes">Notes (Optional)</Label>
                    <Textarea
                      id="edit-notes"
                      placeholder="Additional details"
                      value={editingExpense.notes}
                      onChange={(e) => setEditingExpense({ ...editingExpense, notes: e.target.value })}
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditExpenseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={updateExpense}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4 overflow-x-auto">
          <Card>
            <CardHeader>
              <CardTitle>Budget Categories</CardTitle>
              <CardDescription>Your spending limits by category</CardDescription>
            </CardHeader>
            <CardContent>
              {budgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <PieChart className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No budget categories</h3>
                  <p className="text-sm text-muted-foreground">Add your first budget category to start tracking</p>
                </div>
              ) : (
                <div className="overflow-x-auto w-full hidden md:block">
                  <div className="space-y-6 overflow-x-auto">
                    {budgets.map((budget) => (
                      <div key={budget.category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${budget.color}`}></div>
                            <span className="font-medium">
                              {budget.category.charAt(0).toUpperCase() + budget.category.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-sm">
                              {formatCurrency(getExpensesByCategory(budget.category))} / {formatCurrency(budget.limit)}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => startEditBudget(budget)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteBudget(budget.category)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <Progress value={getBudgetProgress(budget.category)} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="block md:hidden space-y-4">
            {budgets.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <PieChart className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No budget categories</h3>
                <p className="text-sm text-muted-foreground">Add your first budget category to start tracking</p>
              </div>
            ) : (
              <div className="space-y-6 overflow-x-auto">
                {budgets.map((budget) => (
                  <div key={budget.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${budget.color}`}></div>
                        <span className="font-medium">
                          {budget.category.charAt(0).toUpperCase() + budget.category.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          {formatCurrency(getExpensesByCategory(budget.category))} / {formatCurrency(budget.limit)}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => startEditBudget(budget)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteBudget(budget.category)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Progress value={getBudgetProgress(budget.category)} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <Dialog open={isEditBudgetDialogOpen} onOpenChange={setIsEditBudgetDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Budget</DialogTitle>
                <DialogDescription>Update your budget limit</DialogDescription>
              </DialogHeader>
              {editingBudget && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Input
                      id="edit-category"
                      value={editingBudget.category.charAt(0).toUpperCase() + editingBudget.category.slice(1)}
                      disabled
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-limit">Monthly Limit</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="edit-limit"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-8"
                        value={editingBudget.limit}
                        onChange={(e) => setEditingBudget({ ...editingBudget, limit: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditBudgetDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={updateBudget}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 overflow-x-auto">
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>How your expenses are distributed</CardDescription>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <BarChart3 className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No expense data</h3>
                  <p className="text-sm text-muted-foreground">Add expenses to see analytics</p>
                </div>
              ) : (
                <div className="space-y-6 overflow-x-auto">
                  {budgets.map((budget) => {
                    const spent = getExpensesByCategory(budget.category)
                    const percentage = (spent / getTotalExpenses()) * 100 || 0

                    return (
                      <div key={budget.category} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${budget.color}`}></div>
                            <span className="font-medium">
                              {budget.category.charAt(0).toUpperCase() + budget.category.slice(1)}
                            </span>
                          </div>
                          <div className="text-sm">
                            {formatCurrency(spent)} ({percentage.toFixed(1)}%)
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${budget.color}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
