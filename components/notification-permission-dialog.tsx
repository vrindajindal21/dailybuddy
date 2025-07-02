"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, AlertTriangle } from "lucide-react"
import { NotificationService } from "@/lib/notification-service"
import { useToast } from "@/components/ui/use-toast"

export function NotificationPermissionDialog() {
  const [open, setOpen] = useState(false)
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default")
  const { toast } = useToast()
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent || window.navigator.vendor || (window as any).opera
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream)
    // Check if notifications are supported
    if (NotificationService.isSupported()) {
      const currentPermission = NotificationService.getPermissionState()
      setPermissionState(currentPermission)

      // Show dialog if permission is not granted or denied
      if (currentPermission === "default") {
        setOpen(true)
      }
    }
  }, [])

  const handleRequestPermission = async () => {
    try {
      const granted = await NotificationService.requestPermission()
      setPermissionState(granted ? "granted" : "denied")

      if (granted) {
        toast({
          title: "Notifications enabled",
          description: "You will now receive important reminders and alerts.",
        })

        // Test notification
        setTimeout(() => {
          NotificationService.showNotification("Notifications are working!", {
            body: "You will now receive reminders even when the app is in the background.",
            icon: '/android-chrome-192x192.png'
          })
        }, 1000)
      } else {
        toast({
          title: "Notifications disabled",
          description: "You will not receive reminders when the app is in the background.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      toast({
        title: "Error",
        description: "Failed to enable notifications. Please try again.",
        variant: "destructive",
      })
    }

    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enable Notifications</DialogTitle>
          <DialogDescription>Allow notifications to receive important updates and reminders.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-start gap-4 mb-4">
            <AlertTriangle className="h-10 w-10 text-yellow-500 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium mb-1">Why notifications matter:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                <li>Get medication reminders exactly when needed</li>
                <li>Never miss important task deadlines</li>
                <li>Receive timer alerts even when the app is closed</li>
                <li>Stay on track with your habits and goals</li>
              </ul>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            You can always change this setting later in your browser settings.
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Not Now
          </Button>
          <Button onClick={handleRequestPermission} className="flex-1">
            <Bell className="mr-2 h-4 w-4" />
            Enable Notifications
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
