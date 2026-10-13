/** @jest-environment node */
/**
 * VOTOS EN EL WIFI DEL SALÓN (13 de octubre de 2026).
 *
 * Antes el tope era 30 votos por minuto por red y encuesta: en el salón todos los invitados salen por
 * el mismo wifi y el voto 31 de ese minuto se rechazaba. Ahora, como en las apps de votación de
 * eventos, el voto se cuenta una vez por teléfono (repetirlo no suma) y el tope de la red es alto.
 */
const store: Record<string, Record<string, any>> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const ref = (col: string, id: string) => ({ col, id });

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: {
    collection: (col: string) => ({ doc: (id: string) => ref(col, id) }),
    runTransaction: async (fn: any) => {
      const pendientes: Array<() => void> = [];
      const tx = {
        get: async (r: any) => {
          const d = store[r.col]?.[r.id];
          return { exists: d !== undefined, data: () => (d ? copia(d) : undefined) };
        },
        set: (r: any, data: any) => pendientes.push(() => { (store[r.col] ||= {})[r.id] = copia(data); }),
        update: (r: any, data: any) => pendientes.push(() => {
          const actual = (store[r.col] ||= {})[r.id] || {};
          const nuevo = { ...actual };
          for (const [k, v] of Object.entries(data)) {
            nuevo[k] = v && typeof v === 'object' && 'operand' in (v as any) ? (actual[k] || 0) + (v as any).operand : v;
          }
          store[r.col][r.id] = nuevo;
        }),
      };
      const res = await fn(tx);
      pendientes.forEach((p) => p());
      return res;
    },
  },
}));
jest.mock('firebase-admin', () => ({ __esModule: true, default: { firestore: { FieldValue: { increment: (n: number) => ({ operand: n }) } } } }));

const topes: Array<{ scope: string; identity: string; limit: number; ignoreClientAddress?: boolean }> = [];
jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async (input: any) => { topes.push(input); }),
}));

import { votePoll, voteSongRequest } from '@/app/actions/social-interactive';

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  topes.length = 0;
  store.social_polls = {
    p1: { id: 'p1', fiestaId: 'f1', question: '¿Vals o rock?', active: true, options: [{ id: 'a', text: 'Vals', votes: 0 }, { id: 'b', text: 'Rock', votes: 0 }] },
  };
  store.social_song_requests = { s1: { id: 's1', fiestaId: 'f1', votes: 0 } };
});

it('el tope de la red deja votar a un salón entero (no 30 por minuto)', async () => {
  await votePoll('f1', 'p1', 'a', 'telefono-0001');
  const red = topes.find((t) => t.scope === 'social-poll-vote')!;
  expect(red.limit).toBeGreaterThanOrEqual(300);
  const telefono = topes.find((t) => t.scope === 'social-poll-vote-telefono')!;
  expect(telefono.identity).toBe('f1:telefono-0001');
  expect(telefono.ignoreClientAddress).toBe(true);
});

it('cien teléfonos distintos votan y cuentan los cien', async () => {
  for (let i = 0; i < 100; i++) {
    const r = await votePoll('f1', 'p1', i % 2 ? 'a' : 'b', `telefono-${String(i).padStart(4, '0')}`);
    expect(r.success).toBe(true);
  }
  const votos = store.social_polls.p1.options.map((o: any) => o.votes);
  expect(votos).toEqual([50, 50]);
});

it('el mismo teléfono votando dos veces (o reintentando) suma uno', async () => {
  await votePoll('f1', 'p1', 'a', 'telefono-0001');
  const segunda = await votePoll('f1', 'p1', 'b', 'telefono-0001');
  expect(segunda.success).toBe(true);
  expect(segunda.yaVotado).toBe(true);
  expect(store.social_polls.p1.options.map((o: any) => o.votes)).toEqual([1, 0]);
});

it('una canción votada dos veces desde el mismo teléfono suma uno; otro teléfono suma otro', async () => {
  await voteSongRequest('f1', 's1', 'telefono-0001');
  await voteSongRequest('f1', 's1', 'telefono-0001');
  await voteSongRequest('f1', 's1', 'telefono-0002');
  expect(store.social_song_requests.s1.votes).toBe(2);
});

it('un id de teléfono inválido no se usa como identidad (sólo aplica el tope de la red)', async () => {
  const r = await votePoll('f1', 'p1', 'a', '../../x');
  expect(r.success).toBe(true);
  expect(topes.map((t) => t.scope)).toEqual(['social-poll-vote']);
  expect(store.social_poll_votes).toBeUndefined();
});
