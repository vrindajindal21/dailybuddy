export async function saveFcmTokenToBackend(token, userId) {
  try {
    console.log('[saveFcmTokenToBackend] Sending:', { token, userId });
    const res = await fetch('/api/save-fcm-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId }),
    });
    console.log('[saveFcmTokenToBackend] Response status:', res.status);
    if (!res.ok) {
      const errorText = await res.text();
      console.error('[saveFcmTokenToBackend] Failed to save FCM token:', errorText);
      throw new Error('Failed to save FCM token: ' + errorText);
    }
    const data = await res.json();
    console.log('[saveFcmTokenToBackend] Success:', data);
    return data;
  } catch (err) {
    console.error('[saveFcmTokenToBackend] Error:', err);
    return null;
  }
} 