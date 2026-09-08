/**
 * MATAFUEGO — Si la pantalla dice "quedaste anotado", el correo tiene que quedar anotado.
 *
 * La primera versión le contestaba al visitante *"¡Gracias por suscribirte! Te
 * mantendremos al tanto"* **y no guardaba nada**: el correo se perdía. Es de los
 * errores más caros que hay, porque no falla nada en pantalla y encima se pierde un
 * prospecto que levantó la mano solo.
 */
import { suscribirANovedades } from '@/app/actions/novedades-suscripcion';

const guardados: Array<Record<string, unknown>> = [];
let fallaAlGuardar = false;

jest.mock('@/lib/crm/public-lead-persistence', () => ({
  upsertPublicCommercialLead: jest.fn(async (input: Record<string, unknown>) => {
    if (fallaAlGuardar) throw new Error('la base no contesta');
    guardados.push(input);
    return { lead: {}, isNew: true };
  }),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async () => {}),
}));

describe('La suscripción a novedades guarda el correo', () => {
  beforeEach(() => {
    guardados.length = 0;
    fallaAlGuardar = false;
  });

  it('un correo válido queda guardado, no sólo contestado', async () => {
    const r = await suscribirANovedades('Maria.Perez@Gmail.com');

    expect(r.success).toBe(true);
    expect(guardados).toHaveLength(1);
    expect(guardados[0].email).toBe('maria.perez@gmail.com');
  });

  it('si NO se puede guardar, no se le dice que sí al visitante', async () => {
    fallaAlGuardar = true;

    const r = await suscribirANovedades('ana@ejemplo.com');

    expect(r.success).toBe(false);
    expect(r.message.toLowerCase()).toContain('no pudimos');
    expect(guardados).toHaveLength(0);
  });

  it('un correo que no es correo no se guarda ni promete nada', async () => {
    for (const malo of ['', '   ', 'hola', 'hola@', 'sin-arroba.com']) {
      const r = await suscribirANovedades(malo);
      expect(r.success).toBe(false);
    }
    expect(guardados).toHaveLength(0);
  });
});
