export type CommercialGalleryAssetType = 'foto' | 'video' | 'album' | 'antes_despues';
export type CommercialGallerySurface = 'portal_led' | 'web' | 'landing' | 'redes' | 'presupuesto' | 'cliente';

export type CommercialGalleryAsset = {
  id: string;
  title: string;
  url: string;
  type: CommercialGalleryAssetType;
  eventType: string;
  service: string;
  subservice?: string;
  realEventName?: string;
  tags?: string[];
  featured?: boolean;
  order?: number;
  surfaces?: CommercialGallerySurface[];
  description?: string;
};

export type CommercialGallerySubserviceGroup = {
  subservice: string;
  assets: CommercialGalleryAsset[];
  featuredAssets: CommercialGalleryAsset[];
};

export type CommercialGalleryServiceGroup = {
  service: string;
  subservices: CommercialGallerySubserviceGroup[];
  assetsWithoutSubservice: CommercialGalleryAsset[];
  totalAssets: number;
};

export type CommercialGalleryEventTypeGroup = {
  eventType: string;
  services: CommercialGalleryServiceGroup[];
  totalAssets: number;
};

function normalize(value?: string): string {
  return (value || 'Sin clasificar').trim() || 'Sin clasificar';
}

function sortAssets(assets: CommercialGalleryAsset[]): CommercialGalleryAsset[] {
  return [...assets].sort((a, b) => {
    const orderA = a.order ?? 9999;
    const orderB = b.order ?? 9999;
    if (orderA !== orderB) return orderA - orderB;
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return a.title.localeCompare(b.title, 'es');
  });
}

export function groupCommercialGalleryByEventServiceSubservice(assets: CommercialGalleryAsset[]): CommercialGalleryEventTypeGroup[] {
  const eventMap = new Map<string, CommercialGalleryAsset[]>();

  for (const asset of assets) {
    const eventType = normalize(asset.eventType);
    eventMap.set(eventType, [...(eventMap.get(eventType) ?? []), asset]);
  }

  return Array.from(eventMap.entries())
    .sort(([a], [b]) => a.localeCompare(b, 'es'))
    .map(([eventType, eventAssets]) => {
      const serviceMap = new Map<string, CommercialGalleryAsset[]>();

      for (const asset of eventAssets) {
        const service = normalize(asset.service);
        serviceMap.set(service, [...(serviceMap.get(service) ?? []), asset]);
      }

      const services = Array.from(serviceMap.entries())
        .sort(([a], [b]) => a.localeCompare(b, 'es'))
        .map(([service, serviceAssets]) => {
          const subserviceMap = new Map<string, CommercialGalleryAsset[]>();
          const assetsWithoutSubservice: CommercialGalleryAsset[] = [];

          for (const asset of serviceAssets) {
            const subservice = asset.subservice?.trim();
            if (!subservice) {
              assetsWithoutSubservice.push(asset);
              continue;
            }
            subserviceMap.set(subservice, [...(subserviceMap.get(subservice) ?? []), asset]);
          }

          const subservices = Array.from(subserviceMap.entries())
            .sort(([a], [b]) => a.localeCompare(b, 'es'))
            .map(([subservice, subserviceAssets]) => {
              const sorted = sortAssets(subserviceAssets);
              return {
                subservice,
                assets: sorted,
                featuredAssets: sorted.filter(asset => asset.featured),
              };
            });

          return {
            service,
            subservices,
            assetsWithoutSubservice: sortAssets(assetsWithoutSubservice),
            totalAssets: serviceAssets.length,
          };
        });

      return {
        eventType,
        services,
        totalAssets: eventAssets.length,
      };
    });
}

export function filterCommercialGalleryForSurface(assets: CommercialGalleryAsset[], surface: CommercialGallerySurface): CommercialGalleryAsset[] {
  return assets.filter(asset => !asset.surfaces?.length || asset.surfaces.includes(surface));
}

export function getCommercialGalleryFeaturedAssets(assets: CommercialGalleryAsset[], limit = 12): CommercialGalleryAsset[] {
  return sortAssets(assets.filter(asset => asset.featured)).slice(0, Math.max(0, limit));
}

export function buildCommercialGalleryBreadcrumb(asset: CommercialGalleryAsset): string {
  return [normalize(asset.eventType), normalize(asset.service), asset.subservice?.trim()].filter(Boolean).join(' > ');
}

export function buildCommercialGallerySearchIndex(asset: CommercialGalleryAsset): string {
  return [
    asset.title,
    asset.description,
    asset.eventType,
    asset.service,
    asset.subservice,
    asset.realEventName,
    ...(asset.tags ?? []),
  ].filter(Boolean).join(' ').toLowerCase();
}

export function searchCommercialGalleryAssets(assets: CommercialGalleryAsset[], query: string): CommercialGalleryAsset[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return sortAssets(assets);
  return sortAssets(assets.filter(asset => buildCommercialGallerySearchIndex(asset).includes(normalizedQuery)));
}

export function buildCommercialGalleryUsageChecklist(): string[] {
  return [
    'Cargar cada foto o video con tipo de fiesta, servicio y subservicio.',
    'Marcar destacadas para Portal LED y landings.',
    'Usar superficies para decidir si aparece en Portal LED, web, landing, redes o presupuesto.',
    'Usar eventos reales como prueba social cuando corresponda.',
    'Filtrar siempre por tipo de fiesta antes de vender servicios en entrevista.',
    'Evitar fotos duplicadas o sin clasificar porque bajan la calidad comercial.',
  ];
}
