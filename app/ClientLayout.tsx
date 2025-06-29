"use client";
import React, { useEffect, useState } from "react";
import { Inter } from "next/font/google";
import { ThemeProvider } from "../components/theme-provider";
import { LanguageProvider } from "../components/language-provider";
import { Toaster } from "../components/ui/toaster";
import { GlobalNotificationService } from "../components/global-notification-service";
import { SmartPopupSystem } from "../components/smart-popup-system";
import { PomodoroBackgroundService } from "../components/pomodoro-background-service";
import { PomodoroFloatingWidget } from "../components/pomodoro-floating-widget";
import { InAppNotification } from "../components/in-app-notification";
import PWARegister from "../components/pwa-register";

const inter = Inter({ subsets: ["latin"] });

export default function ClientLayout({ children }: { children: React.ReactNode }) {
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
    <body className={inter.className + " " + fontSizeClass + " bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 min-h-screen dark:bg-gradient-to-br dark:from-gray-900 dark:via-indigo-900 dark:to-gray-800"}>
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
  );
} 