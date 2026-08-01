import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { buildLookerExportRows } from '@/lib/analytics/looker-export';
import { readData } from '@/lib/data-service';
import type { CrmLead } from '@/types/crm';
import type { Presupuesto } from '@/types/presupuesto';

const schema = [
  { name: 'fecha', label: 'Fecha', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
  { name: 'cotizaciones', label: 'Cotizaciones Simulador', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'leads_whatsapp', label: 'Contactos WhatsApp', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  { name: 'contratos_firmados', label: 'Contratos Firmados', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
];

function secretsMatch(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function GET(request: Request): Promise<NextResponse> {
  const configuredToken = process.env.LOOKER_STUDIO_TOKEN;
  if (!configuredToken) {
    return NextResponse.json({ error: 'Looker Studio no está configurado.' }, { status: 503 });
  }

  const authHeader = request.headers.get('authorization') || '';
  const receivedToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!receivedToken || !secretsMatch(receivedToken, configuredToken)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const [budgets, leads] = await Promise.all([
      readData<Presupuesto[]>('presupuestos.json', []),
      readData<CrmLead[]>('crm-leads.json', []),
    ]);
    return NextResponse.json({
      schema,
      rows: buildLookerExportRows(budgets, leads),
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
