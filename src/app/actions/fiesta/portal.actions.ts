

'use server';

import type { FiestaEnPlanificacion, ClientTarea, ClientPortalSettings, ClientPaymentNotification, TimelineHito, MenuSeleccionPortal, ListaMusicaPortal, SocialGallerySettings } from '@/types/fiesta';
import { getFiestaById, saveFiesta, getFiestas } from './fiesta.actions';
import { addPagoToPresupuesto } from '../presupuestos';
import { createNotification } from '../notifications';

const MUSIC_LIST_KEYS = ['imprescindibles', 'siEsPosible', 'noQuiero'] as const;

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
    return { success: false, error: e.message };
  }
}

function createRequestId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function updateClientChecklist(fiestaId: string, checklist: ClientTarea[]) {
  return updateFiestaData(fiestaId, data => ({ ...data, clientChecklist: checklist }));
}

export async function updateClientChecklistItem(
  fiestaId: string,
  itemId: string,
  completed: boolean
): Promise<{ success: boolean; error?: string }> {
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
  return updateFiestaData(fiestaId, data => ({
    ...data,
    clientePortalExperience: { ...(data.clientePortalExperience ?? {}), ...experience },
  }));
}

export async function updateFaqPortal(fiestaId: string, faqItems: import('@/types/fiesta').FaqItem[]) {
  return updateFiestaData(fiestaId, data => ({ ...data, faqPortal: faqItems }));
}

export async function updateSocialGallerySettings(
  fiestaId: string,
  socialGallerySettings: SocialGallerySettings
) {
  return updateFiestaData(fiestaId, data => ({ ...data, socialGallerySettings }));
}

export async function getFiestaByAccessKey(accessKey: string): Promise<FiestaEnPlanificacion | null> {
  if (!accessKey || accessKey.trim() === '') return null;
  try {
    const fiestas = await getFiestas(false);
    return fiestas.find(
      f =>
        f.clientPortalSettings?.enabled === true &&
        f.clientPortalSettings?.accessKey === accessKey
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
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado' };

    const notification: ClientPaymentNotification = {
      id: `cpn_${crypto.randomUUID()}`,
      monto,
      comprobanteBase64,
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
      mensaje: `💳 Pago informado por cliente para "${fiesta.configuracion.nombreEvento}": $${monto.toLocaleString('es-UY')}`,
      href: `/fiestas/nueva?fiestaId=${fiestaId}&tab=pagos`,
      icono: 'CreditCard',
    });

    return { success: true, notificationId: notification.id };
  } catch (e: any) {
    return { success: false, error: e.message };
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
    return { success: false, error: e.message };
  }
}

export async function approveClientPayment(
  fiestaId: string,
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Evento no encontrado' };

    const notifications = fiesta.clientPaymentNotifications ?? [];
    const notifIndex = notifications.findIndex(n => n.id === notificationId);
    if (notifIndex === -1) return { success: false, error: 'Notificación no encontrada' };

    const notif = notifications[notifIndex];
    const updatedNotif: ClientPaymentNotification = {
      ...notif,
      estado: 'aprobado',
      approvedAt: new Date().toISOString(),
    };

    const updatedNotifications = notifications.map((n, i) =>
      i === notifIndex ? updatedNotif : n
    );

    const updated: FiestaEnPlanificacion = {
      ...fiesta,
      clientPaymentNotifications: updatedNotifications,
    };
    await saveFiesta(updated);

    // Discount from budget if linked
    if (fiesta.presupuestoId) {
      await addPagoToPresupuesto(fiesta.presupuestoId, {
        fecha: new Date().toISOString(),
        monto: notif.monto,
        metodoPago: 'Transferencia Bancaria',
        referencia: `Pago verificado desde Portal VIP (${notif.id})`,
      });
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function rejectClientPayment(
  fiestaId: string,
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  return updateFiestaData(fiestaId, fiesta => {
    const updated = (fiesta.clientPaymentNotifications ?? []).map(n =>
      n.id === notificationId ? { ...n, estado: 'rechazado' as const } : n
    );
    return { ...fiesta, clientPaymentNotifications: updated };
  });
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
  return updateFiestaData(fiestaId, fiesta => ({
    ...fiesta,
    timeline,
  }));
}

export async function saveMenuSeleccion(
  fiestaId: string,
  menuSeleccion: MenuSeleccionPortal
): Promise<{ success: boolean; error?: string }> {
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
