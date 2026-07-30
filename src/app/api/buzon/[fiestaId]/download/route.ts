import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getBuzonMessages } from '@/app/actions/buzon';
import { hasAppSession } from '@/lib/auth/require-session';

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

export async function GET(request: Request, props: { params: Promise<{ fiestaId: string }> }) {
  if (!(await hasAppSession())) return new NextResponse('Unauthorized', { status: 401 });
  const params = await props.params;
  const { fiestaId } = params;

  if (!fiestaId) {
    return NextResponse.json({ error: 'Fiesta ID is required.' }, { status: 400 });
  }

  try {
    const messages = await getBuzonMessages(fiestaId);
    
    if (messages.length === 0) {
      return NextResponse.json({ error: 'No messages found for this event mailbox.' }, { status: 404 });
    }

    const messageId = new URL(request.url).searchParams.get('messageId');
    if (messageId) {
      const message = messages.find((item) => item.id === messageId);
      if (!message?.mediaUrl) {
        return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
      }
      if (!/^https?:\/\//i.test(message.mediaUrl) || !isUrlAllowed(message.mediaUrl)) {
        return NextResponse.json({ error: 'Message media is not available for download.' }, { status: 400 });
      }

      const mediaResponse = await fetch(message.mediaUrl);
      if (!mediaResponse.ok) {
        return NextResponse.json({ error: 'Message media could not be downloaded.' }, { status: 502 });
      }
      const contentLength = Number(mediaResponse.headers.get('content-length') || 0);
      if (contentLength > MAX_TOTAL_SIZE) {
        return NextResponse.json({ error: 'Message media exceeds the download limit.' }, { status: 413 });
      }

      const mediaBuffer = Buffer.from(await mediaResponse.arrayBuffer());
      if (mediaBuffer.length > MAX_TOTAL_SIZE) {
        return NextResponse.json({ error: 'Message media exceeds the download limit.' }, { status: 413 });
      }

      const rawExtension = message.storagePath?.split('.').pop();
      const extension = rawExtension && /^[a-z0-9]{1,8}$/i.test(rawExtension)
        ? `.${rawExtension.toLowerCase()}`
        : message.mediaType === 'audio' ? '.webm' : '.mp4';
      const cleanAuthor = message.authorName.replace(/[^a-zA-Z0-9-_]/g, '_');
      const filename = `${message.mediaType}_${cleanAuthor}_${message.id}${extension}`;
      const headers = new Headers();
      headers.set(
        'Content-Type',
        mediaResponse.headers.get('content-type')
          || (message.mediaType === 'audio' ? 'audio/webm' : 'video/mp4'),
      );
      headers.set('Content-Disposition', `attachment; filename="${filename}"`);
      headers.set('Content-Length', String(mediaBuffer.length));

      return new NextResponse(new Uint8Array(mediaBuffer), { status: 200, headers });
    }

    const zip = new JSZip();
    let totalSize = 0;
    let limitExceeded = false;
    
    for (const msg of messages) {
      if (!msg.mediaUrl) continue;
      
      let fileContent: Buffer;
      if (msg.mediaUrl.startsWith('https://') || msg.mediaUrl.startsWith('http://')) {
        if (!isUrlAllowed(msg.mediaUrl)) {
          console.warn(`[SSRF Guard] Blocked download of unsafe URL: ${msg.mediaUrl}`);
          continue;
        }
        const res = await fetch(msg.mediaUrl);
        if (!res.ok) continue;
        fileContent = Buffer.from(await res.arrayBuffer());
      } else {
        const fs = await import('fs/promises');
        fileContent = await fs.readFile(msg.mediaUrl);
      }
      
      totalSize += fileContent.length;
      if (totalSize > MAX_TOTAL_SIZE) {
        limitExceeded = true;
        break;
      }
      
      // Determine file extension
      let ext = msg.mediaType === 'audio' ? '.webm' : '.mp4';
      if (msg.storagePath) {
        const pathExt = msg.storagePath.split('.').pop();
        if (pathExt) ext = `.${pathExt}`;
      }
      
      // Clean up author name for filename
      const cleanAuthor = msg.authorName.replace(/[^a-zA-Z0-9-_]/g, '_');
      const filename = `${msg.mediaType}_${cleanAuthor}_${msg.id}${ext}`;
      
      zip.file(filename, fileContent);
    }

    if (limitExceeded) {
      zip.file('DESCARGA_INCOMPLETA_LIMITE_50MB.txt', 'Se ha superado el límite máximo de 50MB de descarga. Algunos archivos no fueron incluidos para evitar agotar los recursos del servidor.');
    }
    
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `buzon-recuerdos-${fiestaId}-${timestamp}.zip`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return new NextResponse(zipBuffer as any, { status: 200, headers });

  } catch (error: any) {
    console.error(`Error creating buzon zip for fiesta ${fiestaId}:`, error);
    return NextResponse.json({ error: 'Failed to create zip file.', details: error.message }, { status: 500 });
  }
}
