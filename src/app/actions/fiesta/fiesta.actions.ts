'use server';

import type {
    FiestaEnPlanificacion,
    MenuMesaData,
    NumerosMesaData,
    ModulosContratados,
    PersonalAsignadoDetalleStorage,
    CartaTragosData,
    BebidasData,
    BebidaCategoria,
    BebidaItem,
    ReposteriaData,
    ReposteriaCategoria,
    ReposteriaItem,
    DecoracionData,
    DecorationItem,
    GestionCostosData,
    CostoItem,
    ListaDeCargaOperativa,
    CargaOperativaCategoria,
    CargaOperativaItem,
    Tarea,
    ProgramaEventoItem,
} from '@/types/fiesta';
import type { ItemPresupuestado } from '@/types/presupuesto';
import {
    initialFiestaActualData,
    defaultModulosContratados,
    defaultClientPortalSettings,
    defaultBebidasData,
    defaultReposteriaData,
    defaultDecoracion,
    defaultGestionCostos,
} from '@/lib/fiesta-defaults';
import { readData, writeData } from '@/lib/data-service';
import path from 'path';
import fs from 'fs/promises';
import { getPresupuestoById } from '../presupuestos';
import { getRoles } from '../roles';
import { syncLaundryCosts } from './costos.actions';
import { getActivosFijos } from '../activos-fijos';
import * as logger from '@/lib/logger';
import { normalizeInvitationSlug, isValidInvitationSlug } from '@/lib/invitacion-slug';

const FIESTAS_DIR = 'fiestas';
const ARCHIVE_DIR = 'archive';

export async function getHistorialFiestas(): Promise<FiestaEnPlanificacion[]> {
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
  let historiales: FiestaEnPlanificacion[] = [];
  let firestoreSucceeded = false;

  if (isProduction) {
    try {
      const { listCollectionFromFirestore } = await import('@/lib/firebase-sync');
      historiales = (await listCollectionFromFirestore(ARCHIVE_DIR)) as FiestaEnPlanificacion[];
      firestoreSucceeded = true;
    } catch (e) {
      // fall through to filesystem fallback
    }
  }

  if (!firestoreSucceeded) {
    const dataDir = path.join(process.cwd(), 'src', 'data', ARCHIVE_DIR);
    try {
      const archiveFiles = await fs.readdir(dataDir);
      const historialesPromises = archiveFiles
          .filter(file => file.endsWith('.json'))
          .map(file => readData<FiestaEnPlanificacion>(path.join(ARCHIVE_DIR, file), null as any));
      historiales = (await Promise.all(historialesPromises)).filter((f): f is FiestaEnPlanificacion => f !== null);
    } catch (error) {
      historiales = [];
    }
  }

  return Array.from(new Map(historiales.map(f => [f.id, f])).values())
    .sort((a, b) => new Date(b.configuracion.fechaEvento || 0).getTime() - new Date(a.configuracion.fechaEvento || 0).getTime());
}

export async function getFiestas(includeArchived = true): Promise<FiestaEnPlanificacion[]> {
    const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
    let activas: FiestaEnPlanificacion[] = [];
    let firestoreSucceeded = false;

    if (isProduction) {
        try {
            const { listCollectionFromFirestore } = await import('@/lib/firebase-sync');
            activas = (await listCollectionFromFirestore(FIESTAS_DIR)) as FiestaEnPlanificacion[];
            firestoreSucceeded = true;
        } catch (e) {
            // fall through to filesystem fallback
        }
    }

    if (!firestoreSucceeded) {
        const dataDir = path.join(process.cwd(), 'src', 'data', FIESTAS_DIR);
        try {
            const activeFiles = await fs.readdir(dataDir);
            const activasPromises = activeFiles
                .filter(file => file.endsWith('.json'))
                .map(file => readData<FiestaEnPlanificacion>(path.join(FIESTAS_DIR, file), null as any));
            activas = (await Promise.all(activasPromises)).filter((f): f is FiestaEnPlanificacion => f !== null);
        } catch (error) {
            activas = [];
        }
    }

    const archivadas = includeArchived ? await getHistorialFiestas() : [];
    // Filter out any 'Archivado' entries that may have ended up in the active collection
    const activasFiltradas = activas.filter(f => f.estado !== 'Archivado');
    const allFiestas = [...activasFiltradas, ...archivadas];
    return Array.from(new Map(allFiestas.map(item => [item.id, item])).values());
}

export async function getAllFiestas() {
    return getFiestas(true);
}

export async function getFiestaActual(): Promise<FiestaEnPlanificacion> {
    const all = await getFiestas(false);
    if (all.length > 0) {
        return all.sort((a,b) => new Date(b.configuracion.fechaEvento || 0).getTime() - new Date(a.configuracion.fechaEvento || 0).getTime())[0];
    }
    return { ...initialFiestaActualData, id: `fiesta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`};
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

export async function getFiestaBySlug(slug: string): Promise<FiestaEnPlanificacion | null> {
  const normalized = normalizeInvitationSlug(slug);
  if (!normalized) return null;
  const fiestas = await getFiestas(true);
  return fiestas.find(f => f.invitacionSlug === normalized) || null;
}

export async function updateInvitacionSlug(fiestaId: string, slug: string): Promise<{ success: boolean; slug?: string; error?: string }> {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return { success: false, error: 'Evento no encontrado.' };

  const normalized = normalizeInvitationSlug(slug);
  if (!isValidInvitationSlug(normalized)) {
    return { success: false, error: 'El slug debe usar solo letras minúsculas, números y guiones.' };
  }

  const allFiestas = await getFiestas(true);
  const existing = allFiestas.find(f => f.id !== fiestaId && f.invitacionSlug === normalized);
  if (existing) {
    return { success: false, error: 'Ese enlace ya está en uso. Probá con otro.' };
  }

  const result = await saveFiesta({ ...fiesta, invitacionSlug: normalized });
  if (!result.success) {
    return { success: false, error: result.error || 'No se pudo guardar el enlace personalizado.' };
  }

  return { success: true, slug: normalized };
}

// --- HELPERS DE SINCRONIZACIÓN ---

/** Returns true if the item's service name or category contains any of the given keywords (case-insensitive). */
function itemMatchesKeywords(item: ItemPresupuestado, keywords: string[]): boolean {
    const haystack = `${item.nombreServicio} ${item.categoriaServicio || ''} ${item.subcategoria || ''}`.toLowerCase();
    return keywords.some(k => haystack.includes(k.toLowerCase()));
}

/**
 * Merges bebidas items from the budget into the fiesta's bebidas data.
 * Activates matching categories and adds new items without overwriting existing ones.
 */
function syncBebidasFromItems(existing: BebidasData, bebidaItems: ItemPresupuestado[]): BebidasData {
    if (bebidaItems.length === 0) return existing;

    const categorias: BebidaCategoria[] = existing.categorias.map(cat => ({ ...cat, items: [...(cat.items || [])] }));

    const findOrActivateCategory = (catId: string): BebidaCategoria | undefined => {
        let cat = categorias.find(c => c.id === catId);
        if (!cat) {
            const defaultCat = defaultBebidasData.categorias.find(c => c.id === catId);
            if (defaultCat) {
                cat = { ...defaultCat, activada: true, items: [] };
                categorias.push(cat);
            }
        }
        if (cat) cat.activada = true;
        return cat;
    };

    for (const item of bebidaItems) {
        const name = item.nombreServicio.toLowerCase();
        let targetCatId = 'barra_tragos'; // default

        if (name.includes('cerveza')) targetCatId = 'cervezas';
        else if (name.includes('vino') || name.includes('espumante') || name.includes('champagne')) targetCatId = 'vinos_espumantes';
        else if (name.includes('jugo')) targetCatId = 'jugos';
        else if (name.includes('gaseosa') || name.includes('refresco') || name.includes('cola')) targetCatId = 'refrescos_gaseosas';
        else if (name.includes('agua')) targetCatId = 'aguas_saborizadas';
        else if (name.includes('café') || name.includes('cafe') || name.includes('cafetería') || name.includes('cafeteria') || name.includes('té ') || name.includes(' té') || name.includes('infusión')) targetCatId = 'cafeteria';
        else if (name.includes('cóctel') || name.includes('coctel') || name.includes('bienvenida')) targetCatId = 'coctel_bienvenida';

        const cat = findOrActivateCategory(targetCatId);
        if (!cat) continue;

        // Only add if not already present (identified by origenId)
        const alreadyExists = cat.items.some(i => i.origenId === item.idServicioCatalogo);
        if (!alreadyExists) {
            const newItem: BebidaItem = {
                id: `sync_beb_${item.idServicioCatalogo}`,
                nombre: item.nombreServicio,
                cantidadNecesaria: item.cantidad || 1,
                unidadCantidad: item.unidad,
                costoUnitario: item.precioUnitario,
                costoTotal: item.costoTotalItem,
                notas: item.descripcionServicio,
                origenId: item.idServicioCatalogo,
            };
            cat.items.push(newItem);
        }
    }

    return { ...existing, categorias };
}

/**
 * Merges repostería items from the budget into the fiesta's repostería data.
 */
function syncReposteriaFromItems(existing: ReposteriaData, reposteriaItems: ItemPresupuestado[]): ReposteriaData {
    if (reposteriaItems.length === 0) return existing;

    const categorias: ReposteriaCategoria[] = existing.categorias.map(cat => ({ ...cat, items: [...(cat.items || [])] }));

    const findOrActivateCategory = (catId: string): ReposteriaCategoria | undefined => {
        let cat = categorias.find(c => c.id === catId);
        if (!cat) {
            const defaultCat = defaultReposteriaData.categorias.find(c => c.id === catId);
            if (defaultCat) {
                cat = { ...defaultCat, activada: true, items: [] };
                categorias.push(cat);
            }
        }
        if (cat) cat.activada = true;
        return cat;
    };

    for (const item of reposteriaItems) {
        const name = item.nombreServicio.toLowerCase();
        let targetCatId = 'mesa_postres'; // default

        if (name.includes('torta') || name.includes('pastel') || name.includes('cake')) targetCatId = 'mesa_postres';
        else if (name.includes('candy') || name.includes('dulce') || name.includes('golosina')) targetCatId = 'candy_bar';
        else if (name.includes('chocolate') || name.includes('fuente')) targetCatId = 'fuente_chocolate';
        else if (name.includes('helado')) targetCatId = 'mesa_helada';

        const cat = findOrActivateCategory(targetCatId);
        if (!cat) continue;

        const alreadyExists = cat.items.some(i => i.origenId === item.idServicioCatalogo);
        if (!alreadyExists) {
            const newItem: ReposteriaItem = {
                id: `sync_rep_${item.idServicioCatalogo}`,
                nombre: item.nombreServicio,
                description: item.descripcionServicio,
                cantidad: item.cantidad,
                unidad: item.unidad,
                costoEstimado: item.costoTotalItem,
                origenId: item.idServicioCatalogo,
            };
            cat.items.push(newItem);
        }
    }

    return { ...existing, categorias };
}

/**
 * Merges decoración items from the budget into the fiesta's decoración data.
 */
function syncDecoracionFromItems(existing: DecoracionData, decorItems: ItemPresupuestado[]): DecoracionData {
    if (decorItems.length === 0) return existing;

    const currentItems: DecorationItem[] = [...(existing.items || [])];

    for (const item of decorItems) {
        const alreadyExists = currentItems.some(i => i.id === `sync_dec_${item.idServicioCatalogo}`);
        if (!alreadyExists) {
            const newItem: DecorationItem = {
                id: `sync_dec_${item.idServicioCatalogo}`,
                name: item.nombreServicio,
                category: item.subcategoria || item.categoriaServicio,
                quantity: item.cantidad || 1,
                estimatedCost: item.costoTotalItem,
                notes: item.descripcionServicio,
            };
            currentItems.push(newItem);
        }
    }

    return { ...existing, items: currentItems };
}

/**
 * Pre-populates gestionCostos with all non-gift budget line items.
 * Preserves manually-added cost items and updates existing synced items.
 */
function syncCostosFromBudget(existing: GestionCostosData, items: ItemPresupuestado[], totalConDescuento: number): GestionCostosData {
    const SYNC_PREFIX = 'sync_budget_';
    const manualItems = (existing.costosItems || []).filter(i => !i.id.startsWith(SYNC_PREFIX));
    const syncedItems: CostoItem[] = [];

    for (const item of items) {
        if (item.esRegalo) continue;
        syncedItems.push({
            id: `${SYNC_PREFIX}${item.idServicioCatalogo}`,
            nombre: item.nombreServicio,
            category: item.categoriaServicio || 'Otros servicios',
            montoEstimado: Math.round(item.costoTotalItem),
            notas: `Sincronizado desde presupuesto. ${item.descripcionServicio || ''}`.trim(),
        });
    }

    return {
        ...existing,
        ingresosTotalesEstimados: Math.round(totalConDescuento),
        costosItems: [...manualItems, ...syncedItems],
    };
}

/**
 * Pre-populates listaDeCargaOperativa from budget items using the activos fijos catalog.
 * Mirrors the logic of the "Sincronizar desde Presupuesto" button in the UI.
 */
async function syncCargaOperativaFromBudget(
    fiestaId: string,
    existing: ListaDeCargaOperativa,
    items: ItemPresupuestado[],
    totalInvitados: number,
): Promise<ListaDeCargaOperativa> {
    const activos = await getActivosFijos();

    // Map budget item categories/names to activos categories
    const targetAssetCategories = new Set<string>();
    for (const item of items) {
        const cat = (item.categoriaServicio || '').toLowerCase();
        const name = item.nombreServicio.toLowerCase();
        if (cat.includes('discoteca') || name.includes('dj')) targetAssetCategories.add('Discoteca');
        if (cat.includes('decoración') || cat.includes('decoracion') || name.includes('ambientación') || name.includes('ambientacion')) {
            targetAssetCategories.add('Decoración (Activo)');
            targetAssetCategories.add('Mobiliario');
        }
        if (cat.includes('catering') || name.includes('vajilla') || name.includes('mantel') || name.includes('silla') || name.includes('mesa')) {
            targetAssetCategories.add('Vajilla (Activo)');
            targetAssetCategories.add('Mantelería');
            targetAssetCategories.add('Equipamiento de Cocina');
        }
        if (cat.includes('bebida') || name.includes('barra') || name.includes('trago')) {
            targetAssetCategories.add('Barra de Tragos');
        }
    }

    if (targetAssetCategories.size === 0) return existing;

    // Keep existing categories that were added manually or have a different source
    const SYNC_CAT_PREFIX = 'sync_cat_';
    const manualCategorias: CargaOperativaCategoria[] = (existing.categorias || []).filter(c => !c.id.startsWith(SYNC_CAT_PREFIX));
    const newCategories: CargaOperativaCategoria[] = [];

    for (const catName of Array.from(targetAssetCategories)) {
        const matchingAssets = activos.filter(a => a.categoria === catName);
        if (matchingAssets.length === 0) continue;

        const itemsForCat: CargaOperativaItem[] = matchingAssets.map(asset => {
            let qty = '1';
            if (asset.categoria?.includes('Vajilla')) {
                qty = String(totalInvitados);
            } else if (asset.categoria?.includes('Mantelería') && asset.nombre.toLowerCase().includes('mantel')) {
                qty = String(Math.ceil(totalInvitados / 8));
            } else if (asset.invitadosPorUnidad) {
                qty = String(Math.ceil(totalInvitados / asset.invitadosPorUnidad));
            }

            return {
                id: `sync_asset_${asset.id}`,
                nombre: asset.nombre,
                cantidad: qty,
                unidad: asset.unidad || 'Uds.',
                cargado: false,
                origenId: asset.id,
            };
        });

        newCategories.push({
            id: `${SYNC_CAT_PREFIX}${catName.replace(/\s+/g, '_').replace(/[()]/g, '')}`,
            nombre: catName,
            items: itemsForCat,
        });
    }

    return {
        ...existing,
        categorias: [...manualCategorias, ...newCategories],
    };
}

function generateTareasFromServices(modulos: ModulosContratados, eventoTipo: string): Tarea[] {
    const tareas: Tarea[] = [];
    let idCounter = 1;
    const makeId = () => `auto_tarea_${Date.now()}_${idCounter++}`;

    // Tareas generales siempre presentes
    const tareasGenerales = [
        'Confirmar fecha y lugar del evento',
        'Enviar invitaciones a los invitados',
        'Confirmar número final de invitados',
        'Preparar lista de invitados con necesidades especiales',
        'Hacer check de equipo y materiales el día anterior',
    ];
    tareasGenerales.forEach(texto => tareas.push({ id: makeId(), texto, completada: false, asignadaA: 'Organizador', esPredeterminada: true }));

    if (modulos.catering) {
        ['Confirmar menú definitivo con el cliente', 'Calcular insumos y hacer lista de compras', 'Coordinar personal de cocina', 'Verificar restricciones alimentarias de invitados'].forEach(texto =>
            tareas.push({ id: makeId(), texto: `[Catering] ${texto}`, completada: false, asignadaA: 'Organizador', esPredeterminada: true })
        );
    }

    if (modulos.musica) {
        ['Confirmar playlist o setlist con el DJ/Banda', 'Verificar equipo de sonido e iluminación', 'Coordinar horarios de DJ'].forEach(texto =>
            tareas.push({ id: makeId(), texto: `[Música] ${texto}`, completada: false, asignadaA: 'Organizador', esPredeterminada: true })
        );
    }

    if (modulos.fotografia) {
        ['Confirmar horario y lugar con fotógrafo/filmador', 'Preparar lista de fotos especiales requeridas', 'Coordinar acceso del fotógrafo al lugar'].forEach(texto =>
            tareas.push({ id: makeId(), texto: `[Foto/Video] ${texto}`, completada: false, asignadaA: 'Organizador', esPredeterminada: true })
        );
    }

    if (modulos.decoracion) {
        ['Confirmar esquema de decoración con el cliente', 'Coordinar montaje y desmontaje de decoración', 'Verificar disponibilidad de materiales decorativos'].forEach(texto =>
            tareas.push({ id: makeId(), texto: `[Decoración] ${texto}`, completada: false, asignadaA: 'Organizador', esPredeterminada: true })
        );
    }

    // Tareas cliente
    tareas.push({ id: makeId(), texto: 'Confirmar asistencia al evento', completada: false, asignadaA: 'Cliente', esPredeterminada: true });
    tareas.push({ id: makeId(), texto: 'Compartir lista de invitados VIP', completada: false, asignadaA: 'Cliente', esPredeterminada: true });
    if (eventoTipo?.toLowerCase().includes('boda') || eventoTipo?.toLowerCase().includes('casamiento')) {
        tareas.push({ id: makeId(), texto: '[Boda] Confirmar canción de apertura y primer baile', completada: false, asignadaA: 'Cliente', esPredeterminada: true });
        tareas.push({ id: makeId(), texto: '[Boda] Entregar lista de testigos y padrinos', completada: false, asignadaA: 'Cliente', esPredeterminada: true });
    }
    if (eventoTipo?.toLowerCase().includes('xv') || eventoTipo?.toLowerCase().includes('quince')) {
        tareas.push({ id: makeId(), texto: '[XV Años] Confirmar vals de honor y vals sorpresa', completada: false, asignadaA: 'Cliente', esPredeterminada: true });
        tareas.push({ id: makeId(), texto: '[XV Años] Confirmar chambelanes/damas de honor', completada: false, asignadaA: 'Cliente', esPredeterminada: true });
    }

    return tareas;
}

function generateItinerarioSugerido(eventoTipo: string, modulos: ModulosContratados): ProgramaEventoItem[] {
    const items: ProgramaEventoItem[] = [];
    let idCounter = 1;
    const makeId = () => `auto_prog_${Date.now()}_${idCounter++}`;

    const isBoda = eventoTipo?.toLowerCase().includes('boda') || eventoTipo?.toLowerCase().includes('casamiento');
    const isXV = eventoTipo?.toLowerCase().includes('xv') || eventoTipo?.toLowerCase().includes('quince');

    if (isBoda) {
        items.push({ id: makeId(), hora: '18:00', titulo: 'Llegada de invitados', descripcion: 'Recepción y bienvenida en la entrada del salón', icono: '👋' });
        items.push({ id: makeId(), hora: '19:00', titulo: 'Ceremonia', descripcion: 'Ceremonia civil o religiosa de los novios', icono: '💍' });
        items.push({ id: makeId(), hora: '20:00', titulo: 'Cóctel', descripcion: 'Aperitivos y bienvenida formal a los invitados', icono: '🥂' });
        items.push({ id: makeId(), hora: '21:00', titulo: 'Ingreso al salón', descripcion: 'Entrada de los novios y primera danza', icono: '🎊' });
        items.push({ id: makeId(), hora: '21:15', titulo: 'Vals', descripcion: 'Primer baile de los novios', icono: '💃' });
        if (modulos.catering) items.push({ id: makeId(), hora: '21:30', titulo: 'Cena', descripcion: 'Servicio de cena para todos los invitados', icono: '🍽️' });
        if (modulos.musica) items.push({ id: makeId(), hora: '23:00', titulo: 'Pista de baile', descripcion: 'DJ / Banda en vivo — fiesta abierta', icono: '🎶' });
        items.push({ id: makeId(), hora: '01:00', titulo: 'Torta', descripcion: 'Corte de torta nupcial', icono: '🎂' });
        items.push({ id: makeId(), hora: '04:00', titulo: 'Cierre', descripcion: 'Agradecimientos y despedida de invitados', icono: '🌅' });
    } else if (isXV) {
        items.push({ id: makeId(), hora: '19:00', titulo: 'Llegada de invitados', descripcion: 'Recepción y bienvenida en la entrada del salón', icono: '👋' });
        items.push({ id: makeId(), hora: '20:00', titulo: 'Ingreso de la festejada', descripcion: 'Entrada de la quinceañera al salón', icono: '👑' });
        items.push({ id: makeId(), hora: '20:15', titulo: 'Vals de honor', descripcion: 'Primer vals de la quinceañera con su padre/padrino', icono: '💃' });
        items.push({ id: makeId(), hora: '20:30', titulo: 'Vals sorpresa', descripcion: 'Coreografía sorpresa de chambelanes/damas de honor', icono: '🎭' });
        if (modulos.catering) items.push({ id: makeId(), hora: '21:00', titulo: 'Cena', descripcion: 'Servicio de cena para todos los invitados', icono: '🍽️' });
        if (modulos.musica) items.push({ id: makeId(), hora: '22:30', titulo: 'Pista de baile', descripcion: 'DJ en vivo — fiesta abierta', icono: '🎶' });
        items.push({ id: makeId(), hora: '00:30', titulo: 'Torta', descripcion: 'Corte de torta de la quinceañera', icono: '🎂' });
        items.push({ id: makeId(), hora: '03:00', titulo: 'Cierre', descripcion: 'Agradecimientos y despedida de invitados', icono: '🌅' });
    } else {
        // Fiesta general / cumpleaños
        items.push({ id: makeId(), hora: '20:00', titulo: 'Llegada de invitados', descripcion: 'Recepción y bienvenida', icono: '👋' });
        items.push({ id: makeId(), hora: '20:30', titulo: 'Apertura oficial', descripcion: 'Palabras de bienvenida del festejado/organizador', icono: '🎉' });
        if (modulos.catering) items.push({ id: makeId(), hora: '21:00', titulo: 'Cena', descripcion: 'Servicio de cena para todos los invitados', icono: '🍽️' });
        if (modulos.musica) items.push({ id: makeId(), hora: '22:30', titulo: 'Pista de baile', descripcion: 'DJ en vivo — fiesta abierta', icono: '🎶' });
        items.push({ id: makeId(), hora: '00:00', titulo: 'Torta', descripcion: 'Corte de torta y brindis', icono: '🎂' });
        items.push({ id: makeId(), hora: '03:00', titulo: 'Cierre', descripcion: 'Agradecimientos y despedida de invitados', icono: '🌅' });
    }

    return items;
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

    modulos.catering = items.some(i => ['Entrada', 'Plato Principal', 'Postre', 'Servicio de catering', 'Menú Infantil', 'Menú Infantil/Adolescente'].includes(i.categoriaServicio || ''));
    modulos.musica = hasItem('discoteca') || hasItem(' dj') || items.some(i => ['Servicio de discoteca', 'Servicio de entretenimiento'].includes(i.categoriaServicio || ''));
    modulos.fotografia = hasItem('foto') || hasItem('film') || hasItem('video') || items.some(i => ['Servicio de filmación', 'Servicio de fotografía'].includes(i.categoriaServicio || ''));
    modulos.decoracion = items.some(i => i.categoriaServicio === 'Servicio de decoración') || hasItem('decorac') || hasItem('ambientac');
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

    // 6. SINCRONIZAR ESTADO DE LA FIESTA — nunca archivar automáticamente
    // Solo el usuario puede archivar manualmente desde /eventos
    if (presupuesto.estado === 'Facturado') {
        updatedFiesta.estado = 'Facturado';
    } else if (!updatedFiesta.estado || updatedFiesta.estado === 'Archivada') {
        updatedFiesta.estado = 'En Planificación';
    }

    // 7. SINCRONIZAR BEBIDAS — activar categorías y agregar ítems del presupuesto
    const bebidaItems = items.filter(i =>
        i.categoriaServicio === 'Servicio de bebidas' ||
        itemMatchesKeywords(i, ['barra', 'trago', 'cerveza', 'vino', 'espumante', 'champagne', 'licor', 'fernet', 'whisky', 'ron', 'vodka', 'jugo', 'gaseosa', 'refresco', 'agua'])
    );
    if (bebidaItems.length > 0) {
        updatedFiesta.bebidas = syncBebidasFromItems(updatedFiesta.bebidas || defaultBebidasData, bebidaItems);
    }

    // 8. SINCRONIZAR REPOSTERÍA — activar categorías y agregar ítems del presupuesto
    const reposteriaItems = items.filter(i =>
        i.categoriaServicio === 'Servicio de repostería' ||
        itemMatchesKeywords(i, ['torta', 'repostería', 'reposteria', 'dulce', 'candy', 'pastel', 'cake', 'chocolate', 'fuente', 'helado'])
    );
    if (reposteriaItems.length > 0) {
        updatedFiesta.reposteria = syncReposteriaFromItems(updatedFiesta.reposteria || defaultReposteriaData, reposteriaItems);
    }

    // 9. SINCRONIZAR DECORACIÓN — agregar ítems decorativos del presupuesto
    const decorItems = items.filter(i =>
        i.categoriaServicio === 'Servicio de decoración' ||
        itemMatchesKeywords(i, ['decorac', 'ambientac', 'globo', 'flor', 'centro de mesa', 'backdrop'])
    );
    if (decorItems.length > 0) {
        updatedFiesta.decoracion = syncDecoracionFromItems(updatedFiesta.decoracion || defaultDecoracion, decorItems);
    }

    // 10. SINCRONIZAR COSTOS — pre-poblar con todos los ítems del presupuesto
    updatedFiesta.gestionCostos = syncCostosFromBudget(
        updatedFiesta.gestionCostos || defaultGestionCostos,
        items,
        presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado
    );

    // 11. SINCRONIZAR CARGA OPERATIVA — equipamiento y activos fijos relacionados
    updatedFiesta.listaDeCargaOperativa = await syncCargaOperativaFromBudget(
        fiestaId,
        updatedFiesta.listaDeCargaOperativa || { categorias: [] },
        items,
        guests
    );

    // 12. TAREAS AUTOMÁTICAS por servicio (solo si no hay tareas previas)
    if (!updatedFiesta.tareas || updatedFiesta.tareas.length === 0) {
        updatedFiesta.tareas = generateTareasFromServices(modulos, presupuesto.eventoTipo || 'General');
    }

    // 13. ITINERARIO SUGERIDO por tipo de evento (solo si no hay itinerario previo)
    if (!updatedFiesta.programa || updatedFiesta.programa.length === 0) {
        updatedFiesta.programa = generateItinerarioSugerido(presupuesto.eventoTipo || 'General', modulos);
    }

    return await saveFiesta(updatedFiesta);
}

export async function deleteFiesta(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
  try {
    if (isProduction) {
      const { dbAdmin } = await import('@/lib/firebase/server');
      if (dbAdmin) {
        await dbAdmin.collection(FIESTAS_DIR).doc(fiestaId).delete();
        return { success: true };
      }
    }
    // Development: filesystem fallback
    const dataDir = path.join(process.cwd(), 'src', 'data', FIESTAS_DIR);
    const files = await fs.readdir(dataDir);
    const fileToDelete = files.find(f => f === `${fiestaId}.json`);
    if (fileToDelete) {
      await fs.unlink(path.join(dataDir, fileToDelete));
    }
    return { success: true };
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

export async function deleteFiestaArchivada(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
  try {
    if (isProduction) {
      const { dbAdmin } = await import('@/lib/firebase/server');
      if (dbAdmin) {
        // In Firestore the archive doc ID is fiesta_archivada_{date}_{fiestaId}
        // Query by the fiesta's 'id' field to find and delete it
        const snapshot = await dbAdmin.collection(ARCHIVE_DIR).where('id', '==', fiestaId).get();
        if (!snapshot.empty) {
          const batch = dbAdmin.batch();
          snapshot.docs.forEach((doc: { ref: any }) => batch.delete(doc.ref));
          await batch.commit();
          return { success: true };
        }
        return { success: false, error: "Archivo archivado no encontrado." };
      }
    }
    // Development: filesystem fallback
    const dataDir = path.join(process.cwd(), 'src', 'data', ARCHIVE_DIR);
    const files = await fs.readdir(dataDir);
    const fileToDelete = files.find(f => f.endsWith(`_${fiestaId}.json`));
    if (fileToDelete) {
      await fs.unlink(path.join(dataDir, fileToDelete));
      return { success: true };
    }
    return { success: false, error: "Archivo archivado no encontrado." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Resets the planificador by archiving all currently active fiestas.
 * This is a destructive admin-only operation; the UI must require explicit confirmation.
 * In production (Firestore), each active fiesta is archived; in local dev the files are moved.
 */
export async function resetAllActiveFiestas(): Promise<{ success: boolean; archivedCount?: number; errors?: string[]; error?: string }> {
  try {
    const activas = await getFiestas(false);
    const errors: string[] = [];
    let archivedCount = 0;

    for (const fiesta of activas) {
      const result = await archiveFiesta(fiesta.id);
      if (result.success) {
        archivedCount++;
      } else {
        errors.push(`${fiesta.id}: ${result.error}`);
      }
    }

    logger.info('[Planificador] Reinicio del planificador completado.', { archivedCount, errors });

    return { success: true, archivedCount, errors: errors.length ? errors : undefined };
  } catch (error: any) {
    logger.error('[Planificador] Error al reiniciar el planificador:', error);
    return { success: false, error: error.message || 'Error al reiniciar el planificador.' };
  }
}

/**
 * Permanently deletes ALL fiestas (active and archived) from Firestore.
 * This is a destructive admin-only operation; the UI must require explicit confirmation.
 */
export async function deleteAllFiestas(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    const activas = await getFiestas(false);
    const deletedCount = activas.length;

    const { dbAdmin } = await import('@/lib/firebase/server');
    if (dbAdmin) {
      const snapshot = await dbAdmin.collection('fiestas').get();
      const batchSize = 450;
      const docs = snapshot.docs;
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = dbAdmin.batch();
        docs.slice(i, i + batchSize).forEach((doc: { ref: any }) => batch.delete(doc.ref));
        await batch.commit();
      }
    }

    logger.info('[Planificador] Todas las fiestas eliminadas permanentemente por admin.', { deletedCount });
    return { success: true, deletedCount };
  } catch (error: any) {
    logger.error('[Planificador] Error al eliminar todas las fiestas:', error);
    return { success: false, error: error.message || 'Error al eliminar todas las fiestas.' };
  }
}

export async function createFiestaVacia(): Promise<{ success: boolean; newFiestaId?: string; error?: string }> {
    try {
        const newFiesta = {
            ...initialFiestaActualData,
            id: `fiesta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            estado: 'En Planificación' as const,
            configuracion: {
                ...initialFiestaActualData.configuracion,
                fechaEvento: ''
            }
        };

        const result = await saveFiesta(newFiesta);

        if (!result.success) {
            return { success: false, error: result.error || 'No se pudo crear el evento.' };
        }

        return { success: true, newFiestaId: newFiesta.id };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateFiestaPresupuestoId(fiestaId: string, presupuestoId: string | null): Promise<{ success: boolean; error?: string }> {
    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Evento no encontrado.");
        const updatedFiesta: FiestaEnPlanificacion = { ...fiesta, presupuestoId: presupuestoId ?? undefined };
        return await saveFiesta(updatedFiesta);
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function resetFiestaActual(): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: "Función deshabilitada por seguridad" };
}
export async function duplicateFiesta(fiestaId: string): Promise<{ success: boolean; newFiestaId?: string; error?: string }> {
  try {
    const original = await getFiestaById(fiestaId);
    if (!original) throw new Error('Evento no encontrado.');
    const newFiesta: FiestaEnPlanificacion = {
      ...original,
      id: `fiesta_copy_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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

export async function updateCartaTragos(fiestaId: string, data: CartaTragosData) {
  const f = await getFiestaById(fiestaId);
  if (!f) return { success: false };
  return await saveFiesta({ ...f, cartaTragos: data });
}

/**
 * Phase 3: Update post-event data (gallery, NPS, referrals).
 */
export async function updateFiestaPostEvento(
  fiestaId: string,
  data: {
    galeriaUrl?: string;
    galeriaEntregada?: boolean;
    npsScore?: number;
    referidoPor?: string;
    referidosGenerados?: string[];
    postEventoCompletado?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const f = await getFiestaById(fiestaId);
  if (!f) return { success: false, error: 'Evento no encontrado.' };
  return await saveFiesta({ ...f, ...data });
}

/**
 * Crea un nuevo evento/fiesta vinculado a un cliente recién creado.
 * Se usa cuando se crea un cliente directamente (no desde el CRM).
 */
export async function createNewFiestaForCustomer(customer: { id: string; name: string; partyDate?: string; partyType?: string; venueName?: string; guestCount?: number; }): Promise<{ success: boolean; fiestaId?: string; error?: string }> {
  try {
    const newFiesta: FiestaEnPlanificacion = {
      ...initialFiestaActualData,
      id: `fiesta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
