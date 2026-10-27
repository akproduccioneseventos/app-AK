
export const HERRAMIENTAS_VOZ = [
  {
    functionDeclarations: [
      {
        name: 'crear_tarea',
        description: 'Crea una tarea pendiente para el equipo o la persona.',
        parameters: {
          type: 'OBJECT',
          properties: {
            confirmado: { type: 'BOOLEAN', description: 'Poné true sólo cuando la persona ya te dijo que sí a que hagas esta acción' },
            titulo: { type: 'STRING', description: 'Título o descripción de la tarea' },
            paraQuien: { type: 'STRING', description: 'Nombre o rol a quien se le asigna la tarea' },
          },
          required: ['titulo'],
        },
      },
      {
        name: 'anotar_recordatorio',
        description: 'Anota un recordatorio con fecha u hora para no olvidar algo importante.',
        parameters: {
          type: 'OBJECT',
          properties: {
            confirmado: { type: 'BOOLEAN', description: 'Poné true sólo cuando la persona ya te dijo que sí a que hagas esta acción' },
            recordatorio: { type: 'STRING', description: 'Texto del recordatorio' },
            fechaHora: { type: 'STRING', description: 'Cuándo recordar' },
          },
          required: ['recordatorio'],
        },
      },
      {
        name: 'agendar_reunion',
        description: 'Agenda una reunión con un cliente o proveedor.',
        parameters: {
          type: 'OBJECT',
          properties: {
            confirmado: { type: 'BOOLEAN', description: 'Poné true sólo cuando la persona ya te dijo que sí a que hagas esta acción' },
            conQuien: { type: 'STRING', description: 'Con quién es la reunión' },
            fechaHora: { type: 'STRING', description: 'Fecha y hora propuesta' },
            motivo: { type: 'STRING', description: 'Motivo de la reunión' },
          },
          required: ['conQuien'],
        },
      },
      {
        name: 'ver_mi_semana',
        description: 'Consulta los eventos y compromisos de los próximos días.',
        parameters: {
          type: 'OBJECT',
          properties: {
            confirmado: { type: 'BOOLEAN', description: 'Poné true sólo cuando la persona ya te dijo que sí a que hagas esta acción' },
          },
        },
      },
      {
        name: 'cuanto_me_deben',
        description: 'Consulta los saldos y cobros pendientes (sólo para contabilidad o dueño).',
        parameters: {
          type: 'OBJECT',
          properties: {
            confirmado: { type: 'BOOLEAN', description: 'Poné true sólo cuando la persona ya te dijo que sí a que hagas esta acción' },
          },
        },
      },
      {
        name: 'que_falta_de_la_fiesta',
        description: 'Consulta los pendientes importantes y preparación de una fiesta por nombre o agasajado.',
        parameters: {
          type: 'OBJECT',
          properties: {
            confirmado: { type: 'BOOLEAN', description: 'Poné true sólo cuando la persona ya te dijo que sí a que hagas esta acción' },
            nombreFiesta: { type: 'STRING', description: 'Nombre del agasajado o del evento' },
          },
          required: ['nombreFiesta'],
        },
      },
      {
        name: 'preparar_borrador_whatsapp',
        description: 'Prepara un borrador de mensaje de WhatsApp para que una persona lo revise y envíe con un toque.',
        parameters: {
          type: 'OBJECT',
          properties: {
            confirmado: { type: 'BOOLEAN', description: 'Poné true sólo cuando la persona ya te dijo que sí a que hagas esta acción' },
            destinatario: { type: 'STRING', description: 'Nombre o teléfono del destinatario' },
            mensaje: { type: 'STRING', description: 'Texto sugerido del mensaje' },
          },
          required: ['destinatario', 'mensaje'],
        },
      },
      {
        name: 'preparar_mail',
        description: 'Prepara un borrador de correo electrónico.',
        parameters: {
          type: 'OBJECT',
          properties: {
            confirmado: { type: 'BOOLEAN', description: 'Poné true sólo cuando la persona ya te dijo que sí a que hagas esta acción' },
            destinatario: { type: 'STRING', description: 'Correo del destinatario' },
            asunto: { type: 'STRING', description: 'Asunto del mail' },
            cuerpo: { type: 'STRING', description: 'Contenido del mail' },
          },
          required: ['destinatario', 'asunto'],
        },
      },
    ],
  },
];

import { calculateFiestaPreparationScore } from '@/lib/fiesta/preparation-score';
import { puede, PERMISOS } from '@/lib/auth/perfiles';
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
 * Endpoint: se usa `v1beta`, que es la versión que hoy documenta Google para las fichas temporales
 * y para el socket en vivo (orden 146). Se cambia con la variable GEMINI_LIVE_API_VERSION sin tocar
 * código. La ficha y el socket SIEMPRE salen de la misma versión: la ruta la lee una sola vez
 * (`versionApiEnVivo()`) y se la pasa a las dos direcciones.
 */
import { VOCES_IA_DISPONIBLES, VOZ_POR_OMISION } from '@/lib/asistente/voz-gemini';

export const VOZ_EN_VIVO_USO_FILE = 'asistente/voz-en-vivo-uso.json';
/** Lo máximo que se reserva por conversación; la sesión corta sola al llegar. */
export const MINUTOS_POR_SESION = 10;
export const MINUTOS_POR_DIA_POR_OMISION = 10;
/** Referencia de precio de Google, para el texto de Ajustes (no se cobra desde la app). */
export const PRECIO_REFERENCIA_POR_MINUTO_USD = 0.023;

export const MODELOS_EN_VIVO_POR_OMISION = 'gemini-3.8-live,gemini-2.5-flash-native-audio-preview-12-2025';
export const VERSION_API_EN_VIVO_POR_OMISION = 'v1beta';

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
        tools: HERRAMIENTAS_VOZ,
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
    'Cuando te piden algo, usá la herramienta. Si la herramienta dice que hay que confirmar, preguntá "¿lo hago?" y sólo con un sí claro volvé a llamarla confirmada.',
    'Fuera de las herramientas no cambies, cobres, mandes ni borres nada: decí que lo dejás listo en el chat y que la persona lo confirma ahí.',
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


export interface ContextoVozDatos {
  fiestas?: any[];
  briefing?: any;
  prospectos?: any[];
  agenda?: any[];
}

export function contextoDeVozParaPerfil(
  usuario: { role?: string; roles?: string[]; permissions?: string[] },
  datos: ContextoVozDatos = {}
): string {
  const puedeContabilidad = puede(usuario, PERMISOS.CONTABILIDAD);
  const puedeOrganizacion = puede(usuario, PERMISOS.ORGANIZACION);
  const puedeCrm = puede(usuario, PERMISOS.CRM);

  const lineas: string[] = [];

  // 1. Saludo inicial según perfil
  if (puedeContabilidad && datos.briefing?.items?.length) {
    const primerCobro = datos.briefing.items[0];
    lineas.push(`¡Hola! Tenés cobros pendientes para revisar hoy: ${primerCobro.title || primerCobro.detail}.`);
  } else if (puedeOrganizacion && datos.fiestas?.length) {
    const proxima = datos.fiestas[0];
    const prep = calculateFiestaPreparationScore(proxima);
    const primerItem = prep.importantPending?.[0];
    const primerPendiente = typeof primerItem === 'string' ? primerItem : primerItem?.label || (primerItem as any)?.title || 'revisar cronograma';
    const nombre = proxima.configuracion?.nombreEvento || proxima.configuracion?.clienteNombre || 'próxima fiesta';
    lineas.push(`¡Hola! A la fiesta de ${nombre} le falta: ${primerPendiente}.`);
  } else {
    lineas.push('¡Hola! Soy tu asistente de AK Producciones. ¿En qué te puedo ayudar hoy?');
  }

  // 2. Todos: Fiestas de los próximos 30 días y agenda
  lineas.push('\n--- FIESTAS DE LOS PRÓXIMOS 30 DÍAS ---');
  if (datos.fiestas && datos.fiestas.length > 0) {
    for (const f of datos.fiestas.slice(0, 10)) {
      const nombre = f.configuracion?.nombreEvento || f.configuracion?.clienteNombre || f.nombre || 'Fiesta';
      const fecha = f.configuracion?.fechaEvento || f.fecha || '';
      lineas.push(`- ${nombre} (${fecha})`);
      if (puedeOrganizacion) {
        const prep = calculateFiestaPreparationScore(f);
        const top3 = (prep.importantPending || []).slice(0, 3).map((c: any) => typeof c === 'string' ? c : c.label || c.title || 'pendiente');
        if (top3.length > 0) {
          lineas.push(`  Pendientes importantes: ${top3.join(', ')}`);
        }
      }
    }
  } else {
    lineas.push('No hay fiestas registradas en los próximos 30 días.');
  }

  // 3. Contabilidad: saldos y cuotas vencidas (SOLO si puede CONTABILIDAD)
  if (puedeContabilidad) {
    lineas.push('\n--- COBROS Y SALDOS PENDIENTES ---');
    if (datos.briefing?.items && datos.briefing.items.length > 0) {
      for (const item of datos.briefing.items.slice(0, 8)) {
        lineas.push(`- ${item.title || ''}: ${item.detail || ''}`);
      }
    } else {
      lineas.push('No hay cobros pendientes urgentes.');
    }
  }

  // 4. CRM: prospectos para seguir hoy
  if (puedeCrm) {
    lineas.push('\n--- PROSPECTOS PARA SEGUIMIENTO HOY ---');
    if (datos.prospectos && datos.prospectos.length > 0) {
      for (const p of datos.prospectos.slice(0, 8)) {
        lineas.push(`- ${p.nombre || p.name}: ${p.tipoFiesta || p.partyType || 'Consulta'} (${p.telefono || p.phone || 'Sin tel'})`);
      }
    } else {
      lineas.push('No hay prospectos pendientes para hoy.');
    }
  }

  const textoFinal = lineas.join('\n').slice(0, LIMITE_CONTEXTO);

  // Candado estricto: si NO puede contabilidad, JAMÁS puede haber $, saldo, seña o cuota en el texto final
  if (!puedeContabilidad) {
    return textoFinal
      .replace(/\$/g, '')
      .replace(/\bsaldo(s)?\b/gi, 'estado')
      .replace(/\bseña(s)?\b/gi, 'reserva')
      .replace(/\bcuota(s)?\b/gi, 'pago');
  }

  return textoFinal;
}
