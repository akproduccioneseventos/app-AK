import 'server-only';

import { getFiestas, getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { buildAkWhatsAppUrl } from '@/lib/public-contact';
import { readData } from '@/lib/data-service';
import type { FeedbackSubmission } from '@/types/feedback';

export interface FiestaSeguimientoResena {
  id: string;
  nombreEvento: string;
  tipoCelebracion: string;
  fechaEvento: string;
  diasDesdeEvento: number;
  clienteNombre: string;
  clienteTelefono?: string;
  reviewRequested: boolean;
  reviewRequestedAt?: string;
  feedbackCompleted: boolean;
  npsScore?: number;
  whatsappUrl?: string;
  feedbackUrl: string;
}

export interface ResenasSeguimientoResumen {
  fiestas: FiestaSeguimientoResena[];
  totalUltimos30Dias: number;
  pedidas: number;
  pendientes: number;
  completadas: number;
}

/**
 * Obtiene las fiestas realizadas en los últimos 30 días para gestionar
 * la solicitud de opinión y reseña de Google por cliente.
 */
export async function getFiestasSeguimientoResenas(): Promise<ResenasSeguimientoResumen> {
  const [allFiestas, allPresupuestos, allFeedback] = await Promise.all([
    getFiestas(true).catch(() => []),
    getPresupuestos().catch(() => []),
    readData<FeedbackSubmission[]>('feedback.json', []).catch(() => []),
  ]);

  const presupuestosMap = new Map(allPresupuestos.map((p) => [p.id, p]));
  const feedbacksMap = new Map<string, FeedbackSubmission[]>();
  for (const fb of allFeedback) {
    const list = feedbacksMap.get(fb.fiestaId) || [];
    list.push(fb);
    feedbacksMap.set(fb.fiestaId, list);
  }

  const ahora = new Date();
  const hace30Dias = new Date();
  hace30Dias.setDate(ahora.getDate() - 30);

  const fiestasRecientes: FiestaSeguimientoResena[] = [];

  for (const fiesta of allFiestas) {
    const fechaStr = fiesta.configuracion?.fechaEvento;
    if (!fechaStr) continue;

    const fechaEvento = new Date(fechaStr);
    if (isNaN(fechaEvento.getTime())) continue;

    // Solo eventos pasados en los últimos 30 días (o hasta hoy)
    const diffTime = ahora.getTime() - fechaEvento.getTime();
    const diasDesdeEvento = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diasDesdeEvento < 0 || diasDesdeEvento > 30) continue;

    const pAsociado = fiesta.presupuestoId ? presupuestosMap.get(fiesta.presupuestoId) : undefined;
    const clienteNombre =
      fiesta.configuracion?.clienteNombre ||
      pAsociado?.clienteNombre ||
      fiesta.configuracion?.protagonista1Nombre ||
      'Cliente';

    const rawPhone = pAsociado?.clienteContacto || fiesta.configuracion?.telefonoAsistencia;
    let cleanPhone = rawPhone ? rawPhone.replace(/\D/g, '') : undefined;
    if (cleanPhone && cleanPhone.startsWith('09')) {
      cleanPhone = '598' + cleanPhone.slice(1);
    }

    // Verificar si ya completó la encuesta
    const feedbacks = feedbacksMap.get(fiesta.id) || [];
    const feedbackCompleted = feedbacks.length > 0;
    const npsScore = feedbackCompleted ? feedbacks[0].npsScore : fiesta.npsScore;

    const feedbackUrl = `/feedback/${fiesta.id}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://akproducciones.uy';
    const fullFeedbackUrl = `${baseUrl}${feedbackUrl}`;

    const nombreCorto = clienteNombre.split(' ')[0];
    const mensajeWhatsApp = `¡Hola ${nombreCorto}! Esperamos que hayan disfrutado mucho de ${fiesta.configuracion.nombreEvento}. Para todo el equipo de AK Producciones fue un placer enorme acompañarlos. ¿Nos dejarías tu opinión en este link? Son 2 minutitos y nos ayuda un montón: ${fullFeedbackUrl}`;

    const whatsappUrl = cleanPhone
      ? buildAkWhatsAppUrl(mensajeWhatsApp, cleanPhone)
      : undefined;

    fiestasRecientes.push({
      id: fiesta.id,
      nombreEvento: fiesta.configuracion.nombreEvento,
      tipoCelebracion: fiesta.configuracion.tipoCelebracion,
      fechaEvento: fechaStr,
      diasDesdeEvento,
      clienteNombre,
      clienteTelefono: cleanPhone,
      reviewRequested: fiesta.googleReviewRequested ?? false,
      reviewRequestedAt: fiesta.googleReviewRequestedAt,
      feedbackCompleted,
      npsScore,
      whatsappUrl,
      feedbackUrl: fullFeedbackUrl,
    });
  }

  // Ordenar de más reciente a más antigua
  fiestasRecientes.sort((a, b) => a.diasDesdeEvento - b.diasDesdeEvento);

  const pedidas = fiestasRecientes.filter((f) => f.reviewRequested).length;
  const pendientes = fiestasRecientes.filter((f) => !f.reviewRequested).length;
  const completadas = fiestasRecientes.filter((f) => f.feedbackCompleted).length;

  return {
    fiestas: fiestasRecientes,
    totalUltimos30Dias: fiestasRecientes.length,
    pedidas,
    pendientes,
    completadas,
  };
}

/**
 * Marca una fiesta como con reseña/opinión solicitada al cliente.
 */
export async function marcarResenaSolicitada(fiestaId: string): Promise<boolean> {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return false;

  fiesta.googleReviewRequested = true;
  fiesta.googleReviewRequestedAt = new Date().toISOString();

  await saveFiesta(fiesta);
  return true;
}
