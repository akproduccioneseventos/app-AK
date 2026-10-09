/**
 * Codex, auditoría 81 (punto 6): el parte de la mañana.
 *
 * - Lo arma el despertador, sin sesión. Leía con `getFiestas`/`getPresupuestos`, que piden sesión;
 *   el `.catch(() => [])` lo tapaba, el parte decía "todo al día" y QUEDABA GUARDADO para todo el día.
 * - El saldo restaba pagos "a confirmar" como si estuvieran cobrados.
 * - Y lo de plata (saldos, conciliación) se mostraba a cualquiera del equipo en "Mi día".
 *
 * Probado rompiéndolo: con el filtro viejo de pagos, o guardando el parte incompleto, se pone en rojo.
 */
const base: Record<string, any> = {};
let presupuestosFallan = false;
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (f: string, d: any) => (base[f] === undefined ? d : JSON.parse(JSON.stringify(base[f])))),
  readDataConDetalle: jest.fn(async (f: string, d: any) => (presupuestosFallan
    ? { valor: d, huboFalla: true }
    : { valor: base[f] === undefined ? d : JSON.parse(JSON.stringify(base[f])), huboFalla: false })),
  writeData: jest.fn(async (f: string, v: any) => { base[f] = JSON.parse(JSON.stringify(v)); }),
}));
const fiestas = jest.fn();
jest.mock('@/lib/fiesta/leer-fiestas', () => ({ leerFiestasCrudas: () => fiestas() }));
// Si el parte volviera a leer por la puerta con sesión, estas fallan como en el despertador.
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getFiestas: jest.fn(async () => { throw new Error('Sesion no autorizada'); }) }));
jest.mock('@/app/actions/presupuestos', () => ({ getPresupuestos: jest.fn(async () => { throw new Error('No autorizado'); }) }));

import { getParteDeLaManana, parteParaQuienMira } from '@/lib/automatico/parte-manana';

function enDias(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T12:00:00`;
}

const fiesta = { id: 'f1', presupuestoId: 'p1', menuAsignadoId: 'm1', invitados: [{ id: 'i1' }], configuracion: { fechaEvento: enDias(5), nombreEvento: 'Los 15 de Ana' } };
const presupuesto = (pagos: any[]) => ({ id: 'p1', clienteNombre: 'Ana', totalConDescuento: 100_000, pagosCliente: pagos });

beforeEach(() => {
  for (const k of Object.keys(base)) delete base[k];
  presupuestosFallan = false;
  fiestas.mockReset().mockResolvedValue([fiesta]);
});

it('sin sesión igual ve la cobranza pendiente', async () => {
  base['presupuestos.json'] = [presupuesto([{ monto: 30_000, estadoPago: 'confirmado' }])];
  const parte = await getParteDeLaManana(true);
  const cobranza = parte.items?.find((i) => i.tipo === 'cobranza');
  expect(cobranza?.detalle).toContain('70.000');
  expect(parte.textoResumen).not.toContain('todo al día');
});

it('un pago a confirmar no baja el saldo', async () => {
  base['presupuestos.json'] = [presupuesto([
    { monto: 30_000, estadoPago: 'confirmado' },
    { monto: 70_000, estadoPago: 'pendiente_confirmacion' },
  ])];
  const parte = await getParteDeLaManana(true);
  expect(parte.items?.find((i) => i.tipo === 'cobranza')?.detalle).toContain('70.000');
});

it('si no se pudo leer, no dice "todo al día" ni lo guarda para el resto del día', async () => {
  presupuestosFallan = true;
  fiestas.mockRejectedValue(new Error('base caída'));
  const parte = await getParteDeLaManana(true);
  expect(parte.incompleto).toBe(true);
  expect(parte.textoResumen).not.toMatch(/todo al día/i);
  expect(base['parte-manana-cache.json']).toBeUndefined();

  // Cuando la base vuelve, el parte se arma de nuevo (no queda el incompleto).
  presupuestosFallan = false;
  fiestas.mockReset().mockResolvedValue([fiesta]);
  base['presupuestos.json'] = [presupuesto([])];
  const otra = await getParteDeLaManana();
  expect(otra.incompleto).toBeUndefined();
  expect(otra.items?.some((i) => i.tipo === 'cobranza')).toBe(true);
});

it('a quien no tiene contabilidad no le muestra saldos', async () => {
  base['presupuestos.json'] = [presupuesto([])];
  const parte = await getParteDeLaManana(true);
  const visto = parteParaQuienMira(parte, false);
  expect(JSON.stringify(visto)).not.toContain('100.000');
  expect(visto.itemsPrincipales.some((i) => i.tipo === 'cobranza')).toBe(false);
  expect(parteParaQuienMira(parte, true).items?.some((i) => i.tipo === 'cobranza')).toBe(true);
});
