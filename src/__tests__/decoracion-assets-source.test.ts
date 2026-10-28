import { safeDecorationImageSource } from '@/lib/decoracion/asset-source';

describe('safeDecorationImageSource', () => {
  it('permite solamente PNG locales de la carpeta AK', () => {
    const path = '/media/decoracion-ak/arco_floral-01.png';
    expect(safeDecorationImageSource(path)).toBe(path);
  });

  it.each([
    'javascript:alert(1)',
    'https://example.com/deco.png',
    '//example.com/deco.png',
    '/media/decoracion-ak/../secreto.png',
    '/media/decoracion-ak/%2e%2e/secreto.png',
    '/media/decoracion-ak/%252e%252e/secreto.png',
    '/media/decoracion-ak/arco.png?x=1',
    '/media/otra-carpeta/arco.png',
  ])('rechaza fuente no permitida: %s', source => {
    expect(safeDecorationImageSource(source)).toBe('');
  });

  it('preserva las data URI de imagen heredadas', () => {
    const legacy = 'data:image/png;base64,AAAA';
    expect(safeDecorationImageSource(legacy)).toBe(legacy);
  });
});
