/**
 * AK Producciones — Ejecutores reales de herramientas del asistente.
 *
 * Cada función implementa la lógica real de una herramienta del TOOL_REGISTRY
 * usando dynamic imports de las server actions correspondientes.
 *
 * Estas funciones se ejecutan ÚNICAMENTE en contexto servidor (assistant.ts es
 * 'use server'), por lo que los dynamic imports de server actions son seguros.
 *
 * Regla: Solo se confirma éxito si el backend devuelve success=true.
 */

import type { ToolResult } from '../tool-registry';

// ── Tipos de entrada (reflejo de los schemas Zod del tool-registry) ───────────

export interface AgendarCitaInput {
  name: string;
  followUpDate?: string;
  time?: string;
  phone?: string;
  notes?: string;
}

export interface CrearPresupuestoInput {
  clienteNombre: string;
  eventoTipo?: string;
  eventoFecha?: string;
  invitados?: number;
  servicios?: Array<{ nombre: string; cantidad?: number; precioUnitario: number; categoria?: string }>;
  notas?: string;
  senia?: number;
}

export interface CrearClienteInput {
  name: string;
  phone?: string;
  email?: string;
  partyType?: string;
  partyDate?: string;
  guestCount?: number;
}

export interface CrearProspectoInput {
  name: string;
  phone?: string;
  email?: string;
  partyType?: string;
  followUpDate?: string;
  notes?: string;
  guestCount?: number;
}

export interface RegistrarPagoInput {
  presupuestoId?: string;
  clienteNombre?: string;
  monto: number;
  metodoPago?: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Cheque' | 'Otro';
  referencia?: string;
}

export interface CrearEventoInput {
  clienteNombre: string;
  eventoTipo?: string;
  eventoFecha?: string;
  invitados?: number;
  venueName?: string;
  clientePhone?: string;
}

export interface GenerarContratoInput {
  clienteNombre?: string;
  fiestaId?: string;
  senia?: number;
  saldo?: number;
  ajusteAnualPorcentaje?: number;
  fechaFirmaContrato?: string;
  clausulas?: string;
}

export interface ConsultarDisponibilidadInput {
  fecha: string;
}

// ── Mapeo de método de pago ──────────────────────────────────────────────────

const METODO_PAGO_MAP: Record<string, string> = {
  Efectivo: 'Efectivo',
  Transferencia: 'Transferencia Bancaria',
  Tarjeta: 'Tarjeta',
  Cheque: 'Cheque',
  Otro: 'Otro',
};

// ── agendarCita ──────────────────────────────────────────────────────────────

/**
 * Agenda una cita con un prospecto.
 * Si el lead ya existe → usa scheduleCrmMeeting.
 * Si es nuevo → crea el lead con addCrmLead.
 */
export async function executeAgendarCita(input: AgendarCitaInput): Promise<ToolResult> {
  if (!input.name?.trim()) {
    return { success: false, error: 'El nombre es obligatorio.', message: 'El nombre es obligatorio para agendar una cita.' };
  }

  const { addCrmLead, getCrmLeads, scheduleCrmMeeting } = await import('@/app/actions/crm');

  // Buscar lead existente
  const leads = await getCrmLeads();
  const nameNorm = input.name.trim().toLowerCase();
  const existing = leads.find(l => l.name.toLowerCase().includes(nameNorm) || nameNorm.includes(l.name.toLowerCase()));

  if (existing) {
    // Lead existe: agendar reunión
    const meetingTitle = `Reunión con ${existing.name}${input.time ? ` a las ${input.time}` : ''}`;
    const result = await scheduleCrmMeeting(existing.id, input.followUpDate || new Date().toISOString().slice(0, 10), meetingTitle);
    if (!result.success) {
      return { success: false, error: result.error || 'No se pudo agendar la cita.', message: result.error || 'No se pudo agendar la cita.' };
    }
    return {
      success: true,
      message: `Cita agendada con ${existing.name}${input.followUpDate ? ` para el ${input.followUpDate}` : ''}${input.time ? ` a las ${input.time}` : ''}.`,
      data: { leadId: existing.id, action: 'schedule_meeting' },
    };
  }

  // Lead nuevo: crear prospecto
  const leadResult = await addCrmLead({
    name: input.name,
    phone: input.phone,
    followUpDate: input.followUpDate,
    notes: [
      input.notes,
      input.time ? `Hora: ${input.time}` : undefined,
    ].filter(Boolean).join('. ') || undefined,
  });

  if (!leadResult.success) {
    if (leadResult.duplicate) {
      // Agendar con el duplicado
      const sched = await scheduleCrmMeeting(
        leadResult.duplicate.id,
        input.followUpDate || new Date().toISOString().slice(0, 10),
        `Reunión con ${leadResult.duplicate.name}`,
      );
      if (sched.success) {
        return {
          success: true,
          message: `Cita agendada con ${leadResult.duplicate.name} (prospecto existente)${input.followUpDate ? ` para el ${input.followUpDate}` : ''}.`,
          data: { leadId: leadResult.duplicate.id, action: 'schedule_meeting' },
        };
      }
    }
    return { success: false, error: leadResult.error || 'No se pudo crear el prospecto.', message: leadResult.error || 'No se pudo crear el prospecto.' };
  }

  return {
    success: true,
    message: `Prospecto ${leadResult.lead!.name} creado y cita agendada${input.followUpDate ? ` para el ${input.followUpDate}` : ''}.`,
    data: { leadId: leadResult.lead!.id, action: 'create_lead_and_schedule' },
  };
}

// ── crearPresupuesto ─────────────────────────────────────────────────────────

export async function executeCrearPresupuesto(input: CrearPresupuestoInput): Promise<ToolResult> {
  if (!input.clienteNombre?.trim()) {
    return { success: false, error: 'El nombre del cliente es obligatorio.', message: 'El nombre del cliente es obligatorio para crear un presupuesto.' };
  }

  const { savePresupuesto } = await import('@/app/actions/presupuestos');

  const items = (input.servicios || []).map(s => ({
    idServicioCatalogo: `srv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    nombreServicio: s.nombre,
    cantidad: s.cantidad || 1,
    precioUnitario: s.precioUnitario,
    precioUnitarioPresupuesto: s.precioUnitario,
    costoTotalItem: (s.cantidad || 1) * s.precioUnitario,
    categoriaServicio: s.categoria,
    calculationMethod: 'fijo' as const,
  }));

  const subtotal = items.reduce((sum, i) => sum + i.costoTotalItem, 0);

  const result = await savePresupuesto({
    clienteNombre: input.clienteNombre.trim(),
    clienteContacto: '',
    eventoTipo: input.eventoTipo || 'Otro',
    eventoFecha: input.eventoFecha || '',
    invitadosCantidad: input.invitados || 0,
    salonFiestas: '',
    itemsPresupuestados: items,
    costoTotalEstimado: subtotal,
    totalConDescuento: subtotal,
    estado: 'Enviado',
    senia: input.senia,
    saldo: input.senia ? subtotal - input.senia : subtotal,
    notas: input.notas,
    timestamp: new Date().toISOString(),
  }, { source: 'simulator_assistant' });

  if (!result.success) {
    return { success: false, error: result.error || 'No se pudo crear el presupuesto.', message: result.error || 'No se pudo crear el presupuesto.' };
  }

  return {
    success: true,
    message: `Presupuesto creado para ${input.clienteNombre}. Podés verlo en /presupuestos/${result.id}.`,
    data: { presupuestoId: result.id, href: `/presupuestos/${result.id}/ver` },
  };
}

// ── crearCliente ─────────────────────────────────────────────────────────────

export async function executeCrearCliente(input: CrearClienteInput): Promise<ToolResult> {
  if (!input.name?.trim()) {
    return { success: false, error: 'El nombre es obligatorio.', message: 'El nombre del cliente es obligatorio.' };
  }

  const { saveCustomer } = await import('@/app/actions/customers');

  const result = await saveCustomer({
    name: input.name.trim(),
    phone: input.phone,
    partyType: input.partyType,
    partyDate: input.partyDate,
    guestCount: input.guestCount,
  }, { skipFiestaCreation: false });

  if (!result.success) {
    return { success: false, error: result.error || 'No se pudo crear el cliente.', message: result.error || 'No se pudo crear el cliente.' };
  }

  return {
    success: true,
    message: `Cliente ${input.name} registrado exitosamente.`,
    data: { clienteId: result.id, href: `/clientes` },
  };
}

// ── crearProspecto ───────────────────────────────────────────────────────────

export async function executeCrearProspecto(input: CrearProspectoInput): Promise<ToolResult> {
  if (!input.name?.trim()) {
    return { success: false, error: 'El nombre es obligatorio.', message: 'El nombre del prospecto es obligatorio.' };
  }

  const { addCrmLead } = await import('@/app/actions/crm');

  const result = await addCrmLead({
    name: input.name,
    phone: input.phone,
    partyType: input.partyType,
    followUpDate: input.followUpDate,
    notes: input.notes,
    guestCount: input.guestCount,
  });

  if (!result.success) {
    if (result.duplicate) {
      return {
        success: true,
        message: `Ya existe un prospecto con ese nombre: ${result.duplicate.name}. Podés verlo en /crm.`,
        data: { leadId: result.duplicate.id, duplicate: true, href: `/crm` },
      };
    }
    return { success: false, error: result.error || 'No se pudo registrar el prospecto.', message: result.error || 'No se pudo registrar el prospecto.' };
  }

  return {
    success: true,
    message: `Prospecto ${result.lead!.name} registrado en el CRM.`,
    data: { leadId: result.lead!.id, href: `/crm` },
  };
}

// ── registrarPago ────────────────────────────────────────────────────────────

export async function executeRegistrarPago(input: RegistrarPagoInput): Promise<ToolResult> {
  if (!input.monto || input.monto <= 0) {
    return { success: false, error: 'El monto debe ser mayor a cero.', message: 'El monto del pago debe ser mayor a cero.' };
  }

  const { addPagoToPresupuesto, getPresupuestos } = await import('@/app/actions/presupuestos');

  let presupuestoId = input.presupuestoId;

  // Si no se proporcionó ID, buscar por nombre de cliente
  if (!presupuestoId && input.clienteNombre) {
    const presupuestos = await getPresupuestos();
    const clienteNorm = input.clienteNombre.toLowerCase();
    const found = presupuestos
      .filter(p => p.clienteNombre.toLowerCase().includes(clienteNorm))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (found.length > 0) {
      presupuestoId = found[0].id;
    }
  }

  if (!presupuestoId) {
    return {
      success: false,
      error: 'No se encontró el presupuesto. Indicá el ID del presupuesto o el nombre del cliente.',
      message: 'No se encontró el presupuesto. Indicá el ID o el nombre del cliente.',
    };
  }

  const metodo = METODO_PAGO_MAP[input.metodoPago || 'Efectivo'] as 'Efectivo' | 'Transferencia Bancaria' | 'MercadoPago' | 'Cheque' | 'Tarjeta' | 'Otro';

  const result = await addPagoToPresupuesto(presupuestoId, {
    fecha: new Date().toISOString().slice(0, 10),
    monto: input.monto,
    metodoPago: metodo || 'Efectivo',
    referencia: input.referencia,
    estadoPago: 'confirmado',
  });

  if (!result.success) {
    return { success: false, error: result.error || 'No se pudo registrar el pago.', message: result.error || 'No se pudo registrar el pago.' };
  }

  const montoFmt = new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(input.monto);
  return {
    success: true,
    message: `Pago de ${montoFmt} registrado exitosamente. Podés ver el estado en /presupuestos/${presupuestoId}/ver.`,
    data: { presupuestoId, href: `/presupuestos/${presupuestoId}/ver` },
  };
}

// ── crearEvento ──────────────────────────────────────────────────────────────

export async function executeCrearEvento(input: CrearEventoInput): Promise<ToolResult> {
  if (!input.clienteNombre?.trim()) {
    return { success: false, error: 'El nombre del cliente es obligatorio.', message: 'El nombre del cliente es obligatorio para crear el evento.' };
  }

  const { saveCustomer } = await import('@/app/actions/customers');

  const result = await saveCustomer({
    name: input.clienteNombre.trim(),
    phone: input.clientePhone,
    partyType: input.eventoTipo,
    partyDate: input.eventoFecha,
    guestCount: input.invitados,
    venueName: input.venueName,
  }, { skipFiestaCreation: false });

  if (!result.success) {
    return { success: false, error: result.error || 'No se pudo crear el evento.', message: result.error || 'No se pudo crear el evento.' };
  }

  return {
    success: true,
    message: `Evento para ${input.clienteNombre} creado. Podés verlo en /fiestas.`,
    data: { clienteId: result.id, href: `/fiestas` },
  };
}

// ── generarContrato ──────────────────────────────────────────────────────────

export async function executeGenerarContrato(input: GenerarContratoInput): Promise<ToolResult> {
  if (!input.fiestaId && !input.clienteNombre) {
    return {
      success: false,
      error: 'Se requiere el ID del evento o el nombre del cliente.',
      message: 'Para generar un contrato, indicá el ID del evento o el nombre del cliente.',
    };
  }

  const { getAllFiestas, saveFiesta } = await import('@/app/actions/fiesta/fiesta.actions');
  const allFiestas = await getAllFiestas();

  let fiestaId = input.fiestaId;
  if (!fiestaId && input.clienteNombre) {
    const clienteNorm = input.clienteNombre.toLowerCase();
    const found = allFiestas.find(f => {
      const nombre = (
        f.configuracion?.clienteNombre ||
        f.configuracion?.nombreEvento ||
        ''
      ).toLowerCase();
      return nombre.includes(clienteNorm);
    });
    if (found) fiestaId = found.id;
  }

  if (!fiestaId) {
    return {
      success: false,
      error: 'No se encontró el evento en el sistema.',
      message: 'No se encontró el evento. Verificá el nombre del cliente o el ID del evento.',
    };
  }

  const fiesta = allFiestas.find(f => f.id === fiestaId);
  if (!fiesta) {
    return { success: false, error: 'Evento no encontrado.', message: 'Evento no encontrado.' };
  }

  const contractUpdate = {
    ...fiesta,
    contratoDatos: {
      ...(fiesta.contratoDatos || {}),
      senia: input.senia,
      saldo: input.saldo,
      ajusteAnualPorcentaje: input.ajusteAnualPorcentaje,
      fechaFirmaContrato: input.fechaFirmaContrato,
      clausulas: input.clausulas,
    },
  };

  const result = await saveFiesta(contractUpdate);
  if (!result?.success) {
    return { success: false, error: 'No se pudo guardar el contrato.', message: 'No se pudo guardar el contrato.' };
  }

  return {
    success: true,
    message: `Contrato generado para el evento. Podés verlo en /fiestas/nueva/${fiestaId}/contrato.`,
    data: { fiestaId, href: `/fiestas/nueva/${fiestaId}/contrato` },
  };
}

// ── consultarDisponibilidad ──────────────────────────────────────────────────

export async function executeConsultarDisponibilidad(input: ConsultarDisponibilidadInput): Promise<ToolResult> {
  if (!input.fecha) {
    return { success: false, error: 'La fecha es obligatoria.', message: 'La fecha es obligatoria para consultar disponibilidad.' };
  }

  const { getAllFiestas } = await import('@/app/actions/fiesta/fiesta.actions');
  const fiestas = await getAllFiestas();

  const fechaBuscada = input.fecha.slice(0, 10); // YYYY-MM-DD
  const coincidencias = fiestas.filter(f => {
    const fechaFiesta = (f.configuracion?.fechaEvento || '').slice(0, 10);
    return fechaFiesta === fechaBuscada;
  });

  if (coincidencias.length === 0) {
    return {
      success: true,
      message: `La fecha ${input.fecha} está disponible. No hay eventos agendados para ese día.`,
      data: { fecha: input.fecha, disponible: true, eventosEnFecha: 0 },
    };
  }

  const nombresEventos = coincidencias
    .map(f => f.configuracion?.clienteNombre || f.configuracion?.nombreEvento || 'Evento sin nombre')
    .join(', ');

  return {
    success: true,
    message: `La fecha ${input.fecha} ya tiene ${coincidencias.length} evento(s) agendado(s): ${nombresEventos}.`,
    data: { fecha: input.fecha, disponible: false, eventosEnFecha: coincidencias.length, nombres: nombresEventos },
  };
}
