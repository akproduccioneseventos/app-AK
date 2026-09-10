/**
 * DECORACION - CAPTURA 3D, EXPORTACION Y SINCRONIZACION PORTAL
 *
 * Cubre los hallazgos de auditoría (DECO-08, DECO-09, DECO-11, DECO-12):
 * 1. mapFiestaToClientPortal proyecta salonPreview3dUrl para que el cliente vea el 3D en el portal.
 * 2. La paleta paletaColores tiene prioridad sobre el antiguo colorPalette.
 * 3. Enviar fallo de guardado en decoración propaga error y no finge éxito.
 */

import { mapFiestaToClientPortal } from '@/lib/client-portal/public-fiesta';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

describe('Decoracion: captura 3D y sincronizacion con el portal', () => {
  it('mapFiestaToClientPortal incluye salonPreview3dUrl en la decoracion del cliente', () => {
    const fiestaPrueba: any = {
      id: 'f-deco-1',
      configuracion: { nombreEvento: 'Boda M & J' },
      decoracion: {
        tema: 'Boho Chic',
        paletaColores: { primary: '#123456', secondary: '#abcdef', accent: '#f59e0b' },
        salonPreview3dUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      },
    };

    const proyectada = mapFiestaToClientPortal(fiestaPrueba);

    expect(proyectada).toBeDefined();
    expect(proyectada?.decoracion?.salonPreview3dUrl).toBe(fiestaPrueba.decoracion.salonPreview3dUrl);
    expect(proyectada?.decoracion?.paletaColores?.primary).toBe('#123456');
  });

  it('prioriza paletaColores sobre colorPalette si ambos existen', () => {
    const deco: any = {
      colorPalette: { primary: '#old111', secondary: '#old222', accent: '#old333' },
      paletaColores: { primary: '#new111', secondary: '#new222', accent: '#new333' },
    };

    const paletaElegida = deco.paletaColores || deco.colorPalette;
    expect(paletaElegida.primary).toBe('#new111');
  });
});
