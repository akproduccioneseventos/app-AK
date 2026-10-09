// @ts-nocheck -- Evidence copied to tests/e2e in the guarded temporary workspace.
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildAkDemoFiesta } from '../../src/lib/experience-ak/demo-fiesta-factory';
import type { AccesoPersonal } from '../../src/types/acceso-personal';
import type { FiestaEnPlanificacion } from '../../src/types/fiesta';
import {
  borrarFiesta,
  guardarFiesta,
  leerFiesta,
} from './helpers/fiesta-de-prueba';

const CWD = process.cwd();
const REQUIRED_TEMP_CWD = path.join(os.tmpdir(), 'ak-entorno-aislado-SkNAHJ');
if (
  process.env.AK_ENTORNO_AISLADO !== 'true' ||
  path.basename(CWD) !== 'ak-entorno-aislado-SkNAHJ' ||
  path.resolve(CWD) !== path.resolve(REQUIRED_TEMP_CWD)
) {
  throw new Error('Sonda A84 bloqueada: requiere cwd TEMP\\ak-entorno-aislado-SkNAHJ y AK_ENTORNO_AISLADO=true.');
}

const PREFIX = `e2e_a84_${process.pid}_${Date.now()}`;
const EMPLOYEE_ID = `${PREFIX}_objetivo`;
const OTHER_EMPLOYEE_ID = `${PREFIX}_companero`;
const REJECTION_REASON = 'Compromiso previo de prueba A84';
const ACCESS_FILES = [
  path.join(process.cwd(), 'data', 'accesos-personal.json'),
  path.join(process.cwd(), 'src', 'data', 'accesos-personal.json'),
];

type Fixture = {
  fiestaId: string;
  tokenId: string;
  employeeId: string;
  otherEmployeeId: string;
};

function crearFixture(suffix: string): Fixture {
  return {
    fiestaId: `${PREFIX}_${suffix}`,
    tokenId: `${PREFIX}_${suffix}_token`,
    employeeId: EMPLOYEE_ID,
    otherEmployeeId: OTHER_EMPLOYEE_ID,
  };
}

function crearFiesta(fixture: Fixture): FiestaEnPlanificacion {
  const base = buildAkDemoFiesta('tecnologia-total');
  return {
    ...base,
    id: fixture.fiestaId,
    personalAsignado: [
      {
        empleadoId: fixture.employeeId,
        rolId: 'a84-rol-objetivo',
        eventSalary: 0,
        asistenciaConfirmada: undefined,
        fechaConfirmacionAsistencia: undefined,
        motivoRechazoAsistencia: undefined,
        checkInTimestamp: undefined,
      },
      {
        empleadoId: fixture.otherEmployeeId,
        rolId: 'a84-rol-companero',
        eventSalary: 0,
        asistenciaConfirmada: false,
        fechaConfirmacionAsistencia: '2026-10-01T12:00:00.000Z',
        motivoRechazoAsistencia: 'Dato previo del compañero',
        checkInTimestamp: '2026-10-01T12:05:00.000Z',
      },
    ],
  } as FiestaEnPlanificacion;
}

function leerAccesos(file: string): AccesoPersonal[] {
  if (!fs.existsSync(file)) return [];
  const parsed: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(parsed)) throw new Error(`Formato inválido en ${file}; no se alteró el archivo.`);
  return parsed as AccesoPersonal[];
}

function escribirAccesos(file: string, access: AccesoPersonal[]) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(access, null, 2)}\n`);
}

function conservarAccesosDePrueba(fixture: Fixture, vencido: boolean) {
  const access: AccesoPersonal = {
    id: fixture.tokenId,
    nombreAcceso: `Personal A84 ${fixture.employeeId}`,
    fiestaId: fixture.fiestaId,
    empleadoId: fixture.employeeId,
    permisos: ['itinerario'],
    fechaCreacion: new Date().toISOString(),
    ...(vencido ? { fechaVencimiento: '2020-01-01T00:00:00.000Z' } : {}),
  };
  const snapshots = ACCESS_FILES.map((file) => ({
    file,
    existed: fs.existsSync(file),
    contents: fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : undefined,
  }));
  try {
    for (const file of ACCESS_FILES) {
      const previous = leerAccesos(file).filter((item) => item.id !== fixture.tokenId);
      escribirAccesos(file, [...previous, access]);
    }
  } catch (error) {
    for (const snapshot of snapshots) {
      if (snapshot.existed && snapshot.contents !== undefined) fs.writeFileSync(snapshot.file, snapshot.contents);
      else if (fs.existsSync(snapshot.file)) fs.unlinkSync(snapshot.file);
    }
    throw error;
  }

  return () => {
    for (const snapshot of snapshots) {
      const current = leerAccesos(snapshot.file).filter((item) => item.id !== fixture.tokenId);
      const previous = snapshot.existed && snapshot.contents
        ? JSON.parse(snapshot.contents) as AccesoPersonal[]
        : [];
      const priorOwned = previous.find((item) => item.id === fixture.tokenId);
      const restored = priorOwned ? [...current, priorOwned] : current;
      if (restored.length || snapshot.existed) escribirAccesos(snapshot.file, restored);
      else if (fs.existsSync(snapshot.file)) fs.unlinkSync(snapshot.file);
    }
  };
}

async function withFixture<T>(
  fixture: Fixture,
  vencido: boolean,
  run: () => Promise<T>,
) {
  guardarFiesta(crearFiesta(fixture));
  const restaurarAccesos = conservarAccesosDePrueba(fixture, vencido);
  try {
    return await run();
  } finally {
    try {
      await restaurarAccesos();
    } finally {
      borrarFiesta(fixture.fiestaId);
    }
  }
}

function observar(page: Page) {
  const logs: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') logs.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => logs.push(`pageerror: ${error.message}`));
  return logs;
}

async function adjuntarEvidencia(page: Page, testInfo: TestInfo, logs: string[]) {
  if (!page.isClosed()) {
    await testInfo.attach('portal-personal.png', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    }).catch(() => undefined);
  }
  if (testInfo.status !== testInfo.expectedStatus) {
    await testInfo.attach('errores-navegador.txt', {
      body: Buffer.from(logs.join('\n') || 'Sin errores de consola ni excepciones de página.'),
      contentType: 'text/plain',
    });
  }
}

test.describe('Sonda A84: portal público de personal', () => {
  test('confirma asistencia y registra llegada solo para la persona enlazada, también tras recargar', async ({ page, context, baseURL }, testInfo) => {
    test.setTimeout(60_000);
    const fixture = crearFixture('llegada');
    const logs = observar(page);

    try {
      await withFixture(fixture, false, async () => {
        const origin = new URL(baseURL!).origin;
        await context.grantPermissions(['geolocation'], { origin });
        await context.setGeolocation({ latitude: -34.9011, longitude: -56.1645 });
        await page.goto(`${baseURL}/acceso-personal/${fixture.tokenId}`);
        const cookies = await context.cookies(origin);
        expect(cookies.some((cookie) => ['ak_session', 'ak_portal_session'].includes(cookie.name))).toBe(false);
        await expect(page.getByRole('button', { name: 'Confirmar que voy' })).toBeVisible();
        await page.getByRole('button', { name: 'Confirmar que voy' }).click();
        await expect(page.getByText('Asistencia Confirmada', { exact: true })).toBeVisible();

        await page.getByRole('button', { name: 'Llegué' }).click();
        await expect(page.getByText('Llegada confirmada correctamente.')).toBeVisible();

        const saved = leerFiesta(fixture.fiestaId);
        const target = saved.personalAsignado.find((person: { empleadoId: string }) => person.empleadoId === fixture.employeeId);
        const other = saved.personalAsignado.find((person: { empleadoId: string }) => person.empleadoId === fixture.otherEmployeeId);
        expect(target.asistenciaConfirmada).toBe(true);
        expect(target.fechaConfirmacionAsistencia).toBeTruthy();
        expect(target.checkInTimestamp).toBeTruthy();
        expect(other).toEqual({
          empleadoId: fixture.otherEmployeeId,
          rolId: 'a84-rol-companero',
          eventSalary: 0,
          asistenciaConfirmada: false,
          fechaConfirmacionAsistencia: '2026-10-01T12:00:00.000Z',
          motivoRechazoAsistencia: 'Dato previo del compañero',
          checkInTimestamp: '2026-10-01T12:05:00.000Z',
        });

        await page.reload();
        await expect(page.getByText('Asistencia Confirmada', { exact: true })).toBeVisible();
        await expect(page.getByText('Llegada registrada:')).toBeVisible();
        await expect(page.getByText('Llegada confirmada correctamente.')).toBeVisible();
        const reloaded = leerFiesta(fixture.fiestaId);
        expect(reloaded.personalAsignado.find((person: { empleadoId: string }) => person.empleadoId === fixture.employeeId).checkInTimestamp).toBe(target.checkInTimestamp);
        expect(reloaded.personalAsignado.find((person: { empleadoId: string }) => person.empleadoId === fixture.otherEmployeeId)).toEqual(other);
      });
    } finally {
      await adjuntarEvidencia(page, testInfo, logs);
    }
  });

  test('guarda y vuelve a mostrar el motivo de rechazo tras recargar', async ({ page, baseURL }, testInfo) => {
    test.setTimeout(60_000);
    const fixture = crearFixture('rechazo');
    const logs = observar(page);

    try {
      await withFixture(fixture, false, async () => {
        await page.goto(`${baseURL}/acceso-personal/${fixture.tokenId}`);
        await page.getByRole('button', { name: 'No puedo ir' }).click();
        await page.getByLabel('Motivo o comentario para el encargado (opcional)').fill(REJECTION_REASON);
        await page.getByRole('button', { name: 'Enviar aviso' }).click();
        await expect(page.getByText(`Motivo registrado: "${REJECTION_REASON}".`, { exact: false })).toBeVisible();

        const saved = leerFiesta(fixture.fiestaId);
        const target = saved.personalAsignado.find((person: { empleadoId: string }) => person.empleadoId === fixture.employeeId);
        const other = saved.personalAsignado.find((person: { empleadoId: string }) => person.empleadoId === fixture.otherEmployeeId);
        expect(target.asistenciaConfirmada).toBe(false);
        expect(target.motivoRechazoAsistencia).toBe(REJECTION_REASON);
        expect(target.fechaConfirmacionAsistencia).toBeTruthy();

        await page.reload();
        await expect(page.getByText(`Motivo registrado: "${REJECTION_REASON}".`, { exact: false })).toBeVisible();
        const reloaded = leerFiesta(fixture.fiestaId);
        expect(reloaded.personalAsignado.find((person: { empleadoId: string }) => person.empleadoId === fixture.employeeId).motivoRechazoAsistencia).toBe(REJECTION_REASON);
        expect(reloaded.personalAsignado.find((person: { empleadoId: string }) => person.empleadoId === fixture.otherEmployeeId)).toEqual(other);
      });
    } finally {
      await adjuntarEvidencia(page, testInfo, logs);
    }
  });

  test('un enlace vencido niega el portal y no modifica ninguna asignación', async ({ page, baseURL }, testInfo) => {
    test.setTimeout(60_000);
    const fixture = crearFixture('vencido');
    const logs = observar(page);

    try {
      await withFixture(fixture, true, async () => {
        const before = leerFiesta(fixture.fiestaId);
        await page.goto(`${baseURL}/acceso-personal/${fixture.tokenId}`);
        await expect(page.locator('p').filter({ hasText: 'El enlace de acceso no es válido, ha expirado o ha sido revocado.' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Confirmar que voy' })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Llegué' })).toHaveCount(0);
        expect(leerFiesta(fixture.fiestaId)).toEqual(before);
      });
    } finally {
      await adjuntarEvidencia(page, testInfo, logs);
    }
  });

  test('revocar el enlace con la pantalla abierta rechaza confirmar y llegar sin guardar', async ({ page, baseURL }, testInfo) => {
    test.setTimeout(60_000);
    const fixture = crearFixture('revocado');
    const logs = observar(page);
    try {
      await withFixture(fixture, false, async () => {
        const origin = new URL(baseURL!).origin;
        await page.context().grantPermissions(['geolocation'], { origin });
        await page.context().setGeolocation({ latitude: -34.9011, longitude: -56.1645 });
        await page.goto(`${baseURL}/acceso-personal/${fixture.tokenId}`);
        const confirmar = page.getByRole('button', { name: 'Confirmar que voy', exact: true });
        const llegar = page.getByRole('button', { name: 'Llegué', exact: true });
        await expect(confirmar).toBeVisible();
        const before = leerFiesta(fixture.fiestaId);
        for (const file of ACCESS_FILES) {
          escribirAccesos(file, leerAccesos(file).filter((item) => item.id !== fixture.tokenId));
        }
        await confirmar.click();
        await expect(page.getByText('Acceso no válido o sin evento asociado.', { exact: true })).toBeVisible();
        await expect(confirmar).toBeEnabled();
        expect(leerFiesta(fixture.fiestaId)).toEqual(before);
        await llegar.click();
        await expect(page.getByText('No pudimos registrar tu llegada', { exact: true })).toBeVisible();
        await expect(llegar).toBeEnabled();
        expect(leerFiesta(fixture.fiestaId)).toEqual(before);
        await expect(page.getByText('Asistencia Confirmada', { exact: true })).toHaveCount(0);
        await expect(page.getByText('Llegada confirmada correctamente.', { exact: true })).toHaveCount(0);
      });
    } finally {
      await adjuntarEvidencia(page, testInfo, logs);
    }
  });
});
