export type SimulatorCommercialSource =
  | 'simulador_comun'
  | 'simulador_asistente'
  | 'portal_led'
  | 'landing_quince'
  | 'landing_boda'
  | 'landing_cumpleanos'
  | 'landing_empresarial'
  | 'whatsapp'
  | 'facebook'
  | 'instagram'
  | 'otro';

export type SimulatorLeadTemperature = 'frio' | 'tibio' | 'caliente' | 'urgente';

export type SimulatorConversionInput = {
  source: SimulatorCommercialSource;
  clientName: string;
  phone?: string;
  eventType?: string;
  eventDate?: string;
  guests?: number;
  hasVenue?: boolean | null;
  wantsClubUruguay?: boolean;
  estimatedTotal?: number;
  completedSalesPresentation?: boolean;
  requestedMeeting?: boolean;
  clickedWhatsApp?: boolean;
  createdBudget?: boolean;
  viewedTechnologyValue?: boolean;
  acceptedFollowUp?: boolean;
};

export type SimulatorConversionPlan = {
  source: SimulatorCommercialSource;
  leadTemperature: SimulatorLeadTemperature;
  crmTags: string[];
  nextAction: string;
  whatsappMessage: string;
  internalNote: string;
  shouldCreateTask: boolean;
  shouldPrioritize: boolean;
  salesStage: 'educar' | 'validar_interes' | 'agendar_entrevista' | 'cerrar_fecha';
  followUpTaskTitle: string;
  crmPriorityLabel: string;
  valueProof: string[];
};

function normalize(value?: string): string {
  return (value || '').trim();
}

function daysUntil(dateISO?: string): number | null {
  if (!dateISO) return null;
  const date = new Date(dateISO);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function classifySimulatorLeadTemperature(input: SimulatorConversionInput): SimulatorLeadTemperature {
  const days = daysUntil(input.eventDate);
  if (input.requestedMeeting && input.createdBudget) return 'urgente';
  if (input.requestedMeeting || input.clickedWhatsApp || input.acceptedFollowUp) return 'caliente';
  if (days !== null && days <= 45) return 'urgente';
  if (input.createdBudget || input.completedSalesPresentation || input.viewedTechnologyValue) return 'tibio';
  return 'frio';
}

export function buildSimulatorCrmTags(input: SimulatorConversionInput): string[] {
  const tags = new Set<string>();
  tags.add(`origen:${input.source}`);
  tags.add('simulador');

  if (input.eventType) tags.add(`tipo:${normalize(input.eventType).toLowerCase()}`);
  if (input.wantsClubUruguay) tags.add('interes:club_uruguay');
  if (input.hasVenue === false) tags.add('necesita_salon');
  if (input.completedSalesPresentation) tags.add('vio_presentacion_ak');
  if (input.viewedTechnologyValue) tags.add('vio_tecnologia_ak');
  if (input.clickedWhatsApp) tags.add('accion:whatsapp');
  if (input.requestedMeeting) tags.add('accion:entrevista');
  if (input.acceptedFollowUp) tags.add('accion:acepta_seguimiento');
  if (input.createdBudget) tags.add('presupuesto:referencia_generada');

  tags.add(`temperatura:${classifySimulatorLeadTemperature(input)}`);
  return Array.from(tags);
}

export function buildSimulatorWhatsappMessage(input: SimulatorConversionInput): string {
  const name = normalize(input.clientName) || 'Hola';
  const eventType = normalize(input.eventType) || 'tu fiesta';
  const total = input.estimatedTotal && input.estimatedTotal > 0
    ? ` El simulador te dejó una referencia de UYU ${Math.round(input.estimatedTotal).toLocaleString('es-UY')}.`
    : '';

  const technology = input.viewedTechnologyValue || input.completedSalesPresentation
    ? ' Además viste cómo AK conecta portal, invitación, invitados, muro social y seguimiento para que la fiesta no sea solo una lista de servicios.'
    : '';

  return `${name}, gracias por usar el simulador de AK Producciones. Ya tenemos datos de ${eventType}.${total}${technology} El siguiente paso es coordinar una entrevista gratis para revisar servicios, menú, fecha y dejar el presupuesto bien ajustado.`;
}

function buildSalesStage(input: SimulatorConversionInput, leadTemperature: SimulatorLeadTemperature): SimulatorConversionPlan['salesStage'] {
  if (input.requestedMeeting || leadTemperature === 'urgente') return 'cerrar_fecha';
  if (input.clickedWhatsApp || input.acceptedFollowUp) return 'agendar_entrevista';
  if (input.createdBudget || input.completedSalesPresentation || input.viewedTechnologyValue) return 'validar_interes';
  return 'educar';
}

function buildValueProof(input: SimulatorConversionInput): string[] {
  const proof = [
    'Organización integral AK antes, durante y después de la fiesta.',
    'Precio de referencia explicado como punto de partida, no como cierre automático.',
  ];

  if (input.completedSalesPresentation) proof.push('El cliente vio la presentación de valor antes del precio.');
  if (input.viewedTechnologyValue) proof.push('El cliente vio tecnología AK: portal, invitación, social, QR y post-fiesta.');
  if (input.wantsClubUruguay) proof.push('Hay interés explícito en Club Uruguay.');
  if (input.hasVenue === false) proof.push('Necesita salón, oportunidad para propuesta completa.');
  return proof;
}

export function buildSimulatorConversionPlan(input: SimulatorConversionInput): SimulatorConversionPlan {
  const leadTemperature = classifySimulatorLeadTemperature(input);
  const source = input.source;
  const crmTags = buildSimulatorCrmTags(input);
  const days = daysUntil(input.eventDate);
  const shouldPrioritize = leadTemperature === 'caliente' || leadTemperature === 'urgente';
  const salesStage = buildSalesStage(input, leadTemperature);
  const crmPriorityLabel = leadTemperature === 'urgente'
    ? 'Cerrar fecha hoy'
    : shouldPrioritize
      ? 'Responder en el día'
      : salesStage === 'validar_interes'
        ? 'Seguimiento educativo'
        : 'Nutrir con valor AK';

  const nextAction = input.requestedMeeting
    ? 'Coordinar entrevista y confirmar disponibilidad de fecha.'
    : input.clickedWhatsApp
      ? 'Responder WhatsApp con propuesta de entrevista gratis.'
      : input.createdBudget
        ? 'Hacer seguimiento del presupuesto de referencia.'
        : 'Enviar mensaje educativo y ofrecer entrevista gratis.';

  const internalNote = [
    `Origen comercial: ${source}`,
    input.eventType ? `Tipo de fiesta: ${input.eventType}` : undefined,
    input.eventDate ? `Fecha tentativa: ${input.eventDate}` : undefined,
    typeof input.guests === 'number' ? `Invitados: ${input.guests}` : undefined,
    days !== null ? `Faltan aprox. ${days} dias` : undefined,
    input.estimatedTotal ? `Referencia: UYU ${Math.round(input.estimatedTotal).toLocaleString('es-UY')}` : undefined,
  ].filter(Boolean).join(' | ');

  return {
    source,
    leadTemperature,
    crmTags,
    nextAction,
    whatsappMessage: buildSimulatorWhatsappMessage(input),
    internalNote,
    shouldCreateTask: true,
    shouldPrioritize,
    salesStage,
    followUpTaskTitle: `${crmPriorityLabel}: ${normalize(input.clientName) || 'lead de simulador'}`,
    crmPriorityLabel,
    valueProof: buildValueProof(input),
  };
}

export function buildSimulatorConversionChecklist(): string[] {
  return [
    'Guardar origen comercial del lead.',
    'Marcar si vio la presentacion de valor AK antes del precio.',
    'Guardar presupuesto como referencia pendiente de verificacion.',
    'Crear tarea de seguimiento si no agenda entrevista.',
    'Preparar mensaje WhatsApp con entrevista gratis como siguiente paso.',
    'Separar clientes que solo calcularon de los que ya vieron tecnologia AK.',
    'Priorizar cierre de fecha cuando hay entrevista pedida o evento cercano.',
  ];
}
