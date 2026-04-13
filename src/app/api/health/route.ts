import { NextResponse } from 'next/server';
import { checkFirestoreConnection } from '@/lib/firebase/firestore';

const startTime = Date.now();

export async function GET() {
  let firebaseOk = false;
  try {
    firebaseOk = await checkFirestoreConnection();
  } catch {
    firebaseOk = false;
  }

  const geminiKey = process.env.GOOGLE_GENAI_API_KEY;
  const geminiOk = typeof geminiKey === 'string' && geminiKey.length > 0 && geminiKey !== 'dummy';

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      firebase: firebaseOk,
      gemini: geminiOk,
    },
    environment: process.env.NODE_ENV ?? 'unknown',
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
}
