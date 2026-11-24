import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { writeData } from '@/lib/data-service';
import {
  BACKUP_COLLECTIONS,
  getBackupValueCount,
  isBackupMetadataFile,
  isRestorableDataFile,
} from '@/lib/backup/backup-registry';
import {
  isConfirmedEventsBundle,
  parseJsonContent,
  restoreConfirmedEventsBundle,
  restoreConfirmedEventsJsonContent,
  summarizeRestoreSummary,
  type RestoreSummary,
} from '@/lib/imports/confirmed-events-restore';
import * as logger from '@/lib/logger';

const MAX_BACKUP_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB
const EXPECTED_BACKUP_SHAPES = new Map<string, 'array' | 'object'>(
  BACKUP_COLLECTIONS.map((c) => [c.file, Array.isArray(c.defaultValue) ? 'array' : 'object']),
);

const VALID_ZIP_TYPES = new Set(['application/zip', 'application/x-zip', 'application/x-zip-compressed', 'application/x-compressed']);
const VALID_JSON_TYPES = new Set(['application/json', 'text/json']);

function hasZipMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    ((buffer[2] === 0x03 && buffer[3] === 0x04) || (buffer[2] === 0x05 && buffer[3] === 0x06))
  );
}

function matchesExpectedBackupShape(fileName: string, data: unknown): boolean {
  const expected = EXPECTED_BACKUP_SHAPES.get(fileName);
  if (!expected) {
    return typeof data === 'object' && data !== null;
  }
  if (expected === 'array') return Array.isArray(data);
  return typeof data === 'object' && data !== null && !Array.isArray(data);
}

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
  // El auditor prueba todo menos los borrados masivos (17/11/2026).
  await (await import('@/lib/auth/solo-lectura')).exigirQueNoBorreTodo();
  try {
    // Restaurar pisa TODOS los datos del negocio. Tener sesion no alcanza: eso lo tiene
    // cualquier operador de fiesta. Lo encontro Codex el 16 de septiembre de 2026 (BKP02).
    const { requirePermiso } = await import('@/lib/auth/require-session');
    const { PERMISOS } = await import('@/lib/auth/perfiles');
    const permiso = await requirePermiso(PERMISOS.ADMINISTRACION);
    if (!permiso.ok) {
      return NextResponse.json({ error: permiso.error }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('backupFile') as File | null;

    if (!file) return NextResponse.json({ error: 'No se ha subido ningun archivo.' }, { status: 400 });
    if (file.size > MAX_BACKUP_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'El archivo supera el límite máximo permitido de 50 MB.' }, { status: 413 });
    }

    const jsonResult = await restoreJsonFile(file);
    if (jsonResult) {
      const message = `Importacion restaurada correctamente: ${summarizeRestoreSummary(jsonResult.summary)}.`;
      logger.info(`[Backup] Confirmed events JSON restore completed at ${new Date().toISOString()}: ${summarizeRestoreSummary(jsonResult.summary)}`);
      return NextResponse.json({ success: true, completo: true, message, summary: jsonResult.summary, errors: [], skipped: jsonResult.skipped });
    }

    const isZipName = file.name.toLowerCase().endsWith('.zip');
    if (!isZipName && !VALID_ZIP_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'El archivo debe ser de tipo .zip o .json.' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    if (fileBuffer.length > MAX_BACKUP_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'El archivo supera el límite máximo permitido de 50 MB.' }, { status: 413 });
    }
    if (!isZipName || !hasZipMagicBytes(fileBuffer)) {
      return NextResponse.json({ error: 'El archivo no es un ZIP válido.' }, { status: 400 });
    }

    let zip: JSZip;
    try {
      zip = await JSZip.loadAsync(fileBuffer);
    } catch {
      return NextResponse.json({ error: 'El archivo ZIP está dañado o no se pudo leer.' }, { status: 400 });
    }
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
        return NextResponse.json({ success: true, completo: true, message, summary: bundleResult.summary, errors: [], skipped: bundleResult.skipped });
      }
    }

    const summary: RestoreSummary = {};
    const errors: string[] = [];
    const skipped: string[] = [];
    const parsedEntries: Array<{ fileName: string; data: unknown }> = [];

    // Validar forma de todos los archivos antes de escribir ninguno en la base.
    for (const fileName of jsonFiles) {
      if (!isRestorableDataFile(fileName)) {
        logger.warn(`[Backup] Skipping unknown file in restore: ${fileName}`);
        skipped.push(fileName);
        continue;
      }
      try {
        const content = await zip.files[fileName].async('string');
        const data = parseJsonContent(content);
        if (!matchesExpectedBackupShape(fileName, data)) {
          return NextResponse.json(
            { error: `El archivo "${fileName}" del respaldo tiene una forma inválida y se canceló la restauración.` },
            { status: 400 },
          );
        }
        parsedEntries.push({ fileName, data });
      } catch (err: any) {
        return NextResponse.json(
          { error: `No se pudo leer "${fileName}" dentro del respaldo: ${err?.message || 'JSON inválido'}.` },
          { status: 400 },
        );
      }
    }

    if (parsedEntries.length === 0) {
      return NextResponse.json({ error: 'El archivo ZIP no contiene archivos restaurables válidos.' }, { status: 400 });
    }

    for (const { fileName, data } of parsedEntries) {
      try {
        if (fileName === 'fiestas.json' && Array.isArray(data)) {
          for (const fiesta of data) {
            if (!fiesta?.id) continue;
            await writeData(`fiestas/${fiesta.id}.json`, fiesta, undefined, { skipAutoBackup: true, esRestauracion: true });
          }
          summary.fiestas = data.filter((fiesta: any) => fiesta?.id).length;
        } else {
          await writeData(fileName, data, undefined, { skipAutoBackup: true, esRestauracion: true });
          summary[fileName.replace('.json', '')] = getBackupValueCount(data);
        }
      } catch (err: any) {
        logger.error(`[Backup] Error restoring ${fileName}:`, err.message || err);
        errors.push(fileName);
      }
    }

    if (Object.hasOwn(summary, 'insumos') && !jsonFiles.includes('ajustes-costos-insumos.json')) {
      try {
        await writeData('ajustes-costos-insumos.json', [], undefined, { skipAutoBackup: true, esRestauracion: true });
        summary['ajustes-costos-insumos'] = 0;
      } catch {
        errors.push('ajustes-costos-insumos.json');
      }
    }

    const summaryParts = summarizeRestoreSummary(summary);
    const message = errors.length > 0 ? `Backup parcialmente restaurado: ${summaryParts}. Errores en: ${errors.join(', ')}.` : `Backup restaurado correctamente: ${summaryParts}.`;
    logger.info(`[Backup] Restore completed at ${new Date().toISOString()}: ${summaryParts}`);
    // SI FALTO ALGO, SE DICE. Antes esto contestaba `success: true` con la lista de
    // errores adentro, la pantalla miraba solo si la respuesta habia llegado bien, y
    // anunciaba "Restauracion Completa" habiendo restaurado la mitad (BKP03).
    return NextResponse.json({
      success: errors.length === 0,
      completo: errors.length === 0,
      message,
      summary,
      errors,
      skipped,
    });
  } catch (error: any) {
    logger.error('[Backup] Error restoring backup:', error.message || error);
    const details = process.env.NODE_ENV === 'production' ? undefined : error.message;
    return NextResponse.json({ error: 'Fallo al restaurar el backup.', details }, { status: 500 });
  }
}
