"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Gamepad2, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Shuffle, Target, Zap, Trophy, Smile } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GameScore {
  game: string
  score: number
  date: string
}

export default function FunZonePage() {
  const { toast } = useToast()

  // Dice Game State
  const [diceValue, setDiceValue] = useState(1)
  const [diceRolling, setDiceRolling] = useState(false)
  const [diceScore, setDiceScore] = useState(0)
  const [diceTarget, setDiceTarget] = useState(6)
  const [diceAttempts, setDiceAttempts] = useState(0)

  // Number Guessing Game State
  const [secretNumber, setSecretNumber] = useState(0)
  const [guess, setGuess] = useState("")
  const [guessAttempts, setGuessAttempts] = useState(0)
  const [guessHint, setGuessHint] = useState("")
  const [guessGameActive, setGuessGameActive] = useState(false)
  const [guessScore, setGuessScore] = useState(0)

  // Color Memory Game State
  const [colorSequence, setColorSequence] = useState<string[]>([])
  const [playerSequence, setPlayerSequence] = useState<string[]>([])
  const [showingSequence, setShowingSequence] = useState(false)
  const [colorGameActive, setColorGameActive] = useState(false)
  const [colorLevel, setColorLevel] = useState(1)
  const [colorScore, setColorScore] = useState(0)

  // Reaction Time Game State
  const [reactionGameActive, setReactionGameActive] = useState(false)
  const [reactionWaiting, setReactionWaiting] = useState(false)
  const [reactionStartTime, setReactionStartTime] = useState(0)
  const [reactionTime, setReactionTime] = useState(0)
  const [reactionBestTime, setReactionBestTime] = useState(0)
  const [reactionAttempts, setReactionAttempts] = useState(0)

  // High Scores
  const [highScores, setHighScores] = useState<GameScore[]>([])

  const colors = ["red", "blue", "green", "yellow", "purple", "orange"]

  // Load high scores on mount
  useEffect(() => {
    const savedScores = localStorage.getItem("funZoneHighScores")
    if (savedScores) {
      setHighScores(JSON.parse(savedScores))
    }

    const savedReactionBest = localStorage.getItem("reactionBestTime")
    if (savedReactionBest) {
      setReactionBestTime(Number(savedReactionBest))
    }
  }, [])

  // Save high score
  const saveHighScore = (game: string, score: number) => {
    const newScore: GameScore = {
      game,
      score,
      date: new Date().toLocaleDateString(),
    }

    const updatedScores = [...highScores, newScore].sort((a, b) => b.score - a.score).slice(0, 10) // Keep top 10

    setHighScores(updatedScores)
    localStorage.setItem("funZoneHighScores", JSON.stringify(updatedScores))
  }

  // Dice Game Functions
  const rollDice = () => {
    if (diceRolling) return

    setDiceRolling(true)
    setDiceAttempts((prev) => prev + 1)

    // Animate dice roll
    let rollCount = 0
    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1)
      rollCount++

      if (rollCount > 10) {
        clearInterval(rollInterval)
        const finalValue = Math.floor(Math.random() * 6) + 1
        setDiceValue(finalValue)
        setDiceRolling(false)

        if (finalValue === diceTarget) {
          const points = Math.max(100 - diceAttempts * 10, 10)
          setDiceScore((prev) => prev + points)
          setDiceTarget(Math.floor(Math.random() * 6) + 1)
          setDiceAttempts(0)

          toast({
            title: "🎯 Perfect Roll!",
            description: `You got ${finalValue}! +${points} points`,
          })

          saveHighScore("Dice Master", diceScore + points)
        } else {
          toast({
            title: "🎲 Try Again!",
            description: `You rolled ${finalValue}, need ${diceTarget}`,
          })
        }
      }
    }, 100)
  }

  const resetDiceGame = () => {
    setDiceScore(0)
    setDiceAttempts(0)
    setDiceTarget(Math.floor(Math.random() * 6) + 1)
    setDiceValue(1)
  }

  // Number Guessing Game Functions
  const startGuessGame = () => {
    setSecretNumber(Math.floor(Math.random() * 100) + 1)
    setGuess("")
    setGuessAttempts(0)
    setGuessHint("I'm thinking of a number between 1 and 100...")
    setGuessGameActive(true)
    setGuessScore(0)
  }

  const submitGuess = () => {
    const guessNum = Number.parseInt(guess)
    if (isNaN(guessNum) || guessNum < 1 || guessNum > 100) {
      toast({
        title: "Invalid Guess",
        description: "Please enter a number between 1 and 100",
        variant: "destructive",
      })
      return
    }

    setGuessAttempts((prev) => prev + 1)

    if (guessNum === secretNumber) {
      const points = Math.max(110 - guessAttempts * 10, 10)
      setGuessScore(points)
      setGuessHint(`🎉 Correct! You found ${secretNumber} in ${guessAttempts + 1} attempts!`)
      setGuessGameActive(false)

      toast({
        title: "🎯 You Got It!",
        description: `Amazing! +${points} points`,
      })

      saveHighScore("Number Detective", points)
    } else if (guessNum < secretNumber) {
      setGuessHint(`📈 Too low! Try a higher number. (Attempt ${guessAttempts + 1})`)
    } else {
      setGuessHint(`📉 Too high! Try a lower number. (Attempt ${guessAttempts + 1})`)
    }

    setGuess("")
  }

  // Color Memory Game Functions
  const startColorGame = () => {
    const sequence = [colors[Math.floor(Math.random() * colors.length)]]
    setColorSequence(sequence)
    setPlayerSequence([])
    setColorGameActive(true)
    setShowingSequence(true)
    setColorLevel(1)
    setColorScore(0)

    // Show sequence
    setTimeout(() => {
      setShowingSequence(false)
    }, 1000)
  }

  const addColorToSequence = (color: string) => {
    if (showingSequence || !colorGameActive) return

    const newPlayerSequence = [...playerSequence, color]
    setPlayerSequence(newPlayerSequence)

    // Check if sequence matches so far
    if (newPlayerSequence[newPlayerSequence.length - 1] !== colorSequence[newPlayerSequence.length - 1]) {
      // Wrong color
      setColorGameActive(false)
      toast({
        title: "🔴 Game Over!",
        description: `You reached level ${colorLevel}. Final score: ${colorScore}`,
      })
      saveHighScore("Color Memory", colorScore)
      return
    }

    // Check if sequence is complete
    if (newPlayerSequence.length === colorSequence.length) {
      // Level complete
      const points = colorLevel * 50
      setColorScore((prev) => prev + points)
      setColorLevel((prev) => prev + 1)

      // Generate next sequence
      const nextSequence = [...colorSequence, colors[Math.floor(Math.random() * colors.length)]]
      setColorSequence(nextSequence)
      setPlayerSequence([])
      setShowingSequence(true)

      toast({
        title: "🌈 Level Complete!",
        description: `Level ${colorLevel} done! +${points} points`,
      })

      // Show next sequence
      setTimeout(
        () => {
          setShowingSequence(false)
        },
        1000 + nextSequence.length * 300,
      )
    }
  }

  // Reaction Time Game Functions
  const startReactionGame = () => {
    setReactionGameActive(true)
    setReactionWaiting(true)
    setReactionAttempts((prev) => prev + 1)

    // Random delay between 1-5 seconds
    const delay = Math.random() * 4000 + 1000

    setTimeout(() => {
      if (reactionGameActive) {
        setReactionWaiting(false)
        setReactionStartTime(Date.now())
      }
    }, delay)
  }

  const handleReactionClick = () => {
    if (reactionWaiting) {
      // Too early
      setReactionGameActive(false)
      setReactionWaiting(false)
      toast({
        title: "⚡ Too Early!",
        description: "Wait for the green signal!",
        variant: "destructive",
      })
      return
    }

    if (reactionStartTime > 0) {
      const time = Date.now() - reactionStartTime
      setReactionTime(time)
      setReactionGameActive(false)

      if (time < reactionBestTime || reactionBestTime === 0) {
        setReactionBestTime(time)
        localStorage.setItem("reactionBestTime", time.toString())
        toast({
          title: "⚡ New Record!",
          description: `Amazing! ${time}ms reaction time!`,
        })
      } else {
        toast({
          title: "⚡ Great Reflexes!",
          description: `${time}ms reaction time`,
        })
      }

      saveHighScore("Lightning Reflexes", Math.max(1000 - time, 1))
    }
  }

  const resetReactionGame = () => {
    setReactionGameActive(false)
    setReactionWaiting(false)
    setReactionStartTime(0)
    setReactionTime(0)
  }

  const getDiceIcon = (value: number) => {
    switch (value) {
      case 1:
        return <Dice1 className="h-12 w-12" />
      case 2:
        return <Dice2 className="h-12 w-12" />
      case 3:
        return <Dice3 className="h-12 w-12" />
      case 4:
        return <Dice4 className="h-12 w-12" />
      case 5:
        return <Dice5 className="h-12 w-12" />
      case 6:
        return <Dice6 className="h-12 w-12" />
      default:
        return <Dice1 className="h-12 w-12" />
    }
  }

  const getColorClass = (color: string) => {
    const classes = {
      red: "bg-red-500 hover:bg-red-600",
      blue: "bg-blue-500 hover:bg-blue-600",
      green: "bg-green-500 hover:bg-green-600",
      yellow: "bg-yellow-500 hover:bg-yellow-600",
      purple: "bg-purple-500 hover:bg-purple-600",
      orange: "bg-orange-500 hover:bg-orange-600",
    }
    return classes[color as keyof typeof classes] || "bg-gray-500"
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Gamepad2 className="h-8 w-8 text-purple-600" />
          Fun Zone
        </h1>
        <p className="text-muted-foreground">Take a break and enjoy some mini-games!</p>
      </div>

      {/* High Scores Overview */}
      <Card className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            High Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {highScores.slice(0, 4).map((score, index) => (
              <div key={index} className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{score.score}</div>
                <div className="text-sm font-medium">{score.game}</div>
                <div className="text-xs text-muted-foreground">{score.date}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="dice" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dice">🎲 Dice</TabsTrigger>
          <TabsTrigger value="guess">🔢 Guess</TabsTrigger>
          <TabsTrigger value="colors">🌈 Colors</TabsTrigger>
          <TabsTrigger value="reaction">⚡ Reaction</TabsTrigger>
        </TabsList>

        {/* Dice Game */}
        <TabsContent value="dice">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dice1 className="h-5 w-5" />
                Dice Master
              </CardTitle>
              <CardDescription>Roll the dice to match the target number! Score: {diceScore}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">Your Roll</div>
                    <div className={`p-4 rounded-lg border-2 ${diceRolling ? "animate-bounce" : ""}`}>
                      {getDiceIcon(diceValue)}
                    </div>
                  </div>
                  <div className="text-4xl">→</div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">Target</div>
                    <div className="p-4 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950">
                      {getDiceIcon(diceTarget)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <Badge variant="outline">Attempts: {diceAttempts}</Badge>
                  <Badge variant="outline">Score: {diceScore}</Badge>
                </div>

                <div className="flex justify-center gap-3">
                  <Button onClick={rollDice} disabled={diceRolling} size="lg" className="px-8">
                    {diceRolling ? "Rolling..." : "Roll Dice"}
                  </Button>
                  <Button onClick={resetDiceGame} variant="outline">
                    Reset Game
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Number Guessing Game */}
        <TabsContent value="guess">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Number Detective
              </CardTitle>
              <CardDescription>Guess the secret number between 1 and 100!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!guessGameActive && guessScore === 0 ? (
                <div className="text-center">
                  <Button onClick={startGuessGame} size="lg">
                    Start New Game
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-lg">{guessHint}</p>
                  </div>

                  {guessGameActive && (
                    <div className="flex gap-2 max-w-sm mx-auto">
                      <input
                        type="number"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && submitGuess()}
                        placeholder="Enter your guess"
                        className="flex-1 px-3 py-2 border rounded-md"
                        min="1"
                        max="100"
                      />
                      <Button onClick={submitGuess}>Guess</Button>
                    </div>
                  )}

                  <div className="flex justify-center gap-4">
                    <Badge variant="outline">Attempts: {guessAttempts}</Badge>
                    {guessScore > 0 && <Badge variant="outline">Score: {guessScore}</Badge>}
                  </div>

                  {!guessGameActive && (
                    <div className="text-center">
                      <Button onClick={startGuessGame}>Play Again</Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Color Memory Game */}
        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5" />
                Color Memory
              </CardTitle>
              <CardDescription>Remember and repeat the color sequence! Level: {colorLevel}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!colorGameActive ? (
                <div className="text-center space-y-4">
                  <div className="flex justify-center gap-4">
                    <Badge variant="outline">Best Score: {colorScore}</Badge>
                  </div>
                  <Button onClick={startColorGame} size="lg">
                    Start Color Game
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    {showingSequence ? (
                      <Badge variant="secondary">Watch the sequence...</Badge>
                    ) : (
                      <Badge variant="outline">
                        Repeat the sequence ({playerSequence.length}/{colorSequence.length})
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                    {colors.map((color) => (
                      <Button
                        key={color}
                        className={`aspect-square h-20 ${getColorClass(color)} ${
                          showingSequence && colorSequence[playerSequence.length] === color
                            ? "ring-4 ring-white animate-pulse"
                            : ""
                        }`}
                        onClick={() => addColorToSequence(color)}
                        disabled={showingSequence}
                      >
                        <span className="sr-only">{color}</span>
                      </Button>
                    ))}
                  </div>

                  <div className="flex justify-center gap-4">
                    <Badge variant="outline">Level: {colorLevel}</Badge>
                    <Badge variant="outline">Score: {colorScore}</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reaction Time Game */}
        <TabsContent value="reaction">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Lightning Reflexes
              </CardTitle>
              <CardDescription>Test your reaction time! Click when the screen turns green.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!reactionGameActive ? (
                <div className="text-center space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{reactionTime}ms</div>
                      <div className="text-sm text-muted-foreground">Last Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{reactionBestTime}ms</div>
                      <div className="text-sm text-muted-foreground">Best Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{reactionAttempts}</div>
                      <div className="text-sm text-muted-foreground">Attempts</div>
                    </div>
                  </div>
                  <Button onClick={startReactionGame} size="lg">
                    Start Reaction Test
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <div
                    className={`h-64 rounded-lg cursor-pointer flex items-center justify-center text-white text-2xl font-bold transition-colors ${
                      reactionWaiting ? "bg-red-500" : "bg-green-500"
                    }`}
                    onClick={handleReactionClick}
                  >
                    {reactionWaiting ? (
                      <div>
                        <Smile className="h-16 w-16 mb-4 mx-auto" />
                        <div>Wait for Green...</div>
                      </div>
                    ) : (
                      <div>
                        <Zap className="h-16 w-16 mb-4 mx-auto" />
                        <div>CLICK NOW!</div>
                      </div>
                    )}
                  </div>
                  <Button onClick={resetReactionGame} variant="outline" className="mt-4">
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
