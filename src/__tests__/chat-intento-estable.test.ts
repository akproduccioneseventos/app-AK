/** @jest-environment node */
import { webcrypto } from 'crypto';
import { obtenerIntentoChat, terminarIntentoChat } from '@/lib/budget/intento-configurador';

const mockStorage = new Map<string, string>();
const carga = { clienteNombre: 'QA privado', clienteContacto: '099000117', total: 850 };

beforeEach(() => {
  mockStorage.clear();
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto });
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => mockStorage.get(key) ?? null,
      setItem: (key: string, value: string) => { mockStorage.set(key, value); },
      removeItem: (key: string) => { mockStorage.delete(key); },
    },
  });
});

it('reutiliza el mismo intento pendiente despues de recargar el modulo', async () => {
  const id = await obtenerIntentoChat(carga, 'solicitud-a');
  jest.resetModules();
  const recargado = await import('@/lib/budget/intento-configurador');

  expect(await recargado.obtenerIntentoChat(carga, 'solicitud-a')).toBe(id);
});

it('al confirmar permite un UUID nuevo para la misma cotizacion', async () => {
  const id = await obtenerIntentoChat(carga, 'solicitud-a');
  terminarIntentoChat('solicitud-a', id);

  expect(await obtenerIntentoChat(carga, 'solicitud-a')).not.toBe(id);
});

it('mantiene intentos independientes por scope', async () => {
  const idA = await obtenerIntentoChat(carga, 'solicitud-a');
  const idB = await obtenerIntentoChat(carga, 'solicitud-b');

  expect(idB).not.toBe(idA);
  expect(await obtenerIntentoChat(carga, 'solicitud-a')).toBe(idA);
  expect(await obtenerIntentoChat(carga, 'solicitud-b')).toBe(idB);
});

it('genera otro intento cuando cambia la carga', async () => {
  const id = await obtenerIntentoChat(carga, 'solicitud-a');

  expect(await obtenerIntentoChat({ ...carga, total: 1200 }, 'solicitud-a')).not.toBe(id);
});

it('falla antes de preparar el envio si sessionStorage esta bloqueado', async () => {
  sessionStorage.setItem = () => { throw new Error('storage bloqueado'); };

  await expect(obtenerIntentoChat(carga, 'solicitud-a')).rejects.toThrow('storage bloqueado');
});

it('no guarda datos personales ni la carga en sessionStorage', async () => {
  await obtenerIntentoChat(carga, 'solicitud-a');
  const almacenado = [...mockStorage.entries()].map(([key, value]) => `${key}:${value}`).join('\n');

  expect(almacenado).toContain('ak-multiagent-solicitud-v1:solicitud-a');
  expect(almacenado).not.toContain('QA privado');
  expect(almacenado).not.toContain('099000117');
  expect(almacenado).not.toContain('clienteNombre');
  expect(almacenado).not.toContain('clienteContacto');
  expect(almacenado).not.toContain('850');
  expect(JSON.parse(mockStorage.get('ak-multiagent-solicitud-v1:solicitud-a')!)).toEqual({
    attempts: [{ id: expect.any(String), fingerprint: expect.any(String) }],
  });
});

it('conserva A incierto al enviar y confirmar B en el mismo chat', async () => {
  const a = await obtenerIntentoChat(carga, 'solicitud-a');
  const otra = { ...carga, total: 1200 };
  const b = await obtenerIntentoChat(otra, 'solicitud-a');
  terminarIntentoChat('solicitud-a', b);
  jest.resetModules();
  const recargado = await import('@/lib/budget/intento-configurador');
  expect(await recargado.obtenerIntentoChat(carga, 'solicitud-a')).toBe(a);
  expect(await recargado.obtenerIntentoChat(otra, 'solicitud-a')).not.toBe(b);
});

it('migra un intento incierto de la version anterior sin cambiar su UUID', async () => {
  const id = await obtenerIntentoChat(carga, 'solicitud-a');
  const key = 'ak-multiagent-solicitud-v1:solicitud-a';
  const stored = JSON.parse(mockStorage.get(key)!);
  mockStorage.set(key, JSON.stringify(stored.attempts[0]));
  expect(await obtenerIntentoChat(carga, 'solicitud-a')).toBe(id);
});
