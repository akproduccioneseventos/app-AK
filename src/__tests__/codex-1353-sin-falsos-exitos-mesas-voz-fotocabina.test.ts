/**
 * @jest-environment node
 */
/**
 * Codex 1353: cuatro lugares que decian "listo" sin que fuera cierto.
 * 1. Armar mesas solo: ignoraba las respuestas {success:false} y cerraba la propuesta.
 * 2. Voz en vivo: la accion que pide confirmacion nunca llegaba con `confirmado`.
 * 3. Portal del cliente: "Hablar" anunciaba "conectada" y gastaba minutos sin abrir audio.
 * 4. Fotocabina con camara frontal: la corona caia del lado contrario.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { iniciarVozEnVivo } from '@/lib/asistente/sesion-voz-en-vivo';
import { HERRAMIENTAS_VOZ } from '@/lib/asistente/voz-en-vivo';
import { dibujarFiltroDeCara, reflejarCarasEnHorizontal, type CaraDetectada } from '@/lib/entretenimiento/filtros-cara';

const leer = (r: string) => readFileSync(join(process.cwd(), r), 'utf8');

describe('1. mesas: una asignacion que falla no se anuncia como guardada', () => {
  const src = leer('src/app/(app)/fiestas/nueva/invitados/page.tsx');
  const cuerpo = src.slice(src.indexOf('const handleConfirmarMesas'), src.indexOf('const [guestQrModal'));
  it('mira la respuesta de cada guardado y corta antes del cartel de exito', () => {
    expect(cuerpo).toMatch(/await updateInvitadoFiestaActual\([^)]*\{[\s\S]*?\}\);/);
    expect(cuerpo).toMatch(/const respuesta = await updateInvitadoFiestaActual/);
    expect(cuerpo).toMatch(/respuesta\?\.success/);
    const iFalla = cuerpo.indexOf('noGuardadas > 0');
    const iExito = cuerpo.indexOf('guardadas con éxito');
    const iCierra = cuerpo.indexOf('setPropuestaMesas(null)');
    expect(iFalla).toBeGreaterThan(-1);
    expect(cuerpo.slice(iFalla, iExito)).toMatch(/return;/);
    expect(iFalla).toBeLessThan(iExito);
    expect(iExito).toBeLessThan(iCierra);
    expect(cuerpo).toMatch(/No se guardaron \$\{noGuardadas\}/);
  });
});

describe('2. voz en vivo: la confirmacion llega al servidor', () => {
  it('toda herramienta declara `confirmado` booleano', () => {
    const declaraciones = HERRAMIENTAS_VOZ[0].functionDeclarations as any[];
    expect(declaraciones.length).toBeGreaterThan(0);
    for (const d of declaraciones) {
      expect(d.parameters.properties.confirmado?.type).toBe('BOOLEAN');
    }
  });

  class Sock {
    static ultimo: Sock;
    readyState = 1; onopen: any; onmessage: any; onclose: any; onerror: any;
    constructor(public url: string) { Sock.ultimo = this; }
    send() {}
    close() { this.readyState = 3; }
  }
  class AudioFalso {
    sampleRate = 48000; currentTime = 0; destination = {};
    resume = async () => {}; close = () => {};
    createMediaStreamSource() { return { connect() {} }; }
    createScriptProcessor() { return { connect() {}, disconnect() {}, onaudioprocess: null }; }
  }
  it('el puente manda `confirmado` en el nivel superior del cuerpo', async () => {
    const cuerpos: any[] = [];
    const fetchFn = (async (url: string, op: any) => {
      if (url.endsWith('/accion')) {
        cuerpos.push(JSON.parse(op.body));
        return { ok: true, status: 200, json: async () => ({ success: true }) };
      }
      return { ok: true, status: 200, json: async () => ({ token: 't', model: 'gemini-3.8-live', voz: 'Kore', segundosMaximos: 60, wsUrl: 'wss://x/y?access_token=t' }) };
    }) as any;
    await iniciarVozEnVivo({
      onEstado: () => {}, onError: () => {},
      piezas: { fetchFn, WebSocketCtor: Sock as any, AudioContextCtor: AudioFalso as any, getUserMedia: (async () => ({ getTracks: () => [] })) as any, setTimeoutFn: (() => 1) as any, clearTimeoutFn: (() => {}) as any },
    });
    await Sock.ultimo.onmessage({ data: JSON.stringify({ toolCall: { functionCalls: [
      { id: '1', name: 'agendar_reunion', args: { conQuien: 'Ana', confirmado: true } },
      { id: '2', name: 'agendar_reunion', args: { conQuien: 'Ana' } },
    ] } }) });
    expect(cuerpos[0].confirmado).toBe(true);
    expect(cuerpos[0].argumentos).toEqual({ conQuien: 'Ana' });
    expect(cuerpos[1].confirmado).toBe(false);
  });
});

describe('3. portal del cliente: Hablar no gasta minutos ni dice "conectada" sin audio', () => {
  const src = leer('src/components/portal/AsistenteDelCliente.tsx');
  it('no pide ficha al servidor ni anuncia llamada conectada', () => {
    // Superado por orden 238: ahora la voz conecta de verdad a /api/asistente/voz-en-vivo/cliente
    expect(src).not.toMatch(/Llamada de voz conectada/);
    expect(src).toMatch(/voz-en-vivo\/cliente/);
  });
});

describe('4. fotocabina frontal: los accesorios siguen la cara espejada', () => {
  const cara = (x: number): CaraDetectada => {
    const puntos: any[] = Array.from({ length: 300 }, () => ({ x, y: 400 }));
    puntos[33] = { x: x - 50, y: 400 };
    puntos[263] = { x: x + 50, y: 400 };
    puntos[10] = { x, y: 340 };
    puntos[152] = { x, y: 460 };
    return { puntos };
  };
  it('refleja x y deja el ojo izquierdo a la izquierda', () => {
    const [r] = reflejarCarasEnHorizontal([cara(250)], 1000);
    expect(r.puntos[10].x).toBe(750);
    expect(r.puntos[33].x).toBeLessThan(r.puntos[263].x);
  });
  it('la corona de una cara a la izquierda del video queda a la derecha en la foto espejada', () => {
    const translates: number[] = [];
    const ctx: any = new Proxy({ canvas: { width: 1000, height: 800 }, translate: (x: number) => translates.push(x) }, {
      get: (t: any, k) => (k in t ? t[k] : () => ({ addColorStop() {} })),
      set: () => true,
    });
    dibujarFiltroDeCara(ctx, null as any, 'mis15', reflejarCarasEnHorizontal([cara(250)], 1000));
    expect(translates[0]).toBeCloseTo(750, -1);
  });
  it('la pantalla refleja en las dos tomas cuando la camara es frontal', () => {
    const src = leer('src/app/evento/fotocabina/[fiestaId]/page.tsx');
    const usos = src.match(/facingMode === 'user' \? reflejarCarasEnHorizontal\(carasDetectadasRef\.current, canvas\.width\)/g) || [];
    expect(usos).toHaveLength(2);
    expect(src.match(/dibujarFiltroDeCara\(/g)).toHaveLength(2);
  });
});
