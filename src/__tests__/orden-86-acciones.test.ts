/**
 * Orden 86 — las acciones nuevas: sin sesión no hacen nada, y con sesión hacen lo que dicen.
 *
 * Se probo rompiendolo: sacando `requireAppSession` de cualquiera de las tres, su primera
 * comprobación se pone en rojo; y si "Proponer equipo" deja de conservar lo asignado, la segunda.
 */
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => undefined) }));

const conexiones: any[] = [];
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => (archivo === 'social-connections.json' ? conexiones : porDefecto)),
  writeData: jest.fn(),
}));
jest.mock('@/lib/social-media/google-business-resenas', () => ({
  getGoogleBusinessReviews: jest.fn(async () => ({ success: true, reviews: [] })),
  replyToGoogleBusinessReview: jest.fn(async () => ({ success: true })),
}));

const fiestaActual = {
  id: 'f1', estado: 'Confirmada', configuracion: { fechaEvento: '2026-10-10' },
  personalAsignado: [{ empleadoId: 'e1', rolId: 'mozo', eventSalary: 9999 }],
};
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => JSON.parse(JSON.stringify(fiestaActual))),
  getFiestas: jest.fn(async () => [JSON.parse(JSON.stringify(fiestaActual))]),
}));
jest.mock('@/app/actions/empleados', () => ({ getEmpleados: jest.fn(async () => [{ id: 'e1', rolIds: ['mozo'] }, { id: 'e2', rolIds: ['mozo'] }]) }));
jest.mock('@/app/actions/roles', () => ({ getRoles: jest.fn(async () => [{ id: 'mozo', sueldoPorEvento: 1000 }]) }));
jest.mock('@/lib/staff-agenda-data', () => ({ readActiveFiestasForStaffAgenda: jest.fn(async (leer: () => any) => leer()) }));

import { requireAppSession } from '@/lib/auth/require-session';
import { obtenerPropuestaEquipoAction } from '@/app/actions/fiesta/proponer-equipo.actions';
import { cargarResenasGoogleAction, publicarRespuestaResenaAction } from '@/app/actions/google-business-resenas';
import { getGoogleBusinessReviews, replyToGoogleBusinessReview } from '@/lib/social-media/google-business-resenas';
import { getTouchpixThemes } from '@/app/actions/touchpix-ai';

const sinSesion = () => (requireAppSession as jest.Mock).mockRejectedValueOnce(new Error('Sesion no autorizada.'));

beforeEach(() => {
  jest.clearAllMocks();
  conexiones.length = 0;
});

describe('Proponer equipo', () => {
  it('sin sesión del equipo no devuelve nada', async () => {
    sinSesion();
    await expect(obtenerPropuestaEquipoAction('f1', [{ roleId: 'mozo', roleName: 'Mozo', quantity: 2 }])).rejects.toThrow();
  });

  it('con sesión propone, y conserva al ya asignado con su sueldo cargado a mano', async () => {
    const r = await obtenerPropuestaEquipoAction('f1', [{ roleId: 'mozo', roleName: 'Mozo', quantity: 2 }]);
    expect(r.success).toBe(true);
    expect(r.propuesta).toContainEqual({ empleadoId: 'e1', rolId: 'mozo', eventSalary: 9999 });
    expect(r.propuesta!.map((p) => p.empleadoId).sort()).toEqual(['e1', 'e2']);
  });
});

describe('Reseñas de Google', () => {
  it('sin sesión no le pregunta nada a Google', async () => {
    sinSesion();
    await expect(cargarResenasGoogleAction()).rejects.toThrow();
    expect(getGoogleBusinessReviews).not.toHaveBeenCalled();
  });

  it('sin credenciales lo dice en criollo y no llama a Google', async () => {
    const r = await cargarResenasGoogleAction();
    expect(r.success).toBe(false);
    expect(r.errorCriollo).toMatch(/Google/);
    expect(getGoogleBusinessReviews).not.toHaveBeenCalled();
  });

  it('publicar una respuesta llama a Google una sola vez, y sin sesión ninguna', async () => {
    conexiones.push({ platform: 'Google', isConnected: true, accessToken: 'tok', locationId: 'accounts/1/locations/2' });
    sinSesion();
    await expect(publicarRespuestaResenaAction('r1', 'Gracias!')).rejects.toThrow();
    expect(replyToGoogleBusinessReview).not.toHaveBeenCalled();
    const r = await publicarRespuestaResenaAction('r1', 'Gracias!');
    expect(r.success).toBe(true);
    expect(replyToGoogleBusinessReview).toHaveBeenCalledTimes(1);
    expect((replyToGoogleBusinessReview as jest.Mock).mock.calls[0][0]).toMatchObject({ reviewId: 'r1', comment: 'Gracias!' });
  });
});

describe('Caricatura en la fotocabina', () => {
  it('el tema caricatura se ofrece, y sin sesión no se lista nada', async () => {
    const temas = await getTouchpixThemes();
    expect(temas.map((t) => t.id)).toContain('caricatura');
    sinSesion();
    await expect(getTouchpixThemes()).rejects.toThrow();
  });
});
