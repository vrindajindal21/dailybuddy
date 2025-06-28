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

  useEffect(() => {
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

        // Trigger Firebase token generation
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            // Import Firebase messaging dynamically
            import('firebase/messaging').then(({ getMessaging, getToken }) => {
              import('../lib/firebase').then((firebaseApp) => {
                const messaging = getMessaging(firebaseApp.default)
                const VAPID_KEY = "BDj5ugh74kaut_pCPDrg04SGaC3Z7HRUcrB6oaxgCTGOATLzaOcFhklUEniJu79_bIOJIT-jMImAvIZUQe047AY"
                
                getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration })
                  .then((currentToken) => {
                    if (currentToken) {
                      let userId = localStorage.getItem('userId')
                      if (!userId) {
                        userId = 'user-' + Math.random().toString(36).substr(2, 16)
                        localStorage.setItem('userId', userId)
                      }
                      // Send token to backend
                      fetch('/api/save-fcm-token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token: currentToken, userId })
                      })
                      console.log('FCM Token generated after permission grant:', currentToken.substring(0, 20) + '...')
                    }
                  })
                  .catch((err) => {
                    console.error('Error generating FCM token:', err)
                  })
              })
            })
          })
        }

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
          <DialogTitle className="flex items-center gap-2">
            {permissionState === "denied" ? (
              <BellOff className="h-5 w-5 text-destructive" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
            Enable Notifications
          </DialogTitle>
          <DialogDescription>
            Notifications allow you to receive important reminders even when the app is in the background. This is
            essential for medication reminders, task due dates, and timer completions.
          </DialogDescription>
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
