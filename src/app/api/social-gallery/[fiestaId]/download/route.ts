import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getPhotoFilePathsForZip, type PhotoZipItem } from '@/app/actions/social-gallery';
import { hasAppSession } from '@/lib/auth/require-session';
import { requireEventPermission } from '@/lib/auth/event-access';
import { PERMISOS } from '@/lib/auth/perfiles';
import { soloAprobados } from '@/lib/social-fiesta/visibilidad';
import { esTiraFotocabina } from '@/lib/video-resumen/elegir-fotos-video';
import {
  fetchStorageBufferWithTimeout,
  getFiestaLocalAllowedDirs,
  isStorageUrlAllowed,
  leerArchivoSeguroDeFiesta,
  validarFiestaIdSeguro,
} from '@/lib/security/safe-fiesta-file';

const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
const FETCH_TIMEOUT_MS = 15_000;

function formatearNombreModulo(sourceModule: string): string {
  const limpio = sourceModule
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
  if (!limpio) return 'Fotos de los invitados';
  return limpio
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
}

function clasificarCarpetaEstacion(post: PhotoZipItem): string {
  const modRaw = String(post.sourceModule || '').trim();
  const mod = modRaw.toLowerCase();
  const modCompacto = mod.replace(/[-_\s]+/g, '');

  if (
    modCompacto === 'plataforma360' ||
    modCompacto === 'video360' ||
    modCompacto === '360' ||
    mod.includes('360')
  ) {
    return 'Plataforma 360';
  }

  if (
    esTiraFotocabina(post) ||
    modCompacto === 'fotocabina' ||
    modCompacto === 'photobooth' ||
    modCompacto === 'cabina'
  ) {
    return 'Fotocabina';
  }

  if (
    modCompacto === 'vogue' ||
    modCompacto === 'bogue' ||
    modCompacto === 'cabinavogue' ||
    modCompacto === 'boomerang'
  ) {
    return 'Vogue';
  }

  if (modCompacto.startsWith('espejo')) {
    return 'Espejo Magico';
  }

  if (
    modCompacto === 'barra' ||
    modCompacto === 'kiosco' ||
    modCompacto === 'barratecnologica'
  ) {
    return 'Barra Tecnologica';
  }

  if (
    modCompacto === 'totem' ||
    modCompacto === 'totems' ||
    modCompacto === 'totemia' ||
    modCompacto === 'pantallastotem' ||
    modCompacto === 'touchpix'
  ) {
    return 'Totem Interactivo';
  }

  if (
    modCompacto === 'buzon' ||
    modCompacto === 'capsulatiempo' ||
    modCompacto === 'audioguestbook'
  ) {
    return 'Buzon';
  }

  if (
    !mod ||
    post.source === 'guest' ||
    ['muro', 'murosocial', 'invitado', 'invitados', 'guest'].includes(modCompacto)
  ) {
    return 'Fotos de los invitados';
  }

  return formatearNombreModulo(modRaw);
}

function rutaUnicaEnZip(zip: JSZip, rutaBase: string): string {
  if (!zip.file(rutaBase)) return rutaBase;
  const slashIdx = rutaBase.lastIndexOf('/');
  const dir = slashIdx >= 0 ? rutaBase.slice(0, slashIdx + 1) : '';
  const nombre = slashIdx >= 0 ? rutaBase.slice(slashIdx + 1) : rutaBase;
  const dotIdx = nombre.lastIndexOf('.');
  const stem = dotIdx > 0 ? nombre.slice(0, dotIdx) : nombre;
  const ext = dotIdx > 0 ? nombre.slice(dotIdx) : '';

  let idx = 2;
  let candidata = `${dir}${stem}_${idx}${ext}`;
  while (zip.file(candidata)) {
    idx += 1;
    candidata = `${dir}${stem}_${idx}${ext}`;
  }
  return candidata;
}

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

  const galleryAllowedDirs = getFiestaLocalAllowedDirs('social-gallery', safeFiestaId);
  const apiPrefix = `/api/social-gallery/${safeFiestaId}/`;

  const searchParams =
    (request as { nextUrl?: { searchParams?: URLSearchParams } }).nextUrl?.searchParams ??
    new URL(request.url).searchParams;
  const usarCarpetas = searchParams.get('carpetas') === '1';

  try {
    let lectura: Awaited<ReturnType<typeof getPhotoFilePathsForZip>>;
    try {
      lectura = await getPhotoFilePathsForZip(safeFiestaId);
    } catch (lecturaError) {
      // Un error de lectura no es "no hay fotos" (404): se avisa para probar de nuevo.
      console.error(`No se pudieron leer las fotos de la fiesta ${safeFiestaId}:`, lecturaError);
      return NextResponse.json({ error: 'No pudimos leer las fotos, probá de nuevo.' }, { status: 502 });
    }
    const { photos: photoPaths, stats } = lectura;

    if (photoPaths.length === 0) {
      return NextResponse.json({ error: 'No se encontraron fotos para este evento.' }, { status: 404 });
    }

    const photosParaZip = usarCarpetas
      ? soloAprobados(photoPaths).filter((p) => p.approved !== false)
      : photoPaths;

    if (usarCarpetas && photosParaZip.length === 0) {
      return NextResponse.json({ error: 'No se encontraron fotos aprobadas para este evento.' }, { status: 404 });
    }

    const zip = new JSZip();
    let totalSize = 0;
    let limitExceeded = false;
    const omittedFiles: string[] = [];
    let includedCount = 0;

    for (const photo of photosParaZip) {
      let fileContent: Buffer;
      try {
        if (/^https?:\/\//i.test(photo.path)) {
          if (!isStorageUrlAllowed(photo.path)) {
            console.warn(`[SSRF Guard] Blocked download of unsafe URL: ${photo.path}`);
            omittedFiles.push(`${photo.name} (URL no permitida por seguridad)`);
            continue;
          }
          fileContent = await fetchStorageBufferWithTimeout(photo.path, MAX_TOTAL_SIZE, FETCH_TIMEOUT_MS);
        } else {
          fileContent = await leerArchivoSeguroDeFiesta(photo.path, galleryAllowedDirs, { apiPrefix });
        }

        totalSize += fileContent.length;
        if (totalSize > MAX_TOTAL_SIZE) {
          limitExceeded = true;
          omittedFiles.push(`${photo.name} (Excedió límite de 50MB)`);
          break;
        }
        const nombreLimpio = photo.name.replace(/^[\\/]+/, '').replace(/\.\./g, '_');
        const entryBase = usarCarpetas
          ? `${clasificarCarpetaEstacion(photo)}/${nombreLimpio}`
          : photo.name;
        const entryPath = usarCarpetas ? rutaUnicaEnZip(zip, entryBase) : entryBase;
        zip.file(entryPath, fileContent);
        includedCount++;
      } catch (err: any) {
        omittedFiles.push(`${photo.name} (${err?.message || 'Error al leer archivo'})`);
      }
    }

    // Manifiesto informativo de moderación y contenido
    const manifestLines = [
      '======================================================',
      'ESTADO DE RECUERDOS Y FOTOS — AK PRODUCCIONES',
      '======================================================',
      `Total de fotos registradas en el evento: ${stats.total}`,
      `Fotos incluidas en este archivo ZIP: ${includedCount}`,
      `Fotos aprobadas: ${stats.approved}`,
      `Fotos pendientes de moderación: ${stats.pending}`,
      `Fotos ocultadas por moderación: ${stats.hidden}`,
      '',
    ];

    if (stats.pending > 0 || stats.hidden > 0) {
      manifestLines.push('------------------------------------------------------');
      manifestLines.push('AVISO DE CONTENIDO PENDIENTE / OCULTO:');
      if (stats.pending > 0) {
        manifestLines.push(`• Hay ${stats.pending} foto(s) pendientes de aprobación en el Centro de Control.`);
      }
      if (stats.hidden > 0) {
        manifestLines.push(`• Hay ${stats.hidden} foto(s) que fueron ocultadas durante la fiesta.`);
      }
      manifestLines.push('Podés revisar o autorizar estas fotos desde el panel de moderación del muro social.');
      manifestLines.push('------------------------------------------------------');
      manifestLines.push('');
    }

    if (limitExceeded || omittedFiles.length > 0) {
      manifestLines.push('------------------------------------------------------');
      manifestLines.push('ARCHIVOS NO INCLUIDOS EN ESTE ZIP:');
      if (limitExceeded) {
        manifestLines.push('• Se alcanzó el tope de 50MB para descargas en un solo paquete.');
      }
      omittedFiles.forEach((file) => manifestLines.push(`• ${file}`));
      manifestLines.push('------------------------------------------------------');
    }

    zip.file('ESTADO_DE_FOTOS.txt', manifestLines.join('\n'));

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = usarCarpetas
      ? `estaciones-${safeFiestaId}-${timestamp}.zip`
      : `galeria-social-${safeFiestaId}-${timestamp}.zip`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('X-Total-Photos', String(stats.total));
    headers.set('X-Approved-Photos', String(stats.approved));
    headers.set('X-Pending-Photos', String(stats.pending));
    headers.set('X-Hidden-Photos', String(stats.hidden));

    return new NextResponse(zipBuffer as any, { status: 200, headers });

  } catch (error: any) {
    console.error(`Error creating social gallery zip for fiesta ${safeFiestaId}:`, error);
    return NextResponse.json({ error: 'Failed to create zip file.', details: error.message }, { status: 500 });
  }
}
