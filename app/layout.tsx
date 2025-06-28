import React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "../components/theme-provider"
import { LanguageProvider } from "../components/language-provider"
import { Toaster } from "../components/ui/toaster"
import { GlobalNotificationService } from "../components/global-notification-service"
import { SmartPopupSystem } from "../components/smart-popup-system"
import { PomodoroBackgroundService } from "../components/pomodoro-background-service"
import { PomodoroFloatingWidget } from "../components/pomodoro-floating-widget"
import { ReminderManager } from "../lib/reminder-manager"
import RootClientLayout from "../components/RootClientLayout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DailyBuddy - Your Friendly Productivity Companion",
  description: "DailyBuddy helps you thrive with smart reminders, health tracking, and a friendly touch for all ages.",
  manifest: "/manifest.json",
  generator: 'v0.dev'
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: "no",
  themeColor: "#000000",
};

// Ensure reminders are always checked globally
if (typeof window !== "undefined") {
  ReminderManager.initialize()
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className + " bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 min-h-screen dark:bg-gradient-to-br dark:from-gray-900 dark:via-indigo-900 dark:to-gray-800"}>
        <RootClientLayout>{children}</RootClientLayout>
      </body>
    </html>
  )
}
