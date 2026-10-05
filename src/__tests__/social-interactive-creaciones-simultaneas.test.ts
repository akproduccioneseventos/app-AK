/**
 * Dos canciones o dos dedicatorias en el mismo milisegundo no se pisan (Codex, auditoría 66, SOCIAL01).
 *
 * El nombre de cada una era sólo la hora (`song_${Date.now()}`): dos pedidos a la vez, aunque
 * fueran de fiestas distintas, escribían el mismo documento y quedaba uno solo, con los dos
 * invitados viendo "listo". Se probó rompiéndolo: con la hora sola, esta prueba falla.
 */
const colecciones = new Map<string, Map<string, any>>();
const db = {
  collection(nombre: string) {
    if (!colecciones.has(nombre)) colecciones.set(nombre, new Map());
    return { doc: (id: string) => ({ set: async (valor: any) => { colecciones.get(nombre)!.set(id, { ...valor }); } }) };
  },
};

jest.mock('@/lib/firebase/server', () => ({ dbAdmin: db }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async (id: string) => ({ id, socialGallerySettings: { showDedications: true } })),
  saveFiesta: jest.fn(),
}));
jest.mock('@/lib/social-fiesta/content-review', () => ({
  reviewSocialContent: ({ text }: { text: string }) => ({ status: 'approved', sanitizedText: text }),
  sanitizeSocialText: (t: string) => t,
}));
jest.mock('@/lib/firebase/storage', () => ({}));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn() }));
jest.mock('@/lib/commercial/social-interaction-rate-limit', () => ({ enforceSocialInteractionRateLimit: jest.fn() }));

import { addSongRequest, addDedication } from '@/app/actions/social-interactive';

beforeEach(() => {
  colecciones.clear();
  jest.spyOn(Date, 'now').mockReturnValue(1780406901269);
});
afterEach(() => jest.restoreAllMocks());

const guardados = () => [...colecciones.values()].reduce((n, c) => n + c.size, 0);

describe('Canciones y dedicatorias a la vez, con el reloj quieto', () => {
  it('dos canciones de la misma fiesta quedan las dos', async () => {
    const [a, b] = await Promise.all([
      addSongRequest('f1', 'Tema A', 'Ana'),
      addSongRequest('f1', 'Tema B', 'Beto'),
    ]);
    expect(a.success && b.success).toBe(true);
    expect(a.request?.id).not.toBe(b.request?.id);
    expect(guardados()).toBe(2);
  });

  it('dos dedicatorias de fiestas distintas quedan las dos, cada una en su fiesta', async () => {
    const [a, b] = await Promise.all([
      addDedication('f1', 'Feliz cumple', 'Ana'),
      addDedication('f2', 'Felicidades', 'Beto'),
    ]);
    expect(a.success && b.success).toBe(true);
    expect(guardados()).toBe(2);
    const todas = [...colecciones.values()].flatMap((c) => [...c.values()]);
    expect(todas.map((d) => d.fiestaId).sort()).toEqual(['f1', 'f2']);
  });
});
