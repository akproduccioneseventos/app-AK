/**
 * MATAFUEGO — La frontera de las fiestas (Codex, auditoría 69, orden 118, 6/10/2026).
 *
 * Con una sesión del perfil `personal` —que no tiene ningún permiso— se leía la fiesta entera (la
 * clave del portal del cliente, la credencial de cada invitado, los costos) y se la podía guardar
 * entera o de a partes. Y las dos puertas públicas (la fiesta del día y el enlace corto de la
 * invitación) devolvían esas mismas claves a cualquiera.
 *
 * Se probó rompiéndolo: volviendo `requireFiestaWriteAccess` a "alcanza con tener sesión", las
 * escrituras del personal se ponen en rojo; sacando `paraAfuera` de `getFiestaBySlug`, la de la
 * invitación.
 */
const almacen: Record<string, any> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
let usuario: any = null;
let cliente = false;

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => (almacen[archivo] === undefined ? porDefecto : copia(almacen[archivo]))),
  writeData: jest.fn(async (archivo: string, datos: any) => { almacen[archivo] = copia(datos); }),
  updateDataPartial: jest.fn(async (archivo: string, parcial: any) => { almacen[archivo] = { ...almacen[archivo], ...copia(parcial) }; }),
}));
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => (usuario ? { success: true, user: usuario } : { success: false })),
}));
jest.mock('@/lib/security/portal-session', () => ({ verifyPortalSession: jest.fn(async () => cliente) }));
jest.mock('@/app/actions/empleados', () => ({
  getEmpleados: jest.fn(async () => [{ id: 'e1', email: 'op@ak.test' }]),
}));
jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => [copia(almacen['fiestas/f1.json'])]),
  leerHistorialCrudo: jest.fn(async () => []),
}));

import { getFiestaById, saveFiesta, updateFiestaPartial, getFiestas, getFiestaBySlug, getFiestaActual } from '@/app/actions/fiesta/fiesta.actions';

const FIESTA = {
  id: 'f1',
  invitacionSlug: 'xv-sofia',
  configuracion: { nombreEvento: 'XV de Sofía', fechaEvento: '2026-11-01' },
  clientPortalSettings: { enabled: true, accessKey: 'clave-del-portal' },
  personalAsignado: [{ empleadoId: 'e1', rolId: 'dj' }],
  gestionCostos: { total: 90000 },
  invitados: [{ id: 'g1', nombre: 'Ana', tableNumber: '3', guestAccessToken: 'tok-ana' }],
};

const PERSONAL = { userId: 'p9', email: 'mozo@ak.test', perfil: 'personal' };
const OPERADOR_ASIGNADO = { userId: 'e1', email: 'op@ak.test', perfil: 'operador' };
const OPERADOR_AJENO = { userId: 'e7', email: 'otro@ak.test', perfil: 'operador' };
const SECRETARIA = { userId: 's1', email: 'sec@ak.test', perfil: 'secretaria' };

beforeEach(() => {
  for (const k of Object.keys(almacen)) delete almacen[k];
  almacen['fiestas/f1.json'] = copia(FIESTA);
  usuario = null;
  cliente = false;
});

const sinSecretos = (f: any) => {
  expect(f.clientPortalSettings?.accessKey).toBeFalsy();
  expect(f.invitados[0].guestAccessToken).toBeUndefined();
  expect(f.gestionCostos).toBeUndefined();
};

describe('El personal, con su sesión, no es el equipo de la fiesta', () => {
  it('no lee la clave del portal, las credenciales ni los costos', async () => {
    usuario = PERSONAL;
    sinSecretos(await getFiestaById('f1'));
  });

  it('no guarda la fiesta entera ni de a partes', async () => {
    usuario = PERSONAL;
    await expect(saveFiesta({ ...copia(FIESTA), gestionCostos: { total: 1 } } as any)).rejects.toThrow();
    await expect(updateFiestaPartial('f1', { gestionCostos: { total: 1 } } as any)).rejects.toThrow();
    expect(almacen['fiestas/f1.json'].gestionCostos.total).toBe(90000);
  });

  it('no pide la lista de fiestas', async () => {
    usuario = PERSONAL;
    await expect(getFiestas()).rejects.toThrow();
  });
});

describe('El operador, sólo en su fiesta', () => {
  it('asignado la ve entera; de otra fiesta, recortada', async () => {
    usuario = OPERADOR_ASIGNADO;
    expect((await getFiestaById('f1') as any).invitados[0].guestAccessToken).toBe('tok-ana');
    usuario = OPERADOR_AJENO;
    sinSecretos(await getFiestaById('f1'));
    await expect(updateFiestaPartial('f1', { gestionCostos: { total: 1 } } as any)).rejects.toThrow();
  });
});

describe('La secretaria sigue igual', () => {
  it('lee y guarda', async () => {
    usuario = SECRETARIA;
    expect((await getFiestaById('f1') as any).clientPortalSettings.accessKey).toBe('clave-del-portal');
    expect((await saveFiesta({ ...copia(FIESTA), gestionCostos: { total: 95000 } } as any)).success).toBe(true);
    expect(almacen['fiestas/f1.json'].gestionCostos.total).toBe(95000);
  });
});

describe('Las puertas públicas no devuelven secretos', () => {
  it('el enlace de la invitación y la fiesta del día, sin sesión', async () => {
    const porEnlace: any = await getFiestaBySlug('xv-sofia');
    sinSecretos(porEnlace);
    expect(porEnlace.invitados[0].nombre).toBe('Ana');
    expect(porEnlace.invitados[0].tableNumber).toBe('3');
    sinSecretos(await getFiestaActual());
  });
});

describe('El cliente, desde su portal', () => {
  it('no cambia los costos ni el personal aunque los mande', async () => {
    cliente = true;
    const r = await saveFiesta({ ...copia(FIESTA), gestionCostos: { total: 1 }, personalAsignado: [] } as any);
    expect(r.success).toBe(true);
    expect(almacen['fiestas/f1.json'].gestionCostos.total).toBe(90000);
    expect(almacen['fiestas/f1.json'].personalAsignado).toHaveLength(1);
    const parcial = await updateFiestaPartial('f1', { gestionCostos: { total: 1 } } as any, { allowPortal: true });
    expect(parcial.success).toBe(false);
  });
});
