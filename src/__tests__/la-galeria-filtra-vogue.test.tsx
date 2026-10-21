
import { filtrarPorEstacion } from '@/lib/entertainment/station-config';

describe('Orden 180 - La galería filtra Vogue', () => {
  it('filtra correctamente las fotos de Vogue / Boomerang', () => {
    const posts = [
      { id: '1', sourceModule: 'fotocabina' },
      { id: '2', sourceModule: 'bogue' },
      { id: '3', sourceModule: 'boomerang' },
      { id: '4', sourceModule: 'plataforma360' },
    ];

    const filtrados = filtrarPorEstacion(posts, 'bogue');
    expect(filtrados.length).toBe(2);
    expect(filtrados.map((p) => p.id)).toEqual(['2', '3']);
  });

  it('no muestra publicaciones si no hay de esa estación', () => {
    const posts = [
      { id: '1', sourceModule: 'fotocabina' },
    ];
    const filtrados = filtrarPorEstacion(posts, 'bogue');
    expect(filtrados.length).toBe(0);
  });
});
