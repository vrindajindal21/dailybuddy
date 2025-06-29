require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const REMINDERS_FILE = path.join(__dirname, '../reminders.json');
const TOKENS_FILE = path.join(__dirname, '../fcm_tokens.json');
const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/send-fcm-notification`;

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
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, title, body, data }),
  });
  return res.json();
}

async function main() {
  const reminders = loadReminders();
  const tokens = loadTokens();

  const now = Date.now();
  let changed = false;

  for (const reminder of reminders) {
    if (!reminder.sent && new Date(reminder.time).getTime() <= now) {
      for (const token of tokens) {
        await sendNotification(token, reminder.title, reminder.body, reminder.data || {});
      }
      reminder.sent = true;
      changed = true;
      console.log('Sent notification for reminder:', reminder.title);
    }
  }

  if (changed) saveReminders(reminders);
}

main(); 