import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TOKENS_FILE = path.join(process.cwd(), 'fcm_tokens.json');

export async function POST(req) {
  try {
    console.log('Save FCM token API called');
    const { token } = await req.json();
    console.log('FCM token received:', token ? token.substring(0, 20) + '...' : 'null');
    
    if (!token) {
      console.error('Missing FCM token');
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }
    
    let tokens = [];
    if (fs.existsSync(TOKENS_FILE)) {
      tokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
    }
    
    if (!tokens.includes(token)) {
      tokens.push(token);
      fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
      console.log('FCM token saved successfully. Total tokens:', tokens.length);
    } else {
      console.log('FCM token already exists. Total tokens:', tokens.length);
    }
    
    return NextResponse.json({ success: true, tokenCount: tokens.length });
  } catch (error) {
    console.error('Save FCM token error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 