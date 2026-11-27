import { NextResponse } from 'next/server';
import { registrarClicEnlace } from '@/lib/presencia-digital/enlaces-bio';
import { buildWhatsAppLink } from '@/lib/commercial/contact';
import { AK_SOCIAL_LINKS } from '@/lib/public-contact';

// Sólo estos botones cuentan: un nombre inventado desde afuera no se guarda (revisión de la 1451).
const DESTINOS: Record<string, () => string> = {
  presupuesto: () => '/simulador-de-presupuesto?utm_source=instagram&utm_medium=bio',
  fiestas: () => '/#landing-gallery',
  // El WhatsApp de verdad, con la marca de origen para que entre al CRM (orden 325).
  whatsapp: () => buildWhatsAppLink(undefined, undefined, 'AK-bio'),
  redes: () => AK_SOCIAL_LINKS.instagram,
};

const SITE_ORIGIN_FALLBACK = (process.env.NEXT_PUBLIC_SITE_URL || 'https://akproducciones.uy').replace(/\/+$/, '');

function resolverOrigenPublico(request: Request, urlObj: URL): string {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const hostHeader = request.headers.get('host')?.split(',')[0]?.trim();
  const hostCandidato = forwardedHost || hostHeader || urlObj.host;
  const hostSinPuerto = hostCandidato.replace(/:\d+$/, '').toLowerCase();

  if (!hostCandidato || hostSinPuerto === '0.0.0.0' || hostSinPuerto === '::' || hostSinPuerto === '[::]') {
    return SITE_ORIGIN_FALLBACK;
  }

  const esLocal = hostSinPuerto === 'localhost' || hostSinPuerto === '127.0.0.1';
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const proto = forwardedProto || (esLocal ? 'http' : 'https');
  return `${proto}://${hostCandidato}`;
}

export async function GET(request: Request) {
  const urlObj = new URL(request.url);
  const origin = resolverOrigenPublico(request, urlObj);
  const boton = urlObj.searchParams.get('d') || '';
  const destino = DESTINOS[boton];
  if (!destino) {
    return NextResponse.redirect(new URL('/enlaces', origin));
  }

  await registrarClicEnlace(boton).catch((e) => console.warn('[enlaces] No se pudo contar el clic:', e));
  return NextResponse.redirect(new URL(destino(), origin));
}
