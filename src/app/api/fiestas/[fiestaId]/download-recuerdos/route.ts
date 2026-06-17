import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getSocialPosts } from '@/app/actions/social-gallery';
import { getDedications } from '@/app/actions/social-interactive';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { hasAppSession } from '@/lib/auth/require-session';

const MAX_TOTAL_SIZE = 150 * 1024 * 1024; // 150MB total zip size limit
const ALLOWED_DOMAINS = [
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  'lh3.googleusercontent.com',
  'wfolio.com',
  'wfolio.pro'
];

function isUrlAllowed(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname;
    if (process.env.NODE_ENV === 'development' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      return true;
    }
    return ALLOWED_DOMAINS.includes(hostname) || hostname.endsWith('.googleusercontent.com') || hostname.endsWith('.googleapis.com');
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
    // 1. Verify administrative access
    const isAuthorized = await hasAppSession();
    if (!isAuthorized) {
      return NextResponse.json({ error: 'No autorizado. Por favor inicie sesión como administrador.' }, { status: 401 });
    }

    // 2. Load the event details to get name
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) {
      return NextResponse.json({ error: 'Evento no encontrado.' }, { status: 404 });
    }

    const eventName = fiesta.configuracion?.nombreEvento || 'Fiesta';
    const cleanEventName = eventName.replace(/[^a-zA-Z0-9-_]/g, '_');

    // 3. Load posts and dedications concurrently
    const [posts, dedications] = await Promise.all([
      getSocialPosts(fiestaId),
      getDedications(fiestaId)
    ]);

    const zip = new JSZip();
    let totalSize = 0;
    let limitExceeded = false;

    // Create folder structure inside the zip
    const photosFolder = zip.folder('fotos');
    const videosFolder = zip.folder('videos');
    const audiosFolder = zip.folder('audios_buzon');

    // 4. Add social posts (photos and videos)
    for (const post of posts) {
      if (!post.imageUrl) continue;

      let fileContent: Buffer;
      if (post.imageUrl.startsWith('https://') || post.imageUrl.startsWith('http://')) {
        if (!isUrlAllowed(post.imageUrl)) {
          console.warn(`[SSRF Guard] Blocked download of unsafe URL: ${post.imageUrl}`);
          continue;
        }
        try {
          const res = await fetch(post.imageUrl);
          if (!res.ok) continue;
          fileContent = Buffer.from(await res.arrayBuffer());
        } catch (err) {
          console.error(`Failed to download post image: ${post.imageUrl}`, err);
          continue;
        }
      } else {
        try {
          const fs = await import('fs/promises');
          fileContent = await fs.readFile(post.imageUrl);
        } catch (err) {
          continue;
        }
      }

      totalSize += fileContent.length;
      if (totalSize > MAX_TOTAL_SIZE) {
        limitExceeded = true;
        break;
      }

      // Determine extension and clean name
      const isVideo = post.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(post.imageUrl);
      const ext = isVideo ? '.mp4' : '.jpg';
      const cleanAuthor = post.authorName.replace(/[^a-zA-Z0-9-_]/g, '_');
      const filename = `${cleanAuthor}_${post.id}${ext}`;

      if (isVideo) {
        videosFolder?.file(filename, fileContent);
      } else {
        photosFolder?.file(filename, fileContent);
      }
    }

    // 5. Add dedications with audios
    if (!limitExceeded) {
      for (const ded of dedications) {
        if (!ded.audioUrl) continue;

        let fileContent: Buffer;
        if (ded.audioUrl.startsWith('https://') || ded.audioUrl.startsWith('http://')) {
          if (!isUrlAllowed(ded.audioUrl)) {
            console.warn(`[SSRF Guard] Blocked download of unsafe URL: ${ded.audioUrl}`);
            continue;
          }
          try {
            const res = await fetch(ded.audioUrl);
            if (!res.ok) continue;
            fileContent = Buffer.from(await res.arrayBuffer());
          } catch (err) {
            console.error(`Failed to download dedication audio: ${ded.audioUrl}`, err);
            continue;
          }
        } else {
          try {
            const fs = await import('fs/promises');
            fileContent = await fs.readFile(ded.audioUrl);
          } catch (err) {
            continue;
          }
        }

        totalSize += fileContent.length;
        if (totalSize > MAX_TOTAL_SIZE) {
          limitExceeded = true;
          break;
        }

        // Determine extension
        let ext = '.wav';
        const urlExt = ded.audioUrl.split('.').pop()?.split('?')[0]?.split('#')[0];
        if (urlExt && urlExt.length <= 4) {
          ext = `.${urlExt}`;
        }
        const cleanAuthor = ded.authorName.replace(/[^a-zA-Z0-9-_]/g, '_');
        const filename = `${cleanAuthor}_${ded.id}${ext}`;

        audiosFolder?.file(filename, fileContent);
      }
    }

    // 6. Write limit warning if exceeded
    if (limitExceeded) {
      zip.file('DESCARGA_INCOMPLETA_LIMITE_150MB.txt', 'Se ha superado el límite máximo de 150MB de descarga. Algunos archivos no fueron incluidos para evitar agotar los recursos del servidor.');
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFilename = `recuerdos_${cleanEventName}_${timestamp}.zip`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${zipFilename}"`);

    return new NextResponse(zipBuffer as any, { status: 200, headers });

  } catch (error: any) {
    console.error(`Error creating full recuerdos zip for fiesta ${fiestaId}:`, error);
    return NextResponse.json({ error: 'Failed to create zip file.', details: error.message }, { status: 500 });
  }
}
