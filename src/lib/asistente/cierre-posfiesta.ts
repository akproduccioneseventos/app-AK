import { mutateGenericJsonArray } from '@/lib/generic-json-store';
import { readDataConDetalle } from '@/lib/data-service';
import { hoyEnUruguay } from '@/lib/utils';
import { getFiestaTimeRange } from '@/lib/staff-agenda-conflicts';
import { armarInformeAutomatico, type InformeFiestaAutomatico } from '@/lib/fiesta/informe-automatico';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';
import type { SocialGalleryPost } from '@/types/social-gallery';
import type { Invoice } from '@/types/invoice';
import { getReconciledSalePayments, isFirmSalesInvoice } from '@/lib/commercial-flow/ledger-service';
import { getReglaParaTarea } from '@/lib/ia/reglas-de-la-ia';
import type { AsistentePropuesta } from '@/lib/asistente/propuestas-service';
import { generarBorradoresPosfiesta } from '@/lib/presencia-digital/autogenerador-semanal';

const ARCHIVO_INFORMES = 'informes-posfiesta.json';

export interface DependenciasCierrePosfiesta {
  leerFiestas: () => Promise<FiestaEnPlanificacion[]>;
  leerInformes: () => Promise<InformeFiestaAutomatico[]>;
  leerDatosConfirmados: (fiesta: FiestaEnPlanificacion) => Promise<Partial<Pick<InformeFiestaAutomatico, 'asistencia' | 'multimedia' | 'catering' | 'finanzas' | 'mejoresFotos'>>>;
  guardar: (informe: InformeFiestaAutomatico) => Promise<boolean>;
  generarBorradoresRedes?: (fiestaId: string, fecha: string, ahora: Date) => Promise<{ createdCount: number; posts: unknown[]; motivo?: string }>;
}

export const dependenciasCierrePosfiestaProduccion: DependenciasCierrePosfiesta = {
  generarBorradoresRedes: generarBorradoresPosfiesta,
  leerFiestas: async () => {
    const resultado = await readDataConDetalle<FiestaEnPlanificacion[]>('fiestas.json', []);
    if (resultado.huboFalla) throw new Error('No se pudo verificar la lista de fiestas; se reintentará el cierre.');
    return resultado.valor;
  },
  leerInformes: async () => {
    const resultado = await readDataConDetalle<InformeFiestaAutomatico[]>(ARCHIVO_INFORMES, []);
    if (resultado.huboFalla) throw new Error('No se pudo verificar el informe guardado; se reintentará sin crear propuestas duplicadas.');
    return resultado.valor;
  },
  leerDatosConfirmados: async (fiesta) => {
    const [postsResult, presupuestosResult, invoicesResult] = await Promise.all([
      readDataConDetalle<SocialGalleryPost[]>('social-posts.json', []),
      readDataConDetalle<Presupuesto[]>('presupuestos.json', []),
      readDataConDetalle<Invoice[]>('invoices.json', []),
    ]);
    if (postsResult.huboFalla || presupuestosResult.huboFalla || invoicesResult.huboFalla) {
      throw new Error('No se pudieron verificar recuerdos, presupuestos o facturas; no se generará un informe parcial.');
    }
    const posts = postsResult.valor;
    const presupuesto = presupuestosResult.valor.find((item) => item.id === fiesta.presupuestoId);
    const invoices = invoicesResult.valor;
    const recuerdos = posts.filter((post) => post.fiestaId === fiesta.id && post.moderationStatus === 'approved');
    const invoice = presupuesto && invoices.find((item) => item.id === presupuesto.invoiceId && item.sourcePresupuestoId === presupuesto.id && isFirmSalesInvoice(item));
    const cobrosReconciliados = invoice ? getReconciledSalePayments(invoice, presupuesto).reduce((sum, payment) => sum + payment.amount, 0) : null;
    return {
      asistencia: fiesta.invitados?.length
        ? { disponible: true as const, valor: {
            confirmados: fiesta.invitados.filter((invitado) => invitado.rsvp === 'Confirmado').reduce((n, invitado) => n + Math.max(1, Number(invitado.partySize) || 1), 0),
            asistieron: fiesta.invitados.filter((invitado) => Boolean(invitado.checkedIn)).reduce((n, invitado) => n + Math.max(1, Number(invitado.partySize) || 1), 0),
          } }
        : undefined,
      multimedia: recuerdos.length
        ? { disponible: true as const, valor: { fotos: recuerdos.filter((post) => post.mediaType !== 'video').length, videos: recuerdos.filter((post) => post.mediaType === 'video').length } }
        : undefined,
      finanzas: invoice && presupuesto?.contractSignatureInfo?.isSigned && cobrosReconciliados !== null
        ? { disponible: true as const, valor: { contratado: invoice.totalAmount, pagado: cobrosReconciliados, saldo: Math.max(0, invoice.totalAmount - cobrosReconciliados), moneda: invoice.currency } }
        : undefined,
    };
  },
  guardar: async (informe) => {
    const guardado = await mutateGenericJsonArray<InformeFiestaAutomatico>(ARCHIVO_INFORMES, (informes) => {
      if (informes.some((item) => item.id === informe.id)) return null;
      return [...informes, informe];
    });
    return guardado !== null;
  },
};

function ayerUruguay(ahora: Date): string {
  const hoy = hoyEnUruguay(ahora);
  const [year, month, day] = hoy.split('-').map(Number);
  const fecha = new Date(Date.UTC(year, month - 1, day - 1, 12));
  return fecha.toISOString().slice(0, 10);
}

/** Invocable por el cron diario. El ID estable hace que reintentar no duplique informes. */
export async function ejecutarCierrePosfiesta(
  ahora = new Date(),
  dependencias: DependenciasCierrePosfiesta = dependenciasCierrePosfiestaProduccion,
): Promise<{ preparados: number; omitidos: number; errores: Array<{ fiestaId: string; error: string }>; nuevasPropuestas: AsistentePropuesta[]; propuestas: AsistentePropuesta[] }> {
  const modo = await getReglaParaTarea('informe_posfiesta');
  if (modo === 'apagada') return { preparados: 0, omitidos: 0, errores: [], nuevasPropuestas: [], propuestas: [] };
  const modoRedes = await getReglaParaTarea('borradores_redes_posfiesta');
  const fechaObjetivo = ayerUruguay(ahora);
  const fiestas = await dependencias.leerFiestas();
  const informesGuardados = await dependencias.leerInformes();
  let preparados = 0;
  let omitidos = 0;
  const errores: Array<{ fiestaId: string; error: string }> = [];
  const propuestas: AsistentePropuesta[] = [];

  for (const fiesta of fiestas) {
    const fecha = fiesta.configuracion?.fechaEvento?.slice(0, 10);
    if (!fiesta.id || !fecha || fecha > fechaObjetivo) continue;
    const estado = String(fiesta.estado || '').trim().toLocaleLowerCase('es-UY');
    if (fiesta.id.startsWith('demo_') || ['demo ak', 'suspendida', 'suspendido', 'cancelada', 'cancelado', 'archivada', 'archivado'].includes(estado)) continue;
    const id = `informe-posfiesta-${fiesta.id}-${fecha}`;
    try {
      const rango = getFiestaTimeRange(fiesta);
      if (!rango) {
        errores.push({ fiestaId: fiesta.id, error: 'No se puede confirmar la hora de fin; requiere revisión y se reintentará.' });
        continue;
      }
      if (ahora.getTime() < rango.endMs) continue;
      let informe = informesGuardados.find((item) => item.id === id);
      if (!informe) {
        const datos = await dependencias.leerDatosConfirmados(fiesta);
        informe = armarInformeAutomatico({ fiesta, datos, fechaGeneracion: ahora });
        if (await dependencias.guardar(informe)) {
          preparados++;
        } else {
          omitidos++;
          informe = (await dependencias.leerInformes()).find((item) => item.id === id);
          if (!informe) throw new Error('La transacción indicó duplicado, pero no se pudo recuperar el informe ganador.');
        }
      }
      propuestas.push({
        id: `propuesta-${id}`,
        clave: id,
        area: 'fiestas',
        titulo: 'Revisar informe posfiesta',
        quePasa: `El informe de ${fiesta.configuracion?.nombreEvento || fiesta.id} está preparado para revisión interna.`,
        porQueImporta: 'La revisión permite corregir datos antes de usarlos o compartirlos.',
        quePropone: informe.propuestaResumenDuenio,
        estado: 'pendiente',
        nivelRiesgo: 'pregunta',
        tipoPropuesta: 'informe_posfiesta',
        fiestaId: fiesta.id,
        createdAt: informe.fechaGeneracion,
        updatedAt: ahora.toISOString(),
      });
      if (modoRedes !== 'apagada' && dependencias.generarBorradoresRedes) {
        const borradores = await dependencias.generarBorradoresRedes(fiesta.id, fecha, ahora);
        if (borradores.motivo && borradores.createdCount === 0 && borradores.posts.length === 0) {
          errores.push({ fiestaId: fiesta.id, error: borradores.motivo });
        }
      }
    } catch (error) {
      errores.push({ fiestaId: fiesta.id, error: error instanceof Error ? error.message : 'Error desconocido al preparar el informe.' });
    }
  }
  return { preparados, omitidos, errores, nuevasPropuestas: propuestas, propuestas };
}
