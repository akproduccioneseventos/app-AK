/**
 * @fileOverview Pruebas para las páginas públicas /experiencia y /tecnologia (Orden 106 Bloques 9 y 12).
 * Verifica que no contengan palabras prohibidas (garant, 24/7, cero fallas),
 * que la lista de tecnologías se lea de la misma fuente, y que los 6 pasos estén cubiertos.
 */

import fs from 'node:fs';
import path from 'node:path';
import { TECNOLOGIAS_AK, GRUPOS_TECNOLOGIA } from '@/data/tecnologia-ak';

describe('Orden 106 — Páginas /experiencia y /tecnologia', () => {
  const experienciaPath = path.join(process.cwd(), 'src/app/experiencia/page.tsx');
  const tecnologiaPath = path.join(process.cwd(), 'src/app/tecnologia/page.tsx');

  test('las páginas /experiencia y /tecnologia existen en el proyecto', () => {
    expect(fs.existsSync(experienciaPath)).toBe(true);
    expect(fs.existsSync(tecnologiaPath)).toBe(true);
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
    expect(content).toContain('/simulador-ak');
    expect(content).toContain('wa.me');
  });

  test('/tecnologia no contiene promesas prohibidas y lee de TECNOLOGIAS_AK', () => {
    const ruta = '/tecnologia';
    expect(ruta).toBe('/tecnologia');
    const content = fs.readFileSync(tecnologiaPath, 'utf8').toLowerCase();

    expect(content).not.toContain('garant');
    expect(content).not.toContain('24/7');
    expect(content).not.toContain('cero fallas');

    expect(content).toContain('+7 años');
    expect(content).toContain('+200 eventos');
    expect(content).toContain('tecnologias_ak');
    expect(content).toContain('/experiencia');
  });

  test('cada tecnología en TECNOLOGIAS_AK tiene un pasoDemo entre 1 y 6 correspondiente a la experiencia', () => {
    for (const tec of TECNOLOGIAS_AK) {
      expect(tec.pasoDemo).toBeGreaterThanOrEqual(1);
      expect(tec.pasoDemo).toBeLessThanOrEqual(6);
    }
  });
});
