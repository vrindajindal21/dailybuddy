import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TOKENS_FILE = path.join(process.cwd(), 'fcm_tokens.json');

export async function POST(req) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }
    let tokens = [];
    if (fs.existsSync(TOKENS_FILE)) {
      tokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
    }
    if (!tokens.includes(token)) {
      tokens.push(token);
      fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save FCM token error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 