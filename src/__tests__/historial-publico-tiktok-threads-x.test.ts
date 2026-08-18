import fs from 'fs';
import path from 'path';

function leer(relativo: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativo), 'utf8');
}

const BACKFILL = 'src/lib/social-media/other-public-history-backfill.ts';
const CRON = 'src/app/api/cron/metricas-de-redes/route.ts';

describe('historial público de TikTok, Threads y X', () => {
  it('TikTok usa video.list y pagina mientras la API indique que hay más', () => {
    const source = leer(BACKFILL);
    expect(source).toContain('open.tiktokapis.com/v2/video/list/');
    expect(source).toContain('TIKTOK_ACCESS_TOKEN');
    expect(source).toContain('max_count: 20');
    expect(source).toContain('payload.data?.has_more');
    expect(source).toContain('payload.data?.cursor');
  });

  it('Threads recorre /threads y sigue paging.next', () => {
    const source = leer(BACKFILL);
    expect(source).toContain('graph.threads.net/v1.0/');
    expect(source).toContain('/threads`');
    expect(source).toContain("firstUrl.searchParams.set('limit', '50')");
    expect(source).toContain('payload.paging?.next');
    expect(source).toContain('THREADS_ACCESS_TOKEN');
  });

  it('X pagina la cronología y respeta el tope oficial de 3.200', () => {
    const source = leer(BACKFILL);
    expect(source).toContain('api.x.com/2/users/by/username/');
    expect(source).toContain('/tweets`');
    expect(source).toContain("url.searchParams.set('max_results', '100')");
    expect(source).toContain("url.searchParams.set('pagination_token', nextToken)");
    expect(source).toContain('X_MAX_POSTS = 3200');
    expect(source).toContain('apiCapReached');
    expect(source).toContain('complete: !apiCapReached');
  });

  it('ninguna red se marca completa si falta autorización', () => {
    const source = leer(BACKFILL);
    expect(source).toContain("mode: 'skipped'");
    expect(source).toContain('complete: false');
    expect(source).toContain('TIKTOK_ACCESS_TOKEN');
    expect(source).toContain('THREADS_ACCESS_TOKEN');
    expect(source).toContain('X_BEARER_TOKEN');
  });

  it('la tarea diaria ejecuta Meta, YouTube y las otras tres redes', () => {
    const source = leer(CRON);
    expect(source).toContain('syncMetaPublicHistory');
    expect(source).toContain('syncYouTubePublicHistory');
    expect(source).toContain('syncOtherPublicHistory');
    expect(source).toContain('otrasRedes: historialOtrasRedes');
  });
});
