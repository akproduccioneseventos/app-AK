/**
 * Probe de voz en main 1b61295ab977fd6f204ffdab0f190edbd0f0ed6b.
 * Consumidor: MultiAgentWidget.speakText y su cleanup en
 * src/components/multiagent/multiagent-widget.tsx (reproductor compartido).
 * No prueba permisos, fallback ni los toggles de voz.
 * Ejecutado: dos fallos reproducidos en 86-ia-resultados.json.
 */
import { detenerVozReal, reproducirVozReal } from '@/lib/asistente/reproductor-voz';

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
};

describe('reproductor real: detener durante POST pendiente', () => {
  const audios: Array<{ play: jest.Mock; pause: jest.Mock; onended: (() => void) | null }> = [];
  beforeEach(() => {
    audios.length = 0;
    (globalThis as any).fetch = jest.fn();
    (globalThis as any).URL.createObjectURL = jest.fn(() => 'blob:probe');
    (globalThis as any).URL.revokeObjectURL = jest.fn();
    (globalThis as any).Audio = jest.fn(() => {
      const audio = { play: jest.fn(async () => {}), pause: jest.fn(), onended: null as (() => void) | null };
      audios.push(audio);
      return audio;
    });
  });

  it('no reproduce la respuesta si detenerVozReal ocurre mientras fetch esta pendiente', async () => {
    const request = deferred<any>();
    (globalThis as any).fetch.mockReturnValue(request.promise);
    const speaking = reproducirVozReal('respuesta pendiente');
    detenerVozReal();
    request.resolve({ ok: true, blob: async () => new Blob([new Uint8Array(256)]) });
    await speaking;
    expect(audios).toHaveLength(0);
  });

  it('no reproduce una solicitud vieja cuando una nueva ya la reemplazo', async () => {
    const oldRequest = deferred<any>();
    const newRequest = deferred<any>();
    (globalThis as any).fetch.mockReturnValueOnce(oldRequest.promise).mockReturnValueOnce(newRequest.promise);
    const oldSpeaking = reproducirVozReal('respuesta vieja');
    const newSpeaking = reproducirVozReal('respuesta nueva');
    oldRequest.resolve({ ok: true, blob: async () => new Blob([new Uint8Array(256)]) });
    await oldSpeaking;
    expect(audios).toHaveLength(0);
    newRequest.resolve({ ok: true, blob: async () => new Blob([new Uint8Array(256)]) });
    await newSpeaking;
    expect(audios).toHaveLength(1);
    expect(audios[0].play).toHaveBeenCalledTimes(1);
  });
});
