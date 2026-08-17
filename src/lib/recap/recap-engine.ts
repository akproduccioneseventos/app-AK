import type { PublicGuestEvent } from '@/lib/guest-portal-public-data';
import type { SocialGalleryPost } from '@/types/social-gallery';

interface RecapEventLike {
  configuracion?: PublicGuestEvent['configuracion'];
  zonaDigitalAdolescentes?: PublicGuestEvent['zonaDigitalAdolescentes'];
  programa?: PublicGuestEvent['programa'];
}

export interface RecapPhotoItem extends SocialGalleryPost {
  esTuFoto?: boolean;
}

export interface MorningRecap {
  eventName: string;
  eventDate: string;
  venueName: string;
  photoCount: number;
  guestPhotoCount: number;
  photos: RecapPhotoItem[];
  programHighlights: string[];
}

function nextLocalDay(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day + 1);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isRecapAvailable(fiesta: RecapEventLike, now = new Date()): boolean {
  if (
    fiesta.zonaDigitalAdolescentes?.enabled !== true ||
    fiesta.zonaDigitalAdolescentes?.recapEnabled !== true
  ) return false;

  const availableAt = nextLocalDay(fiesta.configuracion?.fechaEvento || '');
  return Boolean(availableAt && now >= availableAt);
}

/**
 * Arma el resumen de la mañana (Morning Recap).
 * Si se especifica guestId, prioriza las fotos tomadas por el invitado y completa con las mejores de la fiesta.
 */
export function buildMorningRecap(
  fiesta: RecapEventLike,
  posts: SocialGalleryPost[],
  guestId?: string,
): MorningRecap {
  const approvedPosts = posts.filter(
    (post) => (post.moderationStatus ?? 'approved') === 'approved',
  );
  const imagePosts = approvedPosts.filter((post) => post.mediaType !== 'video');

  let selectedPhotos: RecapPhotoItem[] = [];
  let guestPhotoCount = 0;

  if (guestId) {
    // 1. Fotos del propio invitado
    const userPhotos = imagePosts
      .filter((p) => p.guestId === guestId)
      .map((p) => ({ ...p, esTuFoto: true }));

    guestPhotoCount = userPhotos.length;

    // 2. Si tiene fotos, van primero
    selectedPhotos.push(...userPhotos);

    // 3. Si tiene pocas fotos (menos de 8), completamos con las más votadas de la noche
    if (selectedPhotos.length < 8) {
      const userPhotoIds = new Set(userPhotos.map((p) => p.id));
      const generalPhotos = imagePosts
        .filter((p) => !userPhotoIds.has(p.id))
        .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
        .map((p) => ({ ...p, esTuFoto: false }));

      const needed = 8 - selectedPhotos.length;
      selectedPhotos.push(...generalPhotos.slice(0, needed));
    }
  } else {
    // Sin guestId: mostrar las más votadas de la fiesta
    selectedPhotos = [...imagePosts]
      .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
      .slice(0, 8)
      .map((p) => ({ ...p, esTuFoto: false }));
  }

  return {
    eventName: fiesta.configuracion?.nombreEvento || 'Evento AK',
    eventDate: fiesta.configuracion?.fechaEvento || '',
    venueName: fiesta.configuracion?.nombreLugar || '',
    photoCount: imagePosts.length,
    guestPhotoCount,
    photos: selectedPhotos,
    programHighlights: (fiesta.programa || []).map((item) => item.titulo).filter(Boolean).slice(0, 6),
  };
}
