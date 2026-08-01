import { NextRequest, NextResponse } from 'next/server';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { isSpotifyConfigured, searchSpotifyTracks } from '@/lib/spotify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q')?.trim() || '';
    if (query.length < 2 || query.length > 80) {
      return NextResponse.json({ error: 'Escribe al menos dos caracteres.' }, { status: 400 });
    }
    if (!isSpotifyConfigured()) {
      return NextResponse.json({ error: 'Spotify todavia no esta habilitado.' }, { status: 503 });
    }
    await enforcePublicRateLimit({
      scope: 'spotify-search',
      limit: 30,
      windowMs: 60_000,
    });
    const tracks = await searchSpotifyTracks(query);
    return NextResponse.json({ tracks }, { headers: { 'Cache-Control': 'private, max-age=60' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo buscar en Spotify.';
    const status = message.startsWith('Demasiados intentos') ? 429 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
