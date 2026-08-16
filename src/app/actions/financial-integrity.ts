'use server';

import { getInvoices } from '@/app/actions/invoices';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import {
  buildFinancialIntegrityReport,
  type FinancialIntegrityReport,
} from '@/lib/commercial-flow/financial-integrity';

export async function getFinancialIntegrityReport(): Promise<{
  success: boolean;
  generatedAt?: string;
  report?: FinancialIntegrityReport;
  error?: string;
}> {
  const permiso = await requirePermiso(PERMISOS.CONTABILIDAD);
  if (!permiso.ok) return { success: false, error: permiso.error };

  try {
    const [presupuestos, invoices, fiestas] = await Promise.all([
      getPresupuestos(true),
      getInvoices(),
      getFiestas(false),
    ]);
    return {
      success: true,
      generatedAt: new Date().toISOString(),
      report: buildFinancialIntegrityReport(presupuestos, invoices, fiestas),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo completar el control financiero.',
    };
  }
}
