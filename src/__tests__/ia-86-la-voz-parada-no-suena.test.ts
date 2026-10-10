/**
 * @jest-environment node
 */
/**
 * Auditoría 86, IA: la voz que se paró sonaba igual.
 *
 * Qué se rompía: el reproductor pedía el audio de Gemini y, si en el medio se tocaba "parar" o se
 * pedía otra respuesta, cuando el pedido viejo volvía creaba el audio y lo reproducía (o caía a la
 * voz del teléfono) encima de lo nuevo. Ahora cada pedido y cada "parar" suben un número, y un
 * pedido con número viejo no hace nada.
 *
 * Probado rompiéndolo: sin el contador `generacion`, las tres pruebas dan rojo.
 */
const creados: any[] = [];
class AudioFalso {
  onplay: any; onended: any; onerror: any; currentTime = 0;
  play = jest.fn(async () => undefined);
  pause = jest.fn();
  constructor(public src: string) { creados.push(this); }
}
const habladas: string[] = [];
let pendientes: Array<(r: any) => void> = [];

beforeEach(() => {
  creados.length = 0;
  habladas.length = 0;
  pendientes = [];
  (global as any).Audio = AudioFalso;
  (global as any).URL.createObjectURL = jest.fn(() => 'blob:x');
  (global as any).URL.revokeObjectURL = jest.fn();
  (global as any).fetch = jest.fn(() => new Promise((res) => { pendientes.push(res); }));
  (global as any).window = {
    speechSynthesis: { cancel: jest.fn(), speak: (u: any) => habladas.push(u.text), getVoices: () => [] },
  };
  (global as any).SpeechSynthesisUtterance = class { constructor(public text: string) {} };
});
afterEach(() => { delete (global as any).window; });

const respuestaConAudio = () => ({ ok: true, blob: async () => ({ size: 5000 }) });
const tick = () => new Promise((r) => setTimeout(r, 0));

import { reproducirVozReal, detenerVozReal } from '@/lib/asistente/reproductor-voz';

describe('Parar la voz invalida el pedido en vuelo', () => {
  it('si se para antes de que llegue el audio, no se crea ni suena nada', async () => {
    const p = reproducirVozReal('Hola, esto es una prueba.');
    await tick();
    detenerVozReal();
    pendientes[0](respuestaConAudio());
    await p;
    expect(creados).toHaveLength(0);
    expect(habladas).toHaveLength(0);
  });

  it('si se para y el pedido falla, tampoco cae a la voz del teléfono', async () => {
    const p = reproducirVozReal('Hola, esto es una prueba.');
    await tick();
    detenerVozReal();
    pendientes[0]({ ok: false, json: async () => ({}) });
    await p;
    expect(creados).toHaveLength(0);
    expect(habladas).toHaveLength(0);
  });

  it('un pedido nuevo invalida al viejo: suena sólo el nuevo', async () => {
    const viejo = reproducirVozReal('Texto viejo de la respuesta.');
    await tick();
    const nuevo = reproducirVozReal('Texto nuevo de la respuesta.');
    await tick();
    pendientes[0](respuestaConAudio());
    pendientes[1](respuestaConAudio());
    await Promise.all([viejo, nuevo]);
    expect(creados).toHaveLength(1);
    expect(creados[0].play).toHaveBeenCalledTimes(1);
  });
});
