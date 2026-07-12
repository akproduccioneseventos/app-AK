import type { GoogleWorkspaceAccount } from '@/types/google-workspace';

type RecoveryGoogleAccount = Pick<GoogleWorkspaceAccount, 'email' | 'status' | 'accessToken' | 'lastError'>;

export function getGoogleRecoveryAccountStatus(
  company: RecoveryGoogleAccount | undefined,
  refreshed: RecoveryGoogleAccount | undefined
) {
  if (!company) {
    return {
      connected: false,
      email: undefined as string | undefined,
      reason: 'No hay cuenta Gmail de AK conectada.',
    };
  }

  if (!refreshed) {
    return {
      connected: false,
      email: company.email,
      reason: company.lastError || 'La cuenta Gmail de AK necesita volver a conectarse.',
    };
  }

  const connected = refreshed.status === 'connected' && Boolean(refreshed.accessToken);
  return {
    connected,
    email: refreshed.email || company.email,
    reason: connected
      ? undefined
      : refreshed.lastError || 'La cuenta Gmail de AK necesita volver a conectarse.',
  };
}

