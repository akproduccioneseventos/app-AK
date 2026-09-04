import { test, expect } from '@playwright/test';
import { armarAlbumInteligente } from '../../src/lib/album/armar-album';
import type { SocialGalleryPost } from '../../src/types/social-gallery';

test.describe('Orden 34: El álbum se arma solo al terminar la fiesta', () => {
  test('1. armarAlbumInteligente arma la portada y páginas sin intervención manual del cliente', () => {
    const postsDePrueba: SocialGalleryPost[] = [
      {
        id: 'post-1',
        fiestaId: 'fiesta-test',
        authorName: 'Invitado 1',
        imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552',
        sourceModule: 'fotocabina',
        timestamp: '2026-09-02T02:00:00.000Z',
        moderationStatus: 'approved',
        likes: 12,
        comments: [],
      },
      {
        id: 'post-2',
        fiestaId: 'fiesta-test',
        authorName: 'Invitado 2',
        imageUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6',
        sourceModule: 'plataforma360',
        timestamp: '2026-09-02T02:15:00.000Z',
        moderationStatus: 'approved',
        likes: 8,
        comments: [],
      },
      {
        id: 'post-3',
        fiestaId: 'fiesta-test',
        authorName: 'Invitado 3',
        imageUrl: 'https://audio.example.com/audio1.mp3',
        sourceModule: 'buzon',
        timestamp: '2026-09-02T02:30:00.000Z',
        moderationStatus: 'approved',
        likes: 5,
        comments: [],
      },
    ];

    const album = armarAlbumInteligente({
      posts: postsDePrueba,
      fiesta: {
        configuracion: {
          nombreEvento: 'Boda de Camila y Mateo',
          nombreAgasajado: 'Camila & Mateo',
          fechaEvento: '2026-09-02T00:00:00.000Z',
        } as any,
      },
    });

    // 1. Portada armada automáticamente con título y fecha
    expect(album.portada.titulo).toBe('Boda de Camila y Mateo');
    expect(album.portada.subtitulo).toBe('Camila & Mateo');
    expect(album.portada.fecha).toBeTruthy();

    // 2. El total de páginas se calcula solo y no está vacío
    expect(album.totalPaginas).toBeGreaterThan(0);
    expect(album.totalRecuerdos).toBe(3);
  });

  test('2. La interfaz del álbum muestra los recuerdos en la app', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/evento/album/fiesta-demo', { waitUntil: 'domcontentloaded' });
    const body = page.locator('body');
    await expect(body).toContainText(/Álbum|Recuerdos|AK/i);
  });

  test('3. La música del álbum: si la fiesta tiene canción suena, y si no, no hay botón', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/evento/album/fiesta-demo', { waitUntil: 'domcontentloaded' });

    const audioElement = page.locator('audio[data-testid="audio-fondo-album"]');
    const botonMusica = page.locator('[data-testid="boton-musica-album"]');

    // **Las dos mitades tienen que ir juntas.** Antes esta prueba daba por
    // sentado que toda fiesta tiene cancion, y se ponia en rojo con una que no
    // la tiene. Pero que no haya musica NO es un error: es la regla del dueno,
    // **nunca un boton que no hace nada**. Lo que si seria un error es que el
    // boton aparezca sin sonido detras, o que suene sin que nadie lo pida.
    const hayBoton = await botonMusica.count();
    const hayAudio = await audioElement.count();
    expect(
      hayBoton > 0 === hayAudio > 0,
      hayBoton > 0
        ? 'Aparece el botón de música pero no hay nada que suene: es un botón que no hace nada.'
        : 'Hay un reproductor de música escondido, sin botón para prenderlo.',
    ).toBe(true);

    if (hayAudio === 0) {
      // Esta fiesta no tiene cancion cargada: correcto, y no hay nada mas que
      // comprobar.
      return;
    }

    // Arranca en silencio: un album que arranca sonando solo espanta.
    expect(await audioElement.evaluate((el: HTMLAudioElement) => el.paused)).toBe(true);

    await expect(botonMusica).toBeVisible();
    await expect(botonMusica).toContainText(/Música/i);

    // El navegador de pruebas no deja arrancar sonido solo: se reemplaza el
    // arranque para poder comprobar que el boton hace lo suyo.
    await page.evaluate(() => {
      const audio = document.querySelector('audio[data-testid="audio-fondo-album"]') as HTMLAudioElement;
      if (audio) {
        audio.play = () => {
          Object.defineProperty(audio, 'paused', { value: false, writable: true });
          audio.dispatchEvent(new Event('play'));
          return Promise.resolve();
        };
      }
    });

    await botonMusica.click();
    await expect(botonMusica).toContainText(/sonando/i);
    expect(await audioElement.evaluate((el: HTMLAudioElement) => !el.paused)).toBe(true);
  });
});