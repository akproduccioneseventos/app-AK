/**
 * Pruebas de integración del dispatcher de TOOL_REGISTRY en sendAssistantMessage.
 *
 * Verifica que:
 *  - Los mensajes de alta confianza se despachan a través del TOOL_REGISTRY
 *    antes de llamar a Gemini (intent router).
 *  - El asistente solo confirma éxito si tool.execute() devuelve success=true.
 *  - Si la herramienta falla, el asistente responde el error sin confirmar la acción.
 *  - Cuando Gemini devuelve action.type con datos válidos, también pasa por TOOL_REGISTRY.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Mocks — must come before any imports that load the modules under test
// ─────────────────────────────────────────────────────────────────────────────

jest.mock('genkit', () => ({
  z: require('zod'),
  genkit: () => ({ definePrompt: jest.fn(), defineFlow: jest.fn() }),
}));

jest.mock('@genkit-ai/google-genai', () => ({ googleAI: jest.fn() }));

jest.mock('@/ai/genkit', () => ({
  ai: { definePrompt: jest.fn(), defineFlow: jest.fn() },
}));

jest.mock('@/ai/flows/assistant-flow', () => ({
  chatWithAssistant: jest.fn(),
}));

jest.mock('@/ai/flows/marketing-agent-flow', () => ({
  chatWithMarketingAgent: jest.fn().mockRejectedValue(new Error('No API key in test')),
}));

jest.mock('@/app/actions/dashboard', () => ({
  getDashboardKpiData: jest.fn().mockResolvedValue({ success: true, data: { presupuestosPendientes: 0 } }),
}));

jest.mock('@/app/actions/settings', () => ({
  getCompanyInfo: jest.fn().mockResolvedValue({ companyName: 'AK Test' }),
  getAiAssistantSettings: jest.fn().mockResolvedValue({ customInstructions: '', updatedAt: '', knowledgeDocuments: [] }),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestos: jest.fn().mockResolvedValue([]),
  savePresupuesto: jest.fn(),
  addPagoToPresupuesto: jest.fn(),
}));

jest.mock('@/app/actions/customers', () => ({
  getCustomers: jest.fn().mockResolvedValue([]),
  saveCustomer: jest.fn().mockResolvedValue({ success: true, id: 'cust_1' }),
}));

jest.mock('@/app/actions/invoices', () => ({
  saveInvoice: jest.fn(),
}));

jest.mock('@/app/actions/servicios-empresa', () => ({
  getServiciosEmpresa: jest.fn().mockResolvedValue([]),
  saveServicioEmpresa: jest.fn(),
}));

jest.mock('@/app/actions/empleados', () => ({ saveEmpleado: jest.fn() }));
jest.mock('@/app/actions/proveedores', () => ({ saveProveedor: jest.fn() }));

jest.mock('@/app/actions/notifications', () => ({
  createNotification: jest.fn().mockResolvedValue({ success: true }),
  getNotifications: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  createNewFiestaForCustomer: jest.fn().mockResolvedValue({ success: true, fiestaId: 'fiesta_1' }),
  getAllFiestas: jest.fn().mockResolvedValue([]),
  saveFiesta: jest.fn(),
}));

jest.mock('@/app/actions/crm', () => ({
  addCrmLead: jest.fn(),
  getCrmLeads: jest.fn().mockResolvedValue([]),
  getCrmStages: jest.fn().mockResolvedValue([{ id: 's2', name: 'Agendó entrevista', order: 2 }]),
  scheduleCrmMeeting: jest.fn().mockResolvedValue({ success: true }),
  moveCrmLead: jest.fn().mockResolvedValue({ success: true }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Imports
// ─────────────────────────────────────────────────────────────────────────────

import { sendAssistantMessage } from '@/app/actions/assistant';
import { chatWithAssistant } from '@/ai/flows/assistant-flow';
import { savePresupuesto, addPagoToPresupuesto } from '@/app/actions/presupuestos';
import { addCrmLead, getCrmLeads } from '@/app/actions/crm';

const mockChat = chatWithAssistant as jest.MockedFunction<typeof chatWithAssistant>;
const mockAddCrmLead = addCrmLead as jest.MockedFunction<typeof addCrmLead>;
const mockSavePresupuesto = savePresupuesto as jest.MockedFunction<typeof savePresupuesto>;
const mockAddPago = addPagoToPresupuesto as jest.MockedFunction<typeof addPagoToPresupuesto>;
const mockGetCrmLeads = getCrmLeads as jest.MockedFunction<typeof getCrmLeads>;

beforeEach(() => {
  jest.clearAllMocks();
});


// ─────────────────────────────────────────────────────────────────────────────
// 1. Intent router: create_budget → TOOL_REGISTRY → crearPresupuesto
// ─────────────────────────────────────────────────────────────────────────────

describe('Dispatcher — intent create_budget via TOOL_REGISTRY', () => {
  it('dispara crearPresupuesto cuando el mensaje tiene alta confianza (sin llamar a Gemini)', async () => {
    mockSavePresupuesto.mockResolvedValueOnce({
      success: true,
      id: 'pres_disp_1',
    } as any);

    const res = await sendAssistantMessage(
      'Haceme un presupuesto para María XV años 100 invitados',
      [],
    );

    expect(res.success).toBe(true);
    // Gemini was NOT called — the intent router handled it
    expect(mockChat).not.toHaveBeenCalled();
    // savePresupuesto was called via the TOOL_REGISTRY executor
    expect(mockSavePresupuesto).toHaveBeenCalledTimes(1);
    expect(mockSavePresupuesto).toHaveBeenCalledWith(
      expect.objectContaining({ clienteNombre: expect.stringContaining('María') }),
      expect.any(Object),
    );
    expect(res.response).toContain('✅');
    expect(res.response).toContain('María');
  });

  it('responde el error del tool si savePresupuesto falla (no confirma éxito)', async () => {
    mockSavePresupuesto.mockResolvedValueOnce({
      success: false,
      error: 'Firestore no disponible',
    } as any);

    const res = await sendAssistantMessage(
      'Haceme un presupuesto para María XV años 100 invitados',
      [],
    );

    expect(res.success).toBe(true);
    // Tool returned failure → response must NOT contain ✅
    expect(res.response).not.toContain('✅');
    expect(res.response).toContain('❌');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Intent router: create_lead → TOOL_REGISTRY → crearProspecto
// ─────────────────────────────────────────────────────────────────────────────

describe('Dispatcher — intent create_lead via TOOL_REGISTRY', () => {
  it('registra prospecto cuando el mensaje tiene alta confianza (sin llamar a Gemini)', async () => {
    mockAddCrmLead.mockResolvedValueOnce({
      success: true,
      lead: { id: 'lead_disp_1', name: 'Ana García', createdAt: '', updatedAt: '' } as any,
    });

    const res = await sendAssistantMessage(
      'Registrá un prospecto: Ana García, casamiento',
      [],
    );

    expect(res.success).toBe(true);
    expect(mockChat).not.toHaveBeenCalled();
    expect(mockAddCrmLead).toHaveBeenCalledTimes(1);
    expect(mockAddCrmLead).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ana García' }),
    );
    expect(res.response).toContain('✅');
  });

  it('devuelve error si addCrmLead falla (no confirma registro)', async () => {
    mockAddCrmLead.mockResolvedValueOnce({
      success: false,
      error: 'Error al guardar',
    } as any);

    const res = await sendAssistantMessage(
      'Registrá un prospecto: Lucía Torres, XV años',
      [],
    );

    expect(res.success).toBe(true);
    expect(res.response).not.toContain('✅');
    expect(res.response).toContain('❌');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Intent router: register_payment → TOOL_REGISTRY → registrarPago
// ─────────────────────────────────────────────────────────────────────────────

describe('Dispatcher — intent register_payment via TOOL_REGISTRY', () => {
  it('registra pago cuando el mensaje tiene alta confianza (sin llamar a Gemini)', async () => {
    const { getPresupuestos } = require('@/app/actions/presupuestos');
    (getPresupuestos as jest.Mock).mockResolvedValueOnce([
      { id: 'pres_maria', clienteNombre: 'María López', timestamp: new Date().toISOString() },
    ]);
    mockAddPago.mockResolvedValueOnce({ success: true } as any);

    const res = await sendAssistantMessage(
      'Registrá un pago de 15000 pesos para María López',
      [],
    );

    expect(res.success).toBe(true);
    expect(mockChat).not.toHaveBeenCalled();
    expect(mockAddPago).toHaveBeenCalledTimes(1);
    expect(mockAddPago).toHaveBeenCalledWith(
      'pres_maria',
      expect.objectContaining({ monto: 15000 }),
    );
    expect(res.response).toContain('✅');
  });

  it('devuelve error si no se encuentra el presupuesto (no confirma pago)', async () => {
    const { getPresupuestos } = require('@/app/actions/presupuestos');
    (getPresupuestos as jest.Mock).mockResolvedValueOnce([]);

    const res = await sendAssistantMessage(
      'Registrá un pago de 15000 pesos para María López',
      [],
    );

    expect(res.success).toBe(true);
    expect(res.response).not.toContain('✅');
    expect(res.response).toContain('❌');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. schedule_meeting intent router — ya existente, confirmar que sigue funcionando
// ─────────────────────────────────────────────────────────────────────────────

describe('Dispatcher — intent schedule_meeting (existente)', () => {
  it('"Agendame cita con Norma mañana a las 15" despacha agendarCita sin llamar a Gemini', async () => {
    mockGetCrmLeads.mockResolvedValueOnce([]);
    mockAddCrmLead.mockResolvedValueOnce({
      success: true,
      lead: { id: 'lead_norma', name: 'Norma', createdAt: '', updatedAt: '' } as any,
    });

    const res = await sendAssistantMessage('Agendame cita con Norma mañana a las 15', []);

    expect(res.success).toBe(true);
    expect(res.response).toContain('Cita agendada');
    // Gemini was NOT called
    expect(mockChat).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Gemini returns action.type → también pasa por TOOL_REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

describe('Dispatcher — Gemini action.type pasa por TOOL_REGISTRY', () => {
  it('Gemini devuelve create_lead con datos → usa crearProspectoTool (no confirma solo con respuesta de Gemini)', async () => {
    mockChat.mockResolvedValueOnce({
      response: 'Voy a registrar el prospecto.',
      action: {
        type: 'create_lead',
        data: { name: 'Roberto García', partyType: 'Casamiento', followUpDate: '2026-05-01' },
      },
    } as any);

    mockAddCrmLead.mockResolvedValueOnce({
      success: true,
      lead: { id: 'lead_roberto', name: 'Roberto García', createdAt: '', updatedAt: '' } as any,
    });

    const res = await sendAssistantMessage('Quiero registrar un prospecto', []);

    expect(res.success).toBe(true);
    // Tool was called (not just Gemini text response)
    expect(mockAddCrmLead).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Roberto García' }),
    );
    expect(res.response).toContain('✅');
  });

  it('Gemini devuelve create_lead con datos pero el tool falla → no confirma éxito', async () => {
    mockChat.mockResolvedValueOnce({
      response: 'Voy a registrar el prospecto.',
      action: {
        type: 'create_lead',
        data: { name: 'Valentina Cruz' },
      },
    } as any);

    mockAddCrmLead.mockResolvedValueOnce({
      success: false,
      error: 'Error interno',
    } as any);

    const res = await sendAssistantMessage('Quiero registrar un prospecto', []);

    expect(res.success).toBe(true);
    // Response must NOT confirm success if tool failed
    expect(res.response).not.toContain('✅');
    expect(res.response).toContain('❌');
  });

  it('Gemini devuelve register_payment con datos → usa registrarPagoTool', async () => {
    const { getPresupuestos } = require('@/app/actions/presupuestos');
    // getPresupuestos is called twice: once in the data loading section of sendAssistantMessage,
    // and once inside executeRegistrarPago. Mock both calls.
    (getPresupuestos as jest.Mock)
      .mockResolvedValueOnce([]) // data loading section
      .mockResolvedValueOnce([
        { id: 'pres_juan', clienteNombre: 'Juan García', timestamp: new Date().toISOString() },
      ]); // executor call
    mockAddPago.mockResolvedValueOnce({ success: true } as any);

    mockChat.mockResolvedValueOnce({
      response: 'Voy a registrar el pago.',
      action: {
        type: 'register_payment',
        data: { clienteNombre: 'Juan García', monto: 20000, metodoPago: 'Efectivo' },
      },
    } as any);

    const res = await sendAssistantMessage('Registrá el pago de Juan García', []);

    expect(res.success).toBe(true);
    expect(mockAddPago).toHaveBeenCalledTimes(1);
    expect(mockAddPago).toHaveBeenCalledWith(
      'pres_juan',
      expect.objectContaining({ monto: 20000 }),
    );
    expect(res.response).toContain('✅');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Safe mode — ASSISTANT_WRITE_ACTIONS_ENABLED apagado
// ─────────────────────────────────────────────────────────────────────────────

describe('Modo seguro — ASSISTANT_WRITE_ACTIONS_ENABLED desactivado', () => {
  beforeEach(() => {
    delete process.env.ASSISTANT_WRITE_ACTIONS_ENABLED;
  });

  afterEach(() => {
    delete process.env.ASSISTANT_WRITE_ACTIONS_ENABLED;
  });

  it('create_budget no ejecuta savePresupuesto y responde modo seguro', async () => {
    const res = await sendAssistantMessage(
      'Haceme un presupuesto para María XV años 100 invitados',
      [],
    );

    expect(res.success).toBe(true);
    // savePresupuesto was NOT called
    expect(mockSavePresupuesto).not.toHaveBeenCalled();
    // Response indicates action is disabled
    expect(res.response).toMatch(/desactivad[ao]|configuraci[oó]n|manualmente/i);
    // Must not contain success emoji
    expect(res.response).not.toContain('✅');
  });

  it('register_payment no ejecuta addPagoToPresupuesto y responde modo seguro', async () => {
    const { getPresupuestos } = require('@/app/actions/presupuestos');
    (getPresupuestos as jest.Mock).mockResolvedValueOnce([
      { id: 'pres_safe', clienteNombre: 'María López', timestamp: new Date().toISOString() },
    ]);

    const res = await sendAssistantMessage(
      'Registrá un pago de 15000 pesos para María López',
      [],
    );

    expect(res.success).toBe(true);
    expect(mockAddPago).not.toHaveBeenCalled();
    expect(res.response).toMatch(/desactivad[ao]|configuraci[oó]n|manualmente/i);
    expect(res.response).not.toContain('✅');
  });

  it('generate_social_post sí funciona cuando el modo operativo está apagado', async () => {
    mockChat.mockResolvedValueOnce({
      response: 'Acá va tu post de Instagram 🎉',
      action: {
        type: 'generate_social_post',
        data: { content: 'Post de marketing generado para AK Producciones.' },
      },
    } as any);

    const res = await sendAssistantMessage('Generame un post para Instagram', []);

    expect(res.success).toBe(true);
    // Marketing action passed through normally
    expect(res.action?.type).toBe('generate_social_post');
  });
});

describe('Modo seguro — ASSISTANT_WRITE_ACTIONS_ENABLED activo', () => {
  beforeEach(() => {
    process.env.ASSISTANT_WRITE_ACTIONS_ENABLED = 'true';
  });

  afterEach(() => {
    delete process.env.ASSISTANT_WRITE_ACTIONS_ENABLED;
  });

  it('con modo operativo activo, create_budget ejecuta savePresupuesto', async () => {
    mockSavePresupuesto.mockResolvedValueOnce({
      success: true,
      id: 'pres_enabled_1',
    } as any);

    const res = await sendAssistantMessage(
      'Haceme un presupuesto para María XV años 100 invitados',
      [],
    );

    expect(res.success).toBe(true);
    expect(mockSavePresupuesto).toHaveBeenCalledTimes(1);
    expect(res.response).toContain('✅');
  });
});
