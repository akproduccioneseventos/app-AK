/** @jest-environment node */

/**
 * Orden 194 / Bloque 4: Auditoría 20-10 - Lo que ve el cliente y el invitado
 * - mapGuest trae checkedIn y no trae teléfono/celular/phone.
 * - La decoración desde el portal devuelve success: true sin sesión del equipo.
 */

import { mapFiestaToClientPortal } from '@/lib/client-portal/public-fiesta';
import { updateDecoracion } from '@/app/actions/fiesta/decoracion.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

jest.mock('@/lib/auth/equipo-de-la-fiesta', () => ({
  usuarioDelEquipo: jest.fn(async () => null), // Sin sesión del equipo (cliente del portal)
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  updateFiestaPartial: jest.fn(async (_id, _data, _opts) => ({ success: true })),
  getFiestaById: jest.fn(async () => null),
  saveFiesta: jest.fn(async () => ({ success: true })),
}));

describe('El portal ve lo que muestra y protege la privacidad', () => {
  it('1. mapGuest trae checkedIn y omite números de teléfono, celular o datos privados', () => {
    const fiestaMock: Partial<FiestaEnPlanificacion> = {
      id: 'fiesta_portal_123',
      invitados: [
        {
          id: 'inv_456',
          nombre: 'Mariana Silva',
          categoria: 'Familia',
          rsvp: 'Confirmado',
          checkedIn: true,
          partySize: 3,
          tableNumber: 4,
          telefono: '099123456',
          celular: '098765432',
          phone: '+59899123456',
          notes: 'Mesa cerca de la pista',
        } as any,
      ],
      videoVida: {
        galleryEnabled: true,
        photoCount: 15,
        photosUploaded: 12,
      } as any,
    };

    const resultado = mapFiestaToClientPortal(fiestaMock as FiestaEnPlanificacion);
    expect(resultado).toBeDefined();
    expect(resultado?.invitados).toHaveLength(1);

    const invitadoMapeado: any = resultado?.invitados?.[0];
    expect(invitadoMapeado.id).toBe('inv_456');
    expect(invitadoMapeado.nombre).toBe('Mariana Silva');
    expect(invitadoMapeado.checkedIn).toBe(true);
    expect(invitadoMapeado.tableNumber).toBe(4);

    // Privacidad: no debe filtrar teléfonos ni notas internas
    expect(invitadoMapeado.telefono).toBeUndefined();
    expect(invitadoMapeado.celular).toBeUndefined();
    expect(invitadoMapeado.phone).toBeUndefined();
    expect(invitadoMapeado.notes).toBeUndefined();

    // Video vida expone photoCount y photosUploaded
    expect(resultado?.videoVida?.photoCount).toBe(15);
    expect((resultado?.videoVida as any)?.photosUploaded).toBe(12);
  });

  it('2. La decoración guardada desde el portal del cliente devuelve success: true sin sesión de equipo', async () => {
    const res = await updateDecoracion('fiesta_portal_123', {
      salonElements: [],
      itemsDecoracion: [],
      estiloGeneral: 'Minimalista Vintage',
    });

    expect(res.success).toBe(true);
    expect(res.updatedData).toBeDefined();
    expect(res.updatedData?.estiloGeneral).toBe('Minimalista Vintage');
  });
});
