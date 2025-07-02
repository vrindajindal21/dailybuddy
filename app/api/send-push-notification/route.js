import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import webpush from 'web-push';

const SUBS_FILE = path.join(process.cwd(), 'push_subscriptions.json');
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  throw new Error('VAPID keys are not set in environment variables.');
}

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export async function POST(req) {
  try {
    const { title, body, data } = await req.json();
    const subs = fs.existsSync(SUBS_FILE) ? JSON.parse(fs.readFileSync(SUBS_FILE, 'utf8')) : [];
    const payload = JSON.stringify({ title, body, data });
    const results = await Promise.all(subs.map(sub =>
      webpush.sendNotification(sub, payload).catch(e => e)
    ));
    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 