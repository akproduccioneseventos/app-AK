'use server';

import type { FiestaEnPlanificacion, GestionCostosData, CostoItem, PagoProveedor } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';
import { getPresupuestoById } from '../presupuestos';
import { getGuestCountForItem } from '@/lib/calculations';
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
        const adolescentes = presupuesto.invitadosAdolescentes || 0;
        const ninos = presupuesto.invitadosNinos || 0;
        const totalInv = adultos + adolescentes + ninos;

        let totalCateringCost = 0;
        let totalPersonalCost = 0;
        let totalBebidasCost = 0;
        let totalReposteriaCost = 0;

        const autoCostItems: CostoItem[] = [];

        // 1. SINCRONIZACIÓN DE PERSONAL (SUELDOS + APORTES)
        // Incluye vacantes proyectadas si no hay empleados asignados
        if (fiesta.personalAsignado && fiesta.personalAsignado.length > 0) {
            fiesta.personalAsignado.forEach(pa => {
                const rol = roles.find(r => r.id === pa.rolId);
                const sueldo = pa.eventSalary || rol?.sueldoPorEvento || 0;
                const aportes = (sueldo * (rol?.porcentajeAportesPatronales || 0)) / 100;
                totalPersonalCost += sueldo + aportes;
            });
        }

        // 2. SINCRONIZACIÓN GASTRONÓMICA (RECETAS)
        if (fiesta.menuAsignadoId) {
            const menu = allMenus.find(m => m.id === fiesta.menuAsignadoId);
            if (menu) {
                menu.items.forEach(plato => {
                    const targetGuests = getGuestCountForItem({ nombreServicio: plato.name, categoriaServicio: plato.type }, adultos, adolescentes, ninos);
                    totalCateringCost += (plato.totalDishCost || 0) * targetGuests;
                });
            }
        }

        // 3. SINCRONIZACIÓN DE BEBIDAS Y REPOSTERÍA
        if (fiesta.bebidas?.categorias) {
            fiesta.bebidas.categorias.filter(c => c.activada).forEach(cat => {
                cat.items.forEach(item => {
                    const cost = item.costoUnitario || 0;
                    const qtyPerPerson = item.cantidadNecesaria || 0;
                    totalBebidasCost += cost * qtyPerPerson * totalInv;
                });
            });
        }
        if (fiesta.reposteria?.categorias) {
            fiesta.reposteria.categorias.filter(c => c.activada).forEach(cat => {
                cat.items.forEach(item => {
                    totalReposteriaCost += (item.costoEstimado || 0) * (item.cantidad || 1);
                });
            });
        }

        // 4. AUDITORÍA DEL PRESUPUESTO (PROVEEDORES EXTERNOS)
        presupuesto.itemsPresupuestados.forEach(item => {
            if (item.esRegalo) return;
            const catalogItem = catalogServices.find(c => c.id === item.idServicioCatalogo);
            
            // Si es proveedor, salón o gasto fijo, calculamos su costo real para la empresa
            if (catalogItem?.tipoCosto === 'Proveedor' || catalogItem?.tipoCosto === 'Gasto Fijo' || catalogItem?.categoria?.includes('Salón')) {
                const costoUnitario = catalogItem.valorUnitarioEstimado || 0;
                const targetGuests = getGuestCountForItem({ nombreServicio: item.nombreServicio, categoriaServicio: item.categoriaServicio, subcategoria: item.subcategoria }, adultos, adolescentes, ninos);
                
                let qty = item.cantidad || 1;
                if (catalogItem.calculationMethod === 'porPersona') qty = targetGuests;
                else if (catalogItem.calculationMethod === 'ratio' && catalogItem.invitadosPorUnidad) qty = Math.ceil(targetGuests / catalogItem.invitadosPorUnidad);

                const totalLineCost = costoUnitario * qty;
                if (totalLineCost > 0) {
                    autoCostItems.push({
                        id: `auto_prov_${catalogItem.id}`,
                        nombre: `${item.nombreServicio} (Costo Proveedor)`,
                        category: 'Servicio Proveedor',
                        montoEstimado: Math.round(totalLineCost),
                        notes: `Sincronizado de Presupuesto.`
                    });
                }
            }
        });

        const currentCosts = fiesta.gestionCostos || { costosItems: [], ingresosTotalesEstimados: 0 };
        const manualItems = (currentCosts.costosItems || []).filter(i => !i.id.startsWith('auto_prov_'));

        const updatedGestion: GestionCostosData = {
            ...currentCosts,
            ingresosTotalesEstimados: Math.round(presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado),
            costosItems: [...manualItems, ...autoCostItems],
            others: {
                totalCateringCost: Math.round(totalCateringCost),
                totalPersonalCost: Math.round(totalPersonalCost),
                totalBebidasCost: Math.round(totalBebidasCost),
                totalReposteriaCost: Math.round(totalReposteriaCost),
                totalProveedorCost: Math.round(autoCostItems.reduce((s, i) => s + i.montoEstimado, 0))
            }
        };

        await updateGestionCostos(fiestaId, updatedGestion);
        return { success: true };

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

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
                items[index].montoEstimado = Math.round(amount);
            } else {
                items.push({
                    id: `laundry_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    nombre: name,
                    category: 'Servicio Proveedor',
                    montoEstimado: Math.round(amount),
                    notes: 'Auto-generado: Lavadero del Sol'
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
