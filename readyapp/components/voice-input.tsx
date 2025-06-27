"use client"

import { useState, useEffect, useCallback } from "react"
import { Mic, MicOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface VoiceInputProps {
  onTranscript?: (text: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function VoiceInput({
  onTranscript,
  placeholder = "Speak now...",
  className = "",
  disabled = false,
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [recognition, setRecognition] = useState<any>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if browser supports speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (SpeechRecognition) {
        try {
          const recognitionInstance = new SpeechRecognition()
          recognitionInstance.continuous = true
          recognitionInstance.interimResults = true
          recognitionInstance.lang = "en-US"

          setRecognition(recognitionInstance)
          setIsSupported(true)
        } catch (error) {
          console.error("Error initializing speech recognition:", error)
          setIsSupported(false)
        }
      } else {
        setIsSupported(false)
      }
    }
  }, [])

  // Set up recognition event handlers
  useEffect(() => {
    if (!recognition) return

    const handleResult = (event: any) => {
      const current = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join("")

      setTranscript(current)
    }

    const handleEnd = () => {
      if (isListening) {
        try {
          recognition.start()
        } catch (error) {
          console.error("Error restarting recognition:", error)
          setIsListening(false)
          setIsLoading(false)
        }
      }
    }

    const handleError = (event: any) => {
      console.error("Speech recognition error:", event.error)
      setIsListening(false)
      setIsLoading(false)

      toast({
        title: "Voice input error",
        description: `Error: ${event.error}. Please try again.`,
        variant: "destructive",
      })
    }

    recognition.onresult = handleResult
    recognition.onend = handleEnd
    recognition.onerror = handleError

    return () => {
      recognition.onresult = null
      recognition.onend = null
      recognition.onerror = null
    }
  }, [recognition, isListening, toast])

  // Submit transcript when stopping
  useEffect(() => {
    if (!isListening && transcript && onTranscript) {
      onTranscript(transcript)
    }
  }, [isListening, transcript, onTranscript])

  const toggleListening = useCallback(() => {
    if (!recognition || disabled) return

    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      setIsLoading(true)
      setTranscript("")

      try {
        recognition.start()
        setIsListening(true)

        // Set a timeout to ensure loading state doesn't get stuck
        setTimeout(() => {
          setIsLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Error starting recognition:", error)
        setIsLoading(false)

        toast({
          title: "Voice input error",
          description: "Could not start voice recognition. Please try again.",
          variant: "destructive",
        })
      }
    }
  }, [recognition, isListening, disabled, toast])

  // Handle case where onTranscript is not provided
  const handleVoiceClick = useCallback(() => {
    if (!onTranscript) {
      toast({
        title: "Voice Input",
        description: "Voice input is available but no handler is configured.",
        variant: "default",
      })
      return
    }
    toggleListening()
  }, [onTranscript, toggleListening, toast])

  if (!isSupported) {
    return (
      <Button
        variant="outline"
        size="icon"
        disabled
        title="Voice input not supported in this browser"
        className={className}
      >
        <MicOff className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div className="relative">
      <Button
        variant={isListening ? "default" : "outline"}
        size="icon"
        onClick={handleVoiceClick}
        className={`${isListening ? "bg-red-500 hover:bg-red-600" : ""} ${className}`}
        disabled={isLoading || disabled}
        title={disabled ? "Voice input disabled" : isListening ? "Stop listening" : "Start voice input"}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isListening ? (
          <Mic className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>

      {isListening && (
        <div className="absolute top-full mt-2 p-2 bg-background border rounded-md shadow-md w-64 z-10">
          <p className="text-xs text-muted-foreground mb-1">Listening...</p>
          <p className="text-sm">{transcript || placeholder}</p>
        </div>
      )}
    </div>
  )
}
