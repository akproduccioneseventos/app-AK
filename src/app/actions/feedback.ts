
'use server';

import type { FeedbackSubmission, Testimonial } from '@/types/feedback';
import { readData, writeData } from '@/lib/data-service';
import { requireAppSession } from '@/lib/auth/require-session';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { getCompanyInfo } from '@/app/actions/settings';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getWhatsAppConfig } from '@/app/actions/whatsapp';
import { sendMetaWhatsAppMessage } from '@/lib/whatsapp/meta-sender';
import { WHATSAPP_WEBHOOK_INTERNAL_TOKEN } from '@/lib/whatsapp/internal-token';
import type { CompanyInfo } from '@/types/settings';
import type { Customer } from '@/types/customer';

const FEEDBACK_FILE = 'feedback.json';
const TESTIMONIALS_FILE = 'testimonials.json';
const CUSTOMERS_FILE = 'customers.json';

// El cliente contesta la encuesta sin estar logueado, asi que aca no se puede
// usar getCustomerById: esa accion exige sesion y tira "No autorizado". Se lee
// el telefono directo del archivo, del lado del servidor, y no sale del server:
// lo unico que se hace con el es mandarle el WhatsApp.
async function telefonoDelClienteDeLaFiesta(clienteId: string): Promise<string> {
  const customers = await readData<Customer[]>(CUSTOMERS_FILE, []);
  return customers.find(c => c.id === clienteId)?.phone || '';
}

// Una sola vez por evento: si a ese cliente ya se le pidio la resena por esta
// fiesta, no se le vuelve a escribir. La encuesta es publica y se puede mandar
// mas de una vez, asi que sin esto llegarian mensajes repetidos.
function yaSeLePidioPorEstaFiesta(todos: FeedbackSubmission[], fiestaId: string): boolean {
  return todos.some(fb => fb.fiestaId === fiestaId && fb.googleReviewRequested === true);
}

const sortFn = (a: any, b: any) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime();

export async function saveFeedback(submission: Omit<FeedbackSubmission, 'id' | 'timestamp'>): Promise<{ success: boolean, feedback?: FeedbackSubmission, error?: string }> {
  await enforcePublicRateLimit({
    scope: 'event-feedback',
    identity: `${submission.fiestaId}|${submission.clientName}`,
    limit: 3,
    windowMs: 24 * 60 * 60 * 1000,
  });
  const allFeedback = await readData<FeedbackSubmission[]>(FEEDBACK_FILE, []);
  const newFeedback: FeedbackSubmission = {
    ...submission,
    id: `fb_${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  // Pedido automatico de resena en Google. Va a TODOS los que contestan la
  // encuesta, sin mirar la nota: pedirsela solo a los contentos es filtrar
  // resenas, y Google lo castiga borrandolas. Lo que cambia segun la nota es el
  // texto del mensaje, no a quien se le manda.
  if (!yaSeLePidioPorEstaFiesta(allFeedback, newFeedback.fiestaId)) {
    try {
      const company = await getCompanyInfo();
      if (company.enableGoogleReviewsAutoRequest && company.googleReviewsLink) {
        const result = await enviarPedidoDeResena(newFeedback, company);
        if (result.success) {
           newFeedback.googleReviewRequested = true;
        }
      }
    } catch (e) {
      console.error("Error auto-requesting Google Review", e);
    }
  }

  allFeedback.push(newFeedback);
  await writeData(FEEDBACK_FILE, allFeedback, sortFn);
  return { success: true, feedback: newFeedback };
}

export async function getFeedback(): Promise<FeedbackSubmission[]> {
  await requireAppSession();
  return readData<FeedbackSubmission[]>(FEEDBACK_FILE, []);
}

async function getTestimonialsInternal(): Promise<Testimonial[]> {
  return readData<Testimonial[]>(TESTIMONIALS_FILE, []);
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return (await getTestimonialsInternal()).filter((testimonial) => testimonial.isApproved);
}

export async function getAllTestimonials(): Promise<Testimonial[]> {
  await requireAppSession();
  return getTestimonialsInternal();
}

export async function saveTestimonial(testimonialData: Omit<Testimonial, 'id' | 'createdAt' | 'isApproved'>): Promise<{ success: boolean, testimonial?: Testimonial, error?: string }> {
  await requireAppSession();
  const allTestimonials = await getTestimonialsInternal();
  
  if (allTestimonials.some(t => t.feedbackId === testimonialData.feedbackId)) {
    return { success: false, error: "Ya existe un testimonio para este feedback." };
  }

  const newTestimonial: Testimonial = {
    ...testimonialData,
    id: `testim_${Date.now()}`,
    isApproved: false,
    createdAt: new Date().toISOString(),
  };
  allTestimonials.push(newTestimonial);
  await writeData(TESTIMONIALS_FILE, allTestimonials, sortFn);
  return { success: true, testimonial: newTestimonial };
}

export async function updateTestimonialApproval(testimonialId: string, isApproved: boolean): Promise<{ success: boolean, error?: string }> {
  await requireAppSession();
  const allTestimonials = await getTestimonialsInternal();
  const index = allTestimonials.findIndex(t => t.id === testimonialId);
  if (index === -1) {
    return { success: false, error: "Testimonio no encontrado." };
  }
  allTestimonials[index].isApproved = isApproved;
  await writeData(TESTIMONIALS_FILE, allTestimonials, sortFn);
  return { success: true };
}

export async function updateTestimonialScreenshot(testimonialId: string, screenshotUrl: string): Promise<{ success: boolean, error?: string }> {
  await requireAppSession();
  const allTestimonials = await getTestimonialsInternal();
  const index = allTestimonials.findIndex(t => t.id === testimonialId);
  if (index === -1) {
    return { success: false, error: "Testimonio no encontrado." };
  }
  allTestimonials[index].screenshotUrl = screenshotUrl;
  await writeData(TESTIMONIALS_FILE, allTestimonials, sortFn);
  return { success: true };
}

export async function deleteTestimonial(testimonialId: string): Promise<{ success: boolean, error?: string }> {
  await requireAppSession();
  let allTestimonials = await getTestimonialsInternal();
  const initialLength = allTestimonials.length;
  allTestimonials = allTestimonials.filter(t => t.id !== testimonialId);
  if (allTestimonials.length === initialLength) {
    return { success: false, error: "Testimonio no encontrado para eliminar." };
  }
  await writeData(TESTIMONIALS_FILE, allTestimonials);
  return { success: true };
}

/**
 * Devuelve el enlace de resenas de Google que el dueno cargo en Ajustes, para la
 * pantalla de gracias de la encuesta.
 *
 * Es publica a proposito: la contesta el cliente sin cuenta. Solo devuelve ese
 * enlace, que de por si es publico, y nada mas de la ficha de la empresa. Si el
 * dueno no lo cargo, devuelve vacio y la pantalla esconde el bloque: nunca se
 * escribe una direccion de Google a mano, ya paso dos veces y hubo que sacarla.
 */
export async function getEnlaceDeResenaPublico(): Promise<string> {
  try {
    const company = await getCompanyInfo();
    return company.googleReviewsLink?.trim() || '';
  } catch {
    return '';
  }
}

async function enviarPedidoDeResena(feedback: FeedbackSubmission, company: CompanyInfo): Promise<{ success: boolean; error?: string }> {
  if (!company.googleReviewsLink) {
    return { success: false, error: "El enlace de Google no está configurado." };
  }

  // Get phone number from fiesta -> cliente
  const fiesta = await getFiestaById(feedback.fiestaId);
  if (!fiesta || !fiesta.configuracion.clienteId) {
    return { success: false, error: "No se encontró el cliente asociado al evento." };
  }
  const telefono = await telefonoDelClienteDeLaFiesta(fiesta.configuracion.clienteId);
  if (!telefono) {
    return { success: false, error: "El cliente no tiene un teléfono guardado." };
  }

  const waConfig = await getWhatsAppConfig(WHATSAPP_WEBHOOK_INTERNAL_TOKEN);
  if (!waConfig.enabled || !waConfig.apiKey || !waConfig.phoneNumberId) {
    return { success: false, error: "WhatsApp no está configurado o está deshabilitado." };
  }

  // El pedido va SIEMPRE, sin mirar la nota. Mandarselo solo a los contentos se
  // llama filtrar resenas: Google lo prohibe y castiga borrandolas. Ademas, un
  // negocio con puro cinco perfecto parece arreglado y vende menos que uno con
  // alguna de cuatro y respuestas prolijas abajo.
  //
  // Lo unico que cambia segun la nota es el texto: al que quedo disconforme
  // primero se le pide disculpas y se le avisa que el equipo lo va a contactar.
  // El enlace va igual, abajo.
  const esDetractor = (feedback.npsScore ?? 0) < 7;
  const messageText = esDetractor
    ? `¡Hola ${feedback.clientName}! Muchas gracias por tus comentarios sobre la fiesta "${feedback.fiestaNombre}".\n\nLamentamos no haber alcanzado tus expectativas al 100%. Nuestro equipo se va a contactar con vos a la brevedad para conversar sobre lo ocurrido y buscar una solución.\n\nSi igualmente querés dejar tu reseña en Google, podés hacerlo con total libertad acá:\n\n${company.googleReviewsLink}\n\n¡Muchas gracias!`
    : `¡Hola ${feedback.clientName}! Muchas gracias por tus comentarios sobre la fiesta "${feedback.fiestaNombre}".\n\nNos alegra mucho que hayas disfrutado la experiencia. ¿Te animarías a compartir tu opinión en Google? Nos ayudaría muchísimo:\n\n${company.googleReviewsLink}\n\n¡Un abrazo grande de parte de todo el equipo!`;

  const delivery = await sendMetaWhatsAppMessage({
    to: telefono,
    text: messageText,
    apiToken: waConfig.apiKey,
    phoneNumberId: waConfig.phoneNumberId,
  });

  if (!delivery.success) {
    return { success: false, error: delivery.error };
  }

  return { success: true };
}

export async function requestGoogleReviewManual(feedbackId: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  
  const allFeedback = await readData<FeedbackSubmission[]>(FEEDBACK_FILE, []);
  const index = allFeedback.findIndex(fb => fb.id === feedbackId);
  if (index === -1) {
    return { success: false, error: "Feedback no encontrado." };
  }

  const feedback = allFeedback[index];
  if (yaSeLePidioPorEstaFiesta(allFeedback, feedback.fiestaId)) {
    return { success: false, error: "Ya se le pidió la reseña a este cliente." };
  }

  const company = await getCompanyInfo();
  if (!company.googleReviewsLink) {
    return { success: false, error: "El enlace de Google no está configurado en Ajustes de Empresa." };
  }

  const result = await enviarPedidoDeResena(feedback, company);
  
  if (result.success) {
    allFeedback[index].googleReviewRequested = true;
    await writeData(FEEDBACK_FILE, allFeedback, sortFn);
  }

  return result;
}

