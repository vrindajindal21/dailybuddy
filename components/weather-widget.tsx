"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Snowflake,
  CloudLightning,
  Loader2,
  MapPin,
  RefreshCw,
  Thermometer,
  Droplets,
  Eye,
  Gauge,
} from "lucide-react"

export function WeatherWidget() {
  const { toast } = useToast()
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [location, setLocation] = useState({ lat: null, lon: null, name: "Getting location..." })
  const [isComingSoon] = useState(true) // Toggle this to enable/disable coming soon mode

  // Enhanced weather data fetch with more realistic data
  const fetchWeather = async (lat, lon) => {
    setLoading(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200))

      // Enhanced location detection
      let locationName = "Unknown Location"
      const cities = [
        { name: "New York, NY", lat: 40.7128, lon: -74.006, timezone: "America/New_York" },
        { name: "London, UK", lat: 51.5074, lon: -0.1278, timezone: "Europe/London" },
        { name: "Tokyo, Japan", lat: 35.6762, lon: 139.6503, timezone: "Asia/Tokyo" },
        { name: "Sydney, Australia", lat: -33.8688, lon: 151.2093, timezone: "Australia/Sydney" },
        { name: "Mumbai, India", lat: 19.076, lon: 72.8777, timezone: "Asia/Kolkata" },
        { name: "Los Angeles, CA", lat: 34.0522, lon: -118.2437, timezone: "America/Los_Angeles" },
        { name: "Paris, France", lat: 48.8566, lon: 2.3522, timezone: "Europe/Paris" },
        { name: "Berlin, Germany", lat: 52.52, lon: 13.405, timezone: "Europe/Berlin" },
        { name: "Dubai, UAE", lat: 25.2048, lon: 55.2708, timezone: "Asia/Dubai" },
        { name: "Singapore", lat: 1.3521, lon: 103.8198, timezone: "Asia/Singapore" },
      ]

      const closest = cities.reduce((prev, curr) => {
        const prevDist = Math.abs(prev.lat - lat) + Math.abs(prev.lon - lon)
        const currDist = Math.abs(curr.lat - lat) + Math.abs(curr.lon - lon)
        return currDist < prevDist ? curr : prev
      })

      if (Math.abs(closest.lat - lat) < 1 && Math.abs(closest.lon - lon) < 1) {
        locationName = closest.name
      } else {
        locationName = `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`
      }

      // Enhanced weather generation with more realistic patterns
      const now = new Date()
      const month = now.getMonth() + 1
      const hour = now.getHours()
      const isNorthern = lat > 0

      let baseTemp = 20
      let conditions = ["Clear", "Partly Cloudy", "Cloudy", "Light Rain"]
      let humidity = 50
      let windSpeed = 10
      let pressure = 1013
      let visibility = 10
      let uvIndex = 5

      // Seasonal adjustments
      if (month >= 12 || month <= 2) {
        baseTemp = isNorthern ? 5 : 28
        conditions = ["Clear", "Cloudy", "Snow", "Windy", "Overcast"]
        humidity = 65
        uvIndex = 2
      } else if (month >= 6 && month <= 8) {
        baseTemp = isNorthern ? 28 : 8
        conditions = ["Clear", "Partly Cloudy", "Thunderstorm", "Hot"]
        humidity = 45
        uvIndex = 8
      } else if (month >= 3 && month <= 5) {
        baseTemp = isNorthern ? 18 : 22
        conditions = ["Clear", "Partly Cloudy", "Light Rain", "Breezy"]
        humidity = 55
        uvIndex = 6
      } else {
        baseTemp = isNorthern ? 22 : 18
        conditions = ["Clear", "Partly Cloudy", "Cloudy", "Light Rain"]
        humidity = 60
        uvIndex = 4
      }

      // Latitude and coastal adjustments
      baseTemp += (30 - Math.abs(lat)) * 0.3
      if (Math.abs(lon) > 100) windSpeed += 5 // Coastal areas windier

      // Time of day adjustments
      if (hour >= 6 && hour <= 18) {
        baseTemp += Math.sin(((hour - 6) * Math.PI) / 12) * 8
      } else {
        baseTemp -= 5
        uvIndex = 0
      }

      // Add realistic randomness
      const temperature = Math.round(baseTemp + (Math.random() - 0.5) * 8)
      const condition = conditions[Math.floor(Math.random() * conditions.length)]

      // Adjust other parameters based on condition
      if (condition.includes("Rain")) {
        humidity += 20
        visibility -= 3
        pressure -= 10
      } else if (condition === "Clear") {
        humidity -= 10
        visibility = 15
        pressure += 5
      }

      const mockWeatherData = {
        temperature,
        condition,
        humidity: Math.max(20, Math.min(95, humidity + Math.floor((Math.random() - 0.5) * 20))),
        windSpeed: Math.max(0, windSpeed + Math.floor((Math.random() - 0.5) * 10)),
        feelsLike: temperature + Math.floor((Math.random() - 0.5) * 6),
        pressure: Math.round(pressure + (Math.random() - 0.5) * 20),
        visibility: Math.max(1, Math.min(15, visibility + (Math.random() - 0.5) * 4)),
        uvIndex: Math.max(0, Math.min(11, uvIndex + Math.floor((Math.random() - 0.5) * 2))),
        sunrise: "06:45 AM",
        sunset: "07:30 PM",
        description: getWeatherDescription(condition, temperature),
        forecast: generateForecast(temperature, condition),
      }

      setWeather(mockWeatherData)
      setLocation({ lat, lon, name: locationName })
      setLoading(false)
    } catch (err) {
      console.error("Error fetching weather:", err)
      setError("Failed to fetch weather data. Please try again.")
      setLoading(false)
    }
  }

  // Generate 5-day forecast
  const generateForecast = (baseTemp, baseCondition) => {
    const conditions = ["Clear", "Partly Cloudy", "Cloudy", "Light Rain", "Thunderstorm"]
    const forecast = []

    for (let i = 1; i <= 5; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)

      forecast.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        high: Math.round(baseTemp + (Math.random() - 0.5) * 10),
        low: Math.round(baseTemp - 8 + (Math.random() - 0.5) * 6),
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        precipitation: Math.floor(Math.random() * 40),
      })
    }

    return forecast
  }

  // Get weather description
  const getWeatherDescription = (condition, temp) => {
    const descriptions = {
      Clear: temp > 25 ? "Sunny and warm" : temp > 15 ? "Clear skies" : "Clear but cool",
      "Partly Cloudy": temp > 20 ? "Pleasant with some clouds" : "Partly cloudy",
      Cloudy: "Overcast skies",
      "Light Rain": temp > 15 ? "Light showers" : "Cold and rainy",
      Snow: "Snow expected",
      Thunderstorm: "Thunderstorms possible",
      Windy: "Windy conditions",
      Hot: "Hot and sunny",
      Overcast: "Gray and overcast",
      Breezy: "Light breeze",
    }
    return descriptions[condition] || "Weather conditions"
  }

  // Enhanced location detection
  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        const cachedLocation = localStorage.getItem("userLocation")
        if (cachedLocation) {
          try {
            const { lat, lon, timestamp } = JSON.parse(cachedLocation)
            if (Date.now() - timestamp < 30 * 60 * 1000) {
              // 30 minutes cache
              fetchWeather(lat, lon)
              return
            }
          } catch (e) {
            console.log("Invalid cached location")
          }
        }

        const timeoutId = setTimeout(() => {
          console.log("Geolocation timeout, using default location")
          const defaultLocation = { lat: 40.7128, lon: -74.006 }
          setLocation({ ...defaultLocation, name: "New York, NY (Default)" })
          fetchWeather(defaultLocation.lat, defaultLocation.lon)
        }, 5000)

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId)
            const { latitude, longitude } = position.coords

            localStorage.setItem(
              "userLocation",
              JSON.stringify({
                lat: latitude,
                lon: longitude,
                timestamp: Date.now(),
              }),
            )

            fetchWeather(latitude, longitude)
          },
          (error) => {
            clearTimeout(timeoutId)
            console.error("Geolocation error:", error)
            tryIPLocation()
          },
          {
            timeout: 4000,
            enableHighAccuracy: false,
            maximumAge: 600000, // 10 minutes
          },
        )
      } else {
        tryIPLocation()
      }
    }

    const tryIPLocation = async () => {
      try {
        // Simulate IP-based location
        const mockLocations = [
          { lat: 40.7128, lon: -74.006, city: "New York", country: "United States" },
          { lat: 51.5074, lon: -0.1278, city: "London", country: "United Kingdom" },
          { lat: 35.6762, lon: 139.6503, city: "Tokyo", country: "Japan" },
        ]

        const randomLocation = mockLocations[Math.floor(Math.random() * mockLocations.length)]
        setLocation({
          lat: randomLocation.lat,
          lon: randomLocation.lon,
          name: `${randomLocation.city}, ${randomLocation.country}`,
        })
        fetchWeather(randomLocation.lat, randomLocation.lon)
      } catch (e) {
        const defaultLocation = { lat: 40.7128, lon: -74.006 }
        setLocation({ ...defaultLocation, name: "New York, NY (Default)" })
        fetchWeather(defaultLocation.lat, defaultLocation.lon)

        toast({
          title: "Location unavailable",
          description: "Using default location. Enable location access for accurate weather.",
          duration: 3000,
        })
      }
    }

    getUserLocation()
  }, [])

  const handleRefresh = () => {
    if (location.lat && location.lon) {
      fetchWeather(location.lat, location.lon)
    }
  }

  // Enhanced weather icons
  const getWeatherIcon = (condition) => {
    switch (condition) {
      case "Clear":
        return <Sun className="h-12 w-12 text-yellow-500" />
      case "Partly Cloudy":
        return <Cloud className="h-12 w-12 text-gray-400" />
      case "Cloudy":
      case "Overcast":
        return <Cloud className="h-12 w-12 text-gray-500" />
      case "Light Rain":
        return <CloudRain className="h-12 w-12 text-blue-500" />
      case "Snow":
        return <Snowflake className="h-12 w-12 text-blue-300" />
      case "Thunderstorm":
        return <CloudLightning className="h-12 w-12 text-purple-500" />
      case "Windy":
      case "Breezy":
        return <Wind className="h-12 w-12 text-gray-400" />
      case "Hot":
        return <Sun className="h-12 w-12 text-orange-500" />
      default:
        return <Cloud className="h-12 w-12 text-gray-500" />
    }
  }

  const getUVIndexColor = (uvIndex) => {
    if (uvIndex <= 2) return "text-green-500"
    if (uvIndex <= 5) return "text-yellow-500"
    if (uvIndex <= 7) return "text-orange-500"
    if (uvIndex <= 10) return "text-red-500"
    return "text-purple-500"
  }

  if (isComingSoon) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900" />
        <CardHeader className="relative">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-yellow-500" />
                Weather
                <Badge variant="secondary" className="ml-2">
                  Coming Soon
                </Badge>
              </CardTitle>
              <CardDescription className="flex items-center mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                Advanced weather tracking
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-center py-8">
            <div className="mb-4">
              <Sun className="h-16 w-16 text-yellow-500 mx-auto mb-2 animate-pulse" />
              <CloudRain className="h-12 w-12 text-blue-500 mx-auto -mt-6 ml-8 animate-bounce" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Advanced Weather Features</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get detailed weather insights, forecasts, and personalized recommendations
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-red-400" />
                <span>Real-time temperature</span>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-400" />
                <span>Humidity & precipitation</span>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-gray-400" />
                <span>Wind speed & direction</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-400" />
                <span>Visibility & UV index</span>
              </div>
            </div>
            <Button variant="outline" className="mt-4" disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Coming Soon
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {weather && getWeatherIcon(weather.condition)}
              Weather
            </CardTitle>
            <CardDescription className="flex items-center mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              {location.name}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Getting weather data...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Try Again
            </Button>
          </div>
        ) : weather ? (
          <div className="space-y-6">
            {/* Current Weather */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getWeatherIcon(weather.condition)}
                <div>
                  <div className="text-4xl font-bold">{weather.temperature}°C</div>
                  <div className="text-sm text-muted-foreground">Feels like {weather.feelsLike}°C</div>
                  <div className="text-sm font-medium">{weather.condition}</div>
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="text-xs text-muted-foreground">{weather.description}</div>
                <Badge variant="outline">{weather.humidity}% humidity</Badge>
              </div>
            </div>

            {/* Weather Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-gray-500" />
                <span>{weather.windSpeed} km/h</span>
              </div>
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-blue-500" />
                <span>{weather.pressure} hPa</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-500" />
                <span>{weather.visibility} km</span>
              </div>
              <div className="flex items-center gap-2">
                <Sun className={`h-4 w-4 ${getUVIndexColor(weather.uvIndex)}`} />
                <span>UV {weather.uvIndex}</span>
              </div>
            </div>

            {/* 5-Day Forecast */}
            {weather.forecast && (
              <div>
                <h4 className="font-medium mb-3">5-Day Forecast</h4>
                <div className="space-y-2">
                  {weather.forecast.map((day, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium w-12">{day.day}</div>
                        <div className="text-xs text-muted-foreground w-16">{day.date}</div>
                        {getWeatherIcon(day.condition)}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">{day.precipitation}%</span>
                        <span className="font-medium">{day.high}°</span>
                        <span className="text-muted-foreground">{day.low}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sun Times */}
            <div className="flex justify-between text-sm pt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-orange-400" />
                <span>Sunrise: {weather.sunrise}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-orange-600" />
                <span>Sunset: {weather.sunset}</span>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
