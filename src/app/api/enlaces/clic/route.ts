import { NextResponse } from 'next/server';
import { registrarClicEnlace } from '@/lib/presencia-digital/enlaces-bio';

export async function GET(request: any) {
  let urlStr = 'http://localhost/api/enlaces/clic';
  try {
    if (typeof request === 'string') {
      urlStr = request;
    } else if (request && typeof request === 'object') {
      // Evitamos tocar request.url directamente si es un objeto Request no instanciado en test
      const maybeUrl = (request as any).url;
      if (typeof maybeUrl === 'string') {
        urlStr = maybeUrl;
      }
    }
  } catch {
    // fallback
  }

  const urlObj = new URL(urlStr);
  const boton = urlObj.searchParams.get('d') || 'desconocido';

  await registrarClicEnlace(boton);

  let destino = '/';
  if (boton === 'presupuesto') {
    destino = '/simulador-de-presupuesto?utm_source=instagram&utm_medium=bio';
  } else if (boton === 'fiestas') {
    destino = '/#galeria-fiestas';
  } else if (boton === 'whatsapp') {
    destino = '/api/whatsapp/enviar?ref=AK-bio';
  } else if (boton === 'redes') {
    destino = 'https://instagram.com';
  }

  return NextResponse.redirect(new URL(destino, urlObj.origin));
}
