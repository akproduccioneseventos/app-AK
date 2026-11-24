'use server';

import type { ListaDeCargaOperativa, CargaOperativaCategoria, CargaOperativaItem, FiestaEnPlanificacion } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import { necesidadPorEquipo } from '@/lib/logistica/necesidad-por-equipo';
import { esFiestaDemo } from '@/lib/events/event-ordering';
import { esFiestaSuspendida } from '@/lib/fiesta/revisar-fiestas';
import { getFiestas, getFiestaById, saveFiesta } from './fiesta.actions';
import { LECTURA_COMPLETA } from '@/lib/fiesta/lectura-completa';
import * as logger from '@/lib/logger';
import { getActivosFijos } from '../activos-fijos';
import { isSameDay } from 'date-fns';
import { verifySession } from '@/lib/auth/session-token';
import {
  createAccesoPersonal,
  getAccesoById,
  getAccesosGenerales,
} from '@/app/actions/accesos-personal';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { requireAppSession, requirePermiso } from '@/lib/auth/require-session';
import { requireEventPermission } from '@/lib/auth/event-access';
import { PERMISOS } from '@/lib/auth/perfiles';
import {
  applyCargaOperativaItemPatch,
  mergeGeneratedCargaWithManualItems,
  mergeCargaOperativaStructure,
  type CargaOperativaItemPatch,
} from '@/lib/logistics/carga-operativa';

const MASTER_TEMPLATE_FILE = 'carga-operativa-master-template.json';

function generarRefCargaAccion(prefijo: string): string {
  const tiempo = Date.now().toString(36).slice(-4).toUpperCase();
  const azar = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ERR-${prefijo}-${tiempo}${azar}`;
}

function describirMotivoCargaAccion(err: unknown, respaldo: string): string {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  const msg = raw.toLowerCase();
  if (msg.includes('sesion') || msg.includes('sesión') || msg.includes('no autorizada') || msg.includes('no autorizado')) {
    return 'Tu sesión venció o no tiene permisos para modificar esta carga.';
  }
  if (msg.includes('fiesta no encontrada')) {
    return 'No se encontró la fiesta en la base de datos.';
  }
  if (msg.includes('el elemento de carga ya no existe')) {
    return 'El equipo ya no está en la lista. Recargá la pantalla.';
  }
  if (msg.includes('tiempo') || msg.includes('timeout') || msg.includes('demorada') || msg.includes('deadline')) {
    return 'La base de datos tardó demasiado en responder. Reintentá en unos segundos.';
  }
  if (msg.includes('permission') || msg.includes('permiso') || msg.includes('unauthenticated')) {
    return 'No se pudo validar el permiso con la base de datos.';
  }
  return respaldo;
}

function sinIndefinidos<V>(valor: V): V {
  if (Array.isArray(valor)) {
    return valor.map((v) => (v === undefined ? null : sinIndefinidos(v))) as unknown as V;
  }
  if (valor && typeof valor === 'object' && Object.getPrototypeOf(valor) === Object.prototype) {
    const limpio: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor as Record<string, unknown>)) {
      if (v !== undefined) limpio[k] = sinIndefinidos(v);
    }
    return limpio as V;
  }
  return valor;
}
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
  const ses = await verifySession();
  const { puede } = await import('@/lib/auth/perfiles');
  const { PERMISOS } = await import('@/lib/auth/perfiles');
  if (ses.success && ses.user && (puede(ses.user, PERMISOS.ORGANIZACION))) return { authorized: true };
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
      getFiestaById(fiestaId, LECTURA_COMPLETA),
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

    if (process.env.AK_USE_LOCAL_JSON_ONLY !== 'true') {
      const { dbAdmin } = await import('@/lib/firebase/server');
      if (dbAdmin) {
        try {
          const ref = dbAdmin.collection('fiestas').doc(input.fiestaId);
          const updatedData = await dbAdmin.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(ref);
            if (!snapshot.exists) throw new Error('Fiesta no encontrada.');
            const fiesta = snapshot.data() as FiestaEnPlanificacion;
            const current = fiesta.listaDeCargaOperativa || { categorias: [], notasGenerales: '' };
            const updated = sinIndefinidos(
              applyCargaOperativaItemPatch(
                current,
                input.categoryId,
                input.itemId,
                allowedPatch,
                operatorName,
              ),
            );
            transaction.update(ref, {
              listaDeCargaOperativa: updated,
              _syncedAt: new Date().toISOString(),
            });
            return updated;
          });
          return { success: true, updatedData };
        } catch (error) {
          const refError = generarRefCargaAccion('CARGA-TX');
          logger.error(
            `[CargaOperativa] (${refError}) Error en transacción al actualizar ítem ${input.itemId} en fiesta ${input.fiestaId}:`,
            logger.compactError(error),
          );
          const motivo = describirMotivoCargaAccion(
            error,
            'No se pudo guardar el cambio en la base de datos.',
          );
          return { success: false, error: `${motivo} (Ref: ${refError})` };
        }
      }
    }

    const fiesta = await getFiestaById(input.fiestaId, LECTURA_COMPLETA);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
    const updatedData = applyCargaOperativaItemPatch(
      fiesta.listaDeCargaOperativa || { categorias: [], notasGenerales: '' },
      input.categoryId,
      input.itemId,
      allowedPatch,
      operatorName,
    );
    const result = await saveFiesta({ ...fiesta, listaDeCargaOperativa: updatedData });
    if (!result.success) return { success: false, error: result.error || 'No se pudo guardar el cambio.' };
    return { success: true, updatedData };
  } catch (error) {
    const refError = generarRefCargaAccion('CARGA');
    logger.error(
      `[CargaOperativa] (${refError}) Error inesperado actualizando ítem ${input.itemId}:`,
      logger.compactError(error),
    );
    return {
      success: false,
      error: `${describirMotivoCargaAccion(error, 'No se pudo actualizar la lista.')} (Ref: ${refError})`,
    };
  }
}

// --- MÓDULO 1: CEREBRO LOGÍSTICO ---

/**
 * Escanea todos los eventos activos en una fecha específica para detectar conflictos de stock.
 */
export async function checkAssetConflicts(
  fiestaId: string,
  date: string,
  items: CargaOperativaItem[],
  opciones?: { listaCompleta?: CargaOperativaItem[] },
): Promise<CargaOperativaItem[]> {
  await requireAppSession();
    const allFiestas = await getFiestas(false); // Solo activas
    const assetsCatalog = await getActivosFijos();
    const otherFiestasSameDay = allFiestas.filter(f => {
      if (f.id === fiestaId || !f.configuracion?.fechaEvento || f.configuracion.fechaEvento !== date) {
        return false;
      }
      if (esFiestaDemo(f) || esFiestaSuspendida(f)) return false;
      const estado = String(f.estado || '').trim().toLowerCase();
      return !['archivado', 'archivada', 'cancelado', 'cancelada', 'cerrado', 'cerrada'].includes(estado);
    });

    // La base es la lista completa que manda la pantalla, o si no la manda, la guardada de
    // esta fiesta. Si hay duda, se cuenta de mas: un aviso de mas se ve, un faltante no.
    const estaFiesta = allFiestas.find(f => f.id === fiestaId);
    const base = opciones?.listaCompleta
      ?? (estaFiesta?.listaDeCargaOperativa?.categorias || []).flatMap(cat => cat.items || []);
    const necesidad = necesidadPorEquipo(base, items);

    return items.map(item => {
        if (!item.origenId) return item;

        const asset = assetsCatalog.find(a => a.id === item.origenId);
        const currentNeed = necesidad.get(item.origenId) ?? (parseFloat(item.cantidad) || 0);
        if (!asset) {
            if (typeof item.availableStockAtDate === 'number') {
                return {
                    ...item,
                    hasConflict: currentNeed > item.availableStockAtDate,
                };
            }
            return item;
        }

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
  // La plantilla maestra la cambia administración u organización, no cualquier sesión.
  for (const permiso of [PERMISOS.ADMINISTRACION, PERMISOS.ORGANIZACION]) {
    if ((await requirePermiso(permiso)).ok) break;
    if (permiso === PERMISOS.ORGANIZACION) return { success: false, error: 'Tu perfil no tiene acceso a esta parte.' };
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
    const fiesta = await requireEventPermission(fiestaId, [PERMISOS.ORGANIZACION, PERMISOS.NOCHE]);

    // Módulo 1: Al guardar, refrescamos los estados de conflicto
    let listaWithConflicts = lista;
    if (fiesta.configuracion.fechaEvento) {
        const updatedCategorias = await Promise.all(lista.categorias.map(async cat => ({
            ...cat,
            items: await checkAssetConflicts(fiestaId, fiesta.configuracion.fechaEvento!, cat.items)
        })));
        listaWithConflicts = { ...lista, categorias: updatedCategorias };
    }

    if (process.env.AK_USE_LOCAL_JSON_ONLY !== 'true') {
      const { dbAdmin } = await import('@/lib/firebase/server');
      if (dbAdmin) {
        try {
          const ref = dbAdmin.collection('fiestas').doc(fiestaId);
          const updatedData = await dbAdmin.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(ref);
            if (!snapshot.exists) throw new Error('Fiesta no encontrada.');
            const currentFiesta = snapshot.data() as FiestaEnPlanificacion;
            const updated = sinIndefinidos(
              mergeCargaOperativaStructure(
                listaWithConflicts,
                currentFiesta.listaDeCargaOperativa || { categorias: [], notasGenerales: '' },
              ),
            );
            transaction.update(ref, {
              listaDeCargaOperativa: updated,
              _syncedAt: new Date().toISOString(),
            });
            return updated;
          });
          return { success: true, updatedData };
        } catch (transactionError) {
          const refError = generarRefCargaAccion('CARGA-LIST');
          logger.error(
            `[CargaOperativa] (${refError}) Error en transacción al guardar lista de ${fiestaId}:`,
            logger.compactError(transactionError),
          );
          const motivo = describirMotivoCargaAccion(
            transactionError,
            'No se pudo guardar la lista de carga en la base de datos.',
          );
          return { success: false, error: `${motivo} (Ref: ${refError})` };
        }
      }
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
    const refError = generarRefCargaAccion('CARGA-LIST');
    logger.error(
      `[CargaOperativa] (${refError}) Error inesperado guardando lista de ${fiestaId}:`,
      logger.compactError(e),
    );
    return {
      success: false,
      error: `${describirMotivoCargaAccion(e, e?.message || 'No se pudo guardar la lista de carga.')} (Ref: ${refError})`,
    };
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
      getFiestaById(fiestaId, LECTURA_COMPLETA),
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
          const porUnidad = Number(asset.cantidad) > 0 ? Number(asset.cantidad) : 1;
          qty = Math.ceil(totalInvitados / asset.invitadosPorUnidad) * porUnidad;
        } else {
          const cantidadFija = Number(asset.cantidad);
          const precioVenta = Number(asset.precioVenta);
          qty = cantidadFija > 0 ? cantidadFija : (precioVenta > 0 ? precioVenta : (asset.cantidadDisponible || 1));
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
