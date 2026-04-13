import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';
import * as logger from '@/lib/logger';

const dataDirectory = path.join(process.cwd(), 'src', 'data');

// Mapping from firebase-sync.ts — mirrors the collection mappings
const FILE_TO_COLLECTION: Record<string, string> = {
  'customers.json': 'clientes',
  'servicios-empresa.json': 'servicios',
  'empleados.json': 'empleados',
  'proveedores.json': 'proveedores',
  'presupuestos.json': 'presupuestos',
  'crm-leads.json': 'prospectos',
  'invoices.json': 'facturas',
  'roles.json': 'roles',
  'gastos-generales.json': 'gastos_generales',
  'activos-fijos.json': 'activos_fijos',
  'notifications.json': 'notificaciones',
  'insumos.json': 'insumos',
  'crm-stages.json': 'crm_stages',
  'fiestas-historicas.json': 'fiestas_historicas',
  'menus-catering.json': 'menus_catering',
  'price-adjustments-history.json': 'price_adjustments',
  'feedback.json': 'feedback',
  'historial-fiestas.json': 'historial_fiestas',
  'invitacion-digital-templates.json': 'invitacion_digital_templates',
  'itinerary-templates.json': 'itinerary_templates',
  'salon-layout-templates.json': 'salon_layout_templates',
  'social-connections.json': 'social_connections',
  'social-posts.json': 'social_posts',
  'task-templates.json': 'task_templates',
  'testimonials.json': 'testimonials',
  'accesos-personal.json': 'accesos_personal',
  'cupones.json': 'cupones',
  'cupones-usage.json': 'cupones_usage',
  'catalogo-fotos.json': 'catalogo_fotos',
};

const CONFIG_FILES: Record<string, string> = {
  'company-info.json': 'company-info',
  'budget-display-settings.json': 'budget-display-settings',
  'invoice-template-settings.json': 'invoice-template-settings',
  'armado-rapido-config.json': 'armado-rapido-config',
  'bebidas-template.json': 'bebidas-template',
  'reposteria-template.json': 'reposteria-template',
  'carga-operativa-master-template.json': 'carga-operativa-master-template',
  'carga-operativa-templates.json': 'carga-operativa-templates',
  'meeting-checklist-template.json': 'meeting-checklist-template',
};

async function exportFromFirestore(zip: JSZip): Promise<boolean> {
  try {
    const { dbAdmin } = await import('@/lib/firebase/server');
    if (!dbAdmin) return false;

    // Export array collections
    for (const [fileName, collectionName] of Object.entries(FILE_TO_COLLECTION)) {
      try {
        const snapshot = await dbAdmin.collection(collectionName).get();
        if (!snapshot.empty) {
          const data = snapshot.docs.map(doc => {
            const d = doc.data();
            delete d._syncedAt;
            return d;
          });
          zip.file(fileName, JSON.stringify(data, null, 2));
        }
      } catch (e) {
        logger.warn(`[AK] Backup: no se pudo exportar colección "${collectionName}": ${e instanceof Error ? e.message : e}`);
      }
    }

    // Export config documents
    for (const [fileName, docId] of Object.entries(CONFIG_FILES)) {
      try {
        const doc = await dbAdmin.collection('configuracion').doc(docId).get();
        if (doc.exists) {
          const data = doc.data();
          if (data) {
            delete data._syncedAt;
            zip.file(fileName, JSON.stringify(data, null, 2));
          }
        }
      } catch (e) {
        logger.warn(`[AK] Backup: no se pudo exportar config "${docId}": ${e instanceof Error ? e.message : e}`);
      }
    }

    // Export individual fiesta documents
    try {
      const fiestasSnapshot = await dbAdmin.collection('fiestas').get();
      if (!fiestasSnapshot.empty) {
        const fiestasFolder = zip.folder('fiestas');
        if (fiestasFolder) {
          for (const doc of fiestasSnapshot.docs) {
            const data = doc.data();
            delete data._syncedAt;
            fiestasFolder.file(`${doc.id}.json`, JSON.stringify(data, null, 2));
          }
        }
      }
    } catch (e) {
      logger.warn(`[AK] Backup: no se pudo exportar fiestas: ${e instanceof Error ? e.message : e}`);
    }

    return true;
  } catch {
    return false;
  }
}

async function addFilesToZip(zip: JSZip, directoryPath: string, parentPath: string) {
  try {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'backups' || entry.name === '_backups') continue;
        const folder = zip.folder(entry.name);
        if (folder) {
          await addFilesToZip(folder, fullPath, path.join(parentPath, entry.name));
        }
      } else {
        const fileContent = await fs.readFile(fullPath);
        zip.file(entry.name, fileContent);
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

export async function GET() {
  try {
    const zip = new JSZip();
    const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

    // Add metadata
    const pkgVersion = require('../../../../package.json').version || '0.1.0';
    zip.file('_backup-metadata.json', JSON.stringify({
      createdAt: new Date().toISOString(),
      source: isProduction ? 'firestore' : 'local',
      appVersion: pkgVersion,
      environment: isProduction ? 'production' : 'development',
    }, null, 2));

    let usedFirestore = false;

    if (isProduction) {
      usedFirestore = await exportFromFirestore(zip);
      if (!usedFirestore) {
        logger.warn('[AK] Backup: Firestore no disponible en producción, intentando fallback local...');
      }
    }

    if (!usedFirestore) {
      // Fallback: read from local data directory
      try {
        await fs.access(dataDirectory);
      } catch {
        return new NextResponse(JSON.stringify({ error: 'No se encontraron datos para exportar.' }), { status: 404 });
      }

      const entries = await fs.readdir(dataDirectory, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name === 'backups' || entry.name === '_backups') continue;
        const fullPath = path.join(dataDirectory, entry.name);
        if (entry.isDirectory()) {
          const folder = zip.folder(entry.name);
          if (folder) {
            await addFilesToZip(folder, fullPath, entry.name);
          }
        } else {
          const fileContent = await fs.readFile(fullPath);
          zip.file(entry.name, fileContent);
        }
      }
    }

    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ak-producciones-backup-${timestamp}.zip`;

    logger.info(`[AK] Backup: exportado correctamente (${isProduction ? 'Firestore' : 'local'}) — ${filename}`);

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return new NextResponse(zipContent as BodyInit, { status: 200, headers });
  } catch (error: any) {
    logger.error('[AK] Backup: error creando backup:', error.message);
    return new NextResponse(JSON.stringify({ error: 'Error al crear el backup.', details: error.message }), { status: 500 });
  }
}
