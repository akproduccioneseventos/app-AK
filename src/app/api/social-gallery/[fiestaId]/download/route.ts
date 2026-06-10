import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getPhotoFilePathsForZip } from '@/app/actions/social-gallery';
import { Readable } from 'stream';

const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_DOMAINS = [
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  'lh3.googleusercontent.com'
];

function isUrlAllowed(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname;
    if (process.env.NODE_ENV === 'development' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      return true;
    }
    return ALLOWED_DOMAINS.includes(hostname) || hostname.endsWith('.googleusercontent.com');
  } catch {
    return false;
  }
}

export async function GET(
  request: Request,
  { params }: { params: { fiestaId: string } }
) {
  const { fiestaId } = params;

  if (!fiestaId) {
    return NextResponse.json({ error: 'Fiesta ID is required.' }, { status: 400 });
  }

  try {
    const photoPaths = await getPhotoFilePathsForZip(fiestaId);
    
    if (photoPaths.length === 0) {
      return NextResponse.json({ error: 'No photos found for this event gallery.' }, { status: 404 });
    }

    const zip = new JSZip();
    let totalSize = 0;
    let limitExceeded = false;
    
    for (const photo of photoPaths) {
      let fileContent: Buffer;
      if (photo.path.startsWith('https://') || photo.path.startsWith('http://')) {
        if (!isUrlAllowed(photo.path)) {
          console.warn(`[SSRF Guard] Blocked download of unsafe URL: ${photo.path}`);
          continue;
        }
        const res = await fetch(photo.path);
        if (!res.ok) continue;
        fileContent = Buffer.from(await res.arrayBuffer());
      } else {
        const fs = await import('fs/promises');
        fileContent = await fs.readFile(photo.path);
      }
      
      totalSize += fileContent.length;
      if (totalSize > MAX_TOTAL_SIZE) {
        limitExceeded = true;
        break;
      }
      zip.file(photo.name, fileContent);
    }

    if (limitExceeded) {
      zip.file('DESCARGA_INCOMPLETA_LIMITE_50MB.txt', 'Se ha superado el límite máximo de 50MB de descarga. Algunos archivos no fueron incluidos para evitar agotar los recursos del servidor.');
    }
    
    const zipStream = zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true });
    const webStream = Readable.toWeb(zipStream as any);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `galeria-social-${fiestaId}-${timestamp}.zip`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return new NextResponse(webStream as any, { status: 200, headers });

  } catch (error: any) {
    console.error(`Error creating social gallery zip for fiesta ${fiestaId}:`, error);
    return NextResponse.json({ error: 'Failed to create zip file.', details: error.message }, { status: 500 });
  }
}
