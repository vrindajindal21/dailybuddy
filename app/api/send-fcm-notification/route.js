import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Use the full service account JSON from a single environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function POST(req) {
  try {
    const { token, title, body, data } = await req.json();
    if (!token || !title || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const message = {
      notification: { title, body },
      data: data || {},
      token,
    };
    const response = await admin.messaging().send(message);
    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error('FCM send error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 