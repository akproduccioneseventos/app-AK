import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase/server';
import { verifySession } from '@/lib/auth/session-token';
import { cleanMojibakeValue } from '@/lib/text/mojibake';

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
        const { value: cleanedData, changed } = cleanMojibakeValue(data);

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
