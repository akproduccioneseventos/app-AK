import { NextResponse } from 'next/server';

/**
 * Endpoint connector for Google Looker Studio analytics export.
 */
export async function GET() {
  const schema = [
    { name: 'fecha', label: 'Fecha', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
    { name: 'cotizaciones', label: 'Cotizaciones Simulador', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
    { name: 'leads_whatsapp', label: 'Contactos WhatsApp', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
    { name: 'contratos_firmados', label: 'Contratos Firmados', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  ];

  const sampleRows = [
    { values: [new Date().toISOString().slice(0, 10), '12', '8', '2'] },
  ];

  return NextResponse.json({
    schema,
    rows: sampleRows,
    updatedAt: new Date().toISOString(),
  });
}
