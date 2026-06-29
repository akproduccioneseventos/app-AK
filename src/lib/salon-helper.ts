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
        src: '/media/catalogo-servicios/salon-discoteca-ak-01.jpeg',
        alt: 'Pista y Discoteca en Club Uruguay',
        title: 'Montaje de Gala',
        description: 'Montaje de discoteca y sonido profesional en el salón clásico.',
      },
      {
        src: '/media/catalogo-servicios/discoteca-salon-ak-02.jpeg',
        alt: 'Pantallas y Sonido de Vanguardia',
        title: 'Discoteca y Escenario',
        description: 'Decoración e iluminación robótica integrada en el evento.',
      },
      {
        src: '/media/catalogo-servicios/xv-pista-iluminada-01.jpeg',
        alt: 'Pista de Luces LED Activa',
        title: 'Pista LED Interactiva',
        description: 'Pista LED interactiva, un diferencial único de nuestras fiestas.',
      },
    ];
  }

  return salonPhotos;
}
