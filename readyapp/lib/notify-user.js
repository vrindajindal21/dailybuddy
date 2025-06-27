const { sendPushNotification } = require("./send-push-notification");

// Import tokens from the in-memory store in the API route
let tokens;
try {
  tokens = require("../pages/api/save-fcm-token").tokens;
} catch {
  tokens = [];
}

/**
 * Generate notification title and body based on feature and details
 * @param {string} feature - Feature name (e.g., 'pomodoro', 'reminder', ...)
 * @param {object} details - Additional details for the notification
 * @returns {{title: string, body: string}}
 */
function getNotificationContent(feature, details = {}) {
  switch (feature) {
    case 'pomodoro':
      return { title: 'Pomodoro Complete!', body: 'Time for a break!' };
    case 'timetable':
      return { title: 'Timetable Alert', body: details.event ? `Your next event: ${details.event}` : 'You have an upcoming event.' };
    case 'habit':
      return { title: 'Habit Reminder', body: details.habit ? `Don't forget to complete: ${details.habit}` : 'Remember to complete your habit today!' };
    case 'reminder':
      return { title: 'Reminder', body: details.text || 'You have a scheduled reminder!' };
    case 'medication':
      return { title: 'Medication Time', body: details.medication ? `Take your medicine: ${details.medication}` : 'Time to take your medicine!' };
    case 'task':
      return { title: 'Task Due', body: details.task ? `Task: ${details.task} is due!` : 'You have a task that needs your attention!' };
    case 'goal':
      return { title: 'Goal Update', body: details.goal ? `Progress on your goal: ${details.goal}` : 'Check your progress on your goal!' };
    default:
      return { title: details.title || 'Notification', body: details.body || 'You have a new notification.' };
  }
}

/**
 * Notify a user by userId for any feature.
 * @param {string} userId
 * @param {string} feature - Feature name (e.g., 'pomodoro', 'reminder', ...)
 * @param {object} details - Additional details for the notification (can include custom title/body)
 * @param {string} [icon]
 */
async function notifyUser(userId, feature, details = {}, icon = "/android-chrome-192x192.png") {
  // Find the user's token (in production, query your DB)
  const userTokenObj = tokens.find(t => t.userId === userId);
  if (!userTokenObj) {
    console.error("No FCM token found for user:", userId);
    return;
  }
  const { title, body } = getNotificationContent(feature, details);
  await sendPushNotification(userTokenObj.token, title, body, icon);
}

// Example usage:
// Pomodoro
// notifyUser(userId, "pomodoro");
// Reminders
// notifyUser(userId, "reminder", { text: "Call your friend at 5 PM." });
// Medication
// notifyUser(userId, "medication", { medication: "Blood pressure medicine" });
// Task
// notifyUser(userId, "task", { task: "Finish project report" });
// Goal
// notifyUser(userId, "goal", { goal: "Reading 80% complete" });
// Timetable
// notifyUser(userId, "timetable", { event: "Math class at 10 AM" });
// Habit
// notifyUser(userId, "habit", { habit: "Drink water" });

module.exports = { notifyUser }; 