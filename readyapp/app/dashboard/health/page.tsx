"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Activity,
  Heart,
  Droplets,
  Moon,
  Scale,
  Footprints,
  Flame,
  Dumbbell,
  Target,
  MapPin,
  Zap,
  BarChart3,
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { whoopTracker } from "@/lib/whoop-health-tracker"

interface HealthMetrics {
  steps: number
  distance: number
  calories: number
  activeMinutes: number
  heartRate: number
  hrv: number
  recovery: number
  strain: number
  sleep: {
    duration: number
    efficiency: number
    stages: {
      deep: number
      light: number
      rem: number
    }
  }
  water: number
  weight: number
}

interface DailyGoals {
  steps: number
  calories: number
  activeMinutes: number
  water: number
  sleep: number
}

export default function HealthTrackerPage() {
  const { t } = useLanguage()

  // Core state
  const [isTracking, setIsTracking] = useState(false)
  const [metrics, setMetrics] = useState<HealthMetrics>({
    steps: 0,
    distance: 0,
    calories: 0,
    activeMinutes: 0,
    heartRate: 72,
    hrv: 35,
    recovery: 0,
    strain: 0,
    sleep: {
      duration: 0,
      efficiency: 0,
      stages: { deep: 0, light: 0, rem: 0 },
    },
    water: 0,
    weight: 0,
  })

  const [goals, setGoals] = useState<DailyGoals>({
    steps: 10000,
    calories: 2000,
    activeMinutes: 30,
    water: 8,
    sleep: 480, // 8 hours in minutes
  })

  const [weeklyData, setWeeklyData] = useState<HealthMetrics[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Load data on mount
  useEffect(() => {
    loadHealthData()
    loadWeeklyData()

    // Set up real-time updates
    const interval = setInterval(() => {
      if (isTracking) {
        updateMetricsFromTracker()
      }
    }, 5000)

    // Listen for health events
    const handleHealthUpdate = (event: CustomEvent) => {
      updateMetricsFromEvent(event.detail)
    }

    window.addEventListener("health-biometricUpdate", handleHealthUpdate as EventListener)
    window.addEventListener("health-stepDetected", handleHealthUpdate as EventListener)
    window.addEventListener("health-locationUpdate", handleHealthUpdate as EventListener)

    return () => {
      clearInterval(interval)
      window.removeEventListener("health-biometricUpdate", handleHealthUpdate as EventListener)
      window.removeEventListener("health-stepDetected", handleHealthUpdate as EventListener)
      window.removeEventListener("health-locationUpdate", handleHealthUpdate as EventListener)
    }
  }, [isTracking])

  const loadHealthData = useCallback(() => {
    const saved = localStorage.getItem("healthMetrics")
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setMetrics(data)
      } catch (error) {
        console.error("Error loading health data:", error)
      }
    }

    const savedGoals = localStorage.getItem("healthGoals")
    if (savedGoals) {
      try {
        const data = JSON.parse(savedGoals)
        setGoals(data)
      } catch (error) {
        console.error("Error loading goals:", error)
      }
    }
  }, [])

  const loadWeeklyData = useCallback(() => {
    const data = whoopTracker.getHistoricalData(7)
    setWeeklyData(data.map((d) => d.sensors))
  }, [])

  const updateMetricsFromTracker = useCallback(() => {
    const trackerData = whoopTracker.getCurrentData()
    setMetrics((prev) => ({
      ...prev,
      steps: trackerData.steps,
      distance: trackerData.distance,
      calories: trackerData.calories,
      activeMinutes: trackerData.activeMinutes,
      heartRate: trackerData.heartRate || prev.heartRate,
      hrv: trackerData.hrv || prev.hrv,
      recovery: trackerData.recovery.score,
      strain: trackerData.strain.score,
      sleep: {
        duration: trackerData.sleep.duration,
        efficiency: trackerData.sleep.efficiency,
        stages: {
          deep: trackerData.sleep.deepSleep,
          light: trackerData.sleep.lightSleep,
          rem: trackerData.sleep.remSleep,
        },
      },
    }))
  }, [])

  const updateMetricsFromEvent = useCallback((eventData: any) => {
    setMetrics((prev) => ({
      ...prev,
      ...eventData,
    }))
  }, [])

  const toggleTracking = async () => {
    if (!isTracking) {
      const success = await whoopTracker.startTracking()
      if (success) {
        setIsTracking(true)
      }
    } else {
      whoopTracker.stopTracking()
      setIsTracking(false)
    }
  }

  const addWater = () => {
    setMetrics((prev) => ({
      ...prev,
      water: Math.min(prev.water + 1, goals.water + 5),
    }))
  }

  const updateWeight = (weight: number) => {
    setMetrics((prev) => ({ ...prev, weight }))
  }

  const getProgress = (current: number, target: number) => Math.min((current / target) * 100, 100)

  const getRecoveryColor = (score: number) => {
    if (score >= 67) return "text-green-500"
    if (score >= 34) return "text-yellow-500"
    return "text-red-500"
  }

  const getStrainColor = (score: number) => {
    if (score >= 15) return "text-red-500"
    if (score >= 10) return "text-yellow-500"
    return "text-green-500"
  }

  // Save data whenever metrics change
  useEffect(() => {
    localStorage.setItem("healthMetrics", JSON.stringify(metrics))
  }, [metrics])

  useEffect(() => {
    localStorage.setItem("healthGoals", JSON.stringify(goals))
  }, [goals])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Health Dashboard</h1>
          <p className="text-muted-foreground">Professional health and fitness tracking</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="tracking" checked={isTracking} onCheckedChange={toggleTracking} />
            <Label htmlFor="tracking" className="flex items-center gap-2">
              {isTracking ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live Tracking
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  Paused
                </>
              )}
            </Label>
          </div>
          <Badge variant={isTracking ? "default" : "secondary"}>{isTracking ? "Active" : "Inactive"}</Badge>
        </div>
      </div>

      {/* Today's Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Recovery Score */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Recovery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getRecoveryColor(metrics.recovery)}`}>{metrics.recovery}%</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="text-xs text-muted-foreground">HRV: {metrics.hrv}ms</div>
              <div className="text-xs text-muted-foreground">RHR: {metrics.heartRate}bpm</div>
            </div>
            <Progress value={metrics.recovery} className="mt-2" />
          </CardContent>
        </Card>

        {/* Strain Score */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Strain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getStrainColor(metrics.strain)}`}>{metrics.strain.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground mt-1">Active: {metrics.activeMinutes}min</div>
            <Progress value={(metrics.strain / 21) * 100} className="mt-2" />
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Footprints className="h-4 w-4" />
              Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.steps.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">Goal: {goals.steps.toLocaleString()}</div>
            <Progress value={getProgress(metrics.steps, goals.steps)} className="mt-2" />
          </CardContent>
        </Card>

        {/* Sleep */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Sleep
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.floor(metrics.sleep.duration / 60)}h {Math.floor(metrics.sleep.duration % 60)}m
            </div>
            <div className="text-xs text-muted-foreground mt-1">Efficiency: {metrics.sleep.efficiency.toFixed(0)}%</div>
            <Progress value={getProgress(metrics.sleep.duration, goals.sleep)} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="sleep">Sleep</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        {/* Today Tab */}
        <TabsContent value="today" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Detailed Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activity Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Distance</div>
                    <div className="text-2xl font-bold">{metrics.distance.toFixed(2)} km</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Calories</div>
                    <div className="text-2xl font-bold">{Math.round(metrics.calories)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Heart Rate</div>
                    <div className="text-2xl font-bold">{metrics.heartRate} bpm</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">HRV</div>
                    <div className="text-2xl font-bold">{metrics.hrv} ms</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={addWater} variant="outline" className="h-16">
                    <div className="text-center">
                      <Droplets className="h-5 w-5 mx-auto mb-1" />
                      <div className="text-xs">Add Water</div>
                    </div>
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="h-16">
                        <div className="text-center">
                          <Scale className="h-5 w-5 mx-auto mb-1" />
                          <div className="text-xs">Log Weight</div>
                        </div>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Log Weight</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="weight">Weight (kg)</Label>
                          <Input
                            id="weight"
                            type="number"
                            step="0.1"
                            placeholder="Enter weight"
                            onChange={(e) => updateWeight(Number.parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button>Save Weight</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" className="h-16">
                    <div className="text-center">
                      <Dumbbell className="h-5 w-5 mx-auto mb-1" />
                      <div className="text-xs">Log Workout</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-16">
                    <div className="text-center">
                      <Moon className="h-5 w-5 mx-auto mb-1" />
                      <div className="text-xs">Sleep Mode</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Water & Nutrition */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                Hydration & Nutrition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Water Intake</span>
                    <span className="text-sm">
                      {metrics.water}/{goals.water} glasses
                    </span>
                  </div>
                  <Progress value={getProgress(metrics.water, goals.water)} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Calories Burned</span>
                    <span className="text-sm">{Math.round(metrics.calories)}</span>
                  </div>
                  <Progress value={getProgress(metrics.calories, goals.calories)} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Active Minutes</span>
                    <span className="text-sm">
                      {metrics.activeMinutes}/{goals.activeMinutes} min
                    </span>
                  </div>
                  <Progress value={getProgress(metrics.activeMinutes, goals.activeMinutes)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Footprints className="h-4 w-4" />
                      <span>Steps</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{metrics.steps.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {getProgress(metrics.steps, goals.steps).toFixed(0)}% of goal
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Distance</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{metrics.distance.toFixed(2)} km</div>
                      <div className="text-xs text-muted-foreground">
                        {(metrics.distance * 0.621371).toFixed(2)} miles
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4" />
                      <span>Calories</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{Math.round(metrics.calories)}</div>
                      <div className="text-xs text-muted-foreground">
                        {getProgress(metrics.calories, goals.calories).toFixed(0)}% of goal
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Heart Rate Zones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Resting</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-2 bg-blue-500 rounded" />
                      <span className="text-sm">50-60 bpm</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fat Burn</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-2 bg-green-500 rounded" />
                      <span className="text-sm">60-70 bpm</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cardio</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-2 bg-yellow-500 rounded" />
                      <span className="text-sm">70-85 bpm</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Peak</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-2 bg-red-500 rounded" />
                      <span className="text-sm">85+ bpm</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium">Current: {metrics.heartRate} bpm</div>
                    <div className="text-xs text-muted-foreground">
                      {metrics.heartRate < 60
                        ? "Resting"
                        : metrics.heartRate < 70
                          ? "Fat Burn"
                          : metrics.heartRate < 85
                            ? "Cardio"
                            : "Peak"}{" "}
                      Zone
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sleep Tab */}
        <TabsContent value="sleep" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5" />
                  Sleep Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold">
                      {Math.floor(metrics.sleep.duration / 60)}h {Math.floor(metrics.sleep.duration % 60)}m
                    </div>
                    <div className="text-sm text-muted-foreground">Total Sleep</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{metrics.sleep.efficiency.toFixed(0)}%</div>
                      <div className="text-xs text-muted-foreground">Efficiency</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {Math.floor(goals.sleep / 60)}h {goals.sleep % 60}m
                      </div>
                      <div className="text-xs text-muted-foreground">Goal</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sleep Stages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Deep Sleep</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-2 bg-blue-600 rounded" />
                      <span className="text-sm">{Math.floor(metrics.sleep.stages.deep)}min</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">REM Sleep</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-2 bg-purple-600 rounded" />
                      <span className="text-sm">{Math.floor(metrics.sleep.stages.rem)}min</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Light Sleep</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-2 bg-green-600 rounded" />
                      <span className="text-sm">{Math.floor(metrics.sleep.stages.light)}min</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Weekly Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Weekly trend charts will be displayed here</p>
                <p className="text-sm">Data visualization coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Daily Goals
              </CardTitle>
              <CardDescription>Customize your daily health and fitness targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="steps-goal">Steps Goal</Label>
                  <Input
                    id="steps-goal"
                    type="number"
                    value={goals.steps}
                    onChange={(e) =>
                      setGoals((prev) => ({
                        ...prev,
                        steps: Number.parseInt(e.target.value) || 10000,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calories-goal">Calories Goal</Label>
                  <Input
                    id="calories-goal"
                    type="number"
                    value={goals.calories}
                    onChange={(e) =>
                      setGoals((prev) => ({
                        ...prev,
                        calories: Number.parseInt(e.target.value) || 2000,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="active-goal">Active Minutes Goal</Label>
                  <Input
                    id="active-goal"
                    type="number"
                    value={goals.activeMinutes}
                    onChange={(e) =>
                      setGoals((prev) => ({
                        ...prev,
                        activeMinutes: Number.parseInt(e.target.value) || 30,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="water-goal">Water Goal (glasses)</Label>
                  <Input
                    id="water-goal"
                    type="number"
                    value={goals.water}
                    onChange={(e) =>
                      setGoals((prev) => ({
                        ...prev,
                        water: Number.parseInt(e.target.value) || 8,
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
