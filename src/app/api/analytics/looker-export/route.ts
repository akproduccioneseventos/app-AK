import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { buildLookerExportRows } from '@/lib/analytics/looker-export';
import { hasAppSession } from '@/lib/auth/require-session';
import { readData } from '@/lib/data-service';
import type { CrmLead } from '@/types/crm';
import type { Presupuesto } from '@/types/presupuesto';

/**
 * Looker Studio data connector endpoint.
 *
 * Acepta dos formas de acceso, porque tiene dos consumidores distintos:
 *  - `LOOKER_STUDIO_TOKEN` por cabecera: es la unica via que tiene Looker
 *    Studio para refrescar el informe solo, sin navegador ni sesion.
 *  - Sesion valida del equipo: para consultar el endpoint desde la app.
 */

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

function hasValidToken(request: Request): boolean {
  const configuredToken = process.env.LOOKER_STUDIO_TOKEN;
  if (!configuredToken) return false;
  const authHeader = request.headers.get('authorization') || '';
  const receivedToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  return Boolean(receivedToken) && secretsMatch(receivedToken, configuredToken);
}

export async function GET(request: Request): Promise<NextResponse> {
  const autorizado = hasValidToken(request) || (await hasAppSession());
  if (!autorizado) {
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
