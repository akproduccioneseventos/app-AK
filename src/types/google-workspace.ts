export type GoogleWorkspaceAccountKind = 'company' | 'employee';

export interface GoogleWorkspaceAccount {
  id: string;
  kind: GoogleWorkspaceAccountKind;
  employeeId?: string;
  email?: string;
  calendarId?: string;
  accessToken: string;
  refreshToken?: string;
  scope?: string;
  tokenType?: string;
  expiresAt?: string;
  connectedAt: string;
  updatedAt: string;
  status: 'connected' | 'needs_reconnect' | 'error';
  lastError?: string;
}

export interface GoogleWorkspaceSyncRecord {
  fiestaId: string;
  companyCalendarEventId?: string;
  employeeCalendarEventIds: Record<string, string>;
  lastEmailAtByEmployee: Record<string, string>;
  lastSyncedAt?: string;
  lastError?: string;
  warnings?: string[];
}

export interface PublicGoogleWorkspaceAccount {
  id: string;
  kind: GoogleWorkspaceAccountKind;
  employeeId?: string;
  email?: string;
  calendarId?: string;
  connectedAt: string;
  updatedAt: string;
  status: GoogleWorkspaceAccount['status'];
  lastError?: string;
}

export interface GoogleWorkspaceDashboard {
  configured: boolean;
  missingConfig: string[];
  redirectUri: string;
  companyAccount?: PublicGoogleWorkspaceAccount;
  connectedEmployees: PublicGoogleWorkspaceAccount[];
  employeeCount: number;
  employeesWithEmail: number;
  syncedFiestas: number;
  pendingFiestas: number;
  lastSyncedAt?: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
}

export interface GoogleWorkspaceSyncOptions {
  sendEmails?: boolean;
  forceEmail?: boolean;
  reason?: 'manual' | 'personal' | 'date-change' | 'bulk';
}
