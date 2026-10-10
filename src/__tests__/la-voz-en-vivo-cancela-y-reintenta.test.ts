/**
 * @jest-environment node
 */
/**
 * Voz en vivo (orden 146): Cortar y Reintentar funcionan de verdad.
 *
 * Se usa el control REAL (`crearControlVozEnVivo`, el mismo que usa el widget) con el iniciador real
 * y piezas de mentira donde ESTA prueba decide cuándo resuelve cada espera (ficha, micrófono):
 * - Cortar antes de la ficha: no se pide micrófono, no se abre socket, el panel queda cerrado.
 * - Cortar con el permiso del micrófono pendiente: al llegar, las pistas se paran y no hay socket.
 * - Un 503 y UN toque: exactamente un pedido nuevo (no hace falta un toque invisible).
 * - Dos inicios seguidos: sólo vive el último; la respuesta tardía del primero se descarta.
 * - Desmontar mientras conecta: se cierra todo lo abierto.
 * Las respuestas "tardías" se entregan IGNORANDO la señal (peor caso: un fetch que no se cancela).
 *
 * Probado rompiéndolo: (1) sacar el `if (!vigente()) { sesion.detener(); return; }` del control puso
 * en rojo "un iniciador que ignora la señal"; (2) sacar el chequeo `abortada()` posterior al micrófono dejó
 * pistas vivas y puso en rojo "permiso demorado"; (3) guardar la sesión vacía tras el 503 (quitar
 * `actual = null` en 'cerrada') puso en rojo el reintento; (4) sacar `senal?.addEventListener` dejó
 * el socket abierto al abortar y puso en rojo "abortar con el socket abierto". Se restauró todo.
 */
import { crearControlVozEnVivo } from '@/lib/asistente/control-voz-en-vivo';
import { iniciarVozEnVivo } from '@/lib/asistente/sesion-voz-en-vivo';

function pendiente<T>() {
  let ok!: (v: T) => void;
  let no!: (e: any) => void;
  const promesa = new Promise<T>((a, b) => { ok = a; no = b; });
  return { promesa, ok, no };
}
const vaciar = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

const ficha = { token: 't', model: 'm', voz: 'Kore', segundosMaximos: 120, wsUrl: 'wss://x/y?access_token=t' };
const respuesta = (cuerpo: any, status = 200) => ({ ok: status < 400, status, json: async () => cuerpo }) as any;

let sockets: any[];
class FakeSocket {
  readyState = 1; cerrado = false; onopen: any; onmessage: any; onclose: any; onerror: any;
  constructor(public url: string) { sockets.push(this); }
  send() {} close() { this.cerrado = true; this.readyState = 3; }
}
let contextos: any[];
class FakeAudioContext {
  sampleRate = 48000; currentTime = 0; destination = {}; cerrado = false;
  constructor() { contextos.push(this); }
  resume = async () => {};
  close = () => { this.cerrado = true; };
  createMediaStreamSource() { return { connect() {} }; }
  createScriptProcessor() { return { connect() {}, disconnect() {}, onaudioprocess: null }; }
}
function nuevoStream() {
  const pista = { parada: false, stop() { this.parada = true; } };
  return { stream: { getTracks: () => [pista] } as any, pista };
}

let pedidos: Array<ReturnType<typeof pendiente<any>>>;
let micros: Array<ReturnType<typeof pendiente<any>>>;
let eventos: { estados: string[]; errores: string[] };

function armar() {
  const piezas = {
    fetchFn: ((_u: string, _o: any) => { const p = pendiente<any>(); pedidos.push(p); return p.promesa; }) as any,
    getUserMedia: (() => { const p = pendiente<any>(); micros.push(p); return p.promesa; }) as any,
    WebSocketCtor: FakeSocket,
    AudioContextCtor: FakeAudioContext,
    setTimeoutFn: (() => 1) as any,
    clearTimeoutFn: (() => {}) as any,
  };
  return crearControlVozEnVivo({
    onEstado: (e) => eventos.estados.push(e),
    onError: (m) => eventos.errores.push(m),
    piezas,
  });
}
const panelAbierto = () => eventos.estados.length > 0 && eventos.estados[eventos.estados.length - 1] !== 'cerrada';

beforeEach(() => { sockets = []; contextos = []; pedidos = []; micros = []; eventos = { estados: [], errores: [] }; });

describe('voz en vivo: cortar y reintentar', () => {
  it('cortar antes de la ficha: no pide micrófono, no abre socket y el panel queda cerrado', async () => {
    const c = armar();
    void c.alternar();
    await vaciar();
    expect(pedidos).toHaveLength(1);
    expect(panelAbierto()).toBe(true);
    c.cortar();
    expect(panelAbierto()).toBe(false);
    pedidos[0].ok(respuesta(ficha)); // llega tarde
    await vaciar();
    expect(micros).toHaveLength(0);
    expect(sockets).toHaveLength(0);
    expect(panelAbierto()).toBe(false);
    expect(c.hayIntento()).toBe(false);
  });

  it('cortar con el permiso del micrófono pendiente: al llegar se paran las pistas y no hay socket', async () => {
    const c = armar();
    void c.alternar();
    await vaciar();
    pedidos[0].ok(respuesta(ficha));
    await vaciar();
    expect(micros).toHaveLength(1);
    c.cortar();
    const { stream, pista } = nuevoStream();
    micros[0].ok(stream);
    await vaciar();
    expect(pista.parada).toBe(true);
    expect(sockets).toHaveLength(0);
    expect(panelAbierto()).toBe(false);
  });

  it('un 503 y UN solo toque: exactamente un pedido nuevo', async () => {
    const c = armar();
    void c.alternar();
    await vaciar();
    pedidos[0].ok(respuesta({ error: 'sin clave' }, 503));
    await vaciar();
    expect(eventos.errores).toEqual(['sin clave']);
    expect(c.hayIntento()).toBe(false); // lo fallido no queda guardado como sesión activa
    void c.alternar();
    await vaciar();
    expect(pedidos).toHaveLength(2);
    expect(panelAbierto()).toBe(true);
  });

  it('micrófono denegado: avisa y el siguiente toque vuelve a intentar', async () => {
    const c = armar();
    void c.alternar();
    await vaciar();
    pedidos[0].ok(respuesta(ficha));
    await vaciar();
    micros[0].no({ name: 'NotAllowedError' });
    await vaciar();
    expect(eventos.errores[0]).toMatch(/micrófono/);
    expect(c.hayIntento()).toBe(false);
    void c.alternar();
    await vaciar();
    expect(pedidos).toHaveLength(2);
  });

  it('dos inicios seguidos: sólo vive el último y la respuesta tardía del primero se descarta', async () => {
    const c = armar();
    void c.alternar(); // intento A
    await vaciar();
    c.cortar();
    void c.alternar(); // intento B
    await vaciar();
    expect(pedidos).toHaveLength(2);
    // Fuera de orden: contesta primero B y después A.
    pedidos[1].ok(respuesta(ficha));
    await vaciar();
    const b = nuevoStream();
    micros[0].ok(b.stream);
    await vaciar();
    expect(sockets).toHaveLength(1);
    pedidos[0].ok(respuesta(ficha)); // la de A, tardía
    await vaciar();
    expect(micros).toHaveLength(1); // A no pidió micrófono
    expect(sockets).toHaveLength(1);
    expect(sockets[0].cerrado).toBe(false);
    expect(b.pista.parada).toBe(false);
    expect(c.hayIntento()).toBe(true);
  });

  it('desmontar mientras conecta: se cierra todo lo abierto y nada vuelve a abrirse', async () => {
    const c = armar();
    void c.alternar();
    await vaciar();
    pedidos[0].ok(respuesta(ficha));
    await vaciar();
    const s = nuevoStream();
    micros[0].ok(s.stream);
    await vaciar();
    expect(sockets).toHaveLength(1); // el socket ya estaba abriendo
    const estadosAntes = eventos.estados.length;
    c.cortar(true); // desmontar
    expect(sockets[0].cerrado).toBe(true);
    expect(s.pista.parada).toBe(true);
    expect(contextos[0].cerrado).toBe(true);
    // Un mensaje tardío del socket no revive nada ni avisa.
    await sockets[0].onmessage?.({ data: JSON.stringify({ setupComplete: {} }) });
    expect(eventos.estados).toHaveLength(estadosAntes);
    expect(c.hayIntento()).toBe(false);
  });

  it('un iniciador que ignora la señal y contesta tarde: el control igual lo suelta', async () => {
    const tardia = pendiente<any>();
    let detenida = 0;
    const c = crearControlVozEnVivo({ onEstado: (e) => eventos.estados.push(e), iniciar: (() => tardia.promesa) as any });
    void c.alternar();
    await vaciar();
    c.cortar();
    tardia.ok({ detener: () => { detenida++; } });
    await vaciar();
    expect(detenida).toBe(1);
    expect(c.hayIntento()).toBe(false);
  });

  it('abortar con el socket abierto lo cierra, suelta el micrófono y no avisa nada más', async () => {
    const control = new AbortController();
    const avisos: string[] = [];
    const s = nuevoStream();
    const sesion = await iniciarVozEnVivo({
      senal: control.signal,
      onEstado: (e) => avisos.push(e),
      piezas: {
        fetchFn: (async () => respuesta(ficha)) as any,
        getUserMedia: (async () => s.stream) as any,
        WebSocketCtor: FakeSocket,
        AudioContextCtor: FakeAudioContext,
        setTimeoutFn: (() => 1) as any,
        clearTimeoutFn: (() => {}) as any,
      },
    });
    expect(sockets).toHaveLength(1);
    const antes = avisos.length;
    control.abort(); // sin llamar a detener()
    expect(sockets[0].cerrado).toBe(true);
    expect(s.pista.parada).toBe(true);
    expect(avisos).toHaveLength(antes);
    sesion.detener();
  });

  it('el widget usa el control y deja la ficha y el socket en la misma versión', () => {
    const fs = require('fs');
    const widget = fs.readFileSync('src/components/multiagent/multiagent-widget.tsx', 'utf8');
    expect(widget).toContain('crearControlVozEnVivo');
    expect(widget).not.toMatch(/await iniciarVozEnVivo/);
    const ruta = fs.readFileSync('src/app/api/asistente/voz-en-vivo/route.ts', 'utf8');
    expect(ruta).toMatch(/const version = versionApiEnVivo\(\)/);
    expect(ruta).toContain('direccionDeLaFicha(apiKey, version)');
    expect(ruta).toContain('direccionDelSocket(datos.name, version)');
  });
});
