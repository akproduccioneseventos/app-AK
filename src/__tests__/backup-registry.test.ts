import { BACKUP_COLLECTIONS, getBackupValueCount, isRestorableDataFile, isSafeTopLevelJsonFile } from '@/lib/backup/backup-registry';

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

  it('allows known and safe restore files', () => {
    expect(isRestorableDataFile('fiestas.json')).toBe(true);
    expect(isRestorableDataFile('new-module.json')).toBe(true);
    expect(isRestorableDataFile('../new-module.json')).toBe(false);
  });

  it('counts backup values for summaries', () => {
    expect(getBackupValueCount([1, 2])).toBe(2);
    expect(getBackupValueCount({ a: 1, b: 2 })).toBe(2);
    expect(getBackupValueCount(null)).toBe(0);
  });
});
