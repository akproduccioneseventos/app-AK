export interface SalonPhoto {
  src: string;
  alt: string;
  title: string;
  description?: string;
  isHero?: boolean;
  espacio?: 'principal' | 'intimo' | 'general';
  aprobada?: boolean;
}

export const CURATED_CLUB_URUGUAY_PHOTOS: SalonPhoto[] = [
  {
    src: '/media/catalogo-servicios/salon-discoteca-ak-01.jpeg',
    alt: 'Salón principal de Club Uruguay preparado para una fiesta',
    title: 'Salón principal',
    description: 'Montaje real con mesas, pista y servicio de discoteca de AK Producciones.',
    isHero: true,
    espacio: 'general',
    aprobada: true,
  },
  {
    src: '/media/catalogo-servicios/discoteca-salon-ak-02.jpeg',
    alt: 'Pista y discoteca instaladas en Club Uruguay',
    title: 'Pista y discoteca',
    description: 'Iluminación, sonido y pista preparados para el evento.',
    espacio: 'general',
    aprobada: true,
  },
  {
    src: '/media/catalogo-servicios/xv-pista-iluminada-01.jpeg',
    alt: 'Fiesta de quince años con pista iluminada',
    title: 'Una fiesta en funcionamiento',
    description: 'Una producción real con ambientación, pista y coordinación integral.',
    espacio: 'general',
    aprobada: true,
  },
];

export const HERO_CLUB_URUGUAY_PHOTO: SalonPhoto = CURATED_CLUB_URUGUAY_PHOTOS[0];

export function getClubUruguayHeroPhoto(photos?: SalonPhoto[]): SalonPhoto {
  const explicitHero = photos?.find((p) => p.isHero && p.aprobada);
  return explicitHero || HERO_CLUB_URUGUAY_PHOTO;
}

export function dedupeSalonPhotos(photos: SalonPhoto[]): SalonPhoto[] {
  const seen = new Set<string>();
  return photos.filter((photo) => {
    if (!photo.src || seen.has(photo.src)) return false;
    seen.add(photo.src);
    return true;
  });
}

/**
 * Retorna las fotos aprobadas y verificadas para Club Uruguay.
 *
 * Desliga la galería de coincidencias accidentales de texto en el catálogo:
 * un activo con título o etiqueta "Club" que no esté expresamente aprobado
 * NO se atribuye al salón.
 *
 * Admite incorporar nuevas fotos aprobadas sin límite artificial.
 */
export function getDynamicSalonPhotos(additionalApproved: SalonPhoto[] = []): SalonPhoto[] {
  const approvedList = [
    ...CURATED_CLUB_URUGUAY_PHOTOS,
    ...additionalApproved.filter((p) => p.aprobada === true),
  ];

  return dedupeSalonPhotos(approvedList);
}
