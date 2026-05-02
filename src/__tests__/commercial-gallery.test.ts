import {
  buildCommercialGalleryBreadcrumb,
  buildCommercialGallerySearchIndex,
  buildCommercialGalleryUsageChecklist,
  filterCommercialGalleryForSurface,
  getCommercialGalleryFeaturedAssets,
  groupCommercialGalleryByEventServiceSubservice,
  searchCommercialGalleryAssets,
  type CommercialGalleryAsset,
} from '@/lib/commercial/commercial-gallery';

const assets: CommercialGalleryAsset[] = [
  {
    id: '1',
    title: 'Pintada de Kiara',
    url: '/foto1.jpg',
    type: 'foto',
    eventType: '15 anos',
    service: 'Fotografia',
    subservice: 'Pintada',
    featured: true,
    order: 2,
    surfaces: ['portal_led', 'landing'],
    tags: ['colores', 'previa'],
  },
  {
    id: '2',
    title: 'Mesa principal azul',
    url: '/foto2.jpg',
    type: 'foto',
    eventType: '15 anos',
    service: 'Decoracion',
    subservice: 'Mesa principal',
    featured: true,
    order: 1,
    surfaces: ['web'],
  },
  {
    id: '3',
    title: 'Entrada fria',
    url: '/foto3.jpg',
    type: 'foto',
    eventType: 'Boda',
    service: 'Gastronomia',
    featured: false,
  },
];

describe('commercial gallery engine', () => {
  it('groups by event type, service and subservice', () => {
    const grouped = groupCommercialGalleryByEventServiceSubservice(assets);
    const quince = grouped.find(group => group.eventType === '15 anos');

    expect(quince?.totalAssets).toBe(2);
    expect(quince?.services.some(service => service.service === 'Fotografia')).toBe(true);
    expect(quince?.services.find(service => service.service === 'Fotografia')?.subservices[0].subservice).toBe('Pintada');
  });

  it('filters by surface and featured assets', () => {
    expect(filterCommercialGalleryForSurface(assets, 'portal_led').map(asset => asset.id)).toEqual(['1', '3']);
    expect(getCommercialGalleryFeaturedAssets(assets, 1)[0].id).toBe('2');
  });

  it('builds breadcrumb and search index', () => {
    expect(buildCommercialGalleryBreadcrumb(assets[0])).toBe('15 anos > Fotografia > Pintada');
    expect(buildCommercialGallerySearchIndex(assets[0])).toContain('kiara');
    expect(searchCommercialGalleryAssets(assets, 'azul')[0].id).toBe('2');
  });

  it('returns checklist', () => {
    expect(buildCommercialGalleryUsageChecklist().length).toBeGreaterThan(4);
  });
});
