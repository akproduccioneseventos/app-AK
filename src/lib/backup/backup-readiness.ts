export type BackupCollectionSummary = Record<string, number | undefined>;

export type BackupReadinessResult = {
  canRestore: boolean;
  severity: 'ok' | 'warning' | 'blocked';
  missingCollections: string[];
  warnings: string[];
};

const REQUIRED_COLLECTIONS = ['fiestas', 'presupuestos', 'customers'];
const IMPORTANT_COLLECTIONS = ['crm-leads', 'settings', 'roles', 'payment-plans'];

export function checkBackupReadiness(collections: BackupCollectionSummary): BackupReadinessResult {
  const missingCollections: string[] = [];
  const warnings: string[] = [];

  for (const name of REQUIRED_COLLECTIONS) {
    if ((collections[name] ?? 0) <= 0) {
      missingCollections.push(name);
    }
  }

  for (const name of IMPORTANT_COLLECTIONS) {
    if (collections[name] === undefined) {
      warnings.push(`No se encontro la coleccion ${name}.`);
    }
  }

  const totalItems = Object.values(collections).reduce((sum, value) => sum + Math.max(0, value ?? 0), 0);
  if (totalItems === 0) {
    warnings.push('El backup no contiene datos.');
  }

  const canRestore = missingCollections.length === 0 && totalItems > 0;
  const severity = !canRestore ? 'blocked' : warnings.length > 0 ? 'warning' : 'ok';

  return {
    canRestore,
    severity,
    missingCollections,
    warnings,
  };
}

export function summarizeBackupCollections(entries: Array<{ collection: string; count: number }>): BackupCollectionSummary {
  return entries.reduce<BackupCollectionSummary>((summary, entry) => {
    summary[entry.collection] = (summary[entry.collection] ?? 0) + Math.max(0, entry.count);
    return summary;
  }, {});
}
