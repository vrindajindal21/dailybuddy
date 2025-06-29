import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import path from 'path';

// Path to your service account JSON
const serviceAccountPath = path.join(process.cwd(), 'dailybuddy-5e891-firebase-adminsdk-fbsvc-5ecc7e2c89.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
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