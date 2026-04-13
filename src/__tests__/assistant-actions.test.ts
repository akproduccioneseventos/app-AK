/**
 * Tests for the AK Assistant action handler (sendAssistantMessage).
 *
 * We mock the AI flow and all downstream server actions so we can test
 * the action-routing and error-handling logic in isolation.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Mocks — must be declared before the import of the module under test
// ─────────────────────────────────────────────────────────────────────────────

// Mock genkit before anything else (assistant-flow depends on it)
jest.mock('genkit', () => ({
  z: require('zod'),
  genkit: () => ({
    definePrompt: jest.fn(),
    defineFlow: jest.fn(),
  }),
}));

jest.mock('@genkit-ai/google-genai', () => ({
  googleAI: jest.fn(),
}));

jest.mock('@/ai/genkit', () => ({
  ai: {
    definePrompt: jest.fn(),
    defineFlow: jest.fn(),
  },
}));

jest.mock('@/ai/flows/assistant-flow', () => ({
  chatWithAssistant: jest.fn(),
}));

jest.mock('@/app/actions/dashboard', () => ({
  getDashboardKpiData: jest.fn().mockResolvedValue({ success: true, data: { presupuestosPendientes: 0 } }),
}));

jest.mock('@/app/actions/settings', () => ({
  getCompanyInfo: jest.fn().mockResolvedValue({ companyName: 'AK Test' }),
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

jest.mock('@/app/actions/empleados', () => ({
  saveEmpleado: jest.fn(),
}));

jest.mock('@/app/actions/proveedores', () => ({
  saveProveedor: jest.fn(),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  createNewFiestaForCustomer: jest.fn().mockResolvedValue({ success: true, fiestaId: 'fiesta_1' }),
  getAllFiestas: jest.fn().mockResolvedValue([]),
  saveFiesta: jest.fn(),
}));

jest.mock('@/app/actions/crm', () => ({
  addCrmLead: jest.fn(),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Imports
// ─────────────────────────────────────────────────────────────────────────────

import { sendAssistantMessage } from '@/app/actions/assistant';
import { chatWithAssistant } from '@/ai/flows/assistant-flow';
import { savePresupuesto } from '@/app/actions/presupuestos';

const mockChat = chatWithAssistant as jest.MockedFunction<typeof chatWithAssistant>;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Build a minimal AI result with the given action type and optional data */
function aiResult(type: string, data?: any) {
  return {
    response: 'Procesando...',
    action: { type, data },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Every action type returns a specific error when data is falsy/missing
// ─────────────────────────────────────────────────────────────────────────────

describe('sendAssistantMessage — missing data handlers', () => {
  const ACTION_TYPES_WITH_MISSING_DATA_MESSAGES: Array<{
    type: string;
    /** Substring that MUST appear in the response — NOT the generic catch-all */
    expected: string;
  }> = [
    { type: 'create_budget', expected: 'No se pudieron extraer los datos del presupuesto' },
    { type: 'create_customer', expected: 'Falta información del cliente' },
    { type: 'register_payment', expected: 'Falta información del pago' },
    { type: 'create_invoice', expected: 'Falta información de la factura' },
    { type: 'update_service_price', expected: 'Falta información para actualizar el precio' },
    { type: 'create_employee', expected: 'Falta información del empleado' },
    { type: 'create_supplier', expected: 'Falta información del proveedor' },
    { type: 'create_lead', expected: 'Falta información del prospecto' },
    { type: 'create_event', expected: 'Falta información del evento' },
    { type: 'update_event', expected: 'Falta información para actualizar el evento' },
    { type: 'generate_contract', expected: 'Falta información para generar el contrato' },
    { type: 'check_availability', expected: 'Falta la fecha para consultar disponibilidad' },
    { type: 'generate_social_post', expected: 'No se pudo generar el post' },
    { type: 'generate_whatsapp_message', expected: 'No se pudo generar el mensaje de WhatsApp' },
    { type: 'generate_promo', expected: 'No se pudo generar la promoción' },
    { type: 'import_budget_from_image', expected: 'No pude leer el archivo automáticamente' },
  ];

  it.each(ACTION_TYPES_WITH_MISSING_DATA_MESSAGES)(
    '$type → returns "$expected" (not the generic catch-all)',
    async ({ type, expected }) => {
      mockChat.mockResolvedValueOnce(aiResult(type, undefined) as any);

      const res = await sendAssistantMessage('test', []);

      expect(res.success).toBe(true);
      expect(res.response).toContain(expected);
      // Must NOT contain the generic catch-all
      expect(res.response).not.toContain('Acción no reconocida');
    },
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. import_budget_from_image — empty services / zero prices
// ─────────────────────────────────────────────────────────────────────────────

describe('sendAssistantMessage — import_budget_from_image validation', () => {
  it('rejects import when services array is empty', async () => {
    mockChat.mockResolvedValueOnce(
      aiResult('import_budget_from_image', {
        clienteNombre: 'Test',
        servicios: [],
      }) as any,
    );

    const res = await sendAssistantMessage('importá este presupuesto', []);

    expect(res.success).toBe(true);
    expect(res.response).toContain('No se detectaron servicios con precio válido');
    // savePresupuesto should NOT have been called
    expect(savePresupuesto).not.toHaveBeenCalled();
  });

  it('rejects import when all services have zero prices', async () => {
    mockChat.mockResolvedValueOnce(
      aiResult('import_budget_from_image', {
        clienteNombre: 'Test',
        servicios: [
          { nombre: 'Servicio A', precioUnitario: 0 },
          { nombre: 'Servicio B', precio: 0, cantidad: 2 },
        ],
      }) as any,
    );

    const res = await sendAssistantMessage('importá', []);

    expect(res.success).toBe(true);
    expect(res.response).toContain('No se detectaron servicios con precio válido');
    expect(savePresupuesto).not.toHaveBeenCalled();
  });

  it('rejects import when services have the default name "Servicio" and zero price', async () => {
    mockChat.mockResolvedValueOnce(
      aiResult('import_budget_from_image', {
        clienteNombre: 'Test',
        servicios: [
          { nombre: 'Servicio', precioUnitario: 100 },
        ],
      }) as any,
    );

    const res = await sendAssistantMessage('importá', []);

    // 'Servicio' as name is considered invalid by the filter (matches DEFAULT_SERVICE_NAME)
    expect(res.success).toBe(true);
    expect(res.response).toContain('No se detectaron servicios con precio válido');
    expect(savePresupuesto).not.toHaveBeenCalled();
  });

  it('includes partial extracted data in response when no valid services', async () => {
    mockChat.mockResolvedValueOnce(
      aiResult('import_budget_from_image', {
        clienteNombre: 'María',
        eventoTipo: 'XV años',
        eventoFecha: '2026-06-15',
        servicios: [],
      }) as any,
    );

    const res = await sendAssistantMessage('importá', []);

    expect(res.response).toContain('María');
    expect(res.response).toContain('XV años');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. 403/permission errors — clean user-facing message
// ─────────────────────────────────────────────────────────────────────────────

describe('sendAssistantMessage — Gemini API error handling', () => {
  const FORBIDDEN_MESSAGES = [
    '403 Forbidden',
    'Your project has been denied access',
    'API key not valid. Please pass a valid API key.',
    'FAILED_PRECONDITION: API key issue',
    'API_KEY_INVALID',
    'Forbidden',
  ];

  it.each(FORBIDDEN_MESSAGES)(
    'returns clean user message for 403-type error: "%s"',
    async (errorMsg) => {
      mockChat.mockRejectedValueOnce(new Error(errorMsg));

      const res = await sendAssistantMessage('hola', []);

      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
      // Must NOT expose technical details
      expect(res.error).not.toContain('API');
      expect(res.error).not.toContain('key');
      expect(res.error).not.toContain('403');
      expect(res.error).not.toContain('Forbidden');
      expect(res.error).not.toContain('generativelanguage.googleapis.com');
      expect(res.error).not.toContain('endpoint');
    },
  );

  it('returns clean message for quota/rate-limit errors', async () => {
    mockChat.mockRejectedValueOnce(new Error('429 RESOURCE_EXHAUSTED: quota exceeded'));

    const res = await sendAssistantMessage('hola', []);

    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
    expect(res.error).not.toContain('429');
    expect(res.error).not.toContain('RESOURCE_EXHAUSTED');
    expect(res.error).toContain('saturado');
  });

  it('returns clean message for model-not-found errors', async () => {
    mockChat.mockRejectedValueOnce(new Error('404 NOT_FOUND: model gemini-2.5-flash not found'));

    const res = await sendAssistantMessage('hola', []);

    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
    expect(res.error).not.toContain('404');
    expect(res.error).not.toContain('NOT_FOUND');
    expect(res.error).toContain('no está disponible');
  });

  it('returns clean generic message for unexpected errors', async () => {
    mockChat.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const res = await sendAssistantMessage('hola', []);

    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
    expect(res.error).not.toContain('ECONNREFUSED');
    // Should contain a user-friendly connectivity message
    expect(res.error).toBe('Error de conexión');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Catch-all for truly unrecognized action types
// ─────────────────────────────────────────────────────────────────────────────

describe('sendAssistantMessage — unrecognized action catch-all', () => {
  it('returns generic message for unknown action types', async () => {
    mockChat.mockResolvedValueOnce(
      aiResult('some_unknown_action', { foo: 'bar' }) as any,
    );

    const res = await sendAssistantMessage('hacé algo raro', []);

    expect(res.success).toBe(true);
    expect(res.response).toContain('No pude ejecutar esa acción automáticamente');
  });

  it('does not trigger catch-all for "none" action type', async () => {
    mockChat.mockResolvedValueOnce({
      response: 'Hola, ¿en qué te ayudo?',
      action: { type: 'none' },
    } as any);

    const res = await sendAssistantMessage('hola', []);

    expect(res.success).toBe(true);
    expect(res.response).toBe('Hola, ¿en qué te ayudo?');
    expect(res.response).not.toContain('No pude ejecutar');
  });

  it('does not trigger catch-all for "navigate" action type', async () => {
    mockChat.mockResolvedValueOnce({
      response: 'Te llevo a presupuestos.',
      action: { type: 'navigate', data: { href: '/presupuestos' } },
    } as any);

    const res = await sendAssistantMessage('llevame a presupuestos', []);

    expect(res.success).toBe(true);
    expect(res.response).toBe('Te llevo a presupuestos.');
  });
});
