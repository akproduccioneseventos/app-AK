import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';
import * as logger from '@/lib/logger';

const dataDirectory = path.join(process.cwd(), 'src', 'data');

// Mapping from firebase-sync.ts
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

async function restoreToFirestore(zip: JSZip): Promise<{ restored: number; errors: string[] }> {
  let restored = 0;
  const errors: string[] = [];

  try {
    const { dbAdmin } = await import('@/lib/firebase/server');
    if (!dbAdmin) return { restored: 0, errors: ['Firestore no disponible.'] };

    // Restore array collections
    for (const [fileName, collectionName] of Object.entries(FILE_TO_COLLECTION)) {
      const zipFile = zip.file(fileName);
      if (!zipFile) continue;
      try {
        const content = await zipFile.async('text');
        const data = JSON.parse(content);
        if (!Array.isArray(data)) continue;
        const batchSize = 450;
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = dbAdmin.batch();
          const chunk = data.slice(i, i + batchSize);
          for (const item of chunk) {
            if (item && item.id) {
              const ref = dbAdmin.collection(collectionName).doc(String(item.id));
              batch.set(ref, { ...item, _syncedAt: new Date().toISOString() }, { merge: true });
            }
          }
          await batch.commit();
        }
        restored++;
      } catch (e) {
        errors.push(`Error restaurando "${collectionName}": ${e instanceof Error ? e.message : e}`);
      }
    }

    // Restore config documents
    for (const [fileName, docId] of Object.entries(CONFIG_FILES)) {
      const zipFile = zip.file(fileName);
      if (!zipFile) continue;
      try {
        const content = await zipFile.async('text');
        const data = JSON.parse(content);
        if (typeof data !== 'object' || Array.isArray(data)) continue;
        await dbAdmin.collection('configuracion').doc(docId).set({
          ...data,
          _syncedAt: new Date().toISOString(),
        }, { merge: true });
        restored++;
      } catch (e) {
        errors.push(`Error restaurando config "${docId}": ${e instanceof Error ? e.message : e}`);
      }
    }

    // Restore individual fiesta documents
    const fiestasFolder = zip.folder('fiestas');
    if (fiestasFolder) {
      const fiestaFiles: Array<{ name: string; entry: JSZip.JSZipObject }> = [];
      fiestasFolder.forEach((relativePath, entry) => {
        if (!entry.dir && relativePath.endsWith('.json')) {
          fiestaFiles.push({ name: relativePath.replace('.json', ''), entry });
        }
      });
      for (const { name, entry } of fiestaFiles) {
        try {
          const content = await entry.async('text');
          const data = JSON.parse(content);
          await dbAdmin.collection('fiestas').doc(name).set({
            ...data,
            _syncedAt: new Date().toISOString(),
          }, { merge: true });
          restored++;
        } catch (e) {
          errors.push(`Error restaurando fiesta "${name}": ${e instanceof Error ? e.message : e}`);
        }
      }
    }

    return { restored, errors };
  } catch (e: any) {
    return { restored, errors: [...errors, `Error general: ${e.message}`] };
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('backupFile') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se ha subido ningún archivo.' }, { status: 400 });
    }

    if (file.type !== 'application/zip') {
      return NextResponse.json({ error: 'El archivo debe ser de tipo .zip.' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const zip = await JSZip.loadAsync(fileBuffer);

    const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

    if (isProduction) {
      // In production: restore to Firestore
      const { restored, errors } = await restoreToFirestore(zip);
      logger.info(`[AK] Backup restore: ${restored} colecciones restauradas en Firestore.`);
      if (errors.length > 0) {
        logger.warn('[AK] Backup restore errores:', errors.join('; '));
      }
      return NextResponse.json({
        success: true,
        message: `Backup restaurado en Firestore: ${restored} colecciones procesadas.${errors.length > 0 ? ` (${errors.length} errores menores)` : ''}`,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    // In development: restore to local filesystem
    await fs.rm(dataDirectory, { recursive: true, force: true });
    await fs.mkdir(dataDirectory, { recursive: true });

    const writeFilePromises: Promise<void>[] = [];

    zip.forEach((relativePath, zipEntry) => {
      if (relativePath === '_backup-metadata.json') return; // Skip metadata

      const resolvedPath = path.resolve(dataDirectory, relativePath);
      if (!resolvedPath.startsWith(path.resolve(dataDirectory))) {
        logger.warn(`[AK] Backup restore: entrada potencialmente maliciosa omitida: ${relativePath}`);
        return;
      }

      if (!zipEntry.dir) {
        const writePromise = zipEntry.async('nodebuffer').then(async (content) => {
          const dirName = path.dirname(resolvedPath);
          await fs.mkdir(dirName, { recursive: true });
          await fs.writeFile(resolvedPath, content);
        });
        writeFilePromises.push(writePromise);
      }
    });

    await Promise.all(writeFilePromises);

    logger.info('[AK] Backup restore: restaurado correctamente en filesystem local.');
    return NextResponse.json({ success: true, message: 'Backup restaurado correctamente.' });

  } catch (error: any) {
    logger.error('[AK] Backup restore: error:', error.message);
    return NextResponse.json({ error: 'Fallo al restaurar el backup.', details: error.message }, { status: 500 });
  }
}
