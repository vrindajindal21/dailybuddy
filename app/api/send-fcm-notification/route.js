import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Path to your service account JSON
const serviceAccountPath = path.join(process.cwd(), 'service_key.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

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