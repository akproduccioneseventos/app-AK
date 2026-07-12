'use server';

import { getEmpleados } from '@/app/actions/empleados';
import { getFiestaById, getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { getRoles } from '@/app/actions/roles';
import { readData, writeData } from '@/lib/data-service';
import {
  accountFromToken,
  buildCompanyCalendarEvent,
  buildEmployeeCalendarEvent,
  buildGoogleCalendarTemplateUrl,
  buildStaffEmailHtml,
  ensureFreshGoogleAccount,
  getEmployeeEmail,
  getFiestaTimes,
  getFiestaTitle,
  getGoogleRedirectUri,
  getGoogleUserEmail,
  getMissingGoogleConfig,
  getRoleName,
  sendGoogleGmailMessage,
  upsertGoogleCalendarEvent,
  findExistingGoogleCalendarEvent,
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
import { requireAppSession } from '@/lib/auth/require-session';

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
  await requireAppSession();
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
  const [accounts, records, empleados, fiestas] = await Promise.all([
    readAccounts(),
    readSyncRecords(),
    getEmpleados(),
    getFiestas(false),
  ]);
  const company = accounts.find((account) => account.kind === 'company');
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
  };
}

export async function syncFiestaToGoogleWorkspace(
  fiestaId: string,
  options: GoogleWorkspaceSyncOptions = {}
): Promise<{ success: boolean; warnings?: string[]; error?: string }> {
  const missingConfig = getMissingGoogleConfig(process.env.NEXT_PUBLIC_APP_URL);
  if (missingConfig.length > 0) {
    return { success: true, warnings: [`Google Workspace no esta configurado: ${missingConfig.join(', ')}`] };
  }

  const [fiesta, empleados, roles, accounts, records] = await Promise.all([
    getFiestaById(fiestaId),
    getEmpleados(),
    getRoles(),
    readAccounts(),
    readSyncRecords(),
  ]);

  if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };
  if (!fiesta.configuracion?.fechaEvento) {
    return { success: true, warnings: ['La fiesta no tiene fecha; no se sincronizo con Google.'] };
  }

  let nextAccounts = accounts;
  let record = getRecord(records, fiestaId);
  const warnings: string[] = [];
  const assignments = getAssignmentRows(fiesta, empleados, roles);
  const now = new Date().toISOString();
  const companyAccount = accounts.find((account) => account.kind === 'company');
  const freshCompany = await freshConnectedAccount(companyAccount);

  if (freshCompany) {
    nextAccounts = upsertAccount(nextAccounts, freshCompany);
  }

  if (freshCompany?.status === 'connected') {
    try {
      const companyEvent = buildCompanyCalendarEvent(fiesta, assignments);

      let existingCompanyEventId = record.companyCalendarEventId;
      if (!existingCompanyEventId && fiesta.configuracion?.fechaEvento) {
        const dateStr = new Date(fiesta.configuracion.fechaEvento).toISOString().split('T')[0];
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
          const dateStr = new Date(fiesta.configuracion.fechaEvento).toISOString().split('T')[0];
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
