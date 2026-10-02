import { NextResponse } from 'next/server';
import { abrirPuertaDeLaTarea } from '@/lib/automatico/puerta-de-las-tareas';
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
import { readData } from '@/lib/data-service';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';
import type { Salon } from '@/types/salon';

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

  try {
    fiestas = await readData<FiestaEnPlanificacion[]>('fiestas.json', []);
    presupuestos = await readData<Presupuesto[]>('presupuestos.json', []);
    salones = await readData<Salon[]>('salones.json', []);
  } catch (err: any) {
    fallos.push(`Error leyendo datos base: ${err.message}`);
  }

  // 1. EJECUTAR AGENTES AUTÓNOMOS (Ventas, Cobros, Fiestas, etc.)
  try {
    const registrosAgentes = await ejecutarAgentesAutonomos(ahora);
    for (const reg of registrosAgentes) {
      if (reg.hallazgos && reg.hallazgos.length > 0) {
        for (const hallazgo of reg.hallazgos) {
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

  // 8. AVISO AL DUEÑO (Push / WhatsApp con filtros estrictos)
  let avisoDuenioRes = null;
  if (resultadoPersistencia.agregadas.length > 0) {
    try {
      avisoDuenioRes = await avisarAlDuenio(resultadoPersistencia.agregadas, ahora);
    } catch (err: any) {
      console.warn('[AsistenteProactivo] Error avisando al dueño:', err);
    }
  }

  // 9. MARCAR CORRIDA
  await marcarCorrida('asistente-proactivo');

  return NextResponse.json({
    ok: true,
    ejecutadoEn: ahora.toISOString(),
    propuestasGeneradas: nuevasParaAgregar.length,
    propuestasNuevasAgregadas: resultadoPersistencia.agregadas.length,
    propuestasIgnoradasODuplicadas: resultadoPersistencia.ignoradas,
    avisoDuenio: avisoDuenioRes,
    fallos,
  });
}
