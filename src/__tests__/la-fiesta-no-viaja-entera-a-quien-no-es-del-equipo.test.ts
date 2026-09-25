/**
 * MATAFUEGO — La fiesta no viaja entera a quien no es del equipo (órdenes 64 y 67, pregunta 14).
 *
 * `getFiestaById` es una acción del servidor que usan las pantallas públicas. Con el número de
 * la fiesta —que va en el enlace de 200 invitados— cualquiera recibía los sueldos del personal,
 * el contrato, los avisos de pago y el teléfono y la credencial de cada invitado.
 *
 * Se probó rompiéndolo: sin la llamada a `recortarFiestaParaAfuera`, la primera se pone en rojo;
 * sin `reponerLoRecortado` al guardar, "guardar lo recortado no borra nada" se pone en rojo.
 */
const almacen: Record<string, any> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
let equipo = false;
let cliente = false;

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => (almacen[archivo] === undefined ? porDefecto : copia(almacen[archivo]))),
  writeData: jest.fn(async (archivo: string, datos: any) => { almacen[archivo] = copia(datos); }),
  updateDataPartial: jest.fn(),
}));
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn(async () => ({ success: equipo })) }));
jest.mock('@/lib/auth/require-session', () => ({
  hasAppSession: jest.fn(async () => equipo),
  requireAppSession: jest.fn(async () => { if (!equipo) throw new Error('Sesion no autorizada.'); }),
}));
jest.mock('@/lib/security/portal-session', () => ({ verifyPortalSession: jest.fn(async () => cliente) }));

import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { LECTURA_COMPLETA } from '@/lib/fiesta/lectura-completa';

const FIESTA = {
  id: 'f1',
  estado: 'Contratada',
  configuracion: { nombreEvento: 'XV de Sofía', clienteId: 'cli_1', fechaEvento: '2026-11-01' },
  personalAsignado: [{ empleadoId: 'e1', rolId: 'mozo', eventSalary: 4500 }],
  gestionCostos: { total: 90000 },
  contratoServicioTexto: 'Contrato privado',
  clientPaymentNotifications: [{ id: 'p1', monto: 20000 }],
  invitados: [{ id: 'g1', nombre: 'Ana', tableNumber: '3', contacto: '099111222', guestAccessToken: 'tok-ana' }],
  invitacionDigital: { cabecera: { titulo: 'Sofía' } },
};

beforeEach(() => {
  for (const k of Object.keys(almacen)) delete almacen[k];
  almacen['fiestas/f1.json'] = copia(FIESTA);
  equipo = false;
  cliente = false;
});

describe('La fiesta no viaja entera a quien no es del equipo', () => {
  it('sin sesión: sin sueldos, costos, contrato ni pagos, y el invitado sin contacto ni credencial', async () => {
    const f: any = await getFiestaById('f1');
    expect(f.personalAsignado).toBeUndefined();
    expect(f.gestionCostos).toBeUndefined();
    expect(f.contratoServicioTexto).toBeUndefined();
    expect(f.clientPaymentNotifications).toBeUndefined();
    expect(f.configuracion.clienteId).toBeUndefined();
    expect(f.invitados[0]).toEqual({ id: 'g1', nombre: 'Ana', tableNumber: '3' });
    // Lo que la invitación necesita, sigue.
    expect(f.invitacionDigital.cabecera.titulo).toBe('Sofía');
  });

  it('el cliente con su portal ve su contrato y sus pagos, pero no los sueldos ni los costos', async () => {
    cliente = true;
    const f: any = await getFiestaById('f1');
    expect(f.contratoServicioTexto).toBe('Contrato privado');
    expect(f.clientPaymentNotifications).toHaveLength(1);
    expect(f.invitados[0].guestAccessToken).toBe('tok-ana');
    expect(f.personalAsignado).toBeUndefined();
    expect(f.gestionCostos).toBeUndefined();
  });

  it('el equipo la ve entera, y la lectura interna del servidor también', async () => {
    equipo = true;
    expect((await getFiestaById('f1') as any).personalAsignado).toHaveLength(1);
    equipo = false;
    expect((await getFiestaById('f1', LECTURA_COMPLETA) as any).invitados[0].guestAccessToken).toBe('tok-ana');
  });

  it('desde el navegador no se puede pedir la lectura interna: un texto no es la marca', async () => {
    const f: any = await getFiestaById('f1', 'lectura-completa-de-la-fiesta' as any);
    expect(f.personalAsignado).toBeUndefined();
  });

  it('guardar lo recortado no borra nada: sueldos, contrato y credenciales quedan', async () => {
    cliente = true;
    const recortada: any = await getFiestaById('f1');
    const r = await saveFiesta({ ...recortada, invitados: recortada.invitados.map((i: any) => ({ ...i, tableNumber: '4' })) });
    expect(r.success).toBe(true);
    const guardada = almacen['fiestas/f1.json'];
    expect(guardada.personalAsignado).toEqual(FIESTA.personalAsignado);
    expect(guardada.gestionCostos).toEqual(FIESTA.gestionCostos);
    expect(guardada.invitados[0]).toMatchObject({ tableNumber: '4', contacto: '099111222', guestAccessToken: 'tok-ana' });
    // Y a quien no es del equipo no se le devuelve la fiesta guardada.
    expect((r as any).fiesta).toBeUndefined();
  });
});
