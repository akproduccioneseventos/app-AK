/**
 * @jest-environment node
 */
/**
 * Voz en vivo del asistente (orden 105, bloque 3) - la sesión del navegador, con piezas de mentira.
 *
 * - Pide la ficha al servidor, abre el socket con la dirección que le dieron y manda el `setup`.
 * - Al llegar `setupComplete` empieza a mandar el micrófono en PCM de 16 bits y 16 kHz.
 * - El audio que llega se pone en cola; si llega `interrupted` se corta TODO lo encolado en el acto.
 * - El corte duro (por tiempo o por detener) cierra el socket, suelta el micrófono y cierra el audio.
 * - Los errores salen en castellano: micrófono negado, cuota de Google, servidor que dice que no.
 *
 * Probado rompiéndolo: sacar el `cortarAudioEnCola()` de `interrupted` dejó fuentes sin parar y
 * puso en rojo la prueba de interrupción; sacar el `microfono.getTracks().forEach(stop)` puso en rojo
 * la de corte duro. Se restauró.
 */
import { iniciarVozEnVivo, aPcm16Mono, mensajeDeCierre, deBase64, aBase64 } from '@/lib/asistente/sesion-voz-en-vivo';

class FakeSocket {
  static ultimo: FakeSocket;
  readyState = 1;
  enviados: any[] = [];
  cerrado = false;
  onopen: any; onmessage: any; onclose: any; onerror: any;
  constructor(public url: string) { FakeSocket.ultimo = this; }
  send(d: string) { this.enviados.push(JSON.parse(d)); }
  close() { this.cerrado = true; this.readyState = 3; }
  async recibir(obj: any) { await this.onmessage({ data: JSON.stringify(obj) }); }
}

class FakeFuente {
  detenida = false; onended: any = null; inicio = -1;
  buffer: any; connect() {}
  start(t: number) { this.inicio = t; }
  stop() { this.detenida = true; }
}

let fuentes: FakeFuente[];
let procesador: any;
let contextoCerrado: boolean;
class FakeAudioContext {
  sampleRate = 48000; currentTime = 0; destination = {};
  resume = async () => {};
  close = () => { contextoCerrado = true; };
  createMediaStreamSource() { return { connect() {} }; }
  createScriptProcessor() { procesador = { connect() {}, disconnect() {}, onaudioprocess: null as any }; return procesador; }
  createBuffer(_c: number, largo: number, rate: number) {
    return { duration: largo / rate, getChannelData: () => new Float32Array(largo) };
  }
  createBufferSource() { const f = new FakeFuente(); fuentes.push(f); return f; }
}

let pistaParada: boolean;
const microfonoFalso = async () => ({ getTracks: () => [{ stop: () => { pistaParada = true; } }] }) as any;

const ficha = { token: 't', model: 'gemini-3.8-live', voz: 'Kore', segundosMaximos: 120, wsUrl: 'wss://x/y?access_token=t' };
const fetchOk = (cuerpo: any = ficha, ok = true, status = 200) =>
  (async () => ({ ok, status, json: async () => cuerpo })) as any;

let temporizadores: Array<{ fn: () => void; ms: number }>;
function armar(extra: any = {}) {
  const eventos: any = { estados: [] as string[], errores: [] as string[], textos: [] as string[] };
  const piezas = {
    fetchFn: fetchOk(),
    WebSocketCtor: FakeSocket,
    AudioContextCtor: FakeAudioContext,
    getUserMedia: microfonoFalso,
    setTimeoutFn: ((fn: () => void, ms: number) => { temporizadores.push({ fn, ms }); return temporizadores.length; }) as any,
    clearTimeoutFn: (() => {}) as any,
    ...extra,
  };
  const promesa = iniciarVozEnVivo({
    onEstado: (e) => eventos.estados.push(e),
    onError: (m) => eventos.errores.push(m),
    onTexto: (t) => eventos.textos.push(t),
    piezas,
  });
  return { promesa, eventos };
}

const audioBase64 = (muestras = 2400) => aBase64(new Uint8Array(muestras * 2));

beforeEach(() => { fuentes = []; procesador = null; contextoCerrado = false; pistaParada = false; temporizadores = []; });

describe('sesión de voz en vivo', () => {
  it('abre el socket con la dirección de la ficha y manda el setup', async () => {
    const { promesa } = armar();
    await promesa;
    expect(FakeSocket.ultimo.url).toBe(ficha.wsUrl);
    FakeSocket.ultimo.onopen();
    const setup = FakeSocket.ultimo.enviados[0].setup;
    expect(setup.model).toBe('models/gemini-3.8-live');
    expect(setup.generationConfig.responseModalities).toEqual(['AUDIO']);
    expect(setup.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe('Kore');
  });

  it('con setupComplete manda el micrófono en PCM de 16 kHz cada ~100 ms', async () => {
    const { promesa, eventos } = armar();
    await promesa;
    await FakeSocket.ultimo.recibir({ setupComplete: {} });
    expect(eventos.estados).toContain('escuchando');
    // 4096 muestras a 48 kHz = ~1365 a 16 kHz: dos bloques pasan los 1600.
    procesador.onaudioprocess({ inputBuffer: { getChannelData: () => new Float32Array(4096).fill(0.5) } });
    procesador.onaudioprocess({ inputBuffer: { getChannelData: () => new Float32Array(4096).fill(0.5) } });
    const audios = FakeSocket.ultimo.enviados.filter((m) => m.realtimeInput);
    expect(audios).toHaveLength(1);
    expect(audios[0].realtimeInput.audio.mimeType).toBe('audio/pcm;rate=16000');
    expect(deBase64(audios[0].realtimeInput.audio.data).length).toBe(1600 * 2);
  });

  it('interrupted corta todo el audio en cola en el acto', async () => {
    const { promesa } = armar();
    await promesa;
    await FakeSocket.ultimo.recibir({ setupComplete: {} });
    await FakeSocket.ultimo.recibir({ serverContent: { modelTurn: { parts: [{ inlineData: { data: audioBase64() } }] } } });
    await FakeSocket.ultimo.recibir({ serverContent: { modelTurn: { parts: [{ inlineData: { data: audioBase64() } }] } } });
    expect(fuentes).toHaveLength(2);
    expect(fuentes[1].inicio).toBeGreaterThan(fuentes[0].inicio); // en fila, no encimadas
    await FakeSocket.ultimo.recibir({ serverContent: { interrupted: true } });
    expect(fuentes.every((f) => f.detenida)).toBe(true);
  });

  it('pasa la transcripción de lo que dice el asistente', async () => {
    const { promesa, eventos } = armar();
    await promesa;
    await FakeSocket.ultimo.recibir({ setupComplete: {} });
    await FakeSocket.ultimo.recibir({ serverContent: { outputTranscription: { text: 'Hola Alexander' } } });
    expect(eventos.textos).toEqual(['Hola Alexander']);
  });

  it('detener cierra el socket, suelta el micrófono y cierra el audio', async () => {
    const { promesa, eventos } = armar();
    const sesion = await promesa;
    await FakeSocket.ultimo.recibir({ setupComplete: {} });
    sesion.detener();
    expect(FakeSocket.ultimo.cerrado).toBe(true);
    expect(pistaParada).toBe(true);
    expect(contextoCerrado).toBe(true);
    expect(eventos.estados[eventos.estados.length - 1]).toBe('cerrada');
    expect(eventos.errores).toEqual([]); // cortar a propósito no es un error
  });

  it('el corte duro por tiempo hace lo mismo a los segundosMaximos', async () => {
    const { promesa } = armar();
    await promesa;
    const corte = temporizadores.find((t) => t.ms === 120000);
    expect(corte).toBeDefined();
    corte!.fn();
    expect(FakeSocket.ultimo.cerrado).toBe(true);
    expect(pistaParada).toBe(true);
    expect(contextoCerrado).toBe(true);
  });

  it('si el servidor dice que no, muestra su frase y no abre nada', async () => {
    const { promesa, eventos } = armar({ fetchFn: fetchOk({ error: 'Se llegó a los minutos de voz en vivo de hoy. Podés subirlos en Ajustes → Asistente.' }, false, 429) });
    await promesa;
    expect(eventos.errores[0]).toMatch(/minutos de voz en vivo de hoy/);
    expect(pistaParada).toBe(false);
  });

  it('micrófono negado: frase en castellano y nada queda abierto', async () => {
    const { promesa, eventos } = armar({ getUserMedia: async () => { throw Object.assign(new Error('x'), { name: 'NotAllowedError' }); } });
    await promesa;
    expect(eventos.errores[0]).toMatch(/permisos del navegador/);
    expect(contextoCerrado).toBe(false);
  });

  it('si Google cierra por cuota dice que no dio más voz gratis y limpia todo', async () => {
    const { promesa, eventos } = armar();
    await promesa;
    FakeSocket.ultimo.onclose({ code: 1011, reason: 'RESOURCE_EXHAUSTED: quota exceeded' });
    expect(eventos.errores[0]).toBe('Google no dio más voz gratis por hoy.');
    expect(pistaParada).toBe(true);
  });
});

describe('piezas sueltas', () => {
  it('baja de 48 kHz a 16 kHz promediando', () => {
    const pcm = aPcm16Mono(new Float32Array(480).fill(1), 48000);
    expect(pcm.length).toBe(160);
    expect(pcm[0]).toBe(32767);
  });
  it('los cierres raros no dicen nada de más', () => {
    expect(mensajeDeCierre(1006, '')).toBe('Se cortó la conexión con la voz en vivo.');
  });
});
