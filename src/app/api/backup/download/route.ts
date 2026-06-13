export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { readData } from '@/lib/data-service';
import { BACKUP_COLLECTIONS } from '@/lib/backup/backup-registry';
import { buildBackupReadinessReport } from '@/lib/backup/backup-health';
import * as logger from '@/lib/logger';

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
    const { verifySession } = await import('@/lib/auth/session-token');
    const auth = await verifySession();
    if (!auth.success) {
      return new NextResponse(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const zip = new JSZip();
    const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
    let source: 'firestore' | 'local' = 'local';
    const appVersion = process.env.npm_package_version || '0.1.0';

    let exportedCount = 0;
    const exportedFiles: string[] = [];
    for (const collection of BACKUP_COLLECTIONS) {
      try {
        let data: any = null;
        if (isProduction) {
          data = await readFromFirestoreDirect(collection.file);
          if (data !== null) source = 'firestore';
        }
        if (data === null) data = await readData(collection.file, collection.defaultValue);
        zip.file(collection.file, JSON.stringify(data, null, 2));
        exportedFiles.push(collection.file);
        exportedCount++;
      } catch (err) {
        logger.warn(`[Backup] Could not export ${collection.file}:`, err);
      }
    }

    const readiness = buildBackupReadinessReport();
    const metadata = {
      exportedAt: new Date().toISOString(),
      source,
      version: appVersion,
      app: 'AK Producciones',
      collections: exportedCount,
      exportedFiles,
      readyForCriticalModules: readiness.ready,
    };
    zip.file('_backup-metadata.json', JSON.stringify(metadata, null, 2));
    zip.file('_backup-readiness.json', JSON.stringify(readiness, null, 2));
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
    return new NextResponse(JSON.stringify({ error: 'Failed to create backup.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
