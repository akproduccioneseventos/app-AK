#!/usr/bin/env node
/**
 * ESTADO DE CONEXIONES CON AFUERA
 *
 * Revisa el estado de las 17 conexiones externas (Google, Meta, WhatsApp,
 * Spotify, Mercado Pago, etc.) y devuelve un resumen claro en criollo.
 *
 * No bloquea la publicación (avisa, no frena).
 */

import fs from 'node:fs';
import path from 'node:path';

function leerJson(nombreArchivo, porDefecto = {}) {
  try {
    const ruta = path.join(process.cwd(), 'data', nombreArchivo);
    if (fs.existsSync(ruta)) {
      return JSON.parse(fs.readFileSync(ruta, 'utf8'));
    }
  } catch {}
  return porDefecto;
}

export function verificarConexionesNode() {
  const settings = leerJson('settings.json', {});
  const socialConnections = leerJson('social-connections.json', []);
  const googleWs = leerJson('google-workspace.json', {});
  const whatsappConfig = leerJson('whatsapp-business.json', {});

  const findSocial = (name) =>
    Array.isArray(socialConnections)
      ? socialConnections.find((c) => c.platform?.toLowerCase() === name.toLowerCase() && (c.isConnected || c.profileUrl || c.phoneNumber))
      : null;

  const fbConn = findSocial('facebook');
  const igConn = findSocial('instagram');
  const waConn = findSocial('whatsapp');
  const ytConn = findSocial('youtube');
  const ttConn = findSocial('tiktok');
  const thConn = findSocial('threads');
  const xConn = findSocial('twitter') || findSocial('x');
  const pinConn = findSocial('pinterest');
  const spConn = findSocial('spotify');
  const uConn = Array.isArray(socialConnections) ? socialConnections.find((c) => c.webhookUrl) : null;

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.GA_MEASUREMENT_ID || settings?.googleAnalyticsId;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID || settings?.metaPixelId;
  const mpKey = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN || settings?.mercadoPagoPublicKey;
  const spotifyKey = process.env.SPOTIFY_CLIENT_ID || spConn?.apiKey || spConn?.accessToken;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

  const conexiones = [
    {
      id: 'google-analytics',
      nombre: 'Google Analytics (GA4)',
      activa: Boolean(gaId),
      detalle: gaId ? `ID: ${gaId}` : 'Sin ID configurado',
    },
    {
      id: 'google-business',
      nombre: 'Ficha de Google Business',
      activa: Boolean(settings?.googleBusinessProfileUrl || settings?.googleMapsUrl),
      detalle: settings?.googleBusinessProfileUrl ? 'Perfil vinculado' : 'Falta enlace',
    },
    {
      id: 'google-calendar',
      nombre: 'Google Calendar y Workspace',
      activa: Boolean(googleWs?.isConnected || process.env.GOOGLE_WORKSPACE_PRIVATE_KEY),
      detalle: googleWs?.isConnected ? 'Sincronizado' : 'Sin vincular',
    },
    {
      id: 'whatsapp',
      nombre: 'WhatsApp',
      activa: Boolean(waConn?.phoneNumber || whatsappConfig?.isConnected || settings?.whatsappNumber),
      detalle: waConn?.phoneNumber || settings?.whatsappNumber ? 'Número configurado' : 'Sin número',
    },
    {
      id: 'instagram',
      nombre: 'Instagram',
      activa: Boolean(igConn || process.env.INSTAGRAM_ACCESS_TOKEN),
      detalle: igConn?.username ? `@${igConn.username}` : (process.env.INSTAGRAM_ACCESS_TOKEN ? 'Token activo' : 'Sin cuenta'),
    },
    {
      id: 'facebook',
      nombre: 'Facebook',
      activa: Boolean(fbConn),
      detalle: fbConn?.username || (fbConn ? 'Página conectada' : 'Sin vincular'),
    },
    {
      id: 'youtube',
      nombre: 'YouTube',
      activa: Boolean(ytConn || true), // La puerta pública oEmbed siempre está disponible
      detalle: ytConn?.username ? `Canal: ${ytConn.username}` : 'oEmbed activo',
    },
    {
      id: 'tiktok',
      nombre: 'TikTok',
      activa: Boolean(ttConn),
      detalle: ttConn?.username ? `@${ttConn.username}` : 'No configurado',
    },
    {
      id: 'threads',
      nombre: 'Threads',
      activa: Boolean(thConn),
      detalle: thConn?.username ? `@${thConn.username}` : 'No configurado',
    },
    {
      id: 'x',
      nombre: 'X (Twitter)',
      activa: Boolean(xConn),
      detalle: xConn?.username ? `@${xConn.username}` : 'No configurado',
    },
    {
      id: 'pinterest',
      nombre: 'Pinterest',
      activa: Boolean(pinConn),
      detalle: pinConn?.boardId || pinConn?.profileUrl ? 'Tablero conectado' : 'No configurado',
    },
    {
      id: 'spotify',
      nombre: 'Spotify',
      activa: Boolean(spotifyKey),
      detalle: spotifyKey ? 'API activa' : 'Sin credenciales',
    },
    {
      id: 'mercado-pago',
      nombre: 'Mercado Pago',
      activa: Boolean(mpKey),
      detalle: mpKey ? 'Pasarela lista' : 'Faltan llaves de cobro',
    },
    {
      id: 'meta-ads',
      nombre: 'Meta Ads (Pixel)',
      activa: Boolean(metaPixelId),
      detalle: metaPixelId ? `Pixel: ${metaPixelId}` : 'Falta identificador de pixel',
    },
    {
      id: 'webhook-unificado',
      nombre: 'Webhook Unificado (n8n)',
      activa: Boolean(uConn?.webhookUrl || process.env.N8N_WEBHOOK_URL),
      detalle: uConn?.webhookUrl ? 'Webhook configurado' : 'Opcional / Sin configurar',
    },
    {
      id: 'gemini-ai',
      nombre: 'Gemini AI (IA y Renders)',
      activa: Boolean(geminiKey),
      detalle: geminiKey ? 'Clave de IA presente' : 'Sin clave de IA',
    },
    {
      id: 'google-maps',
      nombre: 'Google Maps (Geolocalización)',
      activa: Boolean(settings?.googleMapsUrl || settings?.address),
      detalle: settings?.address ? settings.address : 'Dirección base configurada',
    },
  ];

  const activas = conexiones.filter((c) => c.activa);
  const inactivas = conexiones.filter((c) => !c.activa);

  return {
    total: conexiones.length,
    activasCount: activas.length,
    inactivasCount: inactivas.length,
    conexiones,
    resumenTexto: `Conexiones: ${activas.length} de ${conexiones.length} andando.${inactivas.length > 0 ? ` Sin conectar: ${inactivas.map((c) => c.nombre).join(', ')}.` : ''}`,
  };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('conexiones-estado.mjs')) {
  console.log('\nESTADO DE LAS 17 CONEXIONES EXTERNAS\n' + '='.repeat(60));
  const res = verificarConexionesNode();
  for (const c of res.conexiones) {
    const estadoIcon = c.activa ? '✓' : '✗';
    console.log(`  [${estadoIcon}] ${c.nombre.padEnd(32)}: ${c.detalle}`);
  }
  console.log('='.repeat(60));
  console.log(`  ${res.resumenTexto}\n`);
}
