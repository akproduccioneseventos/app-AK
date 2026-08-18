import fs from 'fs';
import path from 'path';

function leer(relativo: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativo), 'utf8');
}

describe('historial público de YouTube e identidad oficial de AK', () => {
  it('YouTube tiene barrido paginado completo cuando está disponible la Data API', () => {
    const source = leer('src/lib/social-media/youtube-history-backfill.ts');
    expect(source).toContain('youtube/v3/channels');
    expect(source).toContain('youtube/v3/playlistItems');
    expect(source).toContain('nextPageToken');
    expect(source).toContain('MAX_PAGES = 100');
    expect(source).toContain("EARLIEST_DATE = '2019-09-01T00:00:00.000Z'");
  });

  it('el feed público de la galería ya no queda cortado artificialmente en doce videos', () => {
    const source = leer('src/lib/youtube/ak-channel.ts');
    expect(source).not.toContain('.slice(0, 12)');
    expect(source).toContain('feeds/videos.xml');
  });

  it('Google recibe los perfiles públicos oficiales de AK Producciones Eventos', () => {
    const source = leer('src/components/public/LocalBusinessSchema.tsx');
    expect(source).toContain('facebook.com/akproduccionessalto/');
    expect(source).toContain('instagram.com/akproduccionesfiestasyeventos/');
    expect(source).toContain('tiktok.com/@akproduccioneseve');
    expect(source).toContain('youtube.com/channel/UClq6YnypA9PFuBgunzk306A');
    expect(source).toContain('threads.com/@akproduccionesfiestasyeventos');
    expect(source).toContain('x.com/AkSalto');
    expect(source).not.toContain('tiktok.com/@akproduccioneseventos');
  });

  it('la tarea diaria intenta actualizar YouTube junto con Meta', () => {
    const source = leer('src/app/api/cron/metricas-de-redes/route.ts');
    expect(source).toContain('syncMetaPublicHistory');
    expect(source).toContain('syncYouTubePublicHistory');
    expect(source).toContain('historialYouTube');
  });
});
