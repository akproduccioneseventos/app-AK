import fs from 'node:fs';
import path from 'node:path';
import { resolveBackupUIState, type BackupUIState } from '@/lib/backup/backup-ui-state';
import type { AutoBackupStatus } from '@/app/actions/backup';

describe('Cartel de respaldos - Cuatro estados explicitos sin falsos positivos verdes', () => {
  const pageFilePath = path.join(process.cwd(), 'src/app/(app)/settings/backup/page.tsx');
  const pageSource = fs.readFileSync(pageFilePath, 'utf8');

  it('el codigo real de la pagina contiene los 4 estados y nunca pone en verde el estado desconocido', () => {
    // Verificar que existe el estado desconocido en ambar y nunca en verde
    expect(pageSource).toContain('ESTADO DESCONOCIDO: NO SE PUDO SABER');
    expect(pageSource).toContain('AVERIGUANDO ESTADO...');
    expect(pageSource).toContain('ATENCIÓN: SIN RESPALDO RECIENTE');
    expect(pageSource).toContain('ACTIVO Y PROTEGIDO');

    // Verificar que el estado desconocido usa bg-amber-600 y no bg-emerald-600
    expect(pageSource).toMatch(/bg-amber-600[^>]*>[\s\S]*?ESTADO DESCONOCIDO: NO SE PUDO SABER/);

    // No debe haber un ternario ingenuo backupStatus?.isStale ? ... : 'ACTIVO Y PROTEGIDO'
    expect(pageSource).not.toMatch(/backupStatus\?\.isStale\s*\?\s*['"]ATENCI[OÓ]N:\s*SIN\s*RESPALDO\s*RECIENTE['"]\s*:\s*['"]ACTIVO\s*Y\s*PROTEGIDO['"]/);
  });

  it('estado 1: mientras esta cargando devuelve "cargando" (ambar/spinner, nunca verde)', () => {
    const state: BackupUIState = resolveBackupUIState({
      isLoading: true,
      backupStatus: null,
      statusLoadError: false,
    });
    expect(state).toBe('cargando');
  });

  it('estado 2: si no se pudo saber (error o null sin cargar) devuelve "no_se_pudo_saber" (ambar, nunca verde)', () => {
    // Caso 1: statusLoadError true
    const stateError = resolveBackupUIState({
      isLoading: false,
      backupStatus: null,
      statusLoadError: true,
    });
    expect(stateError).toBe('no_se_pudo_saber');

    // Caso 2: backupStatus es null aunque statusLoadError sea false
    const stateNull = resolveBackupUIState({
      isLoading: false,
      backupStatus: null,
      statusLoadError: false,
    });
    expect(stateNull).toBe('no_se_pudo_saber');
  });

  it('estado 3: si esta desactualizado o con fallas repetidas devuelve "sin_respaldo_reciente" (rojo)', () => {
    const staleStatus: AutoBackupStatus = {
      lastSuccessfulBackup: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      lastAttemptAt: new Date().toISOString(),
      lastError: null,
      consecutiveFailures: 0,
      isStale: true,
      hasRepeatedErrors: false,
    };
    const stateStale = resolveBackupUIState({
      isLoading: false,
      backupStatus: staleStatus,
      statusLoadError: false,
    });
    expect(stateStale).toBe('sin_respaldo_reciente');

    const repeatedErrorStatus: AutoBackupStatus = {
      lastSuccessfulBackup: new Date().toISOString(),
      lastAttemptAt: new Date().toISOString(),
      lastError: 'Connection refused',
      consecutiveFailures: 3,
      isStale: false,
      hasRepeatedErrors: true,
    };
    const stateError = resolveBackupUIState({
      isLoading: false,
      backupStatus: repeatedErrorStatus,
      statusLoadError: false,
    });
    expect(stateError).toBe('sin_respaldo_reciente');
  });

  it('estado 4: solo devuelve "activo_y_protegido" (verde) cuando esta confirmado y al dia', () => {
    const healthyStatus: AutoBackupStatus = {
      lastSuccessfulBackup: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      lastAttemptAt: new Date().toISOString(),
      lastError: null,
      consecutiveFailures: 0,
      isStale: false,
      hasRepeatedErrors: false,
    };
    const stateHealthy = resolveBackupUIState({
      isLoading: false,
      backupStatus: healthyStatus,
      statusLoadError: false,
    });
    expect(stateHealthy).toBe('activo_y_protegido');
  });
});
