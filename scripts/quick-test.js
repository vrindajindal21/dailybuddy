const fs = require('fs');
const path = require('path');

const REMINDERS_FILE = path.join(__dirname, '../reminders.json');

// Create a test reminder for 1 minute from now
const now = new Date();
const testTime = new Date(now.getTime() + 1 * 60 * 1000); // 1 minute from now

const testReminder = {
  title: "🧪 Test Push Notification",
  body: "This is a test reminder to verify push notifications are working!",
  time: testTime.toISOString(),
  data: { 
    type: "test", 
    color: "bg-blue-500",
    days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
  },
  sent: false
};

let reminders = [];
if (fs.existsSync(REMINDERS_FILE)) {
  reminders = JSON.parse(fs.readFileSync(REMINDERS_FILE, 'utf8'));
}

reminders.push(testReminder);
fs.writeFileSync(REMINDERS_FILE, JSON.stringify(reminders, null, 2));

console.log('🧪 Test reminder created!');
console.log(`📅 Time: ${testTime.toLocaleString()}`);
console.log(`📝 Title: ${testReminder.title}`);
console.log(`📋 Total reminders: ${reminders.length}`);
console.log('');
console.log('⏰ The scheduler will send this notification in about 1 minute...');
console.log('💡 Make sure to run: npm run scheduler:watch'); 