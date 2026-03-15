
'use server';

import type { FiestaEnPlanificacion, GestionCostosData, CostoItem, PagoProveedor } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';
import { getPresupuestoById } from '../presupuestos';
import { getServiciosEmpresa } from '../servicios-empresa';
import { getMenus } from '../menus-catering';
import { getRoles } from '../roles';

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
 * Cruza datos de: Presupuesto, Planificador Gastronómico y Personal.
 */
export async function syncAllEventCosts(fiestaId: string): Promise<{ success: boolean; error?: string }> {
    if (!fiestaId) return { success: false, error: "ID no válido" };

    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Evento no encontrado");

        const [presupuesto, catalogo, menus, roles] = await Promise.all([
            fiesta.presupuestoId ? getPresupuestoById(fiesta.presupuestoId) : Promise.resolve(null),
            getServiciosEmpresa(),
            getMenus(),
            getRoles()
        ]);

        if (!presupuesto) return { success: false, error: "No hay presupuesto vinculado" };

        const adultos = presupuesto.invitadosAdultos || 0;
        const ninos = (presupuesto.invitadosNinos || 0) + (presupuesto.invitadosAdolescentes || 0);
        const totalInv = adultos + ninos;

        let totalCateringCost = 0;
        let totalPersonalCost = 0;
        let totalProveedorCost = 0;
        let totalBebidasCost = 0;
        let totalReposteriaCost = 0;

        const manualCostItems: CostoItem[] = [];

        // 1. SINCRONIZACIÓN DE PERSONAL (SUELDOS + APORTES)
        if (fiesta.personalAsignado && fiesta.personalAsignado.length > 0) {
            fiesta.personalAsignado.forEach(pa => {
                const rol = roles.find(r => r.id === pa.rolId);
                const sueldo = pa.eventSalary || rol?.sueldoPorEvento || 0;
                const aportes = (sueldo * (rol?.porcentajeAportesPatronales || 0)) / 100;
                totalPersonalCost += sueldo + aportes;
            });
        }

        // 2. SINCRONIZACIÓN DE GASTRONOMÍA (MENÚ ASIGNADO)
        if (fiesta.menuAsignadoId) {
            const menu = menus.find(m => m.id === fiesta.menuAsignadoId);
            if (menu) {
                const costoPP = menu.items.reduce((s, i) => s + (i.totalDishCost || 0), 0);
                totalCateringCost = costoPP * totalInv;
            }
        }

        // 3. SINCRONIZACIÓN DE BEBIDAS Y REPOSTERÍA (DESDE PLANIFICADOR)
        if (fiesta.bebidas?.categorias) {
            fiesta.bebidas.categorias.filter(c => c.activada).forEach(cat => {
                cat.items.forEach(item => { totalBebidasCost += (item.costoTotal || 0) * (totalInv / 100); });
            });
        }
        if (fiesta.reposteria?.categorias) {
            fiesta.reposteria.categorias.filter(c => c.activada).forEach(cat => {
                cat.items.forEach(item => { totalReposteriaCost += (item.costoEstimado || 0) * (item.cantidad || 1); });
            });
        }

        // 4. ESCANEO INTELIGENTE DEL PRESUPUESTO (PROVEEDORES Y EXTERNOS)
        // Usamos la nueva metadata de 'tipoCosto' del catálogo para categorizar
        presupuesto.itemsPresupuestados.forEach(item => {
            if (item.esRegalo) return;

            const catalogItem = catalogo.find(c => c.id === item.idServicioCatalogo);
            const costoUnitario = catalogItem?.valorUnitarioEstimado || 0;
            
            if (costoUnitario > 0) {
                let qty = item.cantidad || 1;
                // Ajustar cantidad si es por persona
                if (catalogItem?.calculationMethod === 'porPersona' || item.calculationMethod === 'porPersona') {
                    const cat = (item.categoriaServicio || '').toLowerCase();
                    qty = (cat.includes('niño') || cat.includes('infantil')) ? ninos : adultos;
                }

                const lineCost = costoUnitario * qty;

                // Si es un costo de proveedor externo, lo añadimos como item manual para seguimiento de pagos
                if (catalogItem?.tipoCosto === 'Proveedor' && catalogItem.proveedor) {
                    manualCostItems.push({
                        id: `auto_prov_${catalogItem.id}`,
                        nombre: `${catalogItem.nombre} (${catalogItem.proveedor})`,
                        category: 'Servicio Proveedor',
                        montoEstimado: lineCost,
                        notes: 'Sincronizado automáticamente desde el catálogo'
                    });
                } else if (catalogItem?.tipoCosto === 'Personal' && !fiesta.personalAsignado?.length) {
                    // Solo sumar si no calculamos ya por personal asignado arriba
                    totalPersonalCost += lineCost;
                }
            }
        });

        // Actualizar el objeto de gestión de costos de la fiesta
        const currentCosts = fiesta.gestionCostos || defaultGestionCostos;
        const updatedGestion: GestionCostosData = {
            ...currentCosts,
            ingresosTotalesEstimados: presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado,
            costosItems: manualCostItems,
            // Guardamos los totales calculados para la vista
            others: {
                totalCateringCost,
                totalPersonalCost,
                totalBebidasCost,
                totalReposteriaCost,
                totalProveedorCost: manualCostItems.reduce((s,i) => s + i.montoEstimado, 0)
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
        } else {
            updateOrCreateCost('Lavado Cubre Silla ($18)', 0);
        }
    } else {
        ['Lavado Mantel ($50)', 'Lavado Cubre ($18)', 'Lavado Cubre Silla ($18)'].forEach(n => updateOrCreateCost(n, 0));
    }

    await updateGestionCostos(fiestaId, { ...costs, costosItems: items });
}
