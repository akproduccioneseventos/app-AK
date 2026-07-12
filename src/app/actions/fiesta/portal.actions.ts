

'use server';

import type { FiestaEnPlanificacion, ClientTarea, ClientPortalSettings, ClientPaymentNotification, TimelineHito, MenuSeleccionPortal, ListaMusicaPortal, SocialGallerySettings } from '@/types/fiesta';
import { getFiestaById, saveFiesta, getFiestas } from './fiesta.actions';
import { addPagoToPresupuesto, getPresupuestoById, updatePresupuesto } from '../presupuestos';
import { createNotification } from '../notifications';
import {
  notifyClientPaymentApproved,
  notifyClientPaymentRejected,
  notifyClientPaymentSubmitted,
} from '../google-workspace-extended';
import { verifyPortalSession, setPortalSessionCookie } from '@/lib/security/portal-session';
import { sanitizeActionError } from '@/lib/utils';
import { uploadToStorage } from '@/lib/firebase/storage';
import { requireAppSession } from '@/lib/auth/require-session';
import { transitionPaymentNotification } from '@/lib/client-portal/payment-notifications';


const MUSIC_LIST_KEYS = ['imprescindibles', 'siEsPosible', 'noQuiero'] as const;

function normalizeClientPaymentAmount(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * 100) / 100;
}

async function updateFiestaData(
  fiestaId: string,
  updateFn: (data: FiestaEnPlanificacion) => FiestaEnPlanificacion | Promise<FiestaEnPlanificacion>
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) {
        throw new Error("No se pudo encontrar el archivo de la fiesta activa.");
    }
    const updatedData = await updateFn(currentData);
    
    await saveFiesta(updatedData);

    return { success: true };
  } catch (e: any) {
    console.error("Error updating fiesta data in portal.actions:", e.message);
    return { success: false, error: sanitizeActionError(e) };
  }
}

function createRequestId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

import { getFiestaByIdRaw } from '@/lib/fiesta/get-fiesta-raw';

export async function initializePortalSession(fiestaId: string, accessKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaByIdRaw(fiestaId);
    if (!fiesta || !fiesta.clientPortalSettings?.enabled || fiesta.clientPortalSettings.accessKey !== accessKey) {
      return { success: false, error: 'Acceso denegado.' };
    }
    await setPortalSessionCookie(fiestaId, accessKey);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: sanitizeActionError(err) };
  }
}

export async function getFiestaForPortalSession(fiestaId: string): Promise<FiestaEnPlanificacion | null> {
  if (!(await verifyPortalSession(fiestaId))) return null;
  const fiesta = await getFiestaByIdRaw(fiestaId);
  if (!fiesta?.clientPortalSettings?.enabled) return null;

  return {
    ...fiesta,
    clientPortalSettings: {
      ...fiesta.clientPortalSettings,
      accessKey: undefined as any,
    },
  };
}

export async function updateClientGuestTable(
  fiestaId: string,
  guestId: string,
  tableNumber?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!(await verifyPortalSession(fiestaId))) return { success: false, error: 'Sesión no autorizada.' };
  return updateFiestaData(fiestaId, data => ({
    ...data,
    invitados: (data.invitados ?? []).map(guest => (
      guest.id === guestId
        ? { ...guest, tableNumber: tableNumber?.trim() || undefined }
        : guest
    )),
  }));
}

export async function updateClientPackingList(
  fiestaId: string,
  items: import('@/types/fiesta').ClienteDebeLlevarItem[],
): Promise<{ success: boolean; error?: string }> {
  if (!(await verifyPortalSession(fiestaId))) return { success: false, error: 'Sesión no autorizada.' };
  return updateFiestaData(fiestaId, data => ({ ...data, clienteDebeLlevar: items }));
}


export async function updateClientChecklist(fiestaId: string, checklist: ClientTarea[]) {
  if (!(await verifyPortalSession(fiestaId))) return { success: false, error: 'Sesión no autorizada.' };
  return updateFiestaData(fiestaId, data => ({ ...data, clientChecklist: checklist }));
}

export async function updateClientChecklistItem(
  fiestaId: string,
  itemId: string,
  completed: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!(await verifyPortalSession(fiestaId))) return { success: false, error: 'Sesión no autorizada.' };
  const result = await updateFiestaData(fiestaId, data => {
    const currentChecklist = data.clientChecklist ?? [];
    return {
      ...data,
      clientChecklist: currentChecklist.map(item =>
        item.id === itemId
          ? {
              ...item,
              completada: completed,
              fechaCompletado: completed ? new Date().toISOString() : undefined,
            }
          : item
      ),
    };
  });
  if (result.success) {
    await createNotification({
      mensaje: `✅ Cliente actualizó checklist en portal (${completed ? 'completó' : 'desmarcó'} una tarea).`,
      href: `/fiestas/nueva?fiestaId=${fiestaId}&tab=portal-cliente`,
      icono: 'CheckCircle2',
    });
  }
  return result;
}

export async function updateClientNotes(fiestaId: string, notes: string) {
  if (!(await verifyPortalSession(fiestaId))) return { success: false, error: 'Sesión no autorizada.' };
  const result = await updateFiestaData(fiestaId, data => ({ ...data, clientNotes: notes }));
  if (result.success) {
    await createNotification({
      mensaje: '📝 Cliente actualizó notas en el Portal VIP.',
      href: `/fiestas/nueva?fiestaId=${fiestaId}&tab=portal-cliente`,
      icono: 'MessageSquare',
    });
  }
  return result;
}

export async function updatePortalSettings(
  fiestaId: string, 
  clientSettings: ClientPortalSettings
) {
  await requireAppSession();
  return updateFiestaData(fiestaId, async (currentData) => {
    const updatedData = {
      ...currentData,
      clientPortalSettings: clientSettings,
    };
    return updatedData;
  });
}

export async function updateClientePortalExperience(
  fiestaId: string,
  experience: import('@/types/fiesta').ClientePortalExperience
) {
  if (!(await verifyPortalSession(fiestaId))) return { success: false, error: 'Sesión no autorizada.' };
  return updateFiestaData(fiestaId, data => ({
    ...data,
    clientePortalExperience: { ...(data.clientePortalExperience ?? {}), ...experience },
  }));
}

export async function updateFaqPortal(fiestaId: string, faqItems: import('@/types/fiesta').FaqItem[]) {
  await requireAppSession();
  return updateFiestaData(fiestaId, data => ({ ...data, faqPortal: faqItems }));
}

export async function updateSocialGallerySettings(
  fiestaId: string,
  socialGallerySettings: SocialGallerySettings
) {
  await requireAppSession();
  return updateFiestaData(fiestaId, data => ({ ...data, socialGallerySettings }));
}

export async function getFiestaByAccessKey(accessKey: string): Promise<FiestaEnPlanificacion | null> {
  if (!accessKey || accessKey.trim() === '') return null;
  const safeAccessKey = accessKey.trim();
  try {
    const { dbAdmin } = await import('@/lib/firebase/server');
    if (dbAdmin) {
      const snapshot = await dbAdmin
        .collection('fiestas')
        .where('clientPortalSettings.enabled', '==', true)
        .where('clientPortalSettings.accessKey', '==', safeAccessKey)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        delete data._syncedAt;
        return data as FiestaEnPlanificacion;
      }
    }
  } catch {
    // Fall back to the compatible reader below.
  }

  try {
    const fiestas = await getFiestas(false);
    return fiestas.find(
      f =>
        f.clientPortalSettings?.enabled === true &&
        f.clientPortalSettings?.accessKey === safeAccessKey
    ) ?? null;
  } catch {
    return null;
  }
}

export async function submitClientPayment(
  fiestaId: string,
  monto: number,
  comprobanteBase64?: string,
  comprobanteNombre?: string
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  if (!(await verifyPortalSession(fiestaId))) return { success: false, error: 'Sesión no autorizada.' };
  try {
    const safeMonto = normalizeClientPaymentAmount(monto);
    if (safeMonto <= 0) return { success: false, error: 'Monto inválido' };

    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado' };

    let comprobanteUrl = undefined;
    if (comprobanteBase64) {
      try {
        const matches = comprobanteBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const filename = comprobanteNombre || 'comprobante.png';
          const docId = `cpn_${crypto.randomUUID()}`;
          const storagePath = `payments/${fiestaId}/${docId}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          
          await uploadToStorage(buffer, storagePath, mimeType, false);
          comprobanteUrl = storagePath;
        }
      } catch (uploadError) {
        console.error('[Portal Action] Failed to upload receipt to Storage:', uploadError);
      }
    }

    const notification: ClientPaymentNotification = {
      id: `cpn_${crypto.randomUUID()}`,
      monto: safeMonto,
      comprobanteUrl, // Store only the path!
      comprobanteNombre,
      estado: 'pendiente',
      timestamp: new Date().toISOString(),
    };

    const updated: FiestaEnPlanificacion = {
      ...fiesta,
      clientPaymentNotifications: [
        ...(fiesta.clientPaymentNotifications ?? []),
        notification,
      ],
    };

    await saveFiesta(updated);

    await createNotification({
      mensaje: `💳 Pago informado por cliente para "${fiesta.configuracion.nombreEvento}": $${safeMonto.toLocaleString('es-UY')}`,
      href: `/fiestas/nueva?fiestaId=${fiestaId}&tab=pagos`,
      icono: 'CreditCard',
    });

    notifyClientPaymentSubmitted(fiestaId, notification).catch((error) => {
      console.warn('[Google Workspace] No se pudo enviar mail de pago informado:', error);
    });

    return { success: true, notificationId: notification.id };
  } catch (e: any) {
    return { success: false, error: sanitizeActionError(e) };
  }
}

export async function submitClientMenuChangeRequest(
  fiestaId: string,
  payload: {
    adultosDelta: number;
    ninosAdolescentesDelta: number;
    montoAdicional: number;
    nuevoTotalEstimado: number;
    notaCliente?: string;
  }
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  if (!(await verifyPortalSession(fiestaId))) return { success: false, error: 'Sesión no autorizada.' };
  try {
    if (payload.adultosDelta <= 0 && payload.ninosAdolescentesDelta <= 0) {
      return { success: false, error: 'No hay cambios para solicitar.' };
    }

    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado' };

    const requestId = createRequestId('menu_change_request');
    const nextRequest = {
      id: requestId,
      createdAt: new Date().toISOString(),
      status: 'pendiente' as const,
      adultosDelta: Math.max(0, payload.adultosDelta),
      ninosAdolescentesDelta: Math.max(0, payload.ninosAdolescentesDelta),
      montoAdicional: Math.max(0, payload.montoAdicional),
      nuevoTotalEstimado: Math.max(0, payload.nuevoTotalEstimado),
      notaCliente: payload.notaCliente?.trim() || undefined,
    };

    await saveFiesta({
      ...fiesta,
      clientMenuChangeRequests: [...(fiesta.clientMenuChangeRequests ?? []), nextRequest],
    });

    await createNotification({
      mensaje: `🧾 Solicitud de cambio de menú en "${fiesta.configuracion.nombreEvento}": +${nextRequest.adultosDelta} adultos, +${nextRequest.ninosAdolescentesDelta} niños/adolescentes.`,
      href: `/fiestas/nueva?fiestaId=${fiestaId}&tab=portal-cliente`,
      icono: 'Users',
    });

    return { success: true, requestId };
  } catch (e: any) {
    return { success: false, error: sanitizeActionError(e) };
  }
}

export async function submitClientServiceAddRequest(
  fiestaId: string,
  payload: {
    servicioId: string;
    nombreServicio: string;
    categoria?: string;
    cantidad: number;
    precioBase: number;
    ajustePorcentaje: number;
    montoAdicional: number;
    nuevoTotalEstimado: number;
    notaCliente?: string;
  }
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  if (!(await verifyPortalSession(fiestaId))) return { success: false, error: 'Sesión no autorizada.' };
  try {
    const cantidad = Math.max(1, Math.round(Number(payload.cantidad) || 1));
    const montoAdicional = normalizeClientPaymentAmount(payload.montoAdicional);
    if (!payload.servicioId || !payload.nombreServicio || montoAdicional <= 0) {
      return { success: false, error: 'Servicio o monto invalido.' };
    }

    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado' };

    const requestId = createRequestId('service_change_request');
    const nextRequest = {
      id: requestId,
      createdAt: new Date().toISOString(),
      status: 'pendiente' as const,
      servicioId: payload.servicioId,
      nombreServicio: payload.nombreServicio.trim(),
      categoria: payload.categoria,
      cantidad,
      precioBase: Math.max(0, Number(payload.precioBase) || 0),
      ajustePorcentaje: Math.max(0, Number(payload.ajustePorcentaje) || 0),
      montoAdicional,
      nuevoTotalEstimado: Math.max(0, Number(payload.nuevoTotalEstimado) || 0),
      notaCliente: payload.notaCliente?.trim() || undefined,
    };

    await saveFiesta({
      ...fiesta,
      clientServiceChangeRequests: [...(fiesta.clientServiceChangeRequests ?? []), nextRequest],
    });

    await createNotification({
      mensaje: `Solicitud de servicio extra en "${fiesta.configuracion.nombreEvento}": ${nextRequest.nombreServicio} x${nextRequest.cantidad}.`,
      href: `/fiestas/nueva?fiestaId=${fiestaId}&tab=portal-cliente`,
      icono: 'Package',
    });

    return { success: true, requestId };
  } catch (e: any) {
    return { success: false, error: sanitizeActionError(e) };
  }
}

export async function approveClientPayment(
  fiestaId: string,
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAppSession();
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado' };

    const notifications = fiesta.clientPaymentNotifications ?? [];
    const initialTransition = transitionPaymentNotification(notifications, notificationId, 'aprobado');
    const notif = initialTransition.notification;
    if (!initialTransition.changed) return { success: true };

    // First register the money. If the budget rejects it (for example over saldo),
    // keep the notification pending so it can be reviewed correctly.
    if (fiesta.presupuestoId) {
      const paymentResult = await addPagoToPresupuesto(fiesta.presupuestoId, {
        fecha: new Date().toISOString(),
        monto: notif.monto,
        metodoPago: 'Transferencia Bancaria',
        referencia: `Pago verificado desde Portal VIP (${notif.id})`,
      });
      if (!paymentResult.success) {
        return { success: false, error: paymentResult.error || 'No se pudo registrar el pago en el presupuesto.' };
      }
    }

    let updatedNotif = initialTransition.notification;
    const updateResult = await updateFiestaData(fiestaId, currentFiesta => {
      const transition = transitionPaymentNotification(
        currentFiesta.clientPaymentNotifications ?? [],
        notificationId,
        'aprobado'
      );
      updatedNotif = transition.notification;
      return {
        ...currentFiesta,
        clientPaymentNotifications: transition.notifications,
      };
    });
    if (!updateResult.success) return updateResult;

    notifyClientPaymentApproved(fiestaId, updatedNotif).catch((error) => {
      console.warn('[Google Workspace] No se pudo enviar mail de pago aprobado:', error);
    });

    return { success: true };
  } catch (e: any) {
    return { success: false, error: sanitizeActionError(e) };
  }
}

export async function rejectClientPayment(
  fiestaId: string,
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAppSession();
    let updatedNotif: ClientPaymentNotification | null = null;
    let changed = false;
    const result = await updateFiestaData(fiestaId, currentFiesta => {
      const transition = transitionPaymentNotification(
        currentFiesta.clientPaymentNotifications ?? [],
        notificationId,
        'rechazado'
      );
      updatedNotif = transition.notification;
      changed = transition.changed;
      return {
        ...currentFiesta,
        clientPaymentNotifications: transition.notifications,
      };
    });

    if (result.success && updatedNotif && changed) {
      notifyClientPaymentRejected(fiestaId, updatedNotif).catch((error) => {
        console.warn('[Google Workspace] No se pudo enviar mail de pago rechazado:', error);
      });
    }

    return result;
  } catch (e: any) {
    return { success: false, error: sanitizeActionError(e) };
  }
}

/**
 * Allows a guest to update their own RSVP status from the client portal.
 * Used when a confirmed guest needs to cancel (or change their status).
 */
export async function updatePortalGuestRsvp(
  fiestaId: string,
  invitadoId: string,
  rsvp: import('@/types/fiesta').RsvpStatus
): Promise<{ success: boolean; error?: string }> {
  if (!(await verifyPortalSession(fiestaId))) return { success: false, error: 'Sesión no autorizada.' };
  const result = await updateFiestaData(fiestaId, fiesta => {
    const invitados = (fiesta.invitados ?? []).map(inv =>
      inv.id === invitadoId ? { ...inv, rsvp } : inv
    );
    return { ...fiesta, invitados };
  });
  if (result.success) {
    await createNotification({
      mensaje: `🎟️ Un invitado actualizó su confirmación a "${rsvp}" desde el Portal VIP del evento (${fiestaId}).`,
      href: `/fiestas/nueva?fiestaId=${fiestaId}&tab=invitados`,
      icono: 'Users',
    });
  }
  return result;
}

    
export async function saveTimeline(
  fiestaId: string,
  timeline: TimelineHito[]
): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  return updateFiestaData(fiestaId, fiesta => ({
    ...fiesta,
    timeline,
  }));
}

export async function saveMenuSeleccion(
  fiestaId: string,
  menuSeleccion: MenuSeleccionPortal
): Promise<{ success: boolean; error?: string }> {
  if (!(await verifyPortalSession(fiestaId))) return { success: false, error: 'Sesión no autorizada.' };
  const result = await updateFiestaData(fiestaId, fiesta => ({
    ...fiesta,
    menuSeleccionPortal: {
      ...menuSeleccion,
      confirmado: true,
      fechaConfirmacion: new Date().toISOString(),
    },
  }));
  if (result.success) {
    await createNotification({
      mensaje: '🍽️ Cliente confirmó/cambió selección de menú desde el Portal VIP.',
      href: `/fiestas/nueva?fiestaId=${fiestaId}&tab=portal-cliente`,
      icono: 'UtensilsCrossed',
    });
  }
  return result;
}

export async function saveListaMusica(
  fiestaId: string,
  listaMusica: ListaMusicaPortal
): Promise<{ success: boolean; error?: string }> {
  if (!(await verifyPortalSession(fiestaId))) return { success: false, error: 'Sesión no autorizada.' };
  const result = await updateFiestaData(fiestaId, fiesta => ({
    ...fiesta,
    listaMusicaPortal: {
      ...listaMusica,
      fechaActualizacion: new Date().toISOString(),
    },
  }));
  if (result.success) {
    await createNotification({
      mensaje: '🎵 Cliente actualizó la lista musical del Portal VIP.',
      href: `/fiestas/nueva?fiestaId=${fiestaId}&tab=musica`,
      icono: 'Music',
    });
  }
  return result;
}

export async function addClientMusicSuggestion(
  fiestaId: string,
  listKey: keyof ListaMusicaPortal,
  suggestion: string
): Promise<{ success: boolean; error?: string }> {
  if (!(await verifyPortalSession(fiestaId))) return { success: false, error: 'Sesión no autorizada.' };
  const value = suggestion.trim();
  if (!value) return { success: false, error: 'Sugerencia vacía' };

  if (!MUSIC_LIST_KEYS.includes(listKey as (typeof MUSIC_LIST_KEYS)[number])) {
    return { success: false, error: 'Lista inválida' };
  }

  const result = await updateFiestaData(fiestaId, fiesta => {
    const current = fiesta.listaMusicaPortal ?? {};
    const list = current[listKey] ?? [];
    return {
      ...fiesta,
      listaMusicaPortal: {
        ...current,
        [listKey]: [...list, value],
        fechaActualizacion: new Date().toISOString(),
      },
    };
  });
  if (result.success) {
    await createNotification({
      mensaje: `🎶 Cliente agregó sugerencia musical (${listKey}) desde Portal VIP.`,
      href: `/fiestas/nueva?fiestaId=${fiestaId}&tab=musica`,
      icono: 'Music',
    });
  }
  return result;
}

export async function approveClientMenuChangeRequest(fiestaId: string, requestId: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado' };

    const requests = fiesta.clientMenuChangeRequests ?? [];
    const requestIndex = requests.findIndex(r => r.id === requestId);
    if (requestIndex === -1) return { success: false, error: 'Solicitud no encontrada' };

    const request = requests[requestIndex];
    if (request.status !== 'pendiente') return { success: false, error: 'La solicitud ya fue procesada.' };

    request.status = 'aprobada';

    fiesta.configuracion.invitadosEstimados = (fiesta.configuracion.invitadosEstimados ?? 0) + request.adultosDelta + request.ninosAdolescentesDelta;
    if (fiesta.presupuestoId) {
      const presupuesto = await getPresupuestoById(fiesta.presupuestoId);
      if (presupuesto) {
        presupuesto.invitadosCantidad = (presupuesto.invitadosCantidad ?? 0) + request.adultosDelta + request.ninosAdolescentesDelta;
        presupuesto.totalConDescuento = (presupuesto.totalConDescuento ?? 0) + request.montoAdicional;
        presupuesto.totalFinal = (presupuesto.totalFinal ?? 0) + request.montoAdicional;
        await updatePresupuesto(presupuesto);
      }
    }

    await saveFiesta(fiesta);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: sanitizeActionError(err) };
  }
}

export async function rejectClientMenuChangeRequest(fiestaId: string, requestId: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado' };

    const requests = fiesta.clientMenuChangeRequests ?? [];
    const requestIndex = requests.findIndex(r => r.id === requestId);
    if (requestIndex === -1) return { success: false, error: 'Solicitud no encontrada' };

    const request = requests[requestIndex];
    if (request.status !== 'pendiente') return { success: false, error: 'La solicitud ya fue procesada.' };

    request.status = 'rechazada';
    await saveFiesta(fiesta);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: sanitizeActionError(err) };
  }
}

export async function approveClientServiceChangeRequest(fiestaId: string, requestId: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado' };

    const requests = fiesta.clientServiceChangeRequests ?? [];
    const requestIndex = requests.findIndex(r => r.id === requestId);
    if (requestIndex === -1) return { success: false, error: 'Solicitud no encontrada' };

    const request = requests[requestIndex];
    if (request.status !== 'pendiente') return { success: false, error: 'La solicitud ya fue procesada.' };

    request.status = 'aprobada';

    if (fiesta.presupuestoId) {
      const presupuesto = await getPresupuestoById(fiesta.presupuestoId);
      if (presupuesto) {
        const items = presupuesto.itemsPresupuestados ?? [];
        items.push({
          idServicioCatalogo: request.servicioId,
          nombreServicio: request.nombreServicio,
          categoriaServicio: request.categoria ?? 'Otros Servicios',
          cantidad: request.cantidad,
          precioUnitario: request.precioBase,
          precioUnitarioPresupuesto: request.precioBase,
          costoTotalItem: request.montoAdicional,
        });
        presupuesto.itemsPresupuestados = items;
        presupuesto.totalConDescuento = (presupuesto.totalConDescuento ?? 0) + request.montoAdicional;
        presupuesto.totalFinal = (presupuesto.totalFinal ?? 0) + request.montoAdicional;
        await updatePresupuesto(presupuesto);
      }
    }

    await saveFiesta(fiesta);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: sanitizeActionError(err) };
  }
}

export async function rejectClientServiceChangeRequest(fiestaId: string, requestId: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado' };

    const requests = fiesta.clientServiceChangeRequests ?? [];
    const requestIndex = requests.findIndex(r => r.id === requestId);
    if (requestIndex === -1) return { success: false, error: 'Solicitud no encontrada' };

    const request = requests[requestIndex];
    if (request.status !== 'pendiente') return { success: false, error: 'La solicitud ya fue procesada.' };

    request.status = 'rechazada';
    await saveFiesta(fiesta);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: sanitizeActionError(err) };
  }
}

export async function getBudgetTokenForPortal(fiestaId: string): Promise<string | null> {
  const { verifyPortalSession } = await import('@/lib/security/portal-session');
  if (!(await verifyPortalSession(fiestaId))) {
    return null;
  }
  const fiesta = await getFiestaByIdRaw(fiestaId);
  if (!fiesta || !fiesta.presupuestoId) {
    return null;
  }
  const { generateBudgetToken } = await import('@/lib/auth/session-token');
  return await generateBudgetToken(fiesta.presupuestoId);
}

export async function checkDateAvailability(
  fiestaId: string,
  targetDateStr: string
): Promise<{ success: boolean; available: boolean; suggestions?: string[]; error?: string }> {
  const { verifyPortalSession } = await import('@/lib/security/portal-session');
  if (!verifyPortalSession(fiestaId)) return { success: false, available: false, error: 'Sesión no autorizada.' };
  try {
    const allFiestas = await getFiestas(false);
    const targetDate = new Date(targetDateStr).toISOString().split('T')[0];
    const isBusy = allFiestas.some(f => 
      f.id !== fiestaId && 
      f.configuracion?.fechaEvento && 
      new Date(f.configuracion.fechaEvento).toISOString().split('T')[0] === targetDate
    );
    if (!isBusy) {
      return { success: true, available: true };
    }
    
    // Find alternative dates (weekends or nearby dates)
    const baseDate = new Date(targetDateStr);
    const suggestions: string[] = [];
    // We check +1d, -1d, +7d, -7d, +2d, -2d, +8d, -8d, +14d, -14d
    const offsets = [1, -1, 7, -7, 2, -2, 8, -8, 14, -14];
    for (const offset of offsets) {
      const altDate = new Date(baseDate);
      altDate.setDate(altDate.getDate() + offset);
      const altDateStr = altDate.toISOString().split('T')[0];
      const altBusy = allFiestas.some(f => 
        f.id !== fiestaId && 
        f.configuracion?.fechaEvento && 
        new Date(f.configuracion.fechaEvento).toISOString().split('T')[0] === altDateStr
      );
      if (!altBusy) {
        suggestions.push(altDate.toISOString());
        if (suggestions.length >= 4) break;
      }
    }
    return { success: true, available: false, suggestions };
  } catch (e: any) {
    return { success: false, available: false, error: sanitizeActionError(e) };
  }
}

export async function cancelServicesOrParty(
  fiestaId: string,
  payload: {
    servicesToCancel: string[];
    cancelAll: boolean;
    passwordInput: string;
  }
): Promise<{ success: boolean; error?: string; fileName?: string; refundAmount?: number; pendingDue?: number }> {
  const { verifyPortalSession } = await import('@/lib/security/portal-session');
  if (!verifyPortalSession(fiestaId)) return { success: false, error: 'Sesión no autorizada.' };
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado.' };

    const expectedPassword = fiesta.clientPortalSettings?.clientPassword || '';
    if (payload.passwordInput.trim() !== expectedPassword.trim()) {
      return { success: false, error: 'Contraseña/PIN de operaciones incorrecto.' };
    }

    if (!fiesta.presupuestoId) return { success: false, error: 'Este evento no tiene un presupuesto asociado.' };

    const fs = await import('fs/promises');
    const path = await import('path');
    const { readData, writeData } = await import('@/lib/data-service');
    const { getBudgetPaymentSummary } = await import('@/lib/budget/financial-guardrails');

    const budgets = await readData<any[]>('presupuestos.json', []);
    const budgetIndex = budgets.findIndex(b => b.id === fiesta.presupuestoId);
    if (budgetIndex === -1) return { success: false, error: 'Presupuesto no encontrado.' };

    const presupuesto = budgets[budgetIndex];
    const paymentSummary = getBudgetPaymentSummary(presupuesto);
    const totalOriginal = paymentSummary.total;
    const totalPagado = paymentSummary.paid;

    // Calculate inflation adjustment factor based on cancellation year
    const signingYear = fiesta.contratoDatos?.fechaFirmaContrato 
      ? new Date(fiesta.contratoDatos.fechaFirmaContrato).getFullYear() 
      : new Date().getFullYear();
    const cancellationYear = new Date().getFullYear();
    const yearsDiff = Math.max(0, cancellationYear - signingYear);
    const porcentajeAjuste = fiesta.contratoDatos?.ajusteAnualPorcentaje ?? presupuesto.ajusteAnualPorcentaje ?? 15;
    const factorAjuste = Math.pow(1 + (porcentajeAjuste / 100), yearsDiff);

    let docContent = '';
    let updatedItems = [...(presupuesto.itemsPresupuestados || [])];
    let penaltyTotal = 0;
    let nuevoTotal = 0;
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const docId = `cancelacion_${timestampStr}`;
    const filename = `cancelacion_${fiestaId}_${timestampStr}.txt`;

    if (payload.cancelAll) {
      // Cancellation of the entire party
      const adjustedTotal = totalOriginal * factorAjuste;
      penaltyTotal = Math.round(adjustedTotal * 0.3);
      nuevoTotal = penaltyTotal;

      updatedItems = [
        {
          idServicioCatalogo: 'multa_cancelacion_total',
          nombreServicio: 'Cancelación total de evento - Multa (30%)',
          cantidad: 1,
          precioUnitario: penaltyTotal,
          precioUnitarioPresupuesto: penaltyTotal,
          costoTotalItem: penaltyTotal,
          categoriaServicio: 'Multas y Ajustes'
        }
      ];

      docContent = `============================================================
           AK PRODUCCIONES - CONTRATO DE CANCELACIÓN TOTAL
============================================================

CLIENTE: ${presupuesto.clienteNombre}
ID EVENTO: ${fiestaId}
FECHA ORIGINAL: ${fiesta.configuracion?.fechaEvento || 'A confirmar'}
FECHA DE SOLICITUD: ${new Date().toLocaleDateString('es-UY')}

------------------------------------------------------------
DETALLE DE LA CANCELACIÓN:
- Se cancela la totalidad de la fiesta y los servicios contratados.
- El contrato queda rescindido aplicando la Cláusula 4 del contrato firmado.

------------------------------------------------------------
CÁLCULO ECONÓMICO (CLÁUSULA 4):
- Total del contrato original: $${totalOriginal.toLocaleString('es-UY')}
- Factor de ajuste inflacionario aplicado (${porcentajeAjuste}% anual): x${factorAjuste.toFixed(3)} (año firma: ${signingYear} -> año cancelacion: ${cancellationYear})
- Total del contrato ajustado: $${Math.round(adjustedTotal).toLocaleString('es-UY')}
- Recargo por penalización (30%): $${penaltyTotal.toLocaleString('es-UY')}

- Monto abonado por el cliente a la fecha: $${totalPagado.toLocaleString('es-UY')}
- Resultado:
  ${totalPagado > penaltyTotal 
    ? `* Se le devolverá al cliente: $${(totalPagado - penaltyTotal).toLocaleString('es-UY')}`
    : `* El cliente adeuda de saldo pendiente: $${(penaltyTotal - totalPagado).toLocaleString('es-UY')}`}

------------------------------------------------------------
DECLARACIÓN Y ACEPTACIÓN:
Al firmar este documento de manera manual, las partes aceptan de
común acuerdo la rescisión del contrato bajo las condiciones pactadas.

Para finalizar este trámite y coordinar la devolución/cobro y la firma
manual de esta adenda, por favor comuníquese de inmediato con nosotros
informando esta decisión.

Firma Cliente: ________________________   Fecha: __/__/____

Firma AK Producciones: _________________   Fecha: __/__/____
============================================================`;

    } else {
      // Partial cancellation of specific services
      const cancelledServicesDetails: string[] = [];
      let cancelledValueOriginal = 0;

      const servicesToCancelSet = new Set(payload.servicesToCancel);
      const remainingItems: any[] = [];

      for (const item of updatedItems) {
        if (servicesToCancelSet.has(item.idServicioCatalogo)) {
          const originalCost = item.costoTotalItem || 0;
          const adjustedCost = originalCost * factorAjuste;
          const servicePenalty = Math.round(adjustedCost * 0.3);
          penaltyTotal += servicePenalty;
          cancelledValueOriginal += originalCost;

          cancelledServicesDetails.push(
            `  * ${item.nombreServicio} (Cant: ${item.cantidad || 1}) - Original: $${originalCost.toLocaleString('es-UY')} - Ajustado ${cancellationYear}: $${Math.round(adjustedCost).toLocaleString('es-UY')} - Multa (30%): $${servicePenalty.toLocaleString('es-UY')}`
          );
        } else {
          remainingItems.push(item);
        }
      }

      if (cancelledServicesDetails.length === 0) {
        return { success: false, error: 'No se seleccionó ningún servicio válido para cancelar.' };
      }

      // Add penalty items to the remaining items list
      remainingItems.push({
        idServicioCatalogo: `multa_cancelacion_${Date.now()}`,
        nombreServicio: `Penalización por Cancelación de Servicios (30%)`,
        cantidad: 1,
        precioUnitario: penaltyTotal,
        precioUnitarioPresupuesto: penaltyTotal,
        costoTotalItem: penaltyTotal,
        categoriaServicio: 'Multas y Ajustes'
      });

      updatedItems = remainingItems;

      // Recalculate new total
      const remainingSubtotal = remainingItems
        .filter(item => !item.esRegalo && item.idServicioCatalogo !== 'multa_cancelacion_total' && !item.idServicioCatalogo.startsWith('multa_cancelacion_'))
        .reduce((sum, item) => sum + (item.costoTotalItem || 0), 0);
      
      let discount = 0;
      if (presupuesto.descuentoTipo && presupuesto.descuentoValor) {
        discount = presupuesto.descuentoTipo === 'porcentaje'
          ? Math.round(remainingSubtotal * presupuesto.descuentoValor / 100)
          : presupuesto.descuentoValor;
      }
      
      nuevoTotal = Math.max(0, remainingSubtotal - discount) + penaltyTotal;

      docContent = `============================================================
           AK PRODUCCIONES - CONTRATO DE CANCELACIÓN PARCIAL
============================================================

CLIENTE: ${presupuesto.clienteNombre}
ID EVENTO: ${fiestaId}
FECHA ORIGINAL: ${fiesta.configuracion?.fechaEvento || 'A confirmar'}
FECHA DE SOLICITUD: ${new Date().toLocaleDateString('es-UY')}

------------------------------------------------------------
SERVICIOS CANCELADOS:
${cancelledServicesDetails.join('\n')}

------------------------------------------------------------
CÁLCULO ECONÓMICO (CLÁUSULA 4):
- Total del contrato original: $${totalOriginal.toLocaleString('es-UY')}
- Factor de ajuste inflacionario aplicado (${porcentajeAjuste}% anual): x${factorAjuste.toFixed(3)}
- Total original cancelado: $${cancelledValueOriginal.toLocaleString('es-UY')}
- Recargo por penalización (30% de lo cancelado ajustado): $${penaltyTotal.toLocaleString('es-UY')}
- Nuevo total de contrato reestructurado: $${nuevoTotal.toLocaleString('es-UY')}

- Monto abonado por el cliente a la fecha: $${totalPagado.toLocaleString('es-UY')}
- Resultado:
  ${totalPagado > nuevoTotal 
    ? `* Se le devolverá al cliente: $${(totalPagado - nuevoTotal).toLocaleString('es-UY')}`
    : `* El cliente adeuda de saldo pendiente: $${(nuevoTotal - totalPagado).toLocaleString('es-UY')}`}

------------------------------------------------------------
DECLARACIÓN Y ACEPTACIÓN:
Al firmar este documento de manera manual, las partes aceptan de
común acuerdo la reestructuración del contrato bajo las condiciones pactadas.

Para finalizar este trámite y coordinar la firma manual de esta
adenda, por favor comuníquese de inmediato con nosotros informando
esta decisión.

Firma Cliente: ________________________   Fecha: __/__/____

Firma AK Producciones: _________________   Fecha: __/__/____
============================================================`;
    }

    // Write file locally
    const dirPath = path.resolve(process.cwd(), 'src', 'data', 'documentos-varios-fiesta', fiestaId);
    await fs.mkdir(dirPath, { recursive: true });
    const filePath = path.join(dirPath, filename);
    await fs.writeFile(filePath, docContent, 'utf-8');

    // Update Budget in database
    presupuesto.itemsPresupuestados = updatedItems;
    presupuesto.costoTotalEstimado = updatedItems
      .filter(item => !item.esRegalo)
      .reduce((sum, item) => sum + (item.costoTotalItem || 0), 0);
    
    let discount = 0;
    if (presupuesto.descuentoTipo && presupuesto.descuentoValor) {
      discount = presupuesto.descuentoTipo === 'porcentaje'
        ? Math.round((presupuesto.costoTotalEstimado - penaltyTotal) * presupuesto.descuentoValor / 100)
        : presupuesto.descuentoValor;
    }
    presupuesto.totalConDescuento = Math.max(0, presupuesto.costoTotalEstimado - discount);
    presupuesto.saldo = Math.max(0, presupuesto.totalConDescuento - totalPagado);

    budgets[budgetIndex] = presupuesto;
    await writeData('presupuestos.json', budgets);

    // Update Fiesta in database
    const newDoc = {
      id: docId,
      nombre: payload.cancelAll ? "Contrato de Cancelación Total (Firma Manual)" : "Contrato de Cancelación Parcial (Firma Manual)",
      tipo: 'cancelacion',
      fileName: filename,
      timestamp: new Date().toISOString(),
    };

    const updatedFiesta = {
      ...fiesta,
      othersDocumentos: [...(fiesta.othersDocumentos || []), newDoc]
    };
    await saveFiesta(updatedFiesta);

    // Create system notification
    const { createNotification } = await import('../notifications');
    await createNotification({
      mensaje: `⚠️ Cliente canceló ${payload.cancelAll ? 'toda la fiesta' : 'servicios'} en "${fiesta.configuracion.nombreEvento}". Contrato generado.`,
      href: `/fiestas/nueva?fiestaId=${fiestaId}&tab=portal-cliente`,
      icono: 'AlertTriangle',
    });

    const refundAmount = totalPagado > nuevoTotal ? (totalPagado - nuevoTotal) : 0;
    const pendingDue = nuevoTotal > totalPagado ? (nuevoTotal - totalPagado) : 0;

    return {
      success: true,
      fileName: filename,
      refundAmount,
      pendingDue
    };

  } catch (e: any) {
    return { success: false, error: sanitizeActionError(e) };
  }
}

export async function changeEventDate(
  fiestaId: string,
  payload: {
    newDate: string;
    passwordInput: string;
  }
): Promise<{ success: boolean; error?: string; fileName?: string; penaltyAmount?: number; newBalance?: number }> {
  const { verifyPortalSession } = await import('@/lib/security/portal-session');
  if (!verifyPortalSession(fiestaId)) return { success: false, error: 'Sesión no autorizada.' };
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado.' };

    const expectedPassword = fiesta.clientPortalSettings?.clientPassword || '';
    if (payload.passwordInput.trim() !== expectedPassword.trim()) {
      return { success: false, error: 'Contraseña/PIN de operaciones incorrecto.' };
    }

    // Check date availability
    const availRes = await checkDateAvailability(fiestaId, payload.newDate);
    if (!availRes.success || !availRes.available) {
      return { success: false, error: 'La fecha seleccionada no está disponible.' };
    }

    if (!fiesta.presupuestoId) return { success: false, error: 'Este evento no tiene un presupuesto asociado.' };

    const fs = await import('fs/promises');
    const path = await import('path');
    const { readData, writeData } = await import('@/lib/data-service');
    const { getBudgetPaymentSummary } = await import('@/lib/budget/financial-guardrails');

    const budgets = await readData<any[]>('presupuestos.json', []);
    const budgetIndex = budgets.findIndex(b => b.id === fiesta.presupuestoId);
    if (budgetIndex === -1) return { success: false, error: 'Presupuesto no encontrado.' };

    const presupuesto = budgets[budgetIndex];
    const paymentSummary = getBudgetPaymentSummary(presupuesto);
    const totalOriginal = paymentSummary.total;
    const totalPagado = paymentSummary.paid;

    // Calculate 10% penalty for date change
    const penaltyAmount = Math.round(totalOriginal * 0.1);
    const nuevoTotal = totalOriginal + penaltyAmount;

    // Create penalty item
    const penaltyItem = {
      idServicioCatalogo: `multa_cambio_fecha_${Date.now()}`,
      nombreServicio: 'Recargo por Cambio de Fecha (10%)',
      cantidad: 1,
      precioUnitario: penaltyAmount,
      precioUnitarioPresupuesto: penaltyAmount,
      costoTotalItem: penaltyAmount,
      categoriaServicio: 'Multas y Ajustes'
    };

    const updatedItems = [...(presupuesto.itemsPresupuestados || []), penaltyItem];

    // Format new document
    const originalDateFmt = new Date(fiesta.configuracion?.fechaEvento || '').toLocaleDateString('es-UY');
    const newDateFmt = new Date(payload.newDate).toLocaleDateString('es-UY');
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const docId = `cambio_fecha_${timestampStr}`;
    const filename = `cambio_fecha_${fiestaId}_${timestampStr}.txt`;

    const docContent = `============================================================
           AK PRODUCCIONES - ADENDA DE CAMBIO DE FECHA
============================================================

CLIENTE: ${presupuesto.clienteNombre}
ID EVENTO: ${fiestaId}
FECHA ORIGINAL: ${originalDateFmt}
NUEVA FECHA SOLICITADA: ${newDateFmt}
FECHA DE SOLICITUD: ${new Date().toLocaleDateString('es-UY')}

------------------------------------------------------------
DETALLE DEL CAMBIO (CLÁUSULA 4):
- Se reprograma la fecha del evento a solicitud del cliente.
- Penalización por reprogramación: 10% del total contratado.

------------------------------------------------------------
CÁLCULO ECONÓMICO:
- Total del contrato original: $${totalOriginal.toLocaleString('es-UY')}
- Recargo por cambio de fecha (10%): $${penaltyAmount.toLocaleString('es-UY')}
- Nuevo total de contrato reestructurado: $${nuevoTotal.toLocaleString('es-UY')}

- Monto abonado por el cliente a la fecha: $${totalPagado.toLocaleString('es-UY')}
- Saldo pendiente restante a abonar: $${(nuevoTotal - totalPagado).toLocaleString('es-UY')}

* Nota: Si la nueva fecha pasa a otro año, se aplicará el ajuste
  anual correspondiente según la Cláusula 2 al momento del cobro.

------------------------------------------------------------
DECLARACIÓN Y ACEPTACIÓN:
Al firmar este documento de manera manual, las partes aceptan de
común acuerdo el cambio de fecha y la reestructuración del saldo.

Para finalizar este trámite y coordinar la firma manual de esta
adenda, por favor comuníquese de inmediato con nosotros informando
esta decisión.

Firma Cliente: ________________________   Fecha: __/__/____

Firma AK Producciones: _________________   Fecha: __/__/____
============================================================`;

    // Write file locally
    const dirPath = path.resolve(process.cwd(), 'src', 'data', 'documentos-varios-fiesta', fiestaId);
    await fs.mkdir(dirPath, { recursive: true });
    const filePath = path.join(dirPath, filename);
    await fs.writeFile(filePath, docContent, 'utf-8');

    // Update Budget in database
    presupuesto.eventoFecha = payload.newDate;
    presupuesto.itemsPresupuestados = updatedItems;
    presupuesto.costoTotalEstimado = updatedItems
      .filter(item => !item.esRegalo)
      .reduce((sum, item) => sum + (item.costoTotalItem || 0), 0);
    
    let discount = 0;
    if (presupuesto.descuentoTipo && presupuesto.descuentoValor) {
      discount = presupuesto.descuentoTipo === 'porcentaje'
        ? Math.round((presupuesto.costoTotalEstimado - penaltyAmount) * presupuesto.descuentoValor / 100)
        : presupuesto.descuentoValor;
    }
    presupuesto.totalConDescuento = Math.max(0, presupuesto.costoTotalEstimado - discount);
    presupuesto.saldo = Math.max(0, presupuesto.totalConDescuento - totalPagado);

    budgets[budgetIndex] = presupuesto;
    await writeData('presupuestos.json', budgets);

    // Update Fiesta in database
    const newDoc = {
      id: docId,
      nombre: `Adenda Cambio de Fecha a ${newDateFmt} (Firma Manual)`,
      tipo: 'cambio_fecha',
      fileName: filename,
      timestamp: new Date().toISOString(),
    };

    if (fiesta.configuracion) {
      fiesta.configuracion.fechaEvento = payload.newDate;
    }

    const updatedFiesta = {
      ...fiesta,
      othersDocumentos: [...(fiesta.othersDocumentos || []), newDoc]
    };
    await saveFiesta(updatedFiesta);

    // Create system notification
    const { createNotification } = await import('../notifications');
    await createNotification({
      mensaje: `📅 Cliente cambió fecha a ${newDateFmt} en "${fiesta.configuracion.nombreEvento}". Adenda generada.`,
      href: `/fiestas/nueva?fiestaId=${fiestaId}&tab=portal-cliente`,
      icono: 'Calendar',
    });

    return {
      success: true,
      fileName: filename,
      penaltyAmount,
      newBalance: presupuesto.saldo
    };

  } catch (e: any) {
    return { success: false, error: sanitizeActionError(e) };
  }
}


