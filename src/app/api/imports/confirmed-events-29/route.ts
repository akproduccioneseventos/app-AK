import { gunzipSync } from 'zlib';
import { NextResponse } from 'next/server';

import chunk00 from './import-payload-chunk-00';
import chunk01 from './import-payload-chunk-01';
import chunk02 from './import-payload-chunk-02';
import chunk03 from './import-payload-chunk-03';
import chunk04 from './import-payload-chunk-04';
import chunk05 from './import-payload-chunk-05';
import chunk06 from './import-payload-chunk-06';
import chunk07 from './import-payload-chunk-07';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FILE_NAME = 'AK_IMPORTACION_29_FIESTAS_CLIENTES_PRESUPUESTOS_LISTO.json';
const IMPORT_PAYLOAD_BASE64 = [chunk00, chunk01, chunk02, chunk03, chunk04, chunk05, chunk06, chunk07].join('');

function getImportContent() {
  const content = gunzipSync(Buffer.from(IMPORT_PAYLOAD_BASE64, 'base64')).toString('utf8');
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

function assertImportPayload(content: string) {
  const payload = JSON.parse(content);
  const validation = payload?.validation || {};
  if (
    validation.importReady !== true ||
    validation.clientes !== 29 ||
    validation.presupuestos !== 29 ||
    validation.fiestas !== 29 ||
    validation.serviciosEmpresaUpsert !== 3
  ) {
    throw new Error('El archivo de importacion no coincide con la validacion esperada.');
  }
}

export async function GET() {
  try {
    const content = getImportContent();
    assertImportPayload(content);

    const headers = new Headers();
    headers.set('Content-Type', 'application/json; charset=utf-8');
    headers.set('Content-Disposition', `attachment; filename="${FILE_NAME}"`);
    headers.set('Cache-Control', 'no-store');

    return new NextResponse(content, { status: 200, headers });
  } catch (error: any) {
    return NextResponse.json({ error: 'No se pudo descargar la importacion.', details: error?.message }, { status: 500 });
  }
}
