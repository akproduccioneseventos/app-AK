/**
 * Videos de ayuda que el dueño carga para explicar cómo usar cada pantalla.
 * No se suben archivos a la app: se configuran como enlaces de YouTube.
 */

export interface LugarConfig {
  clave: string;
  nombre: string;
  pantalla: string;
}

export const LUGARES_CON_VIDEO: readonly LugarConfig[] = [
  {
    clave: 'portal-invitado',
    nombre: 'Panel del invitado',
    pantalla: 'src/app/portal-invitado/[fiestaId]/[guestId]/page.tsx',
  },
  {
    clave: 'hub-de-la-fiesta',
    nombre: 'La puerta de la fiesta (hub)',
    pantalla: 'src/app/evento/hub/[fiestaId]/page.tsx',
  },
  {
    clave: 'portal-cliente',
    nombre: 'Portal del cliente',
    pantalla: 'src/app/portal-cliente/[id]/page.tsx',
  },
  {
    clave: 'video-de-vida',
    nombre: 'Video de Vida (subir fotos)',
    pantalla: 'src/app/video-vida/[fiestaId]/page.tsx',
  },
  {
    clave: 'simulador',
    nombre: 'Simulador de presupuesto',
    pantalla: 'src/app/simulador-de-presupuesto/page.tsx',
  },
  {
    clave: 'muro-subir-foto',
    nombre: 'Subir fotos al muro',
    pantalla: 'src/app/evento/social/[fiestaId]/page.tsx',
  },
] as const;

export type LugarConVideo = (typeof LUGARES_CON_VIDEO)[number]['clave'];

export interface VideoAyudaItem {
  lugar: string;
  youtubeUrl: string;
  titulo?: string;
  actualizadoEn?: string;
}

export interface VideoAyudaInfo {
  lugar: string;
  videoId: string;
  titulo?: string;
}

/**
 * Extrae el ID de video de YouTube a partir de cualquiera de los formatos aceptados:
 * - youtube.com/watch?v=ID
 * - youtu.be/ID
 * - youtube.com/shorts/ID
 * Devuelve null para cualquier otro enlace o texto.
 */
export function idDeYoutube(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // 1. youtu.be/<id>
  const youtuBeMatch = trimmed.match(/^https?:\/\/(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{6,20})(?:\?.*)?$/i);
  if (youtuBeMatch?.[1]) return youtuBeMatch[1];

  // 2. youtube.com/shorts/<id>
  const shortsMatch = trimmed.match(/^https?:\/\/(?:www\.|m\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,20})(?:\?.*)?$/i);
  if (shortsMatch?.[1]) return shortsMatch[1];

  // 3. youtube.com/watch?v=<id>
  const watchMatch = trimmed.match(/^https?:\/\/(?:www\.|m\.)?youtube\.com\/watch\?(?:[^&]+&)*v=([a-zA-Z0-9_-]{6,20})(?:&.*)?$/i);
  if (watchMatch?.[1]) return watchMatch[1];

  return null;
}
