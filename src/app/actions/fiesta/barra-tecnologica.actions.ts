'use server';

import path from 'path';
import type { Firestore, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import type { FiestaEnPlanificacion, Trago } from '@/types/fiesta';
import type { ServicioEmpresa } from '@/types/empresa';
import type {
  BarDrinkOrder,
  BarDrinkOrderStatus,
  BarStockMovement,
  BarTechnologyData,
  BarTechnologyDashboard,
  BarTechnologySettings,
  CreateBarDrinkOrderInput,
  PublicBarTechnologyDashboard,
} from '@/types/barra-tecnologica';
import { defaultCartaTragosData } from '@/lib/fiesta-defaults';
import { mergeMasterTragosWithFiesta } from '@/lib/carta-tragos-master';
import { getCartaTragosMaster } from '@/app/actions/carta-tragos-master.actions';
import { getFiestaById, saveFiesta } from './fiesta.actions';
import { uploadToStorage } from '@/lib/firebase/storage';
import { createSocialMediaPostFromUrlForStation } from '@/app/actions/social-gallery';
import { createEntertainmentAccessToken } from '@/lib/auth/entertainment-token';
import { calculateActualStockMovement, getBarScheduleError, isTruthyFollowConfirmation, isValidBarOrderTransition, normalizeBarTime } from '@/lib/barra-tecnologica';
import { invalidateInsumosCache } from '@/app/actions/insumos';
import { readData, writeData } from '@/lib/data-service';
import * as logger from '@/lib/logger';
import { requireAppSession } from '@/lib/auth/require-session';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';

const BAR_ORDERS_COLLECTION = 'bar_drink_orders';
const MAX_BAR_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_BAR_VIDEO_SIZE = 60 * 1024 * 1024;

const DEFAULT_BAR_SETTINGS: BarTechnologySettings = {
  enabled: true,
  title: 'Barra tecnologica AK',
  subtitle: 'Elegí tu trago en la pantalla y el barman lo ve al instante.',
  guestPrompt: 'Toca un trago, confirma tu pedido y despues sacate una foto para el muro social.',
  barmanTitle: 'Pedidos de barra en vivo',
  hashtag: '#AKProducciones',
  instagramHandle: '@akproducciones',
  brandText: 'Compartí tu foto y etiquetá a AK Producciones',
  accentColor: '#dc2626',
  requireGuestName: false,
  allowPhotoCapture: true,
  autoPublishPhotos: true,
  showIngredients: true,
  showAlcoholFreeTag: true,
  showDrinkDescription: true,
  showDrinkVideo: true,
  requireSocialFollowForPhotos: true,
  socialFollowPrompt: 'Para subir tu foto al muro, primero seguinos en redes y despues confirma en la pantalla.',
};

function sanitizeText(value?: string, fallback = '', maxLength = 160) {
  return String(value || fallback).trim().slice(0, maxLength);
}

function sanitizeHashtag(value?: string) {
  const clean = sanitizeText(value, DEFAULT_BAR_SETTINGS.hashtag)
    .replace(/\s+/g, '')
    .replace(/[^#\w]/g, '');
  const withHash = clean.startsWith('#') ? clean : `#${clean || 'AKProducciones'}`;
  return withHash.length > 1 ? withHash : DEFAULT_BAR_SETTINGS.hashtag;
}

function getDefaultSettings(fiesta?: FiestaEnPlanificacion | null): BarTechnologySettings {
  const eventName = fiesta?.configuracion?.nombreEvento || 'la fiesta';
  return {
    ...DEFAULT_BAR_SETTINGS,
    title: `Barra tecnologica de ${eventName}`,
  };
}

function normalizeSettings(settings: Partial<BarTechnologySettings> | undefined, fiesta?: FiestaEnPlanificacion | null): BarTechnologySettings {
  const defaults = getDefaultSettings(fiesta);
  return {
    ...defaults,
    ...(settings || {}),
    hashtag: sanitizeHashtag(settings?.hashtag || defaults.hashtag),
    instagramHandle: sanitizeText(settings?.instagramHandle || defaults.instagramHandle),
    accentColor: sanitizeText(settings?.accentColor || defaults.accentColor),
    title: sanitizeText(settings?.title || defaults.title, defaults.title),
    subtitle: sanitizeText(settings?.subtitle || defaults.subtitle, defaults.subtitle),
    guestPrompt: sanitizeText(settings?.guestPrompt || defaults.guestPrompt, defaults.guestPrompt),
    barmanTitle: sanitizeText(settings?.barmanTitle || defaults.barmanTitle, defaults.barmanTitle),
    brandText: sanitizeText(settings?.brandText || defaults.brandText, defaults.brandText),
    socialFollowPrompt: sanitizeText(settings?.socialFollowPrompt || defaults.socialFollowPrompt, defaults.socialFollowPrompt, 220),
    enabled: settings?.enabled ?? defaults.enabled,
    requireGuestName: settings?.requireGuestName ?? defaults.requireGuestName,
    allowPhotoCapture: settings?.allowPhotoCapture ?? defaults.allowPhotoCapture,
    autoPublishPhotos: settings?.autoPublishPhotos ?? defaults.autoPublishPhotos,
    showIngredients: settings?.showIngredients ?? defaults.showIngredients,
    showAlcoholFreeTag: settings?.showAlcoholFreeTag ?? defaults.showAlcoholFreeTag,
    showDrinkDescription: settings?.showDrinkDescription ?? defaults.showDrinkDescription,
    showDrinkVideo: settings?.showDrinkVideo ?? defaults.showDrinkVideo,
    requireSocialFollowForPhotos: settings?.requireSocialFollowForPhotos ?? defaults.requireSocialFollowForPhotos,
    openingTime: normalizeBarTime(settings?.openingTime),
    closingTime: normalizeBarTime(settings?.closingTime),
  };
}

function getStoredBarData(fiesta: FiestaEnPlanificacion | null): BarTechnologyData {
  const stored = fiesta?.others?.barraTecnologica || {};
  return {
    ...stored,
    settings: normalizeSettings(stored.settings, fiesta),
    orders: Array.isArray(stored.orders) ? stored.orders : [],
  };
}

async function getDb(): Promise<Firestore | null> {
  try {
    const { dbAdmin } = await import('@/lib/firebase/server');
    return (dbAdmin as Firestore | null) || null;
  } catch {
    return null;
  }
}

async function getBarDrinks(fiesta: FiestaEnPlanificacion): Promise<Trago[]> {
  const masterItems = await getCartaTragosMaster().catch(() => defaultCartaTragosData.items);
  const fiestaItems = fiesta.cartaTragos?.items || defaultCartaTragosData.items;
  const merged = mergeMasterTragosWithFiesta(masterItems, fiestaItems);

  const sorted = [...merged].sort((a, b) => {
    const aCustom = a.id?.startsWith('custom_') ? 1 : 0;
    const bCustom = b.id?.startsWith('custom_') ? 1 : 0;
    return bCustom - aCustom;
  });

  return sorted
    .filter((drink) => drink && drink.nombre)
    .map((drink) => ({
      ...drink,
      ingredientes: drink.ingredientes || [],
      stockDisponible: drink.stockDisponible,
    }));
}

let stockPromiseChain = Promise.resolve();
const INSUMOS_FILE = 'insumos.json';

function aggregateRecipe(drink: Trago): Array<{ insumoId: string; cantidad: number }> {
  const totals = new Map<string, number>();
  for (const ingredient of drink.recetaIngredientes || []) {
    if (!ingredient.insumoId || ingredient.cantidad <= 0) continue;
    totals.set(ingredient.insumoId, (totals.get(ingredient.insumoId) || 0) + ingredient.cantidad);
  }
  return Array.from(totals, ([insumoId, cantidad]) => ({ insumoId, cantidad }));
}

async function descontarStock(drink: Trago): Promise<BarStockMovement[]> {
  const recipe = aggregateRecipe(drink);
  if (recipe.length === 0) return [];
  const db = await getDb();
  if (db) {
    const movements = await db.runTransaction(async transaction => {
      const refs = recipe.map(item => db.collection('insumos').doc(item.insumoId));
      const snapshots = await transaction.getAll(...refs);
      const applied: BarStockMovement[] = [];
      snapshots.forEach((snapshot, index) => {
        if (!snapshot.exists) return;
        const available = Number(snapshot.data()?.cantidadDisponible);
        if (!Number.isFinite(available)) return;
        const cantidad = calculateActualStockMovement(available, recipe[index].cantidad);
        transaction.update(snapshot.ref, { cantidadDisponible: available - cantidad });
        if (cantidad > 0) applied.push({ insumoId: recipe[index].insumoId, cantidad });
      });
      return applied;
    });
    await invalidateInsumosCache();
    return movements;
  }

  const movements: BarStockMovement[] = [];
  const nextPromise = stockPromiseChain.then(async () => {
    const inventory = await readData<ServicioEmpresa[]>(INSUMOS_FILE, []);
    for (const item of recipe) {
      const supply = inventory.find(candidate => candidate.id === item.insumoId);
      if (!supply || supply.cantidadDisponible === undefined) continue;
      const cantidad = calculateActualStockMovement(supply.cantidadDisponible, item.cantidad);
      supply.cantidadDisponible -= cantidad;
      if (cantidad > 0) movements.push({ insumoId: item.insumoId, cantidad });
    }
    await writeData(INSUMOS_FILE, inventory);
    await invalidateInsumosCache();
  });

  stockPromiseChain = nextPromise;
  await nextPromise;
  return movements;
}

async function reponerStock(movements: BarStockMovement[]) {
  if (movements.length === 0) return;
  const db = await getDb();
  if (db) {
    await db.runTransaction(async transaction => {
      const refs = movements.map(item => db.collection('insumos').doc(item.insumoId));
      const snapshots = await transaction.getAll(...refs);
      snapshots.forEach((snapshot, index) => {
        if (!snapshot.exists) return;
        const available = Number(snapshot.data()?.cantidadDisponible);
        if (!Number.isFinite(available)) return;
        transaction.update(snapshot.ref, { cantidadDisponible: available + movements[index].cantidad });
      });
    });
    await invalidateInsumosCache();
    return;
  }

  const nextPromise = stockPromiseChain.then(async () => {
    const inventory = await readData<ServicioEmpresa[]>(INSUMOS_FILE, []);
    for (const movement of movements) {
      const supply = inventory.find(candidate => candidate.id === movement.insumoId);
      if (supply && supply.cantidadDisponible !== undefined) supply.cantidadDisponible += movement.cantidad;
    }
    await writeData(INSUMOS_FILE, inventory);
    await invalidateInsumosCache();
  });

  stockPromiseChain = nextPromise;
  await nextPromise;
}

async function getFirestoreOrders(fiestaId: string): Promise<BarDrinkOrder[] | null> {
  const db = await getDb();
  if (!db) return null;

  const snapshot = await db
    .collection(BAR_ORDERS_COLLECTION)
    .where('fiestaId', '==', fiestaId)
    .get();

  return snapshot.docs
    .map((doc: QueryDocumentSnapshot) => doc.data() as BarDrinkOrder)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

async function saveFallbackOrders(fiesta: FiestaEnPlanificacion, orders: BarDrinkOrder[]) {
  const stored = getStoredBarData(fiesta);
  return saveFiesta({
    ...fiesta,
    others: {
      ...(fiesta.others || {}),
      barraTecnologica: {
        ...stored,
        orders,
        updatedAt: new Date().toISOString(),
      },
    },
  });
}

export async function getBarraTecnologicaDashboard(fiestaId: string): Promise<{ success: boolean; data?: BarTechnologyDashboard; error?: string }> {
  try {
    await requireAppSession();
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error('Fiesta no encontrada.');

    const stored = getStoredBarData(fiesta);
    const [drinks, firestoreOrders] = await Promise.all([
      getBarDrinks(fiesta),
      getFirestoreOrders(fiestaId).catch(() => null),
    ]);

    const orders = firestoreOrders ?? [...(stored.orders || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      success: true,
      data: {
        fiestaId,
        eventName: fiesta.configuracion?.nombreEvento || 'Evento AK',
        settings: stored.settings,
        drinks,
        orders,
        backgroundImageUrl: fiesta.cartaTragos?.backgroundImageUrl || '',
        protagonistaFotoUrl: fiesta.cartaTragos?.protagonistaFotoUrl || '',
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo cargar la barra tecnologica.' };
  }
}

function findAuthorizedGuest(fiesta: FiestaEnPlanificacion, guestId: string, guestAccessToken: string) {
  if (!guestId || !guestAccessToken) return null;
  return (fiesta.invitados || []).find(
    (guest) => guest.id === guestId && guest.guestAccessToken === guestAccessToken,
  ) || null;
}

function orderBelongsToGuest(order: BarDrinkOrder, guest: { id: string; nombre: string }) {
  if (order.guestId) return order.guestId === guest.id;
  return order.guestName.trim().toLocaleLowerCase('es') === guest.nombre.trim().toLocaleLowerCase('es');
}

async function findBarOrder(fiesta: FiestaEnPlanificacion, orderId: string) {
  const db = await getDb();
  if (db) {
    const snapshot = await db.collection(BAR_ORDERS_COLLECTION).doc(orderId).get();
    if (snapshot.exists) return snapshot.data() as BarDrinkOrder;
  }
  return getStoredBarData(fiesta).orders?.find((order) => order.id === orderId) || null;
}

export async function getPublicBarraTecnologicaDashboard(
  fiestaId: string,
): Promise<{ success: boolean; data?: PublicBarTechnologyDashboard; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error('Fiesta no encontrada.');

    const stored = getStoredBarData(fiesta);
    const drinks = (await getBarDrinks(fiesta)).map((drink) => ({
      id: drink.id,
      nombre: drink.nombre,
      imageUrl: drink.imageUrl,
      descripcion: drink.descripcion,
      description: drink.description,
      videoUrl: drink.videoUrl,
      ingredientes: drink.ingredientes || [],
      stockDisponible: drink.stockDisponible,
    }));

    return {
      success: true,
      data: {
        fiestaId,
        eventName: fiesta.configuracion?.nombreEvento || 'Evento AK',
        settings: stored.settings,
        drinks,
        backgroundImageUrl: fiesta.cartaTragos?.backgroundImageUrl || '',
        protagonistaFotoUrl: fiesta.cartaTragos?.protagonistaFotoUrl || '',
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo cargar la carta de tragos.' };
  }
}

export async function saveBarraTecnologicaSettings(
  fiestaId: string,
  settings: Partial<BarTechnologySettings>
): Promise<{ success: boolean; data?: BarTechnologySettings; error?: string }> {
  try {
    await requireAppSession();
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error('Fiesta no encontrada.');

    const stored = getStoredBarData(fiesta);
    const nextSettings = normalizeSettings(settings, fiesta);
    const nextData: BarTechnologyData = {
      ...stored,
      settings: nextSettings,
      updatedAt: new Date().toISOString(),
    };

    const result = await saveFiesta({
      ...fiesta,
      others: {
        ...(fiesta.others || {}),
        barraTecnologica: nextData,
      },
    });

    if (!result.success) throw new Error(result.error || 'No se pudo guardar la configuracion.');
    return { success: true, data: nextSettings };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo guardar la barra tecnologica.' };
  }
}

export async function createBarDrinkOrder(input: CreateBarDrinkOrderInput): Promise<{ success: boolean; order?: BarDrinkOrder; error?: string }> {
  try {
    await enforcePublicRateLimit({
      scope: 'bar-drink-order',
      identity: input.fiestaId,
      limit: 30,
      windowMs: 60_000,
    });
    const fiesta = await getFiestaById(input.fiestaId);
    if (!fiesta) throw new Error('Fiesta no encontrada.');

    const stored = getStoredBarData(fiesta);
    if (!stored.settings.enabled) return { success: false, error: 'La barra tecnologica esta pausada.' };

    const scheduleError = getBarScheduleError(stored.settings);
    if (scheduleError) return { success: false, error: scheduleError };

    const drinks = await getBarDrinks(fiesta);
    const drink = drinks.find((item) => item.id === input.drinkId);
    if (!drink) return { success: false, error: 'Ese trago no esta disponible.' };
    if ((drink.stockDisponible ?? 1) <= 0) return { success: false, error: 'Ese trago figura sin stock disponible.' };

    const guestName = sanitizeText(input.guestName, 'Invitado');
    if (stored.settings.requireGuestName && guestName === 'Invitado') {
      return { success: false, error: 'Ingresa tu nombre para pedir el trago.' };
    }

    const now = new Date().toISOString();
    const order: BarDrinkOrder = {
      id: `bar_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      fiestaId: input.fiestaId,
      drinkId: drink.id,
      drinkName: drink.nombre,
      guestName,
      guestId: sanitizeText(input.guestId),
      tableNumber: sanitizeText(input.tableNumber),
      note: sanitizeText(input.note),
      status: 'nuevo',
      createdAt: now,
      updatedAt: now,
      source: 'touchscreen',
    };

    order.stockMovements = await descontarStock(drink);

    const db = await getDb();
    if (db) {
      try {
        await db.collection(BAR_ORDERS_COLLECTION).doc(order.id).set(order);
      } catch (error) {
        logger.warn('[barra-tecnologica] firestore order write failed, using fallback:', error);
        await saveFallbackOrders(fiesta, [order, ...(stored.orders || [])]);
      }
    } else {
      await saveFallbackOrders(fiesta, [order, ...(stored.orders || [])]);
    }

    // El pedido del invitado tambien consume botellas. Solo descontaba el que
    // cargaba el barman a mano, asi que durante toda la fiesta el stock quedaba
    // igual por mas tragos que se pidieran desde la pantalla: el aviso de "sin
    // stock" nunca saltaba y la barra se quedaba sin bebida con el sistema
    // marcando que habia de sobra.
    const currentOrders = await getFirestoreOrders(input.fiestaId).catch(() => null);
    const allOrders = currentOrders ?? [order, ...(stored.orders || [])];
    const queuePosition = allOrders.filter(
      (item) => item.status === 'nuevo' || item.status === 'preparando',
    ).length;

    return { success: true, order: { ...order, queuePosition } };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo crear el pedido.' };
  }
}

export async function createBarmanManualOrder(input: CreateBarDrinkOrderInput): Promise<{ success: boolean; order?: BarDrinkOrder; error?: string }> {
  try {
    await requireAppSession();
    const fiesta = await getFiestaById(input.fiestaId);
    if (!fiesta) throw new Error('Fiesta no encontrada.');

    const drinks = await getBarDrinks(fiesta);
    const drink = drinks.find((item) => item.id === input.drinkId);
    if (!drink) return { success: false, error: 'Ese trago no esta disponible.' };

    const now = new Date().toISOString();
    const order: BarDrinkOrder = {
      id: `bar_manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      fiestaId: input.fiestaId,
      drinkId: drink.id,
      drinkName: drink.nombre,
      guestName: 'Barman',
      status: 'entregado',
      createdAt: now,
      updatedAt: now,
      source: 'staff',
    };

    order.stockMovements = await descontarStock(drink);

    const db = await getDb();
    const stored = getStoredBarData(fiesta);
    if (db) {
      try {
        await db.collection(BAR_ORDERS_COLLECTION).doc(order.id).set(order);
      } catch (error) {
        await saveFallbackOrders(fiesta, [order, ...(stored.orders || [])]);
      }
    } else {
      await saveFallbackOrders(fiesta, [order, ...(stored.orders || [])]);
    }

    return { success: true, order };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo crear el pedido manual.' };
  }
}

export async function getGuestBarOrders(
  fiestaId: string,
  guestId: string,
  guestAccessToken: string,
): Promise<{ success: boolean; orders?: BarDrinkOrder[]; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error('Fiesta no encontrada.');
    const guest = findAuthorizedGuest(fiesta, guestId, guestAccessToken);
    if (!guest) return { success: false, error: 'Acceso de invitado no autorizado.' };
    const firestoreOrders = await getFirestoreOrders(fiestaId).catch(() => null);
    const orders = firestoreOrders ?? getStoredBarData(fiesta).orders ?? [];
    return { success: true, orders: orders.filter((order) => orderBelongsToGuest(order, guest)) };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudieron cargar tus pedidos.' };
  }
}

export async function cancelBarDrinkOrder(
  fiestaId: string,
  orderId: string,
  guestId: string,
  guestAccessToken: string,
): Promise<{ success: boolean; error?: string }> {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
  const guest = findAuthorizedGuest(fiesta, guestId, guestAccessToken);
  if (!guest) return { success: false, error: 'Acceso de invitado no autorizado.' };
  const order = await findBarOrder(fiesta, orderId);
  if (!order || !orderBelongsToGuest(order, guest)) return { success: false, error: 'Pedido no encontrado.' };
  if (order.status !== 'nuevo') return { success: false, error: 'El pedido ya esta en preparacion y no se puede cancelar.' };
  return updateBarDrinkOrderStatusInternal(fiestaId, orderId, 'cancelado');
}

export async function changeBarDrinkOrder(
  fiestaId: string,
  orderId: string,
  newDrinkId: string,
  guestId: string,
  guestAccessToken: string,
): Promise<{ success: boolean; order?: BarDrinkOrder; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error('Fiesta no encontrada.');
    const guest = findAuthorizedGuest(fiesta, guestId, guestAccessToken);
    if (!guest) return { success: false, error: 'Acceso de invitado no autorizado.' };
    const existing = await findBarOrder(fiesta, orderId);
    if (!existing || !orderBelongsToGuest(existing, guest)) {
      return { success: false, error: 'Pedido no encontrado.' };
    }
    if (existing.status !== 'nuevo') {
      return { success: false, error: 'El pedido ya esta en preparacion y no se puede cambiar.' };
    }
    if (existing.drinkId === newDrinkId) return { success: true, order: existing };

    const cancellation = await updateBarDrinkOrderStatusInternal(fiestaId, orderId, 'cancelado');
    if (!cancellation.success) return { success: false, error: cancellation.error };

    return createBarDrinkOrder({
      fiestaId,
      drinkId: newDrinkId,
      guestName: existing.guestName,
      guestId: existing.guestId,
      tableNumber: existing.tableNumber,
      note: existing.note,
    });
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo cambiar el pedido.' };
  }
}

async function updateBarDrinkOrderStatusInternal(
  fiestaId: string,
  orderId: string,
  status: BarDrinkOrderStatus
): Promise<{ success: boolean; order?: BarDrinkOrder; error?: string }> {
  try {
    const allowed: BarDrinkOrderStatus[] = ['nuevo', 'preparando', 'listo', 'entregado', 'cancelado'];
    if (!allowed.includes(status)) return { success: false, error: 'Estado no valido.' };

    const db = await getDb();
    const updatedAt = new Date().toISOString();
    if (db) {
      try {
        const ref = db.collection(BAR_ORDERS_COLLECTION).doc(orderId);
        const transactionResult = await db.runTransaction(async (transaction) => {
          const snapshot = await transaction.get(ref);
          if (!snapshot.exists) throw new Error('Pedido no encontrado.');

          const currentOrder = snapshot.data() as BarDrinkOrder;
          if (currentOrder.fiestaId !== fiestaId) throw new Error('El pedido no pertenece a esta fiesta.');
          if (!isValidBarOrderTransition(currentOrder.status, status)) {
            return { error: 'Ese cambio de estado no corresponde al paso actual del pedido.' };
          }

          const shouldReplenishStock = status === 'cancelado'
            && currentOrder.status !== 'cancelado'
            && !currentOrder.stockRestoredAt
            && Boolean(currentOrder.stockMovements?.length);
          if (shouldReplenishStock) {
            const movements = currentOrder.stockMovements || [];
            const stockRefs = movements.map(item => db.collection('insumos').doc(item.insumoId));
            const stockSnapshots = await transaction.getAll(...stockRefs);
            stockSnapshots.forEach((stockSnapshot, index) => {
              if (!stockSnapshot.exists) {
                throw new Error(`No se encontro el insumo ${movements[index].insumoId} para reponer stock.`);
              }
              const available = Number(stockSnapshot.data()?.cantidadDisponible);
              if (!Number.isFinite(available)) {
                throw new Error(`El stock del insumo ${movements[index].insumoId} no es valido.`);
              }
              transaction.update(stockSnapshot.ref, {
                cantidadDisponible: available + movements[index].cantidad,
              });
            });
          }
          const stockRestoredAt = shouldReplenishStock ? updatedAt : currentOrder.stockRestoredAt;
          const order = { ...currentOrder, status, updatedAt, stockRestoredAt };
          transaction.update(ref, { status, updatedAt, ...(stockRestoredAt ? { stockRestoredAt } : {}) });
          return { order };
        });

        if (transactionResult.error) {
          return { success: false, error: transactionResult.error };
        }
        const updatedOrder = transactionResult.order;
        if (!updatedOrder) throw new Error('No se pudo recuperar el pedido actualizado.');

        if (updatedOrder.stockRestoredAt === updatedAt) await invalidateInsumosCache();

        return { success: true, order: updatedOrder };
      } catch (error) {
        logger.warn('[barra-tecnologica] firestore status update failed, using fallback:', error);
      }
    }

    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error('Fiesta no encontrada.');
    const stored = getStoredBarData(fiesta);
    const currentOrder = (stored.orders || []).find((order) => order.id === orderId);
    if (!currentOrder) return { success: false, error: 'Pedido no encontrado.' };
    if (currentOrder.fiestaId !== fiestaId) return { success: false, error: 'El pedido no pertenece a esta fiesta.' };
    if (!isValidBarOrderTransition(currentOrder.status, status)) {
      return { success: false, error: 'Ese cambio de estado no corresponde al paso actual del pedido.' };
    }
    const shouldReplenishStock = status === 'cancelado'
      && currentOrder.status !== 'cancelado'
      && !currentOrder.stockRestoredAt
      && Boolean(currentOrder.stockMovements?.length);
    if (shouldReplenishStock) await reponerStock(currentOrder.stockMovements || []);
    const stockRestoredAt = shouldReplenishStock ? updatedAt : currentOrder.stockRestoredAt;
    const orders = (stored.orders || []).map((order) => (
      order.id === orderId ? { ...order, status, updatedAt, stockRestoredAt } : order
    ));
    await saveFallbackOrders(fiesta, orders);
    const updatedOrder = orders.find((order) => order.id === orderId);

    return { success: true, order: updatedOrder };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo actualizar el pedido.' };
  }
}

export async function updateBarDrinkOrderStatus(
  fiestaId: string,
  orderId: string,
  status: BarDrinkOrderStatus,
): Promise<{ success: boolean; order?: BarDrinkOrder; error?: string }> {
  try {
    await requireAppSession();
    return updateBarDrinkOrderStatusInternal(fiestaId, orderId, status);
  } catch (error: any) {
    return { success: false, error: error.message || 'Sesion no autorizada.' };
  }
}

export async function uploadBarMagicPhoto(formData: FormData): Promise<{ success: boolean; url?: string; shareText?: string; error?: string }> {
  const fiestaId = String(formData.get('fiestaId') || '');
  const authorName = sanitizeText(String(formData.get('authorName') || ''), 'Invitado barra AK');
  const caption = sanitizeText(String(formData.get('caption') || ''));
  const followConfirmed = isTruthyFollowConfirmation(formData.get('followConfirmed'));
  const file = formData.get('file') as File | null;
  const drinkId = formData.get('drinkId') ? String(formData.get('drinkId')) : undefined;
  const drinkName = formData.get('drinkName') ? String(formData.get('drinkName')) : undefined;

  if (!fiestaId || !file) return { success: false, error: 'Faltan datos para subir la foto.' };

  try {
    await enforcePublicRateLimit({
      scope: 'bar-media-upload',
      identity: fiestaId,
      limit: 10,
      windowMs: 60_000,
    });
  } catch (error: any) {
    return { success: false, error: error.message || 'Espera un momento antes de volver a subir.' };
  }

  const isVideo = file.type.startsWith('video/');
  if (!file.type.startsWith('image/') && !isVideo) {
    return { success: false, error: 'Solo se aceptan fotos o videos.' };
  }

  const maxSize = isVideo ? MAX_BAR_VIDEO_SIZE : MAX_BAR_IMAGE_SIZE;
  if (file.size > maxSize) {
    return {
      success: false,
      error: isVideo ? 'El video no puede superar los 60MB.' : 'La imagen no puede superar los 10MB.',
    };
  }

  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error('Fiesta no encontrada.');
    const settings = getStoredBarData(fiesta).settings;
    if (!settings.allowPhotoCapture) return { success: false, error: 'La captura de fotos esta pausada.' };
    if (settings.requireSocialFollowForPhotos && !followConfirmed) {
      return { success: false, error: 'Para subir el archivo primero confirma que seguis las redes de AK Producciones.' };
    }

    const defaultExt = isVideo ? '.webm' : '.jpg';
    const extension = path.extname(file.name || '') || defaultExt;
    const mediaId = `bar_photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const storagePath = `bar-tech/${fiestaId}/${mediaId}${extension}`;
    const bytes = await file.arrayBuffer();
    const url = await uploadToStorage(Buffer.from(bytes), storagePath, file.type || (isVideo ? 'video/webm' : 'image/jpeg'), true);

    const defaultCaption = isVideo ? 'Grabando un saludo en la barra interactiva' : 'Mi foto en la barra tecnologica AK';
    const baseCaption = drinkName
      ? `Disfrutando de un ${drinkName} en la barra interactiva`
      : (caption || defaultCaption);
    const shareText = `${baseCaption} ${settings.hashtag} ${settings.instagramHandle}`.trim();

    if (settings.autoPublishPhotos) {
      const socialResult = await createSocialMediaPostFromUrlForStation({
        fiestaId,
        mediaUrl: url,
        mediaType: isVideo ? 'video' : 'image',
        authorName,
        caption: shareText,
        source: 'bar-tech',
        sourceModule: 'totems',
        momentTag: 'Barra de tragos',
        drinkId,
        drinkName,
      }, createEntertainmentAccessToken(fiestaId, 'totems', 'guest'));
      if (!socialResult.success) {
        throw new Error(socialResult.error || 'No se pudo publicar la foto de la barra en el muro.');
      }
    }

    return { success: true, url, shareText };
  } catch (error: any) {
    logger.error('[barra-tecnologica] upload file failed', error);
    return { success: false, error: error.message || 'No se pudo subir el archivo.' };
  }
}
