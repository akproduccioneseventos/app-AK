'use server';

import { getFiestaById, getFiestas } from './fiesta/fiesta.actions';
import { getPresupuestoById } from './presupuestos';
import { readData, writeData } from '@/lib/data-service';
import {
  buildGoogleCalendarTemplateUrl,
  ensureFreshGoogleAccount,
  getFiestaTimes,
  getFiestaTitle,
  sendGoogleGmailMessage,
  upsertGoogleCalendarEvent,
  type GoogleWorkspaceEventInput,
} from '@/lib/google-workspace';
import type { ClientPaymentNotification, FiestaEnPlanificacion, Invitado, Reunion } from '@/types/fiesta';
import type { PagoCliente } from '@/types/presupuesto';
import type { GoogleWorkspaceAccount, GoogleWorkspaceSyncRecord } from '@/types/google-workspace';

import { requireAppSession } from '@/lib/auth/require-session';
const ACCOUNTS_FILE = '_google-workspace-accounts.json';
const SYNC_FILE = '_google-workspace-sync.json';
const MONTEVIDEO_TZ = 'America/Montevideo';

function compactLines(lines: Array<string | undefined | false | null>) {
  return lines.filter(Boolean).join('\n');
}

function escapeHtml(value?: string | number | null) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatUyDate(date: Date) {
  return new Intl.DateTimeFormat('es-UY', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: MONTEVIDEO_TZ,
  }).format(date);
}

function normalizeEmailCandidate(value?: string | null) {
  if (!value) return undefined;
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0]?.toLowerCase();
}

function getEventLocation(fiesta: FiestaEnPlanificacion) {
  const cfg = fiesta.configuracion || {};
  return [cfg.nombreLugar, cfg.direccionLugar].filter(Boolean).join(' - ');
}

function getFiestaClientName(fiesta: FiestaEnPlanificacion) {
  return (
    fiesta.configuracion?.clienteNombre ||
    fiesta.configuracion?.protagonista1Nombre ||
    fiesta.configuracion?.protagonista2Nombre ||
    getFiestaTitle(fiesta)
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return (value ?? {}) as Record<string, unknown>;
}

function getFiestaClientEmail(fiesta: FiestaEnPlanificacion, fallback?: string | null) {
  const config = asRecord(fiesta.configuracion);
  const portal = asRecord(fiesta.clientePortalExperience);
  const other = asRecord(fiesta.others);
  const candidates = [
    fallback,
    config.clienteEmail,
    config.emailCliente,
    config.email,
    config.contactoCliente,
    config.clienteContacto,
    portal.clienteEmail,
    portal.emailCliente,
    other.clienteEmail,
    other.emailCliente,
    other.email,
  ];

  for (const candidate of candidates) {
    const email = normalizeEmailCandidate(typeof candidate === 'string' ? candidate : undefined);
    if (email) return email;
  }

  return undefined;
}

function getGuestEmail(invitado: Invitado) {
  return normalizeEmailCandidate(invitado.contacto);
}

async function readAccounts() {
  return readData<GoogleWorkspaceAccount[]>(ACCOUNTS_FILE, []);
}

async function readSyncRecords() {
  return readData<GoogleWorkspaceSyncRecord[]>(SYNC_FILE, []);
}

async function writeAccounts(accounts: GoogleWorkspaceAccount[]) {
  await writeData(ACCOUNTS_FILE, accounts);
}

async function writeSyncRecords(records: GoogleWorkspaceSyncRecord[]) {
  await writeData(SYNC_FILE, records);
}

function upsertAccount(accounts: GoogleWorkspaceAccount[], account: GoogleWorkspaceAccount) {
  const index = accounts.findIndex((item) => item.id === account.id);
  if (index === -1) return [...accounts, account];
  const next = [...accounts];
  next[index] = account;
  return next;
}

function upsertRecord(records: GoogleWorkspaceSyncRecord[], record: GoogleWorkspaceSyncRecord) {
  const index = records.findIndex((item) => item.fiestaId === record.fiestaId);
  if (index === -1) return [...records, record];
  const next = [...records];
  next[index] = record;
  return next;
}

function getRecord(records: GoogleWorkspaceSyncRecord[], fiestaId: string): GoogleWorkspaceSyncRecord {
  return (
    records.find((item) => item.fiestaId === fiestaId) || {
      fiestaId,
      employeeCalendarEventIds: {},
      lastEmailAtByEmployee: {},
      warnings: [],
    }
  );
}

async function freshConnectedAccount(account?: GoogleWorkspaceAccount) {
  if (!account) return undefined;
  return ensureFreshGoogleAccount(account);
}

async function getCompanyGoogleAccountForSend() {
  const accounts = await readAccounts();
  const companyAccount = accounts.find((account) => account.kind === 'company');
  const freshCompany = await freshConnectedAccount(companyAccount);

  if (freshCompany) {
    await writeAccounts(upsertAccount(accounts, freshCompany));
  }

  if (freshCompany?.status === 'connected' && freshCompany.accessToken) {
    return { account: freshCompany, warnings: [] as string[] };
  }

  return { account: undefined, warnings: ['La cuenta Google de AK no esta conectada.'] };
}

async function resolveClientContact(fiesta: FiestaEnPlanificacion) {
  const presupuesto = fiesta.presupuestoId
    ? await getPresupuestoById(fiesta.presupuestoId).catch(() => null)
    : null;
  const email = getFiestaClientEmail(fiesta, normalizeEmailCandidate(presupuesto?.clienteContacto));
  const name = presupuesto?.clienteNombre || getFiestaClientName(fiesta);

  return { email, name, presupuesto };
}

async function sendCompanyEmail(input: { to?: string; subject: string; html: string }) {
  if (!input.to) return { success: false, warnings: ['No hay email destino para enviar.'] };

  const { account, warnings } = await getCompanyGoogleAccountForSend();
  if (!account) return { success: false, warnings };

  try {
    await sendGoogleGmailMessage(account, input.to, input.subject, input.html);
    return { success: true, warnings };
  } catch (error: any) {
    return { success: false, warnings: [...warnings, error?.message || String(error)] };
  }
}

function buildClientEventCalendarEvent(fiesta: FiestaEnPlanificacion): GoogleWorkspaceEventInput {
  const { safeStart, end } = getFiestaTimes(fiesta);
  const cfg = fiesta.configuracion || {};

  return {
    summary: getFiestaTitle(fiesta),
    location: getEventLocation(fiesta),
    startIso: safeStart.toISOString(),
    endIso: end.toISOString(),
    description: compactLines([
      `Evento: ${getFiestaTitle(fiesta)}`,
      cfg.tipoCelebracion ? `Tipo: ${cfg.tipoCelebracion}` : undefined,
      cfg.nombreLugar ? `Lugar: ${cfg.nombreLugar}` : undefined,
      cfg.direccionLugar ? `Direccion: ${cfg.direccionLugar}` : undefined,
      cfg.googleMapsUrl ? `Mapa: ${cfg.googleMapsUrl}` : undefined,
      '',
      'Agendado desde AK Producciones.',
    ]),
  };
}

function buildMeetingCalendarEvent(fiesta: FiestaEnPlanificacion, reunion: Reunion, clientEmail?: string): GoogleWorkspaceEventInput {
  const raw = reunion.fecha || fiesta.configuracion?.fechaEvento;
  const start = raw ? new Date(raw) : new Date();
  const safeStart = Number.isNaN(start.getTime()) ? new Date() : start;
  const end = new Date(safeStart.getTime() + 60 * 60 * 1000);

  return {
    summary: `[AK Reunion] ${reunion.titulo || getFiestaTitle(fiesta)}`,
    location: getEventLocation(fiesta),
    startIso: safeStart.toISOString(),
    endIso: end.toISOString(),
    attendees: clientEmail ? [clientEmail] : undefined,
    description: compactLines([
      `Evento: ${getFiestaTitle(fiesta)}`,
      reunion.notas ? `Notas: ${reunion.notas}` : undefined,
      reunion.acuerdos ? `Acuerdos: ${reunion.acuerdos}` : undefined,
      reunion.checklist?.length
        ? `Pendientes:\n${reunion.checklist.map((item) => `- ${item.completed ? '[x]' : '[ ]'} ${item.text}`).join('\n')}`
        : undefined,
      '',
      'Reunion sincronizada desde AK Producciones.',
    ]),
  };
}

function buildMeetingEmailHtml(input: { fiesta: FiestaEnPlanificacion; reunion: Reunion; clientName?: string; calendarTemplateUrl: string }) {
  const raw = input.reunion.fecha || input.fiesta.configuracion?.fechaEvento;
  const safeStart = raw ? new Date(raw) : new Date();
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <h2 style="color:#b91c1c;margin-bottom:8px">Reunion AK Producciones</h2>
      <p>Hola ${escapeHtml(input.clientName || 'cliente')}, te dejamos la reunion agendada.</p>
      <ul>
        <li><strong>Evento:</strong> ${escapeHtml(getFiestaTitle(input.fiesta))}</li>
        <li><strong>Reunion:</strong> ${escapeHtml(input.reunion.titulo)}</li>
        <li><strong>Fecha:</strong> ${escapeHtml(formatUyDate(safeStart))}</li>
        ${input.reunion.acuerdos ? `<li><strong>Acuerdos:</strong> ${escapeHtml(input.reunion.acuerdos)}</li>` : ''}
      </ul>
      <p><a href="${escapeHtml(input.calendarTemplateUrl)}" style="color:#b91c1c;font-weight:bold">Agregar a Google Calendar</a></p>
    </div>
  `;
}

function buildCompanyPaymentSubmittedEmailHtml(input: { fiesta: FiestaEnPlanificacion; payment: ClientPaymentNotification }) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <h2 style="color:#b91c1c;margin-bottom:8px">Pago informado por cliente</h2>
      <p>Un cliente informo un pago desde el portal.</p>
      <ul>
        <li><strong>Evento:</strong> ${escapeHtml(getFiestaTitle(input.fiesta))}</li>
        <li><strong>Monto:</strong> $${escapeHtml(input.payment.monto.toLocaleString('es-UY'))}</li>
        <li><strong>Estado:</strong> pendiente de revision</li>
        ${input.payment.comprobanteNombre ? `<li><strong>Comprobante:</strong> ${escapeHtml(input.payment.comprobanteNombre)}</li>` : ''}
      </ul>
    </div>
  `;
}

function buildClientPaymentEmailHtml(input: { fiesta: FiestaEnPlanificacion; payment: Pick<ClientPaymentNotification, 'monto' | 'timestamp' | 'notas'>; status: 'recibido' | 'aprobado' | 'rechazado'; clientName?: string }) {
  const titleByStatus = {
    recibido: 'Recibimos tu aviso de pago',
    aprobado: 'Tu pago fue confirmado',
    rechazado: 'Necesitamos revisar tu pago',
  } as const;
  const messageByStatus = {
    recibido: 'AK ya recibio tu comprobante y lo va a revisar.',
    aprobado: 'El pago quedo registrado correctamente en tu evento.',
    rechazado: 'El comprobante no pudo aprobarse todavia. Te vamos a contactar para revisarlo.',
  } as const;

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <h2 style="color:#b91c1c;margin-bottom:8px">${titleByStatus[input.status]}</h2>
      <p>Hola ${escapeHtml(input.clientName || 'cliente')}, ${messageByStatus[input.status]}</p>
      <ul>
        <li><strong>Evento:</strong> ${escapeHtml(getFiestaTitle(input.fiesta))}</li>
        <li><strong>Monto:</strong> $${escapeHtml(input.payment.monto.toLocaleString('es-UY'))}</li>
        <li><strong>Fecha:</strong> ${escapeHtml(formatUyDate(new Date(input.payment.timestamp || Date.now())))}</li>
      </ul>
      <p>Gracias por confiar en AK Producciones.</p>
    </div>
  `;
}

function buildContractSignedEmailHtml(input: { fiesta: FiestaEnPlanificacion; clientName?: string; signerName?: string; method: 'digital' | 'physical'; calendarTemplateUrl: string }) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <h2 style="color:#b91c1c;margin-bottom:8px">Evento confirmado con AK</h2>
      <p>Hola ${escapeHtml(input.clientName || 'cliente')}, tu contrato quedo registrado.</p>
      <ul>
        <li><strong>Evento:</strong> ${escapeHtml(getFiestaTitle(input.fiesta))}</li>
        <li><strong>Firma:</strong> ${input.method === 'digital' ? 'Digital' : 'Contrato fisico cargado'}</li>
        ${input.signerName ? `<li><strong>Firmado por:</strong> ${escapeHtml(input.signerName)}</li>` : ''}
      </ul>
      <p><a href="${escapeHtml(input.calendarTemplateUrl)}" style="color:#b91c1c;font-weight:bold">Agregar la fecha a Google Calendar</a></p>
    </div>
  `;
}

function buildGuestInvitationEmailHtml(input: { fiesta: FiestaEnPlanificacion; invitado: Invitado; calendarTemplateUrl: string }) {
  const cfg = input.fiesta.configuracion || {};
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <h2 style="color:#b91c1c;margin-bottom:8px">Estas invitado</h2>
      <p>Hola ${escapeHtml(input.invitado.nombre)}, te compartimos la fecha del evento.</p>
      <ul>
        <li><strong>Evento:</strong> ${escapeHtml(getFiestaTitle(input.fiesta))}</li>
        ${cfg.nombreLugar ? `<li><strong>Lugar:</strong> ${escapeHtml(cfg.nombreLugar)}</li>` : ''}
        ${cfg.direccionLugar ? `<li><strong>Direccion:</strong> ${escapeHtml(cfg.direccionLugar)}</li>` : ''}
      </ul>
      <p><a href="${escapeHtml(input.calendarTemplateUrl)}" style="color:#b91c1c;font-weight:bold">Agregar a Google Calendar</a></p>
    </div>
  `;
}

export async function getFiestaCalendarShareLinks(fiestaId: string) {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return { success: false, error: 'Evento no encontrado.' };

  const event = buildClientEventCalendarEvent(fiesta);
  return {
    success: true,
    title: getFiestaTitle(fiesta),
    googleCalendarUrl: buildGoogleCalendarTemplateUrl(event),
  };
}

export async function syncReunionToGoogleWorkspace(
  fiestaId: string,
  reunion: Reunion,
  options: { sendEmails?: boolean; forceEmail?: boolean } = {}
) {
  const [fiesta, records] = await Promise.all([
    getFiestaById(fiestaId),
    readSyncRecords(),
  ]);
  if (!fiesta) return { success: false, error: 'Evento no encontrado.' };

  const warnings: string[] = [];
  const { email: clientEmail, name: clientName } = await resolveClientContact(fiesta);
  const event = buildMeetingCalendarEvent(fiesta, reunion, clientEmail);
  const calendarTemplateUrl = buildGoogleCalendarTemplateUrl(event);
  const { account: companyAccount, warnings: accountWarnings } = await getCompanyGoogleAccountForSend();
  warnings.push(...accountWarnings);

  let record = getRecord(records, fiestaId);
  const meetingIds = record.meetingCalendarEventIds || {};
  const clientEmailLog = record.lastEmailAtByClient || {};

  if (companyAccount) {
    try {
      const result = await upsertGoogleCalendarEvent(companyAccount, event, meetingIds[reunion.id]);
      record = {
        ...record,
        meetingCalendarEventIds: {
          ...meetingIds,
          [reunion.id]: result.id,
        },
      };
    } catch (error: any) {
      warnings.push(`No se pudo sincronizar la reunion con Google Calendar: ${error?.message || String(error)}`);
    }
  }

  const emailKey = `meeting_${reunion.id}`;
  if (options.sendEmails && clientEmail && companyAccount && (!clientEmailLog[emailKey] || options.forceEmail)) {
    const html = buildMeetingEmailHtml({ fiesta, reunion, clientName, calendarTemplateUrl });
    const emailResult = await sendCompanyEmail({
      to: clientEmail,
      subject: `AK Producciones - Reunion ${reunion.titulo || getFiestaTitle(fiesta)}`,
      html,
    });
    warnings.push(...(emailResult.warnings || []));
    if (emailResult.success) {
      record = {
        ...record,
        lastEmailAtByClient: {
          ...clientEmailLog,
          [emailKey]: new Date().toISOString(),
        },
      };
    }
  }

  record = {
    ...record,
    lastSyncedAt: new Date().toISOString(),
    warnings,
    lastError: warnings.length ? warnings.join(' | ') : undefined,
  };
  await writeSyncRecords(upsertRecord(records, record));

  return { success: true, warnings };
}

export async function notifyGuestsWithCalendarLinks(fiestaId: string, options: { forceEmail?: boolean } = {}) {
  await requireAppSession();
  const [fiesta, records] = await Promise.all([getFiestaById(fiestaId), readSyncRecords()]);
  if (!fiesta) return { success: false, error: 'Evento no encontrado.' };

  const { account: companyAccount, warnings } = await getCompanyGoogleAccountForSend();
  let sent = 0;
  let record = getRecord(records, fiestaId);
  const guestEmailLog = record.lastEmailAtByGuest || {};
  const event = buildClientEventCalendarEvent(fiesta);
  const calendarTemplateUrl = buildGoogleCalendarTemplateUrl(event);

  if (!companyAccount) return { success: true, sent, warnings };

  for (const invitado of fiesta.invitados || []) {
    const email = getGuestEmail(invitado);
    if (!email) continue;
    // Al que ya dijo que no va no se le manda una invitacion. Antes se le mandaba
    // igual, con el asunto "Invitacion": la persona habia avisado que no podia ir
    // y recibia el mail como si nadie la hubiera escuchado.
    if (invitado.rsvp === 'Rechazado') continue;
    if (guestEmailLog[invitado.id] && !options.forceEmail) continue;
    const result = await sendCompanyEmail({
      to: email,
      subject: `Invitacion - ${getFiestaTitle(fiesta)}`,
      html: buildGuestInvitationEmailHtml({ fiesta, invitado, calendarTemplateUrl }),
    });
    warnings.push(...(result.warnings || []));
    if (result.success) {
      sent += 1;
      record = {
        ...record,
        lastEmailAtByGuest: {
          ...(record.lastEmailAtByGuest || {}),
          [invitado.id]: new Date().toISOString(),
        },
      };
    }
  }

  record = {
    ...record,
    lastSyncedAt: new Date().toISOString(),
    warnings,
    lastError: warnings.length ? warnings.join(' | ') : undefined,
  };
  await writeSyncRecords(upsertRecord(records, record));
  return { success: true, sent, warnings };
}

export async function notifyClientPaymentSubmitted(fiestaId: string, payment: ClientPaymentNotification) {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return { success: false, error: 'Evento no encontrado.' };

  const { account: companyAccount } = await getCompanyGoogleAccountForSend();
  const { email: clientEmail, name: clientName } = await resolveClientContact(fiesta);
  const warnings: string[] = [];

  if (companyAccount?.email) {
    const companyResult = await sendCompanyEmail({
      to: companyAccount.email,
      subject: `AK Producciones - Pago informado - ${getFiestaTitle(fiesta)}`,
      html: buildCompanyPaymentSubmittedEmailHtml({ fiesta, payment }),
    });
    warnings.push(...(companyResult.warnings || []));
  }

  if (clientEmail) {
    const clientResult = await sendCompanyEmail({
      to: clientEmail,
      subject: 'AK Producciones - Recibimos tu aviso de pago',
      html: buildClientPaymentEmailHtml({ fiesta, payment, status: 'recibido', clientName }),
    });
    warnings.push(...(clientResult.warnings || []));
  }

  return { success: true, warnings };
}

export async function notifyClientPaymentApproved(fiestaId: string, payment: ClientPaymentNotification) {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return { success: false, error: 'Evento no encontrado.' };

  const { email, name } = await resolveClientContact(fiesta);
  return sendCompanyEmail({
    to: email,
    subject: 'AK Producciones - Pago confirmado',
    html: buildClientPaymentEmailHtml({ fiesta, payment, status: 'aprobado', clientName: name }),
  });
}

export async function notifyClientPaymentRejected(fiestaId: string, payment: ClientPaymentNotification) {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return { success: false, error: 'Evento no encontrado.' };

  const { email, name } = await resolveClientContact(fiesta);
  return sendCompanyEmail({
    to: email,
    subject: 'AK Producciones - Revisemos tu pago',
    html: buildClientPaymentEmailHtml({ fiesta, payment, status: 'rechazado', clientName: name }),
  });
}

export async function notifyContractSignedToClient(
  fiestaId: string,
  input: { signerName?: string; method: 'digital' | 'physical' }
) {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return { success: false, error: 'Evento no encontrado.' };

  const { email, name } = await resolveClientContact(fiesta);
  const event = buildClientEventCalendarEvent(fiesta);
  return sendCompanyEmail({
    to: email,
    subject: 'AK Producciones - Evento confirmado',
    html: buildContractSignedEmailHtml({
      fiesta,
      clientName: name,
      signerName: input.signerName,
      method: input.method,
      calendarTemplateUrl: buildGoogleCalendarTemplateUrl(event),
    }),
  });
}

export async function notifyPresupuestoPaymentRegistered(presupuestoId: string, pago: PagoCliente) {
  await requireAppSession();
  const presupuesto = await getPresupuestoById(presupuestoId);
  if (!presupuesto) return { success: false, error: 'Presupuesto no encontrado.' };

  const fiestas = await getFiestas(false);
  const fiesta = fiestas.find((item) => item.presupuestoId === presupuestoId);
  if (!fiesta) {
    const email = normalizeEmailCandidate(presupuesto.clienteContacto);
    return sendCompanyEmail({
      to: email,
      subject: 'AK Producciones - Pago confirmado',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
          <h2 style="color:#b91c1c;margin-bottom:8px">Pago confirmado</h2>
          <p>Hola ${escapeHtml(presupuesto.clienteNombre)}, registramos tu pago.</p>
          <ul>
            <li><strong>Monto:</strong> $${escapeHtml(pago.monto.toLocaleString('es-UY'))}</li>
            <li><strong>Metodo:</strong> ${escapeHtml(pago.metodoPago)}</li>
          </ul>
        </div>
      `,
    });
  }

  return notifyClientPaymentApproved(fiesta.id, {
    id: pago.id,
    monto: pago.monto,
    estado: 'aprobado',
    timestamp: pago.fecha,
    notas: pago.referencia,
  });
}

/**
 * Le manda al cliente la clave de su portal al correo que tenemos registrado.
 *
 * Es la salida para cuando se la olvida. A proposito NO se devuelve la clave en
 * la respuesta ni se dice si el correo existe: quien pide la recuperacion es
 * cualquiera que abra el portal, asi que la clave viaja solo al correo del
 * cliente y en pantalla queda apenas una pista de a donde se mando.
 */
export async function notifyClientPortalKeyRecovery(fiestaId: string) {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return { success: false as const, error: 'Evento no encontrado.' };

  const clave = String(fiesta.clientPortalSettings?.accessKey ?? '').trim();
  if (!clave) return { success: false as const, error: 'Este portal todavia no tiene clave.' };

  const { email: clientEmail, name: clientName } = await resolveClientContact(fiesta);
  if (!clientEmail) return { success: false as const, error: 'sin-correo' };

  const result = await sendCompanyEmail({
    to: clientEmail,
    subject: `AK Producciones - Tu clave del portal - ${getFiestaTitle(fiesta)}`,
    html: `
      <div style="font-family:Arial,sans-serif;font-size:15px;color:#111">
        <p>Hola ${clientName || ''},</p>
        <p>Nos pediste la clave de tu portal de <strong>${getFiestaTitle(fiesta)}</strong>. Es esta:</p>
        <p style="font-size:22px;font-weight:bold;letter-spacing:1px">${clave}</p>
        <p>Si no fuiste vos quien la pidio, avisanos y te la cambiamos.</p>
        <p>AK Producciones Eventos · Salto, Uruguay · 098 355 530</p>
      </div>
    `,
  });

  if (!result.success) {
    return { success: false as const, error: 'no-se-pudo-enviar', warnings: result.warnings };
  }
  return { success: true as const, email: clientEmail };
}
