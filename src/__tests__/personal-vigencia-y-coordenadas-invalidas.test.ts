/**
 * El enlace del personal (Codex, auditoría 66, 5/10/2026).
 *
 * - PERS01: un enlace vencido seguía abriendo el portal y cambiando asistencia y llegada, porque
 *   esas tres acciones leían el acceso sin mirar el vencimiento.
 * - PERS02: con la ubicación activada, NaN o Infinity daban distancia NaN y la llegada se
 *   registraba igual.
 *
 * Se probó rompiéndolo: con el código de `212ba37` fallan las dos.
 */
let acceso: any;
let fiesta: any;

jest.mock('@/app/actions/accesos-personal', () => ({ getAccesoById: jest.fn(async () => acceso) }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getFiestaById: jest.fn(async () => fiesta) }));
jest.mock('@/app/actions/roles', () => ({ getRolesPublicos: jest.fn(async () => []) }));
jest.mock('@/app/actions/settings', () => ({
  getAjustesLlegadaPersonal: jest.fn(async () => ({ llegadaConUbicacion: true, radioMetros: 300 })),
}));
jest.mock('@/lib/data-service', () => ({ readData: jest.fn(async (_f: string, d: any) => d), writeData: jest.fn() }));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (_id: string, cambiar: (f: any) => any) => {
    fiesta = await cambiar(JSON.parse(JSON.stringify(fiesta)));
    return { success: true };
  }),
}));

import { getAccesoPersonalPortalView, responderAsistenciaPersonal, registrarLlegadaPersonal } from '@/app/actions/accesos-personal-view';

const SALON = { lat: -31.3833, lng: -57.9667 };
const hace = (dias: number) => new Date(Date.now() - dias * 86_400_000).toISOString();

beforeEach(() => {
  acceso = { id: 't1', fiestaId: 'f1', empleadoId: 'e1', permisos: [], nombreAcceso: 'Mozo', fechaCreacion: hace(1) };
  fiesta = {
    id: 'f1',
    configuracion: { nombreEvento: 'Quince', googleMapsUrl: `https://www.google.com/maps/@${SALON.lat},${SALON.lng},17z` },
    personalAsignado: [{ empleadoId: 'e1', rolId: 'r1' }],
    programa: [{ hora: '21:00', actividad: 'Recepción' }],
  };
});

describe('PERS01: un enlace vencido no abre ni cambia nada', () => {
  it('con fecha de vencimiento pasada: sin plan, sin asistencia, sin llegada', async () => {
    acceso.fechaVencimiento = hace(1);
    expect(await getAccesoPersonalPortalView('t1')).toBeNull();
    expect((await responderAsistenciaPersonal('t1', true)).success).toBe(false);
    expect((await registrarLlegadaPersonal('t1', SALON)).success).toBe(false);
    expect(fiesta.personalAsignado[0].asistenciaConfirmada).toBeUndefined();
    expect(fiesta.personalAsignado[0].checkInTimestamp).toBeUndefined();
  });

  it('sin fecha propia vence a los 90 días de creado', async () => {
    acceso.fechaCreacion = hace(91);
    expect(await getAccesoPersonalPortalView('t1')).toBeNull();
  });

  it('un acceso vigente y asignado sigue andando', async () => {
    const vista = await getAccesoPersonalPortalView('t1');
    expect(vista?.fiesta?.programa).toHaveLength(1);
    expect((await responderAsistenciaPersonal('t1', true)).success).toBe(true);
    expect(fiesta.personalAsignado[0].asistenciaConfirmada).toBe(true);
  });
});

describe('PERS02: una ubicación que no es un número no registra la llegada', () => {
  it.each([
    ['NaN', { lat: NaN, lng: NaN }],
    ['Infinity', { lat: Infinity, lng: 0 }],
    ['fuera del planeta', { lat: 200, lng: 0 }],
  ])('%s se rechaza y no toca la hora', async (_n, ubicacion) => {
    const r = await registrarLlegadaPersonal('t1', ubicacion as any);
    expect(r.success).toBe(false);
    expect(fiesta.personalAsignado[0].checkInTimestamp).toBeUndefined();
  });

  it('en el salón sí se registra, y lejos no', async () => {
    expect((await registrarLlegadaPersonal('t1', { lat: -31.40, lng: -57.9667 })).success).toBe(false);
    expect((await registrarLlegadaPersonal('t1', SALON)).success).toBe(true);
    expect(fiesta.personalAsignado[0].checkInTimestamp).toBeTruthy();
  });
});
