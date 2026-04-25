/**
 * Registro de herramientas del Asistente AK.
 *
 * Cada herramienta define:
 *  - nombre       → identificador único
 *  - descripcion  → descripción en español de lo que hace
 *  - schema       → esquema Zod de los parámetros de entrada
 *  - execute()    → función asíncrona que ejecuta la acción real
 *  - successMsg() → función que genera el mensaje de éxito
 *  - errorMsg()   → función que genera el mensaje de error
 *
 * Las herramientas están organizadas en tres capas:
 *  CAPA 1 — Conocimiento (navegarASeccion)
 *  CAPA 2 — Datos estructurados (consultarDisponibilidad)
 *  CAPA 3 — Herramientas ejecutables de backend
 */

import { z } from 'zod';
import {
  executeAgendarCita,
  executeCrearPresupuesto,
  executeCrearCliente,
  executeCrearProspecto,
  executeRegistrarPago,
  executeCrearEvento,
  executeGenerarContrato,
  executeConsultarDisponibilidad,
} from './tools/executors';

// ── Tipos base ───────────────────────────────────────────────────────────────

export type ToolResult =
  | { success: true; data?: Record<string, unknown>; message: string }
  | { success: false; error: string; message: string };

export interface AKTool<TInput = unknown> {
  nombre: string;
  descripcion: string;
  schema: z.ZodType<TInput>;
  execute: (input: TInput) => Promise<ToolResult>;
  successMsg: (result: ToolResult & { success: true }) => string;
  errorMsg: (result: ToolResult & { success: false }) => string;
}

// ── Esquemas ──────────────────────────────────────────────────────────────────

const ServicioSchema = z.object({
  nombre: z.string().min(1),
  cantidad: z.number().int().positive().optional(),
  precioUnitario: z.number().min(0),
  categoria: z.string().optional(),
});

const crearPresupuestoSchema = z.object({
  clienteNombre: z.string().min(1, 'El nombre del cliente es obligatorio'),
  eventoTipo: z.string().optional(),
  eventoFecha: z.string().optional(),
  invitados: z.number().int().nonnegative().optional(),
  servicios: z.array(ServicioSchema).optional(),
  notas: z.string().optional(),
  senia: z.number().optional(),
});

const crearClienteSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  partyType: z.string().optional(),
  partyDate: z.string().optional(),
  guestCount: z.number().int().nonnegative().optional(),
});

const crearProspectoSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  partyType: z.string().optional(),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
  guestCount: z.number().int().nonnegative().optional(),
});

const agendarCitaSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  followUpDate: z.string().optional(),
  time: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

const registrarPagoSchema = z.object({
  presupuestoId: z.string().optional(),
  clienteNombre: z.string().optional(),
  monto: z.number().positive('El monto debe ser mayor a cero'),
  metodoPago: z.enum(['Efectivo', 'Transferencia', 'Tarjeta', 'Cheque', 'Otro']).optional(),
  referencia: z.string().optional(),
});

const crearEventoSchema = z.object({
  clienteNombre: z.string().min(1, 'El nombre del cliente es obligatorio'),
  eventoTipo: z.string().optional(),
  eventoFecha: z.string().optional(),
  invitados: z.number().int().nonnegative().optional(),
  venueName: z.string().optional(),
  clientePhone: z.string().optional(),
});

const generarContratoSchema = z.object({
  clienteNombre: z.string().optional(),
  fiestaId: z.string().optional(),
  senia: z.number().optional(),
  saldo: z.number().optional(),
  ajusteAnualPorcentaje: z.number().optional(),
  fechaFirmaContrato: z.string().optional(),
  clausulas: z.string().optional(),
});

const consultarDisponibilidadSchema = z.object({
  fecha: z.string().min(1, 'La fecha es obligatoria'),
});

const crearPublicacionSchema = z.object({
  platform: z.enum(['instagram', 'facebook', 'whatsapp', 'general']).optional(),
  eventoTipo: z.string().optional(),
  tono: z.string().optional(),
  descripcion: z.string().optional(),
});

const guardarIdeaSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio'),
  descripcion: z.string().optional(),
  tags: z.array(z.string()).optional(),
  eventoTipo: z.string().optional(),
});

const agregarTareaSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio'),
  descripcion: z.string().optional(),
  fechaLimite: z.string().optional(),
  prioridad: z.enum(['alta', 'media', 'baja']).optional(),
});

const navegarSchema = z.object({
  href: z.string().min(1, 'La ruta es obligatoria'),
  label: z.string().optional(),
});

// ── Constantes de mapeo ───────────────────────────────────────────────────────

/** Mapea los valores de eventoTipo del intent-router a los tipos de MarketingTemplate. */
const TIPO_EVENTO_MAP: Record<string, 'XV' | 'Boda' | 'Cumple'> = {
  XV: 'XV',
  'XV años': 'XV',
  XV_ANOS: 'XV',
  Boda: 'Boda',
  Casamiento: 'Boda',
  Cumple: 'Cumple',
  Cumpleaños: 'Cumple',
  Cumpleanos: 'Cumple',
};

// ── Herramientas ─────────────────────────────────────────────────────────────

export const crearPresupuestoTool: AKTool<z.infer<typeof crearPresupuestoSchema>> = {
  nombre: 'crearPresupuesto',
  descripcion: 'Crea un nuevo presupuesto de evento para un cliente con servicios y precios.',
  schema: crearPresupuestoSchema,
  execute: executeCrearPresupuesto,
  successMsg: (r) => r.message,
  errorMsg: (r) => r.message,
};

export const crearClienteTool: AKTool<z.infer<typeof crearClienteSchema>> = {
  nombre: 'crearCliente',
  descripcion: 'Registra un nuevo cliente en el sistema.',
  schema: crearClienteSchema,
  execute: executeCrearCliente,
  successMsg: (r) => r.message,
  errorMsg: (r) => r.message,
};

export const crearProspectoTool: AKTool<z.infer<typeof crearProspectoSchema>> = {
  nombre: 'crearProspecto',
  descripcion: 'Registra un nuevo prospecto/lead en el CRM.',
  schema: crearProspectoSchema,
  execute: executeCrearProspecto,
  successMsg: (r) => r.message,
  errorMsg: (r) => r.message,
};

export const agendarCitaTool: AKTool<z.infer<typeof agendarCitaSchema>> = {
  nombre: 'agendarCita',
  descripcion: 'Agenda una cita o reunión con un prospecto. Crea o actualiza el registro en CRM.',
  schema: agendarCitaSchema,
  execute: executeAgendarCita,
  successMsg: (r) => r.message,
  errorMsg: (r) => r.message,
};

export const registrarPagoTool: AKTool<z.infer<typeof registrarPagoSchema>> = {
  nombre: 'registrarPago',
  descripcion: 'Registra un pago sobre un presupuesto existente.',
  schema: registrarPagoSchema,
  execute: executeRegistrarPago,
  successMsg: (r) => r.message,
  errorMsg: (r) => r.message,
};

export const crearEventoTool: AKTool<z.infer<typeof crearEventoSchema>> = {
  nombre: 'crearEvento',
  descripcion: 'Crea un nuevo evento/fiesta en planificación para un cliente.',
  schema: crearEventoSchema,
  execute: executeCrearEvento,
  successMsg: (r) => r.message,
  errorMsg: (r) => r.message,
};

export const generarContratoTool: AKTool<z.infer<typeof generarContratoSchema>> = {
  nombre: 'generarContrato',
  descripcion: 'Genera y guarda los datos del contrato para un evento.',
  schema: generarContratoSchema,
  execute: executeGenerarContrato,
  successMsg: (r) => r.message,
  errorMsg: (r) => r.message,
};

export const consultarDisponibilidadTool: AKTool<z.infer<typeof consultarDisponibilidadSchema>> = {
  nombre: 'consultarDisponibilidad',
  descripcion: 'Consulta si hay eventos agendados para una fecha determinada.',
  schema: consultarDisponibilidadSchema,
  execute: executeConsultarDisponibilidad,
  successMsg: (r) => r.message,
  errorMsg: (r) => r.message,
};

// Marketing tools: connected to chatWithMarketingAgent (AI content generation)
// and marketing.ts (persistence of ideas and tasks).

async function executeCrearPublicacionMarketing(
  input: z.infer<typeof crearPublicacionSchema>
): Promise<ToolResult> {
  try {
    const { chatWithMarketingAgent } = await import('@/ai/flows/marketing-agent-flow');
    const marketingResult = await chatWithMarketingAgent({
      request: input.descripcion || `Generá contenido de marketing para ${input.eventoTipo || 'un evento'}`,
      context: `Tipo de evento: ${input.eventoTipo || 'general'}. Tono: ${input.tono || 'profesional y cercano'}.`,
      platform: input.platform,
      contentType: input.tono,
      eventType: input.eventoTipo,
    });
    return {
      success: true,
      message: marketingResult.content,
      data: { platform: marketingResult.platform, tipo: marketingResult.tipo },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'No se pudo generar el contenido de marketing.',
      message: `⚠️ No pude generar el contenido en este momento. Intentá de nuevo o crealo manualmente desde [/marketing](/marketing).`,
    };
  }
}

async function executeGuardarIdeaMarketing(
  input: z.infer<typeof guardarIdeaSchema>
): Promise<ToolResult> {
  try {
    const { saveMarketingTemplate } = await import('@/app/actions/marketing');
    const id = `idea_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tipoTemplate: 'XV' | 'Boda' | 'Cumple' = TIPO_EVENTO_MAP[input.eventoTipo ?? ''] ?? 'XV';
    const template = {
      id,
      nombre: input.titulo,
      tags: input.tags || [],
      tipo: tipoTemplate,
      objetivo: 'captacion' as const,
      estilo: 'elegante' as const,
      contenido: {
        ig_corto: input.descripcion || '',
        ig_largo: '',
        historias: '',
        tiktok: '',
        whatsapp: '',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const result = await saveMarketingTemplate(template);
    if (!result.success) {
      return { success: false, error: result.error || 'No se pudo guardar la idea.', message: result.error || 'No se pudo guardar la idea.' };
    }
    return {
      success: true,
      message: `Idea "${input.titulo}" guardada en marketing. Podés verla en [/marketing](/marketing).`,
      data: { id, href: '/marketing' },
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al guardar idea.', message: 'No se pudo guardar la idea de marketing.' };
  }
}

async function executeAgregarTareaMarketing(
  input: z.infer<typeof agregarTareaSchema>
): Promise<ToolResult> {
  try {
    const { getMarketingChecklist, saveMarketingChecklist } = await import('@/app/actions/marketing');
    const checklist = await getMarketingChecklist();
    const id = `tarea_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nuevaTarea = {
      id,
      dia: input.fechaLimite || new Date().toISOString().slice(0, 10),
      tarea: input.titulo + (input.descripcion ? ` — ${input.descripcion}` : ''),
      canal: 'general',
      estado: 'pendiente' as const,
      semana: input.prioridad || 'media',
    };
    const result = await saveMarketingChecklist([nuevaTarea, ...checklist]);
    if (!result.success) {
      return { success: false, error: result.error || 'No se pudo agregar la tarea.', message: result.error || 'No se pudo agregar la tarea.' };
    }
    return {
      success: true,
      message: `Tarea "${input.titulo}" agregada al plan de marketing. Podés verla en [/marketing](/marketing).`,
      data: { id, href: '/marketing' },
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al agregar tarea.', message: 'No se pudo agregar la tarea de marketing.' };
  }
}

export const crearPublicacionMarketingTool: AKTool<z.infer<typeof crearPublicacionSchema>> = {
  nombre: 'crearPublicacionMarketing',
  descripcion:
    'Genera contenido de marketing para redes sociales usando el Agente Marketing AK.',
  schema: crearPublicacionSchema,
  execute: executeCrearPublicacionMarketing,
  successMsg: (r) => r.message,
  errorMsg: (r) => r.message,
};

export const guardarIdeaMarketingTool: AKTool<z.infer<typeof guardarIdeaSchema>> = {
  nombre: 'guardarIdeaMarketing',
  descripcion: 'Guarda una idea de marketing en el plan de marketing.',
  schema: guardarIdeaSchema,
  execute: executeGuardarIdeaMarketing,
  successMsg: (r) => r.message,
  errorMsg: (r) => r.message,
};

export const agregarTareaMarketingTool: AKTool<z.infer<typeof agregarTareaSchema>> = {
  nombre: 'agregarTareaMarketing',
  descripcion: 'Agrega una tarea al plan de marketing.',
  schema: agregarTareaSchema,
  execute: executeAgregarTareaMarketing,
  successMsg: (r) => r.message,
  errorMsg: (r) => r.message,
};

export const navegarASeccionTool: AKTool<z.infer<typeof navegarSchema>> = {
  nombre: 'navegarASeccion',
  descripcion: 'Navega a una sección de la aplicación.',
  schema: navegarSchema,
  execute: async (_input) => ({ success: true, message: 'Navegando...' }),
  successMsg: (r) => r.message,
  errorMsg: (r) => r.message,
};

// ── Registro global ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TOOL_REGISTRY: ReadonlyArray<AKTool<any>> = [
  crearPresupuestoTool,
  crearClienteTool,
  crearProspectoTool,
  agendarCitaTool,
  registrarPagoTool,
  crearEventoTool,
  generarContratoTool,
  consultarDisponibilidadTool,
  crearPublicacionMarketingTool,
  guardarIdeaMarketingTool,
  agregarTareaMarketingTool,
  navegarASeccionTool,
] as const;

/** Busca una herramienta por nombre. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTool(nombre: string): AKTool<any> | undefined {
  return TOOL_REGISTRY.find((t) => t.nombre === nombre);
}
