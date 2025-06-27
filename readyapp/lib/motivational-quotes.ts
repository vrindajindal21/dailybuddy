export interface MotivationalQuote {
  text: string
  author: string
  category: "success" | "learning" | "perseverance" | "wisdom" | "happiness" | "family"
}

export const motivationalQuotes: MotivationalQuote[] = [
  // Success & Achievement
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    category: "success",
  },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "success" },
  {
    text: "Don't be afraid to give up the good to go for the great.",
    author: "John D. Rockefeller",
    category: "success",
  },

  // Learning & Growth
  {
    text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
    author: "Dr. Seuss",
    category: "learning",
  },
  {
    text: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela",
    category: "learning",
  },
  {
    text: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi",
    category: "learning",
  },

  // Perseverance
  {
    text: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius",
    category: "perseverance",
  },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb", category: "perseverance" },
  {
    text: "The difference between ordinary and extraordinary is that little extra.",
    author: "Jimmy Johnson",
    category: "perseverance",
  },

  // Wisdom
  { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates", category: "wisdom" },
  {
    text: "Yesterday is history, tomorrow is a mystery, today is a gift.",
    author: "Eleanor Roosevelt",
    category: "wisdom",
  },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde", category: "wisdom" },

  // Happiness & Positivity
  {
    text: "Happiness is not something ready made. It comes from your own actions.",
    author: "Dalai Lama",
    category: "happiness",
  },
  {
    text: "The best way to cheer yourself up is to try to cheer somebody else up.",
    author: "Mark Twain",
    category: "happiness",
  },
  {
    text: "Keep your face always toward the sunshine—and shadows will fall behind you.",
    author: "Walt Whitman",
    category: "happiness",
  },

  // Family & Relationships
  { text: "Family is not an important thing. It's everything.", author: "Michael J. Fox", category: "family" },
  {
    text: "The love of family and the admiration of friends is much more important than wealth and privilege.",
    author: "Charles Kuralt",
    category: "family",
  },
  { text: "A happy family is but an earlier heaven.", author: "George Bernard Shaw", category: "family" },

  // Additional motivational quotes
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", category: "success" },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
    category: "success",
  },
  {
    text: "It is during our darkest moments that we must focus to see the light.",
    author: "Aristotle",
    category: "perseverance",
  },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", category: "success" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs", category: "learning" },
  {
    text: "Life is what happens to you while you're busy making other plans.",
    author: "John Lennon",
    category: "wisdom",
  },
  {
    text: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    author: "Nelson Mandela",
    category: "perseverance",
  },
  {
    text: "Your time is limited, don't waste it living someone else's life.",
    author: "Steve Jobs",
    category: "wisdom",
  },
  {
    text: "If you want to live a happy life, tie it to a goal, not to people or things.",
    author: "Albert Einstein",
    category: "happiness",
  },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins", category: "success" },
]

export function getDailyQuote(): MotivationalQuote {
  const today = new Date()
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24)
  const quoteIndex = dayOfYear % motivationalQuotes.length
  return motivationalQuotes[quoteIndex]
}

export function getRandomQuote(): MotivationalQuote {
  const randomIndex = Math.floor(Math.random() * motivationalQuotes.length)
  return motivationalQuotes[randomIndex]
}

export function getQuotesByCategory(category: MotivationalQuote["category"]): MotivationalQuote[] {
  return motivationalQuotes.filter((quote) => quote.category === category)
}
