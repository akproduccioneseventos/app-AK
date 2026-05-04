import { BACKUP_COLLECTIONS, findMissingBackupFiles, getRegisteredBackupFiles } from './backup-registry';

export type BackupReadinessArea = {
  id: string;
  title: string;
  simpleGoal: string;
  requiredFiles: string[];
};

export type BackupReadinessAreaResult = BackupReadinessArea & {
  missingFiles: string[];
  ready: boolean;
};

export type BackupReadinessReport = {
  generatedAt: string;
  totalFiles: number;
  ready: boolean;
  registeredFiles: string[];
  areas: BackupReadinessAreaResult[];
};

export const BACKUP_READINESS_AREAS: BackupReadinessArea[] = [
  {
    id: 'core-eventos',
    title: 'Eventos y planificador',
    simpleGoal: 'Fiestas activas, historicas y archivo quedan dentro del backup.',
    requiredFiles: ['fiestas.json', 'archive.json', 'fiestas-historicas.json', 'historial-fiestas.json'],
  },
  {
    id: 'cliente',
    title: 'Modulo cliente',
    simpleGoal: 'Portal, contrato, tareas, documentos y ajustes visibles del cliente quedan cubiertos.',
    requiredFiles: ['contract-settings.json', 'contract-template.json', 'contract-templates.json', 'task-templates.json', 'app-settings.json', 'company-info.json'],
  },
  {
    id: 'contable',
    title: 'Contable y presupuestos',
    simpleGoal: 'Presupuestos, facturas, ajustes de precio y cupones quedan respaldados.',
    requiredFiles: ['presupuestos.json', 'invoices.json', 'price-adjustments-history.json', 'coupons.json', 'cupones.json', 'cupones-usage.json'],
  },
  {
    id: 'social-fiesta',
    title: 'Social Fiesta e invitaciones',
    simpleGoal: 'Invitaciones, muro social, galeria, fotos y testimonios quedan dentro del ZIP.',
    requiredFiles: ['social-posts.json', 'social-connections.json', 'invitacion-configs.json', 'invitacion-digital-templates.json', 'galeria-publica.json', 'catalogo-fotos.json', 'feedback.json', 'testimonials.json'],
  },
  {
    id: 'comercial',
    title: 'Comercial y CRM',
    simpleGoal: 'Leads, reuniones, etapas, marketing, catalogo y promociones quedan guardados.',
    requiredFiles: ['crm-leads.json', 'crm-stages.json', 'crm-meetings.json', 'marketing-templates.json', 'marketing-checklist.json', 'catalogo-settings.json', 'landing-settings.json', 'promos.json'],
  },
  {
    id: 'operacion-ak',
    title: 'Operacion AK',
    simpleGoal: 'Empleados, proveedores, insumos, alertas, aprobaciones e incidentes quedan respaldados.',
    requiredFiles: ['empleados.json', 'proveedores.json', 'insumos.json', 'notifications.json', 'scheduled-messages.json', 'automatizaciones-alertas.json', 'aprobaciones.json', 'incidentes.json', 'audit-logs.json'],
  },
];

export function buildBackupReadinessReport(date: Date = new Date()): BackupReadinessReport {
  const registeredFiles = getRegisteredBackupFiles();
  const areas = BACKUP_READINESS_AREAS.map((area) => {
    const missingFiles = findMissingBackupFiles(area.requiredFiles);
    return {
      ...area,
      missingFiles,
      ready: missingFiles.length === 0,
    };
  });

  return {
    generatedAt: date.toISOString(),
    totalFiles: BACKUP_COLLECTIONS.length,
    ready: areas.every((area) => area.ready),
    registeredFiles,
    areas,
  };
}
