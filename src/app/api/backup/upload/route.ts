import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { writeData } from '@/lib/data-service';
import * as logger from '@/lib/logger';

// Known JSON data files that can be restored
const RESTORABLE_COLLECTIONS = new Set([
  'presupuestos.json',
  'customers.json',
  'servicios-empresa.json',
  'fiestas.json',
  'invoices.json',
  'empleados.json',
  'proveedores.json',
  'crm-leads.json',
  'crm-stages.json',
  'crm-meetings.json',
  'notifications.json',
  'scheduled-messages.json',
  'app-settings.json',
  'company-info.json',
  'contract-settings.json',
  'whatsapp-settings.json',
  'whatsapp-templates.json',
  'feature-flags.json',
  'galeria-publica.json',
  'menus.json',
  'coupons.json',
  'ai-assistant-settings.json',
  'armado-rapido-config.json',
  'budget-display-settings.json',
  'social-connections.json',
  'accesos-personal.json',
  'invoice-template-settings.json',
  'ai-assistant-config.json',
  'compras.json',
  'cupones.json',
]);

/** Try to write a collection directly to Firestore via sync module. Returns true on success. */
async function writeToFirestoreDirect(filePath: string, data: any): Promise<boolean> {
  try {
    const { syncToFirestore } = await import('@/lib/firebase-sync');
    await syncToFirestore(filePath, data);
    return true;
  } catch {
    return false;
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

    // Validate basic structure
    const fileNames = Object.keys(zip.files).filter(name => !zip.files[name].dir);
    const jsonFiles = fileNames.filter(name => name.endsWith('.json') && name !== '_metadata.json' && name !== '_backup-metadata.json');
    
    if (jsonFiles.length === 0) {
      return NextResponse.json({ error: 'El archivo ZIP no contiene datos válidos para restaurar.' }, { status: 400 });
    }

    const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
    const summary: Record<string, number> = {};
    const errors: string[] = [];

    for (const fileName of jsonFiles) {
      // Security check: only restore known collections
      if (!RESTORABLE_COLLECTIONS.has(fileName)) {
        logger.warn(`[Backup] Skipping unknown file in restore: ${fileName}`);
        continue;
      }

      try {
        const content = await zip.files[fileName].async('string');
        const data = JSON.parse(content);

        // In production, try direct Firestore write first (uses batched writes internally)
        let written = false;
        if (isProduction) {
          written = await writeToFirestoreDirect(fileName, data);
        }
        if (!written) {
          await writeData(fileName, data);
        }
        
        const count = Array.isArray(data) ? data.length : 1;
        const label = fileName.replace('.json', '');
        summary[label] = count;
      } catch (err: any) {
        logger.error(`[Backup] Error restoring ${fileName}:`, err.message || err);
        errors.push(fileName);
      }
    }

    const summaryParts = Object.entries(summary)
      .map(([key, count]) => `${count} ${key}`)
      .join(', ');
    
    const message = errors.length > 0
      ? `Backup parcialmente restaurado: ${summaryParts}. Errores en: ${errors.join(', ')}.`
      : `Backup restaurado correctamente: ${summaryParts}.`;

    logger.info(`[Backup] Restore completed at ${new Date().toISOString()}: ${summaryParts}`);

    return NextResponse.json({ success: true, message, summary, errors });

  } catch (error: any) {
    logger.error('[Backup] Error restoring backup:', error.message || error);
    return NextResponse.json({ error: 'Fallo al restaurar el backup.', details: error.message }, { status: 500 });
  }
}
