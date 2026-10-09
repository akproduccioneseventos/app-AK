'use server';

import path from 'path';
import { LECTURA_COMPLETA } from '@/lib/fiesta/lectura-completa';
import { getFiestaById, saveFiesta } from './fiesta.actions';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { createSocialMediaPostFromUrlForStation } from '@/app/actions/social-gallery';
import { uploadToStorage } from '@/lib/firebase/storage';
import { checkImageSafety } from '@/lib/social-fiesta/content-safety-ai';
import { requireAppSession } from '@/lib/auth/require-session';
import { requireEventPermission } from '@/lib/auth/event-access';
import { PERMISOS } from '@/lib/auth/perfiles';
import {
  createEntertainmentAccessToken,
  hasEntertainmentGuestAccess,
} from '@/lib/auth/entertainment-token';
import {
  getEntertainmentStationConfig,
  getPublicEntertainmentEvent as buildPublicEntertainmentEvent,
  isEntertainmentModuleId,
  type EntertainmentModuleId,
} from '@/lib/entertainment/station-config';
import * as logger from '@/lib/logger';
import { segundosDelPermisoDelAfiche } from '@/lib/entertainment/vigencia-del-afiche';
import { copiarConfiguracion } from '@/lib/entertainment/copiar-configuracion';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const MAX_ENTERTAINMENT_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_ENTERTAINMENT_VIDEO_SIZE = 60 * 1024 * 1024;

const MODULE_MOMENT_TAGS: Record<string, string> = {
  fotocabina: 'Fotocabina',
  plataforma360: 'Plataforma 360',
  bogue: 'Bogue',
  espejoMagico: 'Espejo Magico',
  espejoMagicoFoto: 'Espejo Mágico Foto',
  espejoMagicoFirma: 'Espejo Mágico Firma',
  espejoMagicoIA: 'Espejo Mágico IA',
  totems: 'Tótems Interactivos',
  capsulaTiempo: 'Cápsula del Tiempo',
};
const VALID_ENTERTAINMENT_MODULE_IDS = new Set(Object.keys(MODULE_MOMENT_TAGS));
/** Nombre de la ruta de la pantalla -> nombre del módulo. */
const ALIAS_DE_MODULO: Record<string, string> = {
  'plataforma-360': 'plataforma360',
  'espejo-magico': 'espejoMagico',
};

function normalizeEntertainmentData(data: any) {
  return {
    ...(data || {}),
    updatedAt: new Date().toISOString(),
  };
}

function getStoredEntertainment(fiesta: any) {
  return fiesta?.others?.entretenimiento || null;
}

export async function getEntretenimientoFiesta(fiestaId: string) {
  try {
    await requireAppSession();
    const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
    if (!fiesta) throw new Error('Fiesta no encontrada');

    return {
      success: true,
      fiesta,
      data: getStoredEntertainment(fiesta),
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo cargar entretenimiento.' };
  }
}

export async function getPublicEntertainmentEvent(
  fiestaId: string,
  moduleId: string,
  accessToken?: string
) {
  try {
    if (!isEntertainmentModuleId(moduleId)) {
      return { success: false, error: 'Modulo de entretenimiento no valido.' };
    }
    const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
    if (!fiesta) return { success: false, error: 'Evento no encontrado.' };
    if (!(await hasEntertainmentGuestAccess(fiestaId, moduleId, accessToken))) {
      return { success: false, error: 'Esta estación todavía no está habilitada. Pedile al equipo de AK que la active desde el panel de la fiesta.' };
    }
    const station = getEntertainmentStationConfig(fiesta, moduleId);
    if (!station.enabled) {
      return { success: false, error: 'Esta estacion no esta habilitada para el evento.' };
    }
    return {
      success: true,
      event: buildPublicEntertainmentEvent(fiesta, moduleId),
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo cargar el evento.' };
  }
}

export async function getEntertainmentLaunchToken(
  fiestaId: string,
  moduleId: EntertainmentModuleId
) {
  try {
    // El permiso de operador de la estación abre el control de la noche: no se le da a cualquiera
    // con sesión (Codex, auditoría 66). Noche u organización, y el operador sólo en su fiesta.
    await requireEventPermission(fiestaId, [PERMISOS.NOCHE, PERMISOS.ORGANIZACION]);
    if (!isEntertainmentModuleId(moduleId)) {
      return { success: false, error: 'Modulo de entretenimiento no valido.' };
    }
    const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
    if (!fiesta) return { success: false, error: 'Evento no encontrado.' };
    return {
      success: true,
      guestToken: createEntertainmentAccessToken(fiestaId, moduleId, 'guest'),
      operatorToken: createEntertainmentAccessToken(fiestaId, moduleId, 'operator'),
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Sesion no autorizada.' };
  }
}

/**
 * Permiso para el QR del afiche impreso del muro (28/09/2026). Lo pide sólo el equipo al abrir el
 * afiche para imprimirlo; es el mismo permiso de invitado del tótem, pero dura hasta el fin del día
 * siguiente a la fiesta (`segundosDelPermisoDelAfiche`), porque el papel se imprime días antes.
 */
export async function getPermisoDelAfiche(fiestaId: string) {
  try {
    await requireAppSession();
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false as const, error: 'Evento no encontrado.' };
    const segundos = segundosDelPermisoDelAfiche(fiesta.configuracion?.fechaEvento);
    if (segundos <= 0) {
      return { success: false as const, error: 'La fiesta no tiene fecha cargada o ya pasó.' };
    }
    return {
      success: true as const,
      permiso: createEntertainmentAccessToken(fiestaId, 'totems', 'guest', segundos),
    };
  } catch (error: any) {
    return { success: false as const, error: error.message || 'Sesion no autorizada.' };
  }
}

export async function saveEntretenimientoFiesta(fiestaId: string, entretenimiento: any) {
  try {
    await requireAppSession();
    const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
    if (!fiesta) throw new Error('Fiesta no encontrada');

    const nextEntertainment = normalizeEntertainmentData(entretenimiento);
    const updatedFiesta = {
      ...fiesta,
      others: {
        ...(fiesta.others || {}),
        entretenimiento: nextEntertainment,
      },
    };

    const result = await saveFiesta(updatedFiesta);
    if (!result.success) throw new Error(result.error || 'No se pudo guardar entretenimiento.');

    return { success: true, data: nextEntertainment };
  } catch (error: any) {
    return { success: false, error: error.message || 'No se pudo guardar entretenimiento.' };
  }
}

export async function uploadEntretenimientoMedia(formData: FormData) {
  const fiestaId = String(formData.get('fiestaId') || '');
  // La pantalla de la 360 (y las capturas que ya quedaron en cola sin señal) mandan el nombre de
  // la ruta, `plataforma-360`; el módulo se llama `plataforma360`. Se rechazaba y quedaba "1
  // esperando subida" para siempre (Codex, auditoría 83, ENT83-360). Sólo se traducen los
  // nombres de ruta conocidos: un módulo cualquiera sigue rechazado.
  const moduleIdRecibido = String(formData.get('moduleId') || '');
  const moduleId = ALIAS_DE_MODULO[moduleIdRecibido] ?? moduleIdRecibido;
  const caption = String(formData.get('caption') || '');
  const authorName = String(formData.get('authorName') || 'AK Producciones');
  const accessToken = String(formData.get('accessToken') || '');
  const file = formData.get('file') as File | null;

  if (!fiestaId || !moduleId || !file) {
    return { success: false, error: 'Faltan datos para subir el archivo.' };
  }

  if (!VALID_ENTERTAINMENT_MODULE_IDS.has(moduleId)) {
    return { success: false, error: 'El modulo de entretenimiento no es valido.' };
  }

  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    return { success: false, error: 'Solo se aceptan fotos o videos.' };
  }

  const maxUploadSize = file.type.startsWith('video/')
    ? MAX_ENTERTAINMENT_VIDEO_SIZE
    : MAX_ENTERTAINMENT_IMAGE_SIZE;
  if (file.size > maxUploadSize) {
    return {
      success: false,
      error: file.type.startsWith('video/')
        ? 'El video no puede superar 60MB.'
        : 'La imagen no puede superar 10MB.',
    };
  }

  try {
    if (!(await hasEntertainmentGuestAccess(fiestaId, moduleId, accessToken))) {
      return { success: false, error: 'Esta estación todavía no está habilitada. Pedile al equipo de AK que la active desde el panel de la fiesta.' };
    }
    const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
    if (!fiesta) throw new Error('Fiesta no encontrada');
    if (!isEntertainmentModuleId(moduleId)) {
      return { success: false, error: 'El modulo de entretenimiento no es valido.' };
    }
    const station = getEntertainmentStationConfig(fiesta, moduleId);
    if (!station.enabled) {
      return { success: false, error: 'Esta estacion fue desactivada.' };
    }

    const extension = path.extname(file.name || '') || (file.type.startsWith('video/') ? '.mp4' : '.jpg');
    // Una captura guardada sin senal trae su propio identificador. Si el reenvio llega
    // dos veces (el servidor la guardo pero la respuesta se corto), la segunda no se
    // publica de nuevo: sin esto la misma foto aparecia dos veces en la pantalla grande.
    const clientMediaId = String(formData.get('clientMediaId') || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    const mediaId = clientMediaId
      ? `ent_${clientMediaId}`
      : `ent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (clientMediaId) {
      const yaGuardada = (getStoredEntertainment(fiesta)?.modules?.[moduleId]?.media || [])
        .find((item: { id?: string }) => item.id === mediaId);
      if (yaGuardada) return { success: true, media: yaGuardada, duplicate: true };
    }
    const storagePath = `entertainment/${fiestaId}/${moduleId}/${mediaId}${extension}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const esVideo = file.type.startsWith('video/');

    /**
     * Todo lo que sale de una estacion va a la pantalla grande de la fiesta, asi
     * que antes se revisa. Hasta ahora no se revisaba nada: la fotocabina, el
     * espejo, la plataforma 360 y el boomerang publicaban directo.
     *
     * Las fotos pasan por el analisis automatico y se rechazan en el acto si dan
     * riesgo de contenido adulto o violento. Los videos no se pueden analizar
     * solos, y las fotos tampoco cuando el analisis no esta disponible: en esos
     * casos la publicacion queda esperando el visto bueno del equipo en vez de
     * salir a la pantalla.
     */
    let revisionManual = esVideo;
    if (!esVideo) {
      const seguridad = await checkImageSafety(buffer);
      if (!seguridad.safe) {
        return { success: false, error: 'La foto fue bloqueada por riesgo de contenido inapropiado.' };
      }
      if (seguridad.reason === 'error') revisionManual = true;
    }

    // De quien es la foto. Va con su enlace personal porque el identificador
    // solo no prueba nada: sin el token, cualquiera podria mandar el de otro
    // invitado y esas fotos le apareceran a esa persona en su recuerdo. Quien
    // comprueba es el muro, no esta pantalla.
    const guestId = (formData.get('guestId') as string) || undefined;
    const guestAccessToken = (formData.get('guestAccessToken') as string) || undefined;
    const url = await uploadToStorage(buffer, storagePath, file.type, true);

    const socialPostResult = await createSocialMediaPostFromUrlForStation({
      fiestaId,
      mediaUrl: url,
      revisionManual,
      mediaType: esVideo ? 'video' : 'image',
      authorName,
      guestId,
      guestAccessToken,
      caption,
      source: 'entertainment',
      sourceModule: moduleId,
      momentTag: MODULE_MOMENT_TAGS[moduleId] || 'Entretenimiento',
      // Con identidad de la captura, el posteo también es fijo: un reintento no lo duplica.
      ...(clientMediaId ? { postId: `post_${mediaId}` } : {}),
    }, accessToken);

    const mediaItem = {
      id: mediaId,
      moduleId,
      fileName: file.name || `${mediaId}${extension}`,
      url,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      caption,
      authorName,
      // El dueño se toma de lo que GUARDO el muro, no de lo que llego en el
      // formulario: el muro es el que comprueba el comprobante del invitado. Si el
      // comprobante no valia, el muro no guarda dueño y aca tampoco.
      //
      // Antes se guardaba el identificador tal como llego, sin comprobar. No era
      // grave —el recuerdo del invitado sale del muro, no de aca— pero el mismo
      // dato quedaba comprobado en un lado y sin comprobar en el otro, que es como
      // empiezan los errores raros.
      guestId: socialPostResult.post?.guestId,
      uploadedAt: new Date().toISOString(),
      publishTarget: 'muro-social',
      socialPostId: socialPostResult.post?.id,
      syncStatus: socialPostResult.success ? 'publicado' : 'pendiente',
    };

    // ESCRITURA ANGOSTA (Codex, auditoría 83, ENT83-GUEST). Antes se guardaba la fiesta entera
    // con `saveFiesta`, que pide sesión del equipo o del portal: el invitado con el permiso de
    // ESTA estación sacaba la foto y el guardado se la rechazaba ("No autorizado para modificar
    // este evento"). El permiso de la estación ya se comprobó arriba; acá se agrega SOLO este
    // recuerdo, adentro de la transacción de la fiesta (sobre lo último guardado, sin pisar
    // capturas que llegan a la vez), y no se toca nada más. No le da al invitado permiso para
    // editar la fiesta.
    let nextEntertainment: any = null;
    const result = await actualizarFiesta(fiestaId, (fresca) => {
      const current = getStoredEntertainment(fresca) || {};
      const modules = { ...(current.modules || {}) };
      const entertainmentModule = { ...(modules[moduleId] || {}) };
      entertainmentModule.media = [
        mediaItem,
        ...(entertainmentModule.media || []).filter((item: { id?: string }) => item.id !== mediaItem.id),
      ];
      modules[moduleId] = entertainmentModule;
      nextEntertainment = normalizeEntertainmentData({ ...current, modules });
      return {
        ...fresca,
        others: { ...(fresca.others || {}), entretenimiento: nextEntertainment },
      };
    }, { publicRsvp: true });

    if (!result.success) throw new Error(result.error || 'No se pudo guardar la captura.');

    return { success: true, media: mediaItem, data: nextEntertainment };
  } catch (error: any) {
    logger.error('[entretenimiento] upload failed', error);
    return { success: false, error: error.message || 'No se pudo subir el archivo.' };
  }
}

export async function aplicarCopiaDeConfiguracion(fiestaOrigenId: string, fiestaDestinoId: string) {
  try {
    await requireAppSession();
    const [fiestaOrigen, fiestaDestino] = await Promise.all([
      getFiestaById(fiestaOrigenId, LECTURA_COMPLETA),
      getFiestaById(fiestaDestinoId, LECTURA_COMPLETA),
    ]);

    if (!fiestaOrigen) return { success: false as const, error: 'No se encontró la fiesta de origen.' };
    if (!fiestaDestino) return { success: false as const, error: 'No se encontró la fiesta de destino.' };

    const fiestaActualizada = copiarConfiguracion(fiestaOrigen, fiestaDestino) as FiestaEnPlanificacion;

    const result = await saveFiesta(fiestaActualizada);
    if (!result.success) return { success: false as const, error: result.error || 'No se pudo guardar la configuración copiada.' };

    return {
      success: true as const,
      fiesta: fiestaActualizada,
      data: fiestaActualizada.others?.entretenimiento,
    };
  } catch (error: any) {
    return { success: false as const, error: error.message || 'Error al copiar configuración.' };
  }
}
