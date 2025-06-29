# DailyBuddy

Your friendly companion for a brighter, more organized day. Plan, grow, and thrive with a buddy by your side—no matter your age or dream!

**Live Demo:** [https://dailybuddyy.vercel.app/](https://dailybuddyy.vercel.app/)

## Features
- Pomodoro Timer
- Task Management
- Timetable
- Habit Tracker
- Goal Setting
- Focus Mode
- Health Reminders
- Family Features
- Brain Games
- AI Suggestions
- Reminders
- Daily Quotes

## Environment Setup

This project uses environment variables for Firebase configuration and push notifications. Follow these steps to set up your environment:

1. **Copy the example environment file:**
   ```bash
   cp env.example .env.local
   ```

2. **Fill in your Firebase configuration:**
   - Get your Firebase config from the Firebase Console
   - Download your service account key JSON file
   - Extract the values and add them to `.env.local`

3. **Required environment variables:**
   - `NEXT_PUBLIC_FIREBASE_*` - Firebase client configuration
   - `FIREBASE_ADMIN_*` - Firebase Admin SDK configuration
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - VAPID public key for push notifications
   - `VAPID_PRIVATE_KEY` - VAPID private key for push notifications

4. **Install dependencies and run:**
   ```bash
   npm install
   npm run dev
   ```

The service worker will be automatically generated with your Firebase configuration when you run the dev or build commands.

> "Self-care is the best productivity hack. Let your DailyBuddy help you shine!" — The DailyBuddy Team

---

Made with ❤️ by Vrinda Jindal. 