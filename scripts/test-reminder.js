const fs = require('fs');
const path = require('path');

const REMINDERS_FILE = path.join(__dirname, '../reminders.json');
const TOKENS_FILE = path.join(__dirname, '../fcm_tokens.json');

console.log('🔍 Testing Reminder System...\n');

// Check if reminders.json exists
if (fs.existsSync(REMINDERS_FILE)) {
  const reminders = JSON.parse(fs.readFileSync(REMINDERS_FILE, 'utf8'));
  console.log(`✅ reminders.json found with ${reminders.length} reminders:`);
  reminders.forEach((reminder, index) => {
    console.log(`  ${index + 1}. "${reminder.title}" - ${reminder.time} (sent: ${reminder.sent})`);
  });
} else {
  console.log('❌ reminders.json not found - no reminders have been created yet');
}

console.log('');

// Check if fcm_tokens.json exists
if (fs.existsSync(TOKENS_FILE)) {
  const tokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
  console.log(`✅ fcm_tokens.json found with ${tokens.length} tokens`);
  if (tokens.length > 0) {
    console.log('  First token:', tokens[0].substring(0, 20) + '...');
  }
} else {
  console.log('❌ fcm_tokens.json not found - users need to grant notification permissions');
}

console.log('\n📋 To test the system:');
console.log('1. Open your app in the browser');
console.log('2. Grant notification permissions when prompted');
console.log('3. Create a reminder for 1-2 minutes from now');
console.log('4. Wait for the notification to arrive');
console.log('5. Check the console for scheduler logs');

console.log('\n🚀 Scheduler should be running automatically...'); 