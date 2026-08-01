import 'server-only';

import type { SpotifyTrackSuggestion } from '@/types/spotify';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_SEARCH_URL = 'https://api.spotify.com/v1/search';
const REQUEST_TIMEOUT_MS = 8_000;

let cachedToken: { value: string; expiresAt: number } | undefined;
const searchCache = new Map<string, { tracks: SpotifyTrackSuggestion[]; expiresAt: number }>();

export function isSpotifyConfigured() {
  return Boolean(process.env.SPOTIFY_CLIENT_ID?.trim() && process.env.SPOTIFY_CLIENT_SECRET?.trim());
}

async function spotifyFetch(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timeout);
  }
}

async function getSpotifyAccessToken(forceRefresh = false) {
  if (!isSpotifyConfigured()) throw new Error('Spotify no esta configurado.');
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID!.trim()}:${process.env.SPOTIFY_CLIENT_SECRET!.trim()}`,
  ).toString('base64');
  const response = await spotifyFetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  });
  if (!response.ok) throw new Error('Spotify rechazo las credenciales configuradas.');

  const payload = await response.json() as { access_token?: string; expires_in?: number };
  if (!payload.access_token) throw new Error('Spotify no devolvio un token de acceso.');
  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + Math.max(300, payload.expires_in || 3600) * 1000,
  };
  return cachedToken.value;
}

export async function searchSpotifyTracks(query: string, limit = 6): Promise<SpotifyTrackSuggestion[]> {
  const cleanQuery = query.trim().slice(0, 80);
  if (cleanQuery.length < 2) return [];
  const safeLimit = Math.min(10, Math.max(1, Math.trunc(limit)));
  const cacheKey = `${cleanQuery.toLowerCase()}|${safeLimit}`;
  const cachedSearch = searchCache.get(cacheKey);
  if (cachedSearch && cachedSearch.expiresAt > Date.now()) return cachedSearch.tracks;

  const runSearch = async (forceRefresh: boolean) => {
    const token = await getSpotifyAccessToken(forceRefresh);
    const url = new URL(SPOTIFY_SEARCH_URL);
    url.searchParams.set('q', cleanQuery);
    url.searchParams.set('type', 'track');
    url.searchParams.set('limit', String(safeLimit));
    url.searchParams.set('market', 'UY');
    return spotifyFetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  };

  let response = await runSearch(false);
  if (response.status === 401) response = await runSearch(true);
  if (!response.ok) throw new Error('Spotify no pudo buscar canciones en este momento.');

  const payload = await response.json() as {
    tracks?: {
      items?: Array<{
        id?: string;
        name?: string;
        artists?: Array<{ name?: string }>;
        album?: { name?: string };
        external_urls?: { spotify?: string };
      }>;
    };
  };

  const tracks = (payload.tracks?.items || [])
    .filter((track): track is NonNullable<typeof track> & { id: string; name: string } => Boolean(track.id && track.name))
    .map((track) => ({
      id: track.id,
      title: track.name,
      artist: track.artists?.map((artist) => artist.name).filter(Boolean).join(', ') || 'Artista desconocido',
      album: track.album?.name,
      externalUrl: track.external_urls?.spotify,
    }));
  searchCache.set(cacheKey, { tracks, expiresAt: Date.now() + 60_000 });
  return tracks;
}
