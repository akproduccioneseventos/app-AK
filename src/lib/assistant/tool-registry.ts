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

// ── Placeholder execute (implementación real provista por assistant.ts) ───────

const notImplemented = async (_input: unknown): Promise<ToolResult> => ({
  success: false,
  error: 'Usar el dispatcher de assistant.ts',
  message: 'Usar el dispatcher de assistant.ts',
});

// ── Herramientas ─────────────────────────────────────────────────────────────

export const crearPresupuestoTool: AKTool<z.infer<typeof crearPresupuestoSchema>> = {
  nombre: 'crearPresupuesto',
  descripcion: 'Crea un nuevo presupuesto de evento para un cliente con servicios y precios.',
  schema: crearPresupuestoSchema,
  execute: notImplemented,
  successMsg: (r) => r.message,
  errorMsg: (r) => r.message,
};

export const crearClienteTool: AKTool<z.infer<typeof crearClienteSchema>> = {
  nombre: 'crearCliente',
  descripcion: 'Registra un nuevo cliente en el sistema.',
  schema: crearClienteSchema,
  execute: notImplemented,
  successMsg: (r) => r.message,
  errorMsg: (r) => r.message,
};

export const crearProspectoTool: AKTool<z.infer<typeof crearProspectoSchema>> = {
  nombre: 'crearProspecto',
  descripcion: 'Registra un nuevo prospecto/lead en el CRM.',
  schema: crearProspectoSchema,
  execute: notImplemented,
  successMsg: (r) => r.message,
  errorMsg: (r) => r.message,
};

export const agendarCitaTool: AKTool<z.infer<typeof agendarCitaSchema>> = {
  nombre: 'agendarCita',
  descripcion: 'Agenda una cita o reunión con un prospecto. Crea o actualiza el registro en CRM.',
  schema: agendarCitaSchema,
  execute: notImplemented,
  successMsg: (r) => r.message,
  errorMsg: (r) => r.message,
};

export const registrarPagoTool: AKTool<z.infer<typeof registrarPagoSchema>> = {
  nombre: 'registrarPago',
  descripcion: 'Registra un pago sobre un presupuesto existente.',
  schema: registrarPagoSchema,
  execute: notImplemented,
  successMsg: (r) => r.message,
  errorMsg: (r) => r.message,
};

export const crearEventoTool: AKTool<z.infer<typeof crearEventoSchema>> = {
  nombre: 'crearEvento',
  descripcion: 'Crea un nuevo evento/fiesta en planificación para un cliente.',
  schema: crearEventoSchema,
  execute: notImplemented,
  successMsg: (r) => r.message,
  errorMsg: (r) => r.message,
};

export const generarContratoTool: AKTool<z.infer<typeof generarContratoSchema>> = {
  nombre: 'generarContrato',
  descripcion: 'Genera y guarda los datos del contrato para un evento.',
  schema: generarContratoSchema,
  execute: notImplemented,
  successMsg: (r) => r.message,
  errorMsg: (r) => r.message,
};

export const consultarDisponibilidadTool: AKTool<z.infer<typeof consultarDisponibilidadSchema>> = {
  nombre: 'consultarDisponibilidad',
  descripcion: 'Consulta si hay eventos agendados para una fecha determinada.',
  schema: consultarDisponibilidadSchema,
  execute: notImplemented,
  successMsg: (r) => r.message,
  errorMsg: (r) => r.message,
};

export const crearPublicacionMarketingTool: AKTool<z.infer<typeof crearPublicacionSchema>> = {
  nombre: 'crearPublicacionMarketing',
  descripcion:
    'Genera contenido de marketing para redes sociales. Exclusivo del Agente Marketing AK.',
  schema: crearPublicacionSchema,
  execute: notImplemented,
  successMsg: (r) => r.message,
  errorMsg: (r) => r.message,
};

export const guardarIdeaMarketingTool: AKTool<z.infer<typeof guardarIdeaSchema>> = {
  nombre: 'guardarIdeaMarketing',
  descripcion: 'Guarda una idea de marketing para futura referencia.',
  schema: guardarIdeaSchema,
  execute: notImplemented,
  successMsg: (r) => r.message,
  errorMsg: (r) => r.message,
};

export const agregarTareaMarketingTool: AKTool<z.infer<typeof agregarTareaSchema>> = {
  nombre: 'agregarTareaMarketing',
  descripcion: 'Agrega una tarea al plan de marketing.',
  schema: agregarTareaSchema,
  execute: notImplemented,
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
