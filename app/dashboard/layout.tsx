"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart,
  Clock,
  Calendar,
  CheckSquare,
  Settings,
  Home,
  Menu,
  BookOpen,
  Target,
  Heart,
  DollarSign,
  Bell,
  Pill,
  Activity,
  Globe,
  Check,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { InAppNotification } from "@/components/in-app-notification"
import { PomodoroBackgroundService } from "@/components/pomodoro-background-service"
import { useLanguage } from "@/components/language-provider"
import { SmartPopupSystem } from "@/components/smart-popup-system"
import { GlobalNotificationService } from "@/components/global-notification-service"
import Image from "next/image"
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

function SidebarAutoCloseOnRouteChange() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [pathname, isMobile, setOpenMobile]);
  return null;
}

function SidebarNavLinks({ navItems, pathname }: { navItems: any[]; pathname: string }) {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => { if (isMobile) setOpenMobile(false); }}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
            pathname === item.href ? "bg-muted" : "hover:bg-muted"
          }`}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </Link>
      ))}
    </>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const { language, setLanguage, t } = useLanguage()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  const languages = [
    { value: "en", label: "English", flag: "🇺🇸" },
    { value: "hi", label: "हिंदी", flag: "🇮🇳" },
  ]

  const navItems = [
    { href: "/dashboard", icon: Home, label: t("dashboard") },
    { href: "/dashboard/pomodoro", icon: Clock, label: t("pomodoro") },
    { href: "/dashboard/tasks", icon: CheckSquare, label: t("tasks") },
    { href: "/dashboard/timetable", icon: Calendar, label: t("timetable") },
    { href: "/dashboard/habits", icon: Heart, label: t("habits") },
    { href: "/dashboard/goals", icon: Target, label: t("goals") },
    { href: "/dashboard/budget", icon: DollarSign, label: t("budget") },
    { href: "/dashboard/study", icon: BookOpen, label: t("study") },
    { href: "/dashboard/health", icon: Activity, label: t("health") },
    { href: "/dashboard/medications", icon: Pill, label: t("medications") },
    { href: "/dashboard/reminders", icon: Bell, label: t("reminders") },
    { href: "/dashboard/analytics", icon: BarChart, label: t("analytics") },
    { href: "/dashboard/tutorial", icon: HelpCircle, label: t("tutorial") },
  ]

  return (
    <SidebarProvider>
      <SidebarAutoCloseOnRouteChange />
      <div className="bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 min-h-screen dark:bg-gradient-to-br dark:from-gray-900 dark:via-indigo-900 dark:to-gray-800">
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <nav className="grid gap-2 text-lg font-medium">
                  <SidebarNavLinks navItems={navItems} pathname={pathname} />
                </nav>
              </SheetContent>
            </Sheet>
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <span className="font-bold">DailyBuddy</span>
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="flex items-center gap-1">
                    <Globe className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Change language</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.value}
                      onClick={() => setLanguage(lang.value as any)}
                      className={`flex items-center gap-2 ${language === lang.value ? "bg-muted" : ""}`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                      {language === lang.value && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="rounded-full">
                <Image
                  src="/placeholder.svg"
                  width={32}
                  height={32}
                  className="rounded-full"
                  alt="Avatar"
                />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </div>
          </header>
          <div className="flex flex-1">
            <aside className="hidden w-64 border-r bg-muted/40 md:block">
              <nav className="grid gap-2 p-4 text-sm font-medium">
                <SidebarNavLinks navItems={navItems} pathname={pathname} />
              </nav>
            </aside>
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </div>
        </div>
        <InAppNotification />
        <PomodoroBackgroundService />
        <SmartPopupSystem />
        <GlobalNotificationService />
      </div>
    </SidebarProvider>
  )
}
