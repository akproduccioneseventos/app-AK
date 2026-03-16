'use server';

import type { FiestaEnPlanificacion, GestionCostosData, CostoItem, PagoProveedor } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';
import { getPresupuestoById } from '../presupuestos';
import { getServiciosEmpresa } from '../servicios-empresa';
import { getMenus } from '../menus-catering';
import { getRoles } from '../roles';
import { getInsumos } from '../insumos';

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
 * MOTOR FINANCIERO INTEGRAL: Sincroniza todos los gastos operativos del evento.
 * Cruza datos de: Presupuesto, Planificador Gastronómico, Catálogos y Personal.
 */
export async function syncAllEventCosts(fiestaId: string): Promise<{ success: boolean; error?: string }> {
    if (!fiestaId) return { success: false, error: "ID no válido" };

    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Evento no encontrado");

        const [presupuesto, catalogServices, catalogInsumos, allMenus, roles] = await Promise.all([
            fiesta.presupuestoId ? getPresupuestoById(fiesta.presupuestoId) : Promise.resolve(null),
            getServiciosEmpresa(),
            getInsumos(),
            getMenus(),
            getRoles()
        ]);

        if (!presupuesto) return { success: false, error: "No hay presupuesto vinculado" };

        const adultos = presupuesto.invitadosAdultos || 0;
        const ninos = (presupuesto.invitadosNinos || 0) + (presupuesto.invitadosAdolescentes || 0);
        const totalInv = adultos + ninos;

        let totalCateringCost = 0;
        let totalPersonalCost = 0;
        let totalBebidasCost = 0;
        let totalReposteriaCost = 0;
        let totalProveedorCost = 0;

        const autoCostItems: CostoItem[] = [];

        // 1. SINCRONIZACIÓN DE PERSONAL (SUELDOS + APORTES)
        // Buscamos personal asignado real o proyectamos por presupuesto
        if (fiesta.personalAsignado && fiesta.personalAsignado.length > 0) {
            fiesta.personalAsignado.forEach(pa => {
                const rol = roles.find(r => r.id === pa.rolId);
                const sueldo = pa.eventSalary || rol?.sueldoPorEvento || 0;
                const aportes = (sueldo * (rol?.porcentajeAportesPatronales || 0)) / 100;
                totalPersonalCost += sueldo + aportes;
            });
        }

        // 2. SINCRONIZACIÓN GASTRONÓMICA (MENÚ ASIGNADO)
        if (fiesta.menuAsignadoId) {
            const menu = allMenus.find(m => m.id === fiesta.menuAsignadoId);
            if (menu) {
                const costoPP = menu.items.reduce((s, i) => s + (i.totalDishCost || 0), 0);
                totalCateringCost = costoPP * totalInv;
            }
        }

        // 3. SINCRONIZACIÓN DE BEBIDAS Y REPOSTERÍA (DESDE PLANIFICADOR)
        if (fiesta.bebidas?.categorias) {
            fiesta.bebidas.categorias.filter(c => c.activada).forEach(cat => {
                cat.items.forEach(item => {
                    // Si el ítem viene del catálogo, actualizamos su costo unitario al actual
                    const catalogMatch = catalogInsumos.find(ci => ci.id === item.origenId);
                    const cost = catalogMatch?.valorUnitarioEstimado || item.costoUnitario || 0;
                    totalBebidasCost += cost * (totalInv / 100); // Proyección por cada 100
                });
            });
        }
        if (fiesta.reposteria?.categorias) {
            fiesta.reposteria.categorias.filter(c => c.activada).forEach(cat => {
                cat.items.forEach(item => {
                    const catalogMatch = catalogInsumos.find(ci => ci.id === item.origenId);
                    const cost = catalogMatch?.valorUnitarioEstimado || item.costoEstimado || 0;
                    totalReposteriaCost += cost * (item.cantidad || 1);
                });
            });
        }

        // 4. AUDITORÍA DEL PRESUPUESTO PARA PROVEEDORES EXTERNOS
        presupuesto.itemsPresupuestados.forEach(item => {
            if (item.esRegalo) return;

            const catalogItem = catalogServices.find(c => c.id === item.idServicioCatalogo);
            
            // Si el ítem es un costo de proveedor o personal no incluido arriba
            if (catalogItem?.tipoCosto === 'Proveedor' || catalogItem?.tipoCosto === 'Gasto Fijo') {
                const costoUnitario = catalogItem.valorUnitarioEstimado || 0;
                let qty = item.cantidad || 1;
                
                if (catalogItem.calculationMethod === 'porPersona') qty = totalInv;
                else if (catalogItem.calculationMethod === 'ratio' && catalogItem.invitadosPorUnidad) qty = Math.ceil(totalInv / catalogItem.invitadosPorUnidad);

                const totalLineCost = costoUnitario * qty;
                
                if (totalLineCost > 0) {
                    autoCostItems.push({
                        id: `auto_prov_${catalogItem.id}`,
                        nombre: `${item.nombreServicio} (Costo Catálogo)`,
                        category: catalogItem.tipoCosto === 'Proveedor' ? 'Servicio Proveedor' : 'Otro Costo Directo',
                        montoEstimado: totalLineCost,
                        notes: `Sincronizado de Presupuesto. Proveedor: ${catalogItem.proveedor || 'N/A'}`
                    });
                }
            }
        });

        // 5. ACTUALIZAR OBJETO DE GESTIÓN DE COSTOS
        const currentCosts = fiesta.gestionCostos || defaultGestionCostos;
        
        // Mantener ítems manuales que no sean "auto_prov_"
        const manualItems = (currentCosts.costosItems || []).filter(i => !i.id.startsWith('auto_prov_'));

        const updatedGestion: GestionCostosData = {
            ...currentCosts,
            ingresosTotalesEstimados: presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado,
            costosItems: [...manualItems, ...autoCostItems],
            // Almacenamos los subtotales para referencia rápida en la UI
            others: {
                totalCateringCost,
                totalPersonalCost,
                totalBebidasCost,
                totalReposteriaCost,
                totalProveedorCost: autoCostItems.reduce((s, i) => s + i.montoEstimado, 0)
            }
        };

        await updateGestionCostos(fiestaId, updatedGestion);
        return { success: true };

    } catch (e: any) {
        console.error("Error in syncAllEventCosts:", e);
        return { success: false, error: e.message };
    }
}

/**
 * Sincroniza automáticamente los gastos de lavadero basados en la mantelería contratada.
 */
export async function syncLaundryCosts(fiestaId: string, guests: number, budgetItems: any[]): Promise<void> {
    if (!fiestaId || !budgetItems) return;
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return;

    const costs = fiesta.gestionCostos || { costosItems: [], ingresosTotalesEstimados: 0 };
    const items = [...(costs.costosItems || [])];

    const hasMantel = budgetItems.some(i => i.nombreServicio.toLowerCase().includes('mantel'));
    const hasCompleta = budgetItems.some(i => i.nombreServicio.toLowerCase().includes('completa'));

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
                    notes: 'Generado automáticamente (Lavadero del Sol)'
                });
            }
        } else if (index > -1) {
            items.splice(index, 1);
        }
    };

    if (hasMantel) {
        const units = Math.ceil(guests / 8);
        updateOrCreateCost('Lavado Mantel ($50)', units * 50);
        updateOrCreateCost('Lavado Cubre ($18)', units * 18);
        if (hasCompleta) {
            updateOrCreateCost('Lavado Cubre Silla ($18)', guests * 18);
        }
    }

    await updateGestionCostos(fiestaId, { ...costs, costosItems: items });
}
