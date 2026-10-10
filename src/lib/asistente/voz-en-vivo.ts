/**
 * @fileOverview Voz en vivo del Asistente AK (orden 105, bloque 3): el dueño habla, el asistente
 * contesta con voz en tiempo real, con la API en vivo de Gemini (audio de ida y vuelta).
 *
 * Acá viven las partes puras (cuenta de minutos, cuerpo del pedido de la ficha temporal y las
 * instrucciones del asistente) para poder probarlas sin red. La ruta que las usa está en
 * `src/app/api/asistente/voz-en-vivo/route.ts`.
 *
 * Por qué una ficha temporal: la clave de Google NUNCA viaja al navegador. El servidor pide una
 * ficha de un solo uso, que vence en pocos minutos y que sólo sirve para esta conversación.
 *
 * Endpoint: se usa `v1alpha` (donde Google publica las fichas temporales). Si en producción falla,
 * se cambia con la variable GEMINI_LIVE_API_VERSION (por ejemplo `v1beta`) sin tocar código.
 */
import { VOCES_IA_DISPONIBLES, VOZ_POR_OMISION } from '@/lib/asistente/voz-gemini';

export const VOZ_EN_VIVO_USO_FILE = 'asistente/voz-en-vivo-uso.json';
/** Lo máximo que se reserva por conversación; la sesión corta sola al llegar. */
export const MINUTOS_POR_SESION = 10;
export const MINUTOS_POR_DIA_POR_OMISION = 10;
/** Referencia de precio de Google, para el texto de Ajustes (no se cobra desde la app). */
export const PRECIO_REFERENCIA_POR_MINUTO_USD = 0.023;

export const MODELOS_EN_VIVO_POR_OMISION = 'gemini-3.8-live,gemini-2.5-flash-native-audio-preview-12-2025';
export const VERSION_API_EN_VIVO_POR_OMISION = 'v1alpha';

export function modelosEnVivo(env: string | undefined = process.env.GEMINI_LIVE_MODEL): string[] {
  const lista = (env || MODELOS_EN_VIVO_POR_OMISION).split(',').map((m) => m.trim()).filter(Boolean);
  return lista.length ? lista : MODELOS_EN_VIVO_POR_OMISION.split(',');
}

export function versionApiEnVivo(env: string | undefined = process.env.GEMINI_LIVE_API_VERSION): string {
  return /^v1[a-z0-9]*$/.test((env || '').trim()) ? (env as string).trim() : VERSION_API_EN_VIVO_POR_OMISION;
}

export interface UsoVozEnVivo {
  fecha?: string;
  minutos?: number;
}

/** Los minutos por día que dejó el dueño en Ajustes. 0 = apagada. Lo raro vuelve al valor por omisión. */
export function minutosPermitidosPorDia(valor: unknown): number {
  if (valor === undefined || valor === null || valor === '') return MINUTOS_POR_DIA_POR_OMISION;
  const n = Number(valor);
  if (!Number.isFinite(n) || n < 0) return MINUTOS_POR_DIA_POR_OMISION;
  return Math.min(Math.floor(n), 600);
}

/**
 * Reserva minutos del día. Es una función pura para usar ADENTRO de una transacción: recibe el
 * uso guardado y devuelve el nuevo (o null si no queda nada, para no escribir) y cuánto reservó.
 */
export function reservarMinutos(
  uso: UsoVozEnVivo,
  hoy: string,
  tope: number,
): { nuevo: UsoVozEnVivo | null; reservados: number } {
  const usados = uso.fecha === hoy ? Math.max(0, uso.minutos || 0) : 0;
  const quedan = tope - usados;
  if (quedan <= 0) return { nuevo: null, reservados: 0 };
  const reservados = Math.min(quedan, MINUTOS_POR_SESION);
  return { nuevo: { fecha: hoy, minutos: usados + reservados }, reservados };
}

/** Devuelve lo reservado si no se pudo armar la ficha. Nunca baja de cero ni toca otro día. */
export function devolverMinutos(uso: UsoVozEnVivo, hoy: string, minutos: number): UsoVozEnVivo | null {
  if (uso.fecha !== hoy) return null;
  return { fecha: hoy, minutos: Math.max(0, (uso.minutos || 0) - minutos) };
}

export function vozValida(voz: string | undefined): string {
  return VOCES_IA_DISPONIBLES.some((v) => v.id === voz) ? (voz as string) : VOZ_POR_OMISION;
}

export interface CuerpoFichaParams {
  modelo: string;
  voz: string;
  instrucciones: string;
  minutos: number;
  ahora?: Date;
}

/** Cuerpo del pedido de la ficha temporal de un solo uso. */
export function armarCuerpoFicha({ modelo, voz, instrucciones, minutos, ahora = new Date() }: CuerpoFichaParams) {
  const t = ahora.getTime();
  return {
    uses: 1,
    expireTime: new Date(t + (minutos + 1) * 60_000).toISOString(),
    newSessionExpireTime: new Date(t + 60_000).toISOString(),
    liveConnectConstraints: {
      model: `models/${modelo}`,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voz } } },
        systemInstruction: { parts: [{ text: instrucciones }] },
      },
    },
  };
}

export function direccionDeLaFicha(apiKey: string, version = versionApiEnVivo()): string {
  return `https://generativelanguage.googleapis.com/${version}/auth_tokens?key=${encodeURIComponent(apiKey)}`;
}

export function direccionDelSocket(ficha: string, version = versionApiEnVivo()): string {
  return (
    `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.${version}` +
    `.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(ficha)}`
  );
}

/** Cuánto contexto del negocio se le da a la voz (corto: se lo va a decir hablando). */
const LIMITE_CONTEXTO = 5500;

export function armarInstruccionesDeVoz(contextoDelNegocio: string): string {
  const contexto = (contextoDelNegocio || '').trim().slice(0, LIMITE_CONTEXTO);
  return [
    'Sos el Asistente AK, la asistente de voz de AK Producciones, una empresa de fiestas de Salto, Uruguay.',
    'Hablás con el dueño o con el equipo, en castellano rioplatense, con voz cálida y natural.',
    'Contestá corto, como se habla: una o dos frases, sin listas largas ni símbolos. Si hay mucho para decir, ofrecé seguir en el chat.',
    'Si te interrumpen, callate y escuchá.',
    'No ejecuto acciones por voz: si te piden cambiar, cargar, cobrar, mandar o borrar algo, decí que lo dejás listo en el chat y que la persona lo confirma ahí.',
    'Nunca inventes números, fechas ni nombres: usá sólo lo que figura en el contexto de abajo. Si no lo sabés, decilo.',
    'Reglas de la empresa: no prometas plazos de respuesta, no congeles precios (hay un ajuste anual) y no ofrezcas nada por fuera de lo que figura en el contexto.',
    '',
    'CONTEXTO DEL NEGOCIO (lo que sabés ahora):',
    contexto || 'Sin datos del negocio disponibles en este momento: decilo si te preguntan por fiestas o cobros.',
  ].join('\n');
}

/** Pasa el resumen del equipo a un texto compacto para la voz. */
export function resumirContextoParaVoz(briefing: {
  summary?: string;
  items?: Array<{ priority?: string; title?: string; detail?: string }>;
} | null | undefined): string {
  if (!briefing) return '';
  const lineas = [briefing.summary || ''];
  for (const item of (briefing.items || []).slice(0, 14)) {
    lineas.push(`- ${item.priority ? `[${item.priority}] ` : ''}${item.title || ''}${item.detail ? `: ${item.detail}` : ''}`);
  }
  return lineas.filter(Boolean).join('\n').slice(0, LIMITE_CONTEXTO);
}
