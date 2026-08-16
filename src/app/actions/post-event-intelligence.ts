'use server';

import { getAllFiestas, getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { createNotification } from '@/lib/notifications/create-notification';
import { saveAgentLearning } from '@/lib/multiagent/memory-store';
import { calculateFiestaPreparationScore } from '@/lib/fiesta/preparation-score';
import { generateWithGeminiFallback, getGeminiModelForAgent } from '@/ai/genkit';

export interface PostEventItem {
  fiestaId: string;
  nombreEvento: string;
  fechaEvento?: string;
  daysAfter: number;
  preparationScore: number;
  pendingTasks: number;
  href: string;
  testimonyMessage: string;
  photoMessage: string;
  socialPostIdea: string;
}

function toDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysAfter(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
}

function getNombre(fiesta: any) {
  return fiesta?.configuracion?.nombreEvento || fiesta?.nombreEvento || 'Fiesta sin nombre';
}

function getCliente(fiesta: any) {
  return fiesta?.configuracion?.clienteNombre || fiesta?.clienteNombre || 'familia';
}

function buildMessages(fiesta: any, score: number, pendingTasks: number) {
  const nombre = getNombre(fiesta);
  const cliente = getCliente(fiesta);
  const tipo = fiesta?.configuracion?.tipoEvento || fiesta?.configuracion?.tipoFiesta || 'fiesta';

  const testimonyMessage = `Hola ${cliente}, ¿cómo están? De parte de AK Producciones queríamos agradecerles por confiar en nosotros para ${nombre}. Para nosotros fue un gusto acompañarlos. Si quedaron conformes, nos ayudaría muchísimo que nos dejen un comentario o testimonio cortito sobre cómo vivieron la experiencia.`;

  const photoMessage = `Hola ${cliente}, ¿cómo están? Queríamos consultarles si nos autorizan a usar algunas fotos o videos de ${nombre} para mostrar parte del trabajo de AK Producciones en nuestras redes. Siempre lo hacemos con respeto y cuidando la imagen de la familia.`;

  const socialPostIdea = `POST SUGERIDO: ${nombre}\n\nOtra ${tipo} acompañada por AK Producciones. Detrás de cada evento hay planificación, coordinación y un equipo cuidando cada detalle para que la familia pueda disfrutar.\n\nNivel interno de preparación: ${score}%\nPendientes al cierre: ${pendingTasks}\n\nCTA: Coordiná tu entrevista sin costo con AK Producciones.`;

  return { testimonyMessage, photoMessage, socialPostIdea };
}

export async function getPostEventOpportunities(): Promise<{ success: boolean; data: PostEventItem[] }> {
  const fiestas = await getAllFiestas().catch(() => []);

  const data = (fiestas as any[])
    .map(fiesta => {
      const date = toDate(fiesta?.configuracion?.fechaEvento);
      if (!date) return null;
      const after = daysAfter(date);
      if (after < 1 || after > 45) return null;

      const score = calculateFiestaPreparationScore(fiesta);
      const pendingTasks = (fiesta?.tareas || []).filter((t: any) => !t.completada).length;
      const messages = buildMessages(fiesta, score.score, pendingTasks);

      return {
        fiestaId: fiesta.id,
        nombreEvento: getNombre(fiesta),
        fechaEvento: fiesta?.configuracion?.fechaEvento,
        daysAfter: after,
        preparationScore: score.score,
        pendingTasks,
        href: `/fiestas/nueva?fiestaId=${fiesta.id}`,
        ...messages,
      } satisfies PostEventItem;
    })
    .filter(Boolean) as PostEventItem[];

  return {
    success: true,
    data: data.sort((a, b) => a.daysAfter - b.daysAfter),
  };
}

export async function createPostEventPackage(fiestaId: string, notes?: string) {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return { success: false, error: 'No encontré la fiesta.' };

  const score = calculateFiestaPreparationScore(fiesta);
  const pendingTasks = ((fiesta as any)?.tareas || []).filter((t: any) => !t.completada).length;
  const messages = buildMessages(fiesta, score.score, pendingTasks);
  const nombre = getNombre(fiesta);

  const summary = [
    `Cierre post-fiesta: ${nombre}`,
    `Nivel de preparación registrado: ${score.score}% (${score.label})`,
    `Pendientes al cierre: ${pendingTasks}`,
    notes ? `Notas del organizador: ${notes}` : '',
    `Mensaje testimonio: ${messages.testimonyMessage}`,
    `Mensaje fotos/redes: ${messages.photoMessage}`,
    `Idea de publicación: ${messages.socialPostIdea}`,
  ].filter(Boolean).join('\n\n');

  await saveAgentLearning({
    agentType: 'fiesta',
    fiestaId,
    title: `Cierre post-fiesta: ${nombre}`,
    content: summary,
    tags: ['post-fiesta', 'testimonio', 'marketing'],
    source: 'event_closeout',
    confidence: 'high',
  });

  await saveAgentLearning({
    agentType: 'fiestas_general',
    module: 'fiestas_general',
    title: `Aprendizaje post-fiesta: ${nombre}`,
    content: summary,
    tags: ['post-fiesta', 'retroalimentacion', 'mejora-continua'],
    source: 'event_closeout',
    confidence: 'high',
  });

  await saveAgentLearning({
    agentType: 'marketing',
    module: 'marketing',
    title: `Idea de publicación post-fiesta: ${nombre}`,
    content: messages.socialPostIdea,
    tags: ['marketing', 'post-fiesta', 'redes'],
    source: 'event_closeout',
    confidence: 'high',
  });

  await createNotification({
    titulo: `Post-fiesta preparado: ${nombre}`,
    mensaje: 'Se guardaron mensajes de testimonio, autorización de fotos e idea de publicación.',
    tipo: 'exito',
    href: '/control-tower/post-fiesta',
    icono: 'PartyPopper',
    entidadRelacionadaId: fiestaId,
    rolDestino: 'admin',
  }).catch(() => null);

  return { success: true, summary, ...messages };
}

export async function generateAiPostEventMaterial(params: {
  clientName: string;
  eventName: string;
  eventType?: string;
  score?: number;
  pendingTasks?: number;
}): Promise<{
  success: boolean;
  testimonyMessage: string;
  photoMessage: string;
  socialPostIdea: string;
}> {
  try {
    const model = getGeminiModelForAgent('marketing');
    const prompt = `Sos el Agente de Marketing de AK Producciones (Salto, Uruguay).
Generá material post-evento 100% personalizado con IA para:
- Cliente: ${params.clientName}
- Fiesta: ${params.eventName}
- Tipo de evento: ${params.eventType || 'Fiesta'}

Devolvé ÚNICAMENTE un objeto JSON válido con estas tres claves:
1. "testimonyMessage": Mensaje emotivo y cálido de WhatsApp agradeciéndoles por la fiesta y pidiéndoles un testimonio/reseña corto.
2. "photoMessage": Mensaje respetuoso pidiendo permiso para compartir fotos/videos en redes sociales de AK Producciones.
3. "socialPostIdea": Copy completo y atractivo para un post de Instagram/Facebook sobre el evento (con emojis y hashtags relevantes).

JSON:`;

    const result = await generateWithGeminiFallback({
      model,
      prompt,
    });

    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        testimonyMessage: parsed.testimonyMessage || '',
        photoMessage: parsed.photoMessage || '',
        socialPostIdea: parsed.socialPostIdea || '',
      };
    }

    throw new Error('Respuesta inválida de Gemini');
  } catch (error: any) {
    console.error('Error generando post-evento con IA:', error);
    const defaults = buildMessages(
      { configuracion: { clienteNombre: params.clientName, nombreEvento: params.eventName, tipoEvento: params.eventType } },
      params.score || 100,
      params.pendingTasks || 0,
    );
    return {
      success: false,
      ...defaults,
    };
  }
}

