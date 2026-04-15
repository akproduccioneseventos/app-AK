
'use server';

import { readData, writeData } from '@/lib/data-service';
import type { FiestaHistorica, ProyeccionHistorica } from '@/types/fiesta-historica';
import { savePresupuesto } from './presupuestos';
import { saveFiesta } from './fiesta/fiesta.actions';
import { initialFiestaActualData } from '@/lib/fiesta-defaults';
import type { Presupuesto } from '@/types/presupuesto';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { createNotification } from './notifications';

const FIESTAS_HISTORICAS_FILE = 'fiestas-historicas.json';

export async function getFiestasHistoricas(): Promise<FiestaHistorica[]> {
  return readData<FiestaHistorica[]>(FIESTAS_HISTORICAS_FILE, []);
}

export async function saveFiestaHistorica(
  data: Omit<FiestaHistorica, 'id' | 'fechaCreacion'> | FiestaHistorica
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const historicos = await getFiestasHistoricas();
    let id: string;
    const now = new Date().toISOString();

    if ('id' in data && data.id) {
      id = data.id;
      const index = historicos.findIndex(h => h.id === id);
      if (index === -1) throw new Error("Registro histórico no encontrado.");
      historicos[index] = { ...data, id, fechaCreacion: historicos[index].fechaCreacion } as FiestaHistorica;
    } else {
      id = `hist_${Date.now()}`;
      historicos.push({ ...data, id, fechaCreacion: now } as FiestaHistorica);
    }

    await writeData(FIESTAS_HISTORICAS_FILE, historicos);
    return { success: true, id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteFiestaHistorica(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    let historicos = await getFiestasHistoricas();
    historicos = historicos.filter(h => h.id !== id);
    await writeData(FIESTAS_HISTORICAS_FILE, historicos);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function calcularAjusteHistorico(
  montoOriginal: number,
  anioOriginal: number,
  anioNuevo: number
): Promise<ProyeccionHistorica> {
  const años = Math.max(0, anioNuevo - anioOriginal);
  const factor = Math.pow(1.15, años);
  const montoAjustado = Math.round((montoOriginal * factor) * 100) / 100;

  return {
    anioNuevo,
    añosTranscurridos: años,
    montoAjustado,
    factorAjuste: factor
  };
}

export async function generarDesdeHistorico(
  historicoId: string,
  anioNuevo: number
): Promise<{ success: boolean; fiestaId?: string; error?: string }> {
  try {
    const historicos = await getFiestasHistoricas();
    const source = historicos.find(h => h.id === historicoId);
    if (!source) throw new Error("Registro histórico no encontrado.");

    const proyeccion = await calcularAjusteHistorico(source.presupuestoTotalOriginal, source.anioOriginal, anioNuevo);

    // 1. Prepare New Budget Data
    const adjustedItems = source.detalleCostos.map(item => ({
      ...item,
      precioUnitario: Math.round(item.precioUnitario * proyeccion.factorAjuste),
      precioUnitarioPresupuesto: Math.round(item.precioUnitarioPresupuesto * proyeccion.factorAjuste),
      costoTotalItem: 0 // Will be recalculated by savePresupuesto
    }));

    const newBudgetData: Omit<Presupuesto, 'id'> = {
      clienteNombre: source.clienteNombre,
      clienteContacto: source.clienteContacto,
      eventoTipo: source.tipoFiesta,
      eventoFecha: new Date(anioNuevo, 5, 15).toISOString(), // Fecha tentativa
      invitadosCantidad: source.cantidadInvitados,
      invitadosAdultos: source.cantidadInvitados,
      salonFiestas: source.lugar,
      itemsPresupuestados: adjustedItems,
      costoTotalEstimado: proyeccion.montoAjustado,
      timestamp: new Date().toISOString(),
      estado: 'Borrador',
      notas: `Generado automáticamente desde historial: ${source.nombreEvento} (${source.anioOriginal}). Ajuste aplicado: ${proyeccion.añosTranscurridos} años al 15% anual compuesto.`,
      source: 'manual'
    };

    const budgetResult = await savePresupuesto(newBudgetData, { source: 'manual' });
    if (!budgetResult.success || !budgetResult.id) throw new Error(budgetResult.error || "Error al crear presupuesto.");

    // 2. Create New Event
    const newFiesta: FiestaEnPlanificacion = {
      ...initialFiestaActualData,
      id: `fiesta_gen_${Date.now()}`,
      presupuestoId: budgetResult.id,
      generadoDesdeHistorico: true,
      configuracion: {
        ...initialFiestaActualData.configuracion,
        nombreEvento: `${source.nombreEvento} ${anioNuevo}`,
        tipoCelebracion: source.tipoFiesta,
        invitadosEstimados: source.cantidadInvitados,
        nombreLugar: source.lugar,
        clienteId: budgetResult.leadId
      },
      tareas: source.checklistBase.map(t => ({ ...t, id: `task_gen_${Math.random()}`, completada: false }))
    };

    const fiestaResult = await saveFiesta(newFiesta);
    if (!fiestaResult.success || !fiestaResult.fiesta) throw new Error(fiestaResult.error || "Error al crear evento.");

    await createNotification({
      mensaje: `Nuevo evento generado desde histórico: ${newFiesta.configuracion.nombreEvento}`,
      href: `/fiestas/nueva?fiestaId=${fiestaResult.fiesta.id}`,
      icono: 'RotateCw'
    });

    return { success: true, fiestaId: fiestaResult.fiesta.id };

  } catch (error: any) {
    console.error("Error generating from history:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Deletes ALL fiestas historicas permanently from Firestore.
 * This is a destructive admin-only operation and requires explicit confirmation in the UI.
 */
export async function resetAllFiestasHistoricas(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    const { dbAdmin } = await import('@/lib/firebase/server');
    let deletedCount = 0;
    if (dbAdmin) {
      const snapshot = await dbAdmin.collection('fiestas_historicas').get();
      deletedCount = snapshot.size;
      const batchSize = 450;
      const docs = snapshot.docs;
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = dbAdmin.batch();
        docs.slice(i, i + batchSize).forEach((doc: { ref: any }) => batch.delete(doc.ref));
        await batch.commit();
      }
    }

    console.info('[FiestasHistoricas] Todas las fiestas históricas eliminadas por admin.', { deletedCount });
    return { success: true, deletedCount };
  } catch (error: any) {
    console.error('[FiestasHistoricas] Error al reiniciar fiestas históricas:', error);
    return { success: false, error: error.message || 'Error al reiniciar las fiestas históricas.' };
  }
}
