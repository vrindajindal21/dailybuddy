import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SUBS_FILE = path.join(process.cwd(), 'push_subscriptions.json');

export async function POST(req) {
  try {
    const subscription = await req.json();
    let subs = [];
    if (fs.existsSync(SUBS_FILE)) {
      subs = JSON.parse(fs.readFileSync(SUBS_FILE, 'utf8'));
    }
    // Avoid duplicates
    if (!subs.find(s => s.endpoint === subscription.endpoint)) {
      subs.push(subscription);
      fs.writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2));
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 