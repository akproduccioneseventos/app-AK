import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getPhotoFilePathsForZip } from '@/app/actions/social-gallery';
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
    const { photos: photoPaths, stats } = await getPhotoFilePathsForZip(fiestaId);
    
    if (photoPaths.length === 0) {
      return NextResponse.json({ error: 'No se encontraron fotos para este evento.' }, { status: 404 });
    }

    const zip = new JSZip();
    let totalSize = 0;
    let limitExceeded = false;
    const omittedFiles: string[] = [];
    let includedCount = 0;
    
    for (const photo of photoPaths) {
      let fileContent: Buffer;
      try {
        if (photo.path.startsWith('https://') || photo.path.startsWith('http://')) {
          if (!isUrlAllowed(photo.path)) {
            console.warn(`[SSRF Guard] Blocked download of unsafe URL: ${photo.path}`);
            omittedFiles.push(`${photo.name} (URL no permitida por seguridad)`);
            continue;
          }
          const res = await fetch(photo.path);
          if (!res.ok) {
            omittedFiles.push(`${photo.name} (Error HTTP ${res.status})`);
            continue;
          }
          fileContent = Buffer.from(await res.arrayBuffer());
        } else {
          const fs = await import('fs/promises');
          fileContent = await fs.readFile(photo.path);
        }

        totalSize += fileContent.length;
        if (totalSize > MAX_TOTAL_SIZE) {
          limitExceeded = true;
          omittedFiles.push(`${photo.name} (Excedió límite de 50MB)`);
          break;
        }
        zip.file(photo.name, fileContent);
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
    const filename = `galeria-social-${fiestaId}-${timestamp}.zip`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('X-Total-Photos', String(stats.total));
    headers.set('X-Approved-Photos', String(stats.approved));
    headers.set('X-Pending-Photos', String(stats.pending));
    headers.set('X-Hidden-Photos', String(stats.hidden));

    return new NextResponse(zipBuffer as any, { status: 200, headers });

  } catch (error: any) {
    console.error(`Error creating social gallery zip for fiesta ${fiestaId}:`, error);
    return NextResponse.json({ error: 'Failed to create zip file.', details: error.message }, { status: 500 });
  }
}
