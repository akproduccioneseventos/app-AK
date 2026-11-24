import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getBuzonMessagesConDetalle } from '@/app/actions/buzon';
import { hasAppSession } from '@/lib/auth/require-session';
import { requireEventPermission } from '@/lib/auth/event-access';
import { PERMISOS } from '@/lib/auth/perfiles';
import {
  fetchStorageBufferWithTimeout,
  fetchStorageWithTimeout,
  getFiestaLocalAllowedDirs,
  isStorageUrlAllowed,
  leerArchivoSeguroDeFiesta,
  validarFiestaIdSeguro,
} from '@/lib/security/safe-fiesta-file';

const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
const FETCH_TIMEOUT_MS = 15_000;

export async function GET(request: Request, props: { params: Promise<{ fiestaId: string }> }) {
  if (!(await hasAppSession())) return new NextResponse('Unauthorized', { status: 401 });
  const params = await props.params;
  const { fiestaId } = params;

  if (!fiestaId) {
    return NextResponse.json({ error: 'Fiesta ID is required.' }, { status: 400 });
  }

  const safeFiestaId = validarFiestaIdSeguro(fiestaId);
  if (!safeFiestaId) {
    return NextResponse.json({ error: 'Fiesta ID inválido.' }, { status: 400 });
  }

  try {
    await requireEventPermission(safeFiestaId, [PERMISOS.ORGANIZACION, PERMISOS.NOCHE, PERMISOS.ADMINISTRACION]);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'No autorizado para descargar este evento.' }, { status: 403 });
  }

  const buzonAllowedDirs = getFiestaLocalAllowedDirs('buzon', safeFiestaId);

  try {
    const { mensajes: messages, huboFalla } = await getBuzonMessagesConDetalle(safeFiestaId);

    // Una lectura que fallo NO es un buzon vacio: bajar un archivo vacio como si
    // fueran todos los recuerdos es peor que no bajar nada.
    if (huboFalla) {
      return NextResponse.json(
        { error: 'No se pudieron leer los saludos del buzon. Probá de nuevo en un momento.' },
        { status: 503 },
      );
    }

    if (messages.length === 0) {
      return NextResponse.json({ error: 'No messages found for this event mailbox.' }, { status: 404 });
    }

    const messageId = new URL(request.url).searchParams.get('messageId');
    if (messageId) {
      const message = messages.find((item) => item.id === messageId);
      if (!message?.mediaUrl) {
        return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
      }

      let mediaBuffer: Buffer;
      let contentType: string | null = null;
      if (/^https?:\/\//i.test(message.mediaUrl)) {
        if (!isStorageUrlAllowed(message.mediaUrl)) {
          return NextResponse.json({ error: 'Message media is not available for download.' }, { status: 400 });
        }
        try {
          const fetched = await fetchStorageWithTimeout(message.mediaUrl, MAX_TOTAL_SIZE, FETCH_TIMEOUT_MS);
          mediaBuffer = fetched.buffer;
          contentType = fetched.contentType;
        } catch (fetchErr: any) {
          if (fetchErr?.message?.includes('límite')) {
            return NextResponse.json({ error: 'Message media exceeds the download limit.' }, { status: 413 });
          }
          return NextResponse.json({ error: 'Message media could not be downloaded.' }, { status: 502 });
        }
      } else {
        try {
          mediaBuffer = await leerArchivoSeguroDeFiesta(message.mediaUrl, buzonAllowedDirs);
          if (mediaBuffer.length > MAX_TOTAL_SIZE) {
            return NextResponse.json({ error: 'Message media exceeds the download limit.' }, { status: 413 });
          }
        } catch {
          return NextResponse.json({ error: 'Message media is not available for download.' }, { status: 400 });
        }
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
        contentType || (message.mediaType === 'audio' ? 'audio/webm' : 'video/mp4'),
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
      if (/^https?:\/\//i.test(msg.mediaUrl)) {
        if (!isStorageUrlAllowed(msg.mediaUrl)) {
          console.warn(`[SSRF Guard] Blocked download of unsafe URL: ${msg.mediaUrl}`);
          continue;
        }
        try {
          fileContent = await fetchStorageBufferWithTimeout(msg.mediaUrl, MAX_TOTAL_SIZE, FETCH_TIMEOUT_MS);
        } catch {
          continue;
        }
      } else {
        try {
          fileContent = await leerArchivoSeguroDeFiesta(msg.mediaUrl, buzonAllowedDirs);
        } catch {
          continue;
        }
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
    const filename = `buzon-recuerdos-${safeFiestaId}-${timestamp}.zip`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return new NextResponse(zipBuffer as any, { status: 200, headers });

  } catch (error: any) {
    console.error(`Error creating buzon zip for fiesta ${safeFiestaId}:`, error);
    return NextResponse.json({ error: 'Failed to create zip file.', details: error.message }, { status: 500 });
  }
}
