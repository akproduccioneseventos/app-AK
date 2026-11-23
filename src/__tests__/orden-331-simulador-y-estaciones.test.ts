import { describe, test, expect } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';

describe('Orden 331 — Pruebas para las 5 rutas del planificador agrupado y redirecciones', () => {
  const rutasPlanificador = [
    '/fiestas/nueva/datos',
    '/fiestas/nueva/comida',
    '/fiestas/nueva/show',
    '/fiestas/nueva/operacion',
    '/fiestas/nueva/plata-y-papeles',
  ];

  test('Existen los 5 page.tsx de las rutas agrupadas del planificador', () => {
    for (const ruta of rutasPlanificador) {
      const relPath = `src/app/(app)${ruta}/page.tsx`;
      const fullPath = path.join(process.cwd(), relPath);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  test('Cada grupo declara sus solapas esperadas verificando los archivos de rutas', () => {
    const gruposEsperados: Record<string, string[]> = {
      datos: ['configuracion', 'invitados', 'alergias', 'regalos', 'servicios-contratados'],
      comida: ['catering'],
      show: ['musica', 'entretenimiento', 'fotografia', 'video-vida', 'decoracion'],
      operacion: ['personal', 'carga-operativa', 'itinerario', 'orden-de-evento', 'tareas', 'reuniones', 'proveedores-portal', 'asistente', 'buzon'],
      'plata-y-papeles': ['plan-pagos', 'gestion-costos-rentabilidad', 'gestion-documental', 'portal-cliente', 'post-evento'],
    };

    for (const [grupo, solapas] of Object.entries(gruposEsperados)) {
      const pagePath = path.join(process.cwd(), `src/app/(app)/fiestas/nueva/${grupo}/page.tsx`);
      const pageContent = fs.readFileSync(pagePath, 'utf8');
      for (const solapa of solapas) {
        expect(pageContent).toContain(solapa);
      }
    }
  });

  test('next.config.js redirige correctamente desde las viejas rutas a las nuevas con query tab', () => {
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    const configContent = fs.readFileSync(nextConfigPath, 'utf8');

    expect(configContent).toContain('/fiestas/nueva/catering');
    expect(configContent).toContain('/fiestas/nueva/comida?tab=catering');
    expect(configContent).toContain('/fiestas/nueva/plan-pagos');
    expect(configContent).toContain('/fiestas/nueva/plata-y-papeles?tab=plan-pagos');
  });
});
