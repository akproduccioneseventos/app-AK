'use server';

import { getEmpleados } from '@/app/actions/empleados';
import { getFiestas, getHistorialFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { requireAppSession } from '@/lib/auth/require-session';
import { getRoles } from '@/app/actions/roles';
import { readData, writeData } from '@/lib/data-service';
import { verifySession } from '@/lib/auth/session-token';
import { perfilDe, puede, PERMISOS } from '@/lib/auth/perfiles';
import {
  accountFromToken,
  borrarEventoDeLaAgenda,
  buildCompanyCalendarEvent,
  buildEmployeeCalendarEvent,
  buildGoogleCalendarTemplateUrl,
  buildStaffEmailHtml,
  ensureFreshGoogleAccount,
  getEmployeeEmail,
  getFiestaTimes,
  listarEventosDeAkEnLaAgenda,
  type EventoDeAkEnLaAgenda,
  getFiestaTitle,
  getGoogleRedirectUri,
  getGoogleUserEmail,
  hasGoogleContactsScope,
  getMissingGoogleConfig,
  getRoleName,
  sendGoogleGmailMessage,
  upsertGoogleCalendarEvent,
  findExistingGoogleCalendarEvent,
  hasServiceAccountKey,
  getServiceAccountAccessToken,
  GOOGLE_WORKSPACE_SCOPES,
  type GoogleWorkspaceEventInput,
} from '@/lib/google-workspace';
import type { Empleado } from '@/types/empleado';
import type { FiestaEnPlanificacion, PersonalAsignadoDetalleStorage } from '@/types/fiesta';
import type {
  GoogleTokenResponse,
  GoogleWorkspaceAccount,
  GoogleWorkspaceDashboard,
  GoogleWorkspaceSyncOptions,
  GoogleWorkspaceSyncRecord,
  PublicGoogleWorkspaceAccount,
} from '@/types/google-workspace';
import type { Rol } from '@/types/rol';
import { requirePermiso } from '@/lib/auth/require-session';
import { requireEventPermission } from '@/lib/auth/event-access';

const ACCOUNTS_FILE = '_google-workspace-accounts.json';
const SYNC_FILE = '_google-workspace-sync.json';

function toPublicAccount(account: GoogleWorkspaceAccount): PublicGoogleWorkspaceAccount {
  return {
    id: account.id,
    kind: account.kind,
    employeeId: account.employeeId,
    email: account.email,
    calendarId: account.calendarId,
    connectedAt: account.connectedAt,
    updatedAt: account.updatedAt,
    status: account.status,
    lastError: account.lastError,
  };
}

async function readAccounts() {
  return readData<GoogleWorkspaceAccount[]>(ACCOUNTS_FILE, []);
}

async function writeAccounts(accounts: GoogleWorkspaceAccount[]) {
  await writeData(ACCOUNTS_FILE, accounts);
}

async function readSyncRecords() {
  return readData<GoogleWorkspaceSyncRecord[]>(SYNC_FILE, []);
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

function getAssignmentRows(fiesta: FiestaEnPlanificacion, empleados: Empleado[], roles: Rol[]) {
  return (fiesta.personalAsignado || [])
    .filter((item) => Boolean(item.empleadoId))
    .map((item) => {
      const employee = empleados.find((empleado) => empleado.id === item.empleadoId);
      return {
        item,
        employee,
        roleName: getRoleName(roles, item.rolId),
      };
    });
}

async function freshConnectedAccount(account?: GoogleWorkspaceAccount) {
  if (!account) return undefined;
  const fresh = await ensureFreshGoogleAccount(account);
  if (fresh.status !== 'connected' || !fresh.accessToken) {
    return fresh;
  }
  return fresh;
}

function formatEmployeeEvent(
  fiesta: FiestaEnPlanificacion,
  employee: Empleado,
  roleName: string,
  assignment: PersonalAsignadoDetalleStorage
) {
  const event = buildEmployeeCalendarEvent(fiesta, employee, roleName, assignment);
  const { safeStart } = getFiestaTimes(fiesta);
  return {
    fiestaId: fiesta.id,
    title: getFiestaTitle(fiesta),
    dateTime: safeStart.toISOString(),
    venue: fiesta.configuracion?.nombreLugar || '',
    address: fiesta.configuracion?.direccionLugar || '',
    mapsUrl: fiesta.configuracion?.googleMapsUrl || '',
    guestCount: fiesta.configuracion?.invitadosEstimados || 0,
    roleName,
    salary: assignment.eventSalary || 0,
    calendarTemplateUrl: buildGoogleCalendarTemplateUrl(event),
  };
}

export async function saveGoogleWorkspaceAccountFromOAuth(input: {
  kind: 'company' | 'employee';
  employeeId?: string;
  token: GoogleTokenResponse;
}) {
  const session = await verifySession();
  if (!session.success || !session.user) throw new Error(session.error || 'Sesion no autorizada.');
  const canAdminister = puede(session.user, PERMISOS.ADMINISTRACION);
  if (input.kind === 'company' && !canAdminister) {
    throw new Error('Solo el dueño puede conectar la cuenta corporativa de Google.');
  }
  if (input.kind === 'employee' && !canAdminister) {
    const employee = (await getEmpleados()).find(item => item.id === input.employeeId);
    const sessionEmail = session.user.email?.trim().toLowerCase();
    const isOwnAccount = employee && (
      employee.id === session.user.userId
      || [employee.email, employee.googleWorkspaceEmail]
        .filter(Boolean)
        .some(email => email?.trim().toLowerCase() === sessionEmail)
    );
    if (!isOwnAccount) throw new Error('Solo puedes conectar tu propia cuenta de Google.');
  }
  const accounts = await readAccounts();
  const existing = accounts.find((account) =>
    input.kind === 'company' ? account.kind === 'company' : account.kind === 'employee' && account.employeeId === input.employeeId
  );
  const email = (await getGoogleUserEmail(input.token.access_token).catch(() => undefined)) || existing?.email;
  const account = accountFromToken(input.kind, input.token, {
    existing,
    employeeId: input.employeeId,
    email,
    calendarId: existing?.calendarId || process.env.GOOGLE_WORKSPACE_CALENDAR_ID || 'primary',
  });

  await writeAccounts(upsertAccount(accounts, account));
  return { success: true, account: toPublicAccount(account) };
}

export async function getGoogleWorkspaceDashboard(): Promise<GoogleWorkspaceDashboard> {
  const permiso = await requirePermiso(PERMISOS.ADMINISTRACION);
  if (!permiso.ok) throw new Error(permiso.error);
  const [accounts, records, empleados, fiestas] = await Promise.all([
    readAccounts(),
    readSyncRecords(),
    getEmpleados(),
    getFiestas(false),
  ]);
  let company = accounts.find((account) => account.kind === 'company');
  if (!company && hasServiceAccountKey()) {
    const saToken = await getServiceAccountAccessToken();
    company = {
      id: 'company',
      kind: 'company',
      email: 'akproduccionessalto@gmail.com',
      calendarId: process.env.GOOGLE_WORKSPACE_CALENDAR_ID || 'primary',
      accessToken: saToken || '',
      scope: GOOGLE_WORKSPACE_SCOPES.join(' '),
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      connectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: saToken ? 'connected' : 'needs_reconnect',
    };
  }
  const connectedEmployees = accounts.filter((account) => account.kind === 'employee');
  const datedFiestas = fiestas.filter((fiesta) => Boolean(fiesta.configuracion?.fechaEvento));
  const syncedIds = new Set(records.filter((record) => Boolean(record.lastSyncedAt)).map((record) => record.fiestaId));
  const sortedSyncDates = records
    .map((record) => record.lastSyncedAt)
    .filter((date): date is string => Boolean(date))
    .sort();
  const lastSyncedAt = sortedSyncDates[sortedSyncDates.length - 1];

  return {
    configured: getMissingGoogleConfig(process.env.NEXT_PUBLIC_APP_URL).length === 0,
    missingConfig: getMissingGoogleConfig(process.env.NEXT_PUBLIC_APP_URL),
    redirectUri: getGoogleRedirectUri(process.env.NEXT_PUBLIC_APP_URL),
    companyAccount: company ? toPublicAccount(company) : undefined,
    connectedEmployees: connectedEmployees.map(toPublicAccount),
    employeeCount: empleados.length,
    employeesWithEmail: empleados.filter((empleado) => Boolean(getEmployeeEmail(empleado))).length,
    syncedFiestas: syncedIds.size,
    pendingFiestas: datedFiestas.filter((fiesta) => !syncedIds.has(fiesta.id)).length,
    lastSyncedAt,
    contactsEnabled: hasGoogleContactsScope(company),
  };
}

export async function syncFiestaToGoogleWorkspace(
  fiestaId: string,
  options: GoogleWorkspaceSyncOptions = {}
): Promise<{ success: boolean; warnings?: string[]; error?: string }> {
  let fiesta: Awaited<ReturnType<typeof requireEventPermission>>;
  try {
    fiesta = await requireEventPermission(fiestaId, PERMISOS.ORGANIZACION);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'No puedes sincronizar este evento.' };
  }
  const missingConfig = getMissingGoogleConfig(process.env.NEXT_PUBLIC_APP_URL);
  if (missingConfig.length > 0 && !hasServiceAccountKey()) {
    return { success: true, warnings: [`Google Workspace no esta configurado: ${missingConfig.join(', ')}`] };
  }

  const [empleados, roles, accounts, records] = await Promise.all([
    getEmpleados(),
    getRoles(),
    readAccounts(),
    readSyncRecords(),
  ]);

  if (!fiesta.configuracion?.fechaEvento) {
    return { success: true, warnings: ['La fiesta no tiene fecha; no se sincronizo con Google.'] };
  }

  // Una fecha que no se entiende no se manda a la agenda: antes terminaba
  // creando un evento en el dia de hoy, con el nombre de la fiesta, y ensuciaba
  // el calendario del dueno con un dia que no era ninguno.
  if (!getFiestaTimes(fiesta).fechaValida) {
    return {
      success: true,
      warnings: ['La fecha de la fiesta no se entiende, asi que no se toco la agenda. Revisala en la ficha de la fiesta.'],
    };
  }

  let nextAccounts = accounts;
  let record = getRecord(records, fiestaId);
  const warnings: string[] = [];
  const assignments = getAssignmentRows(fiesta, empleados, roles);
  const now = new Date().toISOString();
  let companyAccount = accounts.find((account) => account.kind === 'company');
  if (!companyAccount && hasServiceAccountKey()) {
    const saToken = await getServiceAccountAccessToken();
    companyAccount = {
      id: 'company',
      kind: 'company',
      email: 'akproduccionessalto@gmail.com',
      calendarId: process.env.GOOGLE_WORKSPACE_CALENDAR_ID || 'primary',
      accessToken: saToken || '',
      scope: GOOGLE_WORKSPACE_SCOPES.join(' '),
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      connectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: saToken ? 'connected' : 'needs_reconnect',
    };
  }
  const freshCompany = await freshConnectedAccount(companyAccount);

  if (freshCompany) {
    nextAccounts = upsertAccount(nextAccounts, freshCompany);
  }

  if (freshCompany?.status === 'connected') {
    try {
      const companyEvent = buildCompanyCalendarEvent(fiesta, assignments);

      let existingCompanyEventId = record.companyCalendarEventId;
      if (!existingCompanyEventId && fiesta.configuracion?.fechaEvento) {
        const dateStr = (fiesta.configuracion.fechaEvento || '').substring(0, 10);
        const queryText = getFiestaTitle(fiesta);
        const foundId = await findExistingGoogleCalendarEvent(freshCompany, dateStr, queryText, fiesta.id, companyEvent);
        if (foundId) {
          existingCompanyEventId = foundId;
        }
      }

      const result = await upsertGoogleCalendarEvent(freshCompany, companyEvent, existingCompanyEventId);
      record = { ...record, companyCalendarEventId: result.id };
    } catch (error: any) {
      warnings.push(`No se pudo actualizar el calendario general de AK: ${error?.message || String(error)}`);
    }
  } else {
    warnings.push('La cuenta Google de AK no esta conectada; no se actualizo el calendario general ni se enviaron mails.');
  }

  for (const assignment of assignments) {
    if (!assignment.employee) continue;
    const employeeAccount = accounts.find(
      (account) => account.kind === 'employee' && account.employeeId === assignment.employee?.id
    );
    const freshEmployee = await freshConnectedAccount(employeeAccount);
    if (freshEmployee) nextAccounts = upsertAccount(nextAccounts, freshEmployee);

    if (freshEmployee?.status === 'connected') {
      try {
        const employeeEvent = buildEmployeeCalendarEvent(fiesta, assignment.employee, assignment.roleName, assignment.item);

        let existingEmployeeEventId = record.employeeCalendarEventIds[assignment.employee.id];
        if (!existingEmployeeEventId && fiesta.configuracion?.fechaEvento) {
          const dateStr = (fiesta.configuracion.fechaEvento || '').substring(0, 10);
          const queryText = `${assignment.roleName} - ${getFiestaTitle(fiesta)}`;
          const foundId = await findExistingGoogleCalendarEvent(freshEmployee, dateStr, queryText, fiesta.id, employeeEvent);
          if (foundId) {
            existingEmployeeEventId = foundId;
          }
        }

        const result = await upsertGoogleCalendarEvent(
          freshEmployee,
          employeeEvent,
          existingEmployeeEventId
        );
        record = {
          ...record,
          employeeCalendarEventIds: {
            ...record.employeeCalendarEventIds,
            [assignment.employee.id]: result.id,
          },
        };
      } catch (error: any) {
        warnings.push(`No se pudo actualizar el calendario de ${assignment.employee.nombre}: ${error?.message || String(error)}`);
      }
    }

    const email = getEmployeeEmail(assignment.employee);
    const alreadySent = Boolean(record.lastEmailAtByEmployee[assignment.employee.id]);
    if (options.sendEmails && email && freshCompany?.status === 'connected' && (!alreadySent || options.forceEmail)) {
      try {
        const html = buildStaffEmailHtml(fiesta, assignment.employee, assignment.roleName, assignment.item);
        await sendGoogleGmailMessage(freshCompany, email, `AK Producciones - ${getFiestaTitle(fiesta)}`, html);
        record = {
          ...record,
          lastEmailAtByEmployee: {
            ...record.lastEmailAtByEmployee,
            [assignment.employee.id]: now,
          },
        };
      } catch (error: any) {
        warnings.push(`No se pudo enviar mail a ${assignment.employee.nombre}: ${error?.message || String(error)}`);
      }
    }
  }

  record = {
    ...record,
    lastSyncedAt: now,
    warnings,
    lastError: warnings.length ? warnings.join(' | ') : undefined,
  };

  await Promise.all([
    writeAccounts(nextAccounts),
    writeSyncRecords(upsertRecord(records, record)),
  ]);

  return { success: true, warnings };
}

export async function syncAllFiestasToGoogleWorkspace() {
  const permiso = await requirePermiso(PERMISOS.ADMINISTRACION);
  if (!permiso.ok) return { success: false, synced: 0, total: 0, warnings: [permiso.error] };
  const fiestas = await getFiestas(false);
  const datedFiestas = fiestas.filter((fiesta) => Boolean(fiesta.configuracion?.fechaEvento));
  let synced = 0;
  const warnings: string[] = [];

  for (const fiesta of datedFiestas) {
    const result = await syncFiestaToGoogleWorkspace(fiesta.id, { reason: 'bulk', sendEmails: false });
    if (result.success) synced += 1;
    if (result.warnings?.length) warnings.push(...result.warnings.map((warning) => `${getFiestaTitle(fiesta)}: ${warning}`));
    if (result.error) warnings.push(`${getFiestaTitle(fiesta)}: ${result.error}`);
  }

  return { success: true, synced, total: datedFiestas.length, warnings };
}

export async function syncFiestaAndNotifyStaff(fiestaId: string) {
  return syncFiestaToGoogleWorkspace(fiestaId, { reason: 'manual', sendEmails: true, forceEmail: true });
}

export async function getEmployeeWorkspacePortal(empleadoId: string) {
  const session = await verifySession();
  if (!session.success || !session.user) {
    return { employee: null, googleAccount: undefined, events: [], error: session.error || 'Sesion no autorizada.' };
  }
  const [empleados, roles, fiestas, accounts] = await Promise.all([
    getEmpleados(),
    getRoles(),
    getFiestas(true),
    readAccounts(),
  ]);
  const employee = empleados.find((item) => item.id === empleadoId) || null;
  if (!employee) {
    return { employee: null, googleAccount: undefined, events: [] };
  }

  const sessionEmail = session.user.email?.trim().toLowerCase();
  const employeeEmails = [employee.email, employee.googleWorkspaceEmail]
    .filter((email): email is string => Boolean(email))
    .map(email => email.trim().toLowerCase());
  const isOwnPortal = perfilDe(session.user) === 'personal'
    && (session.user.userId === empleadoId || Boolean(sessionEmail && employeeEmails.includes(sessionEmail)));
  if (!puede(session.user, PERMISOS.SUELDOS) && !isOwnPortal) {
    return {
      employee: null,
      googleAccount: undefined,
      events: [],
      error: 'Solo puedes consultar tu propio portal de trabajo.',
    };
  }

  const googleAccount = accounts.find((account) => account.kind === 'employee' && account.employeeId === empleadoId);
  const events = fiestas
    .flatMap((fiesta) => {
      const assignments = (fiesta.personalAsignado || []).filter((item) => item.empleadoId === empleadoId);
      return assignments.map((assignment) =>
        formatEmployeeEvent(fiesta, employee, getRoleName(roles, assignment.rolId), assignment)
      );
    })
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  return {
    employee,
    googleAccount: googleAccount ? toPublicAccount(googleAccount) : undefined,
    events,
  };
}

import type { CrmAppointment } from '@/types/crm';

export async function syncAppointmentToGoogleWorkspace(appointment: CrmAppointment): Promise<{
  success: boolean;
  calendarSynced?: boolean;
  emailSentCompany?: boolean;
  emailSentClient?: boolean;
  warnings?: string[];
  error?: string;
}> {
  const permiso = await requirePermiso(PERMISOS.CRM);
  if (!permiso.ok) return { success: false, error: permiso.error };
  try {
    const accounts = await readAccounts();
    const companyAccount = accounts.find((account) => account.kind === 'company');
    const freshCompany = await freshConnectedAccount(companyAccount);

    const warnings: string[] = [];
    let calendarSynced = false;
    let emailSentCompany = false;
    let emailSentClient = false;

    if (!freshCompany || freshCompany.status !== 'connected') {
      return {
        success: true,
        calendarSynced: false,
        warnings: ['Cuenta Google de la empresa no conectada para sync en segundo plano. Podés usar los botones directos de GCal / Gmail.'],
      };
    }

    const clientEmail = appointment.clienteEmail || (appointment.clienteContacto.includes('@') ? appointment.clienteContacto : null);
    const startIso = new Date(appointment.fechaHora).toISOString();
    const endIso = new Date(new Date(appointment.fechaHora).getTime() + 60 * 60 * 1000).toISOString();

    const calendarEventInput: GoogleWorkspaceEventInput = {
      summary: `Entrevista AK Producciones - ${appointment.clienteNombre} (${appointment.eventoTipo || 'Cita Comercial'})`,
      description: `Cita Comercial agendada con ${appointment.clienteNombre}.\nContacto: ${appointment.clienteContacto}\nTipo: ${appointment.eventoTipo || 'Fiesta'}\nLugar: ${appointment.lugar || 'Oficina AK Salto'}\nNotas: ${appointment.notas || 'Sin notas'}`,
      location: appointment.lugar || 'Oficina AK Producciones Salto',
      startIso,
      endIso,
      attendees: clientEmail ? [clientEmail] : undefined,
    };

    try {
      await upsertGoogleCalendarEvent(freshCompany, calendarEventInput);
      calendarSynced = true;
    } catch (err: any) {
      warnings.push(`Google Calendar sync error: ${err?.message || err}`);
    }

    const dateFormatted = new Date(appointment.fechaHora).toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' });
    const timeFormatted = new Date(appointment.fechaHora).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });

    const companyEmailText = `
      <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #059669;">✨ Nueva Cita Comercial Agendada</h2>
        <p>Se ha registrado una nueva entrevista con cliente:</p>
        <ul>
          <li><strong>Cliente:</strong> ${appointment.clienteNombre}</li>
          <li><strong>Contacto:</strong> ${appointment.clienteContacto}</li>
          <li><strong>Tipo de Evento:</strong> ${appointment.eventoTipo || 'Fiesta'}</li>
          <li><strong>Fecha:</strong> ${dateFormatted} a las ${timeFormatted} hs</li>
          <li><strong>Lugar:</strong> ${appointment.lugar || 'Oficina AK Salto'}</li>
          ${appointment.notas ? `<li><strong>Notas:</strong> ${appointment.notas}</li>` : ''}
        </ul>
        <p style="font-size: 12px; color: #64748b;">AK Producciones — Ecosistema Digital</p>
      </div>
    `;

    try {
      const companyEmail = process.env.AUTH_RECOVERY_EMAIL || 'akproduccionessalto@gmail.com';
      await sendGoogleGmailMessage(freshCompany, companyEmail, `✨ Nueva Cita: ${appointment.clienteNombre} (${dateFormatted})`, companyEmailText);
      emailSentCompany = true;
    } catch (err: any) {
      warnings.push(`Gmail error notificando a la empresa: ${err?.message || err}`);
    }

    if (clientEmail) {
      const clientEmailText = `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #059669;">AK Producciones — Confirmación de Cita</h2>
          <p>Hola <strong>${appointment.clienteNombre}</strong>,</p>
          <p>Te confirmamos que tu cita para coordinar tu fiesta ha sido agendada con éxito:</p>
          <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 4px 0;"><strong>📅 Fecha:</strong> ${dateFormatted}</p>
            <p style="margin: 4px 0;"><strong>⏰ Hora:</strong> ${timeFormatted} hs</p>
            <p style="margin: 4px 0;"><strong>📍 Lugar:</strong> ${appointment.lugar || 'Oficina AK Producciones Salto'}</p>
            <p style="margin: 4px 0;"><strong>🎉 Tipo de Celebración:</strong> ${appointment.eventoTipo || 'Evento'}</p>
          </div>
          <p>En esta entrevista repasaremos la propuesta, presupuestos y tecnología para tu gran día.</p>
          <p style="font-size: 13px; color: #64748b; margin-top: 20px;">AK Producciones | WhatsApp: 098 355 530 | Salto, Uruguay</p>
        </div>
      `;
      try {
        await sendGoogleGmailMessage(freshCompany, clientEmail, `Confirmación de Cita — AK Producciones`, clientEmailText);
        emailSentClient = true;
      } catch (err: any) {
        warnings.push(`Gmail error notificando al cliente: ${err?.message || err}`);
      }
    }

    return {
      success: true,
      calendarSynced,
      emailSentCompany,
      emailSentClient,
      warnings,
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error al sincronizar cita con Google' };
  }
}


/**
 * Limpiar la agenda del dueño de lo que ensució la app.
 *
 * Pasó de verdad: al sincronizar, la app **duplicó eventos y dejó fechas que no
 * eran** en su calendario personal. Las causas ya están arregladas, pero lo que
 * quedó sucio no se limpia solo.
 *
 * Esto lo limpia, con tres cuidados que no se negocian:
 *
 * 1. **Sólo toca lo que puso la app.** Los eventos se reconocen por la marca
 *    `AK_FIESTA_ID:` que la app deja en la descripción. Un evento personal del
 *    dueño no tiene esa marca y **no se mira siquiera**.
 * 2. **Primero muestra, después borra.** `revisarAgendaDeAK()` no borra nada:
 *    devuelve la lista para que él la vea. Borrar es otra acción, y sólo borra
 *    los que ella devolvió.
 * 3. **De cada fiesta se queda SIEMPRE uno.** Nunca se borra el último evento de
 *    una fiesta que existe: se conserva el que está en la fecha correcta.
 */


export type EventoSobrante = EventoDeAkEnLaAgenda & {
  motivo: 'duplicado' | 'fecha-vieja' | 'fiesta-borrada';
  explicacion: string;
};

export type RevisionDeAgenda = {
  ok: boolean;
  error?: string;
  revisados: number;
  sobrantes: EventoSobrante[];
};

function soloElDia(valor: string): string {
  return (valor || '').substring(0, 10);
}

export async function revisarAgendaDeAK(): Promise<RevisionDeAgenda> {
  await requireAppSession();

  const cuentas = await readAccounts();
  const cuentaEmpresa = await freshConnectedAccount(cuentas.find((c) => c.kind === 'company'));
  if (!cuentaEmpresa || cuentaEmpresa.status !== 'connected') {
    return {
      ok: false,
      error: 'La cuenta de Google de AK no está conectada, así que no se pudo mirar la agenda.',
      revisados: 0,
      sobrantes: [],
    };
  }

  let eventos: EventoDeAkEnLaAgenda[];
  try {
    eventos = await listarEventosDeAkEnLaAgenda(cuentaEmpresa);
  } catch {
    return {
      ok: false,
      error: 'No se pudo leer la agenda. Probá de nuevo en un rato.',
      revisados: 0,
      sobrantes: [],
    };
  }

  const [activas, historicas] = await Promise.all([getFiestas(false), getHistorialFiestas()]);
  const fechaPorFiesta = new Map<string, string>();
  for (const fiesta of [...activas, ...historicas]) {
    const { safeStart, fechaValida } = getFiestaTimes(fiesta);
    if (fechaValida) fechaPorFiesta.set(fiesta.id, soloElDia(safeStart.toISOString()));
  }

  const porFiesta = new Map<string, EventoDeAkEnLaAgenda[]>();
  for (const evento of eventos) {
    const lista = porFiesta.get(evento.fiestaId) || [];
    lista.push(evento);
    porFiesta.set(evento.fiestaId, lista);
  }

  const sobrantes: EventoSobrante[] = [];

  for (const [fiestaId, delaFiesta] of porFiesta) {
    const fechaBuena = fechaPorFiesta.get(fiestaId);

    // La fiesta ya no existe: todos sus eventos sobran.
    if (!fechaBuena) {
      for (const evento of delaFiesta) {
        sobrantes.push({
          ...evento,
          motivo: 'fiesta-borrada',
          explicacion: 'Quedó en la agenda una fiesta que ya no está en el sistema.',
        });
      }
      continue;
    }

    // Se conserva el que está en la fecha correcta. Si ninguno está en la fecha
    // correcta, se conserva el primero igual: nunca se deja una fiesta sin evento.
    const enLaFechaBuena = delaFiesta.filter((e) => soloElDia(e.cuando) === fechaBuena);
    const sequeda = enLaFechaBuena[0] || delaFiesta[0];

    for (const evento of delaFiesta) {
      if (evento.id === sequeda.id) continue;
      const enFechaBuena = soloElDia(evento.cuando) === fechaBuena;
      sobrantes.push({
        ...evento,
        motivo: enFechaBuena ? 'duplicado' : 'fecha-vieja',
        explicacion: enFechaBuena
          ? 'Está repetido: hay otro igual el mismo día.'
          : `Quedó en una fecha vieja. La fiesta es el ${fechaBuena}.`,
      });
    }
  }

  return { ok: true, revisados: eventos.length, sobrantes };
}

export async function limpiarAgendaDeAK(
  idsABorrar: string[],
): Promise<{ ok: boolean; borrados: number; error?: string }> {
  await requireAppSession();

  if (!Array.isArray(idsABorrar) || idsABorrar.length === 0) {
    return { ok: true, borrados: 0 };
  }

  // Se vuelve a revisar y SÓLO se borra lo que la revisión marcó como sobrante.
  // Así, aunque llegue una lista con otra cosa, no se toca nada que no corresponda.
  const revision = await revisarAgendaDeAK();
  if (!revision.ok) return { ok: false, borrados: 0, error: revision.error };

  const permitidos = new Set(revision.sobrantes.map((s) => s.id));
  const aBorrar = idsABorrar.filter((id) => permitidos.has(id));

  const cuentas = await readAccounts();
  const cuentaEmpresa = await freshConnectedAccount(cuentas.find((c) => c.kind === 'company'));
  if (!cuentaEmpresa || cuentaEmpresa.status !== 'connected') {
    return { ok: false, borrados: 0, error: 'La cuenta de Google de AK no está conectada.' };
  }

  let borrados = 0;
  for (const id of aBorrar) {
    try {
      await borrarEventoDeLaAgenda(cuentaEmpresa, id);
      borrados += 1;
    } catch {
      // Si uno falla se sigue con los demás: es mejor limpiar de a poco que no limpiar.
    }
  }

  return { ok: true, borrados };
}
