import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DISABLED_IMPORT_DETAILS =
  'Importacion deshabilitada: el paquete de 29 fiestas contiene datos no confiables, incluyendo nombres con caracteres rotos, presupuestos incompletos, fechas que deben verificarse y campos genericos como "Ver contrato original".';

function disabledImportResponse() {
  return NextResponse.json(
    {
      success: false,
      error: 'Importacion de 29 fiestas deshabilitada.',
      details: DISABLED_IMPORT_DETAILS,
    },
    { status: 410 },
  );
}

export async function GET() {
  return disabledImportResponse();
}

export async function POST() {
  return disabledImportResponse();
}
