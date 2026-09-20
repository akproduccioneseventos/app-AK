import fs from 'fs';
import path from 'path';
import { toPublicSocialEvent } from '@/lib/social-fiesta/public-event';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

/**
 * Orden 72 — Bloque 2: Los `as any` que LEEN un campo.
 *
 * Se encontró que en `src/lib/social-fiesta/public-event.ts` se leía:
 * - `(fiesta as any).cancionUrl`
 * - `(fiesta as any).musicaFondoUrl`
 * - `(fiesta.socialGallerySettings as any)?.cancionUrl`
 * - `(fiesta.socialGallerySettings as any)?.musicaFondoUrl`
 *
 * Dichos campos no existen en los tipos correspondientes ni son escritos
 * en ningún lugar del sistema. La URL de la música está tipada y ubicada en
 * `fiesta.invitacionConfig?.musicaFondoUrl` o `fiesta.invitacionDigital?.musicaFondoUrl`.
 */

describe('Orden 72 - Bloque 2: Ningún as any lee un campo inexistente', () => {
  const rootDir = process.cwd();

  it('public-event.ts no utiliza as any para leer campos inexistentes de cancionUrl o musicaFondoUrl', () => {
    const filePath = path.join(rootDir, 'src/lib/social-fiesta/public-event.ts');
    const content = fs.readFileSync(filePath, 'utf8');

    // No debe haber lecturas detrás de as any para cancionUrl o musicaFondoUrl
    expect(content).not.toContain('(fiesta as any).cancionUrl');
    expect(content).not.toContain('(fiesta as any).musicaFondoUrl');
    expect(content).not.toContain('(fiesta.socialGallerySettings as any)?.cancionUrl');
    expect(content).not.toContain('(fiesta.socialGallerySettings as any)?.musicaFondoUrl');
  });

  it('toPublicSocialEvent obtiene cancionUrl desde las propiedades tipadas reales', () => {
    const fiestaBase = {
      id: 'fiesta-test',
      configuracion: {
        nombreEvento: 'Boda Test',
        fechaEvento: '2026-12-31',
      },
      invitacionConfig: {
        musicaFondoUrl: 'https://cdn.akproducciones.uy/musica-real.mp3',
      },
    } as unknown as FiestaEnPlanificacion;

    const publicEvent = toPublicSocialEvent(fiestaBase);
    expect(publicEvent.cancionUrl).toBe('https://cdn.akproducciones.uy/musica-real.mp3');

    // Comprobamos también que si solo viene en invitacionDigital se resuelve
    const fiestaConDigital = {
      id: 'fiesta-test-2',
      configuracion: {
        nombreEvento: 'Quince Test',
        fechaEvento: '2026-12-31',
      },
      invitacionDigital: {
        musicaFondoUrl: 'https://cdn.akproducciones.uy/musica-digital.mp3',
      },
    } as unknown as FiestaEnPlanificacion;

    const publicEventDigital = toPublicSocialEvent(fiestaConDigital);
    expect(publicEventDigital.cancionUrl).toBe('https://cdn.akproducciones.uy/musica-digital.mp3');

    // Y que un campo fantasma inyectado como as any NO se tome si no está en las propiedades reales
    const fiestaConFantasma = {
      id: 'fiesta-test-3',
      configuracion: {
        nombreEvento: 'Cumple Test',
        fechaEvento: '2026-12-31',
      },
      cancionUrl: 'https://cdn.akproducciones.uy/fantasma.mp3',
    };
    const publicEventFantasma = toPublicSocialEvent(fiestaConFantasma as any);
    expect(publicEventFantasma.cancionUrl).toBeUndefined();
  });
});
