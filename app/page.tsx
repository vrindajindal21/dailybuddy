'use client'

import React from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import Image from "next/image"

export default function Home() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)
  const installButtonRef = useRef(null)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      (deferredPrompt as any).prompt()
      const { outcome } = await (deferredPrompt as any).userChoice
      if (outcome === "accepted") {
        setShowInstall(false)
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100">
      <header className="px-4 lg:px-6 h-16 flex items-center justify-between w-full bg-white/80 shadow-sm sticky top-0 z-10">
        <span className="font-bold text-xl flex items-center gap-2">
          <Image src="/placeholder-logo.svg" alt="DailyBuddy Logo" width={32} height={32} className="h-8 w-auto" />
          DailyBuddy
        </span>
        <nav className="flex gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#features">Features</Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#about">About</Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#contact">Contact</Link>
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 animate-fade-in">
        <div className="flex flex-col items-center gap-4 mt-8 mb-8">
          <Image src="/placeholder-logo.svg" alt="DailyBuddy Logo" width={64} height={64} className="h-16 w-auto mb-2 drop-shadow-lg animate-bounce" />
          <h1 className="text-3xl md:text-5xl font-extrabold mb-2 text-gray-900 drop-shadow-sm">Meet Your DailyBuddy</h1>
          <p className="text-lg md:text-2xl text-gray-700 max-w-xl mb-4">
            Your friendly companion for a brighter, more organized day. Plan, grow, and thrive with a buddy by your side—no matter your age or dream!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-xs mx-auto">
            <Link href="/dashboard">
              <Button className="h-12 px-8 text-base font-semibold flex items-center justify-center w-full bg-gradient-to-r from-pink-400 to-blue-400 text-white shadow-lg animate-pulse">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" className="h-12 px-8 text-base font-semibold w-full bg-white/80">
                Learn More
              </Button>
            </Link>
          </div>
          {showInstall && (
            <Button
              ref={installButtonRef}
              onClick={handleInstallClick}
              className="mt-4 h-12 px-8 text-base font-semibold w-full bg-green-500 text-white shadow-lg animate-bounce"
            >
              Install DailyBuddy App
            </Button>
          )}
        </div>
        <section id="features" className="w-full max-w-2xl mx-auto py-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Features for Every Buddy</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
            <Feature icon="⏲️" label="Pomodoro Timer" desc="Stay focused with fun work sessions" />
            <Feature icon="✅" label="Task Management" desc="Track assignments and to-dos" />
            <Feature icon="📅" label="Timetable" desc="Organize your schedule easily" />
            <Feature icon="🌱" label="Habit Tracker" desc="Build positive daily habits" />
            <Feature icon="🎯" label="Goal Setting" desc="Set and achieve your dreams" />
            <Feature icon="🚫📱" label="Focus Mode" desc="Block distractions, boost focus" />
            <Feature icon="💧" label="Health Reminders" desc="Stay hydrated and healthy" />
            <Feature icon="👨‍👩‍👧‍👦" label="Family Features" desc="Share and grow together" />
            <Feature icon="🧠" label="Brain Games" desc="Sharpen your mind with fun" />
            <Feature icon="🤖" label="AI Suggestions" desc="Smart tips for your day" />
            <Feature icon="🔔" label="Reminders" desc="Never miss what's important" />
            <Feature icon="☀️" label="Daily Quotes" desc="Start each day inspired" />
          </div>
        </section>
        <section className="w-full max-w-xl mx-auto py-8" id="about">
          <blockquote className="italic text-lg text-gray-600 bg-white/70 rounded-lg p-4 shadow-md mb-4">
            "Self-care is the best productivity hack. Let your DailyBuddy help you shine!"
            <span className="block mt-2 text-sm text-gray-400">— The DailyBuddy Team</span>
          </blockquote>
          <div className="text-base text-gray-700 mt-2">
            Made with love by <span className="font-semibold text-pink-600">Vrinda Jindal</span>, for everyone who wants a brighter, more organized day.
          </div>
        </section>
      </main>
      <footer className="py-6 w-full flex flex-col items-center border-t mt-auto bg-white/80">
        <p className="text-xs text-gray-500">© 2025 DailyBuddy. Crafted with ❤️ by Vrinda Jindal.</p>
        <div className="flex gap-4 mt-2">
          <a
            href="https://wa.me/?text=Check%20out%20DailyBuddy%20%E2%80%93%20your%20friendly%20companion%20for%20a%20brighter%2C%20more%20organized%20day!%20Try%20it%20now%3A%20https%3A%2F%2Freadyapp-zeta.vercel.app%2F"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on WhatsApp"
            className="hover:text-green-500 flex items-center gap-1"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 32 32"><path d="M16.002 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.6 4.47 1.74 6.41L3.2 28.8l6.56-1.71c1.87 1.02 3.98 1.56 6.24 1.56h.01c7.06 0 12.8-5.74 12.8-12.8s-5.74-12.8-12.8-12.8zm0 23.36c-2.01 0-3.98-.54-5.68-1.56l-.41-.24-3.89 1.01 1.04-3.78-.27-.39c-1.09-1.6-1.67-3.47-1.67-5.41 0-5.44 4.43-9.87 9.87-9.87s9.87 4.43 9.87 9.87-4.43 9.87-9.87 9.87zm5.41-7.47c-.3-.15-1.77-.87-2.05-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.51-1.78-1.69-2.08-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.64-.93-2.25-.24-.58-.48-.5-.68-.51-.18-.01-.37-.01-.57-.01-.2 0-.52.07-.8.37-.28.3-1.05 1.03-1.05 2.5 0 1.47 1.08 2.89 1.23 3.09.15.2 2.13 3.25 5.17 4.43.72.31 1.28.5 1.72.64.72.23 1.37.2 1.88.12.57-.09 1.77-.72 2.02-1.41.25-.69.25-1.28.18-1.41-.07-.13-.27-.2-.57-.35z"/></svg>
            <span className="text-sm">Share on WhatsApp</span>
          </a>
          <a
            href="https://web.whatsapp.com/send?text=Check%20out%20DailyBuddy%20%E2%80%93%20your%20friendly%20companion%20for%20a%20brighter%2C%20more%20organized%20day!%20Try%20it%20now%3A%20https%3A%2F%2Freadyapp-zeta.vercel.app%2F"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share on WhatsApp Web"
            className="hover:text-green-600 flex items-center gap-1"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 32 32"><path d="M16.002 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.6 4.47 1.74 6.41L3.2 28.8l6.56-1.71c1.87 1.02 3.98 1.56 6.24 1.56h.01c7.06 0 12.8-5.74 12.8-12.8s-5.74-12.8-12.8-12.8zm0 23.36c-2.01 0-3.98-.54-5.68-1.56l-.41-.24-3.89 1.01 1.04-3.78-.27-.39c-1.09-1.6-1.67-3.47-1.67-5.41 0-5.44 4.43-9.87 9.87-9.87s9.87 4.43 9.87 9.87-4.43 9.87-9.87 9.87zm5.41-7.47c-.3-.15-1.77-.87-2.05-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.51-1.78-1.69-2.08-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.64-.93-2.25-.24-.58-.48-.5-.68-.51-.18-.01-.37-.01-.57-.01-.2 0-.52.07-.8.37-.28.3-1.05 1.03-1.05 2.5 0 1.47 1.08 2.89 1.23 3.09.15.2 2.13 3.25 5.17 4.43.72.31 1.28.5 1.72.64.72.23 1.37.2 1.88.12.57-.09 1.77-.72 2.02-1.41.25-.69.25-1.28.18-1.41-.07-.13-.27-.2-.57-.35z"/></svg>
            <span className="text-sm">Share on WhatsApp Web</span>
          </a>
          <span className="text-xs text-gray-400 select-all">https://readyapp-zeta.vercel.app/</span>
        </div>
      </footer>
    </div>
  )
}

function Feature({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div className="flex flex-col items-center bg-white/80 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200">
      <span className="text-3xl md:text-4xl mb-2 animate-bounce">{icon}</span>
      <span className="font-semibold text-base md:text-lg text-gray-800 mb-1">{label}</span>
      <span className="text-xs md:text-sm text-gray-500 text-center">{desc}</span>
    </div>
  )
}
