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

export async function GET(request: Request) {
  const urlObj = new URL(request.url);
  const boton = urlObj.searchParams.get('d') || '';
  const destino = DESTINOS[boton];
  if (!destino) {
    return NextResponse.redirect(new URL('/enlaces', urlObj.origin));
  }

  await registrarClicEnlace(boton).catch((e) => console.warn('[enlaces] No se pudo contar el clic:', e));
  return NextResponse.redirect(new URL(destino(), urlObj.origin));
}
