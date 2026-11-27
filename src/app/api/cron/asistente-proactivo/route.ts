import { autoGenerarBorradoresSemanales } from '@/lib/presencia-digital/autogenerador-semanal';
import { getUruguayParts, hoyEnUruguay } from '@/lib/utils';
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
import { esFiestaDemo } from '@/lib/events/event-ordering';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';
import type { Salon } from '@/types/salon';
import { enviarResumenMananaWhatsApp } from '@/lib/asistente/resumen-manana-whatsapp';
import { getReglaParaTarea } from '@/lib/ia/reglas-de-la-ia';
import { ejecutarCierrePosfiesta } from '@/lib/asistente/cierre-posfiesta';
import { enviarAvisosOperativosWhatsApp } from '@/lib/asistente/avisos-operativos-whatsapp';
import { prepararPropuestaFaltantePersonal, prepararPropuestaOperativaNoche } from '@/lib/asistente/propuestas-operativas';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
    const rawFiestas = await leerFiestasCrudas(false);
    fiestas = (rawFiestas || []).filter((f) => !esFiestaDemo(f));
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
    const listaRegistros = Array.isArray(registrosAgentes) ? registrosAgentes : [];
    const agentesFallidos = Array.isArray((registrosAgentes as any)?.agentesFallidos)
      ? ((registrosAgentes as any).agentesFallidos as string[])
      : [];
    const erroresAgentes = Array.isArray((registrosAgentes as any)?.errores)
      ? ((registrosAgentes as any).errores as string[])
      : [];

    if (erroresAgentes.length > 0) {
      for (const errMsg of erroresAgentes) {
        fallos.push(`Error en agente autónomo: ${errMsg}`);
      }
    } else if (agentesFallidos.length > 0) {
      fallos.push(`Agentes autónomos fallidos: ${agentesFallidos.join(', ')}`);
    }

    for (const reg of listaRegistros) {
      if (reg.estado === 'error' || reg.lecturaFallida === true || reg.ok === false) {
        if (erroresAgentes.length === 0 && agentesFallidos.length === 0) {
          fallos.push(`Error en agente ${reg.agenteNombre || reg.agenteId}: ${reg.error || reg.hallazgos?.[0] || 'error de ejecución'}`);
        }
        continue;
      }
      if (reg.hallazgos && reg.hallazgos.length > 0) {
        for (const [hallazgoIndex, hallazgo] of reg.hallazgos.entries()) {
          const propuestaFaltante = (reg.agenteId === 'vigilante_fiestas' || reg.agenteId === 'anticipador')
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
          if (reg.agenteId === 'cobrador' || (reg.agenteId === 'anticipador' && hallazgo.includes('[area=cobros]'))) area = 'cobros';
          else if (reg.agenteId === 'perseguidor_presupuestos' || reg.agenteId === 'vigilante_publicidad') area = 'ventas';

          const hash = Math.abs(hallazgo.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0));
          const clave = `agente:${reg.agenteId}:${hash}`;

          nuevasParaAgregar.push({
            clave,
            area,
            titulo: `${reg.agenteNombre}: hallazgo operativo`,
            quePasa: hallazgo,
            porQueImporta: 'Requiere atención para asegurar el flujo de ingresos o la excelencia del evento.',
            quePropone: reg.accionesPreparadas?.[hallazgoIndex] || 'Revisar la situación y tomar acción preventiva.',
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
      const regla = await getReglaParaTarea('resumen_de_la_manana');
      if (regla === 'sola' || regla === 'preguntar') {
        const parte = await getParteDeLaManana();
        if (regla === 'sola') {
          const preventivas = nuevasParaAgregar.filter((p) =>
            ['anticipador', 'perseguidor_presupuestos', 'faltante_personal'].includes(p.tipoPropuesta || ''),
          );
          const entrega = await enviarResumenMananaWhatsApp({
            ...parte,
            itemsPrincipales: [
              ...preventivas.map((p) => ({ id: p.clave || p.titulo, tipo: 'fiesta_proxima' as const, titulo: p.titulo, detalle: p.quePasa })),
              ...parte.itemsPrincipales,
            ].slice(0, 4),
          }, ahora);
          if (entrega.motivo && entrega.motivo !== 'Fuera de la ventana matutina.' && entrega.motivo !== 'El resumen de hoy ya se procesó.') {
            fallos.push(`Resumen matutino: ${entrega.motivo}`);
          }
        } else {
          fallos.push('Resumen matutino: requiere aprobación; no existe un borrador de envío para este WhatsApp y quedó sin enviar.');
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

  // 5b. REDES SOCIALES: GENERACIÓN SEMANAL DE BORRADORES (Lunes en hora de Uruguay)
  try {
    const uyHoy = getUruguayParts(ahora);
    const diaSemanaUy = new Date(Date.UTC(uyHoy.year, uyHoy.month - 1, uyHoy.day, 12, 0, 0)).getUTCDay();
    if (diaSemanaUy === 1 || process.env.NODE_ENV === 'test') {
      const resBorradores = await autoGenerarBorradoresSemanales();
      if (resBorradores && resBorradores.createdCount > 0) {
        nuevasParaAgregar.push({
          clave: `borradores-redes:${hoyEnUruguay(ahora)}`,
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

  try {
    const cierre = await ejecutarCierrePosfiesta(ahora);
    nuevasParaAgregar.push(...cierre.nuevasPropuestas);
    fallos.push(...cierre.errores.map((error) => `Informe ${error.fiestaId}: ${error.error}`));
  } catch (error) {
    fallos.push(`No se pudieron preparar los informes posfiesta: ${error instanceof Error ? error.message : 'error de lectura'}`);
  }

  // 6. PERSISTENCIA DEDUPLICADA
  const resultadoPersistencia = await agregarPropuestasDeduplicadas(nuevasParaAgregar);

  // 7. CORRIDA DE MADRUGADA: RESUMEN "MIENTRAS NO ESTABAS"
  if (esMadrugada) {
    try {
      await guardarResumenMientrasNoEstabas({
        fecha: hoyEnUruguay(ahora),
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

  // 8. AVISOS PROACTIVOS: la alerta operativa tiene su propia entrega por tema/hora.
  let avisosOperativos = null;
  try {
    avisosOperativos = await enviarAvisosOperativosWhatsApp(nuevasParaAgregar, fiestas, ahora);
  } catch {
    fallos.push('No se pudo confirmar la entrega de avisos operativos; revisar la app.');
  }
  let avisoDuenioRes = null;
  const ajustes = await getAsistenteSettings().catch(() => ({ avisosProactivosActivos: true }));
  const avisosPrendidos = (ajustes as any).avisosProactivosActivos !== false;

  // Respetar horario de descanso: nunca entre las 23 y las 8 en Uruguay
  const esHorarioDescanso = horaUy >= 23 || horaUy < 8;

  if (avisosPrendidos && !esHorarioDescanso && resultadoPersistencia.agregadas.length > 0) {
    try {
      const hoyKey = hoyEnUruguay(ahora);
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

      const propuestasParaAvisar = otrasPropuestas;
      if (propuestasParaAvisar.length > 0) {
        avisoDuenioRes = await avisarAlDuenio(propuestasParaAvisar, ahora);
      }
    } catch (err: any) {
      console.warn('[AsistenteProactivo] Error enviando avisos proactivos:', err);
    }
  }

  // 9. MARCAR CORRIDA solo si ningún paso interno falló
  const ok = fallos.length === 0;
  if (ok) {
    await marcarCorrida('asistente-proactivo');
  }

  return NextResponse.json(
    respuestaDeLaTarea(puerta, {
      ok,
      ejecutadoEn: ahora.toISOString(),
      propuestasGeneradas: nuevasParaAgregar.length,
      propuestasNuevasAgregadas: resultadoPersistencia.agregadas.length,
      propuestasIgnoradasODuplicadas: resultadoPersistencia.ignoradas,
      avisoDuenio: avisoDuenioRes,
      avisosOperativos,
      fallos,
    }),
    { status: ok ? 200 : 500 },
  );
}

