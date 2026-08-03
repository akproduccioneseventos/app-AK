import { NextResponse } from 'next/server';
import { verifySession } from '@/app/actions/session';

/**
 * Looker Studio data connector endpoint.
 * Protected by session auth â€” only authenticated admin users can query.
 *
 * TODO: Replace sample rows with real Firestore queries when Looker Studio
 * is connected in production.
 */
export async function GET() {
  const auth = await verifySession();
  if (!auth.success) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const schema = [
    { name: 'fecha', label: 'Fecha', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
    { name: 'cotizaciones', label: 'Cotizaciones Simulador', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
    { name: 'leads_whatsapp', label: 'Contactos WhatsApp', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
    { name: 'contratos_firmados', label: 'Contratos Firmados', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  ];

  const sampleRows = [
    { values: [new Date().toISOString().slice(0, 10), 0, 0, 0] },
  ];

  return NextResponse.json({
    schema,
    rows: sampleRows,
    updatedAt: new Date().toISOString(),
  });
}
