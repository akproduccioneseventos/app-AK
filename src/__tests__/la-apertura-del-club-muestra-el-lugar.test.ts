import {
  CURATED_CLUB_URUGUAY_PHOTOS,
  HERO_CLUB_URUGUAY_PHOTO,
  dedupeSalonPhotos,
  getClubUruguayHeroPhoto,
  type SalonPhoto,
} from '@/lib/salon-helper';

describe('Orden 296: la apertura del Club Uruguay muestra el lugar', () => {
  it('con salon.fotos = ["/a.jpg"] y sin foto isHero adicional, getClubUruguayHeroPhoto devuelve "/a.jpg"', () => {
    const sinHeroExplicito: SalonPhoto[] = CURATED_CLUB_URUGUAY_PHOTOS.map((p) => ({
      ...p,
      isHero: false,
    }));
    const hero = getClubUruguayHeroPhoto(sinHeroExplicito, '/a.jpg');
    expect(hero.src).toBe('/a.jpg');
  });

  it('incluso con la lista curada por defecto, si salon.fotos trae ["/a.jpg"], prioriza "/a.jpg" frente al respaldo HERO_CLUB_URUGUAY_PHOTO', () => {
    const hero = getClubUruguayHeroPhoto(CURATED_CLUB_URUGUAY_PHOTOS, '/a.jpg');
    expect(hero.src).toBe('/a.jpg');
  });

  it('sin fotos del módulo, devuelve HERO_CLUB_URUGUAY_PHOTO', () => {
    const hero = getClubUruguayHeroPhoto([], undefined);
    expect(hero).toEqual(HERO_CLUB_URUGUAY_PHOTO);
  });

  it('en la lista de la galería las fotos del módulo van antes que las de fiestas', () => {
    const masterPhotos: SalonPhoto[] = ['/a.jpg', '/b.jpg'].map((src, index) => ({
      src,
      alt: `Club Uruguay, vista ${index + 1}`,
      title: index === 0 ? 'El lugar' : `Vista ${index + 1}`,
      description: undefined,
      aprobada: true,
    }));
    const curated = CURATED_CLUB_URUGUAY_PHOTOS;
    const heroPhoto = getClubUruguayHeroPhoto(curated, '/a.jpg');
    const allPhotos = dedupeSalonPhotos([
      heroPhoto,
      ...masterPhotos.filter((p) => p.src !== heroPhoto.src),
      ...curated.filter((p) => p.src !== heroPhoto.src),
    ]);

    expect(allPhotos[0].src).toBe('/a.jpg');
    expect(allPhotos[1].src).toBe('/b.jpg');
    expect(allPhotos.slice(2).map((p) => p.src)).toEqual(curated.map((p) => p.src));
  });
});
