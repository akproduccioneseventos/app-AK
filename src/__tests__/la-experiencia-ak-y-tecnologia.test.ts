/**
 * @fileOverview Pruebas para las páginas públicas /experiencia y /tecnologia (Orden 106 Bloques 9 y 12).
 * Verifica que no contengan palabras prohibidas (garant, 24/7, cero fallas),
 * que la lista de tecnologías se lea de la misma fuente, y que los 6 pasos estén cubiertos.
 */

import fs from 'node:fs';
import path from 'node:path';
import { TECNOLOGIAS_AK, GRUPOS_TECNOLOGIA } from '@/data/tecnologia-ak';

describe('Orden 106 + Orden 321 — Páginas /experiencia y /tecnologia', () => {
  const experienciaPath = path.join(process.cwd(), 'src/app/experiencia/page.tsx');
  const presentacionLedPath = path.join(process.cwd(), 'src/app/presentacion-led/page.tsx');
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');

  test('la página /experiencia existe y /tecnologia redirige a /presentacion-led en next.config.js', () => {
    expect(fs.existsSync(experienciaPath)).toBe(true);
    expect(fs.existsSync(presentacionLedPath)).toBe(true);
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    expect(nextConfig).toContain("source: '/tecnologia'");
    expect(nextConfig).toContain("destination: '/presentacion-led'");
  });

  test('/experiencia no contiene promesas o palabras prohibidas (garant, 24/7, cero fallas)', () => {
    const content = fs.readFileSync(experienciaPath, 'utf8').toLowerCase();

    expect(content).not.toContain('garant');
    expect(content).not.toContain('24/7');
    expect(content).not.toContain('cero fallas');
    expect(content).not.toContain('precios congelados');

    // Debe contener las credenciales comerciales aprobadas
    expect(content).toContain('+7 años');
    expect(content).toContain('+200 eventos');
  });

  test('/experiencia cubre los 6 pasos y tiene enlace a simulador y WhatsApp', () => {
    const content = fs.readFileSync(experienciaPath, 'utf8');

    expect(content).toContain('Paso 1');
    expect(content).toContain('Paso 6');
    // Orden 331: /simulador-ak consolidado en /simulador-de-presupuesto
    expect(content).toContain('/simulador-de-presupuesto');
    expect(content).toContain('wa.me');
  });

  test('/presentacion-led y TECNOLOGIAS_AK no contienen promesas prohibidas', () => {
    const presentacionContent = fs.readFileSync(presentacionLedPath, 'utf8').toLowerCase();
    expect(presentacionContent).not.toContain('garant');
    expect(presentacionContent).not.toContain('24/7');
    expect(presentacionContent).not.toContain('cero fallas');

    expect(Object.keys(GRUPOS_TECNOLOGIA).length).toBeGreaterThan(0);
    expect(TECNOLOGIAS_AK.length).toBeGreaterThan(0);
    for (const tec of TECNOLOGIAS_AK) {
      const texto = `${tec.nombre} ${tec.descripcionCorta}`.toLowerCase();
      expect(texto).not.toContain('garant');
      expect(texto).not.toContain('24/7');
      expect(texto).not.toContain('cero fallas');
    }
  });

  test('cada tecnología en TECNOLOGIAS_AK tiene un pasoDemo entre 1 y 6 correspondiente a la experiencia', () => {
    for (const tec of TECNOLOGIAS_AK) {
      expect(tec.pasoDemo).toBeGreaterThanOrEqual(1);
      expect(tec.pasoDemo).toBeLessThanOrEqual(6);
    }
  });
});
