import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { writeData } from '@/lib/data-service';
import { getBackupValueCount, isRestorableDataFile } from '@/lib/backup/backup-registry';
import * as logger from '@/lib/logger';

const VALID_ZIP_TYPES = new Set(['application/zip', 'application/x-zip', 'application/x-zip-compressed', 'application/octet-stream', 'application/x-compressed']);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('backupFile') as File | null;

    if (!file) return NextResponse.json({ error: 'No se ha subido ningun archivo.' }, { status: 400 });
    if (!VALID_ZIP_TYPES.has(file.type) && !file.name.toLowerCase().endsWith('.zip')) return NextResponse.json({ error: 'El archivo debe ser de tipo .zip.' }, { status: 400 });

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const zip = await JSZip.loadAsync(fileBuffer);
    const fileNames = Object.keys(zip.files).filter(name => !zip.files[name].dir);
    const jsonFiles = fileNames.filter(name => name.endsWith('.json') && name !== '_metadata.json' && name !== '_backup-metadata.json');
    if (jsonFiles.length === 0) return NextResponse.json({ error: 'El archivo ZIP no contiene datos validos para restaurar.' }, { status: 400 });

    const summary: Record<string, number> = {};
    const errors: string[] = [];

    for (const fileName of jsonFiles) {
      if (!isRestorableDataFile(fileName)) {
        logger.warn(`[Backup] Skipping unknown file in restore: ${fileName}`);
        continue;
      }
      try {
        const content = await zip.files[fileName].async('string');
        const data = JSON.parse(content);
        await writeData(fileName, data);
        summary[fileName.replace('.json', '')] = getBackupValueCount(data);
      } catch (err: any) {
        logger.error(`[Backup] Error restoring ${fileName}:`, err.message || err);
        errors.push(fileName);
      }
    }

    const summaryParts = Object.entries(summary).map(([key, count]) => `${count} ${key}`).join(', ');
    const message = errors.length > 0 ? `Backup parcialmente restaurado: ${summaryParts}. Errores en: ${errors.join(', ')}.` : `Backup restaurado correctamente: ${summaryParts}.`;
    logger.info(`[Backup] Restore completed at ${new Date().toISOString()}: ${summaryParts}`);
    return NextResponse.json({ success: true, message, summary, errors });
  } catch (error: any) {
    logger.error('[Backup] Error restoring backup:', error.message || error);
    return NextResponse.json({ error: 'Fallo al restaurar el backup.', details: error.message }, { status: 500 });
  }
}
