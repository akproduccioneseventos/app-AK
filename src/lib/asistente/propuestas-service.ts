/**
 * @fileOverview Gestión centralizada de propuestas del Asistente Proactivo.
 * Maneja persistencia, deduplicación por clave, reglas aprendidas,
 * asignación por equipo ("Lo tomo yo") y resumen matutino ("Mientras no estabas").
 */

import { readData, writeData } from '@/lib/data-service';
import { saveAgentLearning } from '@/lib/multiagent/memory-store';
import { ejecutarAccionSecretario } from '@/app/actions/multiagent';
import { saveScheduledMessage } from '@/app/actions/scheduled-messages';
import { WHATSAPP_AUTOMATION_INTERNAL_TOKEN } from '@/lib/whatsapp/internal-token';

export type AsistenteArea = 'ventas' | 'cobros' | 'fiestas';

export interface AsistentePropuesta {
  id: string;
  clave: string; // Clave única estable (ej: cuota-vencida:P12:C1)
  area: AsistenteArea;
  titulo: string;
  quePasa: string;
  porQueImporta: string;
  quePropone: string;
  estado: 'pendiente' | 'aceptada' | 'pospuesta' | 'descartada';
  accion?: {
    type: string;
    data?: any;
  };
  nivelRiesgo?: 'solo' | 'pregunta' | 'nunca';
  responsableId?: string;
  responsableNombre?: string;
  tomadaPor?: string;
  tomadaEn?: string;
  aceptadaPor?: string;
  aceptadaEn?: string;
  pospuestaHasta?: string;
  noAvisarMas?: boolean;
  tipoPropuesta?: string;
  fiestaId?: string;
  clienteId?: string;
  clienteNombre?: string;
  monto?: number;
  esImportante?: boolean;
  diasHastaFiesta?: number;
  conflictoPersonalOSalon?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReglaAprendida {
  id: string;
  tipoPropuesta: string;
  fiestaId?: string;
  clienteNombre?: string;
  regla: 'no_avisar_mas' | 'automatizar_preparado';
  creadaEn: string;
}

export interface ResumenMientrasNoEstabas {
  id: string;
  fecha: string;
  fiestasRevisadas: number;
  presupuestosRevisados: number;
  cobrosRevisados: number;
  propuestasEncontradas: number;
  propuestasPreparadas: number;
  fallos: string[];
  detalles: string[];
  visto: boolean;
}

const PROPUESTAS_FILE = 'asistente-propuestas.json';
const REGLAS_FILE = 'asistente-reglas-aprendidas.json';
const HISTORIAL_ACEPTACIONES_FILE = 'asistente-historial-aceptaciones.json';
const MIENTRAS_NO_ESTABAS_FILE = 'asistente-mientras-no-estabas.json';

export async function getPropuestas(): Promise<AsistentePropuesta[]> {
  try {
    return await readData<AsistentePropuesta[]>(PROPUESTAS_FILE, []);
  } catch {
    return [];
  }
}

export async function writePropuestas(propuestas: AsistentePropuesta[]): Promise<void> {
  await writeData(PROPUESTAS_FILE, propuestas);
}

export async function getReglasAprendidas(): Promise<ReglaAprendida[]> {
  try {
    return await readData<ReglaAprendida[]>(REGLAS_FILE, []);
  } catch {
    return [];
  }
}

export async function writeReglasAprendidas(reglas: ReglaAprendida[]): Promise<void> {
  await writeData(REGLAS_FILE, reglas);
}

export async function desestimarReglaAprendida(reglaId: string): Promise<void> {
  const reglas = await getReglasAprendidas();
  const filtradas = reglas.filter((r) => r.id !== reglaId);
  await writeReglasAprendidas(filtradas);
}

/**
 * Agrega propuestas deduplicando por `clave` y verificando reglas de no avisar más.
 */
export async function agregarPropuestasDeduplicadas(
  nuevas: Omit<AsistentePropuesta, 'id' | 'estado' | 'createdAt' | 'updatedAt'>[]
): Promise<{ agregadas: AsistentePropuesta[]; ignoradas: number }> {
  const existentes = await getPropuestas();
  const reglas = await getReglasAprendidas();

  const existentesMap = new Map<string, AsistentePropuesta>();
  for (const p of existentes) {
    existentesMap.set(p.clave, p);
  }

  const hoy = new Date();
  const agregadas: AsistentePropuesta[] = [];
  let ignoradas = 0;

  for (const n of nuevas) {
    // 1. Chequear si hay regla de no avisar más
    const tieneReglaNoAvisar = reglas.some((r) => {
      if (r.regla !== 'no_avisar_mas') return false;
      if (r.tipoPropuesta && n.tipoPropuesta && r.tipoPropuesta === n.tipoPropuesta) {
        if (!r.fiestaId && !r.clienteNombre) return true;
        if (r.fiestaId && r.fiestaId === n.fiestaId) return true;
        if (r.clienteNombre && n.clienteNombre && r.clienteNombre.toLowerCase() === n.clienteNombre.toLowerCase()) return true;
      }
      return false;
    });

    if (tieneReglaNoAvisar) {
      ignoradas++;
      continue;
    }

    // 2. Chequear si ya existe una propuesta con la misma clave
    const existente = existentesMap.get(n.clave);
    if (existente) {
      // Si está pendiente, no la duplicamos
      if (existente.estado === 'pendiente') {
        ignoradas++;
        continue;
      }
      // Si está pospuesta y no venció el plazo de 3 días, ignoramos
      if (existente.estado === 'pospuesta' && existente.pospuestaHasta) {
        const hasta = new Date(existente.pospuestaHasta);
        if (hasta > hoy) {
          ignoradas++;
          continue;
        }
      }
      // Si ya fue aceptada o descartada, no la repetimos a menos que sea una nueva fecha
      if (existente.estado === 'aceptada' || existente.estado === 'descartada') {
        ignoradas++;
        continue;
      }
    }

    const nuevaPropuesta: AsistentePropuesta = {
      ...n,
      id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      estado: 'pendiente',
      createdAt: hoy.toISOString(),
      updatedAt: hoy.toISOString(),
    };

    existentes.push(nuevaPropuesta);
    existentesMap.set(nuevaPropuesta.clave, nuevaPropuesta);
    agregadas.push(nuevaPropuesta);
  }

  if (agregadas.length > 0) {
    await writePropuestas(existentes);
  }

  return { agregadas, ignoradas };
}

/**
 * Acepta una propuesta: "Sí, hacelo".
 * Ejecuta la acción o prepara el mensaje con manual_click.
 */
export async function aceptarPropuesta(
  propuestaId: string,
  usuarioNombre: string = 'Usuario'
): Promise<{ success: boolean; mensaje: string; preguntaAutomatizacion?: string }> {
  const propuestas = await getPropuestas();
  const propuesta = propuestas.find((p) => p.id === propuestaId);

  if (!propuesta) {
    return { success: false, mensaje: 'Propuesta no encontrada.' };
  }

  let mensajeResultado = 'Propuesta aceptada con éxito.';

  // Si tiene acción vinculada, la preparamos / ejecutamos
  if (propuesta.accion) {
    const { type, data } = propuesta.accion;

    // Si la acción es mandar un mensaje a un cliente, NUNCA lo manda directo:
    // lo deja en la bandeja de salida con manual_click
    if (type === 'prepare_whatsapp' || type === 'enviar_mensaje' || type === 'preparar_mail') {
      try {
        const resMsg = await saveScheduledMessage(
          {
            targetPhone: data?.telefono || data?.targetPhone || '',
            targetName: data?.nombre || data?.targetName || propuesta.clienteNombre || 'Cliente',
            scheduledAt: new Date().toISOString(),
            messageTemplate: data?.mensaje || data?.body || propuesta.quePropone,
            status: 'scheduled' as any,
            sendingMode: 'manual_click' as any,
            channel: type === 'preparar_mail' ? ('email' as any) : ('whatsapp' as any),
          } as any,
          WHATSAPP_AUTOMATION_INTERNAL_TOKEN
        );
        if (resMsg.success) {
          mensajeResultado = 'Mensaje preparado en la bandeja de salida (listo para enviar con un clic manual).';
        } else {
          mensajeResultado = `Error al preparar mensaje en bandeja: ${resMsg.error || 'falló guardado'}`;
        }
      } catch (err: any) {
        mensajeResultado = `Error al preparar mensaje en bandeja: ${err.message}`;
      }
    } else {
      // Otras acciones del secretario
      try {
        const ejecucion = await ejecutarAccionSecretario({ accion: type as any, datos: data || {}, confirmado: true });
        if (ejecucion.success) {
          mensajeResultado = ejecucion.mensaje || 'Acción completada.';
        } else {
          mensajeResultado = `Advertencia al ejecutar: ${ejecucion.mensaje || ejecucion.error}`;
        }
      } catch (err: any) {
        mensajeResultado = `Error al ejecutar acción: ${err.message}`;
      }
    }
  }

  propuesta.estado = 'aceptada';
  propuesta.aceptadaPor = usuarioNombre;
  propuesta.aceptadaEn = new Date().toISOString();
  propuesta.updatedAt = new Date().toISOString();

  await writePropuestas(propuestas);

  // Aprendizaje: si se aceptó 3 veces seguidas igual, sugerir automatización
  let preguntaAutomatizacion: string | undefined;
  try {
    const tipo = propuesta.tipoPropuesta || propuesta.clave.split(':')[0];
    const historial = await readData<Record<string, number>>(HISTORIAL_ACEPTACIONES_FILE, {});
    const count = (historial[tipo] || 0) + 1;
    historial[tipo] = count;
    await writeData(HISTORIAL_ACEPTACIONES_FILE, historial, undefined, { skipAutoBackup: true });

    if (count % 3 === 0) {
      preguntaAutomatizacion = `Aceptaste "${propuesta.titulo}" 3 veces seguidas. ¿Querés que esto lo deje preparado siempre sin preguntarte?`;
      await saveAgentLearning({
        agentType: 'central',
        scope: 'global',
        title: `Preferencia aprendida: ${tipo}`,
        content: `El usuario aceptó la propuesta de tipo "${tipo}" reiteradas veces de forma consistente.`,
        source: 'system',
        tags: ['automatizacion', tipo],
        confidence: 'high',
      });
    }
  } catch (err) {
    console.warn('[PropuestasService] Error en aprendizaje de aceptaciones:', err);
  }

  return { success: true, mensaje: mensajeResultado, preguntaAutomatizacion };
}

/**
 * Pospone una propuesta: "Ahora no" (se esconde 3 días).
 */
export async function posponerPropuesta(propuestaId: string): Promise<void> {
  const propuestas = await getPropuestas();
  const propuesta = propuestas.find((p) => p.id === propuestaId);
  if (!propuesta) return;

  const hoy = new Date();
  const en3Dias = new Date(hoy.getTime() + 3 * 24 * 60 * 60 * 1000);

  propuesta.estado = 'pospuesta';
  propuesta.pospuestaHasta = en3Dias.toISOString();
  propuesta.updatedAt = hoy.toISOString();

  await writePropuestas(propuestas);
}

/**
 * "No me avises más de esto": guarda la regla aprendida y descarta la propuesta.
 */
export async function descartarNoAvisarMas(propuestaId: string): Promise<void> {
  const propuestas = await getPropuestas();
  const propuesta = propuestas.find((p) => p.id === propuestaId);
  if (!propuesta) return;

  propuesta.estado = 'descartada';
  propuesta.noAvisarMas = true;
  propuesta.updatedAt = new Date().toISOString();

  await writePropuestas(propuestas);

  // Guardar regla aprendida
  const tipo = propuesta.tipoPropuesta || propuesta.clave.split(':')[0];
  const reglas = await getReglasAprendidas();
  const nuevaRegla: ReglaAprendida = {
    id: `regla-${Date.now()}`,
    tipoPropuesta: tipo,
    fiestaId: propuesta.fiestaId,
    clienteNombre: propuesta.clienteNombre,
    regla: 'no_avisar_mas',
    creadaEn: new Date().toISOString(),
  };

  reglas.push(nuevaRegla);
  await writeReglasAprendidas(reglas);

  // Registro en memoria de agentes
  try {
    await saveAgentLearning({
      agentType: 'central',
      scope: propuesta.fiestaId ? 'fiesta' : 'global',
      fiestaId: propuesta.fiestaId,
      title: `No avisar más: ${propuesta.titulo}`,
      content: `El usuario descartó avisos futuros para ${tipo} ${propuesta.clienteNombre ? `de ${propuesta.clienteNombre}` : ''}.`,
      source: 'manual',
      tags: ['descarte', tipo],
      confidence: 'high',
    });
  } catch (err) {
    console.warn('[PropuestasService] Error al guardar regla en memoria:', err);
  }
}

/**
 * "Lo tomo yo": asigna la propuesta al usuario actual y la oculta de los demás.
 */
export async function tomarPropuesta(propuestaId: string, usuarioNombre: string): Promise<void> {
  const propuestas = await getPropuestas();
  const propuesta = propuestas.find((p) => p.id === propuestaId);
  if (!propuesta) return;

  propuesta.tomadaPor = usuarioNombre;
  propuesta.tomadaEn = new Date().toISOString();
  propuesta.updatedAt = new Date().toISOString();

  await writePropuestas(propuestas);
}

/**
 * Filtra las propuestas según el usuario y el área.
 */
export async function getPropuestasParaUsuario(
  usuarioNombre: string = 'Usuario',
  esDuenio: boolean = true,
  filtroArea?: AsistenteArea
): Promise<AsistentePropuesta[]> {
  const propuestas = await getPropuestas();
  const hoy = new Date();

  return propuestas.filter((p) => {
    // 1. Filtrar descartadas y aceptadas
    if (p.estado === 'descartada' || p.estado === 'aceptada') {
      return false;
    }

    // 2. Filtrar pospuestas vigentes
    if (p.estado === 'pospuesta' && p.pospuestaHasta) {
      const hasta = new Date(p.pospuestaHasta);
      if (hasta > hoy) {
        return false;
      }
    }

    // 3. Filtrar por área si se solicitó
    if (filtroArea && p.area !== filtroArea) {
      return false;
    }

    // 4. Lógica de visibilidad por responsable ("Lo tomo yo")
    if (esDuenio) {
      return true; // El dueño ve todas
    }

    // Si otra persona la tomó, no la ve este usuario
    if (p.tomadaPor && p.tomadaPor !== usuarioNombre) {
      return false;
    }

    // Si tiene responsableId específico y no coincide, no la ve
    if (p.responsableNombre && p.responsableNombre !== usuarioNombre) {
      return false;
    }

    return true;
  });
}

/**
 * Gestión del resumen "Mientras no estabas" de la corrida de madrugada.
 */
export async function getResumenMientrasNoEstabas(): Promise<ResumenMientrasNoEstabas | null> {
  try {
    const res = await readData<ResumenMientrasNoEstabas | null>(MIENTRAS_NO_ESTABAS_FILE, null);
    if (res && !res.visto) {
      return res;
    }
    return null;
  } catch {
    return null;
  }
}

export async function marcarResumenMientrasNoEstabasVisto(id: string): Promise<void> {
  try {
    const res = await readData<ResumenMientrasNoEstabas | null>(MIENTRAS_NO_ESTABAS_FILE, null);
    if (res && res.id === id) {
      res.visto = true;
      await writeData(MIENTRAS_NO_ESTABAS_FILE, res);
    }
  } catch (err) {
    console.warn('[PropuestasService] Error al marcar resumen visto:', err);
  }
}

export async function guardarResumenMientrasNoEstabas(resumen: Omit<ResumenMientrasNoEstabas, 'id' | 'visto'>): Promise<ResumenMientrasNoEstabas> {
  const completo: ResumenMientrasNoEstabas = {
    ...resumen,
    id: `resumen-${Date.now()}`,
    visto: false,
  };
  await writeData(MIENTRAS_NO_ESTABAS_FILE, completo);
  return completo;
}
