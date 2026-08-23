import { readData, writeData } from '@/lib/data-service';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { getCrmLeads } from '@/app/actions/crm';

const REPASO_CACHE_FILE = 'repaso-matutino-cache.json';
const HISTORIAL_TAREAS_FILE = 'tareas-automaticas-historial.json';

export interface RepasoMatutinoItem {
  id: string;
  categoria: 'cobro' | 'presupuesto_frio' | 'fiesta_proxima' | 'tarea_automatica';
  titulo: string;
  descripcion: string;
  gravedad: 'urgente' | 'aviso' | 'info';
  monto?: number;
  enlace?: string;
  etiquetaEnlace?: string;
}

export interface RepasoMatutinoData {
  fechaGeneracion: string;
  resumenEjecutivo: string;
  items: RepasoMatutinoItem[];
  kpis: {
    totalVencidoSemana: number;
    presupuestosSinRespuesta: number;
    presupuestosFrios: number;
    diasProximaFiesta: number | null;
    nombreProximaFiesta: string | null;
  };
}

/**
 * Obtiene el repaso matutino del día (usa caché del día para no gastar de más).
 */
export async function getRepasoMatutinoDelDia(forzarRecalculo = false): Promise<RepasoMatutinoData> {
  const hoyStr = new Date().toISOString().split('T')[0];

  if (!forzarRecalculo) {
    try {
      const cache = await readData<RepasoMatutinoData | null>(REPASO_CACHE_FILE, null);
      if (cache && cache.fechaGeneracion?.startsWith(hoyStr)) {
        return cache;
      }
    } catch {
      // Si falla lectura de cache, generamos
    }
  }

  const repasoGenerado = await generarRepasoMatutino();
  await writeData(REPASO_CACHE_FILE, repasoGenerado).catch(() => null);
  return repasoGenerado;
}

/**
 * Genera el diagnóstico del día cruzando todas las fuentes de la app.
 */
export async function generarRepasoMatutino(): Promise<RepasoMatutinoData> {
  const ahora = new Date();
  const hoyMs = ahora.getTime();
  const sieteDiasMs = hoyMs + 7 * 24 * 60 * 60 * 1000;

  const [fiestas, presupuestos, _leads, historialTareas] = await Promise.all([
    getFiestas(false).catch(() => []),
    getPresupuestos(false).catch(() => []),
    getCrmLeads().catch(() => []),
    readData<any[]>(HISTORIAL_TAREAS_FILE, []).catch(() => []),
  ]);

  const items: RepasoMatutinoItem[] = [];
  let totalVencidoSemana = 0;
  let presupuestosSinRespuesta = 0;
  let presupuestosFrios = 0;

  // 1. Quién debe y cuánto vence esta semana
  for (const pres of presupuestos) {
    if (pres.estado === 'Aceptado' || pres.estado === 'Facturado') {
      const saldo = Math.max(0, (pres.totalConDescuento ?? pres.costoTotalEstimado ?? 0) - ((pres as any).pagos || []).reduce((acc: number, p: any) => acc + (p.monto || 0), 0));
      if (saldo > 0) {
        const fechaEvento = pres.eventoFecha ? new Date(pres.eventoFecha).getTime() : null;
        if (fechaEvento && fechaEvento >= hoyMs && fechaEvento <= sieteDiasMs) {
          totalVencidoSemana += saldo;
          items.push({
            id: `cobro-${pres.id}`,
            categoria: 'cobro',
            titulo: `Saldo pendiente: ${pres.clienteNombre}`,
            descripcion: `Fiesta ${pres.eventoTipo} en ${Math.max(1, Math.round((fechaEvento - hoyMs) / (24 * 3600 * 1000)))} días. Saldo a cobrar: $ ${saldo.toLocaleString('es-UY')}.`,
            gravedad: 'urgente',
            monto: saldo,
            enlace: `/presupuestos/${pres.id}/ver`,
            etiquetaEnlace: 'Ver presupuesto',
          });
        }
      }
    }
  }

  // 2. Presupuestos sin respuesta (>5 días y >14 días fríos)
  for (const pres of presupuestos) {
    if (pres.estado === 'Enviado' || pres.estado === 'Pendiente Verificación') {
      const fechaCreacion = pres.timestamp ? new Date(pres.timestamp).getTime() : hoyMs;
      const diasSinRespuesta = Math.floor((hoyMs - fechaCreacion) / (24 * 3600 * 1000));

      if (diasSinRespuesta >= 14) {
        presupuestosFrios += 1;
        items.push({
          id: `frio-${pres.id}`,
          categoria: 'presupuesto_frio',
          titulo: `Oportunidad fría: ${pres.clienteNombre} (${diasSinRespuesta} días)`,
          descripcion: `Presupuesto de $ ${(pres.totalConDescuento ?? pres.costoTotalEstimado ?? 0).toLocaleString('es-UY')} sin respuesta hace 2 semanas. Conviene recontactar o archivar.`,
          gravedad: 'aviso',
          enlace: `/presupuestos/${pres.id}/ver`,
          etiquetaEnlace: 'Ver propuesta',
        });
      } else if (diasSinRespuesta >= 5) {
        presupuestosSinRespuesta += 1;
        items.push({
          id: `seguimiento-${pres.id}`,
          categoria: 'presupuesto_frio',
          titulo: `Seguimiento pendiente: ${pres.clienteNombre} (${diasSinRespuesta} días)`,
          descripcion: `Presupuesto enviado hace ${diasSinRespuesta} días. Ideal mandar mensaje de WhatsApp de seguimiento.`,
          gravedad: 'info',
          enlace: `/presupuestos/${pres.id}/ver`,
          etiquetaEnlace: 'Contactar',
        });
      }
    }
  }

  // 3. Qué falta para la fiesta más próxima
  const fiestasFuturas = (fiestas as any[])
    .filter((f: any) => {
      const fecha = f.configuracion?.fechaEvento;
      return fecha && new Date(fecha).getTime() >= hoyMs;
    })
    .sort((a: any, b: any) => {
      const fA = new Date(a.configuracion?.fechaEvento).getTime();
      const fB = new Date(b.configuracion?.fechaEvento).getTime();
      return fA - fB;
    });

  const proximaFiesta = fiestasFuturas[0];
  let diasProximaFiesta: number | null = null;
  let nombreProximaFiesta: string | null = null;

  if (proximaFiesta) {
    const fecha = new Date(proximaFiesta.configuracion?.fechaEvento).getTime();
    diasProximaFiesta = Math.max(0, Math.round((fecha - hoyMs) / (24 * 3600 * 1000)));
    nombreProximaFiesta = proximaFiesta.configuracion?.nombreEvento || proximaFiesta.id || 'Evento';

    const tareasPendientes = (proximaFiesta.tareas || []).filter((t: any) => !t.completada && !t.hecha).length;

    items.push({
      id: `proxima-${proximaFiesta.id}`,
      categoria: 'fiesta_proxima',
      titulo: `Próxima fiesta: ${nombreProximaFiesta} (en ${diasProximaFiesta} días)`,
      descripcion: `Salón: ${proximaFiesta.configuracion?.nombreLugar || 'Por definir'}. ${tareasPendientes > 0 ? `Quedan ${tareasPendientes} tareas operativas pendientes.` : 'Tareas operativas al día.'}`,
      gravedad: diasProximaFiesta <= 3 ? 'urgente' : 'info',
      enlace: `/fiestas/${proximaFiesta.id}`,
      etiquetaEnlace: 'Abrir fiesta',
    });
  }

  // 4. Tareas automáticas no corridas
  if (Array.isArray(historialTareas)) {
    for (const tarea of historialTareas) {
      if (tarea.estado === 'error' || tarea.estado === 'fallida') {
        items.push({
          id: `tarea-${tarea.id || tarea.nombre}`,
          categoria: 'tarea_automatica',
          titulo: `Tarea automática con error: ${tarea.nombre}`,
          descripcion: `La tarea falló en su última ejecución: ${tarea.mensaje || 'Error desconocido'}.`,
          gravedad: 'aviso',
          enlace: '/settings/tareas-automaticas',
          etiquetaEnlace: 'Ver tareas',
        });
      }
    }
  }

  const resumenEjecutivo = `Hoy hay ${items.filter((i) => i.gravedad === 'urgente').length} asuntos urgentes y ${items.length} puntos de atención en total. ${
    totalVencidoSemana > 0 ? `Saldos por cobrar esta semana: $ ${totalVencidoSemana.toLocaleString('es-UY')}.` : 'No hay cuotas vencidas esta semana.'
  } ${proximaFiesta ? `Próximo evento en ${diasProximaFiesta} días (${nombreProximaFiesta}).` : ''}`.trim();

  return {
    fechaGeneracion: ahora.toISOString(),
    resumenEjecutivo,
    items,
    kpis: {
      totalVencidoSemana,
      presupuestosSinRespuesta,
      presupuestosFrios,
      diasProximaFiesta,
      nombreProximaFiesta,
    },
  };
}
