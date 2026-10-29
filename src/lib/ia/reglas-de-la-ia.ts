import fs from 'fs';
import path from 'path';
import { readDataConDetalle, writeData } from '@/lib/data-service';

export type ReglaModo = 'sola' | 'preguntar' | 'apagada';

export interface AccionSolaRegistro {
  id: string;
  tareaId: string;
  que: string;
  enlace?: string;
  fecha: string;
}

export interface DecisionDuenio {
  id?: string;
  tipoTarea: string;
  textoPropuesto?: string;
  textoFinal?: string;
  decision: 'si' | 'no' | 'cambiar';
  fecha?: string;
  detalles?: any;
}

export interface ReglaIA {
  id: string;
  nombre: string;
  descripcion: string;
  modo: ReglaModo;
  prohibidaSola?: boolean;
  categoria?: string;
}

const ARCHIVO_REGLAS = 'reglas-de-la-ia.json';
const ARCHIVO_REGISTRO = 'ia-registro.json';
const ARCHIVO_APRENDIZAJE = 'ia-aprendizaje.json';
const MAX_REGISTRO = 100;
const MAX_APRENDIZAJE = 300;

async function leerJson<T>(filename: string, fallback: T): Promise<T> {
  // La base manda (con varios servidores, apagar una tarea tiene que valer en todos).
  // La copia local es sólo respaldo si la base no está o no tiene el dato.
  if (!(process.env.NODE_ENV === 'test' && !process.env.FIRESTORE_EMULATOR_HOST)) {
    try {
      const { valor, huboFalla } = await readDataConDetalle<T | null>(filename, null);
      if (!huboFalla && valor !== null && valor !== undefined) return valor as T;
    } catch {
      // Sin base: cae a la copia local
    }
  }

  const localPath = path.join(process.cwd(), 'data', filename);
  try {
    if (fs.existsSync(localPath)) {
      const raw = fs.readFileSync(localPath, 'utf8');
      return JSON.parse(raw) as T;
    }
  } catch {
    // Si falla lectura local, continuar
  }
  return fallback;
}

/**
 * Guarda en la base (que es la que manda con varios servidores) y recién después deja la copia
 * local de respaldo. Si la base rechaza el guardado, TIRA el error: un archivo temporal local
 * no es un guardado durable, y quien llama no puede anunciar "guardado" ni dejar la copia local
 * mostrando algo que las otras instancias no ven.
 */
async function guardarJson<T>(filename: string, data: T): Promise<void> {
  const sinBaseRemota =
    (process.env.NODE_ENV === 'test' && !process.env.FIRESTORE_EMULATOR_HOST) ||
    process.env.AK_USE_LOCAL_JSON_ONLY === 'true';

  if (!sinBaseRemota) {
    await writeData(filename, data, undefined, { skipAutoBackup: true });
  }

  const localPath = path.join(process.cwd(), 'data', filename);
  try {
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(localPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    if (sinBaseRemota) throw err;
    console.warn(`[Reglas IA] Error al escribir ${filename} localmente:`, err);
  }
}

export const TAREAS_PROHIBIDAS_SOLA = [
  'mandar_mensajes_clientes',
  'mandar-mensajes-clientes',
  'mandar_mensajes',
  'cobrar_marcar_pagado',
  'cobrar-marcar-pagado',
  'cerrar_presupuesto',
  'cerrar-presupuesto',
  'tocar_permisos',
  'tocar-permisos',
  'gastar_publicidad',
  'gastar-publicidad',
  'publicidad',
  'vigilante_publicidad',
];

export function esTareaProhibidaSola(tareaId: string): boolean {
  if (!tareaId) return false;
  const normalizado = tareaId.toLowerCase().replace(/[_-]/g, '');
  return TAREAS_PROHIBIDAS_SOLA.some((t) => t.toLowerCase().replace(/[_-]/g, '') === normalizado);
}

export const TAREAS_SISTEMA: ReglaIA[] = [
  {
    id: 'resumen_de_la_manana',
    nombre: 'Resumen de la mañana',
    descripcion: 'Envía al dueño un resumen diario de hasta cinco líneas por WhatsApp o aviso en la app',
    modo: 'sola',
    categoria: 'Monitoreo',
  },
  {
    id: 'vigilante_publicidad',
    nombre: 'Vigilante de Publicidad (Meta Ads)',
    descripcion: 'Monitorea el gasto y rendimiento en anuncios de Meta Ads sin pausar ni gastar solo',
    modo: 'preguntar',
    prohibidaSola: true,
    categoria: 'Publicidad',
  },
  {
    id: 'mandar_mensajes_clientes',
    nombre: 'Envío de mensajes a clientes',
    descripcion: 'Envío de mensajes directos por WhatsApp a clientes y prospectos',
    modo: 'preguntar',
    prohibidaSola: true,
    categoria: 'Comunicación',
  },
  {
    id: 'cobrar_marcar_pagado',
    nombre: 'Registrar cobros y pagos de clientes',
    descripcion: 'Confirmación y registro de cobros o pagos en presupuestos y eventos',
    modo: 'preguntar',
    prohibidaSola: true,
    categoria: 'Finanzas',
  },
  {
    id: 'cerrar_presupuesto',
    nombre: 'Cerrar o confirmar presupuestos',
    descripcion: 'Confirmación y cierre formal de presupuestos y contratos',
    modo: 'preguntar',
    prohibidaSola: true,
    categoria: 'Ventas',
  },
  {
    id: 'tocar_permisos',
    nombre: 'Modificar permisos del personal',
    descripcion: 'Modificación de roles, accesos y permisos del equipo',
    modo: 'preguntar',
    prohibidaSola: true,
    categoria: 'Seguridad',
  },
  {
    id: 'cobrador',
    nombre: 'Cobrador Automático (seguimiento de cuotas)',
    descripcion: 'Recordatorios de saldos y cuotas por vencer',
    modo: 'preguntar',
    categoria: 'Cobranzas',
  },
  {
    id: 'perseguidor_presupuestos',
    nombre: 'Seguimiento de Presupuestos Enviados',
    descripcion: 'Seguimiento comercial a clientes con presupuestos enviados sin respuesta',
    modo: 'preguntar',
    categoria: 'Ventas',
  },
  {
    id: 'recontacto_automatico',
    nombre: 'Recontacto de Clientes Inactivos',
    descripcion: 'Recontacto de consultas comerciales archivadas o inactivas',
    modo: 'preguntar',
    categoria: 'Ventas',
  },
  {
    id: 'recordatorio_invitados',
    nombre: 'Recordatorio de Invitación no Abierta',
    descripcion: 'Aviso a invitados que aún no abrieron la invitación digital',
    modo: 'preguntar',
    categoria: 'Fiestas',
  },
  {
    id: 'vigilante_fiestas',
    nombre: 'Vigilante de Fiestas y Tareas Pendientes',
    descripcion: 'Monitoreo diario de tareas pendientes y fechas límite de fiestas',
    modo: 'sola',
    categoria: 'Monitoreo',
  },
  {
    id: 'generador_contenido',
    nombre: 'Creador de Contenido y Post-Evento',
    descripcion: 'Generación de borradores de publicaciones de redes y post-evento',
    modo: 'sola',
    categoria: 'Contenido',
  },
  {
    id: 'vigilante_noche',
    nombre: 'Operador de la Noche (Monitoreo en vivo)',
    descripcion: 'Monitoreo en tiempo real de fiestas activas durante la noche',
    modo: 'sola',
    categoria: 'Monitoreo',
  },
  {
    id: 'armar_web_evento',
    nombre: 'Diseñador Web del Evento',
    descripcion: 'Diseño y armado de la web de invitación digital para la fiesta',
    modo: 'sola',
    categoria: 'Diseño',
  },
  {
    id: 'errores_humanos',
    nombre: 'Detector de Errores y Alertas',
    descripcion: 'Detección automática de inconsistencias y olvidos en la planificación',
    modo: 'sola',
    categoria: 'Monitoreo',
  },
];

export async function guardarReglaIA(
  tareaId: string,
  modo: ReglaModo,
  perfilUsuario?: string
): Promise<{ success: boolean; error?: string }> {
  if (modo === 'sola' && esTareaProhibidaSola(tareaId)) {
    throw new Error('Esta tarea no puede ejecutarse sola por seguridad');
  }

  if (perfilUsuario !== undefined && perfilUsuario !== 'dueno' && perfilUsuario !== 'admin') {
    throw new Error(`Permisos insuficientes para modificar reglas de IA (perfil: ${perfilUsuario})`);
  }

  const guardadas = await leerJson<Record<string, ReglaModo>>(ARCHIVO_REGLAS, {});
  const actualizadas: Record<string, ReglaModo> = {
    ...(guardadas || {}),
    [tareaId]: modo,
  };

  try {
    await guardarJson(ARCHIVO_REGLAS, actualizadas);
  } catch (err) {
    console.warn('[Reglas IA] No se pudo guardar la regla:', err);
    return { success: false, error: 'No se pudo guardar la regla. Probá de nuevo.' };
  }
  return { success: true };
}

export async function getReglasDeLaIA(): Promise<ReglaIA[]> {
  try {
    const guardadas = await leerJson<Record<string, ReglaModo>>(ARCHIVO_REGLAS, {});
    const reglasMap = guardadas || {};

    return TAREAS_SISTEMA.map((def) => {
      let modo = reglasMap[def.id];
      if (!modo) {
        const normDef = def.id.toLowerCase().replace(/[_-]/g, '');
        for (const [k, v] of Object.entries(reglasMap)) {
          if (k.toLowerCase().replace(/[_-]/g, '') === normDef) {
            modo = v;
            break;
          }
        }
      }
      return {
        ...def,
        modo: modo ?? def.modo,
      };
    });
  } catch {
    return TAREAS_SISTEMA;
  }
}

export async function getReglaParaTarea(tareaId: string): Promise<ReglaModo> {
  try {
    const guardadas = await leerJson<Record<string, ReglaModo>>(ARCHIVO_REGLAS, {});
    if (guardadas && guardadas[tareaId]) {
      return guardadas[tareaId];
    }

    const norm = tareaId.toLowerCase().replace(/[_-]/g, '');
    for (const [k, v] of Object.entries(guardadas || {})) {
      if (k.toLowerCase().replace(/[_-]/g, '') === norm) {
        return v;
      }
    }

    const def = TAREAS_SISTEMA.find(
      (t) => t.id === tareaId || t.id.toLowerCase().replace(/[_-]/g, '') === norm
    );
    if (def) {
      return def.modo;
    }

    if (esTareaProhibidaSola(tareaId)) {
      return 'preguntar';
    }

    return 'preguntar';
  } catch {
    return esTareaProhibidaSola(tareaId) ? 'preguntar' : 'preguntar';
  }
}

export async function registrarAccionSola(accion: {
  tareaId: string;
  que: string;
  enlace?: string;
}): Promise<AccionSolaRegistro> {
  const registro: AccionSolaRegistro = {
    id: `reg_sola_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    tareaId: accion.tareaId,
    que: accion.que,
    enlace: accion.enlace,
    fecha: new Date().toISOString(),
  };

  try {
    const anteriores = await leerJson<AccionSolaRegistro[]>(ARCHIVO_REGISTRO, []);
    const lista = Array.isArray(anteriores) ? anteriores : [];
    const actualizados = [registro, ...lista].slice(0, MAX_REGISTRO);
    await guardarJson(ARCHIVO_REGISTRO, actualizados);
  } catch (error) {
    console.warn('[Reglas IA] Error al registrar acción sola:', error);
  }

  return registro;
}

export async function getRegistroAccionesSolas(): Promise<AccionSolaRegistro[]> {
  try {
    const datos = await leerJson<AccionSolaRegistro[]>(ARCHIVO_REGISTRO, []);
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

export async function registrarDecisionDuenio(decision: {
  tipoTarea: string;
  textoPropuesto?: string;
  textoFinal?: string;
  decision: 'si' | 'no' | 'cambiar';
  detalles?: any;
}): Promise<void> {
  const nuevaDecision: DecisionDuenio = {
    id: `dec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    tipoTarea: decision.tipoTarea,
    textoPropuesto: decision.textoPropuesto,
    textoFinal: decision.textoFinal,
    decision: decision.decision,
    fecha: new Date().toISOString(),
    detalles: decision.detalles,
  };

  try {
    const anteriores = await leerJson<DecisionDuenio[]>(ARCHIVO_APRENDIZAJE, []);
    const lista = Array.isArray(anteriores) ? anteriores : [];
    const todas = [nuevaDecision, ...lista].slice(0, MAX_APRENDIZAJE);
    await guardarJson(ARCHIVO_APRENDIZAJE, todas);

    if (decision.decision === 'no') {
      const normTarea = decision.tipoTarea.toLowerCase().replace(/[_-]/g, '');
      const delMismoTipo = todas.filter(
        (d) => (d.tipoTarea || '').toLowerCase().replace(/[_-]/g, '') === normTarea
      );

      // Si las últimas 3 decisiones consecutivas son 'no'
      if (delMismoTipo.length >= 3 && delMismoTipo.slice(0, 3).every((d) => d.decision === 'no')) {
        const guardadas = await leerJson<Record<string, ReglaModo>>(ARCHIVO_REGLAS, {});
        const actualizadas = {
          ...(guardadas || {}),
          [decision.tipoTarea]: 'apagada' as ReglaModo,
        };
        await guardarJson(ARCHIVO_REGLAS, actualizadas);

        await registrarAccionSola({
          tareaId: decision.tipoTarea,
          que: `Dejé de proponerte ${decision.tipoTarea} porque lo rechazaste 3 veces seguidas. Lo podés volver a prender en Tus reglas.`,
          enlace: '/centro-de-control',
        });
      }
    }
  } catch (error) {
    console.warn('[Reglas IA] Error al registrar decisión del dueño:', error);
  }
}

export async function getResumenMensualAprendizaje(): Promise<string> {
  try {
    const datos = await leerJson<DecisionDuenio[]>(ARCHIVO_APRENDIZAJE, []);
    if (!Array.isArray(datos) || datos.length === 0) {
      return 'Este mes aprendí de tus decisiones para afinar textos y propuestas automáticas.';
    }

    const haceTreintaDias = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const esteMes = datos.filter((d) => {
      const ms = d.fecha ? new Date(d.fecha).getTime() : 0;
      return ms >= haceTreintaDias;
    });

    if (esteMes.length === 0) {
      return 'Este mes aprendí de tus decisiones para afinar textos y propuestas automáticas.';
    }

    const aprendizajes: string[] = [];

    // 1. Analizar longitud de textos corregidos
    const corregidosConTexto = esteMes.filter(
      (d) => d.textoPropuesto && d.textoFinal && d.textoFinal.trim() !== d.textoPropuesto.trim()
    );
    if (corregidosConTexto.length > 0) {
      const masCortos = corregidosConTexto.filter(
        (d) => (d.textoFinal?.length || 0) < (d.textoPropuesto?.length || 0)
      );
      if (masCortos.length / corregidosConTexto.length >= 0.6) {
        aprendizajes.push('que te gusta escribir más corto y al grano');
      }
    }

    // 2. Analizar plantillas favoritas
    const plantillas = esteMes
      .map((d) => d.detalles?.plantilla)
      .filter((p): p is string => typeof p === 'string' && Boolean(p.trim()));
    if (plantillas.length > 0) {
      const conteo: Record<string, number> = {};
      for (const p of plantillas) {
        conteo[p] = (conteo[p] || 0) + 1;
      }
      const top = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0];
      if (top && top[1] >= 2) {
        aprendizajes.push(`que preferís la plantilla ${top[0]}`);
      }
    }

    // 3. Reglas apagadas por rechazos
    const rechazados = esteMes.filter((d) => d.decision === 'no');
    if (rechazados.length >= 3) {
      const conteoRechazos: Record<string, number> = {};
      for (const r of rechazados) {
        conteoRechazos[r.tipoTarea] = (conteoRechazos[r.tipoTarea] || 0) + 1;
      }
      const masRechazada = Object.entries(conteoRechazos).sort((a, b) => b[1] - a[1])[0];
      if (masRechazada && masRechazada[1] >= 3) {
        aprendizajes.push(`que preferís no recibir propuestas de ${masRechazada[0]}`);
      }
    }

    if (aprendizajes.length === 0) {
      return 'Este mes aprendí de tus decisiones para afinar textos y propuestas automáticas.';
    }

    return `Este mes aprendí: ${aprendizajes.join(', ')}.`;
  } catch {
    return 'Este mes aprendí de tus decisiones para afinar textos y propuestas automáticas.';
  }
}
