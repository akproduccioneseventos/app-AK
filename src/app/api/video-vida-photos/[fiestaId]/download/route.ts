import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getLifeStoryVideoPhotos } from '@/app/actions/fiesta/video-vida.actions';
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
    const photoUrls = await getLifeStoryVideoPhotos(fiestaId);

    if (photoUrls.length === 0) {
      return NextResponse.json({ error: 'No photos found for this event.' }, { status: 404 });
    }

    const zip = new JSZip();
    let totalSize = 0;
    let limitExceeded = false;

    for (const url of photoUrls) {
      let fileContent: Buffer;
      let name: string;
      if (url.startsWith('https://') || url.startsWith('http://')) {
        if (!isUrlAllowed(url)) {
          console.warn(`[SSRF Guard] Blocked download of unsafe URL: ${url}`);
          continue;
        }
        const res = await fetch(url);
        if (!res.ok) continue;
        fileContent = Buffer.from(await res.arrayBuffer());
        name = url.split('/').pop()?.split('?')[0] ?? `photo_${Date.now()}.jpg`;
      } else {
        // Legacy local path
        const fs = await import('fs/promises');
        const path = await import('path');
        fileContent = await fs.readFile(url);
        name = path.basename(url);
      }

      totalSize += fileContent.length;
      if (totalSize > MAX_TOTAL_SIZE) {
        limitExceeded = true;
        break;
      }
      zip.file(name, fileContent);
    }

    if (limitExceeded) {
      zip.file('DESCARGA_INCOMPLETA_LIMITE_50MB.txt', 'Se ha superado el límite máximo de 50MB de descarga. Algunos archivos no fueron incluidos para evitar agotar los recursos del servidor.');
    }

    const zipStream = zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true });
    const webStream = Readable.toWeb(zipStream);
    const zipFilename = `video-de-vida-${fiestaId}.zip`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${zipFilename}"`);

    return new NextResponse(webStream as any, { status: 200, headers });

  } catch (error: any) {
    console.error(`Error creating zip for fiesta ${fiestaId}:`, error);
    return NextResponse.json({ error: 'Failed to create zip file.', details: error.message }, { status: 500 });
  }
}
