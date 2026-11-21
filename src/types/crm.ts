

import type { PresupuestoSource } from './presupuesto';
import type { ContractType } from './settings';
import type { CommercialAttribution } from '@/lib/commercial/acquisition';
import type { SimulatorLeadTemperature } from '@/lib/commercial/simulator-conversion-engine';

export interface CrmLeadHistoryItem {
  stageId: string;
  stageName: string;
  timestamp: string;
}

export type CrmTimelineEventType =
  | 'stage_change'
  | 'meeting_scheduled'
  | 'note_added'
  | 'presupuesto_created'
  | 'contract_uploaded'
  | 'contract_signed'
  | 'deposit_registered'
  | 'event_created'
  | 'whatsapp_sent'
  | 'whatsapp_opened'
  | 'whatsapp_scheduled'
  | 'payment_reminder_sent'
  | 'lead_created'
  | 'ai_analysis'
  | 'assistant_handoff';

export interface CrmTimelineItem {
  id: string;
  type: CrmTimelineEventType;
  timestamp: string;
  description: string;
  meta?: Record<string, string | number | boolean>;
}

export interface CrmStage {
  id: string;
  name: string;
  order: number;
  // Tailwind classes for styling
  bgColor: string;
  borderColor: string;
  textColor: string;
  headerBgColor: string;
  headerTextColor: string;
  isConversionStage?: boolean; // Optional flag for special stages
}

export type CrmMensajeCanal =
  | 'whatsapp'
  | 'instagram_dm'
  | 'messenger'
  | 'instagram_comentario'
  | 'facebook_comentario'
  | 'simulador'
  | 'rescatado';

export type CrmMensajeDireccion = 'entrante' | 'saliente' | 'sistema';

export interface CrmMensaje {
  id: string;
  idExterno?: string;
  canal: CrmMensajeCanal;
  direccion: CrmMensajeDireccion;
  texto: string;
  fecha: string;
  autor?: string;
  respondidoPor?: 'asistente' | 'persona';
  meta?: Record<string, string | number | boolean>;
}

export interface CrmLead {
  id: string;
  name: string;
  currentStageId?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  email?: string;
  phone?: string;
  notes?: string;
  history?: CrmLeadHistoryItem[];
  timeline?: CrmTimelineItem[];
  conversacion?: CrmMensaje[];
  atiende?: 'asistente' | 'persona';
  esProspectoDudoso?: boolean;
  origenWhatsApp?: 'anuncio' | 'crm_existente' | 'marca_ak' | 'llego_solo' | 'dudoso_ia' | 'rescatado';
  notaClasificacionIA?: number;
  // Optional party details
  partyType?: string;
  venueName?: string;
  guestCount?: number;
  /** Una cita o seguimiento AGENDADO de verdad. La fecha de la fiesta no va acá (Codex, auditoria 78). */
  followUpDate?: string;
  /** La fecha en que el prospecto quiere hacer la fiesta. No es una cita. */
  eventDate?: string;
  presupuestoId?: string; // ID of the linked budget
  presupuestoEstado?: 'Borrador' | 'Pendiente Verificación' | 'Enviado' | 'Aceptado' | 'Rechazado' | 'Facturado'; // Denormalized status
  invoiceId?: string; // If the budget was invoiced
  budgetSource?: PresupuestoSource;
  lastBudgetAt?: string;
  presupuestoVecesVisto?: number;
  presupuestoVistoAt?: string;
  // Contact tracking
  lastContactedAt?: string; // ISO date string
  lastContactMethod?: 'whatsapp' | 'phone' | 'email' | 'in_person';
  // Ownership
  assignedTo?: string; // Empleado id or name
  contractGeneratedType?: ContractType;
  contractGeneratedAt?: string;
  contractTemplateId?: string;
  acquisition?: CommercialAttribution;
  acquisitionHistory?: Array<CommercialAttribution & { capturedAt: string }>;
  crmTags?: string[];
  leadTemperature?: SimulatorLeadTemperature;
  nextAction?: string;
  publicIdentityKey?: string;
  birthdayMonthDay?: string;
  marketingConsent?: boolean;
  marketingConsentAt?: string;
  marketingConsentSource?: string;
  referrerEventName?: string;
  lastInboundAt?: string;
  /**
   * Cuándo se le mandó el mensaje automático de recontacto. Se anota para no
   * escribirle nunca dos veces: un prospecto que recibe el mismo mensaje tres
   * veces se va a la competencia.
   */
  recontactoAutomaticoAt?: string;
  /**
   * Seguimiento en varios pasos (Orden 95).
   * Registra cada paso de la secuencia que ya recibió el prospecto.
   */
  recontactosEnviados?: Array<{ paso: number; at: string }>;
  /** Resumen en 1 línea generado por IA al entrar un mensaje nuevo. */
  resumenIA?: string;
  /** Borrador de respuesta preparada para revisar y abrir en WhatsApp (nunca se envía solo). */
  borradorRespuesta?: string;
  borradorRespuestaAt?: string;
  /** Código corto de referencia para enlaces a WhatsApp (ej: AK-1234). */
  referenciaCodigo?: string;
  canalOrigen?: 'whatsapp' | 'web' | 'instagram_dm' | 'messenger' | string;
  clasificacionProspecto?: { tipo?: string; nota?: number; esPersonal?: boolean };
}

export type NewCrmLeadData = Omit<CrmLead, 'id' | 'createdAt' | 'updatedAt' | 'history' | 'presupuestoEstado' | 'invoiceId' >;

export interface CrmAppointment {
  id: string;
  leadId?: string;
  presupuestoId?: string;
  clienteNombre: string;
  clienteContacto: string;
  clienteEmail?: string;
  eventoTipo?: string;
  fechaHora: string;
  lugar?: string;
  notas?: string;
  estado: 'Agendada' | 'Confirmada' | 'Realizada' | 'Cancelada';
  recordatorioEnviado?: boolean;
  creadoEn: string;
}
