import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getLifeStoryVideoPhotos } from '@/app/actions/fiesta/video-vida.actions';
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
    const photoUrls = await getLifeStoryVideoPhotos(fiestaId);

    if (photoUrls.length === 0) {
      return NextResponse.json({ error: 'No photos found for this event.' }, { status: 404 });
    }

    // VID03 (Codex, 19 y 25 de septiembre de 2026): una foto que no bajaba se salteaba en
    // silencio y se entregaba el archivo con fotos de menos —o vacío— como si estuviera
    // completo. Ahora se cuenta cada falla, se avisa adentro del archivo y en la respuesta, y
    // si no entró ninguna no se entrega nada.
    const zip = new JSZip();
    let totalSize = 0;
    let limitExceeded = false;
    const faltan: string[] = [];
    const usados = new Map<string, number>();
    let incluidas = 0;

    const nombreSinRepetir = (nombre: string) => {
      const veces = (usados.get(nombre) || 0) + 1;
      usados.set(nombre, veces);
      if (veces === 1) return nombre;
      const punto = nombre.lastIndexOf('.');
      return punto > 0 ? `${nombre.slice(0, punto)}-${veces}${nombre.slice(punto)}` : `${nombre}-${veces}`;
    };
    // Sólo el nombre del archivo: la dirección completa lleva la firma de acceso.
    const nombreDe = (url: string) => {
      const crudo = url.split('/').pop()?.split('?')[0] || 'foto.jpg';
      try { return decodeURIComponent(crudo).split('/').pop() || crudo; } catch { return crudo; }
    };

    for (const url of photoUrls) {
      const name = nombreDe(url);
      let fileContent: Buffer;
      try {
        if (url.startsWith('https://') || url.startsWith('http://')) {
          if (!isUrlAllowed(url)) {
            console.warn(`[SSRF Guard] Blocked download of unsafe URL: ${url}`);
            faltan.push(`${name} (dirección no permitida)`);
            continue;
          }
          const res = await fetch(url);
          if (!res.ok) {
            faltan.push(`${name} (no se pudo bajar: ${res.status})`);
            continue;
          }
          fileContent = Buffer.from(await res.arrayBuffer());
        } else {
          // Ruta local vieja: sólo adentro de la carpeta de la app, nunca un archivo cualquiera
          // del servidor.
          const fs = await import('fs/promises');
          const path = await import('path');
          const base = path.resolve(process.cwd());
          const ruta = path.resolve(base, url);
          if (!ruta.startsWith(base + path.sep)) {
            faltan.push(`${name} (dirección no permitida)`);
            continue;
          }
          fileContent = await fs.readFile(ruta);
        }
      } catch {
        faltan.push(`${name} (se cortó al bajarla)`);
        continue;
      }

      totalSize += fileContent.length;
      if (totalSize > MAX_TOTAL_SIZE) {
        limitExceeded = true;
        break;
      }
      zip.file(nombreSinRepetir(name), fileContent);
      incluidas++;
    }

    if (incluidas === 0) {
      return NextResponse.json(
        { error: 'No se pudo bajar ninguna foto. Probá de nuevo en un rato.' },
        { status: 502 },
      );
    }

    if (faltan.length > 0) {
      zip.file(
        'FALTAN_FOTOS.txt',
        `Faltan ${faltan.length} de ${photoUrls.length} fotos. No se pudieron bajar:\n\n${faltan.join('\n')}\n\nProbá bajar de nuevo en un rato.`,
      );
    }
    if (limitExceeded) {
      zip.file('DESCARGA_INCOMPLETA_LIMITE_50MB.txt', 'Se ha superado el límite máximo de 50MB de descarga. Algunos archivos no fueron incluidos para evitar agotar los recursos del servidor.');
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const zipFilename = `video-de-vida-${fiestaId}.zip`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${zipFilename}"`);
    headers.set('X-Fotos-Pedidas', String(photoUrls.length));
    headers.set('X-Fotos-Incluidas', String(incluidas));
    headers.set('X-Fotos-Fallidas', String(faltan.length));

    return new NextResponse(zipBuffer as any, { status: 200, headers });

  } catch (error: any) {
    console.error(`Error creating zip for fiesta ${fiestaId}:`, error);
    return NextResponse.json({ error: 'Failed to create zip file.', details: error.message }, { status: 500 });
  }
}
