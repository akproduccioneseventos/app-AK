import type { FiestaSocialPostKind } from './private-feed';
import type { FiestaEventPreset, FiestaReadyPrompt } from './games-raffles-ranking';
import { getReadyPromptsForPreset } from './games-raffles-ranking';

export type AkAutomationStage = 'pre_evento' | 'semana_evento' | 'dia_evento' | 'post_evento';

export type AkAutomationChannel = 'red_social_fiesta' | 'invitacion' | 'portal_cliente' | 'muro_pantalla' | 'whatsapp';

export type AkAutomationItem = {
  id: string;
  stage: AkAutomationStage;
  channel: AkAutomationChannel;
  daysFromEvent: number;
  title: string;
  body: string;
  postKind: FiestaSocialPostKind;
  callToAction?: string;
  softSelling: boolean;
  requiresApproval: boolean;
};

export type AkAutomationPlan = {
  fiestaId: string;
  eventName: string;
  preset: FiestaEventPreset;
  eventDate: string;
  items: AkAutomationItem[];
};

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

function formatEventDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function createAutomationId(fiestaId: string, title: string, daysFromEvent: number): string {
  return `ak_auto_${fiestaId}_${daysFromEvent}_${title}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 90);
}

export function buildAkAutomationBaseItems(input: {
  fiestaId: string;
  eventName: string;
  eventDate: string;
}): AkAutomationItem[] {
  const dateLabel = formatEventDate(input.eventDate);
  return [
    {
      id: createAutomationId(input.fiestaId, 'bienvenida_red_social', -45),
      stage: 'pre_evento',
      channel: 'red_social_fiesta',
      daysFromEvent: -45,
      title: 'La fiesta ya empezó en la previa',
      body: `${input.eventName} ya tiene su espacio privado. Acá vas a ver avisos, desafíos, mensajes y momentos importantes antes del evento.`,
      postKind: 'aviso_ak',
      callToAction: 'Entrar y participar',
      softSelling: true,
      requiresApproval: false,
    },
    {
      id: createAutomationId(input.fiestaId, 'tip_organizacion', -30),
      stage: 'pre_evento',
      channel: 'red_social_fiesta',
      daysFromEvent: -30,
      title: 'Tip AK de organización',
      body: 'Una fiesta no se ordena sola: tiempos, proveedores, comida, música, invitados y detalles tienen que estar conectados. Para eso está AK Producciones.',
      postKind: 'venta_invisible',
      softSelling: true,
      requiresApproval: false,
    },
    {
      id: createAutomationId(input.fiestaId, 'cuenta_regresiva', -7),
      stage: 'semana_evento',
      channel: 'invitacion',
      daysFromEvent: -7,
      title: 'Falta una semana',
      body: `Falta una semana para ${input.eventName}. Revisá ubicación, horario, vestimenta y confirmación. Fecha: ${dateLabel}.`,
      postKind: 'cuenta_regresiva',
      callToAction: 'Ver datos del evento',
      softSelling: true,
      requiresApproval: false,
    },
    {
      id: createAutomationId(input.fiestaId, 'dia_evento_qr', 0),
      stage: 'dia_evento',
      channel: 'muro_pantalla',
      daysFromEvent: 0,
      title: 'Participá del Muro Social AK',
      body: 'Escaneá el QR, subí tus fotos y mensajes, participá en juegos y aparecé en la pantalla de la fiesta.',
      postKind: 'aviso_ak',
      callToAction: 'Escanear QR',
      softSelling: true,
      requiresApproval: false,
    },
    {
      id: createAutomationId(input.fiestaId, 'post_evento_album', 7),
      stage: 'post_evento',
      channel: 'portal_cliente',
      daysFromEvent: 7,
      title: 'Recuerdos después de la fiesta',
      body: 'Después del evento, AK organiza la entrega digital para que puedas ver y descargar tus recuerdos cuando estén listos.',
      postKind: 'recuerdo',
      callToAction: 'Ver álbum digital',
      softSelling: true,
      requiresApproval: false,
    },
  ];
}

export function buildChallengeAutomationItems(input: {
  fiestaId: string;
  prompts: FiestaReadyPrompt[];
}): AkAutomationItem[] {
  return input.prompts.slice(0, 6).map((prompt, index) => ({
    id: createAutomationId(input.fiestaId, prompt.id, prompt.showBeforeEvent ? -20 + index : index),
    stage: prompt.showBeforeEvent ? 'pre_evento' : 'dia_evento',
    channel: prompt.showBeforeEvent ? 'red_social_fiesta' : 'muro_pantalla',
    daysFromEvent: prompt.showBeforeEvent ? -20 + index : 0,
    title: prompt.title,
    body: prompt.prompt,
    postKind: prompt.suggestedGameType === 'pedido_musica' ? 'encuesta' : 'desafio',
    callToAction: 'Participar',
    softSelling: false,
    requiresApproval: true,
  }));
}

export function buildAkAutomationPlan(input: {
  fiestaId: string;
  eventName: string;
  eventDate: string;
  preset: FiestaEventPreset;
}): AkAutomationPlan {
  const prompts = getReadyPromptsForPreset(input.preset);
  const items = [
    ...buildAkAutomationBaseItems(input),
    ...buildChallengeAutomationItems({ fiestaId: input.fiestaId, prompts }),
  ].sort((a, b) => a.daysFromEvent - b.daysFromEvent || a.title.localeCompare(b.title));

  return {
    fiestaId: input.fiestaId,
    eventName: input.eventName,
    eventDate: input.eventDate,
    preset: input.preset,
    items,
  };
}

export function getAutomationItemsForDate(input: {
  plan: AkAutomationPlan;
  now: string;
}): AkAutomationItem[] {
  const eventDate = new Date(input.plan.eventDate);
  const now = new Date(input.now);
  if (Number.isNaN(eventDate.getTime()) || Number.isNaN(now.getTime())) return [];

  return input.plan.items.filter(item => {
    const scheduled = addDays(eventDate, item.daysFromEvent);
    return scheduled.toDateString() === now.toDateString();
  });
}

export function buildOperatorChecklistFromAutomation(plan: AkAutomationPlan): string[] {
  return plan.items.map(item => {
    const approval = item.requiresApproval ? 'requiere revisión' : 'automático';
    return `${item.daysFromEvent} días: ${item.title} · ${item.channel} · ${approval}`;
  });
}

export function buildAkSoftSellingDisclaimer(): string {
  return 'Estos mensajes posicionan a AK Producciones mostrando valor real dentro de la experiencia, sin vender de forma agresiva.';
}
