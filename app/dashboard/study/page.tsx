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
import { Progress } from "@/components/ui/progress"
import { format } from "date-fns"
import {
  BookOpen,
  Plus,
  Trash2,
  Edit,
  Search,
  Clock,
  CheckCircle2,
  BookMarked,
  Bookmark,
  FileText,
  Link2,
  ExternalLink,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function StudyPage() {
  const { toast } = useToast()
  const [studyMaterials, setStudyMaterials] = useState([
    {
      id: 1,
      title: "Calculus Textbook",
      description: "Advanced calculus concepts and problems",
      type: "book",
      subject: "mathematics",
      url: "",
      notes: "Focus on chapters 5-8 for the exam",
      progress: 65,
      dateAdded: "2025-03-10",
    },
    {
      id: 2,
      title: "Physics Video Lectures",
      description: "Series of lectures on quantum mechanics",
      type: "video",
      subject: "physics",
      url: "https://example.com/physics-lectures",
      notes: "Watch lectures 3-7 for the upcoming test",
      progress: 40,
      dateAdded: "2025-03-12",
    },
    {
      id: 3,
      title: "History Notes",
      description: "Comprehensive notes on World War II",
      type: "notes",
      subject: "history",
      url: "",
      notes: "Review sections on European theater",
      progress: 80,
      dateAdded: "2025-03-15",
    },
    {
      id: 4,
      title: "Programming Tutorial",
      description: "Advanced JavaScript concepts",
      type: "tutorial",
      subject: "computer science",
      url: "https://example.com/js-tutorial",
      notes: "Complete exercises at the end of each section",
      progress: 25,
      dateAdded: "2025-03-18",
    },
    {
      id: 5,
      title: "Literature Analysis",
      description: "Analysis of Shakespeare's works",
      type: "article",
      subject: "literature",
      url: "https://example.com/shakespeare-analysis",
      notes: "Focus on Hamlet and Macbeth",
      progress: 50,
      dateAdded: "2025-03-20",
    },
  ])

  const [studySessions, setStudySessions] = useState([
    {
      id: 1,
      subject: "mathematics",
      duration: 120, // minutes
      date: "2025-03-21",
      notes: "Worked on calculus problems",
      materials: ["Calculus Textbook"],
      completed: true,
    },
    {
      id: 2,
      subject: "physics",
      duration: 90,
      date: "2025-03-20",
      notes: "Watched lectures on quantum mechanics",
      materials: ["Physics Video Lectures"],
      completed: true,
    },
    {
      id: 3,
      subject: "history",
      duration: 60,
      date: "2025-03-19",
      notes: "Reviewed World War II notes",
      materials: ["History Notes"],
      completed: true,
    },
    {
      id: 4,
      subject: "computer science",
      duration: 45,
      date: "2025-03-22",
      notes: "Started JavaScript tutorial",
      materials: ["Programming Tutorial"],
      completed: false,
    },
  ])

  const [newMaterial, setNewMaterial] = useState({
    title: "",
    description: "",
    type: "book",
    subject: "mathematics",
    url: "",
    notes: "",
    progress: 0,
    dateAdded: format(new Date(), "yyyy-MM-dd"),
  })

  const [newSession, setNewSession] = useState({
    subject: "mathematics",
    duration: 60,
    date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
    materials: [],
    completed: false,
  })

  const [editingMaterial, setEditingMaterial] = useState(null)
  const [editingSession, setEditingSession] = useState(null)
  const [isAddMaterialDialogOpen, setIsAddMaterialDialogOpen] = useState(false)
  const [isEditMaterialDialogOpen, setIsEditMaterialDialogOpen] = useState(false)
  const [isAddSessionDialogOpen, setIsAddSessionDialogOpen] = useState(false)
  const [isEditSessionDialogOpen, setIsEditSessionDialogOpen] = useState(false)
  const [filter, setFilter] = useState("all")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // Load data from localStorage
    const savedMaterials = localStorage.getItem("studyMaterials")
    if (savedMaterials) {
      setStudyMaterials(JSON.parse(savedMaterials))
    }

    const savedSessions = localStorage.getItem("studySessions")
    if (savedSessions) {
      setStudySessions(JSON.parse(savedSessions))
    }
  }, [])

  // Save data to localStorage when they change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("studyMaterials", JSON.stringify(studyMaterials))
      localStorage.setItem("studySessions", JSON.stringify(studySessions))
    }
  }, [studyMaterials, studySessions, isMounted])

  const addMaterial = () => {
    if (!newMaterial.title.trim()) {
      toast({
        title: "Error",
        description: "Material title is required",
        variant: "destructive",
      })
      return
    }

    const material = {
      id: Date.now(),
      ...newMaterial,
    }

    setStudyMaterials([...studyMaterials, material])
    setNewMaterial({
      title: "",
      description: "",
      type: "book",
      subject: "mathematics",
      url: "",
      notes: "",
      progress: 0,
      dateAdded: format(new Date(), "yyyy-MM-dd"),
    })
    setIsAddMaterialDialogOpen(false)

    toast({
      title: "Material added",
      description: "Your study material has been added successfully.",
    })
  }

  const updateMaterial = () => {
    if (!editingMaterial.title.trim()) {
      toast({
        title: "Error",
        description: "Material title is required",
        variant: "destructive",
      })
      return
    }

    setStudyMaterials(
      studyMaterials.map((material) => (material.id === editingMaterial.id ? editingMaterial : material)),
    )

    setIsEditMaterialDialogOpen(false)

    toast({
      title: "Material updated",
      description: "Your study material has been updated successfully.",
    })
  }

  const deleteMaterial = (id) => {
    setStudyMaterials(studyMaterials.filter((material) => material.id !== id))

    // Also remove this material from any study sessions
    setStudySessions(
      studySessions.map((session) => ({
        ...session,
        materials: session.materials.filter(
          (material) => !studyMaterials.find((m) => m.id === id || m.title === material),
        ),
      })),
    )

    toast({
      title: "Material deleted",
      description: "Your study material has been deleted.",
    })
  }

  const startEditMaterial = (material) => {
    setEditingMaterial(material)
    setIsEditMaterialDialogOpen(true)
  }

  const addSession = () => {
    if (newSession.duration <= 0) {
      toast({
        title: "Error",
        description: "Session duration must be greater than 0",
        variant: "destructive",
      })
      return
    }

    const session = {
      id: Date.now(),
      ...newSession,
    }

    setStudySessions([...studySessions, session])
    setNewSession({
      subject: "mathematics",
      duration: 60,
      date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
      materials: [],
      completed: false,
    })
    setIsAddSessionDialogOpen(false)

    toast({
      title: "Session added",
      description: "Your study session has been added successfully.",
    })
  }

  const updateSession = () => {
    if (editingSession.duration <= 0) {
      toast({
        title: "Error",
        description: "Session duration must be greater than 0",
        variant: "destructive",
      })
      return
    }

    setStudySessions(studySessions.map((session) => (session.id === editingSession.id ? editingSession : session)))

    setIsEditSessionDialogOpen(false)

    toast({
      title: "Session updated",
      description: "Your study session has been updated successfully.",
    })
  }

  const deleteSession = (id) => {
    setStudySessions(studySessions.filter((session) => session.id !== id))

    toast({
      title: "Session deleted",
      description: "Your study session has been deleted.",
    })
  }

  const startEditSession = (session) => {
    setEditingSession(session)
    setIsEditSessionDialogOpen(true)
  }

  const toggleSessionCompletion = (id) => {
    setStudySessions(
      studySessions.map((session) => (session.id === id ? { ...session, completed: !session.completed } : session)),
    )
  }

  const updateMaterialProgress = (id, progress) => {
    setStudyMaterials(studyMaterials.map((material) => (material.id === id ? { ...material, progress } : material)))
  }

  const getMaterialTypeIcon = (type) => {
    switch (type) {
      case "book":
        return <BookOpen className="h-4 w-4 text-blue-500" />
      case "video":
        return <VideoIcon className="h-4 w-4 text-red-500" />
      case "notes":
        return <FileText className="h-4 w-4 text-green-500" />
      case "article":
        return <ArticleIcon className="h-4 w-4 text-purple-500" />
      case "tutorial":
        return <BookMarked className="h-4 w-4 text-yellow-500" />
      default:
        return <Bookmark className="h-4 w-4 text-gray-500" />
    }
  }

  // Custom icons
  const VideoIcon = ({ className }) => (
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
      <polygon points="23 7 16 12 23 17 23 7"></polygon>
      <rect width="15" height="14" x="1" y="5" rx="2" ry="2"></rect>
    </svg>
  )

  const ArticleIcon = ({ className }) => (
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
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" x2="8" y1="13" y2="13"></line>
      <line x1="16" x2="8" y1="17" y2="17"></line>
      <line x1="10" x2="8" y1="9" y2="9"></line>
    </svg>
  )

  const getSubjectBadge = (subject) => {
    switch (subject) {
      case "mathematics":
        return <Badge className="bg-blue-500">Mathematics</Badge>
      case "physics":
        return <Badge className="bg-red-500">Physics</Badge>
      case "chemistry":
        return <Badge className="bg-green-500">Chemistry</Badge>
      case "biology":
        return <Badge className="bg-yellow-500">Biology</Badge>
      case "history":
        return <Badge className="bg-purple-500">History</Badge>
      case "literature":
        return <Badge className="bg-pink-500">Literature</Badge>
      case "computer science":
        return <Badge className="bg-cyan-500">Computer Science</Badge>
      default:
        return <Badge>{subject.charAt(0).toUpperCase() + subject.slice(1)}</Badge>
    }
  }

  const getTotalStudyTime = () => {
    return studySessions.reduce((total, session) => total + session.duration, 0)
  }

  const getStudyTimeBySubject = (subject) => {
    return studySessions
      .filter((session) => session.subject === subject)
      .reduce((total, session) => total + session.duration, 0)
  }

  const formatStudyTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const filteredMaterials = studyMaterials.filter((material) => {
    // Type filter
    if (filter !== "all" && material.type !== filter) return false

    // Subject filter
    if (subjectFilter !== "all" && material.subject !== subjectFilter) return false

    // Search query
    if (
      searchQuery &&
      !material.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !material.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false

    return true
  })

  if (!isMounted) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Study</h2>
          <p className="text-muted-foreground">Manage your study materials and track your study sessions</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={isAddMaterialDialogOpen} onOpenChange={setIsAddMaterialDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Study Material</DialogTitle>
                <DialogDescription>Add a new study resource to your collection</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Material title"
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the material"
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newMaterial.type}
                      onValueChange={(value) => setNewMaterial({ ...newMaterial, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="book">Book</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="notes">Notes</SelectItem>
                        <SelectItem value="article">Article</SelectItem>
                        <SelectItem value="tutorial">Tutorial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select
                      value={newMaterial.subject}
                      onValueChange={(value) => setNewMaterial({ ...newMaterial, subject: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mathematics">Mathematics</SelectItem>
                        <SelectItem value="physics">Physics</SelectItem>
                        <SelectItem value="chemistry">Chemistry</SelectItem>
                        <SelectItem value="biology">Biology</SelectItem>
                        <SelectItem value="history">History</SelectItem>
                        <SelectItem value="literature">Literature</SelectItem>
                        <SelectItem value="computer science">Computer Science</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="url">URL (Optional)</Label>
                  <Input
                    id="url"
                    placeholder="Link to the resource"
                    value={newMaterial.url}
                    onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Your notes about this material"
                    value={newMaterial.notes}
                    onChange={(e) => setNewMaterial({ ...newMaterial, notes: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="progress">Progress</Label>
                    <span className="text-sm text-muted-foreground">{newMaterial.progress}%</span>
                  </div>
                  <Input
                    id="progress"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={newMaterial.progress}
                    onChange={(e) => setNewMaterial({ ...newMaterial, progress: Number.parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddMaterialDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addMaterial}>Add Material</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddSessionDialogOpen} onOpenChange={setIsAddSessionDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Study Session</DialogTitle>
                <DialogDescription>Record a new study session</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    value={newSession.subject}
                    onValueChange={(value) => setNewSession({ ...newSession, subject: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mathematics">Mathematics</SelectItem>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="chemistry">Chemistry</SelectItem>
                      <SelectItem value="biology">Biology</SelectItem>
                      <SelectItem value="history">History</SelectItem>
                      <SelectItem value="literature">Literature</SelectItem>
                      <SelectItem value="computer science">Computer Science</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    placeholder="60"
                    value={newSession.duration}
                    onChange={(e) => setNewSession({ ...newSession, duration: Number.parseInt(e.target.value) })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newSession.date}
                    onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="materials">Materials Used</Label>
                  <Select
                    value={newSession.materials[0] || ""}
                    onValueChange={(value) => setNewSession({ ...newSession, materials: [value] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {studyMaterials
                        .filter((material) => material.subject === newSession.subject)
                        .map((material) => (
                          <SelectItem key={material.id} value={material.title}>
                            {material.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="What did you study in this session?"
                    value={newSession.notes}
                    onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="completed"
                    checked={newSession.completed}
                    onChange={(e) => setNewSession({ ...newSession, completed: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="completed">Mark as completed</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddSessionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addSession}>Add Session</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="book">Books</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="notes">Notes</SelectItem>
            <SelectItem value="article">Articles</SelectItem>
            <SelectItem value="tutorial">Tutorials</SelectItem>
          </SelectContent>
        </Select>

        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            <SelectItem value="mathematics">Mathematics</SelectItem>
            <SelectItem value="physics">Physics</SelectItem>
            <SelectItem value="chemistry">Chemistry</SelectItem>
            <SelectItem value="biology">Biology</SelectItem>
            <SelectItem value="history">History</SelectItem>
            <SelectItem value="literature">Literature</SelectItem>
            <SelectItem value="computer science">Computer Science</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatStudyTime(getTotalStudyTime())}</div>
            <p className="text-xs text-muted-foreground">{studySessions.length} study sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Materials</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studyMaterials.length}</div>
            <p className="text-xs text-muted-foreground">
              {studyMaterials.filter((m) => m.progress === 100).length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Studied Subject</CardTitle>
            <BookMarked className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {studySessions.length > 0 ? (
              <>
                <div className="text-2xl font-bold capitalize">
                  {Object.entries(
                    studySessions.reduce((acc, session) => {
                      acc[session.subject] = (acc[session.subject] || 0) + session.duration
                      return acc
                    }, {}),
                  )
                    .sort((a, b) => b[1] - a[1])[0][0]
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatStudyTime(
                    Object.entries(
                      studySessions.reduce((acc, session) => {
                        acc[session.subject] = (acc[session.subject] || 0) + session.duration
                        return acc
                      }, {}),
                    ).sort((a, b) => b[1] - a[1])[0][1],
                  )}{" "}
                  total time
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">None</div>
                <p className="text-xs text-muted-foreground">No study sessions recorded</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Sessions</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studySessions.filter((s) => new Date(s.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
            </div>
            <p className="text-xs text-muted-foreground">In the last 7 days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="materials">Study Materials</TabsTrigger>
          <TabsTrigger value="sessions">Study Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          {filteredMaterials.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No study materials found</h3>
                <p className="text-sm text-muted-foreground">
                  {filter !== "all" || subjectFilter !== "all" || searchQuery
                    ? "Try changing your filters or search query"
                    : "Add your first study material to get started"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMaterials.map((material) => (
                <Card key={material.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getMaterialTypeIcon(material.type)}
                        <CardTitle className="text-lg">{material.title}</CardTitle>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => startEditMaterial(material)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMaterial(material.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>{material.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{material.progress}%</span>
                        </div>
                        <Progress value={material.progress} />
                      </div>

                      {material.notes && (
                        <div className="text-sm">
                          <span className="font-medium">Notes:</span> {material.notes}
                        </div>
                      )}

                      {material.url && (
                        <div className="flex items-center gap-1 text-sm text-blue-500">
                          <Link2 className="h-3 w-3" />
                          <a href={material.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            View Resource <ExternalLink className="h-3 w-3 inline" />
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-0">
                    <div className="flex items-center gap-2">{getSubjectBadge(material.subject)}</div>
                    <div className="text-xs text-muted-foreground">
                      Added: {format(new Date(material.dateAdded), "MMM d, yyyy")}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          <Dialog open={isEditMaterialDialogOpen} onOpenChange={setIsEditMaterialDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Study Material</DialogTitle>
                <DialogDescription>Update your study material details</DialogDescription>
              </DialogHeader>
              {editingMaterial && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      placeholder="Material title"
                      value={editingMaterial.title}
                      onChange={(e) => setEditingMaterial({ ...editingMaterial, title: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      placeholder="Brief description of the material"
                      value={editingMaterial.description}
                      onChange={(e) => setEditingMaterial({ ...editingMaterial, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-type">Type</Label>
                      <Select
                        value={editingMaterial.type}
                        onValueChange={(value) => setEditingMaterial({ ...editingMaterial, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="book">Book</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="notes">Notes</SelectItem>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="tutorial">Tutorial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="edit-subject">Subject</Label>
                      <Select
                        value={editingMaterial.subject}
                        onValueChange={(value) => setEditingMaterial({ ...editingMaterial, subject: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mathematics">Mathematics</SelectItem>
                          <SelectItem value="physics">Physics</SelectItem>
                          <SelectItem value="chemistry">Chemistry</SelectItem>
                          <SelectItem value="biology">Biology</SelectItem>
                          <SelectItem value="history">History</SelectItem>
                          <SelectItem value="literature">Literature</SelectItem>
                          <SelectItem value="computer science">Computer Science</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-url">URL (Optional)</Label>
                    <Input
                      id="edit-url"
                      placeholder="Link to the resource"
                      value={editingMaterial.url}
                      onChange={(e) => setEditingMaterial({ ...editingMaterial, url: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-notes">Notes (Optional)</Label>
                    <Textarea
                      id="edit-notes"
                      placeholder="Your notes about this material"
                      value={editingMaterial.notes}
                      onChange={(e) => setEditingMaterial({ ...editingMaterial, notes: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <div className="flex justify-between">
                      <Label htmlFor="edit-progress">Progress</Label>
                      <span className="text-sm text-muted-foreground">{editingMaterial.progress}%</span>
                    </div>
                    <Input
                      id="edit-progress"
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={editingMaterial.progress}
                      onChange={(e) =>
                        setEditingMaterial({ ...editingMaterial, progress: Number.parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditMaterialDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={updateMaterial}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Study Sessions</CardTitle>
              <CardDescription>Track your study time and progress</CardDescription>
            </CardHeader>
            <CardContent>
              {studySessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No study sessions recorded</h3>
                  <p className="text-sm text-muted-foreground">
                    Record your first study session to start tracking your progress
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {studySessions
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((session) => (
                      <div key={session.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={session.completed}
                                onChange={() => toggleSessionCompletion(session.id)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <h4
                                className={`font-medium ${session.completed ? "line-through text-muted-foreground" : ""}`}
                              >
                                {session.subject.charAt(0).toUpperCase() + session.subject.slice(1)} Study Session
                              </h4>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => startEditSession(session)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteSession(session.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-sm">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>{formatStudyTime(session.duration)}</span>
                            <span className="text-muted-foreground">•</span>
                            <span>{format(new Date(session.date), "MMM d, yyyy")}</span>
                          </div>

                          {session.materials.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {session.materials.map((material, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {material}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {session.notes && <p className="mt-2 text-sm text-muted-foreground">{session.notes}</p>}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={isEditSessionDialogOpen} onOpenChange={setIsEditSessionDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Study Session</DialogTitle>
                <DialogDescription>Update your study session details</DialogDescription>
              </DialogHeader>
              {editingSession && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-subject">Subject</Label>
                    <Select
                      value={editingSession.subject}
                      onValueChange={(value) => setEditingSession({ ...editingSession, subject: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mathematics">Mathematics</SelectItem>
                        <SelectItem value="physics">Physics</SelectItem>
                        <SelectItem value="chemistry">Chemistry</SelectItem>
                        <SelectItem value="biology">Biology</SelectItem>
                        <SelectItem value="history">History</SelectItem>
                        <SelectItem value="literature">Literature</SelectItem>
                        <SelectItem value="computer science">Computer Science</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-duration">Duration (minutes)</Label>
                    <Input
                      id="edit-duration"
                      type="number"
                      min="1"
                      placeholder="60"
                      value={editingSession.duration}
                      onChange={(e) =>
                        setEditingSession({ ...editingSession, duration: Number.parseInt(e.target.value) })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-date">Date</Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={editingSession.date}
                      onChange={(e) => setEditingSession({ ...editingSession, date: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-materials">Materials Used</Label>
                    <Select
                      value={editingSession.materials[0] || ""}
                      onValueChange={(value) => setEditingSession({ ...editingSession, materials: [value] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {studyMaterials
                          .filter((material) => material.subject === editingSession.subject)
                          .map((material) => (
                            <SelectItem key={material.id} value={material.title}>
                              {material.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-notes">Notes (Optional)</Label>
                    <Textarea
                      id="edit-notes"
                      placeholder="What did you study in this session?"
                      value={editingSession.notes}
                      onChange={(e) => setEditingSession({ ...editingSession, notes: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-completed"
                      checked={editingSession.completed}
                      onChange={(e) => setEditingSession({ ...editingSession, completed: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="edit-completed">Mark as completed</Label>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditSessionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={updateSession}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}
