// To use this utility, install firebase-admin:
// npm install firebase-admin
// And initialize admin SDK with your service account credentials.

const admin = require('firebase-admin');
// admin.initializeApp({
//   credential: admin.credential.cert(require('./serviceAccountKey.json')),
// });

/**
 * Send a push notification to a device using FCM token
 * @param {string} token - FCM device token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {string} [icon] - Notification icon URL
 */
async function sendPushNotification(token, title, body, icon = '/android-chrome-192x192.png') {
  try {
    const message = {
      token,
      notification: {
        title,
        body,
        icon,
      },
    };
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

module.exports = { sendPushNotification }; 