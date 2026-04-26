/**
 * AK Producciones — Pruebas de flujos completos (FASE 3)
 *
 * Valida los ciclos de vida completos de los módulos principales:
 *  1. Flujo CRM: Lead → Cita → Presupuesto → Aceptar → Contrato → Seña → Evento
 *  2. Flujo Contabilidad: Presupuesto → Depósito → Pago → Libro Mayor
 *  3. Flujo Asistente: Herramientas reales (agendarCita, crearPresupuesto, registrarPago)
 *  4. Herramientas del registro: executeAgendarCita, executeCrearPresupuesto, etc.
 *  5. Router de intenciones: nuevas intenciones (create_budget, create_lead, register_payment)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

jest.mock('@/app/actions/crm', () => ({
  addCrmLead: jest.fn(),
  getCrmLeads: jest.fn().mockResolvedValue([]),
  getCrmStages: jest.fn().mockResolvedValue([
    { id: 'stage_1', name: 'Nuevo', order: 1 },
    { id: 'stage_2', name: 'Agendó entrevista', order: 2 },
    { id: 'stage_3', name: 'Presupuestado', order: 3 },
  ]),
  scheduleCrmMeeting: jest.fn().mockResolvedValue({ success: true }),
  moveCrmLead: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestos: jest.fn().mockResolvedValue([]),
  savePresupuesto: jest.fn().mockResolvedValue({ success: true, id: 'pres_test_1' }),
  addPagoToPresupuesto: jest.fn().mockResolvedValue({ success: true }),
  getPresupuestoById: jest.fn(),
}));

jest.mock('@/app/actions/customers', () => ({
  getCustomers: jest.fn().mockResolvedValue([]),
  saveCustomer: jest.fn().mockResolvedValue({ success: true, id: 'cust_test_1' }),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getAllFiestas: jest.fn().mockResolvedValue([]),
  saveFiesta: jest.fn().mockResolvedValue({ success: true, id: 'fiesta_test_1' }),
  createNewFiestaForCustomer: jest.fn().mockResolvedValue({ success: true, fiestaId: 'fiesta_test_1' }),
}));

jest.mock('@/app/actions/notifications', () => ({
  createNotification: jest.fn().mockResolvedValue({ success: true }),
  getNotifications: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/app/actions/invoices', () => ({
  getInvoices: jest.fn().mockResolvedValue([]),
  saveInvoice: jest.fn().mockResolvedValue({ success: true, id: 'inv_test_1' }),
}));

jest.mock('@/app/actions/servicios-empresa', () => ({
  getServiciosEmpresa: jest.fn().mockResolvedValue([
    { id: 'svc_dj', nombre: 'DJ', precioVenta: 50000, categoria: 'Sonido' },
    { id: 'svc_catering', nombre: 'Catering', precioVenta: 500, categoria: 'Gastronomía' },
  ]),
  saveServicioEmpresa: jest.fn(),
}));

jest.mock('@/app/actions/marketing', () => ({
  getMarketingTemplates: jest.fn().mockResolvedValue([]),
  saveMarketingTemplate: jest.fn().mockResolvedValue({ success: true }),
  getMarketingChecklist: jest.fn().mockResolvedValue([]),
  saveMarketingChecklist: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/app/actions/fiesta-actual', () => ({
  updateContratoFiestaActual: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/ai/flows/marketing-agent-flow', () => ({
  chatWithMarketingAgent: jest.fn().mockResolvedValue({
    content: 'Contenido generado de prueba',
    platform: 'instagram',
    tipo: 'post',
  }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Imports
// ─────────────────────────────────────────────────────────────────────────────

import {
  executeAgendarCita,
  executeCrearPresupuesto,
  executeCrearCliente,
  executeCrearProspecto,
  executeRegistrarPago,
  executeCrearEvento,
  executeConsultarDisponibilidad,
  executeGenerarContrato,
} from '@/lib/assistant/tools/executors';

import { detectIntent } from '@/lib/assistant/intent-router';
import { calculateFinancialLedger } from '@/lib/commercial-flow/ledger-service';
import { auditPresupuestoTotals } from '@/lib/commercial-flow/budget-audit';
import type { Presupuesto } from '@/types/presupuesto';
import type { Invoice } from '@/types/invoice';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const REF = new Date('2026-04-15T12:00:00.000Z');

function makeFiesta(overrides: { id?: string; clienteNombre?: string; fechaEvento?: string; contratoDatos?: Record<string, unknown> } = {}): FiestaEnPlanificacion {
  return {
    id: overrides.id || 'fiesta_test',
    configuracion: {
      nombreEvento: overrides.clienteNombre ? `Fiesta ${overrides.clienteNombre}` : 'Evento Test',
      clienteNombre: overrides.clienteNombre,
      fechaEvento: overrides.fechaEvento,
      tipoCelebracion: 'Cumpleaños',
      horaInicio: '20:00',
      horaFin: '02:00',
      nombreLugar: 'Salón',
      invitadosEstimados: 100,
      presupuestoEstimado: 0,
      notesAdicionales: '',
    },
    contratoDatos: overrides.contratoDatos || {},
    personalAsignado: [],
  } as FiestaEnPlanificacion;
}

function makePresupuesto(overrides: Partial<Presupuesto> = {}): Presupuesto {
  return {
    id: 'pres_1',
    clienteNombre: 'Virginia Reina',
    clienteContacto: '092908638',
    eventoTipo: 'XV años',
    eventoFecha: '2026-09-05T00:00:00.000Z',
    invitadosCantidad: 100,
    salonFiestas: 'Club Uruguay',
    itemsPresupuestados: [
      {
        idServicioCatalogo: 's1',
        nombreServicio: 'DJ',
        cantidad: 1,
        precioUnitario: 50000,
        precioUnitarioPresupuesto: 50000,
        costoTotalItem: 50000,
        calculationMethod: 'fijo',
      },
    ],
    costoTotalEstimado: 50000,
    totalConDescuento: 50000,
    timestamp: '2025-01-01T00:00:00.000Z',
    estado: 'Aceptado',
    ...overrides,
  };
}

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 'inv_1',
    invoiceNumber: 'F-001',
    customer: { id: 'c1', name: 'Virginia Reina' },
    issueDate: '2025-01-01',
    dueDate: '2025-12-31',
    items: [{ id: 'i1', description: 'Evento XV', quantity: 1, unitPrice: 50000, total: 50000 }],
    subtotal: 50000,
    taxRate: 0,
    taxAmount: 0,
    totalAmount: 50000,
    status: 'Sent',
    currency: 'UYU',
    vendorName: 'AK Producciones',
    payments: [],
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Flujo CRM completo
// ─────────────────────────────────────────────────────────────────────────────

describe('Flujo CRM — Lead → Cita → Presupuesto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('crea un nuevo prospecto correctamente', async () => {
    const { addCrmLead } = await import('@/app/actions/crm');
    (addCrmLead as jest.Mock).mockResolvedValueOnce({
      success: true,
      lead: { id: 'lead_1', name: 'Ana García' },
    });

    const result = await executeCrearProspecto({
      name: 'Ana García',
      phone: '098111222',
      partyType: 'XV años',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Ana García');
    expect(addCrmLead).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ana García', phone: '098111222' })
    );
  });

  it('agenda una cita con prospecto existente', async () => {
    const { getCrmLeads, scheduleCrmMeeting } = await import('@/app/actions/crm');
    (getCrmLeads as jest.Mock).mockResolvedValueOnce([
      { id: 'lead_1', name: 'Ana García', phone: '098111222' },
    ]);
    (scheduleCrmMeeting as jest.Mock).mockResolvedValueOnce({ success: true });

    const result = await executeAgendarCita({
      name: 'Ana García',
      followUpDate: '2026-04-20',
      time: '15:00',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Ana García');
    expect(scheduleCrmMeeting).toHaveBeenCalledWith(
      'lead_1',
      '2026-04-20',
      expect.any(String)
    );
  });

  it('crea prospecto si no existe al agendar cita', async () => {
    const { getCrmLeads, addCrmLead } = await import('@/app/actions/crm');
    (getCrmLeads as jest.Mock).mockResolvedValueOnce([]);
    (addCrmLead as jest.Mock).mockResolvedValueOnce({
      success: true,
      lead: { id: 'lead_new', name: 'Carlos Pérez' },
    });

    const result = await executeAgendarCita({
      name: 'Carlos Pérez',
      followUpDate: '2026-04-22',
    });

    expect(result.success).toBe(true);
    expect(addCrmLead).toHaveBeenCalled();
  });

  it('crea presupuesto para el cliente', async () => {
    const { savePresupuesto } = await import('@/app/actions/presupuestos');
    (savePresupuesto as jest.Mock).mockResolvedValueOnce({
      success: true,
      id: 'pres_crm_1',
    });

    const result = await executeCrearPresupuesto({
      clienteNombre: 'Ana García',
      eventoTipo: 'XV años',
      eventoFecha: '2026-09-01',
      invitados: 150,
      servicios: [
        { nombre: 'DJ', cantidad: 1, precioUnitario: 50000 },
        { nombre: 'Catering', cantidad: 150, precioUnitario: 500 },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Ana García');
    expect(result.data?.presupuestoId).toBe('pres_crm_1');
    expect(savePresupuesto).toHaveBeenCalledWith(
      expect.objectContaining({
        clienteNombre: 'Ana García',
        eventoTipo: 'XV años',
      }),
      expect.any(Object)
    );
  });

  it('retorna error si el nombre del cliente está vacío', async () => {
    const result = await executeCrearPresupuesto({ clienteNombre: '' });
    expect(result.success).toBe(false);
    expect(result.message).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Flujo Contabilidad: Presupuesto → Pago → Libro Mayor
// ─────────────────────────────────────────────────────────────────────────────

describe('Flujo Contabilidad — Presupuesto → Pago → Libro Mayor', () => {
  it('calcula el libro mayor correctamente sin pagos', () => {
    const pres = makePresupuesto({ estado: 'Aceptado', invoiceId: undefined, pagosCliente: [] });
    const summary = calculateFinancialLedger([pres], []);
    expect(summary.ventasTotales).toBe(50000);
    expect(summary.totalCobrado).toBe(0);
    expect(summary.saldoPendiente).toBe(50000);
    expect(summary.presupuestosAceptadosSinFactura).toBe(1);
  });

  it('calcula el libro mayor con pagos parciales', () => {
    const pres = makePresupuesto({
      estado: 'Aceptado',
      invoiceId: undefined,
      pagosCliente: [
        { id: 'p1', fecha: '2026-01-15', monto: 20000, metodoPago: 'Efectivo', estadoPago: 'confirmado' },
      ],
    });
    const summary = calculateFinancialLedger([pres], []);
    expect(summary.totalCobrado).toBe(20000);
    expect(summary.saldoPendiente).toBe(30000);
  });

  it('unifica facturas y presupuestos sin duplicar', () => {
    // Presupuesto con factura → no cuenta como presupuesto sin factura
    const presConFactura = makePresupuesto({ estado: 'Aceptado', invoiceId: 'inv_1' });
    const factura = makeInvoice({
      totalAmount: 50000,
      payments: [{ id: 'pay1', amount: 50000, date: '2026-01-20', method: 'Transferencia Bancaria' }],
    });

    const summary = calculateFinancialLedger([presConFactura], [factura]);
    expect(summary.ventasTotales).toBe(50000); // Solo factura, no presupuesto duplicado
    expect(summary.totalCobrado).toBe(50000);
    expect(summary.saldoPendiente).toBe(0);
    expect(summary.presupuestosAceptadosSinFactura).toBe(0);
  });

  it('registra un pago sobre un presupuesto', async () => {
    const { addPagoToPresupuesto, getPresupuestos } = await import('@/app/actions/presupuestos');
    (getPresupuestos as jest.Mock).mockResolvedValueOnce([
      makePresupuesto({ id: 'pres_pay_1', clienteNombre: 'Virginia Reina' }),
    ]);
    (addPagoToPresupuesto as jest.Mock).mockResolvedValueOnce({ success: true });

    const result = await executeRegistrarPago({
      clienteNombre: 'Virginia Reina',
      monto: 15000,
      metodoPago: 'Transferencia',
    });

    expect(result.success).toBe(true);
    expect(addPagoToPresupuesto).toHaveBeenCalledWith(
      'pres_pay_1',
      expect.objectContaining({ monto: 15000 })
    );
  });

  it('retorna error si el monto es cero', async () => {
    const result = await executeRegistrarPago({ monto: 0 });
    expect(result.success).toBe(false);
  });

  it('retorna error si no encuentra el presupuesto', async () => {
    const { getPresupuestos } = await import('@/app/actions/presupuestos');
    (getPresupuestos as jest.Mock).mockResolvedValueOnce([]);

    const result = await executeRegistrarPago({ monto: 5000, clienteNombre: 'Inexistente' });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Auditoría de presupuestos
// ─────────────────────────────────────────────────────────────────────────────

describe('Auditoría de presupuestos', () => {
  it('detecta presupuesto consistente', () => {
    const pres = makePresupuesto({ pagosCliente: [], saldo: 50000 });
    const audit = auditPresupuestoTotals(pres);
    expect(audit.esConsistente).toBe(true);
    expect(audit.subtotalItems).toBe(50000);
    expect(audit.totalReal).toBe(50000);
    expect(audit.saldoPendiente).toBe(50000);
    expect(audit.totalPagosRegistrados).toBe(0);
  });

  it('detecta inconsistencia en costoTotalEstimado', () => {
    const pres = makePresupuesto({ costoTotalEstimado: 45000 }); // Diferente del subtotal real
    const audit = auditPresupuestoTotals(pres);
    const costoObs = audit.observaciones.find(o => o.campo === 'costoTotalEstimado');
    expect(costoObs).toBeTruthy();
    expect(costoObs?.severidad).toBe('advertencia');
  });

  it('maneja modoDescuentoPromocional correctamente', () => {
    const pres = makePresupuesto({
      modoDescuentoPromocional: true,
      marketingMarkupPercent: 20,
    });
    const audit = auditPresupuestoTotals(pres);
    expect(audit.precioListaConMarkup).toBe(60000); // 50000 * 1.2
    expect(audit.totalReal).toBe(50000); // Total real no cambia
    const promoObs = audit.observaciones.find(o => o.campo === 'modoDescuentoPromocional');
    expect(promoObs?.severidad).toBe('info'); // Es info, no error
  });

  it('calcula pagos y saldo correctamente', () => {
    const pres = makePresupuesto({
      pagosCliente: [
        { id: 'p1', fecha: '2026-01-10', monto: 20000, metodoPago: 'Efectivo', estadoPago: 'confirmado' },
        { id: 'p2', fecha: '2026-02-10', monto: 15000, metodoPago: 'Transferencia Bancaria', estadoPago: 'confirmado' },
      ],
    });
    const audit = auditPresupuestoTotals(pres);
    expect(audit.totalPagosRegistrados).toBe(35000);
    expect(audit.saldoPendiente).toBe(15000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Herramientas del asistente — ejecutores reales
// ─────────────────────────────────────────────────────────────────────────────

describe('Ejecutores de herramientas del asistente', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executeCrearCliente crea cliente correctamente', async () => {
    const { saveCustomer } = await import('@/app/actions/customers');
    (saveCustomer as jest.Mock).mockResolvedValueOnce({ success: true, id: 'cust_new' });

    const result = await executeCrearCliente({
      name: 'Miriam López',
      phone: '097654321',
      partyType: 'Cumpleaños',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Miriam López');
  });

  it('executeCrearCliente falla sin nombre', async () => {
    const result = await executeCrearCliente({ name: '' });
    expect(result.success).toBe(false);
  });

  it('executeCrearEvento crea evento correctamente', async () => {
    const { saveCustomer } = await import('@/app/actions/customers');
    (saveCustomer as jest.Mock).mockResolvedValueOnce({ success: true, id: 'cust_ev_1' });

    const result = await executeCrearEvento({
      clienteNombre: 'Sofía Martínez',
      eventoTipo: 'XV años',
      eventoFecha: '2026-11-15',
      invitados: 200,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Sofía Martínez');
  });

  it('executeConsultarDisponibilidad retorna disponible cuando no hay fiestas', async () => {
    const { getAllFiestas } = await import('@/app/actions/fiesta/fiesta.actions');
    (getAllFiestas as jest.Mock).mockResolvedValueOnce([]);

    const result = await executeConsultarDisponibilidad({ fecha: '2026-12-01' });
    expect(result.success).toBe(true);
    expect(result.data?.disponible).toBe(true);
  });

  it('executeConsultarDisponibilidad detecta fecha ocupada', async () => {
    const { getAllFiestas } = await import('@/app/actions/fiesta/fiesta.actions');
    (getAllFiestas as jest.Mock).mockResolvedValueOnce([
      makeFiesta({ id: 'f1', clienteNombre: 'Juan Pérez', fechaEvento: '2026-12-15' }),
    ]);

    const result = await executeConsultarDisponibilidad({ fecha: '2026-12-15' });
    expect(result.success).toBe(true);
    expect(result.data?.disponible).toBe(false);
    expect(result.data?.eventosEnFecha).toBe(1);
  });

  it('executeConsultarDisponibilidad falla sin fecha', async () => {
    const result = await executeConsultarDisponibilidad({ fecha: '' });
    expect(result.success).toBe(false);
  });

  it('executeAgendarCita falla sin nombre', async () => {
    const result = await executeAgendarCita({ name: '' });
    expect(result.success).toBe(false);
  });

  it('executeAgendarCita maneja lead duplicado al crear cita', async () => {
    const { getCrmLeads, addCrmLead, scheduleCrmMeeting } = await import('@/app/actions/crm');
    (getCrmLeads as jest.Mock).mockResolvedValueOnce([]);
    (addCrmLead as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: 'Nombre duplicado',
      duplicate: { id: 'lead_dup', name: 'Patricia Soto' },
    });
    (scheduleCrmMeeting as jest.Mock).mockResolvedValueOnce({ success: true });

    const result = await executeAgendarCita({
      name: 'Patricia Soto',
      followUpDate: '2026-05-10',
    });

    expect(result.success).toBe(true);
    expect(scheduleCrmMeeting).toHaveBeenCalledWith('lead_dup', '2026-05-10', expect.any(String));
  });

  it('executeCrearProspecto detecta duplicado y retorna exitoso', async () => {
    const { addCrmLead } = await import('@/app/actions/crm');
    (addCrmLead as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: 'Teléfono duplicado',
      duplicate: { id: 'lead_exist', name: 'Patricia Soto' },
    });

    const result = await executeCrearProspecto({ name: 'Patricia Soto', phone: '099111222' });
    expect(result.success).toBe(true);
    expect(result.data?.duplicate).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Router de intenciones — nuevas intenciones
// ─────────────────────────────────────────────────────────────────────────────

describe('detectIntent — create_budget', () => {
  it('detecta intención de crear presupuesto con nombre y tipo', () => {
    const intent = detectIntent('Haceme un presupuesto para María González, XV años, 150 invitados', REF);
    expect(intent.type).toBe('create_budget');
    expect(intent.confidence).toBe('high');
    expect(intent.data.name).toBe('María González');
    expect(intent.data.eventoTipo).toBe('XV años');
    expect(intent.data.invitados).toBe(150);
  });

  it('devuelve none cuando no hay tipo de evento — pasa a Gemini para multi-turno', () => {
    const intent = detectIntent('Crea un presupuesto para Pedro Rodríguez', REF);
    expect(intent.type).toBe('none');
  });

  it('detecta presupuesto para casamiento', () => {
    const intent = detectIntent('Nuevo presupuesto para Laura Suárez, casamiento, 200 invitados', REF);
    expect(intent.type).toBe('create_budget');
    expect(intent.data.eventoTipo).toBe('Boda');
    expect(intent.data.invitados).toBe(200);
  });

  it('detecta presupuesto con fecha', () => {
    const intent = detectIntent('Presupuesto para Valentina, quinceaños, el 15 de octubre', REF);
    expect(intent.type).toBe('create_budget');
    expect(intent.data.eventoTipo).toBe('XV años');
    expect(intent.data.followUpDate).toBeTruthy();
  });
});

describe('detectIntent — create_lead', () => {
  it('detecta intención de crear prospecto con nombre', () => {
    const intent = detectIntent('Registrá un prospecto: Norma García, casamiento', REF);
    expect(intent.type).toBe('create_lead');
    expect(intent.confidence).toBe('high');
    expect(intent.data.name).toBe('Norma García');
    expect(intent.data.eventoTipo).toBe('Boda');
  });

  it('detecta nuevo lead sin nombre como confianza media', () => {
    const intent = detectIntent('Agregá un nuevo prospecto', REF);
    expect(intent.type).toBe('create_lead');
    expect(intent.confidence).toBe('medium');
  });
});

describe('detectIntent — register_payment', () => {
  it('detecta intención de registrar pago con monto', () => {
    const intent = detectIntent('Registrá un pago de 15000 pesos para el presupuesto de Mirta', REF);
    expect(intent.type).toBe('register_payment');
    expect(intent.confidence).toBe('high');
    expect(intent.data.monto).toBe(15000);
  });

  it('detecta pago con método', () => {
    const intent = detectIntent('Cargame un pago de 20000 en efectivo', REF);
    expect(intent.type).toBe('register_payment');
    expect(intent.data.monto).toBe(20000);
    expect(intent.data.metodoPago).toBe('Efectivo');
  });

  it('detecta pago por transferencia', () => {
    const intent = detectIntent('Registrá un pago de 30000 pesos por transferencia para Lucía', REF);
    expect(intent.type).toBe('register_payment');
    expect(intent.data.monto).toBe(30000);
    expect(intent.data.metodoPago).toBe('Transferencia');
  });
});

describe('detectIntent — sin intención reconocida', () => {
  it('retorna none para mensajes de consulta general', () => {
    expect(detectIntent('Hola', REF).type).toBe('none');
    expect(detectIntent('¿Cómo va todo?', REF).type).toBe('none');
    expect(detectIntent('NORMA', REF).type).toBe('none');
  });

  it('retorna none para scheduling sin nombre', () => {
    const intent = detectIntent('Agendame una reunión', REF);
    expect(intent.type).toBe('none');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Flujo completo: Lead → Presupuesto → Pago → Libro Mayor
// ─────────────────────────────────────────────────────────────────────────────

describe('Flujo completo — Lead → Presupuesto → Pago → Libro Mayor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ejecuta el flujo completo exitosamente', async () => {
    const { addCrmLead } = await import('@/app/actions/crm');
    const { savePresupuesto, addPagoToPresupuesto, getPresupuestos } = await import('@/app/actions/presupuestos');

    // 1. Crear prospecto
    (addCrmLead as jest.Mock).mockResolvedValueOnce({
      success: true,
      lead: { id: 'lead_flow', name: 'Marcela Díaz' },
    });
    const leadResult = await executeCrearProspecto({ name: 'Marcela Díaz', partyType: 'Boda' });
    expect(leadResult.success).toBe(true);

    // 2. Crear presupuesto
    (savePresupuesto as jest.Mock).mockResolvedValueOnce({ success: true, id: 'pres_flow_1' });
    const budgetResult = await executeCrearPresupuesto({
      clienteNombre: 'Marcela Díaz',
      eventoTipo: 'Boda',
      invitados: 120,
      servicios: [{ nombre: 'Salón + Catering', precioUnitario: 100000 }],
    });
    expect(budgetResult.success).toBe(true);
    expect(budgetResult.data?.presupuestoId).toBe('pres_flow_1');

    // 3. Registrar pago (seña)
    (getPresupuestos as jest.Mock).mockResolvedValueOnce([
      makePresupuesto({ id: 'pres_flow_1', clienteNombre: 'Marcela Díaz', totalConDescuento: 100000 }),
    ]);
    (addPagoToPresupuesto as jest.Mock).mockResolvedValueOnce({ success: true });
    const pagoResult = await executeRegistrarPago({
      presupuestoId: 'pres_flow_1',
      monto: 30000,
      metodoPago: 'Transferencia',
    });
    expect(pagoResult.success).toBe(true);

    // 4. Libro mayor refleja el pago
    const presupuesto = makePresupuesto({
      id: 'pres_flow_1',
      clienteNombre: 'Marcela Díaz',
      totalConDescuento: 100000,
      costoTotalEstimado: 100000,
      estado: 'Aceptado',
      pagosCliente: [
        { id: 'p_flow_1', fecha: '2026-04-15', monto: 30000, metodoPago: 'Transferencia Bancaria', estadoPago: 'confirmado' },
      ],
    });
    const ledger = calculateFinancialLedger([presupuesto], []);
    expect(ledger.totalCobrado).toBe(30000);
    expect(ledger.saldoPendiente).toBe(70000);
    expect(ledger.ventasTotales).toBe(100000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Libro Mayor — detalles mensuales
// ─────────────────────────────────────────────────────────────────────────────

describe('Libro Mayor — desglose mensual', () => {
  it('agrupa ventas y cobros por mes', () => {
    const pres1 = makePresupuesto({
      id: 'p1', eventoFecha: '2026-03-15T00:00:00.000Z',
      totalConDescuento: 80000, costoTotalEstimado: 80000,
      estado: 'Aceptado',
      pagosCliente: [{ id: 'pay1', fecha: '2026-03-20', monto: 40000, metodoPago: 'Efectivo', estadoPago: 'confirmado' }],
    });
    const pres2 = makePresupuesto({
      id: 'p2', eventoFecha: '2026-04-20T00:00:00.000Z',
      totalConDescuento: 60000, costoTotalEstimado: 60000,
      estado: 'Aceptado',
      pagosCliente: [],
    });

    const summary = calculateFinancialLedger([pres1, pres2], []);
    expect(summary.ventasTotales).toBe(140000);
    expect(summary.totalCobrado).toBe(40000);
    expect(summary.saldoPendiente).toBe(100000);

    const marzoMes = summary.porMes.find(m => m.mes === '2026-03');
    expect(marzoMes).toBeTruthy();
    expect(marzoMes!.ventas).toBe(80000);
    expect(marzoMes!.cobros).toBe(40000);

    const abrilMes = summary.porMes.find(m => m.mes === '2026-04');
    expect(abrilMes).toBeTruthy();
    expect(abrilMes!.ventas).toBe(60000);
    expect(abrilMes!.cobros).toBe(0);
  });

  it('excluye presupuestos no aceptados del libro mayor', () => {
    const presPendiente = makePresupuesto({ estado: 'Enviado', invoiceId: undefined });
    const summary = calculateFinancialLedger([presPendiente], []);
    expect(summary.ventasTotales).toBe(0);
    expect(summary.presupuestosAceptadosSinFactura).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Marketing tools — real implementations
// ─────────────────────────────────────────────────────────────────────────────

import {
  crearPublicacionMarketingTool,
  guardarIdeaMarketingTool,
  agregarTareaMarketingTool,
} from '@/lib/assistant/tool-registry';

describe('Marketing tools — ejecutores reales', () => {
  it('guardarIdeaMarketing guarda una idea y devuelve success=true', async () => {
    const { saveMarketingTemplate } = await import('@/app/actions/marketing');
    (saveMarketingTemplate as jest.Mock).mockResolvedValueOnce({ success: true });

    const result = await guardarIdeaMarketingTool.execute({
      titulo: 'Campaña XV primavera 2026',
      descripcion: 'Contenido para captar clientes de XV años en primavera',
      tags: ['xv', 'primavera'],
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Campaña XV primavera 2026');
    expect(saveMarketingTemplate).toHaveBeenCalledTimes(1);
    expect(saveMarketingTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Campaña XV primavera 2026' })
    );
  });

  it('guardarIdeaMarketing retorna error si saveMarketingTemplate falla', async () => {
    const { saveMarketingTemplate } = await import('@/app/actions/marketing');
    (saveMarketingTemplate as jest.Mock).mockResolvedValueOnce({ success: false, error: 'Error de escritura' });

    const result = await guardarIdeaMarketingTool.execute({
      titulo: 'Idea fallida',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('agregarTareaMarketing agrega tarea al checklist y devuelve success=true', async () => {
    const { getMarketingChecklist, saveMarketingChecklist } = await import('@/app/actions/marketing');
    (getMarketingChecklist as jest.Mock).mockResolvedValueOnce([]);
    (saveMarketingChecklist as jest.Mock).mockResolvedValueOnce({ success: true });

    const result = await agregarTareaMarketingTool.execute({
      titulo: 'Publicar en Instagram',
      descripcion: 'Foto del salón decorado',
      fechaLimite: '2026-05-01',
      prioridad: 'alta',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Publicar en Instagram');
    expect(saveMarketingChecklist).toHaveBeenCalledTimes(1);
    expect(saveMarketingChecklist).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ tarea: expect.stringContaining('Publicar en Instagram') })
      ])
    );
  });

  it('agregarTareaMarketing retorna error si saveMarketingChecklist falla', async () => {
    const { getMarketingChecklist, saveMarketingChecklist } = await import('@/app/actions/marketing');
    (getMarketingChecklist as jest.Mock).mockResolvedValueOnce([]);
    (saveMarketingChecklist as jest.Mock).mockResolvedValueOnce({ success: false, error: 'Error guardar' });

    const result = await agregarTareaMarketingTool.execute({
      titulo: 'Tarea fallida',
    });

    expect(result.success).toBe(false);
  });

  it('crearPublicacionMarketing llama a chatWithMarketingAgent y devuelve contenido', async () => {
    const { chatWithMarketingAgent } = await import('@/ai/flows/marketing-agent-flow');
    (chatWithMarketingAgent as jest.Mock).mockResolvedValueOnce({
      content: '¡XV años espectaculares! 🎉',
      platform: 'instagram',
      tipo: 'post',
    });

    const result = await crearPublicacionMarketingTool.execute({
      platform: 'instagram',
      eventoTipo: 'XV años',
      descripcion: 'Generá contenido para XV años',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('XV años espectaculares');
    expect(chatWithMarketingAgent).toHaveBeenCalledTimes(1);
    expect(chatWithMarketingAgent).toHaveBeenCalledWith(
      expect.objectContaining({ platform: 'instagram', eventType: 'XV años' })
    );
  });

  it('crearPublicacionMarketing retorna error si chatWithMarketingAgent lanza excepción', async () => {
    const { chatWithMarketingAgent } = await import('@/ai/flows/marketing-agent-flow');
    (chatWithMarketingAgent as jest.Mock).mockRejectedValueOnce(new Error('API key inválida'));

    const result = await crearPublicacionMarketingTool.execute({
      descripcion: 'Contenido que fallará',
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('/marketing');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. generarContrato — usa updateContratoFiestaActual (contratoServicioTexto)
// ─────────────────────────────────────────────────────────────────────────────

describe('executeGenerarContrato — usa motor real de contrato', () => {
  it('guarda contratoServicioTexto y contratoGenerado cuando todos los datos están presentes', async () => {
    const { getAllFiestas, saveFiesta } = await import('@/app/actions/fiesta/fiesta.actions');
    const { updateContratoFiestaActual } = await import('@/app/actions/fiesta-actual');

    (getAllFiestas as jest.Mock).mockResolvedValueOnce([
      makeFiesta({ id: 'f_contrato', clienteNombre: 'Carla Muñoz', fechaEvento: '2026-11-01' }),
    ]);
    (saveFiesta as jest.Mock).mockResolvedValueOnce({ success: true, id: 'f_contrato' });
    (updateContratoFiestaActual as jest.Mock).mockResolvedValueOnce({ success: true });

    const result = await executeGenerarContrato({
      clienteNombre: 'Carla Muñoz',
      senia: 20000,
      saldo: 80000,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Carla Muñoz');
    // Must call updateContratoFiestaActual to persist contratoServicioTexto/contratoGenerado
    expect(updateContratoFiestaActual).toHaveBeenCalledTimes(1);
    expect(updateContratoFiestaActual).toHaveBeenCalledWith(
      'f_contrato',
      expect.stringContaining('CONTRATO DE SERVICIOS'),
      'servicios',
      'asistente-ak',
    );
  });

  it('NO confirma éxito si updateContratoFiestaActual lanza error', async () => {
    const { getAllFiestas, saveFiesta } = await import('@/app/actions/fiesta/fiesta.actions');
    const { updateContratoFiestaActual } = await import('@/app/actions/fiesta-actual');

    (getAllFiestas as jest.Mock).mockResolvedValueOnce([
      makeFiesta({ id: 'f_err', clienteNombre: 'Roberto Sosa', fechaEvento: '2026-10-10' }),
    ]);
    (saveFiesta as jest.Mock).mockResolvedValueOnce({ success: true });
    (updateContratoFiestaActual as jest.Mock).mockRejectedValueOnce(new Error('Firestore caído'));

    const result = await executeGenerarContrato({
      clienteNombre: 'Roberto Sosa',
      senia: 15000,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('f_err');
  });

  it('falla si no se provee ni fiestaId ni clienteNombre', async () => {
    const result = await executeGenerarContrato({});
    expect(result.success).toBe(false);
  });

  it('falla si no se encuentra el evento', async () => {
    const { getAllFiestas } = await import('@/app/actions/fiesta/fiesta.actions');
    (getAllFiestas as jest.Mock).mockResolvedValueOnce([]);

    const result = await executeGenerarContrato({ clienteNombre: 'Nadie' });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Auditor de presupuesto — cálculos con catalog matching
// ─────────────────────────────────────────────────────────────────────────────

describe('executeCrearPresupuesto — catalog matching', () => {
  it('usa precio del catálogo cuando encuentra servicio coincidente', async () => {
    const { savePresupuesto } = await import('@/app/actions/presupuestos');
    const { getServiciosEmpresa } = await import('@/app/actions/servicios-empresa');

    (getServiciosEmpresa as jest.Mock).mockResolvedValueOnce([
      { id: 'svc_dj', nombre: 'DJ', precioVenta: 55000, categoria: 'Sonido' },
    ]);
    (savePresupuesto as jest.Mock).mockResolvedValueOnce({ success: true, id: 'pres_cat_1' });

    const result = await executeCrearPresupuesto({
      clienteNombre: 'Valentina',
      servicios: [{ nombre: 'DJ', cantidad: 1, precioUnitario: 30000 }], // catalog price should override
    });

    expect(result.success).toBe(true);
    // savePresupuesto called with catalog price (55000), not the input price (30000)
    expect(savePresupuesto).toHaveBeenCalledWith(
      expect.objectContaining({
        itemsPresupuestados: expect.arrayContaining([
          expect.objectContaining({ idServicioCatalogo: 'svc_dj', precioUnitario: 55000 }),
        ]),
      }),
      expect.any(Object),
    );
  });

  it('marca item como manual/asistente si no está en catálogo', async () => {
    const { savePresupuesto } = await import('@/app/actions/presupuestos');
    const { getServiciosEmpresa } = await import('@/app/actions/servicios-empresa');

    (getServiciosEmpresa as jest.Mock).mockResolvedValueOnce([
      { id: 'svc_dj', nombre: 'DJ', precioVenta: 55000, categoria: 'Sonido' },
    ]);
    (savePresupuesto as jest.Mock).mockResolvedValueOnce({ success: true, id: 'pres_cat_2' });

    const result = await executeCrearPresupuesto({
      clienteNombre: 'Lucas',
      servicios: [{ nombre: 'Servicio inventado', cantidad: 1, precioUnitario: 10000 }],
    });

    expect(result.success).toBe(true);
    expect(savePresupuesto).toHaveBeenCalledWith(
      expect.objectContaining({
        itemsPresupuestados: expect.arrayContaining([
          expect.objectContaining({ nota: 'manual/asistente' }),
        ]),
      }),
      expect.any(Object),
    );
    expect(result.message).toContain('manual/asistente');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. Notificaciones reales — cita, presupuesto, pago
// ─────────────────────────────────────────────────────────────────────────────

describe('Notificaciones reales en executors', () => {
  it('executeAgendarCita llama a createNotification cuando lead ya existe', async () => {
    const { createNotification } = await import('@/app/actions/notifications');
    const { getCrmLeads, scheduleCrmMeeting } = await import('@/app/actions/crm');

    (getCrmLeads as jest.Mock).mockResolvedValueOnce([{ id: 'lead_1', name: 'Ana García' }]);
    (scheduleCrmMeeting as jest.Mock).mockResolvedValueOnce({ success: true });

    const result = await executeAgendarCita({ name: 'Ana García', followUpDate: '2026-06-01' });
    expect(result.success).toBe(true);
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'exito', titulo: 'Cita agendada' })
    );
  });

  it('executeAgendarCita llama a createNotification cuando se crea prospecto nuevo', async () => {
    const { createNotification } = await import('@/app/actions/notifications');
    const { getCrmLeads, addCrmLead, scheduleCrmMeeting } = await import('@/app/actions/crm');

    (getCrmLeads as jest.Mock).mockResolvedValueOnce([]);
    (addCrmLead as jest.Mock).mockResolvedValueOnce({ success: true, lead: { id: 'lead_new', name: 'Pedro López' } });
    (scheduleCrmMeeting as jest.Mock).mockResolvedValueOnce({ success: true });

    const result = await executeAgendarCita({ name: 'Pedro López', followUpDate: '2026-06-15' });
    expect(result.success).toBe(true);
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'exito', titulo: 'Cita agendada' })
    );
  });

  it('executeCrearPresupuesto llama a createNotification al crear presupuesto exitosamente', async () => {
    const { createNotification } = await import('@/app/actions/notifications');
    const { savePresupuesto } = await import('@/app/actions/presupuestos');
    const { getServiciosEmpresa } = await import('@/app/actions/servicios-empresa');

    (getServiciosEmpresa as jest.Mock).mockResolvedValueOnce([]);
    (savePresupuesto as jest.Mock).mockResolvedValueOnce({ success: true, id: 'pres_notif_1' });

    const result = await executeCrearPresupuesto({
      clienteNombre: 'Rosa Martínez',
      servicios: [{ nombre: 'Decoración', cantidad: 1, precioUnitario: 20000 }],
    });

    expect(result.success).toBe(true);
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'exito', titulo: 'Presupuesto creado' })
    );
  });

  it('executeRegistrarPago llama a createNotification al registrar pago exitosamente', async () => {
    const { createNotification } = await import('@/app/actions/notifications');
    const { getPresupuestos, addPagoToPresupuesto } = await import('@/app/actions/presupuestos');

    (getPresupuestos as jest.Mock).mockResolvedValueOnce([
      makePresupuesto({ id: 'pres_pay_notif', clienteNombre: 'Roberto Pérez', totalConDescuento: 80000 }),
    ]);
    (addPagoToPresupuesto as jest.Mock).mockResolvedValueOnce({ success: true });

    const result = await executeRegistrarPago({
      presupuestoId: 'pres_pay_notif',
      monto: 40000,
      metodoPago: 'Efectivo',
    });

    expect(result.success).toBe(true);
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'exito', titulo: 'Pago registrado' })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. executeGenerarContrato — enlace apunta a contrato-servicio existente
// ─────────────────────────────────────────────────────────────────────────────

describe('executeGenerarContrato — URL apunta a ruta existente', () => {
  it('el href resultado apunta a gestion-documental/contrato-servicio', async () => {
    const { getAllFiestas, saveFiesta } = await import('@/app/actions/fiesta/fiesta.actions');
    const { updateContratoFiestaActual } = await import('@/app/actions/fiesta-actual');

    (getAllFiestas as jest.Mock).mockResolvedValueOnce([
      makeFiesta({ id: 'f_url_check', clienteNombre: 'Susana Ríos', fechaEvento: '2026-12-20' }),
    ]);
    (saveFiesta as jest.Mock).mockResolvedValueOnce({ success: true });
    (updateContratoFiestaActual as jest.Mock).mockResolvedValueOnce({ success: true });

    const result = await executeGenerarContrato({ clienteNombre: 'Susana Ríos' });

    expect(result.success).toBe(true);
    if (result.success && result.data?.href) {
      const href = result.data.href as string;
      expect(href).toContain('contrato-servicio');
      expect(href).not.toContain('contrato-digital');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. Correcciones de rutas del asistente
// ─────────────────────────────────────────────────────────────────────────────

import { ASSISTANT_ROUTES } from '@/lib/assistant/app-routes';

describe('Rutas del asistente — correcciones de rutas rotas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executeCrearCliente devuelve href /customers (no /clientes)', async () => {
    const { saveCustomer } = await import('@/app/actions/customers');
    (saveCustomer as jest.Mock).mockResolvedValueOnce({ success: true, id: 'cust_route_1' });

    const result = await executeCrearCliente({ name: 'Juan Pérez' });

    expect(result.success).toBe(true);
    expect(result.data?.href).toBe(ASSISTANT_ROUTES.customers);
    expect(result.data?.href).not.toBe('/clientes');
  });

  it('executeCrearProspecto devuelve href /contabilidad/crm (no /crm)', async () => {
    const { addCrmLead } = await import('@/app/actions/crm');
    (addCrmLead as jest.Mock).mockResolvedValueOnce({
      success: true,
      lead: { id: 'lead_route_1', name: 'María García' },
    });

    const result = await executeCrearProspecto({ name: 'María García' });

    expect(result.success).toBe(true);
    expect(result.data?.href).toBe(ASSISTANT_ROUTES.crm);
    expect(result.data?.href).not.toBe('/crm');
  });

  it('executeCrearProspecto duplicado devuelve href /contabilidad/crm', async () => {
    const { addCrmLead } = await import('@/app/actions/crm');
    (addCrmLead as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: 'Duplicado',
      duplicate: { id: 'lead_dup_route', name: 'María García' },
    });

    const result = await executeCrearProspecto({ name: 'María García' });

    expect(result.success).toBe(true);
    expect(result.data?.href).toBe(ASSISTANT_ROUTES.crm);
    expect(result.data?.href).not.toBe('/crm');
  });

  it('executeCrearEvento NO devuelve href /fiestas (ruta inexistente)', async () => {
    const { saveCustomer } = await import('@/app/actions/customers');
    const { createNewFiestaForCustomer } = await import('@/app/actions/fiesta/fiesta.actions');
    (saveCustomer as jest.Mock).mockResolvedValueOnce({ success: true, id: 'cust_ev_route' });
    (createNewFiestaForCustomer as jest.Mock).mockResolvedValueOnce({ success: true, fiestaId: 'fiesta_ev_route' });

    const result = await executeCrearEvento({
      clienteNombre: 'Laura Suárez',
      eventoTipo: 'Boda',
    });

    expect(result.success).toBe(true);
    expect(result.data?.href).not.toBe('/fiestas');
    // Should be the planner route with fiestaId
    expect(result.data?.href).toContain('fiestaId=fiesta_ev_route');
    expect(result.data?.fiestaId).toBe('fiesta_ev_route');
  });

  it('executeCrearEvento sin fiestaId confirmado devuelve success=false con warning', async () => {
    const { saveCustomer } = await import('@/app/actions/customers');
    const { createNewFiestaForCustomer } = await import('@/app/actions/fiesta/fiesta.actions');
    (saveCustomer as jest.Mock).mockResolvedValueOnce({ success: true, id: 'cust_ev_nof' });
    (createNewFiestaForCustomer as jest.Mock).mockResolvedValueOnce({ success: false, error: 'Error al crear fiesta' });

    const result = await executeCrearEvento({
      clienteNombre: 'Pedro Ruiz',
      eventoTipo: 'Cumpleaños',
    });

    expect(result.success).toBe(false);
    // Message should not use positive success tone about the event
    expect(result.message).not.toMatch(/evento.*creado exitosamente|creado.*evento exitosamente/i);
  });

  it('executeGenerarContrato devuelve ruta con contrato-servicio y fiestaId', async () => {
    const { getAllFiestas, saveFiesta } = await import('@/app/actions/fiesta/fiesta.actions');
    const { updateContratoFiestaActual } = await import('@/app/actions/fiesta-actual');

    (getAllFiestas as jest.Mock).mockResolvedValueOnce([
      makeFiesta({ id: 'f_contrato_1', clienteNombre: 'Rosa Vargas', fechaEvento: '2026-10-10' }),
    ]);
    (saveFiesta as jest.Mock).mockResolvedValueOnce({ success: true });
    (updateContratoFiestaActual as jest.Mock).mockResolvedValueOnce({ success: true });

    const result = await executeGenerarContrato({ clienteNombre: 'Rosa Vargas', senia: 10000, saldo: 40000 });

    expect(result.success).toBe(true);
    expect(result.data?.href).toBe(ASSISTANT_ROUTES.contract('f_contrato_1'));
    expect(result.data?.href).toContain('contrato-servicio');
    expect(result.data?.href).toContain('fiestaId=f_contrato_1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. Pagos — lógica de ambigüedad y filtrado de estados
// ─────────────────────────────────────────────────────────────────────────────

describe('executeRegistrarPago — filtrado y ambigüedad', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('no registra pago si hay más de un presupuesto para el mismo cliente', async () => {
    const { getPresupuestos } = await import('@/app/actions/presupuestos');
    (getPresupuestos as jest.Mock).mockReset();
    (getPresupuestos as jest.Mock).mockResolvedValueOnce([
      makePresupuesto({ id: 'p_amb_1', clienteNombre: 'Carlos Fuentes', estado: 'Enviado', timestamp: '2026-01-01T00:00:00.000Z' }),
      makePresupuesto({ id: 'p_amb_2', clienteNombre: 'Carlos Fuentes', estado: 'Aceptado', timestamp: '2026-02-01T00:00:00.000Z' }),
    ]);

    const result = await executeRegistrarPago({ monto: 5000, clienteNombre: 'Carlos Fuentes' });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/más de un presupuesto|ambig/i);
  });

  it('ignora presupuestos Rechazados al buscar por cliente', async () => {
    const { getPresupuestos, addPagoToPresupuesto } = await import('@/app/actions/presupuestos');
    (getPresupuestos as jest.Mock).mockReset();
    (addPagoToPresupuesto as jest.Mock).mockReset();
    (getPresupuestos as jest.Mock).mockResolvedValueOnce([
      makePresupuesto({ id: 'p_rech', clienteNombre: 'Alicia Torres', estado: 'Rechazado', timestamp: '2026-01-01T00:00:00.000Z' }),
      makePresupuesto({ id: 'p_acep', clienteNombre: 'Alicia Torres', estado: 'Aceptado', timestamp: '2026-02-01T00:00:00.000Z' }),
    ]);
    (addPagoToPresupuesto as jest.Mock).mockResolvedValueOnce({ success: true });

    const result = await executeRegistrarPago({ monto: 5000, clienteNombre: 'Alicia Torres' });

    expect(result.success).toBe(true);
    // Should have used the Aceptado budget, not the Rechazado one
    expect(addPagoToPresupuesto).toHaveBeenCalledWith('p_acep', expect.any(Object));
  });

  it('ignora presupuestos Cancelados y devuelve error si no hay candidatos válidos', async () => {
    const { getPresupuestos } = await import('@/app/actions/presupuestos');
    (getPresupuestos as jest.Mock).mockReset();
    (getPresupuestos as jest.Mock).mockResolvedValueOnce([
      makePresupuesto({ id: 'p_can', clienteNombre: 'Beatriz Luna', estado: 'Cancelado', timestamp: '2026-01-01T00:00:00.000Z' }),
    ]);

    const result = await executeRegistrarPago({ monto: 5000, clienteNombre: 'Beatriz Luna' });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/no se encontr|indicá/i);
  });

  it('pide presupuestoId si hay ambigüedad — no registra automáticamente', async () => {
    const { getPresupuestos, addPagoToPresupuesto } = await import('@/app/actions/presupuestos');
    (getPresupuestos as jest.Mock).mockReset();
    (getPresupuestos as jest.Mock).mockResolvedValueOnce([
      makePresupuesto({ id: 'p_x1', clienteNombre: 'Diego Herrera', estado: 'Aceptado', timestamp: '2026-01-01T00:00:00.000Z' }),
      makePresupuesto({ id: 'p_x2', clienteNombre: 'Diego Herrera', estado: 'Enviado', timestamp: '2026-03-01T00:00:00.000Z' }),
    ]);

    const result = await executeRegistrarPago({ monto: 10000, clienteNombre: 'Diego Herrera' });

    expect(result.success).toBe(false);
    expect(addPagoToPresupuesto).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. Asistente — tono de respuesta cuando la herramienta falla
// ─────────────────────────────────────────────────────────────────────────────

describe('Tono de respuesta del asistente cuando la herramienta falla', () => {
  const SUCCESS_WORDS = /\b(listo|creado|registrado|generado|exitoso|exitosamente)\b/i;

  it('executeCrearCliente con error no usa tono de éxito', async () => {
    const { saveCustomer } = await import('@/app/actions/customers');
    (saveCustomer as jest.Mock).mockResolvedValueOnce({ success: false, error: 'Error de base de datos' });

    const result = await executeCrearCliente({ name: 'Norma Soto' });

    expect(result.success).toBe(false);
    expect(result.message).not.toMatch(SUCCESS_WORDS);
  });

  it('executeCrearProspecto con error no usa tono de éxito', async () => {
    const { addCrmLead } = await import('@/app/actions/crm');
    (addCrmLead as jest.Mock).mockResolvedValueOnce({ success: false, error: 'Error interno' });

    const result = await executeCrearProspecto({ name: 'Norma Soto' });

    expect(result.success).toBe(false);
    expect(result.message).not.toMatch(SUCCESS_WORDS);
  });

  it('executeCrearEvento con error no usa tono de éxito', async () => {
    const { saveCustomer } = await import('@/app/actions/customers');
    (saveCustomer as jest.Mock).mockResolvedValueOnce({ success: false, error: 'Error al guardar' });

    const result = await executeCrearEvento({ clienteNombre: 'Ana María' });

    expect(result.success).toBe(false);
    expect(result.message).not.toMatch(SUCCESS_WORDS);
  });

  it('executeRegistrarPago con error no usa tono de éxito', async () => {
    const { addPagoToPresupuesto } = await import('@/app/actions/presupuestos');
    (addPagoToPresupuesto as jest.Mock).mockReset();
    (addPagoToPresupuesto as jest.Mock).mockResolvedValueOnce({ success: false, error: 'Presupuesto no encontrado' });

    const result = await executeRegistrarPago({ presupuestoId: 'pres_fake', monto: 5000 });

    expect(result.success).toBe(false);
    expect(result.message).not.toMatch(SUCCESS_WORDS);
  });
});
