import { normalizeAssistantActionResult, shouldShowAssistantSuccess } from '@/lib/assistant/action-safety';

describe('normalizeAssistantActionResult', () => {
  it('shows success only when something changed', () => {
    const result = normalizeAssistantActionResult({
      success: true,
      changed: true,
      message: 'Cliente creado.',
    });

    expect(result.status).toBe('success');
    expect(result.canShowSuccessToast).toBe(true);
  });

  it('does not show success for no-change results', () => {
    const result = normalizeAssistantActionResult({
      success: true,
      changed: false,
      message: 'Ya existia.',
    });

    expect(result.status).toBe('no_change');
    expect(result.canShowSuccessToast).toBe(false);
  });

  it('keeps errors as errors', () => {
    expect(shouldShowAssistantSuccess({ success: false, error: 'Falto el telefono.' })).toBe(false);
  });
});
