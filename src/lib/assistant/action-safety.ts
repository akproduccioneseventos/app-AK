export type AssistantRawActionResult = {
  success?: boolean;
  changed?: boolean;
  message?: string | null;
  error?: string | null;
  data?: unknown;
};

export type AssistantSafeActionResult = {
  status: 'success' | 'no_change' | 'error';
  userMessage: string;
  canShowSuccessToast: boolean;
  data?: unknown;
};

function cleanMessage(message?: string | null) {
  return message?.trim() || null;
}

export function normalizeAssistantActionResult(result: AssistantRawActionResult): AssistantSafeActionResult {
  const error = cleanMessage(result.error);
  const message = cleanMessage(result.message);

  if (error || result.success === false) {
    return {
      status: 'error',
      userMessage: error ?? message ?? 'No se pudo completar la accion.',
      canShowSuccessToast: false,
      data: result.data,
    };
  }

  if (result.success && result.changed) {
    return {
      status: 'success',
      userMessage: message ?? 'Accion completada.',
      canShowSuccessToast: true,
      data: result.data,
    };
  }

  return {
    status: 'no_change',
    userMessage: message ?? 'No se hicieron cambios.',
    canShowSuccessToast: false,
    data: result.data,
  };
}

export function shouldShowAssistantSuccess(result: AssistantRawActionResult) {
  return normalizeAssistantActionResult(result).canShowSuccessToast;
}
