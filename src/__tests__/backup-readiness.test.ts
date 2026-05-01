import { checkBackupReadiness, summarizeBackupCollections } from '@/lib/backup/backup-readiness';

describe('checkBackupReadiness', () => {
  it('allows restore when required collections exist', () => {
    const result = checkBackupReadiness({
      fiestas: 2,
      presupuestos: 5,
      customers: 4,
      'crm-leads': 1,
      settings: 1,
      roles: 1,
      'payment-plans': 2,
    });

    expect(result.canRestore).toBe(true);
    expect(result.severity).toBe('ok');
  });

  it('blocks restore when fiestas are missing', () => {
    const result = checkBackupReadiness({
      presupuestos: 5,
      customers: 4,
    });

    expect(result.canRestore).toBe(false);
    expect(result.missingCollections).toContain('fiestas');
  });

  it('summarizes duplicate entries', () => {
    const summary = summarizeBackupCollections([
      { collection: 'fiestas', count: 1 },
      { collection: 'fiestas', count: 2 },
    ]);

    expect(summary.fiestas).toBe(3);
  });
});
