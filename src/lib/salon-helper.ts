import defaultCatalogoFotos from '@/data/catalogo-fotos.json';
import defaultGaleriaPublica from '@/data/galeria-publica.json';

export interface SalonPhoto {
  src: string;
  alt: string;
  title: string;
  description?: string;
}

export function getDynamicSalonPhotos(): SalonPhoto[] {
  // Combine all images from catalog and public gallery
  const allItems = [
    ...defaultCatalogoFotos.map((x) => ({
      url: x.url,
      titulo: x.titulo,
      descripcion: x.descripcion,
      categoria: x.categoriaServicio,
    })),
    ...defaultGaleriaPublica.fotos.map((x) => ({
      url: x.url,
      titulo: x.titulo,
      descripcion: x.descripcion,
      categoria: x.categoria,
    })),
  ];

  const seenUrls = new Set<string>();
  const salonPhotos: SalonPhoto[] = [];

  for (const item of allItems) {
    if (!item.url || seenUrls.has(item.url)) continue;

    const text = `${item.titulo || ''} ${item.descripcion || ''} ${item.categoria || ''} ${item.url}`.toLowerCase();

    // Check if it belongs to Salon / Club Uruguay
    if (
      text.includes('salon') ||
      text.includes('salón') ||
      text.includes('club') ||
      text.includes('uruguay')
    ) {
      seenUrls.add(item.url);
      salonPhotos.push({
        src: item.url,
        alt: item.titulo || 'Salón Club Uruguay decorado por AK Producciones',
        title: item.titulo || 'Montaje de Fiesta',
        description: item.descripcion || 'Servicio integral en Salón Club Uruguay.',
      });
    }
  }

  // Fallback default photos if empty
  if (salonPhotos.length === 0) {
    return [
      {
        src: '/media/catalogo-servicios/recepcion-display-evento-01.jpeg',
        alt: 'Recepción en Club Uruguay',
        title: 'Recepción Elegante',
        description: 'Montaje formal e ingreso al salón clásico.',
      },
      {
        src: '/media/catalogo-servicios/decoracion-boda-mesa-01.jpeg',
        alt: 'Decoración en Club Uruguay',
        title: 'Salón Principal',
        description: 'Decoración integral y mesas dispuestas para la cena.',
      },
      {
        src: '/media/catalogo-servicios/boda_persuasiva.png',
        alt: 'Mesa Principal y Ambiente',
        title: 'Arquitectura y Diseño',
        description: 'Ambiente señorial adaptado con las últimas tendencias.',
      },
    ];
  }

  return salonPhotos;
}
