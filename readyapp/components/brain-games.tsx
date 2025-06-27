"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Target, Trophy, Play, Shuffle, Calculator } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

interface GameStats {
  score: number
  level: number
  streak: number
  bestScore: number
  gamesPlayed: number
  accuracy: number
  averageTime: number
}

interface MemoryCard {
  id: number
  value: string
  isFlipped: boolean
  isMatched: boolean
}

interface MathProblem {
  question: string
  answer: number
  options: number[]
  difficulty: number
}

export default function BrainGames() {
  const { t } = useLanguage()

  // Game selection state
  const [activeGame, setActiveGame] = useState<string>("memory")
  const [gameStats, setGameStats] = useState<Record<string, GameStats>>({
    memory: { score: 0, level: 1, streak: 0, bestScore: 0, gamesPlayed: 0, accuracy: 0, averageTime: 0 },
    math: { score: 0, level: 1, streak: 0, bestScore: 0, gamesPlayed: 0, accuracy: 0, averageTime: 0 },
    attention: { score: 0, level: 1, streak: 0, bestScore: 0, gamesPlayed: 0, accuracy: 0, averageTime: 0 },
    pattern: { score: 0, level: 1, streak: 0, bestScore: 0, gamesPlayed: 0, accuracy: 0, averageTime: 0 },
  })

  // Memory Game State
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState<number>(0)
  const [memoryGameActive, setMemoryGameActive] = useState(false)
  const [memoryStartTime, setMemoryStartTime] = useState<number>(0)

  // Math Game State
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null)
  const [mathAnswer, setMathAnswer] = useState("")
  const [mathGameActive, setMathGameActive] = useState(false)
  const [mathStartTime, setMathStartTime] = useState<number>(0)
  const [mathTimeLeft, setMathTimeLeft] = useState(30)

  // Attention Game State
  const [attentionTarget, setAttentionTarget] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  })
  const [attentionScore, setAttentionScore] = useState(0)
  const [attentionGameActive, setAttentionGameActive] = useState(false)
  const [attentionTimeLeft, setAttentionTimeLeft] = useState(60)

  // Pattern Game State
  const [patternSequence, setPatternSequence] = useState<number[]>([])
  const [playerSequence, setPlayerSequence] = useState<number[]>([])
  const [patternGameActive, setPatternGameActive] = useState(false)
  const [showingPattern, setShowingPattern] = useState(false)
  const [patternLevel, setPatternLevel] = useState(1)

  // Load saved stats on mount
  useEffect(() => {
    const savedStats = localStorage.getItem("brainGameStats")
    if (savedStats) {
      try {
        setGameStats(JSON.parse(savedStats))
      } catch (error) {
        console.error("Error loading game stats:", error)
      }
    }
  }, [])

  // Save stats whenever they change
  const saveStats = useCallback((newStats: Record<string, GameStats>) => {
    setGameStats(newStats)
    localStorage.setItem("brainGameStats", JSON.stringify(newStats))
  }, [])

  // Memory Game Functions
  const generateMemoryCards = useCallback((level: number) => {
    const cardCount = Math.min(4 + level * 2, 20)
    const pairCount = cardCount / 2
    const symbols = ["🎯", "🎪", "🎨", "🎭", "🎪", "🎯", "🎨", "🎭", "🎲", "🎸", "🎺", "🎻", "🎹", "🎤", "🎧", "🎮"]

    const cards: MemoryCard[] = []
    for (let i = 0; i < pairCount; i++) {
      const symbol = symbols[i % symbols.length]
      cards.push(
        { id: i * 2, value: symbol, isFlipped: false, isMatched: false },
        { id: i * 2 + 1, value: symbol, isFlipped: false, isMatched: false },
      )
    }

    // Shuffle cards
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[cards[i], cards[j]] = [cards[j], cards[i]]
    }

    return cards
  }, [])

  const startMemoryGame = useCallback(() => {
    const level = gameStats.memory.level
    const cards = generateMemoryCards(level)
    setMemoryCards(cards)
    setFlippedCards([])
    setMatchedPairs(0)
    setMemoryGameActive(true)
    setMemoryStartTime(Date.now())
  }, [gameStats.memory.level, generateMemoryCards])

  const flipCard = useCallback(
    (cardId: number) => {
      if (!memoryGameActive || flippedCards.length >= 2) return

      const card = memoryCards.find((c) => c.id === cardId)
      if (!card || card.isFlipped || card.isMatched) return

      const newFlippedCards = [...flippedCards, cardId]
      setFlippedCards(newFlippedCards)

      setMemoryCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c)))

      if (newFlippedCards.length === 2) {
        const [firstId, secondId] = newFlippedCards
        const firstCard = memoryCards.find((c) => c.id === firstId)
        const secondCard = memoryCards.find((c) => c.id === secondId)

        setTimeout(() => {
          if (firstCard?.value === secondCard?.value) {
            // Match found
            setMemoryCards((prev) =>
              prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c)),
            )
            setMatchedPairs((prev) => prev + 1)

            // Check if game is complete
            const totalPairs = memoryCards.length / 2
            if (matchedPairs + 1 === totalPairs) {
              completeMemoryGame()
            }
          } else {
            // No match, flip back
            setMemoryCards((prev) =>
              prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c)),
            )
          }
          setFlippedCards([])
        }, 1000)
      }
    },
    [memoryGameActive, flippedCards, memoryCards, matchedPairs],
  )

  const completeMemoryGame = useCallback(() => {
    const endTime = Date.now()
    const gameTime = (endTime - memoryStartTime) / 1000
    const score = Math.max(100 - Math.floor(gameTime), 10) * gameStats.memory.level

    const newStats = { ...gameStats }
    newStats.memory.score += score
    newStats.memory.gamesPlayed += 1
    newStats.memory.streak += 1
    newStats.memory.bestScore = Math.max(newStats.memory.bestScore, score)
    newStats.memory.averageTime = (newStats.memory.averageTime + gameTime) / 2
    newStats.memory.level = Math.min(newStats.memory.level + 1, 10)

    saveStats(newStats)
    setMemoryGameActive(false)
  }, [memoryStartTime, gameStats, saveStats])

  // Math Game Functions
  const generateMathProblem = useCallback((level: number): MathProblem => {
    const operations = ["+", "-", "*", "/"]
    const operation = operations[Math.floor(Math.random() * operations.length)]

    let a: number, b: number, answer: number, question: string

    switch (operation) {
      case "+":
        a = Math.floor(Math.random() * (10 * level)) + 1
        b = Math.floor(Math.random() * (10 * level)) + 1
        answer = a + b
        question = `${a} + ${b} = ?`
        break
      case "-":
        a = Math.floor(Math.random() * (10 * level)) + 10
        b = Math.floor(Math.random() * a) + 1
        answer = a - b
        question = `${a} - ${b} = ?`
        break
      case "*":
        a = Math.floor(Math.random() * (5 + level)) + 1
        b = Math.floor(Math.random() * (5 + level)) + 1
        answer = a * b
        question = `${a} × ${b} = ?`
        break
      case "/":
        answer = Math.floor(Math.random() * (5 + level)) + 1
        b = Math.floor(Math.random() * (5 + level)) + 1
        a = answer * b
        question = `${a} ÷ ${b} = ?`
        break
      default:
        a = 1
        b = 1
        answer = 2
        question = "1 + 1 = ?"
    }

    // Generate wrong options
    const options = [answer]
    while (options.length < 4) {
      const wrongAnswer = answer + Math.floor(Math.random() * 20) - 10
      if (wrongAnswer !== answer && !options.includes(wrongAnswer) && wrongAnswer > 0) {
        options.push(wrongAnswer)
      }
    }

    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[options[i], options[j]] = [options[j], options[i]]
    }

    return { question, answer, options, difficulty: level }
  }, [])

  const startMathGame = useCallback(() => {
    const problem = generateMathProblem(gameStats.math.level)
    setCurrentProblem(problem)
    setMathAnswer("")
    setMathGameActive(true)
    setMathStartTime(Date.now())
    setMathTimeLeft(30)
  }, [gameStats.math.level, generateMathProblem])

  const submitMathAnswer = useCallback(
    (selectedAnswer: number) => {
      if (!currentProblem || !mathGameActive) return

      const isCorrect = selectedAnswer === currentProblem.answer
      const responseTime = (Date.now() - mathStartTime) / 1000

      const newStats = { ...gameStats }
      if (isCorrect) {
        const score = Math.max(50 - Math.floor(responseTime * 2), 10) * gameStats.math.level
        newStats.math.score += score
        newStats.math.streak += 1
        newStats.math.level = Math.min(newStats.math.level + 1, 10)
      } else {
        newStats.math.streak = 0
      }

      newStats.math.gamesPlayed += 1
      newStats.math.accuracy = (newStats.math.accuracy + (isCorrect ? 100 : 0)) / 2
      newStats.math.averageTime = (newStats.math.averageTime + responseTime) / 2

      saveStats(newStats)

      // Generate next problem
      setTimeout(() => {
        if (mathTimeLeft > 0) {
          const nextProblem = generateMathProblem(newStats.math.level)
          setCurrentProblem(nextProblem)
          setMathStartTime(Date.now())
        } else {
          setMathGameActive(false)
        }
      }, 1000)
    },
    [currentProblem, mathGameActive, mathStartTime, gameStats, mathTimeLeft, saveStats, generateMathProblem],
  )

  // Math game timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (mathGameActive && mathTimeLeft > 0) {
      interval = setInterval(() => {
        setMathTimeLeft((prev) => {
          if (prev <= 1) {
            setMathGameActive(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [mathGameActive, mathTimeLeft])

  // Attention Game Functions
  const startAttentionGame = useCallback(() => {
    setAttentionScore(0)
    setAttentionGameActive(true)
    setAttentionTimeLeft(60)
    spawnAttentionTarget()
  }, [])

  const spawnAttentionTarget = useCallback(() => {
    if (!attentionGameActive) return

    const x = Math.random() * 80 + 10 // 10% to 90% of container width
    const y = Math.random() * 80 + 10 // 10% to 90% of container height

    setAttentionTarget({ x, y, active: true })

    setTimeout(() => {
      setAttentionTarget((prev) => ({ ...prev, active: false }))
      setTimeout(spawnAttentionTarget, Math.random() * 1000 + 500)
    }, 1500)
  }, [attentionGameActive])

  const hitAttentionTarget = useCallback(() => {
    if (attentionTarget.active) {
      setAttentionScore((prev) => prev + 10)
      setAttentionTarget((prev) => ({ ...prev, active: false }))

      const newStats = { ...gameStats }
      newStats.attention.score += 10
      newStats.attention.streak += 1
      saveStats(newStats)
    }
  }, [attentionTarget.active, gameStats, saveStats])

  // Attention game timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (attentionGameActive && attentionTimeLeft > 0) {
      interval = setInterval(() => {
        setAttentionTimeLeft((prev) => {
          if (prev <= 1) {
            setAttentionGameActive(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [attentionGameActive, attentionTimeLeft])

  // Pattern Game Functions
  const startPatternGame = useCallback(() => {
    const sequence = Array.from({ length: 3 + patternLevel }, () => Math.floor(Math.random() * 4))
    setPatternSequence(sequence)
    setPlayerSequence([])
    setPatternGameActive(true)
    setShowingPattern(true)

    // Show pattern for a few seconds
    setTimeout(
      () => {
        setShowingPattern(false)
      },
      (sequence.length + 1) * 800,
    )
  }, [patternLevel])

  const addToPlayerSequence = useCallback(
    (value: number) => {
      if (!patternGameActive || showingPattern) return

      const newSequence = [...playerSequence, value]
      setPlayerSequence(newSequence)

      if (newSequence.length === patternSequence.length) {
        const isCorrect = newSequence.every((val, idx) => val === patternSequence[idx])

        const newStats = { ...gameStats }
        if (isCorrect) {
          const score = 50 * patternLevel
          newStats.pattern.score += score
          newStats.pattern.streak += 1
          newStats.pattern.level = Math.min(newStats.pattern.level + 1, 10)
          setPatternLevel((prev) => prev + 1)
        } else {
          newStats.pattern.streak = 0
        }

        newStats.pattern.gamesPlayed += 1
        saveStats(newStats)

        setTimeout(() => {
          setPatternGameActive(false)
        }, 1500)
      }
    },
    [patternGameActive, showingPattern, playerSequence, patternSequence, gameStats, patternLevel, saveStats],
  )

  // Memoized game components to prevent unnecessary re-renders
  const MemoryGameComponent = useMemo(
    () => (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Memory Challenge
          </CardTitle>
          <CardDescription>
            Match pairs of cards. Level: {gameStats.memory.level} | Best: {gameStats.memory.bestScore}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!memoryGameActive ? (
            <div className="text-center space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Games Played: {gameStats.memory.gamesPlayed}</div>
                <div>Current Streak: {gameStats.memory.streak}</div>
                <div>Total Score: {gameStats.memory.score}</div>
                <div>Avg Time: {gameStats.memory.averageTime.toFixed(1)}s</div>
              </div>
              <Button onClick={startMemoryGame} className="w-full">
                <Play className="mr-2 h-4 w-4" />
                Start Memory Game
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge variant="outline">
                  Pairs: {matchedPairs}/{memoryCards.length / 2}
                </Badge>
                <Badge variant="outline">Level: {gameStats.memory.level}</Badge>
              </div>
              <div
                className={`grid gap-2 ${memoryCards.length <= 8 ? "grid-cols-4" : memoryCards.length <= 12 ? "grid-cols-4" : "grid-cols-5"}`}
              >
                {memoryCards.map((card) => (
                  <Button
                    key={card.id}
                    variant={card.isMatched ? "default" : card.isFlipped ? "secondary" : "outline"}
                    className="aspect-square text-2xl p-0"
                    onClick={() => flipCard(card.id)}
                    disabled={card.isFlipped || card.isMatched}
                  >
                    {card.isFlipped || card.isMatched ? card.value : "?"}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    ),
    [memoryGameActive, memoryCards, matchedPairs, gameStats.memory, startMemoryGame, flipCard],
  )

  const MathGameComponent = useMemo(
    () => (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Math Sprint
          </CardTitle>
          <CardDescription>Solve as many problems as you can! Level: {gameStats.math.level}</CardDescription>
        </CardHeader>
        <CardContent>
          {!mathGameActive ? (
            <div className="text-center space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Games Played: {gameStats.math.gamesPlayed}</div>
                <div>Accuracy: {gameStats.math.accuracy.toFixed(1)}%</div>
                <div>Total Score: {gameStats.math.score}</div>
                <div>Best Streak: {gameStats.math.streak}</div>
              </div>
              <Button onClick={startMathGame} className="w-full">
                <Play className="mr-2 h-4 w-4" />
                Start Math Game
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge variant="outline">Time: {mathTimeLeft}s</Badge>
                <Badge variant="outline">Streak: {gameStats.math.streak}</Badge>
              </div>
              <Progress value={(mathTimeLeft / 30) * 100} />
              {currentProblem && (
                <div className="text-center space-y-4">
                  <div className="text-3xl font-bold">{currentProblem.question}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {currentProblem.options.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        onClick={() => submitMathAnswer(option)}
                        className="text-xl p-4"
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    ),
    [mathGameActive, mathTimeLeft, currentProblem, gameStats.math, startMathGame, submitMathAnswer],
  )

  const AttentionGameComponent = useMemo(
    () => (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Focus Target
          </CardTitle>
          <CardDescription>Click the targets as fast as you can! Score: {attentionScore}</CardDescription>
        </CardHeader>
        <CardContent>
          {!attentionGameActive ? (
            <div className="text-center space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Best Score: {gameStats.attention.bestScore}</div>
                <div>Games Played: {gameStats.attention.gamesPlayed}</div>
                <div>Total Score: {gameStats.attention.score}</div>
                <div>Current Streak: {gameStats.attention.streak}</div>
              </div>
              <Button onClick={startAttentionGame} className="w-full">
                <Play className="mr-2 h-4 w-4" />
                Start Focus Game
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge variant="outline">Time: {attentionTimeLeft}s</Badge>
                <Badge variant="outline">Score: {attentionScore}</Badge>
              </div>
              <div className="relative bg-muted rounded-lg h-64 cursor-crosshair" style={{ minHeight: "256px" }}>
                {attentionTarget.active && (
                  <Button
                    className="absolute w-12 h-12 rounded-full p-0 bg-red-500 hover:bg-red-600"
                    style={{
                      left: `${attentionTarget.x}%`,
                      top: `${attentionTarget.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    onClick={hitAttentionTarget}
                  >
                    <Target className="h-6 w-6" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    ),
    [
      attentionGameActive,
      attentionTimeLeft,
      attentionScore,
      attentionTarget,
      gameStats.attention,
      startAttentionGame,
      hitAttentionTarget,
    ],
  )

  const PatternGameComponent = useMemo(
    () => (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shuffle className="h-5 w-5" />
            Pattern Memory
          </CardTitle>
          <CardDescription>Remember and repeat the pattern! Level: {patternLevel}</CardDescription>
        </CardHeader>
        <CardContent>
          {!patternGameActive ? (
            <div className="text-center space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Level: {gameStats.pattern.level}</div>
                <div>Games Played: {gameStats.pattern.gamesPlayed}</div>
                <div>Total Score: {gameStats.pattern.score}</div>
                <div>Best Streak: {gameStats.pattern.streak}</div>
              </div>
              <Button onClick={startPatternGame} className="w-full">
                <Play className="mr-2 h-4 w-4" />
                Start Pattern Game
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                {showingPattern ? (
                  <Badge variant="secondary">Watch the pattern...</Badge>
                ) : (
                  <Badge variant="outline">Repeat the pattern</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((value) => (
                  <Button
                    key={value}
                    variant={showingPattern && patternSequence[playerSequence.length] === value ? "default" : "outline"}
                    className="aspect-square text-2xl"
                    onClick={() => addToPlayerSequence(value)}
                    disabled={showingPattern}
                  >
                    {value + 1}
                  </Button>
                ))}
              </div>
              <div className="text-center text-sm text-muted-foreground">
                Progress: {playerSequence.length}/{patternSequence.length}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    ),
    [
      patternGameActive,
      showingPattern,
      patternSequence,
      playerSequence,
      patternLevel,
      gameStats.pattern,
      startPatternGame,
      addToPlayerSequence,
    ],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brain Training</h1>
          <p className="text-muted-foreground">Challenge your mind with cognitive games</p>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span className="font-semibold">
            Total Score: {Object.values(gameStats).reduce((sum, stat) => sum + stat.score, 0)}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(gameStats).map(([game, stats]) => (
          <Card key={game} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium capitalize">{game}</p>
                  <p className="text-2xl font-bold">{stats.score}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Level {stats.level}</p>
                  <p className="text-sm text-muted-foreground">Streak: {stats.streak}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeGame} onValueChange={setActiveGame} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="math">Math</TabsTrigger>
          <TabsTrigger value="attention">Focus</TabsTrigger>
          <TabsTrigger value="pattern">Pattern</TabsTrigger>
        </TabsList>

        <TabsContent value="memory" className="space-y-4">
          {MemoryGameComponent}
        </TabsContent>

        <TabsContent value="math" className="space-y-4">
          {MathGameComponent}
        </TabsContent>

        <TabsContent value="attention" className="space-y-4">
          {AttentionGameComponent}
        </TabsContent>

        <TabsContent value="pattern" className="space-y-4">
          {PatternGameComponent}
        </TabsContent>
      </Tabs>
    </div>
  )
}
