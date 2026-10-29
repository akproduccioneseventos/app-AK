import { autoGenerarBorradoresSemanales } from '@/lib/presencia-digital/autogenerador-semanal';
import { hoyEnUruguay } from '@/lib/utils';
import { sendPushNotificationToAll } from '@/lib/firebase/server-messaging';
import { getAsistenteSettings } from '@/lib/asistente/avisar-al-duenio';
import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';
import { NextResponse } from 'next/server';
import { abrirPuertaDeLaTarea, respuestaDeLaTarea } from '@/lib/automatico/puerta-de-las-tareas';
import { marcarCorrida } from '@/lib/automatico/tareas-automaticas';
import { ejecutarAgentesAutonomos } from '@/lib/agentes/motor-agentes';
import { detectarErroresHumanos } from '@/lib/alertas/errores-humanos';
import { getParteDeLaManana } from '@/lib/automatico/parte-manana';
import { detectarAlertasClimaFiestas } from '@/lib/asistente/clima-de-las-fiestas';
import { obtenerProximasFechasComerciales } from '@/lib/asistente/fechas-comerciales';
import { avisarAlDuenio, getHoraUruguay } from '@/lib/asistente/avisar-al-duenio';
import {
  agregarPropuestasDeduplicadas,
  guardarResumenMientrasNoEstabas,
  type AsistentePropuesta,
} from '@/lib/asistente/propuestas-service';
import { readDataConDetalle } from '@/lib/data-service';
import { leerFiestasCrudas } from '@/lib/fiesta/leer-fiestas';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';
import type { Salon } from '@/types/salon';
import { enviarResumenMananaWhatsApp } from '@/lib/asistente/resumen-manana-whatsapp';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ALERTA_NOCHE_RE = /^\[ALERTA NOCHE\]\[fiesta=([^;]+);tema=(programa|personal|barra);hora=([^\]]+)\]\s*/;
const FALTANTE_PERSONAL_RE = /^\[FALTANTE PERSONAL\]\[fiesta=([^;]+);fecha=(\d{4}-\d{2}-\d{2});invitados=(\d+);asignados=(\d+);requeridos=(\d+)\]\s*/;

export function prepararPropuestaFaltantePersonal(
  hallazgo: string,
): Omit<AsistentePropuesta, 'id' | 'estado' | 'createdAt' | 'updatedAt'> | null {
  const match = FALTANTE_PERSONAL_RE.exec(hallazgo);
  if (!match) return null;
  let fiestaId: string;
  try {
    fiestaId = decodeURIComponent(match[1]);
  } catch {
    return null;
  }
  const [, , fecha, invitadosTexto, asignadosTexto, requeridosTexto] = match;
  const invitados = Number(invitadosTexto);
  const asignados = Number(asignadosTexto);
  const requeridos = Number(requeridosTexto);
  if (!fiestaId.trim() || !Number.isFinite(invitados) || !Number.isFinite(asignados) || !Number.isFinite(requeridos) || asignados >= requeridos) {
    return null;
  }
  return {
    clave: `faltante-mozos:${fiestaId}:${fecha}:${asignados}:${requeridos}`,
    area: 'fiestas',
    titulo: 'Completar la asignación de mozos',
    quePasa: hallazgo.slice(match[0].length).trim(),
    porQueImporta: `La fiesta tiene ${invitados} invitados estimados y necesita cobertura operativa de mozos.`,
    quePropone: `Revisar la asignación y completar los ${requeridos - asignados} lugares faltantes. No se cambia el equipo automáticamente.`,
    tipoPropuesta: 'faltante_personal',
    fiestaId,
  };
}

export function prepararPropuestaOperativaNoche(
  hallazgo: string,
  quePropone: string,
): Omit<AsistentePropuesta, 'id' | 'estado' | 'createdAt' | 'updatedAt'> | null {
  const match = ALERTA_NOCHE_RE.exec(hallazgo);
  if (!match) return null;

  let fiestaId: string;
  try {
    fiestaId = decodeURIComponent(match[1]);
  } catch {
    return null;
  }
  if (!fiestaId.trim() || !/^\d{4}-\d{2}-\d{2}-\d{2}$/.test(match[3])) return null;

  const tema = match[2] as 'programa' | 'personal' | 'barra';
  const hora = match[3];
  const etiquetas = { programa: 'programa atrasado', personal: 'llegada del personal', barra: 'stock de barra' };
  return {
    clave: `agente:vigilante_noche:${fiestaId}:${tema}:${hora}`,
    area: 'fiestas',
    titulo: `Revisar ${etiquetas[tema]}`,
    quePasa: hallazgo.slice(match[0].length).trim(),
    porQueImporta: 'Es un aviso operativo de una fiesta que está en curso.',
    quePropone,
    tipoPropuesta: 'vigilante_noche',
    fiestaId,
    esImportante: true,
  };
}

export async function GET(request: Request) {
  const puerta = await abrirPuertaDeLaTarea(request, 'asistente-proactivo');
  if (!puerta.permitido) {
    return NextResponse.json(
      { error: puerta.mensaje || 'Acceso no autorizado' },
      { status: puerta.estado || 401 }
    );
  }

  const ahora = new Date();
  const horaUy = getHoraUruguay(ahora);
  const esMadrugada = horaUy >= 0 && horaUy < 8;

  const nuevasParaAgregar: Omit<AsistentePropuesta, 'id' | 'estado' | 'createdAt' | 'updatedAt'>[] = [];
  const fallos: string[] = [];

  // Lectura de datos base
  let fiestas: FiestaEnPlanificacion[] = [];
  let presupuestos: Presupuesto[] = [];
  let salones: Salon[] = [];

  // Si no se puede leer la base, la tarea NO corre ni se marca como corrida: con listas vacias
  // por defecto "no encontraba nada" y quedaba anotada como hecha (se reintenta en la proxima).
  try {
    fiestas = await leerFiestasCrudas(false);
    const pres = await readDataConDetalle<Presupuesto[]>('presupuestos.json', []);
    const sals = await readDataConDetalle<Salon[]>('salones.json', []);
    if (pres.huboFalla || sals.huboFalla) {
      throw new Error('la base no contestó al leer presupuestos o salones');
    }
    presupuestos = pres.valor;
    salones = sals.valor;
  } catch (err: any) {
    console.error('[AsistenteProactivo] No se pudieron leer los datos base:', err);
    return NextResponse.json(
      { ok: false, error: `No se pudieron leer los datos base: ${err?.message || 'error desconocido'}. Se reintenta en la próxima corrida.` },
      { status: 500 },
    );
  }

  // 1. EJECUTAR AGENTES AUTÓNOMOS (Ventas, Cobros, Fiestas, etc.)
  try {
    const registrosAgentes = await ejecutarAgentesAutonomos(ahora);
    for (const reg of registrosAgentes) {
      if (reg.hallazgos && reg.hallazgos.length > 0) {
        for (const [hallazgoIndex, hallazgo] of reg.hallazgos.entries()) {
          const propuestaFaltante = reg.agenteId === 'vigilante_fiestas'
            ? prepararPropuestaFaltantePersonal(hallazgo)
            : null;
          if (propuestaFaltante) {
            nuevasParaAgregar.push(propuestaFaltante);
            continue;
          }

          const propuestaNoche = reg.agenteId === 'vigilante_noche'
            ? prepararPropuestaOperativaNoche(hallazgo, reg.accionesPreparadas?.[hallazgoIndex] || 'Revisar el aviso operativo en la app.')
            : null;
          if (propuestaNoche) {
            nuevasParaAgregar.push(propuestaNoche);
            continue;
          }

          let area: AsistentePropuesta['area'] = 'fiestas';
          if (reg.agenteId === 'cobrador') area = 'cobros';
          else if (reg.agenteId === 'perseguidor_presupuestos' || reg.agenteId === 'vigilante_publicidad') area = 'ventas';

          const hash = Math.abs(hallazgo.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0));
          const clave = `agente:${reg.agenteId}:${hash}`;

          nuevasParaAgregar.push({
            clave,
            area,
            titulo: `${reg.agenteNombre}: hallazgo operativo`,
            quePasa: hallazgo,
            porQueImporta: 'Requiere atención para asegurar el flujo de ingresos o la excelencia del evento.',
            quePropone: reg.accionesPreparadas?.[0] || 'Revisar la situación y tomar acción preventiva.',
            tipoPropuesta: reg.agenteId,
            esImportante: area === 'cobros',
          });
        }
      }
    }
  } catch (err: any) {
    fallos.push(`Error en motor de agentes autónomos: ${err.message}`);
  }

  // 2. DETECCIÓN DE ERRORES HUMANOS
  try {
    const errores = detectarErroresHumanos(fiestas, presupuestos, [], ahora);
    for (const err of errores) {
      const clave = `error-humano:${err.id}`;
      nuevasParaAgregar.push({
        clave,
        area: 'fiestas',
        titulo: err.titulo,
        quePasa: err.descripcion,
        porQueImporta: err.accionLabel || 'Evita choques operativos y descoordinaciones el día de la fiesta.',
        quePropone: `Resolver: ${err.accionLabel || err.titulo}`,
        tipoPropuesta: 'error_humano',
        fiestaId: err.fiestaId,
        esImportante: err.urgencia === 'peligro_2_dias' || err.urgencia === 'urgente_7_dias',
        conflictoPersonalOSalon: err.categoria === 'personal_salon',
      });
    }
  } catch (err: any) {
    fallos.push(`Error detectando errores humanos: ${err.message}`);
  }

  // 3. PARTE DE LA MAÑANA (Una vez al día)
  try {
    if (horaUy >= 7 && horaUy <= 11) {
      const parte = await getParteDeLaManana();
      const entrega = await enviarResumenMananaWhatsApp(parte, ahora);
      if (entrega.motivo && entrega.motivo !== 'Fuera de la ventana matutina.' && entrega.motivo !== 'El resumen de hoy ya se procesó.') {
        fallos.push(`Resumen matutino: ${entrega.motivo}`);
      }
      if (parte && parte.totalPendientes > 0) {
        nuevasParaAgregar.push({
          clave: `parte-manana:${parte.fecha}`,
          area: 'fiestas',
          titulo: `Parte de la mañana (${parte.fecha})`,
          quePasa: parte.textoResumen,
          porQueImporta: 'Brinda un panorama sereno y ordenado para arrancar la jornada.',
          quePropone: 'Escuchar el parte diario y atender las tareas prioritarias del día.',
          tipoPropuesta: 'parte_manana',
        });
      }
    }
  } catch (err: any) {
    fallos.push(`Error en parte de la mañana: ${err.message}`);
  }

  // 4. CLIMA DE LAS FIESTAS CON OPEN-METEO
  try {
    const salonesMap: Record<string, { lat?: number; lng?: number }> = {};
    for (const s of salones) {
      if (s.id) salonesMap[s.id] = { lat: s.lat, lng: s.lng };
    }
    const alertasClima = await detectarAlertasClimaFiestas(fiestas, salonesMap);
    for (const ac of alertasClima) {
      nuevasParaAgregar.push({
        clave: ac.clave,
        area: ac.area,
        titulo: ac.titulo,
        quePasa: ac.descripcion,
        porQueImporta: ac.porQueImporta,
        quePropone: ac.quePropone,
        tipoPropuesta: 'clima',
        fiestaId: ac.fiestaId,
        clienteNombre: ac.clienteNombre,
        esImportante: true,
        diasHastaFiesta: 7,
      });
    }
  } catch (err: any) {
    fallos.push(`Error evaluando clima con Open-Meteo: ${err.message}`);
  }

  // 5. FECHAS COMERCIALES DE URUGUAY
  try {
    const proximasFechas = obtenerProximasFechasComerciales(ahora, 28);
    for (const pf of proximasFechas) {
      const clave = `fecha-comercial:${pf.fechaComercial.id}:${pf.fechaEvento.getFullYear()}`;
      nuevasParaAgregar.push({
        clave,
        area: 'ventas',
        titulo: `Oportunidad: ${pf.fechaComercial.nombre} (en ${pf.diasFaltantes} días)`,
        quePasa: pf.fechaComercial.descripcion,
        porQueImporta: 'Lanzar promociones con 4 semanas de anticipación maximiza la captación.',
        quePropone: `Preparar publicación y propuesta para ${pf.fechaComercial.nombre}.`,
        tipoPropuesta: 'fecha_comercial',
      });
    }
  } catch (err: any) {
    fallos.push(`Error evaluando fechas comerciales: ${err.message}`);
  }

  // 5b. REDES SOCIALES: GENERACIÓN SEMANAL DE BORRADORES
  try {
    if (ahora.getDay() === 1 || process.env.NODE_ENV === 'test') {
      const resBorradores = await autoGenerarBorradoresSemanales();
      if (resBorradores && resBorradores.createdCount > 0) {
        nuevasParaAgregar.push({
          clave: `borradores-redes:${ahora.toISOString().slice(0, 10)}`,
          area: 'ventas',
          titulo: `Redes Sociales: ${resBorradores.createdCount} nuevos borradores preparados`,
          quePasa: `Se generaron borradores automáticos para la semana basados en ${resBorradores.tipoOrigen}.`,
          porQueImporta: 'Mantiene la presencia de marca activa con contenido generado por IA para revisar.',
          quePropone: 'Revisar y aprobar los posteos en la sección de Redes Sociales.',
          tipoPropuesta: 'marketing',
        });
      }
    }
  } catch (err: any) {
    fallos.push(`Error autogenerando borradores semanales: ${err.message}`);
  }

  // 6. PERSISTENCIA DEDUPLICADA
  const resultadoPersistencia = await agregarPropuestasDeduplicadas(nuevasParaAgregar);

  // 7. CORRIDA DE MADRUGADA: RESUMEN "MIENTRAS NO ESTABAS"
  if (esMadrugada) {
    try {
      await guardarResumenMientrasNoEstabas({
        fecha: ahora.toISOString().split('T')[0],
        fiestasRevisadas: fiestas.length,
        presupuestosRevisados: presupuestos.length,
        cobrosRevisados: presupuestos.filter((p: any) => (p.totalConDescuento || p.costoTotalEstimado || 0) > 0).length,
        propuestasEncontradas: nuevasParaAgregar.length,
        propuestasPreparadas: resultadoPersistencia.agregadas.length,
        fallos,
        detalles: resultadoPersistencia.agregadas.map((p) => p.titulo),
      });
    } catch (err: any) {
      console.warn('[AsistenteProactivo] Error guardando resumen nocturno:', err);
    }
  }

  // 8. AVISOS PROACTIVOS: los hallazgos del vigilante nocturno quedan en la app.
  let avisoDuenioRes = null;
  const ajustes = await getAsistenteSettings().catch(() => ({ avisosProactivosActivos: true }));
  const avisosPrendidos = (ajustes as any).avisosProactivosActivos !== false;

  // Respetar horario de descanso: nunca entre las 23 y las 8 en Uruguay
  const esHorarioDescanso = horaUy >= 23 || horaUy < 8;

  if (avisosPrendidos && !esHorarioDescanso && resultadoPersistencia.agregadas.length > 0) {
    try {
      const hoyKey = hoyEnUruguay(ahora);
      const propuestasNoche = resultadoPersistencia.agregadas.filter(
        (p) => p.tipoPropuesta === 'vigilante_noche' && p.esImportante,
      );
      const otrasPropuestas = resultadoPersistencia.agregadas.filter((p) => p.tipoPropuesta !== 'vigilante_noche');
      const importantes = otrasPropuestas.filter((p) => p.esImportante);

      if (importantes.length > 0) {
        let reservado = false;
        await mutarDocumentoConTransaccion<Record<string, { fecha: string; count: number }>>(
          'asistente/avisos-diarios.json',
          {},
          (store) => {
            const actual = store || {};
            const userTracking = actual['general'] || { fecha: hoyKey, count: 0 };
            const countHoy = userTracking.fecha === hoyKey ? userTracking.count : 0;
            if (countHoy >= 3) {
              reservado = false;
              return null;
            }
            reservado = true;
            return {
              ...actual,
              general: { fecha: hoyKey, count: countHoy + 1 },
            };
          }
        );

        if (reservado) {
          // El aviso llega a TODOS los teléfonos registrados del equipo (sendPushNotificationToAll),
          // también a quien no tiene permiso de ver plata: por eso NO lleva el detalle (nombres de
          // clientes ni saldos). El detalle se ve adentro de la app, con su permiso. Codex en la 1364.
          await sendPushNotificationToAll({
            title: 'Asistente AK',
            body:
              importantes.length === 1
                ? 'Tenés un aviso nuevo del asistente. Abrí la app para verlo.'
                : `Tenés ${importantes.length} avisos nuevos del asistente. Abrí la app para verlos.`,
            url: '/mi-dia?hablar=1',
          });
        }
      }

      // avisarAlDuenio también puede hacer push a todos. Para la alerta de operación
      // solo se usa como WhatsApp del dueño cuando ese canal está activo y el push general apagado.
      // WhatsApp directo al encargado de la fiesta queda pendiente de aprobación e identidad verificable.
      const puedeAvisarPorWhatsAppAlDuenio = (ajustes as any).whatsappDuenioHabilitado === true
        && (ajustes as any).avisoCelularHabilitado === false;
      const propuestasParaAvisar = [
        ...otrasPropuestas,
        ...(puedeAvisarPorWhatsAppAlDuenio ? propuestasNoche : []),
      ];
      if (propuestasParaAvisar.length > 0) {
        avisoDuenioRes = await avisarAlDuenio(propuestasParaAvisar, ahora);
      }
    } catch (err: any) {
      console.warn('[AsistenteProactivo] Error enviando avisos proactivos:', err);
    }
  }

  // 9. MARCAR CORRIDA
  await marcarCorrida('asistente-proactivo');

  return NextResponse.json(respuestaDeLaTarea(puerta, {
    ok: true,
    ejecutadoEn: ahora.toISOString(),
    propuestasGeneradas: nuevasParaAgregar.length,
    propuestasNuevasAgregadas: resultadoPersistencia.agregadas.length,
    propuestasIgnoradasODuplicadas: resultadoPersistencia.ignoradas,
    avisoDuenio: avisoDuenioRes,
    fallos,
  }));
}

