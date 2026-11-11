import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import { fotosPromocionalesDeFiesta, tienePermisoPromocional } from '@/lib/asistente/comercial-borrador';
import { getFiestaById } from '@/app/actions/fiesta-actual';
import { construirEstiloJson } from '@/lib/video-vida/estilo-video';

const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_DOMAINS = [
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  'lh3.googleusercontent.com',
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

export function mapearEstacionCarpeta(sourceModule?: string | null): string {
  if (!sourceModule) return 'muro';
  const mod = sourceModule.toLowerCase().trim().replace(/_/g, '-');
  if (mod.includes('fotocabina')) return 'fotocabina';
  if (mod.includes('360')) return 'plataforma-360';
  if (mod.includes('vogue') || mod.includes('bogue') || mod.includes('boomerang')) return 'vogue';
  if (mod.includes('espejo')) return 'espejo';
  if (mod.includes('pantalla') || mod.includes('totem')) return 'pantalla-gigante';
  if (mod.includes('barra') || mod.includes('trago')) return 'barra';
  return 'muro';
}

function nombreDe(url: string, id: string, mediaType?: string): string {
  if (url.startsWith('data:')) {
    const ext = mediaType === 'video' ? 'mp4' : 'jpg';
    return `${id}.${ext}`;
  }
  const crudo = url.split('/').pop()?.split('?')[0] || `${id}.${mediaType === 'video' ? 'mp4' : 'jpg'}`;
  try {
    const dec = decodeURIComponent(crudo).split('/').pop() || crudo;
    if (!dec.includes('.')) {
      return `${dec}.${mediaType === 'video' ? 'mp4' : 'jpg'}`;
    }
    return dec;
  } catch {
    return crudo;
  }
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const auth = await requirePermiso(PERMISOS.CRM);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const params = await props.params;
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'El ID de la fiesta es obligatorio.' }, { status: 400 });
  }

  const permitido = await tienePermisoPromocional(id);
  if (!permitido) {
    return NextResponse.json(
      { error: 'Esta fiesta no tiene permiso para usar las fotos en redes' },
      { status: 403 }
    );
  }

  try {
    const fotos = await fotosPromocionalesDeFiesta(id);
    const fiesta = await getFiestaById(id).catch(() => null);

    const zip = new JSZip();
    let totalSize = 0;
    const usados = new Map<string, number>();

    const nombreSinRepetir = (carpeta: string, nombre: string) => {
      const clave = `${carpeta}/${nombre}`;
      const veces = (usados.get(clave) || 0) + 1;
      usados.set(clave, veces);
      if (veces === 1) return nombre;
      const punto = nombre.lastIndexOf('.');
      return punto > 0 ? `${nombre.slice(0, punto)}-${veces}${nombre.slice(punto)}` : `${nombre}-${veces}`;
    };

    for (const foto of fotos) {
      const carpeta = mapearEstacionCarpeta(foto.sourceModule);
      const nombreBase = nombreDe(foto.url, foto.id, foto.mediaType);
      const nombreFinal = nombreSinRepetir(carpeta, nombreBase);

      let fileContent: Buffer | null = null;
      try {
        if (foto.url.startsWith('data:')) {
          const parts = foto.url.split(',');
          if (parts[1]) {
            fileContent = Buffer.from(parts[1], 'base64');
          }
        } else if (foto.url.startsWith('http://') || foto.url.startsWith('https://')) {
          if (!isUrlAllowed(foto.url)) {
            console.warn(`[SSRF Guard] URL no permitida: ${foto.url}`);
            continue;
          }
          const res = await fetch(foto.url);
          if (res.ok) {
            fileContent = Buffer.from(await res.arrayBuffer());
          }
        } else {
          const fs = await import('fs/promises');
          const path = await import('path');
          const base = path.resolve(process.cwd());
          const ruta = path.resolve(base, foto.url);
          if (ruta.startsWith(base + path.sep)) {
            fileContent = await fs.readFile(ruta);
          }
        }
      } catch (err) {
        console.warn(`[Material Redes] Error al descargar foto ${foto.id}:`, err);
        continue;
      }

      if (fileContent) {
        totalSize += fileContent.length;
        if (totalSize > MAX_TOTAL_SIZE) {
          zip.file('AVISO_LIMITE.txt', 'Se alcanzó el límite máximo de 100MB de descarga de material.');
          break;
        }
        zip.file(`${carpeta}/${nombreFinal}`, fileContent);
      }
    }

    const estilo = construirEstiloJson(fiesta);
    zip.file('estilo.json', JSON.stringify(estilo, null, 2));

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const zipFilename = `material-redes-${id}.zip`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${zipFilename}"`);
    headers.set('X-Fotos-Incluidas', String(fotos.length));

    return new NextResponse(zipBuffer as any, { status: 200, headers });
  } catch (error: any) {
    console.error(`[Material Redes] Error al generar material para redes de fiesta ${id}:`, error);
    return NextResponse.json({ error: 'Error al generar material para redes.', details: error.message }, { status: 500 });
  }
}
