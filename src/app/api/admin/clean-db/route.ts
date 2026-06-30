import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase/server';
import { verifySession } from '@/lib/auth/session-token';

const REPLACEMENTS = [
  { bad: 'Ã¡', good: 'á' },
  { bad: 'Ã©', good: 'é' },
  { bad: 'Ã­', good: 'í' },
  { bad: 'Ã³', good: 'ó' },
  { bad: 'Ãº', good: 'ú' },
  { bad: 'Ã±', good: 'ñ' },
  { bad: 'Ã‘', good: 'Ñ' },
  { bad: 'Â¿', good: '¿' },
  { bad: 'Â¡', good: '¡' },
  { bad: 'Âº', good: 'º' },
  { bad: 'Âª', good: 'ª' },
  { bad: 'Ã¼', good: 'ü' },
  { bad: 'Ã“', good: 'Ó' },
  { bad: 'Ãš', good: 'Ú' },
  { bad: 'Ã‰', good: 'É' },
  { bad: 'Ã ', good: 'Í' },
  { bad: 'â€”', good: '—' },
  { bad: 'Ã¤', good: 'ä' },
  { bad: 'Ã¶', good: 'ö' },
  { bad: 'â€“', good: '–' },
  { bad: 'â€¢', good: '•' },
  { bad: 'â€™', good: '\'' },
  { bad: 'â€œ', good: '"' },
  { bad: 'â€ ', good: '"' },
];

function cleanString(str: string): string {
  let current = str;
  for (const rep of REPLACEMENTS) {
    if (current.includes(rep.bad)) {
      current = current.split(rep.bad).join(rep.good);
    }
  }
  return current;
}

function cleanValue(val: any): { value: any; changed: boolean } {
  if (typeof val === 'string') {
    const cleaned = cleanString(val);
    return { value: cleaned, changed: cleaned !== val };
  }

  if (Array.isArray(val)) {
    let changed = false;
    const cleanedArray = val.map(item => {
      const res = cleanValue(item);
      if (res.changed) changed = true;
      return res.value;
    });
    return { value: cleanedArray, changed };
  }

  if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
    if (val.constructor && val.constructor.name === 'DocumentReference') {
      return { value: val, changed: false };
    }
    let changed = false;
    const cleanedObj: Record<string, any> = {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        const res = cleanValue(val[key]);
        if (res.changed) changed = true;
        cleanedObj[key] = res.value;
      }
    }
    return { value: cleanedObj, changed };
  }

  return { value: val, changed: false };
}

const COLLECTIONS_TO_CLEAN = [
  'prospectos',
  'clientes',
  'eventos',
  'presupuestos',
  'empleados',
  'proveedores',
  'notificaciones',
  'cupones'
];

async function isAuthorized(request: Request, secret: string | null) {
  const maintenanceSecret = process.env.CLEAN_DB_SECRET || process.env.ADMIN_MAINTENANCE_SECRET;
  const bearerSecret = request.headers.get('Authorization')?.replace('Bearer ', '') || null;

  if (maintenanceSecret && (secret === maintenanceSecret || bearerSecret === maintenanceSecret)) {
    return true;
  }

  const session = await verifySession();
  return session.success && session.user?.role === 'admin';
}

export async function GET(request: Request) {
  return handleCleanDb(request);
}

export async function POST(request: Request) {
  return handleCleanDb(request);
}

async function handleCleanDb(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const requestedWrite = searchParams.get('dryRun') === '0';
  const dryRun = request.method === 'GET' || !requestedWrite;

  if (!(await isAuthorized(request, secret))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (requestedWrite && request.method !== 'POST') {
    return NextResponse.json(
      { error: 'Para modificar datos usa POST con dryRun=0 y confirm=clean-mojibake.' },
      { status: 405 }
    );
  }

  if (!dryRun && searchParams.get('confirm') !== 'clean-mojibake') {
    return NextResponse.json(
      { error: 'Falta confirm=clean-mojibake para ejecutar cambios reales.' },
      { status: 400 }
    );
  }

  if (!dbAdmin) {
    return NextResponse.json({ error: 'Firestore is not available' }, { status: 503 });
  }

  const report: Record<string, { scanned: number; modified: string[] }> = {};
  let totalScanned = 0;
  let totalModified = 0;

  try {
    for (const colName of COLLECTIONS_TO_CLEAN) {
      report[colName] = { scanned: 0, modified: [] };
      const colRef = dbAdmin.collection(colName);
      const snapshot = await colRef.get();
      
      report[colName].scanned = snapshot.size;
      totalScanned += snapshot.size;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const { value: cleanedData, changed } = cleanValue(data);

        if (changed) {
          report[colName].modified.push(doc.id);
          totalModified++;

          if (!dryRun) {
            await colRef.doc(doc.id).set({
              ...cleanedData,
              updatedAt: new Date().toISOString(),
              _cleanedAt: new Date().toISOString(),
            }, { merge: true });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      totalScanned,
      totalModified,
      report,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Error occurred during cleanup',
    }, { status: 500 });
  }
}
