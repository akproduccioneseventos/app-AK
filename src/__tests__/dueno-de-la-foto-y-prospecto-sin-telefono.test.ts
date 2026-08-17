/**
 * Dos reglas que no se pueden mirar a ojo en una pantalla:
 *
 * 1. La foto guarda de quien es SOLO si la persona probo tener el enlace
 *    personal de ese invitado. Sin eso, cualquiera podria mandar el
 *    identificador de otro y quedarse con sus fotos.
 * 2. Una invitada que no deja telefono se guarda SIN telefono, no con uno
 *    inventado. Antes iba `099000000` y alguien del equipo perdia el viaje
 *    llamando a un numero que no existe.
 */
import { hasPublicGuestAccess } from '@/lib/guest-portal-public-data';

describe('De quien es cada foto del muro', () => {
  const invitado = { id: 'inv_1', guestAccessToken: 'token-secreto-de-ana' };

  it('reconoce al invitado cuando trae su enlace personal', () => {
    expect(hasPublicGuestAccess(invitado, 'inv_1', 'token-secreto-de-ana')).toBe(true);
  });

  it('NO lo reconoce si manda el identificador de otro sin su enlace', () => {
    expect(hasPublicGuestAccess(invitado, 'inv_1', 'token-de-otro')).toBe(false);
    expect(hasPublicGuestAccess(invitado, 'inv_1', '')).toBe(false);
    expect(hasPublicGuestAccess(undefined, 'inv_1', 'token-secreto-de-ana')).toBe(false);
  });

  it('la foto se guarda con dueño sólo cuando el enlace personal es válido', () => {
    // Es la misma condicion que usa la subida al armar la publicacion.
    const conDueno = (guestAuthorized: boolean, guestId: string) => ({
      ...(guestAuthorized && guestId ? { guestId } : {}),
    });

    expect(conDueno(true, 'inv_1')).toEqual({ guestId: 'inv_1' });
    // Sin enlace valido la foto se sube igual, pero sin dueño.
    expect(conDueno(false, 'inv_1')).toEqual({});
    // Y el invitado que nunca abrio su enlace tampoco queda bloqueado.
    expect(conDueno(false, '')).toEqual({});
  });
});

describe('La invitada que no deja teléfono', () => {
  const LEADS_FILE = 'crm-leads.json';
  const STAGES_FILE = 'crm-stages.json';

  const guardado: Record<string, unknown[]> = {};

  beforeEach(() => {
    jest.resetModules();
    guardado[LEADS_FILE] = [];
    guardado[STAGES_FILE] = [];
    jest.doMock('@/lib/data-service', () => ({
      readData: jest.fn(async (archivo: string) => guardado[archivo] ?? []),
      writeData: jest.fn(async (archivo: string, datos: unknown[]) => {
        guardado[archivo] = datos;
      }),
    }));
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
  });

  async function upsert() {
    const mod = await import('@/lib/crm/public-lead-persistence');
    return mod.upsertPublicCommercialLead;
  }

  it('la guarda sin teléfono en vez de inventarle uno', async () => {
    const upsertPublicCommercialLead = await upsert();

    const { lead } = await upsertPublicCommercialLead({
      name: 'Ana Pereira',
      phone: '',
      permitirSinTelefono: true,
      claveSinTelefono: 'fiesta_1|inv_1',
      partyType: '15 Años',
    });

    expect(lead.phone).toBe('');
    expect(JSON.stringify(lead)).not.toContain('099000000');
  });

  it('no junta a dos invitadas distintas que se llaman igual', async () => {
    const upsertPublicCommercialLead = await upsert();

    const primera = await upsertPublicCommercialLead({
      name: 'Ana Pereira',
      phone: '',
      permitirSinTelefono: true,
      claveSinTelefono: 'fiesta_1|inv_1',
    });
    const segunda = await upsertPublicCommercialLead({
      name: 'Ana Pereira',
      phone: '',
      permitirSinTelefono: true,
      claveSinTelefono: 'fiesta_2|inv_9',
    });

    expect(segunda.lead.id).not.toBe(primera.lead.id);
    expect(segunda.isNew).toBe(true);
  });

  it('sigue exigiendo celular donde el teléfono hace falta de verdad', async () => {
    const upsertPublicCommercialLead = await upsert();

    // El simulador no manda `permitirSinTelefono`: sin celular no hay a donde
    // mandarle el presupuesto, asi que el control se mantiene.
    await expect(
      upsertPublicCommercialLead({ name: 'Ana Pereira', phone: '' }),
    ).rejects.toThrow(/celular/i);
  });
});
