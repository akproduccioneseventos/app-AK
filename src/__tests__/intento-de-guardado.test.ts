/**
 * @jest-environment jsdom
 */
import { webcrypto } from 'crypto';
import { obtenerIntento, terminarIntento } from '@/lib/intento-de-guardado';

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto });
  if (!(globalThis as any).TextEncoder) (globalThis as any).TextEncoder = require('util').TextEncoder;
});
beforeEach(() => window.sessionStorage.clear());

it('el mismo contenido reintentado conserva el id; otro contenido arma uno nuevo', async () => {
  const a = await obtenerIntento('gasto', { monto: 100, concepto: 'Hielo' });
  const b = await obtenerIntento('gasto', { monto: 100, concepto: 'Hielo' });
  const c = await obtenerIntento('gasto', { monto: 200, concepto: 'Hielo' });
  expect(b).toBe(a);
  expect(c).not.toBe(a);
});

it('al terminar, el mismo contenido arma un id nuevo (es otro gasto legítimo)', async () => {
  const a = await obtenerIntento('gasto', { monto: 100 });
  terminarIntento('gasto');
  const b = await obtenerIntento('gasto', { monto: 100 });
  expect(b).not.toBe(a);
});
