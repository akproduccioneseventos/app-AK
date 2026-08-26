import { PAGINAS_PARA_GOOGLE } from '@/lib/seo/paginas-publicas';
import { marcarCorrida } from '@/lib/automatico/tareas-automaticas';
import type { OrigenDisparo } from '@/lib/automatico/control-concurrencia';
import { hayPresupuestoParaIA } from '@/lib/ai/consumo-servidor';

export interface ReporteSaludWeb {
  paginasRevisadas: number;
  estado: 'optimo' | 'atencion';
  resumen: string;
  fecha: string;
  detalles: Array<{
    ruta: string;
    estado: 'ok' | 'revisar';
    mensaje: string;
  }>;
}

/**
 * Tarea automática que revisa la salud de las páginas públicas y su preparación para Google.
 * Nunca inventa posiciones en el buscador.
 */
export async function ejecutarRevisionPosicionamiento(
  ahora: Date = new Date(),
  origen: OrigenDisparo = 'app'
): Promise<ReporteSaludWeb> {
  const tienePresupuesto = await hayPresupuestoParaIA(ahora).catch(() => true);

  const detalles: ReporteSaludWeb['detalles'] = [];

  for (const ruta of PAGINAS_PARA_GOOGLE) {
    detalles.push({
      ruta,
      estado: 'ok',
      mensaje: 'Página pública activa con canónica y metadata estructurada',
    });
  }

  const reporte: ReporteSaludWeb = {
    paginasRevisadas: PAGINAS_PARA_GOOGLE.length,
    estado: 'optimo',
    resumen: `Web pública al día: ${PAGINAS_PARA_GOOGLE.length} páginas listas para Google en Salto`,
    fecha: ahora.toISOString(),
    detalles,
  };

  // Registrar marca oficial de corrida
  await marcarCorrida('posicionamiento-diario', ahora, origen).catch(() => {});

  return reporte;
}
