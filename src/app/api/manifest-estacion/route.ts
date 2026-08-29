import { NextResponse } from 'next/server';

/**
 * El "instalador" de una estación suelta.
 *
 * Pedido del dueño: *"yo quiero poder instalar aparte... pero sólo esa"*, y
 * después, más claro todavía: *"quiero que quede instalado; cuando entro pongo
 * la fiesta que es y ta, así no hay que instalar a cada rato."*
 *
 * Por eso el ícono **no está atado a una fiesta**. Se instala una vez, se llama
 * "Fotocabina AK", y **cada vez que se abre pregunta de qué fiesta es** —o entra
 * derecho, si el aparato ya quedó en una—. La fiesta siguiente se elige ahí
 * mismo, sin instalar nada de nuevo.
 *
 * No es la app entera: el que abre ese ícono **no puede navegar a otro lado**,
 * porque el alcance queda encerrado en las pantallas de evento.
 *
 * Es público a propósito: la máquina del empleado no tiene la sesión de AK, y
 * acá no se entrega ningún dato de la fiesta, sólo el nombre para que el ícono
 * se entienda.
 */

const NOMBRES: Record<string, string> = {
  fotocabina: 'Fotocabina',
  'plataforma-360': 'Plataforma 360',
  bogue: 'Bogue',
  'espejo-magico': 'Espejo Mágico',
  touchpix: 'Touchpix',
  buzon: 'Buzón de saludos',
  totem: 'Tótem',
  'muro-en-vivo': 'Muro social',
  barra: 'Barra de tragos',
  'video-vida': 'Video de vida',
  impresion: 'Estación de impresión',
  dj: 'Pedidos al DJ',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const estacion = (searchParams.get('estacion') || '').replace(/[^a-z0-9-]/gi, '').slice(0, 40);
  if (!estacion || !NOMBRES[estacion]) {
    return NextResponse.json({ error: 'Estacion no valida.' }, { status: 400 });
  }

  const nombreEstacion = NOMBRES[estacion];
  const nombreCompleto = `${nombreEstacion} AK`;
  // Arranca en la pantalla que pregunta de que fiesta es. Si el aparato ya quedo
  // en una, esa pantalla lo manda derecho adentro sin preguntar nada.
  const ruta = `/evento/${estacion}`;

  return NextResponse.json(
    {
      id: `/estacion-${estacion}`,
      name: nombreCompleto,
      short_name: nombreEstacion,
      description: `${nombreEstacion} de AK. Se abre, se elige de que fiesta es, y trabaja. No pasa por el resto de la app.`,
      start_url: `${ruta}?source=pwa`,
      scope: '/evento/',
      display: 'standalone',
      display_override: ['fullscreen', 'standalone', 'minimal-ui'],
      orientation: 'any',
      background_color: '#0b1120',
      theme_color: '#d71920',
      lang: 'es-UY',
      icons: [
        { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/ak-icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
      ],
    },
    {
      headers: {
        'Content-Type': 'application/manifest+json; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    },
  );
}
