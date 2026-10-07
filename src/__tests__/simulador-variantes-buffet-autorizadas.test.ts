/**
 * Codex, auditoria 78 (orden 128 A): el simulador ofrecia "POLLO ARROLLADO CON MESA BUFET" y
 * al guardar el servidor decia "Uno o mas servicios ya no estan disponibles". Las variantes con
 * mesa bufet se armaban solo al MOSTRAR los menus; el servidor, al recalcular el presupuesto,
 * leia los menus guardados y no las conocia.
 *
 * Esta prueba usa los menus reales del repositorio, la lectura publica real
 * (`getMenusPublicos`) y el guardado real (`persistPublicSimulatorBudget`). Lo de afuera
 * (base, limite de pedidos y la ficha del CRM) es de mentira.
 */
jest.mock('server-only', () => ({}));

import fs from 'fs';
import path from 'path';

const leerReal = (archivo: string) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data', archivo), 'utf-8'));

const memoria: Record<string, unknown> = {};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, vacio: unknown) => {
    if (archivo in memoria) return JSON.parse(JSON.stringify(memoria[archivo]));
    const real = path.join(process.cwd(), 'src/data', archivo);
    return fs.existsSync(real) ? JSON.parse(fs.readFileSync(real, 'utf-8')) : vacio;
  }),
  writeData: jest.fn(async (archivo: string, valor: unknown) => { memoria[archivo] = valor; }),
}));
jest.mock('@/lib/insumos/leer-insumos', () => ({ leerInsumosCrudos: jest.fn(async () => leerReal('insumos.json')) }));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn(async () => undefined) }));
jest.mock('@/lib/crm/public-lead-persistence', () => ({
  upsertPublicCommercialLead: jest.fn(async () => ({ lead: { id: 'lead_prueba' } })),
}));

import { getMenusPublicos } from '@/app/actions/menus-catering';
import { persistPublicSimulatorBudget } from '@/lib/budget/public-simulator-persistence';

const pedido = (ids: string[]) => ({
  clienteNombre: 'Prospecto de prueba',
  clienteContacto: '099123456',
  adultos: 100,
  adolescentes: 0,
  ninos: 0,
  eventoFecha: '2027-01-23',
  selectedServiceIds: ids,
  submissionId: `prueba-${ids.join('-')}`,
}) as any;

describe('el simulador guarda las variantes con mesa bufet que ofrece', () => {
  const anterior = process.env.AK_USE_LOCAL_JSON_ONLY;
  beforeAll(() => { process.env.AK_USE_LOCAL_JSON_ONLY = 'true'; });
  afterAll(() => {
    if (anterior === undefined) delete process.env.AK_USE_LOCAL_JSON_ONLY;
    else process.env.AK_USE_LOCAL_JSON_ONLY = anterior;
  });
  beforeEach(() => { for (const k of Object.keys(memoria)) delete memoria[k]; });

  it('cada variante ofrecida se guarda con el precio de su plato con guarnicion', async () => {
    const menus = await getMenusPublicos();
    const platos = menus.flatMap((m) => m.items);
    const variantes = platos.filter((p) => p.id.endsWith('_virtual_buffet'));
    expect(variantes.map((v) => v.name).sort()).toEqual([
      'ASADO COMPLETO CON MESA BUFET',
      'CERDO ARROLLADO CON MESA BUFET',
      'CORDERO ASADO CON MESA BUFET',
      'POLLO ARROLLADO CON MESA BUFET',
    ]);

    for (const variante of variantes) {
      const idBase = variante.id.replace('_virtual_buffet', '');
      const { presupuesto } = await persistPublicSimulatorBudget(pedido([variante.id, idBase]), {
        source: 'simulator_visual' as any,
        acquisition: {} as any,
        eventoTipo: 'Cumpleaños',
      } as any);
      const renglones = presupuesto.itemsPresupuestados as any[];
      const deLaVariante = renglones.find((i) => i.idServicioCatalogo === variante.id);
      const delPlato = renglones.find((i) => i.idServicioCatalogo === idBase);
      // Se guarda con su nombre, y al mismo precio que su plato con guarnicion.
      expect(deLaVariante?.nombreServicio).toBe(variante.name);
      expect(deLaVariante?.precioUnitario).toBeGreaterThan(0);
      expect(deLaVariante?.precioUnitario).toBe(delPlato?.precioUnitario);
    }
  });

  it('un id inventado sigue rechazado', async () => {
    await expect(persistPublicSimulatorBudget(pedido(['dish_main_2_virtual_buffet_trucho']), {
      source: 'simulator_visual' as any,
      acquisition: {} as any,
    } as any)).rejects.toThrow('ya no estan disponibles');
  });
});
