"use client";
import React from "react";
import { useEffect, useState } from "react";
import { ThemeProvider } from "./theme-provider";
import { LanguageProvider } from "./language-provider";
import { Toaster } from "./ui/toaster";
import { GlobalNotificationService } from "./global-notification-service";
import { SmartPopupSystem } from "./smart-popup-system";
import { PomodoroBackgroundService } from "./pomodoro-background-service";
import { PomodoroFloatingWidget } from "./pomodoro-floating-widget";
import { InAppNotification } from "./in-app-notification";
import PWARegister from "./pwa-register";
import { NotificationPermissionDialog } from "./notification-permission-dialog";
import { MedicationBackgroundService } from "./medication-background-service";
import { ReminderBackgroundService } from "./reminder-background-service";

export default function RootClientLayout({ children }: { children: React.ReactNode }) {
  // Font size logic
  const [fontSizeClass, setFontSizeClass] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("userSettings");
      let fontSize = "medium";
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          fontSize = settings?.preferences?.fontSize || "medium";
        } catch {}
      }
      let cls = "";
      if (fontSize === "small") cls = "text-sm";
      else if (fontSize === "large") cls = "text-lg";
      else cls = "text-base";
      setFontSizeClass(cls);
    }
  }, []);
  // Listen for font size changes (optional: add event listener for storage changes)
  useEffect(() => {
    function handleStorage() {
      const saved = localStorage.getItem("userSettings");
      let fontSize = "medium";
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          fontSize = settings?.preferences?.fontSize || "medium";
        } catch {}
      }
      let cls = "";
      if (fontSize === "small") cls = "text-sm";
      else if (fontSize === "large") cls = "text-lg";
      else cls = "text-base";
      setFontSizeClass(cls);
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);
  return (
    <>
      <PWARegister />
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <LanguageProvider>
          <InAppNotification />
          <div className={fontSizeClass}>
            {children}
          </div>
          <Toaster />
          <GlobalNotificationService />
          <SmartPopupSystem />
          <PomodoroBackgroundService />
          <MedicationBackgroundService />
          <ReminderBackgroundService />
          <PomodoroFloatingWidget />
          <NotificationPermissionDialog />
        </LanguageProvider>
      </ThemeProvider>
    </>
  );
} 