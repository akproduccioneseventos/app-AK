/**
 * MATAFUEGO — Auditoría externa del 21/11/2026 (IA-03): el tope mensual de gasto de IA tenía tres agujeros.
 *  1. Una respuesta profunda miraba sólo el tope del día, no el del mes.
 *  2. El auditor reservaba sin mirar el tope del mes.
 *  3. Si no se podía leer cuánto se gastó, se decía que había presupuesto.
 */
let almacen: any = null;
let fallaAlLeer = false;
let esAuditor = false;

jest.mock('server-only', () => ({}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (_archivo: string, vacio: any) => {
    if (fallaAlLeer) throw new Error('base caída');
    return JSON.parse(JSON.stringify(almacen ?? vacio));
  }),
  writeData: jest.fn(async (_archivo: string, datos: any) => {
    almacen = JSON.parse(JSON.stringify(datos));
  }),
}));
jest.mock('@/lib/auth/solo-lectura', () => ({
  exigirQueSePuedaGuardar: jest.fn(async () => undefined),
  esSesionDeAuditor: jest.fn(async () => esAuditor),
  esSesionDeSoloLectura: jest.fn(async () => false),
}));

import { reservarRespuestaProfunda, hayPresupuestoParaIA } from '@/lib/ai/consumo-servidor';

const AHORA = '2026-11-21T15:00:00-03:00';
const MES = '2026-11';

beforeEach(() => {
  fallaAlLeer = false;
  esAuditor = false;
  // Tope del mes $10; ya van 3 respuestas profundas ($9). Una más ($3) lo pasa. El tope del día (40) sobra.
  almacen = { meses: { [MES]: { 'respuesta-profunda': 3 } }, dias: {}, fallos: {}, topeMensualUYU: 10, topeDiarioProfundo: 40 };
});

it('una respuesta profunda no pasa el tope del mes aunque el del día sobre', async () => {
  expect(await reservarRespuestaProfunda(AHORA)).toBe(false);
  expect(almacen.meses[MES]['respuesta-profunda']).toBe(3);
});

it('con lugar en el mes, la respuesta profunda se reserva y se anota', async () => {
  almacen.topeMensualUYU = 100;
  expect(await reservarRespuestaProfunda(AHORA)).toBe(true);
  expect(almacen.meses[MES]['respuesta-profunda']).toBe(4);
});

it('el auditor tampoco pasa por encima del tope del mes', async () => {
  esAuditor = true;
  almacen.meses[MES]['respuesta-profunda'] = 4; // $12, ya pasado el tope de $10
  expect(await reservarRespuestaProfunda(AHORA)).toBe(false);
});

it('si no se puede leer el gasto, no se gasta', async () => {
  fallaAlLeer = true;
  expect(await hayPresupuestoParaIA(AHORA)).toBe(false);
});
