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

  const geminiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  const geminiOk = typeof geminiKey === 'string' && geminiKey.length > 0 && geminiKey !== 'dummy';
  const googleWorkspaceOk = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const mailOk = Boolean(
    (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ||
    (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET) ||
    process.env.SMTP_HOST
  );
  const instagramOk = Boolean(
    (process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_INSTAGRAM_ACCESS_TOKEN) &&
    (process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || process.env.INSTAGRAM_USER_ID)
  );
  const mercadoPagoOk = Boolean(
    process.env.MERCADO_PAGO_ACCESS_TOKEN &&
    process.env.MERCADO_PAGO_WEBHOOK_SECRET
  );

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      firebase: firebaseOk,
      gemini: geminiOk,
      googleWorkspace: googleWorkspaceOk,
      mail: mailOk,
      instagram: instagramOk,
      mercadoPago: mercadoPagoOk,
    },
    environment: process.env.NODE_ENV ?? 'unknown',
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
}
