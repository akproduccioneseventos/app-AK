'use server';

import type { FiestaEnPlanificacion, GestionCostosData, CostoItem } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';

export async function updateGestionCostos(fiestaId: string, costos: GestionCostosData): Promise<{ success: boolean; updatedData?: GestionCostosData; error?: string }> {
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) throw new Error("Fiesta no encontrada");
    const updatedData = { ...currentData, gestionCostos: costos };
    const result = await saveFiesta(updatedData);
    if (!result.success) throw new Error(result.error);
    return { success: true, updatedData: result.fiesta?.gestionCostos };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Sincroniza automáticamente los gastos de lavadero basados en la mantelería contratada.
 * Se ejecuta al guardar/actualizar presupuestos.
 */
export async function syncLaundryCosts(fiestaId: string, guests: number, budgetItems: any[]): Promise<void> {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return;

    const costs = fiesta.gestionCostos || { costosItems: [], ingresosTotalesEstimados: 0 };
    const items = [...(costs.costosItems || [])];

    // 1. Identificar mantelería en el presupuesto
    const hasMantel = budgetItems.some(i => i.nombreServicio.toLowerCase().includes('mantelería') || i.nombreServicio.toLowerCase().includes('mantel'));
    const hasCompleta = budgetItems.some(i => i.nombreServicio.toLowerCase().includes('completa') || i.nombreServicio.toLowerCase().includes('completo'));

    const updateOrCreateCost = (name: string, amount: number) => {
        const index = items.findIndex(i => i.nombre === name);
        if (amount > 0) {
            if (index > -1) {
                items[index].montoEstimado = amount;
            } else {
                items.push({
                    id: `laundry_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    nombre: name,
                    category: 'Servicio Proveedor',
                    montoEstimado: amount,
                    notas: 'Generado automáticamente (Lavadero del Sol)'
                });
            }
        } else if (index > -1) {
            items.splice(index, 1);
        }
    };

    // Lógica Lavadero del Sol
    if (hasMantel) {
        const units = Math.ceil(guests / 8);
        updateOrCreateCost('Lavado Mantel ($50)', units * 50);
        updateOrCreateCost('Lavado Cubre ($18)', units * 18);
        
        if (hasCompleta) {
            updateOrCreateCost('Lavado Cubre Silla ($18)', guests * 18);
        } else {
            updateOrCreateCost('Lavado Cubre Silla ($18)', 0);
        }
    } else {
        ['Lavado Mantel ($50)', 'Lavado Cubre ($18)', 'Lavado Cubre Silla ($18)'].forEach(n => updateOrCreateCost(n, 0));
    }

    await updateGestionCostos(fiestaId, { ...costs, costosItems: items });
}
