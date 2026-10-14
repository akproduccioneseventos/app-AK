/**
 * PREGUNTA 58 (13 de octubre de 2026): la respuesta se pierde, la persona vuelve a tocar "Guardar" y
 * se guarda dos veces. Aca: invitado nuevo y tarea nueva de la fiesta.
 *
 * Pantallas tocadas: `/fiestas/nueva/invitados` (alta manual e importacion de planilla) y
 * `/fiestas/nueva/tareas`.
 *
 * La base de mentira devuelve COPIAS en cada lectura (error 11 de CLAUDE.md), como la de verdad.
 *
 * Se probo rompiendolo: sacando la comprobacion "ya esta con ese id" de `addInvitado` o de
 * `addTarea`, la prueba de "misma identidad dos veces" se pone en rojo.
 */
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => undefined) }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(), saveFiesta: jest.fn(), requireFiestaWriteAccess: jest.fn(),
}));
jest.mock('@/lib/data-service', () => ({ writeData: jest.fn(), readData: jest.fn() }));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn() }));
jest.mock('@/lib/guest-portal-public-data', () => ({ hasPublicGuestAccess: jest.fn() }));
jest.mock('@/lib/auth/event-access', () => ({ requireEventPermission: jest.fn() }));
jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({ preserveFiestaSecrets: jest.fn() }));

let fiesta: any;
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (_id: string, cambiar: (f: any) => any) => {
    await new Promise((r) => setTimeout(r, 5));
    const nueva = await cambiar(copia(fiesta));
    fiesta = copia(nueva);
    return { success: true, updatedFiesta: copia(fiesta) };
  }),
}));

import { addInvitado } from '@/app/actions/fiesta/invitados.actions';
import { addTarea } from '@/app/actions/fiesta/tareas.actions';

const INVITADO = { nombre: 'Ana Perez', categoria: 'Adulto', rsvp: 'Confirmado', partySize: 1 } as any;
const TAREA = { texto: 'Confirmar el DJ' } as any;

beforeEach(() => { fiesta = { id: 'f1', invitados: [], tareas: [] }; });

describe('Invitado nuevo: reintentar una respuesta perdida no lo duplica', () => {
  it('la misma identidad dos veces deja UN solo invitado', async () => {
    const a = await addInvitado('f1', INVITADO, { idIntento: 'intento-uno-1234' });
    const b = await addInvitado('f1', INVITADO, { idIntento: 'intento-uno-1234' });
    expect(fiesta.invitados).toHaveLength(1);
    expect(a.success && b.success).toBe(true);
    expect(b.invitado?.id).toBe(a.invitado?.id);
  });

  it('una identidad distinta es otro invitado de verdad', async () => {
    await addInvitado('f1', INVITADO, { idIntento: 'intento-uno-1234' });
    await addInvitado('f1', { ...INVITADO, nombre: 'Luis' }, { idIntento: 'intento-dos-5678' });
    expect(fiesta.invitados).toHaveLength(2);
  });

  it('sin identidad (o con una invalida) sigue como siempre: cada llamada crea uno', async () => {
    await addInvitado('f1', INVITADO);
    await addInvitado('f1', INVITADO, { idIntento: 'corto' });
    expect(fiesta.invitados).toHaveLength(2);
  });
});

describe('Tarea nueva: reintentar una respuesta perdida no la duplica', () => {
  it('la misma identidad dos veces deja UNA sola tarea', async () => {
    const a = await addTarea('f1', TAREA, { idIntento: 'intento-tarea-01' });
    const b = await addTarea('f1', TAREA, { idIntento: 'intento-tarea-01' });
    expect(fiesta.tareas).toHaveLength(1);
    expect(b.tarea?.id).toBe(a.tarea?.id);
  });

  it('una identidad distinta es otra tarea', async () => {
    await addTarea('f1', TAREA, { idIntento: 'intento-tarea-01' });
    await addTarea('f1', TAREA, { idIntento: 'intento-tarea-02' });
    expect(fiesta.tareas).toHaveLength(2);
  });
});
