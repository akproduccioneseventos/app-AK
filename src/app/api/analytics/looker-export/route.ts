import { NextResponse } from 'next/server';

/**
 * Endpoint connector for Google Looker Studio analytics export.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.LOOKER_STUDIO_TOKEN || 'secure-ak-token-2026'}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const schema = [
    { name: 'fecha', label: 'Fecha', dataType: 'STRING', semantics: { conceptType: 'DIMENSION' } },
    { name: 'cotizaciones', label: 'Cotizaciones Simulador', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
    { name: 'leads_whatsapp', label: 'Contactos WhatsApp', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
    { name: 'contratos_firmados', label: 'Contratos Firmados', dataType: 'NUMBER', semantics: { conceptType: 'METRIC' } },
  ];

  try {
    // TODO: Connect to real CRM stats when available.
    const emptyRows: any[] = [];
    return NextResponse.json({
      schema,
      rows: emptyRows,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
