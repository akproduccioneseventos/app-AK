/**
 * @fileOverview Sesión de voz en vivo del Asistente AK (orden 105, bloque 3). Sólo corre en el
 * navegador: pide la ficha temporal al servidor, abre el WebSocket de la API en vivo de Gemini,
 * manda el micrófono (PCM 16 bits, 16 kHz) y reproduce lo que contesta (PCM 16 bits, 24 kHz).
 *
 * - Interrupción: si el dueño habla encima, Google manda `interrupted` y se corta TODO el audio
 *   que estaba en cola en el acto.
 * - Corte duro: a los `segundosMaximos` que reservó el servidor, o al llamar `detener()`, se cierra
 *   el socket, se sueltan las pistas del micrófono y se cierra el AudioContext.
 * - Los errores salen en castellano simple. Nunca un éxito falso.
 *
 * El protocolo sigue la documentación de Google (Live API por WebSocket). No se pudo probar contra
 * Google real desde el contenedor de desarrollo (sin clave): ver docs/YA-RESUELTO.md.
 */

import { direccionDelSocket } from './voz-en-vivo';

export type EstadoVozEnVivo = 'conectando' | 'escuchando' | 'hablando' | 'cerrada';

export interface OpcionesVozEnVivo {
  /** Dirección alternativa para pedir la ficha temporal (por omisión '/api/asistente/voz-en-vivo'). */
  urlFicha?: string;
  /** Cuerpo JSON opcional para el pedido POST de la ficha (ej. { fiestaId }). */
  cuerpoFicha?: any;
  /** Con true, no ejecuta herramientas vía /api/asistente/voz-en-vivo/accion, responde 'no disponible en esta llamada'. */
  sinHerramientas?: boolean;
  /**
   * Identidad cancelable del intento (orden 146). Si se aborta, en cualquier momento —antes de la
   * ficha, con el permiso del micrófono pendiente o con el socket abriendo— todo lo que ya se
   * consiguió se suelta (pistas, socket, audio) y los avisos de este intento dejan de salir.
   */
  senal?: AbortSignal;
  onEstado?: (estado: EstadoVozEnVivo, info?: { segundosMaximos?: number }) => void;
  onTexto?: (texto: string, quien: 'asistente' | 'persona') => void;
  onError?: (mensaje: string) => void;
  /** Para pruebas: piezas del navegador reemplazables. */
  piezas?: {
    fetchFn?: typeof fetch;
    WebSocketCtor?: any;
    AudioContextCtor?: any;
    getUserMedia?: (c: MediaStreamConstraints) => Promise<MediaStream>;
    setTimeoutFn?: typeof setTimeout;
    clearTimeoutFn?: typeof clearTimeout;
  };
}

export interface SesionVozEnVivo {
  detener: () => void;
}

const FRECUENCIA_ENTRADA = 16000;
const FRECUENCIA_SALIDA = 24000;
const MUESTRAS_POR_ENVIO = 1600; // 100 ms a 16 kHz

export function aBase64(bytes: Uint8Array): string {
  let binario = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binario += String.fromCharCode(...Array.from(bytes.subarray(i, i + 0x8000)));
  }
  return btoa(binario);
}

export function deBase64(b64: string): Uint8Array {
  const binario = atob(b64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

/** Baja de la frecuencia del micrófono (44,1 o 48 kHz) a 16 kHz promediando, y pasa a 16 bits. */
export function aPcm16Mono(entrada: Float32Array, frecuenciaOrigen: number): Int16Array {
  const razon = frecuenciaOrigen / FRECUENCIA_ENTRADA;
  const largo = Math.floor(entrada.length / razon);
  const salida = new Int16Array(largo);
  for (let i = 0; i < largo; i++) {
    const desde = Math.floor(i * razon);
    const hasta = Math.min(entrada.length, Math.max(desde + 1, Math.floor((i + 1) * razon)));
    let suma = 0;
    for (let j = desde; j < hasta; j++) suma += entrada[j];
    const v = Math.max(-1, Math.min(1, suma / (hasta - desde)));
    salida[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
  }
  return salida;
}

export function pcm16AFloat32(bytes: Uint8Array): Float32Array {
  const muestras = Math.floor(bytes.length / 2);
  const vista = new DataView(bytes.buffer, bytes.byteOffset, muestras * 2);
  const salida = new Float32Array(muestras);
  for (let i = 0; i < muestras; i++) salida[i] = vista.getInt16(i * 2, true) / 0x8000;
  return salida;
}

export function mensajeDeErrorDeMicrofono(error: any): string {
  const nombre = String(error?.name || '');
  if (nombre === 'NotAllowedError' || nombre === 'SecurityError') {
    return 'No se pudo acceder al micrófono. Revisá los permisos del navegador.';
  }
  if (nombre === 'NotFoundError') return 'No se detectó ningún micrófono conectado.';
  return 'No se pudo iniciar el micrófono.';
}

/** Códigos de cierre del socket de Google → frase en criollo. */
export function mensajeDeCierre(codigo: number, motivo: string): string {
  const texto = (motivo || '').toLowerCase();
  if (/quota|resource_exhausted|exhaust|rate limit/.test(texto)) return 'Google no dio más voz gratis por hoy.';
  if (codigo === 1008) return 'Google rechazó la conversación. Probá de nuevo en un rato.';
  return 'Se cortó la conexión con la voz en vivo.';
}

export async function iniciarVozEnVivo(opciones: OpcionesVozEnVivo = {}): Promise<SesionVozEnVivo> {
  const p = opciones.piezas || {};
  const fetchFn = p.fetchFn || fetch;
  const WS = p.WebSocketCtor || (typeof WebSocket !== 'undefined' ? WebSocket : undefined);
  const Contexto = p.AudioContextCtor || (typeof window !== 'undefined' ? (window as any).AudioContext || (window as any).webkitAudioContext : undefined);
  const pedirMicrofono = p.getUserMedia || ((c: MediaStreamConstraints) => navigator.mediaDevices.getUserMedia(c));
  const poner = p.setTimeoutFn || setTimeout;
  const sacar = p.clearTimeoutFn || clearTimeout;

  let cerrada = false;
  let ws: any = null;
  let contexto: any = null;
  let microfono: MediaStream | null = null;
  let nodoCaptura: any = null;
  let temporizador: any = null;
  const enCola = new Set<any>();
  let proximoInstante = 0;
  let pendiente: number[] = [];

  const senal = opciones.senal;
  const abortada = () => !!senal?.aborted;
  const nada = (): SesionVozEnVivo => ({ detener: () => {} });
  // Un intento abortado no avisa nada: ya no le importa a nadie.
  const estado = (e: EstadoVozEnVivo, info?: { segundosMaximos?: number }) => {
    if (abortada()) return;
    opciones.onEstado?.(e, info);
  };
  const aviso = (mensaje: string) => { if (!abortada()) opciones.onError?.(mensaje); };

  const cortarAudioEnCola = () => {
    for (const fuente of Array.from(enCola)) {
      try { fuente.onended = null; fuente.stop(); } catch {}
    }
    enCola.clear();
    proximoInstante = 0;
  };

  const cerrarTodo = () => {
    if (cerrada) return;
    cerrada = true;
    if (temporizador) sacar(temporizador);
    cortarAudioEnCola();
    try { nodoCaptura?.disconnect?.(); } catch {}
    try { if (nodoCaptura) nodoCaptura.onaudioprocess = null; } catch {}
    try { if (nodoCaptura?.port) nodoCaptura.port.onmessage = null; } catch {}
    try { microfono?.getTracks().forEach((t) => t.stop()); } catch {}
    try { ws?.close(); } catch {}
    try { contexto?.close?.(); } catch {}
    estado('cerrada');
  };

  const fallar = (mensaje: string) => {
    if (cerrada) return;
    aviso(mensaje);
    cerrarTodo();
  };

  if (abortada()) return nada();
  estado('conectando');

  if (!WS || !Contexto || (!p.getUserMedia && (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia))) {
    aviso('Este navegador no permite hablar en vivo. Probá con Chrome o Safari actualizado.');
    estado('cerrada');
    return nada();
  }

  // 1) La ficha temporal, del servidor.
  let datos: any;
  let wsUrl: string | undefined;
  try {
    const url = opciones.urlFicha || '/api/asistente/voz-en-vivo';
    const fetchInit: RequestInit = { method: 'POST', signal: senal };
    if (opciones.cuerpoFicha) {
      fetchInit.headers = { 'Content-Type': 'application/json' };
      fetchInit.body = JSON.stringify(opciones.cuerpoFicha);
    }
    const r = await fetchFn(url, fetchInit);
    datos = await r.json().catch(() => ({}));
    // Cortaron mientras esperaba la ficha: se descarta sin pedir micrófono ni abrir socket.
    if (abortada()) return nada();
    wsUrl = datos?.wsUrl || (datos?.token ? direccionDelSocket(datos.token) : undefined);
    if (!r.ok || !wsUrl) {
      aviso(datos?.error || 'No se pudo iniciar la voz en vivo.');
      estado('cerrada');
      return nada();
    }
  } catch {
    if (abortada()) return nada();
    aviso('No se pudo conectar con el servidor para hablar en vivo.');
    estado('cerrada');
    return nada();
  }

  const sesion: SesionVozEnVivo = { detener: cerrarTodo };

  // 2) Micrófono (dentro del toque del usuario, antes de abrir el socket).
  try {
    microfono = await pedirMicrofono({ audio: { echoCancellation: true, noiseSuppression: true } as any });
  } catch (error) {
    if (abortada()) return nada();
    aviso(mensajeDeErrorDeMicrofono(error));
    estado('cerrada');
    return nada();
  }
  // El permiso llegó tarde para un intento cortado: se sueltan las pistas en el acto.
  if (cerrada || abortada()) { try { microfono?.getTracks().forEach((t) => t.stop()); } catch {} return nada(); }

  contexto = new Contexto();
  try { await contexto.resume?.(); } catch {}
  if (cerrada || abortada()) { cerrarTodo(); return nada(); }

  // 3) El socket. Desde acá, abortar cierra todo lo abierto.
  senal?.addEventListener('abort', cerrarTodo, { once: true });
  try {
    ws = new WS(wsUrl);
  } catch {
    fallar('No se pudo abrir la conexión de voz en vivo.');
    return sesion;
  }

  // Corte duro al tiempo que el servidor reservó.
  const segundosMaximos = Number(datos.segundosMaximos) || 600;
  temporizador = poner(() => {
    opciones.onTexto?.('Se cumplió el tiempo de esta conversación.', 'asistente');
    cerrarTodo();
  }, segundosMaximos * 1000);

  const enviarAudio = (muestras: Int16Array) => {
    if (cerrada || !ws || ws.readyState !== 1) return;
    ws.send(JSON.stringify({
      realtimeInput: { audio: { data: aBase64(new Uint8Array(muestras.buffer, muestras.byteOffset, muestras.byteLength)), mimeType: `audio/pcm;rate=${FRECUENCIA_ENTRADA}` } },
    }));
  };

  const recibirDelMicrofono = (bloque: Float32Array) => {
    const pcm = aPcm16Mono(bloque, contexto.sampleRate || 48000);
    for (let i = 0; i < pcm.length; i++) pendiente.push(pcm[i]);
    while (pendiente.length >= MUESTRAS_POR_ENVIO) {
      enviarAudio(Int16Array.from(pendiente.splice(0, MUESTRAS_POR_ENVIO)));
    }
  };

  const empezarCaptura = async () => {
    const fuente = contexto.createMediaStreamSource(microfono);
    if (contexto.audioWorklet?.addModule && typeof Blob !== 'undefined' && typeof URL !== 'undefined' && typeof (globalThis as any).AudioWorkletNode !== 'undefined') {
      try {
        const codigo = `class Captura extends AudioWorkletProcessor{process(i){const c=i[0]&&i[0][0];if(c)this.port.postMessage(c.slice(0));return true}}registerProcessor('ak-captura',Captura)`;
        const url = URL.createObjectURL(new Blob([codigo], { type: 'application/javascript' }));
        await contexto.audioWorklet.addModule(url);
        URL.revokeObjectURL(url);
        nodoCaptura = new (globalThis as any).AudioWorkletNode(contexto, 'ak-captura');
        nodoCaptura.port.onmessage = (e: MessageEvent) => recibirDelMicrofono(e.data as Float32Array);
        fuente.connect(nodoCaptura);
        return;
      } catch {
        // Cae al método viejo, que anda en todos los navegadores.
      }
    }
    nodoCaptura = contexto.createScriptProcessor(4096, 1, 1);
    nodoCaptura.onaudioprocess = (e: any) => recibirDelMicrofono(new Float32Array(e.inputBuffer.getChannelData(0)));
    fuente.connect(nodoCaptura);
    nodoCaptura.connect(contexto.destination);
  };

  const reproducir = (b64: string) => {
    const muestras = pcm16AFloat32(deBase64(b64));
    if (!muestras.length || cerrada) return;
    const buffer = contexto.createBuffer(1, muestras.length, FRECUENCIA_SALIDA);
    buffer.getChannelData(0).set(muestras);
    const fuente = contexto.createBufferSource();
    fuente.buffer = buffer;
    fuente.connect(contexto.destination);
    const inicio = Math.max(contexto.currentTime, proximoInstante);
    fuente.start(inicio);
    proximoInstante = inicio + buffer.duration;
    enCola.add(fuente);
    fuente.onended = () => {
      enCola.delete(fuente);
      if (!cerrada && enCola.size === 0) estado('escuchando');
    };
    estado('hablando');
  };

  ws.onopen = () => {
    try {
      ws.send(JSON.stringify({
        setup: {
          model: `models/${datos.model}`,
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: datos.voz } } },
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
      }));
    } catch {
      fallar('No se pudo abrir la conversación de voz en vivo.');
    }
  };

  ws.onmessage = async (evento: any) => {
    if (cerrada) return;
    let mensaje: any;
    try {
      const crudo = typeof evento.data === 'string' ? evento.data : await new Response(evento.data).text();
      mensaje = JSON.parse(crudo);
    } catch {
      return;
    }
    if (mensaje.setupComplete) {
      try {
        await empezarCaptura();
      } catch {
        fallar('No se pudo iniciar el micrófono.');
        return;
      }
      if (cerrada) return;
      estado('escuchando', { segundosMaximos });
      return;
    }
    const toolCall = mensaje.toolCall || (mensaje.serverContent?.modelTurn?.parts?.find((p: any) => p.functionCall)?.functionCall ? { functionCalls: mensaje.serverContent.modelTurn.parts.filter((p: any) => p.functionCall).map((p: any) => p.functionCall) } : null);
    if (toolCall) {
      if (opciones.sinHerramientas) {
        const calls = toolCall.functionCalls || [];
        const functionResponses = calls.map((fc: any) => ({
          id: fc.id,
          name: fc.name,
          response: { output: 'no disponible en esta llamada' },
        }));
        if (!cerrada && ws && ws.readyState === 1) {
          ws.send(JSON.stringify({ toolResponse: { functionResponses } }));
        }
        return;
      }
      const calls = toolCall.functionCalls || [];
      const functionResponses: any[] = [];
      for (const fc of calls) {
        try {
          const { confirmado: _confirmado, ...argumentosSinConfirmado } = (fc.args || {}) as Record<string, unknown>;
          const r = await fetchFn('/api/asistente/voz-en-vivo/accion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: fc.id, accion: fc.name, argumentos: argumentosSinConfirmado, confirmado: fc.args?.confirmado === true }),
            signal: senal,
          });
          const respuesta = await r.json().catch(() => ({}));
          functionResponses.push({ id: fc.id, name: fc.name, response: { output: respuesta } });
          if (respuesta?.mensaje) {
            opciones.onTexto?.(respuesta.mensaje, 'asistente');
          }
        } catch {
          functionResponses.push({ id: fc.id, name: fc.name, response: { output: { error: 'No se pudo procesar la acción' } } });
        }
      }
      if (!cerrada && ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ toolResponse: { functionResponses } }));
      }
      return;
    }
    const contenido = mensaje.serverContent;
    if (!contenido) return;
    if (contenido.interrupted) {
      cortarAudioEnCola();
      estado('escuchando');
    }
    for (const parte of contenido.modelTurn?.parts || []) {
      if (parte.inlineData?.data) reproducir(parte.inlineData.data);
    }
    if (contenido.outputTranscription?.text) opciones.onTexto?.(contenido.outputTranscription.text, 'asistente');
    if (contenido.inputTranscription?.text) opciones.onTexto?.(contenido.inputTranscription.text, 'persona');
  };

  ws.onerror = () => fallar('Se cortó la conexión con la voz en vivo.');
  ws.onclose = (evento: any) => {
    if (cerrada) return;
    fallar(mensajeDeCierre(Number(evento?.code) || 0, String(evento?.reason || '')));
  };

  return sesion;
}

