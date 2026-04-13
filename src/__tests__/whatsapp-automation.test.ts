/**
 * Tests for WhatsApp automation engine.
 */

jest.mock('@/app/actions/settings', () => ({
  getWhatsAppSettings: jest.fn(),
  getWhatsAppTemplates: jest.fn(),
}));

jest.mock('@/app/actions/scheduled-messages', () => ({
  saveScheduledMessage: jest.fn(),
}));

import { triggerWhatsAppAutomation, type AutomationContext } from '@/lib/whatsapp-automation-engine';
import { getWhatsAppSettings, getWhatsAppTemplates } from '@/app/actions/settings';
import { saveScheduledMessage } from '@/app/actions/scheduled-messages';

const mockSettings = getWhatsAppSettings as jest.MockedFunction<typeof getWhatsAppSettings>;
const mockTemplates = getWhatsAppTemplates as jest.MockedFunction<typeof getWhatsAppTemplates>;
const mockSaveMsg = saveScheduledMessage as jest.MockedFunction<typeof saveScheduledMessage>;

const baseCtx: AutomationContext = {
  targetId: 'lead_1',
  targetName: 'María',
  targetType: 'prospecto',
  targetPhone: '099123456',
  nombre: 'María',
};

const baseTemplates = {
  welcomeTemplate: 'Hola {{NOMBRE}}, bienvenida!',
  budgetShareTemplate: 'Presupuesto para {{NOMBRE}}',
  contractShareTemplate: 'Contrato para {{NOMBRE}}',
};

describe('triggerWhatsAppAutomation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not send when WhatsApp is disabled', async () => {
    mockSettings.mockResolvedValue({
      enabled: false,
      automationRules: [],
      reminderMessageTemplate: '',
      paymentReminderTemplate: '',
    } as any);
    mockTemplates.mockResolvedValue(baseTemplates as any);

    const result = await triggerWhatsAppAutomation('presupuesto_generado', baseCtx);

    expect(result.scheduled).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(mockSaveMsg).not.toHaveBeenCalled();
  });

  it('schedules a message when a matching rule exists', async () => {
    mockSettings.mockResolvedValue({
      enabled: true,
      automationRules: [
        {
          id: 'rule_1',
          name: 'Welcome',
          trigger: 'presupuesto_generado',
          delayHours: 0,
          templateType: 'bienvenida',
          enabled: true,
          targetType: 'prospecto',
          createdAt: new Date().toISOString(),
        },
      ],
      reminderMessageTemplate: '',
      paymentReminderTemplate: '',
    } as any);
    mockTemplates.mockResolvedValue(baseTemplates as any);
    mockSaveMsg.mockResolvedValue({ success: true } as any);

    const result = await triggerWhatsAppAutomation('presupuesto_generado', baseCtx);

    expect(result.scheduled).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(mockSaveMsg).toHaveBeenCalledTimes(1);
    // Verify template variables were rendered
    const savedMsg = mockSaveMsg.mock.calls[0][0];
    expect(savedMsg.messageText).toContain('María');
  });

  it('does not schedule when no rules match the trigger', async () => {
    mockSettings.mockResolvedValue({
      enabled: true,
      automationRules: [
        {
          id: 'rule_1',
          name: 'Payment',
          trigger: 'pago_vencido',
          delayHours: 24,
          templateType: 'pago_vencido',
          enabled: true,
          targetType: 'cliente',
          createdAt: new Date().toISOString(),
        },
      ],
      reminderMessageTemplate: '',
      paymentReminderTemplate: '',
    } as any);
    mockTemplates.mockResolvedValue(baseTemplates as any);

    const result = await triggerWhatsAppAutomation('presupuesto_generado', baseCtx);

    expect(result.scheduled).toBe(0);
    expect(mockSaveMsg).not.toHaveBeenCalled();
  });

  it('handles saveScheduledMessage errors without throwing', async () => {
    mockSettings.mockResolvedValue({
      enabled: true,
      automationRules: [
        {
          id: 'rule_1',
          name: 'Welcome',
          trigger: 'cliente_nuevo',
          delayHours: 0,
          templateType: 'bienvenida',
          enabled: true,
          targetType: 'cliente',
          createdAt: new Date().toISOString(),
        },
      ],
      reminderMessageTemplate: '',
      paymentReminderTemplate: '',
    } as any);
    mockTemplates.mockResolvedValue(baseTemplates as any);
    mockSaveMsg.mockResolvedValue({ success: false, error: 'DB error' } as any);

    const result = await triggerWhatsAppAutomation('cliente_nuevo' as any, baseCtx);

    expect(result.scheduled).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('DB error');
  });

  it('does not block the main flow when engine errors occur', async () => {
    mockSettings.mockRejectedValue(new Error('Settings unavailable'));

    const result = await triggerWhatsAppAutomation('presupuesto_generado', baseCtx);

    // Should return gracefully with error info, not throw
    expect(result.scheduled).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Settings unavailable');
  });
});
