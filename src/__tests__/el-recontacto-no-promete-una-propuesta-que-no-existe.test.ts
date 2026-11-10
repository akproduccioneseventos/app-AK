/** @jest-environment node */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));
jest.mock('@/lib/firebase/server-messaging', () => ({}));

import { evaluarPasoParaLead, PASOS_RECONTACTO_DEFAULT } from '@/lib/marketing/candidatos-recontacto';
import type { CrmLead } from '@/types/crm';

describe('el recontacto no promete una propuesta que no existe', () => {
  const etapasTerminadas = new Set<string>();
  const AHORA = new Date('2026-10-10T12:00:00.000Z');
  const ahoraMs = AHORA.getTime();
  const creadoHace3Dias = new Date(ahoraMs - 3 * 24 * 60 * 60 * 1000).toISOString();

  it('sin presupuestoId, el paso 1 no habla de "propuesta" e incluye el enlace al simulador', () => {
    const leadSinPresupuesto: CrmLead = {
      id: 'lead-sin-presu',
      name: 'Sofía Rodríguez',
      phone: '099123456',
      createdAt: creadoHace3Dias,
      updatedAt: creadoHace3Dias,
      marketingConsent: true,
      partyType: '15 años',
      guestCount: 120,
    };

    const evaluacion = evaluarPasoParaLead(
      leadSinPresupuesto,
      etapasTerminadas,
      ahoraMs,
      PASOS_RECONTACTO_DEFAULT
    );

    expect(evaluacion.paso).toBe(1);
    expect(evaluacion.plantilla).toBeDefined();
    // No debe prometer una propuesta que no existe
    expect(evaluacion.plantilla?.toLowerCase()).not.toContain('propuesta');
    // Debe contener el enlace al simulador
    expect(evaluacion.plantilla).toContain('https://akproducciones.uy/simulador-de-presupuesto?');
    expect(evaluacion.plantilla).toContain('guests=120');
    expect(evaluacion.plantilla).toContain('tipo=15');
    expect(evaluacion.plantilla).toContain('vimos que empezaste a armar el presupuesto');
  });

  it('con presupuestoId, el paso 1 usa la plantilla habitual sobre la propuesta armada', () => {
    const leadConPresupuesto: CrmLead = {
      id: 'lead-con-presu',
      name: 'Camila Méndez',
      phone: '099654321',
      createdAt: creadoHace3Dias,
      updatedAt: creadoHace3Dias,
      marketingConsent: true,
      presupuestoId: 'presu-xyz-123',
      partyType: 'Boda',
    };

    const evaluacion = evaluarPasoParaLead(
      leadConPresupuesto,
      etapasTerminadas,
      ahoraMs,
      PASOS_RECONTACTO_DEFAULT
    );

    expect(evaluacion.paso).toBe(1);
    expect(evaluacion.plantilla).toBeDefined();
    // La plantilla habitual sí habla de la propuesta que armamos
    expect(evaluacion.plantilla).toContain('propuesta que te armamos');
    expect(evaluacion.plantilla).not.toContain('vimos que empezaste a armar el presupuesto');
  });
});
