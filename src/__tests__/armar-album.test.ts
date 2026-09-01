import { armarAlbumInteligente } from '@/lib/album/armar-album';
import type { SocialGalleryPost, Dedication } from '@/types/social-gallery';

describe('Orden 28: Armador Inteligente del Álbum del Recuerdo', () => {
  const postsPrueba: SocialGalleryPost[] = [
    {
      id: 'p1',
      fiestaId: 'f1',
      imageUrl: 'https://ejemplo.com/foto1.jpg',
      authorName: 'Ana',
      likes: 10,
      comments: [],
      sourceModule: 'fotocabina',
      timestamp: '2026-09-01T21:00:00Z',
      moderationStatus: 'approved',
    },
    {
      id: 'p2',
      fiestaId: 'f1',
      imageUrl: 'https://ejemplo.com/foto2.jpg',
      authorName: 'Carlos',
      likes: 2,
      comments: [],
      sourceModule: 'plataforma_360',
      timestamp: '2026-09-01T22:00:00Z',
      moderationStatus: 'approved',
    },
    {
      id: 'p_oculto',
      fiestaId: 'f1',
      imageUrl: 'https://ejemplo.com/foto_oculta.jpg',
      authorName: 'Spam',
      likes: 0,
      comments: [],
      sourceModule: 'invitado',
      timestamp: '2026-09-01T22:30:00Z',
      moderationStatus: 'hidden',
    },
  ];

  const dedicatoriasPrueba: Dedication[] = [
    {
      id: 'd1',
      fiestaId: 'f1',
      authorName: 'Abuela Rosa',
      message: '¡Feliz cumple mi vida!',
      audioUrl: 'https://ejemplo.com/audio_abuela.mp3',
      timestamp: '2026-09-01T20:30:00Z',
      visibility: 'public',
    },
  ];

  it('arma el álbum seleccionando recuerdos aprobados y excluye los ocultos', () => {
    const album = armarAlbumInteligente({
      posts: postsPrueba,
      dedicatorias: dedicatoriasPrueba,
      fiesta: { nombre: 'XV de Valentina', tipoEvento: '15-anos' } as any,
    });

    expect(album.totalRecuerdos).toBe(3);
    const ids = album.todosLosRecuerdos.map((r) => r.id);
    expect(ids).toContain('p1');
    expect(ids).toContain('p2');
    expect(ids).toContain('d1');
    expect(ids).not.toContain('p_oculto');
  });

  it('incluye audios del buzón en los recuerdos seleccionados', () => {
    const album = armarAlbumInteligente({
      posts: postsPrueba,
      dedicatorias: dedicatoriasPrueba,
    });

    const audios = album.todosLosRecuerdos.filter((r) => r.tipo === 'audio');
    expect(audios.length).toBe(1);
    expect(audios[0].audioUrl).toBe('https://ejemplo.com/audio_abuela.mp3');
  });

  it('organiza los recuerdos en páginas de 2 elementos', () => {
    const album = armarAlbumInteligente({
      posts: postsPrueba,
      dedicatorias: dedicatoriasPrueba,
    });

    expect(album.paginas.length).toBe(2);
    expect(album.paginas[0].recuerdos.length).toBe(2);
    expect(album.paginas[1].recuerdos.length).toBe(1);
  });
});
