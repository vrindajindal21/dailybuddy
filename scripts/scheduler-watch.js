const cron = require('node-cron');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const REMINDERS_FILE = path.join(__dirname, '../reminders.json');
const TOKENS_FILE = path.join(__dirname, '../fcm_tokens.json');
const API_URL = 'http://localhost:3000/api/send-fcm-notification'; // Change to your deployed URL if needed

function loadReminders() {
  if (!fs.existsSync(REMINDERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(REMINDERS_FILE, 'utf8'));
}

function saveReminders(reminders) {
  fs.writeFileSync(REMINDERS_FILE, JSON.stringify(reminders, null, 2));
}

function loadTokens() {
  if (!fs.existsSync(TOKENS_FILE)) return [];
  return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
}

async function sendNotification(token, title, body, data) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, title, body, data }),
    });
    const result = await res.json();
    console.log('Notification sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending notification:', error);
    return { error: error.message };
  }
}

async function checkAndSendReminders() {
  console.log('Checking for due reminders...');
  const reminders = loadReminders();
  const tokens = loadTokens();

  if (tokens.length === 0) {
    console.log('No FCM tokens found. Users need to grant notification permissions.');
    return;
  }

  const now = Date.now();
  let changed = false;

  for (const reminder of reminders) {
    if (!reminder.sent && new Date(reminder.time).getTime() <= now) {
      console.log(`Sending notification for reminder: ${reminder.title}`);
      
      for (const token of tokens) {
        await sendNotification(token, reminder.title, reminder.body, reminder.data || {});
      }
      
      reminder.sent = true;
      changed = true;
      console.log('✅ Sent notification for reminder:', reminder.title);
    }
  }

  if (changed) {
    saveReminders(reminders);
    console.log('Updated reminders.json');
  } else {
    console.log('No due reminders found');
  }
}

// Run every minute
cron.schedule('* * * * *', () => {
  checkAndSendReminders();
});

console.log('🚀 Reminder scheduler started! Checking for due reminders every minute...');
console.log('Press Ctrl+C to stop');

// Also run once immediately
checkAndSendReminders(); 