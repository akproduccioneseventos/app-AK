/**
 * Guardar una fiesta pide permiso, salvo la confirmación pública del invitado (orden 107).
 *
 * Pasó el 1 de octubre de 2026: `actualizarFiesta` dejó de pasar por `saveFiesta` para usar una
 * transacción, y con eso se perdió `requireFiestaWriteAccess`. `checkInGuest` y
 * `updateGuestExperience` no tienen guardia propia: cualquiera con el número de la fiesta marcaba
 * invitados como llegados. Esta prueba recorre el camino REAL (la transacción), simulando sólo la
 * base y el permiso, que están afuera.
 */

let permitido = false;
let documento: Record<string, any> | null = null;
const escrituras: any[] = [];

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  requireFiestaWriteAccess: jest.fn(async () => {
    if (!permitido) throw new Error('No autorizado.');
  }),
  getFiestaById: jest.fn(async () => null),
  saveFiesta: jest.fn(async () => {
    throw new Error('saveFiesta no tiene que usarse: el guardado va por la transacción.');
  }),
}));

jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({
  // Lo que hace la de verdad: vuelve a poner lo secreto que la lectura saca.
  preserveFiestaSecrets: jest.fn(async (_id: string, f: any) => ({ ...f, portalSecret: 'SECRETO' })),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumentoConTransaccion: jest.fn(async (_path: string, _vacio: any, cambiar: (a: any) => any) => {
    const actual = documento ? JSON.parse(JSON.stringify(documento)) : null;
    const nuevo = await cambiar(actual);
    if (nuevo === null) return null;
    documento = JSON.parse(JSON.stringify(nuevo));
    escrituras.push(documento);
    return nuevo;
  }),
}));

import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { checkInGuest, updateGuestExperience } from '@/app/actions/fiesta/invitados.actions';

const fiestaBase = () => ({
  id: 'f1',
  portalSecret: 'SECRETO',
  invitados: [{ id: 'g1', nombre: 'Ana', checkedIn: false }],
});

beforeEach(() => {
  permitido = false;
  documento = fiestaBase();
  escrituras.length = 0;
});

describe('Guardar una fiesta pide permiso', () => {
  it('sin permiso, marcar la llegada de un invitado no escribe nada', async () => {
    const res = await checkInGuest('f1', 'g1');
    expect(res.success).toBe(false);
    expect(escrituras).toHaveLength(0);
    expect(documento!.invitados[0].checkedIn).toBe(false);
  });

  it('sin permiso, cambiar la experiencia del invitado no escribe nada', async () => {
    const res = await updateGuestExperience('f1', 'g1', { mensaje: 'hola' });
    expect(res?.success).toBe(false);
    expect(escrituras).toHaveLength(0);
  });

  it('con permiso, la llegada queda guardada', async () => {
    permitido = true;
    const res = await checkInGuest('f1', 'g1');
    expect(res.success).toBe(true);
    expect(documento!.invitados[0].checkedIn).toBe(true);
  });

  it('la confirmación pública del invitado guarda sin pedir sesión del equipo', async () => {
    const res = await actualizarFiesta('f1', (f) => ({ ...f, invitados: [...(f.invitados || []), { id: 'g2', nombre: 'Luis' } as any] }), { publicRsvp: true });
    expect(res.success).toBe(true);
    expect(documento!.invitados).toHaveLength(2);
  });

  it('lo secreto de la fiesta sigue después de guardar', async () => {
    permitido = true;
    await actualizarFiesta('f1', (f) => ({ ...f, portalSecret: undefined } as any));
    expect(documento!.portalSecret).toBe('SECRETO');
  });
});
