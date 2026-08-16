import {
  handleRsvpSubmission,
  submitPublicRsvp,
} from '@/app/actions/fiesta/invitados.actions';
import {
  getFiestaById,
  saveFiesta,
} from '@/app/actions/fiesta/fiesta.actions';
import { writeData } from '@/lib/data-service';

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(),
  saveFiesta: jest.fn(),
}));
jest.mock('@/lib/data-service', () => ({ writeData: jest.fn() }));
jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn().mockResolvedValue(undefined),
}));

const mockedGetFiestaById = getFiestaById as jest.MockedFunction<typeof getFiestaById>;
const mockedSaveFiesta = saveFiesta as jest.MockedFunction<typeof saveFiesta>;
const mockedWriteData = writeData as jest.MockedFunction<typeof writeData>;

function buildFiesta(invitados: any[] = []) {
  return {
    id: 'fiesta_rsvp_test',
    configuracion: {
      invitadosAdultos: 2,
      invitadosNinos: 2,
    },
    invitados,
  } as any;
}

describe('RSVP deduplication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates an existing guest when accents, case or spacing differ', async () => {
    const fiesta = buildFiesta([{
      id: 'inv_1',
      nombre: 'José  Pérez',
      categoria: 'Adulto',
      partySize: 2,
      rsvp: 'Confirmado',
    }]);

    mockedGetFiestaById.mockResolvedValue(fiesta);
    mockedSaveFiesta.mockImplementation(async (updated) => ({
      success: true,
      fiesta: updated,
    }));

    const result = await handleRsvpSubmission(fiesta.id, {
      nombreCompleto: '  JOSE PEREZ ',
      confirmacion: 'Confirmado',
      adultsCount: 2,
      kidsCount: 0,
      mensaje: '',
      companionNames: ['Ana Pérez'],
    });

    expect(result.success).toBe(true);
    expect(mockedSaveFiesta).toHaveBeenCalledTimes(1);
    const saved = mockedSaveFiesta.mock.calls[0][0];
    expect(saved.invitados).toHaveLength(1);
    expect(saved.invitados?.[0].id).toBe('inv_1');
    expect(saved.invitados?.[0].partySize).toBe(2);
    expect(saved.invitados?.[0].kidsCount).toBe(0);
  });

  it('does not count the previous party size twice when an RSVP is resubmitted', async () => {
    const fiesta = buildFiesta([{
      id: 'inv_1',
      nombre: 'María Silva',
      categoria: 'Adulto',
      partySize: 2,
      rsvp: 'Confirmado',
    }]);

    mockedGetFiestaById.mockResolvedValue(fiesta);
    mockedSaveFiesta.mockImplementation(async (updated) => ({
      success: true,
      fiesta: updated,
    }));

    const result = await handleRsvpSubmission(fiesta.id, {
      nombreCompleto: 'Maria Silva',
      confirmacion: 'Confirmado',
      adultsCount: 2,
      kidsCount: 0,
      mensaje: '',
      companionNames: ['Luis Silva'],
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('deduplicates public RSVP submissions and preserves the access token', async () => {
    const fiesta = buildFiesta([{
      id: 'inv_2',
      guestAccessToken: 'token-original',
      nombre: 'Lucía Fernández',
      categoria: 'Adulto',
      rsvp: 'Pendiente',
    }]);

    mockedGetFiestaById.mockResolvedValue(fiesta);
    mockedWriteData.mockResolvedValue(undefined);

    const result = await submitPublicRsvp(fiesta.id, {
      nombre: ' lucia   fernandez ',
      asistencia: 'Confirmado',
      dietaryRestriction: 'Ninguna',
      cancionesDJ: [],
    });

    expect(result.success).toBe(true);
    const saved = mockedWriteData.mock.calls[0][1] as any;
    expect(saved.invitados).toHaveLength(1);
    expect(saved.invitados?.[0].guestAccessToken).toBe('token-original');
    expect(saved.invitados?.[0].rsvp).toBe('Confirmado');
  });

  it('persists the adult and child split for mixed families submitted by templates', async () => {
    const fiesta = buildFiesta();
    fiesta.configuracion.invitadosAdultos = 10;
    fiesta.configuracion.invitadosNinos = 10;
    mockedGetFiestaById.mockResolvedValue(fiesta);
    mockedSaveFiesta.mockImplementation(async (updated) => ({ success: true, fiesta: updated }));

    const result = await handleRsvpSubmission(fiesta.id, {
      nombreCompleto: 'Familia Mixta',
      confirmacion: 'Confirmado',
      adultsCount: 2,
      kidsCount: 3,
      mensaje: '',
      companionNames: [],
    });

    expect(result.success).toBe(true);
    const saved = mockedSaveFiesta.mock.calls[0][0].invitados?.[0];
    expect(saved).toMatchObject({ partySize: 5, kidsCount: 3, categoria: 'Adulto' });
  });

  it('clamps a preserved kids count when a public RSVP reduces the group size', async () => {
    const fiesta = buildFiesta([{
      id: 'inv_family',
      nombre: 'Familia Pérez',
      categoria: 'Adulto',
      partySize: 5,
      kidsCount: 4,
      rsvp: 'Confirmado',
    }]);
    mockedGetFiestaById.mockResolvedValue(fiesta);
    mockedWriteData.mockResolvedValue(undefined);

    const result = await submitPublicRsvp(fiesta.id, {
      nombre: 'Familia Perez',
      asistencia: 'Confirmado',
      partySize: 2,
      dietaryRestriction: 'Ninguna',
      cancionesDJ: [],
    });

    expect(result.success).toBe(true);
    const saved = mockedWriteData.mock.calls[0][1] as any;
    expect(saved.invitados[0]).toMatchObject({ partySize: 2, kidsCount: 2 });
  });

  it('serializes simultaneous updates for the same event', async () => {
    let persisted = buildFiesta();

    mockedGetFiestaById.mockImplementation(async () => (
      JSON.parse(JSON.stringify(persisted))
    ));
    mockedSaveFiesta.mockImplementation(async (updated) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      persisted = updated;
      return { success: true, fiesta: updated };
    });

    const submit = (nombreCompleto: string) => handleRsvpSubmission(persisted.id, {
      nombreCompleto,
      confirmacion: 'Confirmado',
      adultsCount: 1,
      kidsCount: 0,
      mensaje: '',
      companionNames: [],
    });

    const results = await Promise.all([
      submit('Ana López'),
      submit('Bruno Silva'),
    ]);

    expect(results.every(result => result.success)).toBe(true);
    expect(persisted.invitados).toHaveLength(2);
    expect(persisted.invitados?.map((guest: any) => guest.nombre)).toEqual([
      'Ana López',
      'Bruno Silva',
    ]);
  });
});
