import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { readData, writeData } from '@/lib/data-service';
import type { MetaMensajeDirecto } from '@/lib/mensajes/bandeja-unica';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ARCHIVO_MENSAJES = 'social-mensajes-directos.json';

function obtenerMetaAppSecret(): string | null {
  return process.env.META_APP_SECRET || process.env.META_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET || null;
}

function verificarFirmaMeta(rawBody: string, signature: string | null, appSecret: string | null): boolean {
  if (!signature || !appSecret) return false;
  try {
    const expected = `sha256=${crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex')}`;
    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(expected);
    if (sigBuffer.length !== expBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expBuffer);
  } catch {
    return false;
  }
}

/**
 * GET /api/meta/webhook
 * Validación de webhook de Meta (Instagram Messaging / Messenger).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken = process.env.META_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN;
  if (!expectedToken) {
    return NextResponse.json({ error: 'Webhook de Meta sin clave de verificación configurada.' }, { status: 403 });
  }

  if (mode === 'subscribe' && challenge) {
    if (token === expectedToken) {
      return new NextResponse(challenge, { status: 200 });
    }
    return NextResponse.json({ error: 'Token de verificación de Meta inválido.' }, { status: 403 });
  }

  return NextResponse.json({ ok: true, mensaje: 'Meta Webhook endpoint activo' });
}

/**
 * POST /api/meta/webhook
 * Recepción de mensajes directos de Instagram y Messenger.
 * Comprueba X-Hub-Signature-256 y deduplica por mid.
 */
export async function POST(request: NextRequest) {
  // 1. Obtener cuerpo crudo para validar la firma HMAC-SHA256
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256') || request.headers.get('X-Hub-Signature-256');
  const secret = obtenerMetaAppSecret();

  // Validación estricta de X-Hub-Signature-256: sin clave configurada en el servidor, se rechaza todo.
  if (!secret || !verificarFirmaMeta(rawBody, signature, secret)) {
    return NextResponse.json(
      { error: 'Firma X-Hub-Signature-256 inválida o ausente' },
      { status: 403 }
    );
  }

  // 2. Parsear evento de Meta
  let payload: any = {};
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Cuerpo de solicitud JSON inválido' }, { status: 400 });
  }

  const entries = payload.entry || [];
  const incomingMessages: MetaMensajeDirecto[] = [];

  for (const entry of entries) {
    const messaging = entry.messaging || [];
    for (const msg of messaging) {
      const mid = msg.message?.mid;
      const texto = msg.message?.text;
      const senderId = msg.sender?.id;
      const recipientId = msg.recipient?.id;

      if (!mid) continue;

      incomingMessages.push({
        mid,
        canal: entry.id?.startsWith('ig_') || msg.recipient?.id?.length > 15 ? 'instagram_dm' : 'messenger',
        senderId: senderId || 'anonimo',
        recipientId: recipientId || 'ak_page',
        texto: texto || '',
        timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : new Date().toISOString(),
        contestado: false,
      });
    }
  }

  let agregadosCount = 0;
  if (incomingMessages.length > 0) {
    const guardados = await readData<MetaMensajeDirecto[]>(ARCHIVO_MENSAJES, []);
    const midsExistentes = new Set(guardados.map((m) => m.mid));
    const paraAgregar: MetaMensajeDirecto[] = [];
    for (const m of incomingMessages) {
      if (!midsExistentes.has(m.mid)) {
        midsExistentes.add(m.mid);
        paraAgregar.push(m);
      }
    }
    agregadosCount = paraAgregar.length;
    if (agregadosCount > 0) {
      await writeData(ARCHIVO_MENSAJES, [...guardados, ...paraAgregar]);
    }
  }

  return NextResponse.json({ status: 'EVENT_RECEIVED', guardados: agregadosCount }, { status: 200 });
}
