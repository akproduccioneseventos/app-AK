import { BACKUP_COLLECTIONS, findMissingBackupFiles, getBackupValueCount, isBackupMetadataFile, isRestorableDataFile, isSafeTopLevelJsonFile } from '@/lib/backup/backup-registry';
import { buildBackupReadinessReport } from '@/lib/backup/backup-health';

describe('backup registry', () => {
  it('includes core event files', () => {
    const files = BACKUP_COLLECTIONS.map(collection => collection.file);
    expect(files).toContain('fiestas.json');
    expect(files).toContain('archive.json');
    expect(files).toContain('presupuestos.json');
  });

  it('accepts safe top level json files only', () => {
    expect(isSafeTopLevelJsonFile('social-posts.json')).toBe(true);
    expect(isSafeTopLevelJsonFile('../secret.json')).toBe(false);
    expect(isSafeTopLevelJsonFile('_metadata.json')).toBe(false);
    expect(isSafeTopLevelJsonFile('nested/file.json')).toBe(false);
  });

  it('detects backup metadata files', () => {
    expect(isBackupMetadataFile('_backup-metadata.json')).toBe(true);
    expect(isBackupMetadataFile('_backup-readiness.json')).toBe(true);
    expect(isBackupMetadataFile('fiestas.json')).toBe(false);
  });

  it('allows known and safe restore files', () => {
    expect(isRestorableDataFile('fiestas.json')).toBe(true);
    expect(isRestorableDataFile('fiestas/fiesta_confirmada.json')).toBe(true);
    expect(isRestorableDataFile('archive/fiesta_archivada.json')).toBe(true);
    expect(isRestorableDataFile('new-module.json')).toBe(true);
    expect(isRestorableDataFile('unknown/fiesta.json')).toBe(false);
    expect(isRestorableDataFile('../new-module.json')).toBe(false);
  });

  it('finds missing required backup files', () => {
    expect(findMissingBackupFiles(['fiestas.json', 'missing-module.json'])).toEqual(['missing-module.json']);
  });

  it('builds a ready report for critical modules', () => {
    const report = buildBackupReadinessReport(new Date('2026-05-04T00:00:00.000Z'));
    expect(report.ready).toBe(true);
    expect(report.totalFiles).toBe(BACKUP_COLLECTIONS.length);
    expect(report.areas.length).toBeGreaterThan(0);
    expect(report.areas.every(area => area.ready)).toBe(true);
  });

  it('counts backup values for summaries', () => {
    expect(getBackupValueCount([1, 2])).toBe(2);
    expect(getBackupValueCount({ a: 1, b: 2 })).toBe(2);
    expect(getBackupValueCount(null)).toBe(0);
  });
});
