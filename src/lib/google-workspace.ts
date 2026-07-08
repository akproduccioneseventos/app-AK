import type { Empleado } from '@/types/empleado';
import type { FiestaEnPlanificacion, PersonalAsignadoDetalleStorage } from '@/types/fiesta';
import type { Rol } from '@/types/rol';
import type { GoogleTokenResponse, GoogleWorkspaceAccount, GoogleWorkspaceAccountKind } from '@/types/google-workspace';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const GOOGLE_GMAIL_API = 'https://gmail.googleapis.com/gmail/v1';
const MONTEVIDEO_TZ = 'America/Montevideo';

export const GOOGLE_WORKSPACE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send',
];

export interface GoogleOAuthState {
  kind: GoogleWorkspaceAccountKind;
  employeeId?: string;
  returnTo?: string;
}

export interface GoogleWorkspaceEventInput {
  summary: string;
  description: string;
  location?: string;
  startIso: string;
  endIso: string;
  attendees?: string[];
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = `${normalized}${'='.repeat((4 - (normalized.length % 4)) % 4)}`;
  return Buffer.from(padded, 'base64').toString('utf8');
}

export function encodeGoogleState(state: GoogleOAuthState) {
  return base64UrlEncode(JSON.stringify(state));
}

export function decodeGoogleState(rawState: string | null): GoogleOAuthState {
  if (!rawState) return { kind: 'company' };
  try {
    const parsed = JSON.parse(base64UrlDecode(rawState));
    return {
      kind: parsed.kind === 'employee' ? 'employee' : 'company',
      employeeId: typeof parsed.employeeId === 'string' ? parsed.employeeId : undefined,
      returnTo: typeof parsed.returnTo === 'string' ? parsed.returnTo : undefined,
    };
  } catch {
    return { kind: 'company' };
  }
}

export function getPublicAppOrigin(origin?: string) {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL || origin || '';
  return configuredOrigin.replace(/\/$/g, '');
}

export function getSafeGoogleReturnPath(returnTo: string | undefined, fallbackPath: string) {
  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return fallbackPath;
  }
  return returnTo;
}

export function getGoogleRedirectUri(origin?: string) {
  const configuredOrigin = getPublicAppOrigin(origin);
  const path = process.env.GOOGLE_OAUTH_REDIRECT_PATH || '/api/google/oauth/callback';
  return `${configuredOrigin}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getMissingGoogleConfig(origin?: string) {
  const missing: string[] = [];
  if (!process.env.GOOGLE_CLIENT_ID) missing.push('GOOGLE_CLIENT_ID');
  if (!process.env.GOOGLE_CLIENT_SECRET) missing.push('GOOGLE_CLIENT_SECRET');
  if (!getGoogleRedirectUri(origin)) missing.push('NEXT_PUBLIC_APP_URL');
  return missing;
}

export function buildGoogleAuthUrl(state: GoogleOAuthState, origin?: string) {
  const redirectUri = getGoogleRedirectUri(origin);
  const missingConfig = getMissingGoogleConfig(origin);

  if (missingConfig.length > 0) {
    return { success: false as const, missingConfig, redirectUri };
  }

  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', GOOGLE_WORKSPACE_SCOPES.join(' '));
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('state', encodeGoogleState(state));

  return { success: true as const, url: url.toString(), redirectUri };
}

export async function exchangeGoogleCode(code: string, origin?: string): Promise<GoogleTokenResponse> {
  const redirectUri = getGoogleRedirectUri(origin);
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    throw new Error(`Google no pudo conectar la cuenta: ${await response.text()}`);
  }

  return response.json() as Promise<GoogleTokenResponse>;
}

export async function refreshGoogleAccount(account: GoogleWorkspaceAccount): Promise<GoogleWorkspaceAccount> {
  if (!account.refreshToken) {
    return { ...account, status: 'needs_reconnect', lastError: 'Google pide volver a conectar esta cuenta.' };
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: account.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    return {
      ...account,
      status: 'needs_reconnect',
      updatedAt: new Date().toISOString(),
      lastError: await response.text(),
    };
  }

  const token = (await response.json()) as GoogleTokenResponse;
  return accountFromToken(account.kind, token, {
    existing: account,
    employeeId: account.employeeId,
    email: account.email,
    calendarId: account.calendarId,
  });
}

export async function getGoogleUserEmail(accessToken: string): Promise<string | undefined> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return undefined;
  const profile = (await response.json()) as { email?: string };
  return profile.email;
}

export function accountFromToken(
  kind: GoogleWorkspaceAccountKind,
  token: GoogleTokenResponse,
  options: {
    existing?: GoogleWorkspaceAccount;
    employeeId?: string;
    email?: string;
    calendarId?: string;
  } = {}
): GoogleWorkspaceAccount {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ((token.expires_in || 3600) - 60) * 1000).toISOString();
  const id = kind === 'company' ? 'company' : `employee_${options.employeeId || options.existing?.employeeId || 'unknown'}`;

  return {
    id,
    kind,
    employeeId: options.employeeId || options.existing?.employeeId,
    email: options.email || options.existing?.email,
    calendarId: options.calendarId || options.existing?.calendarId || process.env.GOOGLE_WORKSPACE_CALENDAR_ID || 'primary',
    accessToken: token.access_token || options.existing?.accessToken || '',
    refreshToken: token.refresh_token || options.existing?.refreshToken,
    scope: token.scope || options.existing?.scope,
    tokenType: token.token_type || options.existing?.tokenType,
    expiresAt,
    connectedAt: options.existing?.connectedAt || now.toISOString(),
    updatedAt: now.toISOString(),
    status: 'connected',
    lastError: undefined,
  };
}

export async function ensureFreshGoogleAccount(account: GoogleWorkspaceAccount) {
  const expiresAt = account.expiresAt ? new Date(account.expiresAt).getTime() : 0;
  if (expiresAt && expiresAt > Date.now() + 120000) {
    return account;
  }
  return refreshGoogleAccount(account);
}

export function getFiestaTitle(fiesta: FiestaEnPlanificacion) {
  const cfg = fiesta.configuracion || {};
  return (
    cfg.nombreEvento ||
    `${cfg.tipoCelebracion || 'Evento'} ${cfg.protagonista1Nombre ? `de ${cfg.protagonista1Nombre}` : ''}`.trim() ||
    'Evento AK'
  );
}

export function getFiestaTimes(fiesta: FiestaEnPlanificacion) {
  const raw = fiesta.configuracion?.fechaEvento;
  const start = raw ? new Date(raw) : new Date();
  const safeStart = Number.isNaN(start.getTime()) ? new Date() : start;
  const end = new Date(safeStart.getTime() + 6 * 60 * 60 * 1000);
  return { start, safeStart, end };
}

export function getRoleName(roles: Rol[], roleId?: string) {
  return roles.find((role) => role.id === roleId)?.nombre || 'Rol a confirmar';
}

export function getEmployeeEmail(employee?: Empleado | null) {
  return employee?.googleWorkspaceEmail || employee?.email || undefined;
}

function compactLines(lines: Array<string | undefined | false | null>) {
  return lines.filter(Boolean).join('\n');
}

export function buildCompanyCalendarEvent(
  fiesta: FiestaEnPlanificacion,
  assignments: Array<{ employee?: Empleado; roleName: string; item: PersonalAsignadoDetalleStorage }>
): GoogleWorkspaceEventInput {
  const cfg = fiesta.configuracion || {};
  const { safeStart, end } = getFiestaTimes(fiesta);
  const attendees = assignments
    .map((assignment) => getEmployeeEmail(assignment.employee))
    .filter((email): email is string => Boolean(email));

  return {
    summary: `[AK] ${getFiestaTitle(fiesta)}`,
    location: [cfg.nombreLugar, cfg.direccionLugar].filter(Boolean).join(' - '),
    startIso: safeStart.toISOString(),
    endIso: end.toISOString(),
    attendees,
    description: compactLines([
      `Fiesta: ${getFiestaTitle(fiesta)}`,
      cfg.tipoCelebracion ? `Tipo: ${cfg.tipoCelebracion}` : undefined,
      cfg.invitadosEstimados ? `Invitados estimados: ${cfg.invitadosEstimados}` : undefined,
      cfg.nombreLugar ? `Lugar: ${cfg.nombreLugar}` : undefined,
      cfg.direccionLugar ? `Direccion: ${cfg.direccionLugar}` : undefined,
      cfg.googleMapsUrl ? `Mapa: ${cfg.googleMapsUrl}` : undefined,
      '',
      'Personal asignado:',
      assignments.length
        ? assignments.map((assignment) => `- ${assignment.employee?.nombre || 'Sin empleado'}: ${assignment.roleName}`).join('\n')
        : '- Todavia no hay personal asignado.',
      '',
      'Este evento fue sincronizado desde AK Producciones.',
      `AK_FIESTA_ID: ${fiesta.id}`,
    ]),
  };
}

export function buildEmployeeCalendarEvent(
  fiesta: FiestaEnPlanificacion,
  employee: Empleado,
  roleName: string,
  assignment: PersonalAsignadoDetalleStorage
): GoogleWorkspaceEventInput {
  const cfg = fiesta.configuracion || {};
  const { safeStart, end } = getFiestaTimes(fiesta);
  return {
    summary: `[AK] ${roleName} - ${getFiestaTitle(fiesta)}`,
    location: [cfg.nombreLugar, cfg.direccionLugar].filter(Boolean).join(' - '),
    startIso: safeStart.toISOString(),
    endIso: end.toISOString(),
    description: compactLines([
      `Hola ${employee.nombre}, esta es tu asignacion para AK Producciones.`,
      '',
      `Fiesta: ${getFiestaTitle(fiesta)}`,
      `Rol: ${roleName}`,
      assignment.eventSalary ? `Pago del evento: ${assignment.eventSalary}` : undefined,
      cfg.invitadosEstimados ? `Invitados estimados: ${cfg.invitadosEstimados}` : undefined,
      cfg.nombreLugar ? `Lugar: ${cfg.nombreLugar}` : undefined,
      cfg.direccionLugar ? `Direccion: ${cfg.direccionLugar}` : undefined,
      cfg.googleMapsUrl ? `Mapa: ${cfg.googleMapsUrl}` : undefined,
      '',
      'Cualquier cambio queda registrado en tu pagina personal de AK.',
      `AK_FIESTA_ID: ${fiesta.id}`,
    ]),
  };
}

export function buildStaffEmailHtml(
  fiesta: FiestaEnPlanificacion,
  employee: Empleado,
  roleName: string,
  assignment: PersonalAsignadoDetalleStorage
) {
  const cfg = fiesta.configuracion || {};
  const { safeStart } = getFiestaTimes(fiesta);
  const dateLabel = new Intl.DateTimeFormat('es-UY', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: MONTEVIDEO_TZ,
  }).format(safeStart);

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <h2 style="color:#b91c1c;margin-bottom:8px">Nueva asignacion AK</h2>
      <p>Hola ${employee.nombre}, tenes una fiesta asignada.</p>
      <ul>
        <li><strong>Fiesta:</strong> ${getFiestaTitle(fiesta)}</li>
        <li><strong>Fecha:</strong> ${dateLabel}</li>
        <li><strong>Rol:</strong> ${roleName}</li>
        ${cfg.nombreLugar ? `<li><strong>Lugar:</strong> ${cfg.nombreLugar}</li>` : ''}
        ${cfg.direccionLugar ? `<li><strong>Direccion:</strong> ${cfg.direccionLugar}</li>` : ''}
        ${assignment.eventSalary ? `<li><strong>Pago del evento:</strong> ${assignment.eventSalary}</li>` : ''}
      </ul>
      <p>Si hay un cambio de fecha o de rol, AK te vuelve a avisar.</p>
    </div>
  `;
}

function toCalendarApiEvent(input: GoogleWorkspaceEventInput) {
  return {
    summary: input.summary,
    description: input.description,
    location: input.location,
    start: { dateTime: input.startIso, timeZone: MONTEVIDEO_TZ },
    end: { dateTime: input.endIso, timeZone: MONTEVIDEO_TZ },
    attendees: input.attendees?.map((email) => ({ email })),
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 180 },
      ],
    },
  };
}

export async function upsertGoogleCalendarEvent(
  account: GoogleWorkspaceAccount,
  input: GoogleWorkspaceEventInput,
  existingEventId?: string
) {
  const calendarId = encodeURIComponent(account.calendarId || 'primary');
  const sendUpdates = process.env.GOOGLE_WORKSPACE_SEND_UPDATES || 'all';
  const eventBody = toCalendarApiEvent(input);
  const url = existingEventId
    ? `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events/${encodeURIComponent(existingEventId)}?sendUpdates=${sendUpdates}`
    : `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events?sendUpdates=${sendUpdates}`;

  const response = await fetch(url, {
    method: existingEventId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventBody),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as { id: string; htmlLink?: string };
}

export async function sendGoogleGmailMessage(account: GoogleWorkspaceAccount, to: string, subject: string, html: string) {
  const rawMessage = [
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
  ].join('\r\n');

  const response = await fetch(`${GOOGLE_GMAIL_API}/users/me/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: base64UrlEncode(rawMessage) }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<{ id: string }>;
}

function googleCalendarDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function buildGoogleCalendarTemplateUrl(input: GoogleWorkspaceEventInput) {
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', input.summary);
  url.searchParams.set('details', input.description);
  url.searchParams.set('dates', `${googleCalendarDate(new Date(input.startIso))}/${googleCalendarDate(new Date(input.endIso))}`);
  if (input.location) url.searchParams.set('location', input.location);
  return url.toString();
}

export async function findExistingGoogleCalendarEvent(
  account: GoogleWorkspaceAccount,
  dateStr: string,
  queryText: string,
  fiestaId: string
): Promise<string | null> {
  try {
    const calendarId = encodeURIComponent(account.calendarId || 'primary');
    // Cover the full day in Uruguay time zone (-03:00)
    const timeMin = encodeURIComponent(new Date(`${dateStr}T00:00:00-03:00`).toISOString());
    const timeMax = encodeURIComponent(new Date(`${dateStr}T23:59:59-03:00`).toISOString());

    const url = `${GOOGLE_CALENDAR_API}/calendars/${calendarId}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
      },
    });

    if (!response.ok) {
      console.warn('[findExistingGoogleCalendarEvent] Google Calendar API error:', await response.text());
      return null;
    }

    const data = await response.json() as { items?: Array<{ id: string; summary?: string; description?: string }> };
    if (!data.items || data.items.length === 0) return null;

    // 1. First priority: exact match on AK_FIESTA_ID in description
    for (const item of data.items) {
      if (item.description?.includes(`AK_FIESTA_ID: ${fiestaId}`)) {
        return item.id;
      }
    }

    // 2. Second priority: match on queryText (protagonist/client name) in summary
    const cleanQuery = queryText.trim().toLowerCase();
    if (cleanQuery) {
      for (const item of data.items) {
        const summary = (item.summary || '').toLowerCase();
        if (summary.includes(cleanQuery)) {
          return item.id;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('[findExistingGoogleCalendarEvent] Exception:', error);
    return null;
  }
}
