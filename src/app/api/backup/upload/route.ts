import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { readData, writeData } from '@/lib/data-service';
import { getBackupValueCount, isBackupMetadataFile, isRestorableDataFile } from '@/lib/backup/backup-registry';
import * as logger from '@/lib/logger';

const VALID_ZIP_TYPES = new Set(['application/zip', 'application/x-zip', 'application/x-zip-compressed', 'application/octet-stream', 'application/x-compressed']);
const VALID_JSON_TYPES = new Set(['application/json', 'text/json', 'application/octet-stream']);

type RestoreSummary = Record<string, number>;

function toArray(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

function isConfirmedEventsBundle(value: any): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Array.isArray(value.presupuestos) || Array.isArray(value.fiestas) || Array.isArray(value.customers) || Array.isArray(value.clientes);
}

function summarize(summary: RestoreSummary): string {
  return Object.entries(summary).map(([key, count]) => `${count} ${key}`).join(', ');
}

function shouldSkipCatalogReplace(bundle: any): boolean {
  return !bundle?.metadata?.replaceServiciosEmpresa && !bundle?.replaceServiciosEmpresa;
}

async function upsertServiciosEmpresa(serviciosToUpsert: any[]): Promise<number> {
  if (!Array.isArray(serviciosToUpsert) || serviciosToUpsert.length === 0) return 0;

  const current = await readData<any[]>('servicios-empresa.json', []);
  const byId = new Map(current.map((item) => [String(item.id || ''), item]));
  const byNameCategory = new Map(current.map((item) => [`${String(item.nombre || '').trim().toLowerCase()}|${String(item.categoria || '').trim().toLowerCase()}`, item]));
  let added = 0;

  for (const raw of serviciosToUpsert) {
    if (!raw || typeof raw !== 'object' || !raw.nombre || !raw.categoria) continue;
    const id = String(raw.id || '').trim();
    const nameKey = `${String(raw.nombre).trim().toLowerCase()}|${String(raw.categoria).trim().toLowerCase()}`;
    if ((id && byId.has(id)) || byNameCategory.has(nameKey)) continue;

    const item = {
      ...raw,
      id: id || `serv_import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      tipoItem: raw.tipoItem || 'Servicio',
      calculationMethod: raw.calculationMethod || 'fijo',
      unidad: raw.unidad || 'Unidad',
    };
    current.push(item);
    byId.set(item.id, item);
    byNameCategory.set(nameKey, item);
    added += 1;
  }

  if (added > 0) {
    await writeData('servicios-empresa.json', current, (a, b) => (a.categoria || '').localeCompare(b.categoria || '') || (a.nombre || '').localeCompare(b.nombre || ''));
  }

  return added;
}

async function restoreConfirmedEventsBundle(bundle: any, sourceName: string) {
  const customers = toArray(bundle.customers).length > 0 ? toArray(bundle.customers) : toArray(bundle.clientes);
  const presupuestos = toArray(bundle.presupuestos);
  const fiestas = toArray(bundle.fiestas);
  const summary: RestoreSummary = {};
  const skipped: string[] = [];

  if (customers.length > 0) {
    await writeData('customers.json', customers);
    summary.customers = customers.length;
  }

  if (presupuestos.length > 0) {
    await writeData('presupuestos.json', presupuestos);
    summary.presupuestos = presupuestos.length;
  }

  if (fiestas.length > 0) {
    for (const fiesta of fiestas) {
      if (!fiesta?.id) continue;
      await writeData(`fiestas/${fiesta.id}.json`, fiesta);
    }
    summary.fiestas = fiestas.filter((fiesta: any) => fiesta?.id).length;
  }

  const servicesUpserted = await upsertServiciosEmpresa(toArray(bundle.serviciosEmpresaUpsert));
  if (servicesUpserted > 0) summary.serviciosEmpresaAgregados = servicesUpserted;

  if (shouldSkipCatalogReplace(bundle) && (Array.isArray(bundle.serviciosEmpresa) || Array.isArray(bundle.servicios) || Array.isArray(bundle.serviciosCreados))) {
    skipped.push('servicios-empresa.json');
  }

  if (Object.keys(summary).length === 0) {
    throw new Error(`El archivo ${sourceName} no contiene clientes, presupuestos ni fiestas para importar.`);
  }

  return { summary, skipped };
}

async function restoreJsonFile(file: File) {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.zip')) return null;
  if (!VALID_JSON_TYPES.has(file.type) && !lowerName.endsWith('.json')) {
    return null;
  }

  const raw = Buffer.from(await file.arrayBuffer()).toString('utf8');
  const parsed = JSON.parse(raw);
  if (!isConfirmedEventsBundle(parsed)) {
    throw new Error('El JSON no tiene formato de importacion de eventos confirmados.');
  }

  return restoreConfirmedEventsBundle(parsed, file.name);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('backupFile') as File | null;

    if (!file) return NextResponse.json({ error: 'No se ha subido ningun archivo.' }, { status: 400 });

    const jsonResult = await restoreJsonFile(file);
    if (jsonResult) {
      const message = `Importacion restaurada correctamente: ${summarize(jsonResult.summary)}.`;
      logger.info(`[Backup] Confirmed events JSON restore completed at ${new Date().toISOString()}: ${summarize(jsonResult.summary)}`);
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
      const parsed = JSON.parse(content);
      if (isConfirmedEventsBundle(parsed)) {
        const bundleResult = await restoreConfirmedEventsBundle(parsed, bundleFileName);
        const message = `Importacion restaurada correctamente: ${summarize(bundleResult.summary)}.`;
        logger.info(`[Backup] Confirmed events ZIP restore completed at ${new Date().toISOString()}: ${summarize(bundleResult.summary)}`);
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
        const data = JSON.parse(content);
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

    const summaryParts = summarize(summary);
    const message = errors.length > 0 ? `Backup parcialmente restaurado: ${summaryParts}. Errores en: ${errors.join(', ')}.` : `Backup restaurado correctamente: ${summaryParts}.`;
    logger.info(`[Backup] Restore completed at ${new Date().toISOString()}: ${summaryParts}`);
    return NextResponse.json({ success: true, message, summary, errors, skipped });
  } catch (error: any) {
    logger.error('[Backup] Error restoring backup:', error.message || error);
    return NextResponse.json({ error: 'Fallo al restaurar el backup.', details: error.message }, { status: 500 });
  }
}
