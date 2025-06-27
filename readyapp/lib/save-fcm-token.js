export async function saveFcmTokenToBackend(token, userId) {
  try {
    const res = await fetch('/api/save-fcm-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId }),
    });
    if (!res.ok) throw new Error('Failed to save FCM token');
    return await res.json();
  } catch (err) {
    console.error('Error saving FCM token:', err);
    return null;
  }
} 