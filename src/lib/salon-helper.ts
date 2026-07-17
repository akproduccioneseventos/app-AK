import defaultCatalogoFotos from '@/data/catalogo-fotos.json';
import defaultGaleriaPublica from '@/data/galeria-publica.json';

export interface SalonPhoto {
  src: string;
  alt: string;
  title: string;
  description?: string;
}

export const CURATED_CLUB_URUGUAY_PHOTOS: SalonPhoto[] = [
  {
    src: '/media/catalogo-servicios/salon-discoteca-ak-01.jpeg',
    alt: 'Salon principal de Club Uruguay preparado para una fiesta',
    title: 'Salon principal',
    description: 'Montaje real con mesas, pista y servicio de discoteca de AK Producciones.',
  },
  {
    src: '/media/catalogo-servicios/discoteca-salon-ak-02.jpeg',
    alt: 'Pista y discoteca instaladas en Club Uruguay',
    title: 'Pista y discoteca',
    description: 'Iluminacion, sonido y pista preparados para el evento.',
  },
  {
    src: '/media/catalogo-servicios/xv-pista-iluminada-01.jpeg',
    alt: 'Fiesta de quince anos con pista iluminada',
    title: 'Una fiesta en funcionamiento',
    description: 'Una produccion real con ambientacion, pista y coordinacion integral.',
  },
];

function explicitlyReferencesClubUruguay(value: string) {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized.includes('club uruguay') || normalized.includes('cluburuguay');
}

export function getDynamicSalonPhotos(): SalonPhoto[] {
  const curatedUrls = new Set(CURATED_CLUB_URUGUAY_PHOTOS.map((photo) => photo.src));
  const allItems = [
    ...defaultCatalogoFotos.map((item) => ({
      url: item.url,
      titulo: item.titulo,
      descripcion: item.descripcion,
      categoria: item.categoriaServicio,
    })),
    ...defaultGaleriaPublica.fotos.map((item) => ({
      url: item.url,
      titulo: item.titulo,
      descripcion: item.descripcion,
      categoria: item.categoria,
    })),
  ];

  const explicitPhotos = allItems
    .filter((item) => {
      if (!item.url || curatedUrls.has(item.url)) return false;
      return explicitlyReferencesClubUruguay(
        `${item.titulo || ''} ${item.descripcion || ''} ${item.categoria || ''} ${item.url}`,
      );
    })
    .map((item) => ({
      src: item.url,
      alt: item.titulo || 'Evento de AK Producciones en Club Uruguay',
      title: item.titulo || 'Evento en Club Uruguay',
      description: item.descripcion || 'Registro real asociado a Club Uruguay.',
    }));

  const seen = new Set<string>();
  return [...CURATED_CLUB_URUGUAY_PHOTOS, ...explicitPhotos].filter((photo) => {
    if (seen.has(photo.src)) return false;
    seen.add(photo.src);
    return true;
  });
}
