"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = "en" | "hi"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    pomodoro: "Pomodoro Timer",
    tasks: "Tasks",
    timetable: "Timetable",
    habits: "Habits",
    goals: "Goals",
    budget: "Budget",
    study: "Study",
    medications: "Medications",
    reminders: "Reminders",
    analytics: "Analytics",
    settings: "Settings",
    health: "Health Tracker",
    dailyBuddy: "DailyBuddy",
    tutorial: "Tutorial",

    // Common
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    complete: "Complete",
    start: "Start",
    stop: "Stop",
    pause: "Pause",
    resume: "Resume",
    reset: "Reset",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    warning: "Warning",
    info: "Information",
    yes: "Yes",
    no: "No",
    ok: "OK",
    close: "Close",
    back: "Back",
    next: "Next",
    previous: "Previous",
    skip: "Skip",
    finish: "Finish",
    getStarted: "Get Started",

    // Tutorial
    welcomeToDailyBuddy: "Welcome to DailyBuddy!",
    tutorialDescription: "Let's take a quick tour to help you get the most out of your productivity app.",
    tutorialStep1Title: "Dashboard Overview",
    tutorialStep1Description:
      "Your dashboard shows an overview of your daily activities, pending tasks, and progress tracking.",
    tutorialStep2Title: "Pomodoro Timer",
    tutorialStep2Description:
      "Use the Pomodoro technique to stay focused. Set work sessions with breaks to maximize productivity.",
    tutorialStep3Title: "Task Management",
    tutorialStep3Description:
      "Create, organize, and track your tasks. Set priorities and deadlines to stay on top of your work.",
    tutorialStep4Title: "Health Tracking",
    tutorialStep4Description:
      "Monitor your health metrics like steps, sleep, heart rate, and recovery scores like Whoop.",
    tutorialStep5Title: "Smart Reminders",
    tutorialStep5Description:
      "Set up intelligent reminders for medications, habits, and important tasks with rich notifications.",
    tutorialStep6Title: "AI Assistant",
    tutorialStep6Description: "Get personalized productivity insights and recommendations from our AI assistant.",
    tutorialComplete: "Tutorial Complete!",
    tutorialCompleteDescription: "You're all set! Start using DailyBuddy to boost your productivity.",
    startTutorial: "Start Tutorial",
    skipTutorial: "Skip Tutorial",
    tutorialProgress: "Tutorial Progress",

    // How to Use sections
    howToUse: "How to Use",
    gettingStarted: "Getting Started",
    basicFeatures: "Basic Features",
    advancedFeatures: "Advanced Features",
    tips: "Tips & Tricks",
    troubleshooting: "Troubleshooting",

    // Getting Started Guide
    step1: "Step 1: Set Up Your Profile",
    step1Description:
      "Go to Settings and update your personal information, language preference, and notification settings.",
    step2: "Step 2: Create Your First Task",
    step2Description: "Navigate to Tasks and create your first task with a title, description, and due date.",
    step3: "Step 3: Start a Pomodoro Session",
    step3Description: "Use the Pomodoro Timer to work in focused 25-minute sessions with 5-minute breaks.",
    step4: "Step 4: Set Up Health Tracking",
    step4Description: "Enable health tracking to monitor your daily steps, sleep, and other wellness metrics.",
    step5: "Step 5: Configure Reminders",
    step5Description: "Set up smart reminders for medications, habits, and important tasks.",

    // Feature Guides
    pomodoroGuide: "Pomodoro Timer Guide",
    pomodoroGuideDescription: "The Pomodoro Technique helps you stay focused by breaking work into intervals.",
    pomodoroStep1: "1. Choose a task to work on",
    pomodoroStep2: "2. Set the timer for 25 minutes",
    pomodoroStep3: "3. Work on the task until the timer rings",
    pomodoroStep4: "4. Take a short 5-minute break",
    pomodoroStep5: "5. After 4 pomodoros, take a longer 15-30 minute break",

    taskGuide: "Task Management Guide",
    taskGuideDescription: "Organize your work and personal tasks efficiently.",
    taskStep1: "1. Click 'Add Task' to create a new task",
    taskStep2: "2. Set title, description, priority, and due date",
    taskStep3: "3. Use categories to organize tasks",
    taskStep4: "4. Mark tasks as complete when finished",
    taskStep5: "5. Use filters to view specific task types",

    healthGuide: "Health Tracking Guide",
    healthGuideDescription: "Monitor your wellness with comprehensive health tracking.",
    healthStep1: "1. Enable location and motion permissions",
    healthStep2: "2. Wear your device throughout the day",
    healthStep3: "3. Check your daily recovery score",
    healthStep4: "4. Monitor strain levels during activities",
    healthStep5: "5. Track sleep quality and duration",

    reminderGuide: "Smart Reminders Guide",
    reminderGuideDescription: "Never miss important tasks with intelligent reminders.",
    reminderStep1: "1. Click 'Add Reminder' to create new reminders",
    reminderStep2: "2. Set title, description, and category",
    reminderStep3: "3. Configure schedule with specific times and days",
    reminderStep4: "4. Choose notification sound and volume",
    reminderStep5: "5. Enable push notifications for best experience",

    // Tips
    tip1: "Tip 1: Use keyboard shortcuts for faster navigation",
    tip2: "Tip 2: Enable notifications to never miss reminders",
    tip3: "Tip 3: Review your analytics weekly to track progress",
    tip4: "Tip 4: Use the AI assistant for personalized insights",
    tip5: "Tip 5: Set realistic goals and celebrate achievements",

    // Language
    selectLanguage: "Select Language",
    english: "English",
    hindi: "हिंदी",
  },
  hi: {
    // Navigation
    dashboard: "डैशबोर्ड",
    pomodoro: "पोमोडोरो टाइमर",
    tasks: "कार्य",
    timetable: "समय सारणी",
    habits: "आदतें",
    goals: "लक्ष्य",
    budget: "बजट",
    study: "अध्ययन",
    medications: "दवाइयां",
    reminders: "अनुस्मारक",
    analytics: "विश्लेषण",
    settings: "सेटिंग्स",
    health: "स्वास्थ्य ट्रैकर",
    dailyBuddy: "दैनिक बुद्धि",
    tutorial: "ट्यूटोरियल",

    // Common
    save: "सेव करें",
    cancel: "रद्द करें",
    delete: "हटाएं",
    edit: "संपादित करें",
    add: "जोड़ें",
    complete: "पूरा करें",
    start: "शुरू करें",
    stop: "रोकें",
    pause: "रोकें",
    resume: "फिर से शुरू करें",
    reset: "रीसेट करें",
    loading: "लोड हो रहा है...",
    error: "त्रुटि",
    success: "सफलता",
    warning: "चेतावनी",
    info: "जानकारी",
    yes: "हां",
    no: "नहीं",
    ok: "ठीक है",
    close: "बंद करें",
    back: "वापस",
    next: "अगला",
    previous: "पिछला",
    skip: "छोड़ें",
    finish: "समाप्त करें",
    getStarted: "शुरू करें",

    // Tutorial
    welcomeToDailyBuddy: "दैनिक बुद्धि में आपका स्वागत है!",
    tutorialDescription: "आइए एक त्वरित दौरा करते हैं जो आपको अपने उत्पादकता ऐप का अधिकतम लाभ उठाने में मदद करेगा।",
    tutorialStep1Title: "डैशबोर्ड अवलोकन",
    tutorialStep1Description: "आपका डैशबोर्ड आपकी दैनिक गतिविधियों, लंबित कार्यों और प्रगति ट्रैकिंग का अवलोकन दिखाता है।",
    tutorialStep2Title: "पोमोडोरो टाइमर",
    tutorialStep2Description:
      "केंद्रित रहने के लिए पोमोडोरो तकनीक का उपयोग करें। उत्पादकता को अधिकतम करने के लिए ब्रेक के साथ कार्य सत्र सेट करें।",
    tutorialStep3Title: "कार्य प्रबंधन",
    tutorialStep3Description:
      "अपने कार्यों को बनाएं, व्यवस्थित करें और ट्रैक करें। अपने काम पर बने रहने के लिए प्राथमिकताएं और समय सीमा निर्धारित करें।",
    tutorialStep4Title: "स्वास्थ्य ट्रैकिंग",
    tutorialStep4Description: "व्हूप की तरह कदम, नींद, हृदय गति और रिकवरी स्कोर जैसे अपने स्वास्थ्य मेट्रिक्स की निगरानी करें।",
    tutorialStep5Title: "स्मार्ट अनुस्मारक",
    tutorialStep5Description: "रिच नोटिफिकेशन के साथ दवाओं, आदतों और महत्वपूर्ण कार्यों के लिए बुद्धिमान अनुस्मारक सेट करें।",
    tutorialStep6Title: "एआई सहायक",
    tutorialStep6Description: "हमारे एआई सहायक से व्यक्तिगत उत्पादकता अंतर्दृष्टि और सिफारिशें प्राप्त करें।",
    tutorialComplete: "ट्यूटोरियल पूरा!",
    tutorialCompleteDescription: "आप तैयार हैं! अपनी उत्पादकता बढ़ाने के लिए दैनिक बुद्धि का उपयोग शुरू करें।",
    startTutorial: "ट्यूटोरियल शुरू करें",
    skipTutorial: "ट्यूटोरियल छोड़ें",
    tutorialProgress: "ट्यूटोरियल प्रगति",

    // How to Use sections
    howToUse: "उपयोग कैसे करें",
    gettingStarted: "शुरुआत करना",
    basicFeatures: "बुनियादी सुविधाएं",
    advancedFeatures: "उन्नत सुविधाएं",
    tips: "सुझाव और तरकीबें",
    troubleshooting: "समस्या निवारण",

    // Getting Started Guide
    step1: "चरण 1: अपना प्रोफाइल सेट करें",
    step1Description: "सेटिंग्स में जाएं और अपनी व्यक्तिगत जानकारी, भाषा प्राथमिकता और नोटिफिकेशन सेटिंग्स अपडेट करें।",
    step2: "चरण 2: अपना पहला कार्य बनाएं",
    step2Description: "कार्य पर नेविगेट करें और शीर्षक, विवरण और नियत तारीख के साथ अपना पहला कार्य बनाएं।",
    step3: "चरण 3: पोमोडोरो सत्र शुरू करें",
    step3Description: "5-मिनट के ब्रेक के साथ केंद्रित 25-मिनट के सत्रों में काम करने के लिए पोमोडोरो टाइमर का उपयोग करें।",
    step4: "चरण 4: स्वास्थ्य ट्रैकिंग सेट करें",
    step4Description: "अपने दैनिक कदम, नींद और अन्य कल्याण मेट्रिक्स की निगरानी के लिए स्वास्थ्य ट्रैकिंग सक्षम करें।",
    step5: "चरण 5: अनुस्मारक कॉन्फ़िगर करें",
    step5Description: "दवाओं, आदतों और महत्वपूर्ण कार्यों के लिए स्मार्ट अनुस्मारक सेट करें।",

    // Feature Guides
    pomodoroGuide: "पोमोडोरो टाइमर गाइड",
    pomodoroGuideDescription: "पोमोडोरो तकनीक काम को अंतराल में तोड़कर आपको केंद्रित रहने में मदद करती है।",
    pomodoroStep1: "1. काम करने के लिए एक कार्य चुनें",
    pomodoroStep2: "2. 25 मिनट के लिए टाइमर सेट करें",
    pomodoroStep3: "3. टाइमर बजने तक कार्य पर काम करें",
    pomodoroStep4: "4. 5-मिनट का छोटा ब्रेक लें",
    pomodoroStep5: "5. 4 पोमोडोरो के बाद, 15-30 मिनट का लंबा ब्रेक लें",

    taskGuide: "कार्य प्रबंधन गाइड",
    taskGuideDescription: "अपने काम और व्यक्तिगत कार्यों को कुशलता से व्यवस्थित करें।",
    taskStep1: "1. नया कार्य बनाने के लिए 'कार्य जोड़ें' पर क्लिक करें",
    taskStep2: "2. शीर्षक, विवरण, प्राथमिकता और नियत तारीख सेट करें",
    taskStep3: "3. कार्यों को व्यवस्थित करने के लिए श्रेणियों का उपयोग करें",
    taskStep4: "4. समाप्त होने पर कार्यों को पूर्ण के रूप में चिह्नित करें",
    taskStep5: "5. विशिष्ट कार्य प्रकार देखने के लिए फिल्टर का उपयोग करें",

    healthGuide: "स्वास्थ्य ट्रैकिंग गाइड",
    healthGuideDescription: "व्यापक स्वास्थ्य ट्रैकिंग के साथ अपने कल्याण की निगरानी करें।",
    healthStep1: "1. स्थान और गति अनुमतियां सक्षम करें",
    healthStep2: "2. दिन भर अपना डिवाइस पहनें",
    healthStep3: "3. अपना दैनिक रिकवरी स्कोर जांचें",
    healthStep4: "4. गतिविधियों के दौरान तनाव के स्तर की निगरानी करें",
    healthStep5: "5. नींद की गुणवत्ता और अवधि को ट्रैक करें",

    reminderGuide: "स्मार्ट अनुस्मारक गाइड",
    reminderGuideDescription: "बुद्धिमान अनुस्मारक के साथ महत्वपूर्ण कार्यों को कभी न चूकें।",
    reminderStep1: "1. नए अनुस्मारक बनाने के लिए 'अनुस्मारक जोड़ें' पर क्लिक करें",
    reminderStep2: "2. शीर्षक, विवरण और श्रेणी सेट करें",
    reminderStep3: "3. विशिष्ट समय और दिनों के साथ अनुसूची कॉन्फ़िगर करें",
    reminderStep4: "4. नोटिफिकेशन ध्वनि और वॉल्यूम चुनें",
    reminderStep5: "5. सर्वोत्तम अनुभव के लिए पुश नोटिफिकेशन सक्षम करें",

    // Tips
    tip1: "सुझाव 1: तेज़ नेविगेशन के लिए कीबोर्ड शॉर्टकट का उपयोग करें",
    tip2: "सुझाव 2: अनुस्मारक कभी न चूकने के लिए नोटिफिकेशन सक्षम करें",
    tip3: "सुझाव 3: प्रगति ट्रैक करने के लिए साप्ताहिक अपने एनालिटिक्स की समीक्षा करें",
    tip4: "सुझाव 4: व्यक्तिगत अंतर्दृष्टि के लिए एआई सहायक का उपयोग करें",
    tip5: "सुझाव 5: यथार्थवादी लक्ष्य निर्धारित करें और उपलब्धियों का जश्न मनाएं",

    // Language
    selectLanguage: "भाषा चुनें",
    english: "English",
    hindi: "हिंदी",
  },
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("app-language") as Language
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("app-language", lang)
  }

  const t = (key: string): string => {
    return translations[language][key as keyof (typeof translations)[typeof language]] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
