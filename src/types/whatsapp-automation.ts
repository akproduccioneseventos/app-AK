// Trigger types for automation rules
export type AutomationTrigger =
  | 'simulador_completado'
  | 'presupuesto_generado'
  | 'presupuesto_enviado'
  | 'contrato_firmado'
  | 'pago_vencido'
  | 'pago_por_vencer'
  | 'fiesta_creada'
  | 'manual';

export type MessageTemplateType =
  | 'recordatorio_reunion'
  | 'presupuesto_24h'
  | 'presupuesto_48h'
  | 'simulador_completado'
  | 'pago_vencido'
  | 'pago_por_vencer'
  | 'bienvenida'
  | 'contrato_firmado'
  | 'personalizado';

export interface WhatsAppAutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  delayHours: number; // 0 = immediate, 24 = 24h, 48 = 48h, etc.
  templateType: MessageTemplateType;
  customTemplate?: string; // If templateType === 'personalizado'
  enabled: boolean;
  targetType: 'prospecto' | 'cliente';
  createdAt: string;
}

export type ScheduledMessageStatus = 'pendiente' | 'enviado' | 'reprogramado' | 'cancelado';

export interface ScheduledMessage {
  id: string;
  // Target
  targetType: 'prospecto' | 'cliente';
  targetId: string; // leadId or fiestaId
  targetName: string;
  targetPhone?: string;
  // Message details
  templateType: MessageTemplateType;
  messageText: string; // Pre-rendered text
  // Scheduling
  scheduledAt: string; // ISO - when it should be sent
  status: ScheduledMessageStatus;
  // Tracking
  sentAt?: string; // when it was actually sent
  sentBy?: string; // who triggered the send
  rescheduledTo?: string; // if rescheduled
  notes?: string;
  // Links
  fiestaId?: string;
  leadId?: string;
  createdAt: string;
  // Rule that triggered it (if auto-created)
  automationRuleId?: string;
}
