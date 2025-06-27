// Google Translate integration for real-time translation
export class GoogleTranslateService {
  private static instance: GoogleTranslateService
  private isInitialized = false
  private currentLanguage = "en"
  private supportedLanguages = ["en", "hi", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko", "ar", "bn", "ur"]

  static getInstance(): GoogleTranslateService {
    if (!GoogleTranslateService.instance) {
      GoogleTranslateService.instance = new GoogleTranslateService()
    }
    return GoogleTranslateService.instance
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true

    try {
      // Load Google Translate API
      await this.loadGoogleTranslateScript()

      // Initialize Google Translate
      if (typeof window !== "undefined" && (window as any).google?.translate) {
        ;(window as any).googleTranslateElementInit = () => {
          ;new (window as any).google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages: this.supportedLanguages.join(","),
              layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
              multilanguagePage: true,
            },
            "google_translate_element",
          )
        }

        this.isInitialized = true
        console.log("Google Translate initialized successfully")
        return true
      }
    } catch (error) {
      console.error("Failed to initialize Google Translate:", error)
      return false
    }

    return false
  }

  private loadGoogleTranslateScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Window not available"))
        return
      }

      // Check if already loaded
      if ((window as any).google?.translate) {
        resolve()
        return
      }

      const script = document.createElement("script")
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
      script.async = true
      script.defer = true

      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load Google Translate script"))

      document.head.appendChild(script)
    })
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    if (!text || !targetLanguage) return text

    try {
      // Use Google Translate API for text translation
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`,
      )
      const data = await response.json()

      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0][0][0]
      }
    } catch (error) {
      console.error("Translation error:", error)
    }

    return text
  }

  async translatePage(targetLanguage: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (typeof window !== "undefined" && (window as any).google?.translate) {
      try {
        const translateElement = (window as any).google.translate.TranslateElement
        if (translateElement) {
          // Trigger page translation
          const selectElement = document.querySelector(".goog-te-combo") as HTMLSelectElement
          if (selectElement) {
            selectElement.value = targetLanguage
            selectElement.dispatchEvent(new Event("change"))
          }
        }
      } catch (error) {
        console.error("Page translation error:", error)
      }
    }
  }

  getSupportedLanguages() {
    return [
      { code: "en", name: "English", native: "English" },
      { code: "hi", name: "Hindi", native: "हिंदी" },
      { code: "es", name: "Spanish", native: "Español" },
      { code: "fr", name: "French", native: "Français" },
      { code: "de", name: "German", native: "Deutsch" },
      { code: "it", name: "Italian", native: "Italiano" },
      { code: "pt", name: "Portuguese", native: "Português" },
      { code: "ru", name: "Russian", native: "Русский" },
      { code: "zh", name: "Chinese", native: "中文" },
      { code: "ja", name: "Japanese", native: "日本語" },
      { code: "ko", name: "Korean", native: "한국어" },
      { code: "ar", name: "Arabic", native: "العربية" },
      { code: "bn", name: "Bengali", native: "বাংলা" },
      { code: "ur", name: "Urdu", native: "اردو" },
    ]
  }

  getCurrentLanguage(): string {
    return this.currentLanguage
  }

  setCurrentLanguage(language: string): void {
    this.currentLanguage = language
    localStorage.setItem("google-translate-language", language)
  }
}

export const googleTranslate = GoogleTranslateService.getInstance()
