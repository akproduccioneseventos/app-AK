import type { Empleado } from '@/types/empleado';
import type { FiestaEnPlanificacion, PersonalAsignadoDetalleStorage } from '@/types/fiesta';
import type { Rol } from '@/types/rol';
import type { GoogleTokenResponse, GoogleWorkspaceAccount, GoogleWorkspaceAccountKind } from '@/types/google-workspace';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const GOOGLE_GMAIL_API = 'https://gmail.googleapis.com/gmail/v1';
const GOOGLE_PEOPLE_API = 'https://people.googleapis.com/v1';
const GOOGLE_PEOPLE_TIMEOUT_MS = 8_000;
const MONTEVIDEO_TZ = 'America/Montevideo';

export const GOOGLE_WORKSPACE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/contacts',
];

export const GOOGLE_CONTACTS_SCOPE = 'https://www.googleapis.com/auth/contacts';

export interface GoogleContactInput {
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
  notes?: string;
}

export interface GoogleContactSyncResult {
  created: boolean;
  resourceName: string;
}

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

function isUsableGoogleRedirectOrigin(origin: string) {
  try {
    const url = new URL(origin);
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
    const isOriginOnly = url.origin === origin;
    const isReachableHost = url.hostname !== '0.0.0.0' && url.hostname !== '[::]';
    return isHttp && isOriginOnly && isReachableHost;
  } catch {
    return false;
  }
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

export async function getServiceAccountAccessToken(
  scopes: string[] = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ]
): Promise<string | null> {
  if (typeof window !== 'undefined') return null;

  const email =
    process.env.GOOGLE_WORKSPACE_CLIENT_EMAIL ||
    'ak-calendar@presupuestador-ak-producciones.iam.gserviceaccount.com';
  const privateKey = process.env.GOOGLE_WORKSPACE_PRIVATE_KEY;

  if (!privateKey || !email) return null;

  try {
    const crypto = await import('crypto');
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const claimSet = {
      iss: email,
      scope: scopes.join(' '),
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const encHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encClaims = Buffer.from(JSON.stringify(claimSet)).toString('base64url');
    const sigInput = `${encHeader}.${encClaims}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(sigInput);
    const sig = signer.sign(privateKey.replace(/\\n/g, '\n'), 'base64url');
    const jwt = `${sigInput}.${sig}`;

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      console.error('[GoogleWorkspace] Service account token failed:', await response.text());
      return null;
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  } catch (err) {
    console.error('[GoogleWorkspace] Error generating service account token:', err);
    return null;
  }
}

export function hasServiceAccountKey(): boolean {
  if (typeof window !== 'undefined') return false;
  return Boolean(process.env.GOOGLE_WORKSPACE_PRIVATE_KEY);
}

export function getMissingGoogleConfig(origin?: string) {
  const missing: string[] = [];
  if (!process.env.GOOGLE_CLIENT_ID) missing.push('GOOGLE_CLIENT_ID');
  if (!process.env.GOOGLE_CLIENT_SECRET) missing.push('GOOGLE_CLIENT_SECRET');
  if (!isUsableGoogleRedirectOrigin(getPublicAppOrigin(origin))) {
    missing.push('NEXT_PUBLIC_APP_URL');
  }
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
    if (account.kind === 'company' && hasServiceAccountKey()) {
      const saToken = await getServiceAccountAccessToken();
      if (saToken) {
        return {
          ...account,
          accessToken: saToken,
          status: 'connected',
          expiresAt: new Date(Date.now() + 3500 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          lastError: undefined,
        };
      }
    }
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
    if (account.kind === 'company' && hasServiceAccountKey()) {
      const saToken = await getServiceAccountAccessToken();
      if (saToken) {
        return {
          ...account,
          accessToken: saToken,
          status: 'connected',
          expiresAt: new Date(Date.now() + 3500 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          lastError: undefined,
        };
      }
    }
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
  if (expiresAt && expiresAt > Date.now() + 120000 && account.accessToken) {
    return account;
  }
  return refreshGoogleAccount(account);
}

export function hasGoogleContactsScope(account?: Pick<GoogleWorkspaceAccount, 'scope'>) {
  return Boolean(account?.scope?.split(/\s+/).includes(GOOGLE_CONTACTS_SCOPE));
}

function normalizeContactEmail(value?: string) {
  return value?.trim().toLowerCase() || '';
}

function normalizeContactPhone(value?: string) {
  return (value || '').replace(/\D/g, '').slice(-9);
}

function normalizeContactName(value?: string) {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') || '';
}

async function fetchGooglePeople(url: string | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GOOGLE_PEOPLE_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function upsertGoogleContact(
  account: GoogleWorkspaceAccount,
  input: GoogleContactInput,
): Promise<GoogleContactSyncResult> {
  if (!hasGoogleContactsScope(account)) {
    throw new Error('Vuelve a conectar Google Workspace para habilitar la sincronizacion de contactos.');
  }

  const email = normalizeContactEmail(input.email);
  const phone = normalizeContactPhone(input.phone);
  const name = normalizeContactName(input.name);
  const query = email || input.phone?.trim() || input.name.trim();
  const searchUrl = new URL(`${GOOGLE_PEOPLE_API}/people:searchContacts`);
  searchUrl.searchParams.set('query', query);
  searchUrl.searchParams.set('readMask', 'names,emailAddresses,phoneNumbers');
  searchUrl.searchParams.set('pageSize', '30');

  const searchResponse = await fetchGooglePeople(searchUrl, {
    headers: { Authorization: `Bearer ${account.accessToken}` },
    cache: 'no-store',
  });
  if (!searchResponse.ok) {
    throw new Error(`Google Contacts no pudo buscar el contacto: ${await searchResponse.text()}`);
  }

  const searchData = await searchResponse.json() as {
    results?: Array<{
      person?: {
        resourceName?: string;
        names?: Array<{ displayName?: string; givenName?: string }>;
        emailAddresses?: Array<{ value?: string }>;
        phoneNumbers?: Array<{ value?: string }>;
      };
    }>;
  };
  const existing = searchData.results
    ?.map((result) => result.person)
    .find((person) => {
      const sameEmail = email && person?.emailAddresses?.some((item) => normalizeContactEmail(item.value) === email);
      const samePhone = phone && person?.phoneNumbers?.some((item) => normalizeContactPhone(item.value) === phone);
      const sameName = !email && !phone && name && person?.names?.some((item) => (
        normalizeContactName(item.displayName || item.givenName) === name
      ));
      return Boolean(sameEmail || samePhone || sameName);
    });

  if (existing?.resourceName) {
    return { created: false, resourceName: existing.resourceName };
  }

  const createResponse = await fetchGooglePeople(`${GOOGLE_PEOPLE_API}/people:createContact`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      names: [{ givenName: input.name.trim() }],
      emailAddresses: email ? [{ value: email }] : [],
      phoneNumbers: input.phone?.trim() ? [{ value: input.phone.trim() }] : [],
      organizations: input.organization ? [{ name: input.organization }] : [],
      biographies: input.notes ? [{ value: input.notes, contentType: 'TEXT_PLAIN' }] : [],
    }),
  });
  if (!createResponse.ok) {
    throw new Error(`Google Contacts no pudo crear el contacto: ${await createResponse.text()}`);
  }

  const created = await createResponse.json() as { resourceName?: string };
  if (!created.resourceName) {
    throw new Error('Google Contacts no devolvio el identificador del contacto creado.');
  }
  return { created: true, resourceName: created.resourceName };
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
  let start: Date;
  if (raw) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
      // Fecha sin hora: default a las 21:00 de Uruguay (GMT-3)
      start = new Date(`${raw.trim()}T21:00:00-03:00`);
    } else {
      start = new Date(raw);
    }
  } else {
    start = new Date();
  }
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

type GoogleCalendarListItem = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

function normalizeCalendarIdentityText(value?: string) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function calendarPointMatches(point: GoogleCalendarListItem['start'], expectedIso?: string) {
  if (!expectedIso || !point) return false;
  const actual = point.dateTime || (point.date ? `${point.date}T00:00:00-03:00` : '');
  if (!actual) return false;
  const actualTime = new Date(actual).getTime();
  const expectedTime = new Date(expectedIso).getTime();
  if (!Number.isFinite(actualTime) || !Number.isFinite(expectedTime)) return false;
  return Math.abs(actualTime - expectedTime) < 60_000;
}

function calendarLocationMatches(actual?: string, expected?: string) {
  if (!expected) return true;
  return normalizeCalendarIdentityText(actual) === normalizeCalendarIdentityText(expected);
}

export async function findExistingGoogleCalendarEvent(
  account: GoogleWorkspaceAccount,
  dateStr: string,
  queryText: string,
  fiestaId: string,
  expectedEvent?: Pick<GoogleWorkspaceEventInput, 'summary' | 'startIso' | 'endIso' | 'location'>
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

    const data = await response.json() as { items?: GoogleCalendarListItem[] };
    if (!data.items || data.items.length === 0) return null;

    // 1. First priority: exact match on AK_FIESTA_ID in description
    for (const item of data.items) {
      if (item.description?.includes(`AK_FIESTA_ID: ${fiestaId}`)) {
        return item.id;
      }
    }

    // 2. Second priority: advanced match based on expectedEvent properties (introduced in origin/main)
    if (expectedEvent && expectedEvent.startIso) {
      const expectedSummary = normalizeCalendarIdentityText(expectedEvent.summary || queryText);
      if (expectedSummary) {
        for (const item of data.items) {
          const summaryMatches = normalizeCalendarIdentityText(item.summary) === expectedSummary;
          if (!summaryMatches) continue;
          if (!calendarPointMatches(item.start, expectedEvent.startIso)) continue;
          if (expectedEvent.endIso && !calendarPointMatches(item.end, expectedEvent.endIso)) continue;
          if (!calendarLocationMatches(item.location, expectedEvent.location)) continue;
          return item.id;
        }
      }
    }

    // 3. Third priority (fallback): exact match on queryText (protagonist/client name) in summary
    const cleanQuery = normalizeCalendarIdentityText(queryText);
    if (cleanQuery) {
      for (const item of data.items) {
        if (normalizeCalendarIdentityText(item.summary) === cleanQuery) {
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
