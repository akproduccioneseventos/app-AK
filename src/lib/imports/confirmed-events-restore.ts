import { readData, writeData } from '@/lib/data-service';

export type RestoreSummary = Record<string, number>;

export type ConfirmedEventsRestoreResult = {
  summary: RestoreSummary;
  skipped: string[];
};

function toArray(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

function buildImportedServiceId(raw: any) {
  const base = `${String(raw.categoria || 'servicio')}_${String(raw.nombre || 'compatibilidad')}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);

  return `serv_import_${base || 'compatibilidad'}`;
}

export function parseJsonContent(content: string) {
  const cleanContent = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
  return JSON.parse(cleanContent);
}

export function isConfirmedEventsBundle(value: any): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Array.isArray(value.presupuestos) || Array.isArray(value.fiestas) || Array.isArray(value.customers) || Array.isArray(value.clientes);
}

export function summarizeRestoreSummary(summary: RestoreSummary): string {
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
    const id = String(raw.id || buildImportedServiceId(raw)).trim();
    const nameKey = `${String(raw.nombre).trim().toLowerCase()}|${String(raw.categoria).trim().toLowerCase()}`;
    if ((id && byId.has(id)) || byNameCategory.has(nameKey)) continue;

    const item = {
      ...raw,
      id,
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

export async function restoreConfirmedEventsBundle(bundle: any, sourceName: string): Promise<ConfirmedEventsRestoreResult> {
  // Fix corrupted UTF-8 names inside the bundle before processing
  const nameFixes: Record<string, string> = {
    'Mirta Cort\u01f8s': 'Mirta Cortés',
    'Mar\u00c3\u00ada': 'María',
    'mar\u00c3\u00ada': 'maría',
    'Gonz\u00c3\u00a1lez': 'González',
    'gonz\u00c3\u00a1lez': 'gonzález',
    'Rodr\u00c3\u00adguez': 'Rodríguez',
    'D\u00c3\u00adaz': 'Díaz',
    'a\u00c3\u00b1os': 'años',
    'sal\u00c3\u00b3n': 'salón',
    'Sal\u00c3\u00b3n': 'Salón',
    'Cort\u01f8s': 'Cortés',
    'Gonz\u01edlez': 'González',
    'gonz\u01edlez': 'gonzález',
    'Mar\u00eda': 'María',
    'Gonz\u00e1lez': 'González',
    'Rodr\u00edguez': 'Rodríguez'
  };

  const walkAndFix = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string') {
        let val = obj[key];
        // Fix common double-encoded patterns
        if (val.includes('')) {
           val = val.replace(/Mara/g, 'María').replace(/Rodrguez/g, 'Rodríguez').replace(/Gonzlez/g, 'González').replace(/Daz/g, 'Díaz');
        }
        for (const [wrong, right] of Object.entries(nameFixes)) {
          if (val.includes(wrong)) {
            val = val.split(wrong).join(right);
          }
        }
        obj[key] = val;
      } else if (typeof obj[key] === 'object') {
        walkAndFix(obj[key]);
      }
    }
  };
  walkAndFix(bundle);

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

export async function restoreConfirmedEventsJsonContent(content: string, sourceName: string) {
  const parsed = parseJsonContent(content);
  if (!isConfirmedEventsBundle(parsed)) {
    throw new Error('El JSON no tiene formato de importacion de eventos confirmados.');
  }

  return restoreConfirmedEventsBundle(parsed, sourceName);
}
