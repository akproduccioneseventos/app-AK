import fs from 'fs';
import path from 'path';

function leer(relativo: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativo), 'utf8');
}

const BACKFILL = 'src/lib/social-media/meta-history-backfill.ts';
const TAREA = 'src/app/api/cron/metricas-de-redes/route.ts';

describe('el historial público de Meta se reconstruye completo', () => {
  it('recorre las páginas de Facebook e Instagram y no se queda en una muestra fija', () => {
    const fuente = leer(BACKFILL);

    expect(fuente).toContain('while (nextUrl && pages < maxPages)');
    expect(fuente).toContain('FULL_PAGE_LIMIT = 100');
    expect(fuente).toContain('/published_posts?');
    expect(fuente).toContain('/media?fields=');
  });

  it('conserva las fechas reales y los enlaces permanentes de las publicaciones', () => {
    const fuente = leer(BACKFILL);

    expect(fuente).toContain('item.timestamp');
    expect(fuente).toContain('item.created_time');
    expect(fuente).toContain('item.permalink');
    expect(fuente).toContain('item.permalink_url');
    expect(fuente).toContain("status: 'Importado historial'");
  });

  it('parte del inicio del servicio integral y no arrastra el estudio anterior', () => {
    const fuente = leer(BACKFILL);

    expect(fuente).toContain("DEFAULT_EARLIEST_DATE = '2019-09-01T00:00:00.000Z'");
    expect(fuente).toContain('afterEarliestDate');
  });

  it('corrige las fechas de los posteos de Instagram que antes se habían sincronizado con la fecha del momento', () => {
    const fuente = leer(BACKFILL);

    expect(fuente).toContain("existing.status === 'Importado de IG'");
    expect(fuente).toContain('publishDate: accuratePublishDate');
  });

  it('se ejecuta desde la tarea diaria protegida y evita duplicados', () => {
    const backfill = leer(BACKFILL);
    const tarea = leer(TAREA);

    expect(tarea).toContain('syncMetaPublicHistory');
    expect(tarea).toContain('CRON_SECRET');
    expect(backfill).toContain('findExistingIndex');
    expect(backfill).toContain('post.sourceId');
    expect(backfill).toContain('post.sourceUrl');
    expect(backfill).toContain('post.link');
  });
});
