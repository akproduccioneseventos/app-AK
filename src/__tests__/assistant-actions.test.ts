/**
 * Tests for assistant action handler (sendAssistantMessage)
 *
 * These tests mock the AI flow and server actions to verify:
 * - Each action type without data returns a specific error (not the catch-all)
 * - import_budget_from_image with valid services creates a budget
 * - import_budget_from_image with empty/invalid services does NOT create a budget
 * - 403/permission errors return simple messages without technical details
 * - Network errors return clear messages
 */

// --- Mocks ---
jest.mock('@/ai/flows/assistant-flow', () => ({
  chatWithAssistant: jest.fn(),
}));

jest.mock('@/app/actions/dashboard', () => ({
  getDashboardKpiData: jest.fn().mockResolvedValue({ success: true, data: { alerts: [] } }),
}));

jest.mock('@/app/actions/settings', () => ({
  getCompanyInfo: jest.fn().mockResolvedValue({ companyName: 'Test Co' }),
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

import { sendAssistantMessage } from '@/app/actions/assistant';
import { chatWithAssistant } from '@/ai/flows/assistant-flow';
import { savePresupuesto } from '@/app/actions/presupuestos';

const mockChatWithAssistant = chatWithAssistant as jest.MockedFunction<typeof chatWithAssistant>;
const mockSavePresupuesto = savePresupuesto as jest.MockedFunction<typeof savePresupuesto>;

// --- Helpers ---
function makeFlowResult(type: string, data?: any) {
  return {
    response: 'Test response',
    action: { type, data },
  };
}

// --- Tests ---
describe('sendAssistantMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('action types without data return specific errors', () => {
    const casesWithoutData = [
      { type: 'import_budget_from_image', expectedError: 'No pude leer el archivo' },
      { type: 'create_budget', expectedError: 'No se pudieron extraer los datos del presupuesto' },
      { type: 'create_customer', expectedError: 'Falta información del cliente' },
      { type: 'register_payment', expectedError: 'Falta información del pago' },
      { type: 'create_invoice', expectedError: 'Falta información de la factura' },
      { type: 'update_service_price', expectedError: 'Falta información para actualizar el precio' },
      { type: 'create_employee', expectedError: 'Falta información del empleado' },
      { type: 'create_supplier', expectedError: 'Falta información del proveedor' },
      { type: 'create_lead', expectedError: 'Falta información del prospecto' },
      { type: 'create_event', expectedError: 'Falta información del evento' },
      { type: 'update_event', expectedError: 'Falta información para actualizar el evento' },
      { type: 'generate_contract', expectedError: 'Falta información para generar el contrato' },
      { type: 'check_availability', expectedError: 'Falta la fecha para consultar disponibilidad' },
      { type: 'generate_social_post', expectedError: 'Falta contenido para generar el post' },
      { type: 'generate_whatsapp_message', expectedError: 'Falta contenido para generar el mensaje' },
      { type: 'generate_promo', expectedError: 'Falta contenido para generar la promo' },
    ];

    test.each(casesWithoutData)(
      '$type without data → returns specific error containing "$expectedError"',
      async ({ type, expectedError }) => {
        mockChatWithAssistant.mockResolvedValueOnce(makeFlowResult(type, undefined) as any);
        const result = await sendAssistantMessage('test', []);
        expect(result.success).toBe(true);
        expect(result.response).toContain(expectedError);
        // Must NOT contain the generic catch-all message
        expect(result.response).not.toContain('Acción no reconocida');
      }
    );
  });

  describe('import_budget_from_image', () => {
    test('with valid services creates a budget', async () => {
      const data = {
        clienteNombre: 'Juan Pérez',
        eventoTipo: 'Cumpleaños',
        servicios: [
          { nombre: 'DJ', cantidad: 1, precioUnitario: 5000 },
          { nombre: 'Decoración', cantidad: 1, precioUnitario: 3000 },
        ],
      };
      mockChatWithAssistant.mockResolvedValueOnce(makeFlowResult('import_budget_from_image', data) as any);
      mockSavePresupuesto.mockResolvedValueOnce({
        success: true,
        presupuesto: {
          id: 'p_1',
          numero: 100,
          clienteNombre: 'Juan Pérez',
          itemsPresupuestados: [{ nombreServicio: 'DJ' }, { nombreServicio: 'Decoración' }],
          totalConDescuento: 8000,
        },
      } as any);

      const result = await sendAssistantMessage('importar', []);
      expect(result.success).toBe(true);
      expect(mockSavePresupuesto).toHaveBeenCalled();
      expect(result.response).toContain('Se importó');
      expect(result.response).toContain('Juan Pérez');
    });

    test('with empty services array does NOT create budget', async () => {
      const data = {
        clienteNombre: 'Juan Pérez',
        servicios: [],
      };
      mockChatWithAssistant.mockResolvedValueOnce(makeFlowResult('import_budget_from_image', data) as any);

      const result = await sendAssistantMessage('importar', []);
      expect(result.success).toBe(true);
      expect(mockSavePresupuesto).not.toHaveBeenCalled();
      expect(result.response).toContain('No se detectaron servicios suficientes');
    });

    test('with services that have zero price does NOT create budget', async () => {
      const data = {
        clienteNombre: 'Cliente',
        servicios: [
          { nombre: 'Servicio X', cantidad: 1, precioUnitario: 0 },
        ],
      };
      mockChatWithAssistant.mockResolvedValueOnce(makeFlowResult('import_budget_from_image', data) as any);

      const result = await sendAssistantMessage('importar', []);
      expect(result.success).toBe(true);
      expect(mockSavePresupuesto).not.toHaveBeenCalled();
      expect(result.response).toContain('No se detectaron servicios suficientes');
    });

    test('with undefined data returns specific import error', async () => {
      mockChatWithAssistant.mockResolvedValueOnce(makeFlowResult('import_budget_from_image', undefined) as any);

      const result = await sendAssistantMessage('importar', []);
      expect(result.success).toBe(true);
      expect(result.response).toContain('No pude leer el archivo');
      expect(result.response).not.toContain('Acción no reconocida');
    });
  });

  describe('error handling', () => {
    test('403 error returns simple message without technical details', async () => {
      mockChatWithAssistant.mockRejectedValueOnce(new Error('403 Forbidden - denied access to generativelanguage.googleapis.com'));

      const result = await sendAssistantMessage('test', []);
      expect(result.success).toBe(false);
      expect(result.error).toContain('No pude procesar tu mensaje');
      // Must NOT expose technical details
      expect(result.error).not.toContain('403');
      expect(result.error).not.toContain('googleapis');
      expect(result.error).not.toContain('API');
      expect(result.error).not.toContain('Gemini');
    });

    test('network error returns clear message', async () => {
      mockChatWithAssistant.mockRejectedValueOnce(new Error('fetch failed'));

      const result = await sendAssistantMessage('test', []);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // Should not expose internal error message
      expect(result.error).not.toContain('fetch failed');
    });

    test('quota error returns user-friendly message', async () => {
      mockChatWithAssistant.mockRejectedValueOnce(new Error('429 RESOURCE_EXHAUSTED quota exceeded'));

      const result = await sendAssistantMessage('test', []);
      expect(result.success).toBe(false);
      expect(result.error).toContain('temporalmente ocupado');
      expect(result.error).not.toContain('429');
    });
  });
});
