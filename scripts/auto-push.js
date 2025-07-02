const cron = require('node-cron');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Update these paths as needed
const SUBS_FILE = path.join(__dirname, '../push_subscriptions.json');
const REMINDERS_FILE = path.join(__dirname, '../reminders.json'); // Or your DB

const API_URL = 'https://your-app.vercel.app/api/send-push-notification'; // <-- Update to your deployed URL

// Helper to get due reminders (replace with your DB logic)
function getDueReminders() {
  if (!fs.existsSync(REMINDERS_FILE)) return [];
  const reminders = JSON.parse(fs.readFileSync(REMINDERS_FILE, 'utf8'));
  const now = Date.now();
  // Example: due if scheduledTime is within the next minute
  return reminders.filter(r => {
    const scheduled = new Date(r.scheduledTime).getTime();
    return scheduled <= now && !r.completed;
  });
}

// Cron: every minute
cron.schedule('* * * * *', async () => {
  const dueReminders = getDueReminders();
  if (dueReminders.length === 0) return;

  for (const reminder of dueReminders) {
    const payload = {
      title: reminder.title || '⏰ Reminder',
      body: reminder.body || 'You have a scheduled reminder.',
      data: { url: reminder.url || '/', type: reminder.type || 'reminder' }
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      console.log('Push notification sent:', result);
    } catch (err) {
      console.error('Error sending push notification:', err);
    }
  }
}); 