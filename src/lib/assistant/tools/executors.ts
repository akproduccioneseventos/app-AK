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
import * as logger from '@/lib/logger';
import { ASSISTANT_ROUTES } from '../app-routes';

// ── Modo seguro operativo ─────────────────────────────────────────────────────

/**
 * Devuelve true solo cuando ASSISTANT_WRITE_ACTIONS_ENABLED === "true".
 * Las herramientas de marketing NO necesitan esta validación.
 */
function isWriteActionsEnabled(): boolean {
  return process.env.ASSISTANT_WRITE_ACTIONS_ENABLED === 'true';
}

const SAFE_MODE_RESULT: ToolResult = {
  success: false,
  error: 'Modo operativo desactivado.',
  message:
    'Acción operativa desactivada hasta completar configuración. Podés hacerlo manualmente desde el módulo correspondiente.',
};

// ── Helper de notificación ────────────────────────────────────────────────────

async function enviarNotificacion(params: {
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'aviso' | 'urgente' | 'exito';
  href: string;
}): Promise<void> {
  const { createNotification } = await import('@/app/actions/notifications');
  await createNotification(params).catch((notifErr: unknown) => {
    logger.warn('[Asistente AK] No se pudo enviar notificación:', (notifErr as Error)?.message);
  });
}


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
 * Si el lead ya existe → agenda la reunión con scheduleCrmMeeting.
 * Si es nuevo → crea el lead con addCrmLead y luego agenda la reunión.
 */
export async function executeAgendarCita(input: AgendarCitaInput): Promise<ToolResult> {
  if (!isWriteActionsEnabled()) return SAFE_MODE_RESULT;
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
    await enviarNotificacion({
      titulo: 'Cita agendada',
      mensaje: `Cita con ${existing.name}${input.followUpDate ? ` para el ${input.followUpDate}` : ''}`,
      tipo: 'exito',
      href: '/contabilidad/crm',
    });
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

  await enviarNotificacion({
    titulo: 'Cita agendada',
    mensaje: `Nuevo prospecto ${leadResult.lead!.name} creado y cita agendada`,
    tipo: 'exito',
    href: '/contabilidad/crm',
  });

  return {
    success: true,
    message: `Cita agendada para ${leadResult.lead!.name}${input.followUpDate ? ` el ${input.followUpDate}` : ''}. Podés verla en /contabilidad/crm.`,
    data: { leadId: leadResult.lead!.id, action: 'create_lead_and_schedule' },
  };
}

// ── crearPresupuesto ─────────────────────────────────────────────────────────

export async function executeCrearPresupuesto(input: CrearPresupuestoInput): Promise<ToolResult> {
  if (!isWriteActionsEnabled()) return SAFE_MODE_RESULT;
  if (!input.clienteNombre?.trim()) {
    return { success: false, error: 'El nombre del cliente es obligatorio.', message: 'El nombre del cliente es obligatorio para crear un presupuesto.' };
  }

  const { savePresupuesto } = await import('@/app/actions/presupuestos');
  const { getServiciosEmpresa } = await import('@/app/actions/servicios-empresa');

  // Try to match requested services against the company catalog.
  // Items matched by name get the catalog id and price; unmatched items are
  // kept as-is but flagged with nota: 'manual/asistente' so staff can review.
  let catalogo: Array<{ id: string; nombre: string; precioVenta?: number; categoria?: string }> = [];
  try {
    const raw = await getServiciosEmpresa();
    catalogo = raw.map(s => ({ id: s.id, nombre: s.nombre, precioVenta: s.precioVenta, categoria: s.categoria }));
  } catch {
    // Catalog unavailable — proceed with manual items only
  }

  const items = (input.servicios || []).map(s => {
    const nameNorm = s.nombre.toLowerCase();
    const catalogMatch = catalogo.find(c =>
      c.nombre.toLowerCase().includes(nameNorm) || nameNorm.includes(c.nombre.toLowerCase())
    );
    const precio = catalogMatch?.precioVenta ?? s.precioUnitario;
    return {
      idServicioCatalogo: catalogMatch?.id ?? `srv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      nombreServicio: catalogMatch ? catalogMatch.nombre : s.nombre,
      cantidad: s.cantidad || 1,
      precioUnitario: precio,
      precioUnitarioPresupuesto: precio,
      costoTotalItem: (s.cantidad || 1) * precio,
      categoriaServicio: s.categoria || catalogMatch?.categoria,
      calculationMethod: 'fijo' as const,
      ...(catalogMatch ? {} : { nota: 'manual/asistente' }),
    };
  });

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

  const manualCount = items.filter((i) => i.nota === 'manual/asistente').length;
  const catalogNote = manualCount > 0 ? ` (${manualCount} ítem(s) no encontrado(s) en catálogo — marcado(s) como manual/asistente)` : '';

  await enviarNotificacion({
    titulo: 'Presupuesto creado',
    mensaje: `Presupuesto para ${input.clienteNombre} creado desde el asistente`,
    tipo: 'exito',
    href: `/presupuestos/${result.id}/ver`,
  });

  return {
    success: true,
    message: `Presupuesto creado para ${input.clienteNombre}. Podés verlo en /presupuestos/${result.id}/ver${catalogNote}.`,
    data: { presupuestoId: result.id, href: `/presupuestos/${result.id}/ver` },
  };
}

// ── crearCliente ─────────────────────────────────────────────────────────────

export async function executeCrearCliente(input: CrearClienteInput): Promise<ToolResult> {
  if (!isWriteActionsEnabled()) return SAFE_MODE_RESULT;
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
    message: `Cliente ${input.name} registrado exitosamente. Podés verlo en Clientes.`,
    data: { clienteId: result.id, href: ASSISTANT_ROUTES.customers },
  };
}

// ── crearProspecto ───────────────────────────────────────────────────────────

export async function executeCrearProspecto(input: CrearProspectoInput): Promise<ToolResult> {
  if (!isWriteActionsEnabled()) return SAFE_MODE_RESULT;
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
        message: `Ya existe un prospecto con ese nombre: ${result.duplicate.name}. Podés verlo en el CRM.`,
        data: { leadId: result.duplicate.id, duplicate: true, href: ASSISTANT_ROUTES.crm },
      };
    }
    return { success: false, error: result.error || 'No se pudo registrar el prospecto.', message: result.error || 'No se pudo registrar el prospecto.' };
  }

  return {
    success: true,
    message: `Prospecto ${result.lead!.name} registrado en el CRM. Podés verlo en Clientes potenciales.`,
    data: { leadId: result.lead!.id, href: ASSISTANT_ROUTES.crm },
  };
}

// ── registrarPago ────────────────────────────────────────────────────────────

export async function executeRegistrarPago(input: RegistrarPagoInput): Promise<ToolResult> {
  if (!isWriteActionsEnabled()) return SAFE_MODE_RESULT;
  if (!input.monto || input.monto <= 0) {
    return { success: false, error: 'El monto debe ser mayor a cero.', message: 'El monto del pago debe ser mayor a cero.' };
  }

  const { addPagoToPresupuesto, getPresupuestos } = await import('@/app/actions/presupuestos');

  let presupuestoId = input.presupuestoId;

  // Si no se proporcionó ID, buscar por nombre de cliente
  if (!presupuestoId && input.clienteNombre) {
    const presupuestos = await getPresupuestos();
    const clienteNorm = input.clienteNombre.toLowerCase();

    // Exclude budgets that are rejected or cancelled — they should not receive payments.
    const ESTADOS_INVALIDOS = ['Rechazado', 'Cancelado'];
    // Preferred states — prioritize these over drafts or unconfirmed ones.
    const ESTADOS_PRIORITARIOS = ['Aceptado', 'Facturado', 'Enviado'];

    const candidates = presupuestos
      .filter(p => p.clienteNombre.toLowerCase().includes(clienteNorm))
      .filter(p => !ESTADOS_INVALIDOS.includes(p.estado))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // If multiple candidates, require explicit presupuestoId to avoid registering the wrong payment.
    if (candidates.length > 1) {
      const MAX_CANDIDATES_TO_DISPLAY = 5;
      const listado = candidates
        .slice(0, MAX_CANDIDATES_TO_DISPLAY)
        .map(p => `#${p.numero} (${p.estado}, $${p.totalConDescuento ?? p.costoTotalEstimado})`)
        .join(', ');
      return {
        success: false,
        error: `Se encontraron ${candidates.length} presupuestos para "${input.clienteNombre}": ${listado}. Indicá el ID o número de presupuesto para evitar un pago ambiguo.`,
        message: `⚠️ Hay más de un presupuesto posible para "${input.clienteNombre}": ${listado}. Por favor indicá el número o ID exacto del presupuesto.`,
      };
    }

    // Prefer a budget in a priority state
    const prioritario = candidates.find(p => ESTADOS_PRIORITARIOS.includes(p.estado));
    const chosen = prioritario ?? candidates[0];
    if (chosen) {
      presupuestoId = chosen.id;
    }
  }

  if (!presupuestoId) {
    return {
      success: false,
      error: 'No se encontró el presupuesto. Indicá el ID del presupuesto o el nombre del cliente.',
      message: 'No se encontró el presupuesto. Indicá el ID o el nombre del cliente.',
    };
  }

  type MetodoPagoInterno = 'Efectivo' | 'Transferencia Bancaria' | 'MercadoPago' | 'Cheque' | 'Tarjeta' | 'Otro';
  const metodo: MetodoPagoInterno = (METODO_PAGO_MAP[input.metodoPago ?? ''] as MetodoPagoInterno | undefined) ?? 'Efectivo';

  const result = await addPagoToPresupuesto(presupuestoId, {
    fecha: new Date().toISOString().slice(0, 10),
    monto: input.monto,
    metodoPago: metodo,
    referencia: input.referencia,
    estadoPago: 'confirmado',
  });

  if (!result.success) {
    return { success: false, error: result.error || 'No se pudo registrar el pago.', message: result.error || 'No se pudo registrar el pago.' };
  }

  const montoFmt = new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(input.monto);

  await enviarNotificacion({
    titulo: 'Pago registrado',
    mensaje: `Pago de ${montoFmt} registrado para presupuesto ${presupuestoId}`,
    tipo: 'exito',
    href: `/presupuestos/${presupuestoId}/ver`,
  });

  return {
    success: true,
    message: `Pago de ${montoFmt} registrado exitosamente. Podés ver el estado en /presupuestos/${presupuestoId}/ver.`,
    data: { presupuestoId, href: `/presupuestos/${presupuestoId}/ver` },
  };
}

// ── crearEvento ──────────────────────────────────────────────────────────────

export async function executeCrearEvento(input: CrearEventoInput): Promise<ToolResult> {
  if (!isWriteActionsEnabled()) return SAFE_MODE_RESULT;
  if (!input.clienteNombre?.trim()) {
    return { success: false, error: 'El nombre del cliente es obligatorio.', message: 'El nombre del cliente es obligatorio para crear el evento.' };
  }

  const { saveCustomer } = await import('@/app/actions/customers');
  const { createNewFiestaForCustomer } = await import('@/app/actions/fiesta/fiesta.actions');

  // Create customer first (skip automatic fiesta creation so we can capture the fiestaId directly)
  const result = await saveCustomer({
    name: input.clienteNombre.trim(),
    phone: input.clientePhone,
    partyType: input.eventoTipo,
    partyDate: input.eventoFecha,
    guestCount: input.invitados,
    venueName: input.venueName,
  }, { skipFiestaCreation: true });

  if (!result.success) {
    return { success: false, error: result.error || 'No se pudo crear el evento.', message: result.error || 'No se pudo crear el evento.' };
  }

  // Now create the fiesta explicitly so we get the fiestaId back
  const fiestaResult = await createNewFiestaForCustomer({
    id: result.id!,
    name: input.clienteNombre.trim(),
    partyDate: input.eventoFecha,
    partyType: input.eventoTipo,
    venueName: input.venueName,
    guestCount: input.invitados,
  });

  if (!fiestaResult.success || !fiestaResult.fiestaId) {
    // Customer was created but we couldn't confirm the event — partial success
    return {
      success: false,
      error: fiestaResult.error || 'Cliente creado, pero no se pudo confirmar el evento.',
      message: `⚠️ Cliente ${input.clienteNombre} registrado, pero no pude confirmar la creación del evento. Podés verlo en [Clientes](${ASSISTANT_ROUTES.customers}).`,
    };
  }

  const plannerHref = ASSISTANT_ROUTES.planner(fiestaResult.fiestaId);

  return {
    success: true,
    message: `Evento para ${input.clienteNombre} creado exitosamente. Podés planificarlo en [Planificador de Fiestas](${plannerHref}).`,
    data: { clienteId: result.id, fiestaId: fiestaResult.fiestaId, href: plannerHref },
  };
}

// ── generarContrato ──────────────────────────────────────────────────────────

export async function executeGenerarContrato(input: GenerarContratoInput): Promise<ToolResult> {
  if (!isWriteActionsEnabled()) return SAFE_MODE_RESULT;
  if (!input.fiestaId && !input.clienteNombre) {
    return {
      success: false,
      error: 'Se requiere el ID del evento o el nombre del cliente.',
      message: 'Para generar un contrato, indicá el ID del evento o el nombre del cliente.',
    };
  }

  const { getAllFiestas, saveFiesta } = await import('@/app/actions/fiesta/fiesta.actions');
  const { updateContratoFiestaActual } = await import('@/app/actions/fiesta-actual');
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

  // Save contratoDatos (financial terms) into fiesta
  const contratoUpdate = {
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

  const savedFiesta = await saveFiesta(contratoUpdate);
  if (!savedFiesta?.success) {
    return { success: false, error: 'No se pudo guardar el contrato.', message: 'No se pudo guardar los datos del contrato.' };
  }

  // Generate and persist the contract text + mark contratoGenerado via updateContratoFiestaActual
  const clienteNombre = fiesta.configuracion?.clienteNombre || input.clienteNombre || 'el cliente';
  const fechaEvento = fiesta.configuracion?.fechaEvento || '';
  const seniaFmt = input.senia != null
    ? new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(input.senia)
    : 'pendiente';
  const contratoTexto = [
    `CONTRATO DE SERVICIOS — AK Producciones Eventos`,
    `Cliente: ${clienteNombre}`,
    fechaEvento ? `Fecha del evento: ${fechaEvento.slice(0, 10)}` : '',
    input.senia != null ? `Seña: ${seniaFmt}` : '',
    input.saldo != null ? `Saldo: ${new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(input.saldo)}` : '',
    input.ajusteAnualPorcentaje ? `Ajuste anual: ${input.ajusteAnualPorcentaje}%` : '',
    input.fechaFirmaContrato ? `Fecha firma: ${input.fechaFirmaContrato}` : '',
    input.clausulas ? `Cláusulas adicionales: ${input.clausulas}` : '',
    `Generado por Asistente AK — ${new Date().toISOString()}`,
  ].filter(Boolean).join('\n');

  try {
    await updateContratoFiestaActual(fiestaId, contratoTexto, 'servicios', 'asistente-ak');
  } catch (updateErr: unknown) {
    // updateContratoFiestaActual failed — contratoDatos was saved but text not persisted
    return {
      success: false,
      error: (updateErr as Error)?.message || 'No se pudo generar el texto del contrato.',
      message: `Datos del contrato guardados, pero no se pudo generar el documento. Abrí el contrato manualmente en [/fiestas/nueva/gestion-documental/contrato-servicio?fiestaId=${fiestaId}](/fiestas/nueva/gestion-documental/contrato-servicio?fiestaId=${fiestaId}).`,
    };
  }

  return {
    success: true,
    message: `Contrato generado y guardado para ${clienteNombre}. Podés verlo en [/fiestas/nueva/gestion-documental/contrato-servicio?fiestaId=${fiestaId}](/fiestas/nueva/gestion-documental/contrato-servicio?fiestaId=${fiestaId}).`,
    data: { fiestaId, href: `/fiestas/nueva/gestion-documental/contrato-servicio?fiestaId=${fiestaId}` },
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
