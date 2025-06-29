import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const REMINDERS_FILE = path.join(process.cwd(), 'reminders.json');

export async function POST(req) {
  try {
    const { title, body, time, data } = await req.json();
    if (!title || !body || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    let reminders = [];
    if (fs.existsSync(REMINDERS_FILE)) {
      reminders = JSON.parse(fs.readFileSync(REMINDERS_FILE, 'utf8'));
    }
    reminders.push({ title, body, time, data, sent: false });
    fs.writeFileSync(REMINDERS_FILE, JSON.stringify(reminders, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save reminder error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 