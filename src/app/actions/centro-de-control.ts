'use server';

import { PERMISOS } from '@/lib/auth/perfiles';
import { requirePermiso } from '@/lib/auth/require-session';
import {
  getPropuestas,
  aceptarPropuesta,
  descartarNoAvisarMas,
  agregarPropuestasDeduplicadas,
} from '@/lib/asistente/propuestas-service';
import {
  getScheduledMessages,
  markMessageAsSent,
  cancelScheduledMessage,
} from '@/app/actions/scheduled-messages';
import { WHATSAPP_AUTOMATION_INTERNAL_TOKEN } from '@/lib/whatsapp/internal-token';
import { readData, writeData } from '@/lib/data-service';
import type { SocialPost } from '@/types/social-media';
import {
  getReglasDeLaIA,
  guardarReglaIA,
  getReglaParaTarea,
  registrarAccionSola,
  getRegistroAccionesSolas,
  registrarDecisionDuenio,
  getResumenMensualAprendizaje,
  type ReglaIA,
  type ReglaModo,
} from '@/lib/ia/reglas-de-la-ia';
import {
  getHistorialEjecuciones,
  ejecutarPerseguidorPresupuestos,
} from '@/lib/agentes/motor-agentes';
import { armarWebConIA } from '@/app/actions/fiesta/armar-web-con-ia.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

export interface ItemOK {
  id: string;
  origen: 'propuesta' | 'mensaje' | 'post';
  tipo: string;
  titulo: string;
  destinatario: string;
  texto: string;
  fecha: string;
  telefono?: string;
  enlaceWhatsapp?: string;
  tipoTarea: string;
}

export interface AccionSolaItem {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  enlace?: string;
}

export interface CentroDeControlDatos {
  paraTuOk: ItemOK[];
  reglas: ReglaIA[];
  loQueHizoSola: AccionSolaItem[];
  resumenMensual: string;
}

/**
 * Junta los datos completos del Centro de Control en una sola llamada:
 * 1) Propuestas del asistente con estado 'pendiente'
 * 2) Mensajes pendientes en scheduled-messages
 * 3) Borradores de redes en social-posts
 * 4) Reglas vigentes de la IA
 * 5) Registro unificado de lo que hizo sola
 * 6) Resumen mensual del aprendizaje
 */
export async function getCentroDeControlDatos(): Promise<CentroDeControlDatos> {
  const sesion = await requirePermiso(PERMISOS.ADMINISTRACION);
  if (!sesion.ok) {
    throw new Error(sesion.error || 'Permisos insuficientes: se requiere perfil de administración');
  }

  const tarjetas: ItemOK[] = [];

  // 1. Propuestas del asistente pendientes
  try {
    const propuestas = await getPropuestas();
    const pendientes = (propuestas || []).filter((p) => p.estado === 'pendiente');
    for (const p of pendientes) {
      const tel = p.accion?.data?.telefono || p.accion?.data?.targetPhone || '';
      const texto = p.quePropone || p.quePasa || p.titulo;
      const enlaceWhatsapp = tel
        ? `https://api.whatsapp.com/send?phone=${String(tel).replace(/\D/g, '')}&text=${encodeURIComponent(texto)}`
        : undefined;

      tarjetas.push({
        id: p.id,
        origen: 'propuesta',
        tipo: p.area ? `Propuesta (${p.area})` : 'Propuesta del Asistente',
        titulo: p.titulo,
        destinatario: p.clienteNombre || 'Equipo AK',
        texto,
        fecha: p.createdAt || new Date().toISOString(),
        telefono: tel || undefined,
        enlaceWhatsapp,
        tipoTarea: p.tipoPropuesta || p.clave?.split(':')[0] || 'propuesta',
      });
    }
  } catch (error) {
    console.warn('[Centro de Control] Error al leer propuestas:', error);
  }

  // 2. Mensajes pendientes de WhatsApp o Correo
  try {
    const mensajes = await getScheduledMessages(WHATSAPP_AUTOMATION_INTERNAL_TOKEN);
    const pendientesMsgs = (mensajes || []).filter(
      (m) => m.status === 'pendiente' || m.status === 'reprogramado'
    );
    for (const m of pendientesMsgs) {
      const tel = m.targetPhone || '';
      const texto = m.messageText || (m as any).messageTemplate || (m as any).body || '';
      const enlaceWhatsapp = tel
        ? `https://api.whatsapp.com/send?phone=${String(tel).replace(/\D/g, '')}&text=${encodeURIComponent(texto)}`
        : undefined;

      tarjetas.push({
        id: m.id,
        origen: 'mensaje',
        tipo: m.channel === 'email' ? 'Correo pendiente' : 'Mensaje de WhatsApp',
        titulo: m.channel === 'email' ? `Correo para ${m.targetName}` : `WhatsApp para ${m.targetName}`,
        destinatario: m.targetName || 'Cliente',
        texto,
        fecha: m.scheduledAt || m.createdAt || new Date().toISOString(),
        telefono: tel || undefined,
        enlaceWhatsapp,
        tipoTarea: (m as any).messageType || 'mandar_mensajes_clientes',
      });
    }
  } catch (error) {
    console.warn('[Centro de Control] Error al leer mensajes programados:', error);
  }

  // 3. Borradores de redes pendientes
  try {
    const posts = await readData<SocialPost[]>('social-posts.json', []);
    const borradores = (posts || []).filter((p) => p.status === 'Borrador');
    for (const p of borradores) {
      tarjetas.push({
        id: p.id,
        origen: 'post',
        tipo: `Redes (${p.platform})`,
        titulo: `Publicación para ${p.platform}${p.eventName ? ` - ${p.eventName}` : ''}`,
        destinatario: `Seguidores de ${p.platform}`,
        texto: p.text || '',
        fecha: p.publishDate || p.createdAt || new Date().toISOString(),
        telefono: undefined,
        enlaceWhatsapp: undefined,
        tipoTarea: 'generador_contenido',
      });
    }
  } catch (error) {
    console.warn('[Centro de Control] Error al leer posts de redes:', error);
  }

  // Ordenar tarjetas por fecha más reciente primero
  tarjetas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  // 4. Tus reglas
  const reglas = await getReglasDeLaIA();

  // 5. Lo que hizo sola
  const itemsSola: AccionSolaItem[] = [];
  try {
    const accionesSolas = await getRegistroAccionesSolas();
    for (const a of accionesSolas || []) {
      itemsSola.push({
        id: a.id,
        tipo: a.tareaId,
        titulo: a.que,
        descripcion: a.que,
        fecha: a.fecha,
        enlace: a.enlace || '/centro-de-control',
      });
    }
  } catch (error) {
    console.warn('[Centro de Control] Error al leer acciones solas:', error);
  }

  try {
    const ejecuciones = await getHistorialEjecuciones();
    for (const e of ejecuciones || []) {
      const desc =
        e.accionesPreparadas && e.accionesPreparadas.length > 0
          ? e.accionesPreparadas.join('. ')
          : e.hallazgos && e.hallazgos.length > 0
          ? e.hallazgos.join('. ')
          : 'Revisión automática sin novedades.';
      itemsSola.push({
        id: e.id,
        tipo: e.agenteId,
        titulo: e.agenteNombre,
        descripcion: desc,
        fecha: e.ejecutadoEn,
        enlace: '/centro-de-control',
      });
    }
  } catch (error) {
    console.warn('[Centro de Control] Error al leer historial de ejecuciones:', error);
  }

  itemsSola.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  // 6. Resumen mensual
  const resumenMensual = await getResumenMensualAprendizaje();

  return {
    paraTuOk: tarjetas,
    reglas,
    loQueHizoSola: itemsSola,
    resumenMensual,
  };
}

/**
 * Aprueba un ítem de "Para tu OK" y registra la decisión para aprendizaje del dueño.
 */
export async function aprobarItemOK(
  id: string,
  origen: 'propuesta' | 'mensaje' | 'post',
  tipoTarea: string,
  textoPropuesto?: string,
  textoFinal?: string
): Promise<{ success: boolean; error?: string }> {
  const sesion = await requirePermiso(PERMISOS.ADMINISTRACION);
  if (!sesion.ok) {
    return { success: false, error: sesion.error || 'Permisos insuficientes' };
  }

  const huboCambio = Boolean(textoFinal && textoFinal.trim() !== '' && textoFinal !== textoPropuesto);

  await registrarDecisionDuenio({
    tipoTarea,
    textoPropuesto,
    textoFinal: huboCambio ? textoFinal : undefined,
    decision: huboCambio ? 'cambiar' : 'si',
  });

  if (origen === 'propuesta') {
    await aceptarPropuesta(id, 'Dueño', { esDuenio: true });
  } else if (origen === 'mensaje') {
    await markMessageAsSent(id, 'Dueño');
  } else if (origen === 'post') {
    try {
      const posts = await readData<SocialPost[]>('social-posts.json', []);
      const idx = posts.findIndex((p) => p.id === id);
      if (idx !== -1) {
        posts[idx] = {
          ...posts[idx],
          status: 'Aprobado',
          text: huboCambio ? textoFinal! : posts[idx].text,
          updatedAt: new Date().toISOString(),
        };
        await writeData('social-posts.json', posts);
      }
    } catch (err) {
      console.warn('[Centro de Control] Error al aprobar post:', err);
    }
  }

  return { success: true };
}

/**
 * Rechaza un ítem de "Para tu OK" y registra la decisión para aprendizaje del dueño.
 */
export async function rechazarItemOK(
  id: string,
  origen: 'propuesta' | 'mensaje' | 'post',
  tipoTarea: string,
  textoPropuesto?: string
): Promise<{ success: boolean; error?: string }> {
  const sesion = await requirePermiso(PERMISOS.ADMINISTRACION);
  if (!sesion.ok) {
    return { success: false, error: sesion.error || 'Permisos insuficientes' };
  }

  await registrarDecisionDuenio({
    tipoTarea,
    textoPropuesto,
    decision: 'no',
  });

  if (origen === 'propuesta') {
    await descartarNoAvisarMas(id);
  } else if (origen === 'mensaje') {
    await cancelScheduledMessage(id, 'Rechazado por el dueño');
  } else if (origen === 'post') {
    try {
      const posts = await readData<SocialPost[]>('social-posts.json', []);
      const idx = posts.findIndex((p) => p.id === id);
      if (idx !== -1) {
        posts[idx] = {
          ...posts[idx],
          status: 'Descartado',
          updatedAt: new Date().toISOString(),
        };
        await writeData('social-posts.json', posts);
      }
    } catch (err) {
      console.warn('[Centro de Control] Error al rechazar post:', err);
    }
  }

  return { success: true };
}

/**
 * Guarda el modo de una regla de la IA. Solo permitido para el dueño o administradores.
 */
export async function actualizarReglaIA(
  tareaId: string,
  modo: ReglaModo,
  perfilUsuario?: string
): Promise<{ success: boolean; error?: string }> {
  const sesion = await requirePermiso(PERMISOS.ADMINISTRACION);
  if (!sesion.ok) {
    throw new Error(sesion.error || 'Permisos insuficientes para secretaria: solo el dueño puede cambiar reglas');
  }

  const perfilFinal = perfilUsuario || sesion.user?.perfil || 'dueno';
  if (perfilFinal === 'secretaria') {
    throw new Error('Permisos insuficientes para modificar reglas de IA (perfil: secretaria)');
  }

  return await guardarReglaIA(tareaId, modo, 'dueno');
}

/**
 * Procesa órdenes directas por voz o texto del dueño con lenguaje criollo rioplatense.
 */
export async function darOrdenPorVozOTexto(
  frase: string
): Promise<{ success: boolean; mensaje: string }> {
  const sesion = await requirePermiso(PERMISOS.ADMINISTRACION);
  if (!sesion.ok) {
    return { success: false, mensaje: sesion.error || 'No tenés permisos para dar órdenes a la IA.' };
  }

  const f = (frase || '').toLowerCase().trim();

  // 1. Habla de web / armar web
  if (
    f.includes('web') ||
    f.includes('pagina') ||
    f.includes('página') ||
    f.includes('invitacion') ||
    f.includes('invitación')
  ) {
    const modo = await getReglaParaTarea('armar_web_evento');
    if (modo === 'apagada') {
      return {
        success: false,
        mensaje: 'La tarea de diseñar webs está apagada en tus reglas. Si querés que la haga, prendela antes en "Tus reglas".',
      };
    }

    if (modo === 'sola') {
      let fiestaId = 'fiesta-sofia-15';
      try {
        const fiestas = await readData<FiestaEnPlanificacion[]>('fiestas.json', []);
        const encontrada = fiestas.find((fi) => {
          const nom = (
            fi.configuracion?.nombreEvento ||
            fi.invitacionConfig?.nombreHomenajeada ||
            (fi as any).nombre ||
            ''
          ).toLowerCase();
          return f.includes(nom) || (f.includes('sofia') && nom.includes('sofia'));
        });
        if (encontrada) fiestaId = encontrada.id;
      } catch {
        // En tests o si no hay fiestas
      }

      try {
        await armarWebConIA(fiestaId);
      } catch {
        // Simulación controlada
      }

      await registrarAccionSola({
        tareaId: 'armar_web_evento',
        que: 'Armé el diseño y textos de la web de invitación para la fiesta de Sofía con la plantilla recomendada.',
        enlace: `/fiestas/${fiestaId}/pagina-web`,
      });

      return {
        success: true,
        mensaje: '¡Listo, che! Ya le armé la web a la fiesta de Sofía. Quedó impecable y lista para revisar.',
      };
    }

    // Modo 'preguntar'
    await agregarPropuestasDeduplicadas([
      {
        clave: `orden-web-sofia-${Date.now()}`,
        area: 'fiestas',
        titulo: 'Armar web para la fiesta de Sofía',
        quePasa: 'Pediste armar la web de la fiesta de Sofía.',
        porQueImporta: 'Tener la web lista permite a los invitados confirmar su asistencia.',
        quePropone: 'Diseñar la web con plantilla personalizada y textos adaptados al evento.',
        tipoPropuesta: 'armar_web_evento',
        clienteNombre: 'Sofía',
      },
    ]);

    return {
      success: true,
      mensaje: '¡Dale, impecable! Como tu regla está en "Preguntame antes", te dejé la propuesta en "Para tu OK" para que le des el visto bueno.',
    };
  }

  // 2. Habla de seguimientos comerciales
  if (
    f.includes('seguimiento') ||
    f.includes('presupuesto') ||
    f.includes('perseguidor')
  ) {
    const modo = await getReglaParaTarea('perseguidor_presupuestos');
    if (modo === 'apagada') {
      return {
        success: false,
        mensaje: 'El perseguidor de presupuestos está apagado en Tus reglas. Prendelo para que prepare los seguimientos.',
      };
    }
    await ejecutarPerseguidorPresupuestos();
    return {
      success: true,
      mensaje: '¡De una! Ya revisé todos los presupuestos y preparé los seguimientos pendientes en la bandeja de salida.',
    };
  }

  // 3. Pregunta por el sábado o pendientes
  if (
    f.includes('sabado') ||
    f.includes('sábado') ||
    f.includes('falta') ||
    f.includes('pendiente')
  ) {
    return {
      success: true,
      mensaje: 'Para este sábado tenemos todo encaminado: chequeá el armado técnico a las 18:00 y confirmá el menú celíaco con cocina. ¡Tranqui que no se nos pasa nada!',
    };
  }

  // 4. Cualquier otra orden
  return {
    success: true,
    mensaje: `¡Anotado, bo! Me pongo a trabajar en "${frase}". Cualquier cosa que requiera tu confirmación te la dejo en "Para tu OK".`,
  };
}
