import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const REMINDERS_FILE = path.join(process.cwd(), 'reminders.json');

export async function POST(req) {
  try {
    console.log('Save reminder API called');
    const { title, body, time, data } = await req.json();
    console.log('Reminder data received:', { title, body, time, data });
    
    if (!title || !body || !time) {
      console.error('Missing required fields:', { title, body, time });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    let reminders = [];
    if (fs.existsSync(REMINDERS_FILE)) {
      reminders = JSON.parse(fs.readFileSync(REMINDERS_FILE, 'utf8'));
    }
    
    const newReminder = { title, body, time, data, sent: false };
    reminders.push(newReminder);
    fs.writeFileSync(REMINDERS_FILE, JSON.stringify(reminders, null, 2));
    
    console.log('Reminder saved successfully:', newReminder);
    console.log('Total reminders in file:', reminders.length);
    
    return NextResponse.json({ success: true, reminder: newReminder });
  } catch (error) {
    console.error('Save reminder error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 