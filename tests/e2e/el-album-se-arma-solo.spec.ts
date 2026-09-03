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

  test('3. El álbum tiene reproductor de música de fondo, arranca en silencio y al tocar el botón comienza a sonar', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/evento/album/fiesta-demo', { waitUntil: 'domcontentloaded' });

    // 1. El elemento de audio existe
    const audioElement = page.locator('audio[data-testid="audio-fondo-album"]');
    await expect(audioElement).toBeAttached();

    // 2. Arranca en silencio (paused = true)
    const initiallyPaused = await audioElement.evaluate((el: HTMLAudioElement) => el.paused);
    expect(initiallyPaused).toBe(true);

    // 3. El botón de música de fondo está visible
    const botonMusica = page.locator('[data-testid="boton-musica-album"]');
    await expect(botonMusica).toBeVisible();
    await expect(botonMusica).toContainText(/Música/i);

    // 4. Tocamos el botón para activar la música
    // Mockeamos play() en el navegador para evitar restricciones de autoplay en navegadores headless
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

    // 5. El botón ahora indica que la música está sonando
    await expect(botonMusica).toContainText(/sonando/i);

    // 6. El audio está reproduciendo de verdad (paused = false)
    const isPlaying = await audioElement.evaluate((el: HTMLAudioElement) => !el.paused);
    expect(isPlaying).toBe(true);
  });
});