'use server';

import { requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import { mutateGenericJsonArray } from '@/lib/generic-json-store';
import { readData } from '@/lib/data-service';
import { uploadToStorage } from '@/lib/firebase/storage';
import { aprenderDeLoAprobado, resumirGuiaDeEstilo } from '@/lib/ia/aprender-de-lo-aprobado';
import { mejorHorario } from '@/lib/presencia-digital/mejor-horario';
import { calcularProximaFechaMejorHorario } from '@/lib/presencia-digital/publicador';
import type { SocialPost, SocialPlatform } from '@/types/social-media';
import { getFiestaById } from '@/app/actions/fiesta-actual';

export interface VideoParaSubir {
  nombre: string;
  buffer?: Buffer | ArrayBuffer | string;
  contentType?: string;
}

import {
  type RedesVideoItem,
  limpiarTextoRedes,
  plataformasParaFormato,
  contarBorradoresACrear,
} from '@/lib/presencia-digital/formato-redes';
export type { RedesVideoItem };

export interface SubirVideosOptions {
  fiestaId?: string;
  nombreEvento?: string;
  tipoEvento?: string;
  redesJson: string | RedesVideoItem[] | { videos: RedesVideoItem[] };
  archivos?: VideoParaSubir[];
}

async function generarTextoParaVideoRedes(
  estacion: string,
  tipoEvento: string = 'Evento',
  ejemplos?: string[],
): Promise<string> {
  const aprobados = ejemplos || (await aprenderDeLoAprobado('redes-sociales'));
  const guia = resumirGuiaDeEstilo(aprobados);

  const nombreEstacion = (estacion || 'la noche').charAt(0).toUpperCase() + (estacion || 'la noche').slice(1);
  const estacionTag = nombreEstacion.replace(/[\s-_]+/g, '');

  let base = '';
  if (guia.includes('cálido')) {
    base = `¡Qué noche increíble vivimos con nuestra estación de ${nombreEstacion}! La magia de este ${tipoEvento} reflejada en cada recuerdo inolvidable.`;
  } else if (guia.includes('alegre') || guia.includes('enérgico')) {
    base = `¡Pura diversión y fiesta en la estación de ${nombreEstacion}! Cada momento de este ${tipoEvento} fue único y a pura alegría.`;
  } else {
    base = `Momentos que quedan para siempre en la estación de ${nombreEstacion}. Gracias por acompañarnos en este gran ${tipoEvento}.`;
  }

  const hashtags = `#AKProducciones #EventosSalto #Fiestas #${estacionTag} #${tipoEvento.replace(/[\s-_]+/g, '')}`;
  const completo = `${base}\n\n${hashtags}`;
  return limpiarTextoRedes(completo);
}

export async function subirVideosDeLaFiesta(
  input: FormData | SubirVideosOptions
): Promise<{ success: boolean; createdCount: number; posts: SocialPost[]; error?: string }> {
  const auth = await requirePermiso(PERMISOS.CRM);
  if (!auth.ok) {
    return { success: false, createdCount: 0, posts: [], error: auth.error };
  }

  try {
    let fiestaId: string | undefined;
    let eventName: string | undefined;
    let tipoEvento: string = 'Evento';
    let redesItems: RedesVideoItem[] = [];
    const filesMap = new Map<string, { buffer: Buffer; contentType: string }>();

    if (typeof (input as any)?.get === 'function') {
      const formData = input as FormData;
      fiestaId = (formData.get('fiestaId') as string) || undefined;
      eventName = (formData.get('nombreEvento') as string) || undefined;
      tipoEvento = (formData.get('tipoEvento') as string) || 'Evento';

      const redesJsonRaw = formData.get('redesJson');
      if (typeof redesJsonRaw === 'string') {
        const parsed = JSON.parse(redesJsonRaw);
        redesItems = Array.isArray(parsed) ? parsed : (parsed?.videos || []);
      }

      const files = formData.getAll('files') as File[];
      for (const file of files) {
        if (file && typeof file.arrayBuffer === 'function') {
          const ab = await file.arrayBuffer();
          filesMap.set(file.name, {
            buffer: Buffer.from(ab),
            contentType: file.type || 'video/mp4',
          });
          if (file.name === 'redes.json' && redesItems.length === 0) {
            try {
              const text = Buffer.from(ab).toString('utf-8');
              const parsed = JSON.parse(text);
              redesItems = Array.isArray(parsed) ? parsed : (parsed?.videos || []);
            } catch {
              // ignore
            }
          }
        }
      }
    } else {
      const opts = input as SubirVideosOptions;
      fiestaId = opts.fiestaId;
      eventName = opts.nombreEvento;
      tipoEvento = opts.tipoEvento || 'Evento';

      if (typeof opts.redesJson === 'string') {
        const parsed = JSON.parse(opts.redesJson);
        redesItems = Array.isArray(parsed) ? parsed : (parsed?.videos || []);
      } else if (Array.isArray(opts.redesJson)) {
        redesItems = opts.redesJson;
      } else if (opts.redesJson && Array.isArray((opts.redesJson as any).videos)) {
        redesItems = (opts.redesJson as any).videos;
      }

      if (opts.archivos) {
        for (const f of opts.archivos) {
          let buf: Buffer;
          if (Buffer.isBuffer(f.buffer)) {
            buf = f.buffer;
          } else if (f.buffer instanceof ArrayBuffer) {
            buf = Buffer.from(f.buffer);
          } else if (typeof f.buffer === 'string') {
            buf = Buffer.from(f.buffer, 'base64');
          } else {
            buf = Buffer.from('');
          }
          filesMap.set(f.nombre, {
            buffer: buf,
            contentType: f.contentType || 'video/mp4',
          });
        }
      }
    }

    if (fiestaId && (!eventName || tipoEvento === 'Evento')) {
      try {
        const fiesta = await getFiestaById(fiestaId);
        if (fiesta) {
          eventName = eventName || fiesta.configuracion?.nombreEvento || 'Fiesta AK';
          tipoEvento = (fiesta.configuracion?.tipoCelebracion as string) || tipoEvento;
        }
      } catch {
        // use fallback
      }
    }

    eventName = eventName || 'Fiesta AK';

    if (redesItems.length === 0) {
      return { success: false, createdCount: 0, posts: [], error: 'No se encontraron videos en redes.json.' };
    }

    const ejemplos = await aprenderDeLoAprobado('redes-sociales');
    const ahora = new Date();
    const nuevosBorradores: SocialPost[] = [];

    for (let i = 0; i < redesItems.length; i++) {
      const item = redesItems[i];
      const archivoNombre = item.archivo || item.nombre || `video-${i + 1}.mp4`;
      const fileData = filesMap.get(archivoNombre);

      let mediaUrl = `/media/redes/${fiestaId || 'evento'}/${archivoNombre}`;

      if (fileData && fileData.buffer.length > 0) {
        try {
          const storagePath = `redes-videos/${fiestaId || 'general'}/${Date.now()}_${archivoNombre}`;
          mediaUrl = await uploadToStorage(fileData.buffer, storagePath, fileData.contentType, true);
        } catch (storageErr) {
          console.warn(`[VideosRedes] Error al subir video a storage: ${archivoNombre}`, storageErr);
        }
      }

      const plataformas = plataformasParaFormato(item.formato);
      const texto = await generarTextoParaVideoRedes(item.estacion, tipoEvento, ejemplos);

      for (const platform of plataformas) {
        const post: SocialPost = {
          id: `redes_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          platform,
          isGeneralCampaign: !fiestaId,
          eventId: fiestaId,
          eventName,
          publishDate: ahora.toISOString(),
          text: texto,
          mediaUrl,
          mediaType: 'video',
          status: 'Borrador',
          createdAt: ahora.toISOString(),
          updatedAt: ahora.toISOString(),
        };
        nuevosBorradores.push(post);
      }
    }

    await mutateGenericJsonArray<SocialPost>('social-posts.json', (actuales) => {
      const lista = Array.isArray(actuales) ? actuales : [];
      return [...lista, ...nuevosBorradores];
    });

    return {
      success: true,
      createdCount: nuevosBorradores.length,
      posts: nuevosBorradores,
    };
  } catch (error: any) {
    console.error('[VideosRedes] Error al procesar subida de videos:', error);
    return {
      success: false,
      createdCount: 0,
      posts: [],
      error: error?.message || 'Error al procesar la subida de videos.',
    };
  }
}

export async function publicarBorradorConUnToque(
  postId: string,
  textoEditado?: string
): Promise<{ success: boolean; post?: SocialPost; error?: string }> {
  const auth = await requirePermiso(PERMISOS.CRM);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  try {
    const todos = await readData<SocialPost[]>('social-posts.json', []);
    const postOriginal = todos.find((p) => p.id === postId);

    if (!postOriginal) {
      return { success: false, error: 'No se encontró la publicación.' };
    }

    const mejorH = mejorHorario(todos, postOriginal.platform);
    const proximaFecha = calcularProximaFechaMejorHorario(mejorH, new Date());
    const ahoraIso = new Date().toISOString();

    let postActualizado: SocialPost | undefined;

    await mutateGenericJsonArray<SocialPost>('social-posts.json', (actuales) => {
      const lista = Array.isArray(actuales) ? actuales : [];
      return lista.map((p) => {
        if (p.id === postId) {
          postActualizado = {
            ...p,
            status: 'Programado',
            publishDate: proximaFecha,
            text: textoEditado !== undefined ? textoEditado : p.text,
            updatedAt: ahoraIso,
          };
          return postActualizado;
        }
        return p;
      });
    });

    return { success: true, post: postActualizado };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error al programar la publicación.' };
  }
}

export async function descartarBorrador(
  postId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requirePermiso(PERMISOS.CRM);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  try {
    const ahoraIso = new Date().toISOString();
    await mutateGenericJsonArray<SocialPost>('social-posts.json', (actuales) => {
      const lista = Array.isArray(actuales) ? actuales : [];
      return lista.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            status: 'Descartado',
            updatedAt: ahoraIso,
          };
        }
        return p;
      });
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error al descartar el borrador.' };
  }
}
