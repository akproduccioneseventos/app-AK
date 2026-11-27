import 'server-only';
import { readData, writeData } from '@/lib/data-service';
import { mutarPresupuesto } from '@/lib/budget/mutar-presupuesto';
import { roundMoney } from '@/lib/budget/financial-guardrails';
import { esFiestaDemo } from '@/lib/events/event-ordering';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { PagoCliente } from '@/types/presupuesto';
import { esCuotaDeSena, yaTieneSenaEnPagos } from '@/lib/contabilidad/cuotas-pagos';

const MARCA_FILE = 'migracion-cuotas-pagos.json';

function fechaCuotaIso(fecha?: string): string {
  if (!fecha) return new Date().toISOString();
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return `${fecha}T12:00:00-03:00`;
  return fecha;
}

/**
 * Tarea de una sola vez: copia a `presupuesto.pagosCliente` las cuotas ya marcadas como
 * pagadas antes de la unificación (id fijo `cuota_<id>`), respetando la seña si ya existía.
 */
export async function correrSincronizacionCuotasPagosUnaVez(): Promise<{
  ejecutada: boolean;
  sincronizadas: number;
}> {
  const marca = await readData<{ hecha?: boolean; fecha?: string }>(MARCA_FILE, {});
  if (marca?.hecha) {
    return { ejecutada: false, sincronizadas: 0 };
  }

  const fiestas = await readData<FiestaEnPlanificacion[]>('fiestas.json', []);
  let sincronizadas = 0;

  for (const fiesta of Array.isArray(fiestas) ? fiestas : []) {
    if (!fiesta || esFiestaDemo(fiesta) || !fiesta.presupuestoId) continue;
    const cuotas = fiesta.planDePagos?.cuotas ?? [];
    const pagadas = cuotas.filter(
      (c) => (c.estado === 'pagado' || c.estado === 'parcial') && roundMoney(c.montoPagado ?? c.monto) > 0,
    );
    if (pagadas.length === 0) continue;

    await mutarPresupuesto(fiesta.presupuestoId, (presupuesto) => {
      const pagos = Array.isArray(presupuesto.pagosCliente) ? [...presupuesto.pagosCliente] : [];
      let cambio = false;
      for (const cuota of pagadas) {
        const pagoId = `cuota_${cuota.id}`;
        const monto = roundMoney(cuota.montoPagado ?? cuota.monto);
        if (monto <= 0) continue;
        if (pagos.some((p) => p.id === pagoId)) continue;
        if (esCuotaDeSena(cuota) && yaTieneSenaEnPagos(pagos, monto)) continue;
        const nuevoPago: PagoCliente = {
          id: pagoId,
          fecha: fechaCuotaIso(cuota.fechaPago),
          monto,
          metodoPago: ((cuota as any).metodoPago || 'Transferencia Bancaria'),
          referencia: cuota.descripcion || `Cuota ${cuota.id}`,
          estadoPago: 'confirmado',
        };
        pagos.push(nuevoPago);
        sincronizadas++;
        cambio = true;
      }
      return cambio ? { ...presupuesto, pagosCliente: pagos } : null;
    }).catch(() => null);
  }

  await writeData(MARCA_FILE, { hecha: true, fecha: new Date().toISOString(), sincronizadas }, undefined, { skipAutoBackup: true });
  return { ejecutada: true, sincronizadas };
}
