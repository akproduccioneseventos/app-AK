'use server';

import { resetAllCustomers } from './customers';
import { resetAllInvoices } from './invoices';
import { resetAllPresupuestos } from './presupuestos';
import { deleteAllFiestas } from './fiesta/fiesta.actions';
import { resetCrm } from './crm';
import { resetAllNotifications } from './notifications';
import { resetAllFiestasHistoricas } from './fiestas-historicas';
import * as logger from '@/lib/logger';

/**
 * Resets ALL operational data: clientes, facturas, presupuestos, fiestas, archive,
 * prospectos (CRM leads), notificaciones, and fiestas_historicas.
 *
 * The following data is PRESERVED (business/configuration data):
 * servicios, proveedores, menus_catering, empleados, roles, activos_fijos,
 * insumos, configuracion, crm_stages, catalogo_fotos, gastos_generales.
 *
 * This is a destructive admin-only operation and requires double confirmation in the UI.
 */
export async function resetAppCompleto(): Promise<{
  success: boolean;
  results?: Record<string, number>;
  error?: string;
}> {
  try {
    logger.info('[ResetCompleto] Iniciando reset completo de la aplicación...');

    const [
      clientesResult,
      facturasResult,
      presupuestosResult,
      fiestasResult,
      crmResult,
      notificacionesResult,
      fiestasHistoricasResult,
    ] = await Promise.allSettled([
      resetAllCustomers(),
      resetAllInvoices(),
      resetAllPresupuestos(),
      deleteAllFiestas(),
      resetCrm(),
      resetAllNotifications(),
      resetAllFiestasHistoricas(),
    ]);

    // Also delete the 'archive' collection (archived fiestas) directly
    let archiveDeletedCount = 0;
    try {
      const { dbAdmin } = await import('@/lib/firebase/server');
      if (dbAdmin) {
        const snapshot = await dbAdmin.collection('archive').get();
        archiveDeletedCount = snapshot.size;
        const batchSize = 450;
        const docs = snapshot.docs;
        for (let i = 0; i < docs.length; i += batchSize) {
          const batch = dbAdmin.batch();
          docs.slice(i, i + batchSize).forEach((doc: { ref: any }) => batch.delete(doc.ref));
          await batch.commit();
        }
      }
    } catch (archiveError: any) {
      logger.warn('[ResetCompleto] Error al eliminar colección archive:', archiveError.message);
    }

    const results: Record<string, number> = {
      clientes: clientesResult.status === 'fulfilled' && clientesResult.value.success ? (clientesResult.value.deletedCount ?? 0) : 0,
      facturas: facturasResult.status === 'fulfilled' && facturasResult.value.success ? (facturasResult.value.deletedCount ?? 0) : 0,
      presupuestos: presupuestosResult.status === 'fulfilled' && presupuestosResult.value.success ? (presupuestosResult.value.deletedCount ?? 0) : 0,
      fiestas: fiestasResult.status === 'fulfilled' && fiestasResult.value.success ? (fiestasResult.value.deletedCount ?? 0) : 0,
      archive: archiveDeletedCount,
      prospectos: crmResult.status === 'fulfilled' && crmResult.value.success ? (crmResult.value.deletedCount ?? 0) : 0,
      notificaciones: notificacionesResult.status === 'fulfilled' && notificacionesResult.value.success ? (notificacionesResult.value.deletedCount ?? 0) : 0,
      fiestas_historicas: fiestasHistoricasResult.status === 'fulfilled' && fiestasHistoricasResult.value.success ? (fiestasHistoricasResult.value.deletedCount ?? 0) : 0,
    };

    const totalDeleted = Object.values(results).reduce((sum, n) => sum + n, 0);
    logger.info('[ResetCompleto] Reset completo finalizado.', { results, totalDeleted });

    return { success: true, results };
  } catch (error: any) {
    logger.error('[ResetCompleto] Error durante el reset completo:', error);
    return { success: false, error: error.message || 'Error durante el reset completo.' };
  }
}
