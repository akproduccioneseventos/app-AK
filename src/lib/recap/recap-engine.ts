import type { PublicGuestEvent } from '@/lib/guest-portal-public-data';
import type { SocialGalleryPost } from '@/types/social-gallery';

interface RecapEventLike {
  configuracion?: PublicGuestEvent['configuracion'];
  zonaDigitalAdolescentes?: PublicGuestEvent['zonaDigitalAdolescentes'];
  programa?: PublicGuestEvent['programa'];
}

export interface MorningRecap {
  eventName: string;
  eventDate: string;
  venueName: string;
  photoCount: number;
  photos: SocialGalleryPost[];
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

export function buildMorningRecap(
  fiesta: RecapEventLike,
  posts: SocialGalleryPost[],
): MorningRecap {
  const approvedPosts = posts.filter(
    (post) => (post.moderationStatus ?? 'approved') === 'approved',
  );
  const imagePosts = approvedPosts.filter((post) => post.mediaType !== 'video');
  const sortedByLikes = [...imagePosts].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));

  return {
    eventName: fiesta.configuracion?.nombreEvento || 'Evento AK',
    eventDate: fiesta.configuracion?.fechaEvento || '',
    venueName: fiesta.configuracion?.nombreLugar || '',
    photoCount: imagePosts.length,
    photos: sortedByLikes.slice(0, 8),
    programHighlights: (fiesta.programa || []).map((item) => item.titulo).filter(Boolean).slice(0, 6),
  };
}


