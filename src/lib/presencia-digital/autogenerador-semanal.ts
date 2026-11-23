import 'server-only';

import type { SocialPost } from '@/types/social-media';
import { createDataItem, readData, readDataConDetalle, writeData } from '@/lib/data-service';
import { leerFiestasCrudas } from '@/lib/fiesta/leer-fiestas';
import { getReglaParaTarea } from '@/lib/ia/reglas-de-la-ia';
import { getFiestaTimeRange } from '@/lib/staff-agenda-conflicts';
import { aprenderDeLoAprobado, resumirGuiaDeEstilo } from '@/lib/ia/aprender-de-lo-aprobado';
import { fotosPromocionalesDeFiesta, validarFotosPromocionalesAlEnviar } from '@/lib/asistente/comercial-borrador';
import { hoyEnUruguay } from '@/lib/utils';
import { AK_PLAY_STORE_URL } from '@/lib/public-contact';
import type { AjustesPublicarSolo } from '@/lib/presencia-digital/publicador';

const POSTS_FILE = 'social-posts.json';
const POSTS_COLLECTION = 'social_posts';
const AJUSTES_PRESENCIA_FILE = 'presencia-digital-ajustes.json';
const ANUNCIO_APP_POST_ID = 'anuncio-app-play-store';

export interface AutoGeneracionSemanasResult {
  success: boolean;
  createdCount: number;
  tipoOrigen: 'fiesta_reciente' | 'preguntas_frecuentes' | 'sin_material';
  motivo?: string;
  posts: SocialPost[];
}

/**
 * Llena el calendario semanal de redes de forma desatendida:
 * - Si hubo fiesta en los últimos 7 días: toma sus fotos.
 * - Si es una semana floja (sin fiestas recientes): no reutiliza fotos sin permiso verificable.
 * - Si no hay ninguna foto en el sistema: informa sin inventar.
 */
export async function autoGenerarBorradoresSemanales(): Promise<AutoGeneracionSemanasResult> {
  if (await getReglaParaTarea('borradores_redes_posfiesta') === 'apagada') {
    return { success: true, createdCount: 0, tipoOrigen: 'sin_material', motivo: 'Los borradores de redes están apagados.', posts: [] };
  }
  const fiestas = await leerFiestasCrudas(false);
  const hoy = hoyEnUruguay(new Date());
  const candidatas = fiestas.filter((fiesta) => {
    const fecha = fiesta.configuracion?.fechaEvento?.slice(0, 10);
    if (!fiesta.id || !fecha || fecha >= hoy || fiesta.id.startsWith('demo_')) return false;
    const estado = String(fiesta.estado || '').trim().toLocaleLowerCase('es-UY');
    return !['suspendida', 'suspendido', 'cancelada', 'cancelado', 'archivada', 'archivado'].includes(estado);
  }).sort((a, b) => String(b.configuracion?.fechaEvento || '').localeCompare(String(a.configuracion?.fechaEvento || '')));
  const creados: SocialPost[] = [];
  let createdCount = 0;
  for (const fiesta of candidatas.slice(0, 20)) {
    const result = await generarBorradoresPosfiesta(fiesta.id, fiesta.configuracion!.fechaEvento!.slice(0, 10));
    createdCount += result.createdCount;
    if (result.createdCount > 0) creados.push(...result.posts.filter((post) => post.status === 'Borrador'));
  }

  if (typeof readData === 'function' && typeof writeData === 'function') {
    try {
      const settings = await readData<AjustesPublicarSolo>(AJUSTES_PRESENCIA_FILE, { activo: true });
      if (!settings?.anuncioAppCreado) {
        const ahora = new Date();
        const borradorApp: SocialPost = {
          id: ANUNCIO_APP_POST_ID,
          sourceId: ANUNCIO_APP_POST_ID,
          platform: 'Instagram',
          isGeneralCampaign: true,
          publishDate: new Date(ahora.getTime() + 12 * 60 * 60 * 1000).toISOString(),
          text: `¡Ya tenemos app! Bajala gratis en Google Play: presupuesto al instante, fotos de tu fiesta y más\n\n${AK_PLAY_STORE_URL}`,
          status: 'Borrador',
          createdAt: ahora.toISOString(),
          updatedAt: ahora.toISOString(),
        };
        try {
          await createDataItem(POSTS_FILE, POSTS_COLLECTION, borradorApp.id, borradorApp);
          createdCount++;
          creados.push(borradorApp);
        } catch (err) {
          const actuales = await readDataConDetalle<SocialPost[]>(POSTS_FILE, []);
          const yaExiste = !actuales.huboFalla && actuales.valor.some((item) => item.id === borradorApp.id);
          if (!yaExiste) {
            console.warn('[autogenerador-semanal] No se pudo crear el borrador del anuncio de la app:', err);
          }
        }
        await writeData(AJUSTES_PRESENCIA_FILE, {
          ...settings,
          activo: settings?.activo ?? true,
          anuncioAppCreado: true,
          actualizadoAt: ahora.toISOString(),
        });
      }
    } catch (err) {
      console.warn('[autogenerador-semanal] No se pudo revisar/marcar anuncioAppCreado:', err);
    }
  }

  return { success: true, createdCount, tipoOrigen: createdCount ? 'fiesta_reciente' : 'sin_material',
    ...(createdCount ? {} : { motivo: 'No se crearon borradores nuevos: los existentes se conservan y solo se usa material autorizado.' }), posts: creados };
}

export async function generarBorradoresPosfiesta(
  fiestaId: string,
  fechaEvento: string,
  ahora = new Date(),
): Promise<{ createdCount: number; posts: SocialPost[]; motivo?: string }> {
  if (await getReglaParaTarea('borradores_redes_posfiesta') === 'apagada') {
    return { createdCount: 0, posts: [], motivo: 'Los borradores de redes están apagados.' };
  }
  if (!fiestaId || !/^\d{4}-\d{2}-\d{2}$/.test(fechaEvento)) return { createdCount: 0, posts: [], motivo: 'Fiesta o fecha inválida.' };
  const hoy = hoyEnUruguay(ahora);
  const [anio, mes, dia] = fechaEvento.split('-').map(Number);
  const diaSiguiente = new Date(Date.UTC(anio, mes - 1, dia + 1, 12)).toISOString().slice(0, 10);
  if (hoy < diaSiguiente) return { createdCount: 0, posts: [], motivo: 'Todavía no corresponde preparar los borradores posfiesta.' };
  const [fiestasResult, postsResult] = await Promise.all([
    leerFiestasCrudas(false),
    readDataConDetalle<SocialPost[]>(POSTS_FILE, []),
  ]);
  if (postsResult.huboFalla) throw new Error('No se pudo verificar el calendario de redes; se reintentará.');
  const fiestas = fiestasResult;
  const existentes = postsResult.valor;
  const fiesta = fiestas.find((item) => item.id === fiestaId && item.configuracion?.fechaEvento?.slice(0, 10) === fechaEvento);
  if (!fiesta) return { createdCount: 0, posts: [], motivo: 'No se encontró la fiesta confirmada.' };
  const rango = getFiestaTimeRange(fiesta);
  if (!rango) return { createdCount: 0, posts: [], motivo: 'No se pudo confirmar la hora de finalización del evento.' };
  if (ahora.getTime() < rango.endMs) return { createdCount: 0, posts: [], motivo: 'La fiesta todavía no terminó.' };
  const propias = await fotosPromocionalesDeFiesta(fiestaId);
  if (!propias.length) return { createdCount: 0, posts: [], motivo: 'No hay fotos elegibles con consentimiento promocional vigente.' };
  const baseId = `posfiesta-${fiestaId}-${fechaEvento}`;
  const existentesDeFiesta = existentes.filter((post) => post.sourceId?.startsWith(baseId));
  if (existentesDeFiesta.length >= 2) return { createdCount: 0, posts: existentesDeFiesta, motivo: 'Los borradores posfiesta ya existen.' };
  const ejemplos = await aprenderDeLoAprobado('redes-sociales');
  const guia = resumirGuiaDeEstilo(ejemplos);
  const photo = propias[0];
  const nombre = fiesta.configuracion?.nombreEvento || 'la fiesta';
  const postId = `${baseId}-publicacion`;
  const post: SocialPost = {
    id: postId, sourceId: `${baseId}-publicacion`, platform: 'Instagram',
    isGeneralCampaign: false, eventId: fiestaId, eventName: nombre,
    publishDate: new Date(ahora.getTime() + 86400000).toISOString(),
    text: guia.includes('cálido')
      ? 'Gracias de corazón por confiar en AK Producciones para acompañar este evento.\n\n#AKProducciones #EventosSalto'
      : 'Gracias por confiar en AK Producciones para acompañar este evento.\n\n#AKProducciones #EventosSalto',
    mediaUrl: photo.url, mediaType: 'image', status: 'Borrador',
    createdAt: ahora.toISOString(), updatedAt: ahora.toISOString(),
  };
  const guion: SocialPost = {
    id: `${baseId}-video-guion`, sourceId: `${baseId}-video-guion`, platform: 'Instagram',
    isGeneralCampaign: false, eventId: fiestaId, eventName: nombre,
    publishDate: post.publishDate,
    text: 'Guion pendiente de archivo: abrir con agradecimiento, incluir únicamente la foto aprobada y cerrar con la marca. No se creó ni adjuntó video.',
    status: 'Borrador', createdAt: ahora.toISOString(), updatedAt: ahora.toISOString(),
  };
  const consentimiento = await validarFotosPromocionalesAlEnviar([photo.id]);
  if (!consentimiento.allowed) return { createdCount: 0, posts: [], motivo: 'El consentimiento de la foto ya no está vigente.' };
  let createdCount = 0;
  const guardados: SocialPost[] = [];
  for (const borrador of [post, guion]) {
    try {
      if (borrador === post) {
        await createDataItem(POSTS_FILE, POSTS_COLLECTION, borrador.id, { ...borrador, promotionalPhotoIds: [photo.id] });
      } else {
        await createDataItem(POSTS_FILE, POSTS_COLLECTION, borrador.id, borrador);
      }
      createdCount++;
      guardados.push(borrador);
    } catch (error) {
      const actuales = await readDataConDetalle<SocialPost[]>(POSTS_FILE, []);
      if (actuales.huboFalla) throw error;
      const ganador = actuales.valor.find((item) => item.id === borrador.id);
      if (!ganador) throw error;
      guardados.push(ganador);
    }
  }
  return { createdCount, posts: guardados };
}

