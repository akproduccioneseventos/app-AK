
'use server';

import type { FiestaEnPlanificacion, MenuMesaData, NumerosMesaData, ModulosContratados, PersonalAsignadoDetalleStorage } from '@/types/fiesta';
import { initialFiestaActualData, defaultModulosContratados, defaultClientPortalSettings } from '@/lib/fiesta-defaults';
import { readData, writeData } from '@/lib/data-service';
import path from 'path';
import fs from 'fs/promises';
import { getPresupuestoById } from '../presupuestos';
import { getRoles } from '../roles';
import { syncLaundryCosts } from './costos.actions';

const FIESTAS_DIR = 'fiestas';
const ARCHIVE_DIR = 'archive';

export async function getHistorialFiestas(): Promise<FiestaEnPlanificacion[]> {
  const dataDir = path.join(process.cwd(), 'src', 'data', ARCHIVE_DIR);
  try {
    const archiveFiles = await fs.readdir(dataDir);
    const historialesPromises = archiveFiles
        .filter(file => file.endsWith('.json'))
        .map(file => readData<FiestaEnPlanificacion>(path.join(ARCHIVE_DIR, file), null as any));
    
    const historiales = await Promise.all(historialesPromises);
    return historiales.filter((f): f is FiestaEnPlanificacion => f !== null)
      .sort((a, b) => new Date(b.configuracion.fechaEvento || 0).getTime() - new Date(a.configuracion.fechaEvento || 0).getTime());
  } catch (error) {
    return [];
  }
}

export async function getFiestas(includeArchived = true): Promise<FiestaEnPlanificacion[]> {
    const dataDir = path.join(process.cwd(), 'src', 'data', FIESTAS_DIR);
    try {
        const activeFiles = await fs.readdir(dataDir);
        const activasPromises = activeFiles
            .filter(file => file.endsWith('.json'))
            .map(file => readData<FiestaEnPlanificacion>(path.join(FIESTAS_DIR, file), null as any));
        
        const activas = (await Promise.all(activasPromises)).filter((f): f is FiestaEnPlanificacion => f !== null);
        const archivadas = includeArchived ? await getHistorialFiestas() : [];
        
        const allFiestas = [...activas, ...archivadas];
        return Array.from(new Map(allFiestas.map(item => [item.id, item])).values());
    } catch (error) {
        return [];
    }
}

export async function getAllFiestas() {
    return getFiestas(true);
}

export async function getFiestaActual(): Promise<FiestaEnPlanificacion> {
    const all = await getFiestas(false);
    if (all.length > 0) {
        return all.sort((a,b) => new Date(b.configuracion.fechaEvento || 0).getTime() - new Date(a.configuracion.fechaEvento || 0).getTime())[0];
    }
    return { ...initialFiestaActualData, id: `fiesta_${Date.now()}`};
}

export async function saveFiesta(fiestaData: FiestaEnPlanificacion): Promise<{ success: boolean; fiesta?: FiestaEnPlanificacion; error?: string }> {
  try {
    const filePath = path.join(FIESTAS_DIR, `${fiestaData.id}.json`);
    await writeData(filePath, fiestaData);
    return { success: true, fiesta: fiestaData };
  } catch (error: any) {
    return { success: false, error: "No se pudo guardar el evento." };
  }
}

export async function getFiestaById(fiestaId: string): Promise<FiestaEnPlanificacion | null> {
    const activePath = path.join(FIESTAS_DIR, `${fiestaId}.json`);
    try {
        const active = await readData<FiestaEnPlanificacion | null>(activePath, null);
        if (active && active.id === fiestaId) return active;
    } catch (e) {}
    const archivadas = await getHistorialFiestas();
    return archivadas.find(f => f.id === fiestaId) || null;
}

/**
 * MOTOR DE SINCRONIZACIÓN MAESTRA
 * Dispara la configuración operativa de la fiesta basándose en el presupuesto aceptado.
 */
export async function syncFiestaFromBudget(fiestaId: string) {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta || !fiesta.presupuestoId) return { success: false, error: "Fiesta o presupuesto no encontrado" };

    const presupuesto = await getPresupuestoById(fiesta.presupuestoId);
    if (!presupuesto) return { success: false, error: "Presupuesto no encontrado" };

    const roles = await getRoles();
    const updatedFiesta = { ...fiesta };
    
    const guests = presupuesto.invitadosCantidad || 100;
    const items = presupuesto.itemsPresupuestados || [];

    // 1. ACTIVACIÓN DE MÓDULOS
    const modulos: ModulosContratados = { ...defaultModulosContratados };
    const hasItem = (term: string) => items.some(i => i.nombreServicio.toLowerCase().includes(term.toLowerCase()));

    modulos.catering = items.some(i => ['Entrada', 'Plato Principal', 'Postre'].includes(i.categoriaServicio || ''));
    modulos.musica = hasItem('discoteca') || hasItem(' dj');
    modulos.fotografia = hasItem('foto') || hasItem('film') || hasItem('video');
    modulos.regalos = true; // Siempre activo para coordinar
    
    updatedFiesta.modulosContratados = modulos;

    // 2. CÁLCULO DE PERSONAL AUTOMÁTICO (VACANTES)
    const personalReq: PersonalAsignadoDetalleStorage[] = [];
    
    const addVacantes = (roleSearch: string, qty: number) => {
        const rol = roles.find(r => r.nombre.toLowerCase().includes(roleSearch.toLowerCase()));
        if (rol) {
            for (let i = 0; i < qty; i++) {
                personalReq.push({
                    empleadoId: '', // Vacante
                    rolId: rol.id,
                    eventSalary: rol.sueldoPorEvento
                });
            }
        }
    };

    // Regla: 1 mozo cada 25 invitados (si hay catering)
    if (modulos.catering) {
        addVacantes('Mozo', Math.ceil(guests / 25));
        addVacantes('Ayudante de Cocina', Math.ceil(guests / 50));
    }

    // Regla: 1 utilero cada 25 invitados para logística
    addVacantes('Utilero', Math.ceil(guests / 25));

    // Regla: Especialistas según presupuesto
    if (modulos.musica) addVacantes('DJ', 1);
    if (hasItem('asado')) addVacantes('Asador', 1);
    if (hasItem('barra') || hasItem('trago')) addVacantes('Barman', Math.ceil(guests / 75));

    // Solo actualizar si no hay personal asignado manualmente aún para no borrar trabajo
    if (!updatedFiesta.personalAsignado || updatedFiesta.personalAsignado.length === 0) {
        updatedFiesta.personalAsignado = personalReq;
    }

    // 3. ACTUALIZAR CONFIGURACIÓN DE PORTAL
    updatedFiesta.clientPortalSettings = {
        ...defaultClientPortalSettings,
        enabled: true,
        checklist: { visible: true, editable: true },
        itinerario: { visible: true }
    };

    // 4. SINCRONIZAR LAVADERO
    await syncLaundryCosts(fiestaId, guests, items);

    // 5. ACTUALIZAR CONFIG GENERAL
    updatedFiesta.configuracion = {
        ...updatedFiesta.configuracion,
        nombreEvento: `${presupuesto.eventoTipo} de ${presupuesto.clienteNombre}`,
        fechaEvento: presupuesto.eventoFecha,
        invitadosEstimados: guests,
        invitadosAdultos: presupuesto.invitadosAdultos,
        invitadosNinos: presupuesto.invitadosNinos,
        invitadosAdolescentes: presupuesto.invitadosAdolescentes,
        presupuestoEstimado: presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado,
        nombreLugar: presupuesto.salonFiestas
    };

    return await saveFiesta(updatedFiesta);
}

export async function deleteFiesta(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  const dataDir = path.join(process.cwd(), 'src', 'data', FIESTAS_DIR);
  try {
    const files = await fs.readdir(dataDir);
    const fileToDelete = files.find(f => f.includes(fiestaId) && f.endsWith('.json'));
    if (fileToDelete) {
        await fs.unlink(path.join(dataDir, fileToDelete));
        return { success: true };
    }
    return { success: false, error: "Archivo no encontrado." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function archiveFiesta(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error("Evento no encontrado.");
    const datePart = fiesta.configuracion.fechaEvento ? new Date(fiesta.configuracion.fechaEvento).toISOString().split('T')[0] : 'sin-fecha';
    const archiveFilename = `fiesta_archivada_${datePart}_${fiesta.id}.json`;
    await writeData(path.join(ARCHIVE_DIR, archiveFilename), fiesta);
    await deleteFiesta(fiestaId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resetFiestaActual(): Promise<{ success: boolean; error?: string }> {
    try {
        const activas = await getFiestas(false);
        for (const f of activas) { await archiveFiesta(f.id); }
        const newFiesta = { ...initialFiestaActualData, id: `fiesta_${Date.now()}`};
        await saveFiesta(newFiesta);
        return { success: true };
    } catch(e: any) {
        return { success: false, error: e.message };
    }
}

export async function duplicateFiesta(fiestaId: string): Promise<{ success: boolean; newFiestaId?: string; error?: string }> {
  try {
    const original = await getFiestaById(fiestaId);
    if (!original) throw new Error('Evento no encontrado.');
    const newFiesta: FiestaEnPlanificacion = {
      ...original,
      id: `fiesta_copy_${Date.now()}`,
      configuracion: { ...original.configuracion, nombreEvento: `[COPIA] ${original.configuracion.nombreEvento}` },
      presupuestoId: undefined, invoiceIds: [], pagosProveedores: [],
    };
    const result = await saveFiesta(newFiesta);
    return result.success ? { success: true, newFiestaId: newFiesta.id } : { success: false, error: result.error };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addInvoiceId(fiestaId: string, invoiceId: string) {
  const f = await getFiestaById(fiestaId);
  if (!f) return { success: false };
  return await saveFiesta({ ...f, invoiceIds: [...(f.invoiceIds || []), invoiceId] });
}

export async function removeInvoiceId(fiestaId: string, invoiceId: string) {
  const f = await getFiestaById(fiestaId);
  if (!f) return { success: false };
  return await saveFiesta({ ...f, invoiceIds: (f.invoiceIds || []).filter(id => id !== invoiceId) });
}

export async function updateMenuMesa(fiestaId: string, menuData: MenuMesaData) {
  const f = await getFiestaById(fiestaId);
  if (!f) return { success: false };
  return await saveFiesta({ ...f, menuMesa: menuData });
}

export async function updateNumerosMesa(fiestaId: string, data: NumerosMesaData) {
  const f = await getFiestaById(fiestaId);
  if (!f) return { success: false };
  return await saveFiesta({ ...f, numerosMesa: data });
}

/**
 * Crea un nuevo evento/fiesta vinculado a un cliente recién creado.
 * Se usa cuando se crea un cliente directamente (no desde el CRM).
 */
export async function createNewFiestaForCustomer(customer: { id: string; name: string; partyDate?: string; partyType?: string; venueName?: string; guestCount?: number; }): Promise<{ success: boolean; fiestaId?: string; error?: string }> {
  try {
    const newFiesta: FiestaEnPlanificacion = {
      ...initialFiestaActualData,
      id: `fiesta_${Date.now()}`,
      estado: 'En Planificación',
      configuracion: {
        ...initialFiestaActualData.configuracion,
        clienteId: customer.id,
        nombreEvento: customer.partyType ? `${customer.partyType} de ${customer.name}` : `Evento de ${customer.name}`,
        fechaEvento: customer.partyDate || '',
        nombreLugar: customer.venueName || '',
        invitadosEstimados: customer.guestCount || 0,
      },
      modulosContratados: { ...defaultModulosContratados },
    };
    const result = await saveFiesta(newFiesta);
    return result.success ? { success: true, fiestaId: newFiesta.id } : { success: false, error: result.error };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
