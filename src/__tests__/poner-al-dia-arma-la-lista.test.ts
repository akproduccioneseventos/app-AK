/**
 * Poner al día (pedido del dueño, 9/10/2026): con la forma real de su respaldo, la lista trae las
 * fiestas pasadas sin cobrar, las copias con acentos rotos y los presupuestos de prueba, y deja
 * afuera lo que ya está bien. Marcar cobrado lo decide una persona: acá sólo se arma la lista.
 */
import { armarPonerAlDia, tieneAcentosRotos } from '@/lib/contabilidad/poner-al-dia';

const presupuesto = (id: string, cliente: string, fecha: string, extra: any = {}) => ({
  id, clienteNombre: cliente, eventoFecha: `${fecha}T00:00:00.000Z`, estado: 'Aceptado',
  totalConDescuento: 200_000, costoTotalEstimado: 200_000, pagosCliente: [], itemsPresupuestados: [], ...extra,
}) as any;
const fiesta = (id: string, presupuestoId: string | undefined, nombre: string, fecha: string, estado = 'En Planificación') => ({
  id, presupuestoId, estado, configuracion: { nombreEvento: nombre, fechaEvento: fecha },
}) as any;

const HOY = '2026-10-09';
const P = [
  presupuesto('p1', 'Claudia Flores', '2026-08-08'),
  presupuesto('p2', 'Mauro Franchi', '2026-10-03', { pagosCliente: [{ monto: 200_000, estadoPago: 'confirmado' }] }),
  presupuesto('p3', 'Lorena Leal', '2026-12-19'),
  presupuesto('t1', 'nico knuth', '2026-07-23', { estado: 'Pendiente Verificación' }),
];
const F = [
  fiesta('f1', 'p1', 'Evento social de Claudia Flores', '2026-08-08'),
  fiesta('f2', 'p2', 'Evento social de Mauro Franchi', '2026-10-03'),
  fiesta('f3', 'p3', 'XV años de Lorena Leal', '2026-12-19'),
  fiesta('fiesta_doc_lorena', 'presupuesto_viejo', 'XV a\u00c3\u00b1os de Lorena Leal', '2026-12-19', 'En Planificaci\u00c3\u00b3n'),
];

it('las fiestas pasadas con saldo vienen para cobrar; la que ya está paga, no', () => {
  const r = armarPonerAlDia(P, F, HOY);
  expect(r.cobros.map((c) => c.cliente)).toEqual(['Claudia Flores']);
  expect(r.cobros[0].saldo).toBe(200_000);
});

it('la copia vieja con acentos rotos se reconoce y apunta a la buena', () => {
  const r = armarPonerAlDia(P, F, HOY);
  expect(r.copias.map((c) => c.fiestaId)).toEqual(['fiesta_doc_lorena']);
  expect(tieneAcentosRotos('XV a\u00c3\u00b1os')).toBe(true);
  expect(tieneAcentosRotos('XV años')).toBe(false);
});

it('las futuras quedan para que una persona marque si se cancelaron, sin marcar nada sola', () => {
  const r = armarPonerAlDia(P, F, HOY);
  expect(r.vigentes.map((v) => v.cliente)).toEqual(['Lorena Leal']);
});

it('el presupuesto de prueba pasado y sin fiesta se ofrece archivar', () => {
  const r = armarPonerAlDia(P, F, HOY);
  expect(r.pruebas.map((p) => p.presupuestoId)).toEqual(['t1']);
});

it('con los datos del respaldo real (si están a mano) arma lo que se vio a mano', () => {
  const fs = require('fs');
  const dir = process.env.AK_RESPALDO_DIR;
  if (!dir || !fs.existsSync(`${dir}/presupuestos.json`)) return;
  const r = armarPonerAlDia(JSON.parse(fs.readFileSync(`${dir}/presupuestos.json`, 'utf8')), JSON.parse(fs.readFileSync(`${dir}/fiestas.json`, 'utf8')), HOY);
  expect(r.cobros.length).toBe(4);
  // 29 copias; 2 tienen OTRA fecha que la fiesta buena (Lorena Ferreira, Soraya Texeira) y no se
  // archivan solas: hay que ver cuál fecha es la correcta.
  expect(r.copias.length).toBe(27);
  expect(r.pruebas.length).toBe(10);
});

it('un cobro guardado sin número interno cuenta como pagado', () => {
  const { getBudgetPaymentSummary } = require('@/lib/budget/financial-guardrails');
  const r = getBudgetPaymentSummary({ totalConDescuento: 200_000, pagosCliente: [{ monto: 200_000, estadoPago: 'confirmado' }] });
  expect(r.paid).toBe(200_000);
  expect(r.balance).toBe(0);
});
