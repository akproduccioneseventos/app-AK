/** @jest-environment node */
const store = new Map<string, any>();

jest.mock('@/lib/generic-json-store', () => ({
  readGenericJsonFile: jest.fn(async (filePath: string) => {
    return store.has(filePath) ? JSON.parse(JSON.stringify(store.get(filePath))) : null;
  }),
  mutateGenericJsonArray: jest.fn(async (filePath: string, cambiar: (arr: any[]) => any[] | null) => {
    const actual = store.has(filePath) ? JSON.parse(JSON.stringify(store.get(filePath))) : [];
    const nueva = cambiar(Array.isArray(actual) ? actual : []);
    if (nueva !== null) {
      store.set(filePath, JSON.parse(JSON.stringify(nueva)));
    }
    return nueva;
  }),
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  reservarConsumoIA: jest.fn(async () => ({ liberar: jest.fn(async () => {}) })),
}));

import { sincronizarCompetenciaSemanal, getCompetenciaEstado, guardarCompetenciaCuentas, generarResumenCompetenciaIA } from '@/lib/presencia-digital/competencia';
import { registrarClicEnlace, obtenerClicsEnlaces } from '@/lib/presencia-digital/enlaces-bio';
import { GET as handleEnlacesClic } from '@/app/api/enlaces/clic/route';

describe('Orden 327 - Competencia y Enlaces Bio', () => {
  beforeEach(() => {
    store.clear();
  });
  it('registra y lee cuentas de competencia correctamente', async () => {
    await guardarCompetenciaCuentas([
      { username: 'competencia1', activo: true, seguidores: 1200, publicacionesCount: 45 }
    ]);
    const estado = await getCompetenciaEstado();
    expect(estado.cuentas).toHaveLength(1);
    expect(estado.cuentas[0].username).toBe('competencia1');
    expect(estado.cuentas[0].seguidores).toBe(1200);
  });

  it('maneja el error de cuenta que no es de empresa sin romper', async () => {
    const originalFetch = global.fetch;
    const prevToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const prevIgId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    process.env.INSTAGRAM_ACCESS_TOKEN = 'test_token';
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = 'test_ig_id';
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        error: {
          message: 'Unsupported post request. Object with ID does not exist cannot loaded due to missing permissions or not a business account.'
        }
      })
    } as any);

    try {
      await guardarCompetenciaCuentas([
        { username: 'cuenta_personal', activo: true, seguidores: 0, publicacionesCount: 0 }
      ]);

      await sincronizarCompetenciaSemanal();
      const estado = await getCompetenciaEstado();
      expect(estado.cuentas[0].error).toContain('Esta cuenta no es de empresa');
    } finally {
      global.fetch = originalFetch;
      if (prevToken === undefined) delete process.env.INSTAGRAM_ACCESS_TOKEN;
      else process.env.INSTAGRAM_ACCESS_TOKEN = prevToken;
      if (prevIgId === undefined) delete process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
      else process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = prevIgId;
    }
  });

  it('genera resumen de competencia con IA', async () => {
    await guardarCompetenciaCuentas([
      { username: 'rival1', activo: true, seguidores: 5000, publicacionesCount: 100 }
    ]);
    const resumen = await generarResumenCompetenciaIA();
    expect(typeof resumen).toBe('string');
  });

  it('registra clics en enlaces y el endpoint redirige correctamente', async () => {
    const res = await handleEnlacesClic(new Request('http://localhost:3000/api/enlaces/clic?d=presupuesto'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/simulador-de-presupuesto');

    const clics = await obtenerClicsEnlaces();
    expect(clics.length).toBeGreaterThan(0);
    const clicPresupuesto = clics.find(c => c.boton === 'presupuesto');
    expect(clicPresupuesto?.clicks).toBeGreaterThan(0);
  });
});
