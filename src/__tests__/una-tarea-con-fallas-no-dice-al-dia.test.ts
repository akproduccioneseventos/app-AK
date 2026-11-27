import fs from 'node:fs';
import path from 'node:path';
import { esFalla } from '@/lib/automatico/al-entrar-a-la-app';

describe('Orden 357 — Una tarea automática con fallas no se marca al día', () => {
  it('esFalla detecta fallados > 0 en el resultado de posteos programados', () => {
    expect(esFalla({ ok: true, fallados: [{ id: 'p1', error: 'Sin token' }] }).fallo).toBe(true);
    expect(esFalla({ ok: true, fallados: [] }).fallo).toBe(false);
  });

  it('el cron publicar-programados no llama marcarCorrida si fallados tiene elementos y generate-blog-post pasa includeRecontacto: false', () => {
    const pubCron = fs.readFileSync(
      path.resolve(__dirname, '../app/api/cron/publicar-programados/route.ts'),
      'utf8',
    );
    expect(pubCron).toContain('fallados');
    expect(pubCron.indexOf('fallados')).toBeLessThan(pubCron.lastIndexOf('marcarCorrida'));

    const blogCron = fs.readFileSync(
      path.resolve(__dirname, '../app/api/cron/generate-blog-post/route.ts'),
      'utf8',
    );
    expect(blogCron).toContain('includeRecontacto: false');
  });
});
