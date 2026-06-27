'use server';

import path from 'path';
import type { Firestore, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import type { FiestaEnPlanificacion, Trago } from '@/types/fiesta';
import type {
  BarDrinkOrder,
  BarDrinkOrderStatus,
  BarTechnologyData,
  BarTechnologyDashboard,
  BarTechnologySettings,
  CreateBarDrinkOrderInput,
} from '@/types/barra-tecnologica';
import { defaultCartaTragosData } from '@/lib/fiesta-defaults';
import { mergeMasterTragosWithFiesta } from '@/lib/carta-tragos-master';
import { getCartaTragosMaster } from '@/app/actions/carta-tragos-master.actions';
import { getFiestaById, saveFiesta } from './fiesta.actions';
import { uploadToStorage } from '@/lib/firebase/storage';
import { createSocialMediaPostFromUrl } from '@/app/actions/social-gallery';
import { getBarScheduleError, isTruthyFollowConfirmation, normalizeBarTime } from '@/lib/barra-tecnologica';
import { getInsumoById, saveInsumo } from '@/app/actions/insumos';
import * as logger from '@/lib/logger';

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

async function descontarStock(drink: Trago) {
  if (!drink.recetaIngredientes) return;
  for (const ing of drink.recetaIngredientes) {
    if (!ing.insumoId) continue;
    try {
      const insumo = await getInsumoById(ing.insumoId);
      if (insumo && insumo.cantidadDisponible !== undefined) {
        insumo.cantidadDisponible -= ing.cantidad;
        if (insumo.cantidadDisponible < 0) insumo.cantidadDisponible = 0;
        await saveInsumo(insumo);
      }
    } catch (error) {
      logger.error(`[barra-tecnologica] error al descontar stock del insumo ${ing.insumoId}`, error);
    }
  }
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

export async function saveBarraTecnologicaSettings(
  fiestaId: string,
  settings: Partial<BarTechnologySettings>
): Promise<{ success: boolean; data?: BarTechnologySettings; error?: string }> {
  try {
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
      tableNumber: sanitizeText(input.tableNumber),
      note: sanitizeText(input.note),
      status: 'nuevo',
      createdAt: now,
      updatedAt: now,
      source: 'touchscreen',
    };

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

    return { success: true, order };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo crear el pedido.' };
  }
}

export async function createBarmanManualOrder(input: CreateBarDrinkOrderInput): Promise<{ success: boolean; order?: BarDrinkOrder; error?: string }> {
  try {
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
      status: 'nuevo',
      createdAt: now,
      updatedAt: now,
      source: 'staff',
    };

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

export async function cancelBarDrinkOrder(fiestaId: string, orderId: string): Promise<{ success: boolean; error?: string }> {
  return updateBarDrinkOrderStatus(fiestaId, orderId, 'cancelado');
}

export async function changeBarDrinkOrder(fiestaId: string, orderId: string, newDrinkId: string): Promise<{ success: boolean; order?: BarDrinkOrder; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error('Fiesta no encontrada.');

    const drinks = await getBarDrinks(fiesta);
    const drink = drinks.find((item) => item.id === newDrinkId);
    if (!drink) return { success: false, error: 'Ese trago no esta disponible.' };

    const db = await getDb();
    const updatedAt = new Date().toISOString();
    if (db) {
      try {
        const ref = db.collection(BAR_ORDERS_COLLECTION).doc(orderId);
        const snapshot = await ref.get();
        const orderData = snapshot.data() as BarDrinkOrder;
        if (!orderData) return { success: false, error: 'Pedido no encontrado.' };
        if (orderData.status !== 'nuevo' && orderData.status !== 'preparando') {
          return { success: false, error: 'No se puede cambiar un pedido que ya está listo o entregado.' };
        }
        await ref.update({ drinkId: drink.id, drinkName: drink.nombre, updatedAt });
        const updatedSnapshot = await ref.get();
        return { success: true, order: updatedSnapshot.data() as BarDrinkOrder };
      } catch (error) {
        logger.warn('[barra-tecnologica] firestore change order failed, using fallback:', error);
      }
    }

    const stored = getStoredBarData(fiesta);
    const existingOrder = stored.orders?.find(o => o.id === orderId);
    if (!existingOrder) return { success: false, error: 'Pedido no encontrado.' };
    if (existingOrder.status !== 'nuevo' && existingOrder.status !== 'preparando') {
        return { success: false, error: 'No se puede cambiar un pedido que ya está listo o entregado.' };
    }

    const orders = (stored.orders || []).map((order) => (
      order.id === orderId ? { ...order, drinkId: drink.id, drinkName: drink.nombre, updatedAt } : order
    ));
    await saveFallbackOrders(fiesta, orders);
    return { success: true, order: orders.find((order) => order.id === orderId) };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo cambiar el pedido.' };
  }
}

export async function updateBarDrinkOrderStatus(
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
        await ref.update({ status, updatedAt });
        const snapshot = await ref.get();
        const orderData = snapshot.data() as BarDrinkOrder;

        if (status === 'entregado') {
          const fiesta = await getFiestaById(fiestaId);
          if (fiesta) {
            const drinks = await getBarDrinks(fiesta);
            const drink = drinks.find(d => d.id === orderData.drinkId);
            if (drink) await descontarStock(drink);
          }
        }

        return { success: true, order: orderData };
      } catch (error) {
        logger.warn('[barra-tecnologica] firestore status update failed, using fallback:', error);
      }
    }

    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error('Fiesta no encontrada.');
    const stored = getStoredBarData(fiesta);
    const orders = (stored.orders || []).map((order) => (
      order.id === orderId ? { ...order, status, updatedAt } : order
    ));
    await saveFallbackOrders(fiesta, orders);
    const updatedOrder = orders.find((order) => order.id === orderId);

    if (status === 'entregado' && updatedOrder) {
      const drinks = await getBarDrinks(fiesta);
      const drink = drinks.find(d => d.id === updatedOrder.drinkId);
      if (drink) await descontarStock(drink);
    }

    return { success: true, order: updatedOrder };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo actualizar el pedido.' };
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
      await createSocialMediaPostFromUrl({
        fiestaId,
        mediaUrl: url,
        mediaType: isVideo ? 'video' : 'image',
        authorName,
        caption: shareText,
        source: 'bar-tech',
        sourceModule: 'barraTecnologica',
        momentTag: 'Barra de tragos',
        drinkId,
        drinkName,
      });
    }

    return { success: true, url, shareText };
  } catch (error: any) {
    logger.error('[barra-tecnologica] upload file failed', error);
    return { success: false, error: error.message || 'No se pudo subir el archivo.' };
  }
}
