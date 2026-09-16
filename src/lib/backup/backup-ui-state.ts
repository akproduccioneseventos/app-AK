import type { AutoBackupStatus } from '@/app/actions/backup';

export type BackupUIState = 'cargando' | 'no_se_pudo_saber' | 'sin_respaldo_reciente' | 'activo_y_protegido';

export function resolveBackupUIState(params: {
  isLoading: boolean;
  backupStatus: AutoBackupStatus | null;
  statusLoadError?: boolean;
}): BackupUIState {
  if (params.isLoading) return 'cargando';
  if (params.statusLoadError || !params.backupStatus) return 'no_se_pudo_saber';
  if (params.backupStatus.isStale || params.backupStatus.hasRepeatedErrors) return 'sin_respaldo_reciente';
  return 'activo_y_protegido';
}
