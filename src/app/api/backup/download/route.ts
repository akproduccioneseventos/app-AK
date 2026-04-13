
import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { readData } from '@/lib/data-service';
import * as logger from '@/lib/logger';

// Data collections to export
const DATA_COLLECTIONS = [
  { file: 'presupuestos.json', defaultValue: [] },
  { file: 'customers.json', defaultValue: [] },
  { file: 'servicios-empresa.json', defaultValue: [] },
  { file: 'fiestas.json', defaultValue: [] },
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
  { file: 'whatsapp-settings.json', defaultValue: {} },
  { file: 'whatsapp-templates.json', defaultValue: {} },
  { file: 'feature-flags.json', defaultValue: [] },
  { file: 'galeria-publica.json', defaultValue: [] },
  { file: 'menus.json', defaultValue: [] },
  { file: 'coupons.json', defaultValue: [] },
];

export async function GET() {
  try {
    const zip = new JSZip();

    // Add metadata
    const metadata = {
      exportedAt: new Date().toISOString(),
      source: 'firestore',
      version: '1.0',
      app: 'AK Producciones',
    };
    zip.file('_metadata.json', JSON.stringify(metadata, null, 2));

    // Read each collection from the data layer (Firestore in production, local in dev)
    let exportedCount = 0;
    for (const collection of DATA_COLLECTIONS) {
      try {
        const data = await readData(collection.file, collection.defaultValue);
        zip.file(collection.file, JSON.stringify(data, null, 2));
        exportedCount++;
      } catch (err) {
        logger.warn(`[Backup] Could not export ${collection.file}:`, err);
      }
    }

    logger.info(`[Backup] Export completed: ${exportedCount} collections exported at ${metadata.exportedAt}`);

    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ak-producciones-backup-${timestamp}.zip`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return new NextResponse(zipContent as BodyInit, { status: 200, headers });

  } catch (error: any) {
    logger.error('[Backup] Error creating backup:', error.message || error);
    return new NextResponse(JSON.stringify({ error: 'Failed to create backup.' }), { status: 500 });
  }
}
