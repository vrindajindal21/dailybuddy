// Use the global fetch API (Node.js v18+)
const API_URL = 'https://dailybuddyy.vercel.app/api/send-push-notification';

async function sendMedicationPush() {
  const payload = {
    title: '💊 Medication Time',
    body: 'Time to take your medication.',
    data: { url: '/dashboard/medications', type: 'medication' }
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

sendMedicationPush(); 