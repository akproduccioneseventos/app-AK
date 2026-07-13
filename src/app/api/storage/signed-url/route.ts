import { NextRequest, NextResponse } from 'next/server';
import { getSignedUrl, extractStoragePath } from '@/lib/firebase/storage';
import { hasAppSession } from '@/lib/auth/require-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!(await hasAppSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const rawPath = searchParams.get('path');
  if (!rawPath) {
    return NextResponse.json({ error: 'Falta el path del archivo' }, { status: 400 });
  }

  try {
    const path = extractStoragePath(rawPath);
    // Generate signed URL valid for 30 minutes
    const signedUrl = await getSignedUrl(path, 30 * 60 * 1000);
    if (!signedUrl) {
      return NextResponse.json({ error: 'No se pudo generar el enlace firmado' }, { status: 404 });
    }
    return NextResponse.redirect(signedUrl);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
