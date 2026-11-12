import fs from 'node:fs';
import path from 'node:path';
import { formatDate } from '@/app/portal/page';
import { formatearFechaEvento } from '@/lib/fechas/formato-fecha-evento';

describe('Orden 286 — Bloque 3: La fecha del evento no se corre', () => {
  const originalTz = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = 'America/Montevideo';
  });

  afterAll(() => {
    process.env.TZ = originalTz;
  });

  it('el portal muestra el día 15 para 2026-10-15 sin desfasaje a 14', () => {
    const textoPortal = formatDate('2026-10-15');
    expect(textoPortal).toMatch(/\b15\b/);
    expect(textoPortal).not.toMatch(/\b14\b/);
  });

  it('formatearFechaEvento usado en el PDF de decoración y la configuración muestra el día 15', () => {
    const texto = formatearFechaEvento('2026-10-15');
    expect(texto).toMatch(/\b15\b/);
    expect(texto).not.toMatch(/\b14\b/);
  });

  it('el portal no usa T00:00:00Z que causaba desfase de medianoche en Uruguay', () => {
    const portalSource = fs.readFileSync(path.join(process.cwd(), 'src/app/portal/page.tsx'), 'utf8');
    expect(portalSource).not.toContain('T00:00:00Z');
  });

  it('decoracion/pdf y configuracion usan formatearFechaEvento', () => {
    const decoracionPdf = fs.readFileSync(path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/decoracion/pdf/page.tsx'), 'utf8');
    const configuracion = fs.readFileSync(path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/configuracion/page.tsx'), 'utf8');

    expect(decoracionPdf).toContain('formatearFechaEvento');
    expect(configuracion).toContain('formatearFechaEvento');
  });
});
