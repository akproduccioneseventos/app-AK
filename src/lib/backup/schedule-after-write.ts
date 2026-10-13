import * as logger from '@/lib/logger';

export async function scheduleAutoBackupAfterWrite(file: string, options?: { skipAutoBackup?: boolean }): Promise<void> {
  if (options?.skipAutoBackup || file === '_backup-snapshots.json') return;
  const backupTask = Promise.all([
    import('@/app/actions/backup'),
    import('./internal-token'),
  ]).then(([{ triggerAutoBackup }, { AUTO_BACKUP_INTERNAL_TOKEN }]) =>
    triggerAutoBackup(AUTO_BACKUP_INTERNAL_TOKEN),
  ).catch(error => logger.warn('[data-service] Auto-backup trigger failed:', error));
  try {
    const nextServer = await import('next/server');
    if (typeof nextServer.after === 'function') {
      nextServer.after(backupTask);
      return;
    }
  } catch (error) {
    logger.warn('[data-service] Post-response context unavailable for auto-backup:', error);
  }
  void backupTask;
}
