
'use server';

import type { ListaDeCargaOperativa, CargaOperativaCategoria, CargaOperativaItem, FiestaEnPlanificacion } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import { getFiestas, getFiestaById, saveFiesta } from './fiesta.actions';
import { getActivosFijos } from '../activos-fijos';
import { isSameDay } from 'date-fns';
import { verifySession } from '@/lib/auth/session-token';
import {
  createAccesoPersonal,
  getAccesoById,
  getAccesosGenerales,
} from '@/app/actions/accesos-personal';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { requireAppSession } from '@/lib/auth/require-session';
import {
  applyCargaOperativaItemPatch,
  mergeGeneratedCargaWithManualItems,
  mergeCargaOperativaStructure,
  type CargaOperativaItemPatch,
} from '@/lib/logistics/carga-operativa';

const MASTER_TEMPLATE_FILE = 'carga-operativa-master-template.json';
const defaultMasterTemplate: ListaDeCargaOperativa = {
  id: "master",
  name: "Plantilla Maestra de Carga Operativa",
  categorias: [],
};

export type CargaOperativaAccessView = {
  fiestaId: string;
  nombreEvento: string;
  fechaEvento?: string;
  lista: ListaDeCargaOperativa;
  logoUrl?: string | null;
  operatorName?: string;
};

export async function getOrCreateCargaOperativaShareToken(
  fiestaId: string,
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    if (!(await verifySession()).success) {
      return { success: false, error: 'Debes iniciar sesión para compartir esta lista.' };
    }

    const existing = (await getAccesosGenerales()).find((access) =>
      access.fiestaId === fiestaId
      && access.permisos.length === 1
      && access.permisos.includes('carga-operativa')
    );
    if (existing) return { success: true, token: existing.id };

    const created = await createAccesoPersonal({
      nombreAcceso: 'Equipo de carga',
      fiestaId,
      permisos: ['carga-operativa'],
    });
    if (!created.success || !created.acceso) {
      return { success: false, error: created.error || 'No se pudo crear el acceso de carga.' };
    }
    return { success: true, token: created.acceso.id };
  } catch {
    return { success: false, error: 'No se pudo crear el enlace de carga.' };
  }
}

async function getCargaOperativaAuthorization(
  fiestaId: string,
  accessToken?: string,
): Promise<{ authorized: boolean; operatorName?: string }> {
  if ((await verifySession()).success) return { authorized: true };
  if (!accessToken) return { authorized: false };

  const access = await getAccesoById(accessToken);
  const authorized = Boolean(
    access
    && access.permisos.includes('carga-operativa')
    && access.fiestaId === fiestaId,
  );
  return {
    authorized,
    operatorName: authorized ? access?.nombreAcceso : undefined,
  };
}

export async function getCargaOperativaAccessView(
  fiestaId: string,
  accessToken?: string,
): Promise<{ success: boolean; data?: CargaOperativaAccessView; error?: string }> {
  try {
    const authorization = await getCargaOperativaAuthorization(fiestaId, accessToken);
    if (!authorization.authorized) {
      return { success: false, error: 'Acceso no autorizado o vencido.' };
    }

    const [fiesta, settings] = await Promise.all([
      getFiestaById(fiestaId),
      getInvoiceTemplateSettings().catch(() => ({ logoUrl: null })),
    ]);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };

    return {
      success: true,
      data: {
        fiestaId,
        nombreEvento: fiesta.configuracion.nombreEvento,
        fechaEvento: fiesta.configuracion.fechaEvento,
        lista: fiesta.listaDeCargaOperativa || { categorias: [], notasGenerales: '' },
        logoUrl: settings.logoUrl || null,
        operatorName: authorization.operatorName,
      },
    };
  } catch {
    return { success: false, error: 'No se pudo cargar la lista operativa.' };
  }
}

export async function updateCargaOperativaItemState(input: {
  fiestaId: string;
  categoryId: string;
  itemId: string;
  patch: CargaOperativaItemPatch;
  operatorName?: string;
  accessToken?: string;
}): Promise<{ success: boolean; updatedData?: ListaDeCargaOperativa; error?: string }> {
  try {
    const authorization = await getCargaOperativaAuthorization(input.fiestaId, input.accessToken);
    if (!authorization.authorized) {
      return { success: false, error: 'Acceso no autorizado o vencido.' };
    }
    const operatorName = authorization.operatorName || input.operatorName;

    const allowedPatch: CargaOperativaItemPatch = {};
    if (typeof input.patch.cargado === 'boolean') allowedPatch.cargado = input.patch.cargado;
    if (typeof input.patch.retornado === 'boolean') allowedPatch.retornado = input.patch.retornado;
    if (typeof input.patch.cantidad === 'string') allowedPatch.cantidad = input.patch.cantidad;
    if (Object.keys(allowedPatch).length === 0) {
      return { success: false, error: 'No hay cambios válidos para guardar.' };
    }

    try {
      const { dbAdmin } = await import('@/lib/firebase/server');
      if (dbAdmin) {
        const ref = dbAdmin.collection('fiestas').doc(input.fiestaId);
        const updatedData = await dbAdmin.runTransaction(async (transaction) => {
          const snapshot = await transaction.get(ref);
          if (!snapshot.exists) throw new Error('Fiesta no encontrada.');
          const fiesta = snapshot.data() as FiestaEnPlanificacion;
          const current = fiesta.listaDeCargaOperativa || { categorias: [], notasGenerales: '' };
          const updated = applyCargaOperativaItemPatch(
            current,
            input.categoryId,
            input.itemId,
            allowedPatch,
            operatorName,
          );
          transaction.update(ref, {
            listaDeCargaOperativa: updated,
            _syncedAt: new Date().toISOString(),
          });
          return updated;
        });
        return { success: true, updatedData };
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'production') throw error;
    }

    const fiesta = await getFiestaById(input.fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    const updatedData = applyCargaOperativaItemPatch(
      fiesta.listaDeCargaOperativa || { categorias: [], notasGenerales: '' },
      input.categoryId,
      input.itemId,
      allowedPatch,
      operatorName,
    );
    const result = await saveFiesta({ ...fiesta, listaDeCargaOperativa: updatedData });
    if (!result.success) return { success: false, error: result.error };
    return { success: true, updatedData };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo actualizar la lista.',
    };
  }
}

// --- MÓDULO 1: CEREBRO LOGÍSTICO ---

/**
 * Escanea todos los eventos activos en una fecha específica para detectar conflictos de stock.
 */
export async function checkAssetConflicts(fiestaId: string, date: string, items: CargaOperativaItem[]): Promise<CargaOperativaItem[]> {
  await requireAppSession();
    const allFiestas = await getFiestas(false); // Solo activas
    const assetsCatalog = await getActivosFijos();
    const otherFiestasSameDay = allFiestas.filter(f => f.id !== fiestaId && f.configuracion.fechaEvento && f.configuracion.fechaEvento === date);

    return items.map(item => {
        if (!item.origenId) return item;

        const asset = assetsCatalog.find(a => a.id === item.origenId);
        if (!asset) return item;

        const totalStock = asset.cantidadDisponible || 0;
        
        // Calcular cuánto de este activo están usando otros eventos el mismo día
        let sumOtherEvents = 0;
        otherFiestasSameDay.forEach(f => {
            f.listaDeCargaOperativa?.categorias.forEach(cat => {
                cat.items.forEach(otherItem => {
                    if (otherItem.origenId === item.origenId) {
                        sumOtherEvents += parseFloat(otherItem.cantidad) || 0;
                    }
                });
            });
        });

        const currentNeed = parseFloat(item.cantidad) || 0;
        const availableStock = totalStock - sumOtherEvents;
        const hasConflict = currentNeed > availableStock;

        return {
            ...item,
            hasConflict,
            availableStockAtDate: Math.max(0, availableStock)
        };
    });
}

// --- ACCIONES PARA LA PLANTILLA MAESTRA ---

/**
 * Obtiene la plantilla maestra de Carga Operativa.
 */
export async function getCargaOperativaMasterTemplate(): Promise<ListaDeCargaOperativa> {
  await requireAppSession();
  return readData<ListaDeCargaOperativa>(MASTER_TEMPLATE_FILE, defaultMasterTemplate);
}

/**
 * Guarda la plantilla maestra de Carga Operativa.
 * @param data Los nuevos datos de la plantilla.
 */
export async function saveCargaOperativaMasterTemplate(
  data: ListaDeCargaOperativa
): Promise<{ success: boolean; data?: ListaDeCargaOperativa; error?: string }> {
  if (!(await verifySession()).success) {
    return { success: false, error: 'Acceso no autorizado.' };
  }
  try {
    const dataToSave = { ...data, id: 'master', name: 'Plantilla Maestra de Carga Operativa' };
    await writeData(MASTER_TEMPLATE_FILE, dataToSave);
    return { success: true, data: dataToSave };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}


// --- ACCIONES PARA LA FIESTA ESPECÍFICA ---

export async function updateListaDeCargaOperativa(fiestaId: string, lista: ListaDeCargaOperativa): Promise<{ success: boolean; updatedData?: ListaDeCargaOperativa; error?: string }> {
  try {
    if (!(await verifySession()).success) {
      return { success: false, error: 'Debes iniciar sesión para editar la estructura de carga.' };
    }
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error("Fiesta no encontrada");

    // Módulo 1: Al guardar, refrescamos los estados de conflicto
    let listaWithConflicts = lista;
    if (fiesta.configuracion.fechaEvento) {
        const updatedCategorias = await Promise.all(lista.categorias.map(async cat => ({
            ...cat,
            items: await checkAssetConflicts(fiestaId, fiesta.configuracion.fechaEvento!, cat.items)
        })));
        listaWithConflicts = { ...lista, categorias: updatedCategorias };
    }

    try {
      const { dbAdmin } = await import('@/lib/firebase/server');
      if (dbAdmin) {
        const ref = dbAdmin.collection('fiestas').doc(fiestaId);
        const updatedData = await dbAdmin.runTransaction(async (transaction) => {
          const snapshot = await transaction.get(ref);
          if (!snapshot.exists) throw new Error('Fiesta no encontrada.');
          const currentFiesta = snapshot.data() as FiestaEnPlanificacion;
          const updated = mergeCargaOperativaStructure(
            listaWithConflicts,
            currentFiesta.listaDeCargaOperativa || { categorias: [], notasGenerales: '' },
          );
          transaction.update(ref, {
            listaDeCargaOperativa: updated,
            _syncedAt: new Date().toISOString(),
          });
          return updated;
        });
        return { success: true, updatedData };
      }
    } catch (transactionError) {
      if (process.env.NODE_ENV === 'production') throw transactionError;
    }

    const updatedData = mergeCargaOperativaStructure(
      listaWithConflicts,
      fiesta.listaDeCargaOperativa || { categorias: [], notasGenerales: '' },
    );
    const updatedFiesta = { ...fiesta, listaDeCargaOperativa: updatedData };
    const result = await saveFiesta(updatedFiesta);
    if (!result.success) throw new Error(result.error);
    return { success: true, updatedData: result.fiesta?.listaDeCargaOperativa || updatedData };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Genera (o regenera) la lista de carga operativa de una fiesta a partir del catálogo
 * de activos fijos, calculando cantidades en base al número de invitados del evento.
 *
 * Lógica de cálculo:
 * - calculationMethod === 'porPersona': cantidad = totalInvitados
 * - calculationMethod === 'ratio' && invitadosPorUnidad: cantidad = Math.ceil(totalInvitados / invitadosPorUnidad)
 * - calculationMethod === 'fijo' || default: cantidad = precioVenta (si existe) || cantidadDisponible || 1
 *
 * Agrupa los activos por su `categoria` formando CargaOperativaCategorias.
 * Preserva los items marcados como `cargado: true` o `retornado: true` si el item ya existe (por origenId).
 */
export async function generateCargaFromActivos(
  fiestaId: string,
  totalInvitados: number
): Promise<{ success: boolean; updatedData?: ListaDeCargaOperativa; error?: string }> {
  await requireAppSession();
  try {
    const [fiesta, activos] = await Promise.all([
      getFiestaById(fiestaId),
      getActivosFijos(),
    ]);

    if (!fiesta) throw new Error('Fiesta no encontrada');

    const byCategory: Record<string, typeof activos> = {};
    activos.forEach((a) => {
      const cat = a.categoria || 'General';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(a);
    });

    const existingItemsByOrigenId: Record<string, CargaOperativaItem> = {};
    (fiesta.listaDeCargaOperativa?.categorias || []).forEach((cat) => {
      cat.items.forEach((item) => {
        if (item.origenId) existingItemsByOrigenId[item.origenId] = item;
      });
    });

    const categorias: CargaOperativaCategoria[] = Object.entries(byCategory).map(([catName, assets]) => {
      const items: CargaOperativaItem[] = assets.map((asset) => {
        let qty: number;
        if (asset.calculationMethod === 'porPersona') {
          qty = totalInvitados;
        } else if (asset.calculationMethod === 'ratio' && asset.invitadosPorUnidad && asset.invitadosPorUnidad > 0) {
          qty = Math.ceil(totalInvitados / asset.invitadosPorUnidad);
        } else {
          const precioVenta = Number(asset.precioVenta);
          qty = precioVenta > 0 ? precioVenta : (asset.cantidadDisponible || 1);
        }

        const existing = existingItemsByOrigenId[asset.id];
        return {
          id: `gen_${asset.id}`,
          nombre: asset.nombre,
          cantidad: String(qty),
          unidad: asset.unidad || 'Uds.',
          cargado: existing?.cargado || false,
          retornado: existing?.retornado || false,
          origenId: asset.id,
          notas: asset.notas || '',
        };
      });

      const categorySlug = catName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

      return {
        id: `cat_${categorySlug}`,
        nombre: catName,
        items,
      };
    });

    const generatedLista: ListaDeCargaOperativa = {
      id: fiesta.listaDeCargaOperativa?.id || 'lista_auto',
      name: 'Lista de Carga (Generada desde Activos)',
      categorias,
      notasGenerales: fiesta.listaDeCargaOperativa?.notasGenerales || '',
    };

    const newLista = mergeGeneratedCargaWithManualItems(
      generatedLista,
      fiesta.listaDeCargaOperativa || { categorias: [], notasGenerales: '' },
    );

    return await updateListaDeCargaOperativa(fiestaId, newLista);
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
