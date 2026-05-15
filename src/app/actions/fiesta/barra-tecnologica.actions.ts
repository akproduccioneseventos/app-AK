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
import { isTruthyFollowConfirmation } from '@/lib/barra-tecnologica';
import * as logger from '@/lib/logger';

const BAR_ORDERS_COLLECTION = 'bar_drink_orders';
const MAX_BAR_PHOTO_SIZE = 10 * 1024 * 1024;

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
  return mergeMasterTragosWithFiesta(masterItems, fiestaItems)
    .filter((drink) => drink && drink.nombre)
    .map((drink) => ({
      ...drink,
      ingredientes: drink.ingredientes || [],
      stockDisponible: drink.stockDisponible,
    }));
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
        return { success: true, order: snapshot.data() as BarDrinkOrder };
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
    return { success: true, order: orders.find((order) => order.id === orderId) };
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

  if (!fiestaId || !file) return { success: false, error: 'Faltan datos para subir la foto.' };
  if (!file.type.startsWith('image/')) return { success: false, error: 'Solo se aceptan fotos.' };
  if (file.size > MAX_BAR_PHOTO_SIZE) return { success: false, error: 'La foto no puede superar 10MB.' };

  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) throw new Error('Fiesta no encontrada.');
    const settings = getStoredBarData(fiesta).settings;
    if (!settings.allowPhotoCapture) return { success: false, error: 'La captura de fotos esta pausada.' };
    if (settings.requireSocialFollowForPhotos && !followConfirmed) {
      return { success: false, error: 'Para subir la foto primero confirma que seguis las redes de AK Producciones.' };
    }

    const extension = path.extname(file.name || '') || '.jpg';
    const mediaId = `bar_photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const storagePath = `bar-tech/${fiestaId}/${mediaId}${extension}`;
    const bytes = await file.arrayBuffer();
    const url = await uploadToStorage(Buffer.from(bytes), storagePath, file.type || 'image/jpeg', true);
    const shareText = `${caption || 'Mi foto en la barra tecnologica AK'} ${settings.hashtag} ${settings.instagramHandle}`.trim();

    if (settings.autoPublishPhotos) {
      await createSocialMediaPostFromUrl({
        fiestaId,
        mediaUrl: url,
        mediaType: 'image',
        authorName,
        caption: shareText,
        source: 'bar-tech',
        sourceModule: 'barraTecnologica',
        momentTag: 'Barra de tragos',
      });
    }

    return { success: true, url, shareText };
  } catch (error: any) {
    logger.error('[barra-tecnologica] upload photo failed', error);
    return { success: false, error: error.message || 'No se pudo subir la foto.' };
  }
}
