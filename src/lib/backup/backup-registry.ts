export interface BackupCollection {
  file: string;
  defaultValue: any;
}

export const BACKUP_COLLECTIONS: BackupCollection[] = [
  { file: 'presupuestos.json', defaultValue: [] },
  { file: 'customers.json', defaultValue: [] },
  { file: 'servicios-empresa.json', defaultValue: [] },
  { file: 'fiestas.json', defaultValue: [] },
  { file: 'archive.json', defaultValue: [] },
  { file: 'invoices.json', defaultValue: [] },
  { file: 'empleados.json', defaultValue: [] },
  { file: 'proveedores.json', defaultValue: [] },
  { file: 'crm-leads.json', defaultValue: [] },
  { file: 'crm-stages.json', defaultValue: [] },
  { file: 'crm-meetings.json', defaultValue: [] },
  { file: 'notifications.json', defaultValue: [] },
  { file: 'scheduled-messages.json', defaultValue: [] },
  { file: 'app-settings.json', defaultValue: {} },
  { file: 'company-info.json', defaultValue: {} },
  { file: 'contract-settings.json', defaultValue: {} },
  { file: 'contract-template.json', defaultValue: {} },
  { file: 'contract-templates.json', defaultValue: [] },
  { file: 'whatsapp-settings.json', defaultValue: {} },
  { file: 'whatsapp-templates.json', defaultValue: {} },
  { file: 'whatsapp-config.json', defaultValue: {} },
  { file: 'whatsapp-conversations.json', defaultValue: [] },
  { file: 'feature-flags.json', defaultValue: [] },
  { file: 'galeria-publica.json', defaultValue: [] },
  { file: 'menus.json', defaultValue: [] },
  { file: 'menus-catering.json', defaultValue: [] },
  { file: 'reposteria-template.json', defaultValue: {} },
  { file: 'bebidas-template.json', defaultValue: {} },
  { file: 'carga-operativa-master-template.json', defaultValue: {} },
  { file: 'carga-operativa-templates.json', defaultValue: [] },
  { file: 'meeting-checklist-template.json', defaultValue: {} },
  { file: 'insumos.json', defaultValue: [] },
  { file: 'coupons.json', defaultValue: [] },
  { file: 'cupones.json', defaultValue: [] },
  { file: 'cupones-usage.json', defaultValue: [] },
  { file: 'ai-assistant-settings.json', defaultValue: {} },
  { file: 'armado-rapido-config.json', defaultValue: {} },
  { file: 'budget-display-settings.json', defaultValue: {} },
  { file: 'invoice-template-settings.json', defaultValue: {} },
  { file: 'social-connections.json', defaultValue: [] },
  { file: 'social-posts.json', defaultValue: [] },
  { file: 'accesos-personal.json', defaultValue: [] },
  { file: 'automatizaciones-alertas.json', defaultValue: [] },
  { file: 'alertas-leidas.json', defaultValue: [] },
  { file: 'alertas-descartadas.json', defaultValue: [] },
  { file: 'prioridades-descartadas.json', defaultValue: [] },
  { file: 'playbooks.json', defaultValue: [] },
  { file: 'playbook-aplicaciones.json', defaultValue: [] },
  { file: 'recursos-multi-evento.json', defaultValue: [] },
  { file: 'roles.json', defaultValue: [] },
  { file: 'gastos-generales.json', defaultValue: [] },
  { file: 'activos-fijos.json', defaultValue: [] },
  { file: 'catalogo-fotos.json', defaultValue: [] },
  { file: 'deco-canvas-templates.json', defaultValue: [] },
  { file: 'feedback.json', defaultValue: [] },
  { file: 'testimonials.json', defaultValue: [] },
  { file: 'fiestas-historicas.json', defaultValue: [] },
  { file: 'historial-fiestas.json', defaultValue: [] },
  { file: 'invitacion-digital-templates.json', defaultValue: [] },
  { file: 'invitacion-configs.json', defaultValue: [] },
  { file: 'itinerary-templates.json', defaultValue: [] },
  { file: 'price-adjustments-history.json', defaultValue: [] },
  { file: 'salon-layout-templates.json', defaultValue: [] },
  { file: 'task-templates.json', defaultValue: [] },
  { file: 'carta-tragos-master.json', defaultValue: {} },
  { file: 'presentacion-led-settings.json', defaultValue: {} },
  { file: 'catalogo-settings.json', defaultValue: {} },
  { file: 'landing-settings.json', defaultValue: {} },
  { file: 'marketing-templates.json', defaultValue: [] },
  { file: 'marketing-checklist.json', defaultValue: [] },
  { file: 'salones.json', defaultValue: [] },
  { file: 'promos.json', defaultValue: [] },
  { file: 'proveedor-portal.json', defaultValue: {} },
  { file: 'audit-logs.json', defaultValue: [] },
  { file: 'aprobaciones.json', defaultValue: [] },
  { file: 'incidentes.json', defaultValue: [] },
  { file: 'personal-recibos.json', defaultValue: [] },
];

export const BACKUP_METADATA_FILES = new Set([
  '_metadata.json',
  '_backup-metadata.json',
  '_backup-readiness.json',
]);

export const RESTORABLE_BACKUP_FILES = new Set(BACKUP_COLLECTIONS.map((collection) => collection.file));

export function normalizeBackupFileName(fileName: string): string {
  return fileName.replace(/\\/g, '/').trim();
}

export function isBackupMetadataFile(fileName: string): boolean {
  return BACKUP_METADATA_FILES.has(normalizeBackupFileName(fileName));
}

export function isSafeTopLevelJsonFile(fileName: string): boolean {
  const normalized = normalizeBackupFileName(fileName);
  return /^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(normalized) && !normalized.startsWith('_');
}

export function isRestorableDataFile(fileName: string): boolean {
  const normalized = normalizeBackupFileName(fileName);
  return RESTORABLE_BACKUP_FILES.has(normalized) || isSafeTopLevelJsonFile(normalized);
}

export function getBackupValueCount(value: any): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.keys(value).length || 1;
  return value == null ? 0 : 1;
}

export function getRegisteredBackupFiles(): string[] {
  return BACKUP_COLLECTIONS.map((collection) => collection.file);
}

export function findMissingBackupFiles(requiredFiles: string[]): string[] {
  const registered = new Set(getRegisteredBackupFiles());
  return requiredFiles.map(normalizeBackupFileName).filter((file) => !registered.has(file));
}
