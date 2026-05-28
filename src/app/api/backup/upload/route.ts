import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { writeData } from '@/lib/data-service';
import { getBackupValueCount, isBackupMetadataFile, isRestorableDataFile } from '@/lib/backup/backup-registry';
import {
  isConfirmedEventsBundle,
  parseJsonContent,
  restoreConfirmedEventsBundle,
  restoreConfirmedEventsJsonContent,
  summarizeRestoreSummary,
  type RestoreSummary,
} from '@/lib/imports/confirmed-events-restore';
import * as logger from '@/lib/logger';

const VALID_ZIP_TYPES = new Set(['application/zip', 'application/x-zip', 'application/x-zip-compressed', 'application/octet-stream', 'application/x-compressed']);
const VALID_JSON_TYPES = new Set(['application/json', 'text/json', 'application/octet-stream']);

async function restoreJsonFile(file: File) {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.zip')) return null;
  if (!VALID_JSON_TYPES.has(file.type) && !lowerName.endsWith('.json')) {
    return null;
  }

  const raw = Buffer.from(await file.arrayBuffer()).toString('utf8');
  return restoreConfirmedEventsJsonContent(raw, file.name);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('backupFile') as File | null;

    if (!file) return NextResponse.json({ error: 'No se ha subido ningun archivo.' }, { status: 400 });

    const jsonResult = await restoreJsonFile(file);
    if (jsonResult) {
      const message = `Importacion restaurada correctamente: ${summarizeRestoreSummary(jsonResult.summary)}.`;
      logger.info(`[Backup] Confirmed events JSON restore completed at ${new Date().toISOString()}: ${summarizeRestoreSummary(jsonResult.summary)}`);
      return NextResponse.json({ success: true, message, summary: jsonResult.summary, errors: [], skipped: jsonResult.skipped });
    }

    if (!VALID_ZIP_TYPES.has(file.type) && !file.name.toLowerCase().endsWith('.zip')) return NextResponse.json({ error: 'El archivo debe ser de tipo .zip o .json.' }, { status: 400 });

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const zip = await JSZip.loadAsync(fileBuffer);
    const fileNames = Object.keys(zip.files).filter(name => !zip.files[name].dir);
    const jsonFiles = fileNames.filter(name => name.endsWith('.json') && !isBackupMetadataFile(name));
    if (jsonFiles.length === 0) return NextResponse.json({ error: 'El archivo ZIP no contiene datos validos para restaurar.' }, { status: 400 });

    const bundleFileName = jsonFiles.find((fileName) => fileName.toLowerCase().includes('import') || fileName.toLowerCase().includes('confirmad'));
    if (bundleFileName) {
      const content = await zip.files[bundleFileName].async('string');
      const parsed = parseJsonContent(content);
      if (isConfirmedEventsBundle(parsed)) {
        const bundleResult = await restoreConfirmedEventsBundle(parsed, bundleFileName);
        const message = `Importacion restaurada correctamente: ${summarizeRestoreSummary(bundleResult.summary)}.`;
        logger.info(`[Backup] Confirmed events ZIP restore completed at ${new Date().toISOString()}: ${summarizeRestoreSummary(bundleResult.summary)}`);
        return NextResponse.json({ success: true, message, summary: bundleResult.summary, errors: [], skipped: bundleResult.skipped });
      }
    }

    const summary: RestoreSummary = {};
    const errors: string[] = [];
    const skipped: string[] = [];

    for (const fileName of jsonFiles) {
      if (!isRestorableDataFile(fileName)) {
        logger.warn(`[Backup] Skipping unknown file in restore: ${fileName}`);
        skipped.push(fileName);
        continue;
      }
      try {
        const content = await zip.files[fileName].async('string');
        const data = parseJsonContent(content);
        if (fileName === 'fiestas.json' && Array.isArray(data)) {
          for (const fiesta of data) {
            if (!fiesta?.id) continue;
            await writeData(`fiestas/${fiesta.id}.json`, fiesta);
          }
          summary.fiestas = data.filter((fiesta: any) => fiesta?.id).length;
        } else {
          await writeData(fileName, data);
          summary[fileName.replace('.json', '')] = getBackupValueCount(data);
        }
      } catch (err: any) {
        logger.error(`[Backup] Error restoring ${fileName}:`, err.message || err);
        errors.push(fileName);
      }
    }

    const summaryParts = summarizeRestoreSummary(summary);
    const message = errors.length > 0 ? `Backup parcialmente restaurado: ${summaryParts}. Errores en: ${errors.join(', ')}.` : `Backup restaurado correctamente: ${summaryParts}.`;
    logger.info(`[Backup] Restore completed at ${new Date().toISOString()}: ${summaryParts}`);
    return NextResponse.json({ success: true, message, summary, errors, skipped });
  } catch (error: any) {
    logger.error('[Backup] Error restoring backup:', error.message || error);
    return NextResponse.json({ error: 'Fallo al restaurar el backup.', details: error.message }, { status: 500 });
  }
}
