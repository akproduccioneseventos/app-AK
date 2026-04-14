
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
  { file: 'ai-assistant-settings.json', defaultValue: {} },
];

/** Try to read a collection directly from Firestore via Admin SDK. Returns null on failure. */
async function readFromFirestoreDirect(filePath: string): Promise<any | null> {
  try {
    const { readFromFirestore } = await import('@/lib/firebase-sync');
    return await readFromFirestore(filePath);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const zip = new JSZip();

    const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
    let source: 'firestore' | 'local' = 'local';

    // Read package.json version (best-effort)
    let appVersion = '0.1.0';
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pkg = require('../../../../package.json') as { version?: string };
      appVersion = pkg.version || appVersion;
    } catch { /* ignore */ }

    // Read each collection — in production, try Firestore directly first
    let exportedCount = 0;
    for (const collection of DATA_COLLECTIONS) {
      try {
        let data: any = null;
        if (isProduction) {
          data = await readFromFirestoreDirect(collection.file);
          if (data !== null) source = 'firestore';
        }
        if (data === null) {
          data = await readData(collection.file, collection.defaultValue);
        }
        zip.file(collection.file, JSON.stringify(data, null, 2));
        exportedCount++;
      } catch (err) {
        logger.warn(`[Backup] Could not export ${collection.file}:`, err);
      }
    }

    // Add metadata
    const metadata = {
      exportedAt: new Date().toISOString(),
      source,
      version: appVersion,
      app: 'AK Producciones',
    };
    zip.file('_backup-metadata.json', JSON.stringify(metadata, null, 2));

    logger.info(`[Backup] Export completed: ${exportedCount} collections exported (source: ${source}) at ${metadata.exportedAt}`);

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
