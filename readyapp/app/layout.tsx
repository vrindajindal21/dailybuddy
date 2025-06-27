import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/language-provider"
import { Toaster } from "@/components/ui/toaster"
import { GlobalNotificationService } from "@/components/global-notification-service"
import { SmartPopupSystem } from "@/components/smart-popup-system"
import { PomodoroBackgroundService } from "@/components/pomodoro-background-service"
import { PomodoroFloatingWidget } from "@/components/pomodoro-floating-widget"
import { ReminderManager } from "@/lib/reminder-manager"
import { InAppNotification } from "@/components/in-app-notification"
import PWARegister from "@/components/pwa-register"
import FirebaseMessagingClient from "@/components/FirebaseMessagingClient"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DailyBuddy - Your Friendly Productivity Companion",
  description: "DailyBuddy helps you thrive with smart reminders, health tracking, and a friendly touch for all ages.",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  generator: 'v0.dev'
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: "no",
};

// Ensure reminders are always checked globally
if (typeof window !== "undefined") {
  ReminderManager.initialize()
}

// This layout enables push notifications for all features (Pomodoro, Reminders, Medication, Task, Goal, Timetable, Habit)
// via the useFirebaseMessaging hook and Toaster for foreground notifications.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className + " bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 min-h-screen dark:bg-gradient-to-br dark:from-gray-900 dark:via-indigo-900 dark:to-gray-800"}>
        <FirebaseMessagingClient />
        <PWARegister />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            <InAppNotification />
            {children}
            <Toaster />
            <GlobalNotificationService />
            <SmartPopupSystem />
            <PomodoroBackgroundService />
            <PomodoroFloatingWidget />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
