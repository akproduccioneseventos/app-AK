/**
 * @jest-environment node
 */
jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ userId: 'staff-1', perfil: 'dueno' })),
}));

jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn(),
}));

jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({
  getFiestaByIdRaw: jest.fn(),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(),
  saveFiesta: jest.fn(),
}));

jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(),
}));

jest.mock('@/app/actions/social-gallery', () => ({
  createSocialMediaPostFromUrlForStation: jest.fn(),
}));

jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn(),
}));

jest.mock('@/lib/social-fiesta/content-safety-ai', () => ({
  checkImageSafety: jest.fn(async () => ({ safe: true, reason: 'clean' })),
}));

jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

import { saveEntretenimientoFiesta } from '@/app/actions/fiesta/entretenimiento.actions';
import { requireEventPermission } from '@/lib/auth/event-access';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const mockRequireEventPermission = requireEventPermission as jest.MockedFunction<typeof requireEventPermission>;
const mockActualizarFiesta = actualizarFiesta as jest.MockedFunction<typeof actualizarFiesta>;

function clonar<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

describe('Orden 370 B2: guardar entretenimiento no borra fotos subidas', () => {
  it('conserva el array media actual de la base aunque el panel mande una copia vieja sin esa foto', async () => {
    const fotoDelInvitado = {
      id: 'ent_foto_invitado_1',
      moduleId: 'fotocabina',
      url: 'https://cdn.test/foto-invitado.jpg',
      type: 'image',
      uploadedAt: '2026-11-26T22:00:00.000Z',
    };

    let dbFiesta: FiestaEnPlanificacion = {
      id: 'fiesta-370',
      configuracion: { nombreEvento: 'XV Sofía', fechaEvento: '2026-11-26' } as any,
      others: {
        entretenimiento: {
          modules: {
            fotocabina: {
              enabled: true,
              title: 'Cabina Clásica',
              countdownSeconds: 3,
              media: [fotoDelInvitado],
            },
          },
        },
      },
    } as any;

    mockRequireEventPermission.mockResolvedValue(clonar(dbFiesta));
    mockActualizarFiesta.mockImplementation(async (_id, mutator) => {
      const siguiente = mutator(clonar(dbFiesta));
      dbFiesta = clonar(siguiente);
      return { success: true, fiesta: clonar(siguiente) } as any;
    });

    const copiaViejaDelPanel = {
      modules: {
        fotocabina: {
          enabled: true,
          title: 'Cabina Renovada',
          countdownSeconds: 5,
          media: [],
        },
      },
    };

    const res = await saveEntretenimientoFiesta('fiesta-370', copiaViejaDelPanel);

    expect(res.success).toBe(true);
    expect(res.data.modules.fotocabina.title).toBe('Cabina Renovada');
    expect(res.data.modules.fotocabina.countdownSeconds).toBe(5);
    expect(res.data.modules.fotocabina.media).toEqual([fotoDelInvitado]);
    expect((dbFiesta as any).others.entretenimiento.modules.fotocabina.media).toEqual([fotoDelInvitado]);
  });
});
