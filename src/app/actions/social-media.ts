
'use server';

import type { SocialPost } from '@/types/social-media';
import { readData, writeData } from '@/lib/data-service';
import fs from 'fs/promises';
import path from 'path';
import { requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import { MARKETING_AUTOMATION_INTERNAL_TOKEN } from '@/lib/marketing/internal-token';
import { getPublicInstagramFeed } from '@/lib/instagram/public-feed';
import { classifyGalleryCategories } from '@/components/landing/gallery-media-utils';
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';
import { chatWithMarketingAgent } from '@/ai/flows/marketing-agent-flow';
import { publishPostInternal } from '@/lib/presencia-digital/publicador';

const POSTS_FILE = 'social-posts.json';
const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const ASSETS_DIR_NAME = 'social-media-assets';
const assetsDirectoryPath = path.join(DATA_DIR, ASSETS_DIR_NAME);

export async function publicarPosteoAhoraAction(
  postId: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  const permiso = await requirePermiso(PERMISOS.CRM);
  if (!permiso.ok) return { success: false, error: permiso.error };

  const result = await publishPostInternal(postId);
  if (result.success) {
    if (result.readyForManualCopy) {
      return {
        success: true,
        message: 'La publicación quedó lista para copiar y publicar en la red elegida.',
      };
    }
    return {
      success: true,
      message: `Publicado con éxito en: ${(result.publishedTo || []).join(', ')}`,
    };
  }

  const failDetails = (result.failedPlatforms || [])
    .map((f) => `${f.platform}: ${f.reason}`)
    .join('; ');
  return {
    success: false,
    error: failDetails || result.error || 'No se pudo publicar el posteo.',
  };
}

type InstagramFeedPost = {
  id: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  videoUrl?: string;
  text: string;
  likes: number;
};

async function ensureDataDirectoriesExist() {
  try { await fs.access(DATA_DIR); } catch { await fs.mkdir(DATA_DIR, { recursive: true }); }
  try { await fs.access(assetsDirectoryPath); } catch { await fs.mkdir(assetsDirectoryPath, { recursive: true }); }
}
ensureDataDirectoriesExist();

export async function getSocialPosts(): Promise<SocialPost[]> {
  const permiso = await requirePermiso(PERMISOS.CRM);
  if (!permiso.ok) return [];
  return readData<SocialPost[]>(POSTS_FILE, []);
}

export async function saveSocialPost(
  formData: FormData
): Promise<{ success: boolean; post?: SocialPost; error?: string }> {
  const permiso = await requirePermiso(PERMISOS.CRM);
  if (!permiso.ok) return { success: false, error: permiso.error };
  let posts = await getSocialPosts();
  const postId = (formData.get('id') as string) || `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const mediaFile = formData.get('mediaFile') as File | null;

  let mediaUrl: string | undefined = formData.get('existingMediaUrl') as string || undefined;
  let mediaType: 'image' | 'video' | undefined = formData.get('existingMediaType') as 'image' | 'video' || undefined;

  if (mediaFile && mediaFile.size > 0) {
    try {
      const fileExtension = path.extname(mediaFile.name);
      const newFilename = `${postId}${fileExtension}`;
      const filePath = path.join(assetsDirectoryPath, newFilename);
      const bytes = await mediaFile.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(bytes));

      mediaUrl = `/api/social-media-assets/${newFilename}`;
      mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
    } catch (fileError: any) {
      return { success: false, error: `Error al guardar el archivo multimedia: ${fileError.message}` };
    }
  }

  const postData: Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt'> = {
    platform: formData.get('platform') as SocialPost['platform'],
    isGeneralCampaign: formData.get('isGeneralCampaign') === 'true',
    eventId: formData.get('eventId') as string || undefined,
    eventName: formData.get('eventName') as string || undefined,
    publishDate: formData.get('publishDate') as string,
    text: formData.get('text') as string,
    link: formData.get('link') as string || undefined,
    status: (formData.get('status') as SocialPost['status']) || 'Programado',
    promotionCost: Number(formData.get('promotionCost')) || undefined,
    performance: {
        likes: Number(formData.get('performance.likes')) || undefined,
        views: Number(formData.get('performance.views')) || undefined,
        interactions: Number(formData.get('performance.interactions')) || undefined,
    },
    mediaUrl,
    mediaType,
  };

  const existingIndex = posts.findIndex(p => p.id === postId);
  let finalPost: SocialPost;

  if (existingIndex > -1) {
    finalPost = { ...posts[existingIndex], ...postData, updatedAt: new Date().toISOString() };
    posts[existingIndex] = finalPost;
  } else {
    finalPost = { ...postData, id: postId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    posts.push(finalPost);
  }

  await writeData(POSTS_FILE, posts, (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
  return { success: true, post: finalPost };
}


export async function deleteSocialPost(postId: string): Promise<{ success: boolean, error?: string }> {
  const permiso = await requirePermiso(PERMISOS.CRM);
  if (!permiso.ok) return { success: false, error: permiso.error };
  let posts = await getSocialPosts();
  const postToDelete = posts.find(p => p.id === postId);

  if (!postToDelete) return { success: false, error: "Publicación no encontrada." };

  if (postToDelete.mediaUrl) {
    try {
      const filename = path.basename(postToDelete.mediaUrl);
      const filePath = path.join(assetsDirectoryPath, filename);
      await fs.unlink(filePath);
    } catch (fileError: any) {
      console.warn(`Could not delete media file for post ${postId}: ${fileError.message}`);
    }
  }

  const updatedPosts = posts.filter(p => p.id !== postId);
  await writeData(POSTS_FILE, updatedPosts);
  return { success: true };
}

/**
 * Algoritmo de Sincronización Inteligente de Instagram
 * Obtiene publicaciones simuladas/reales del Feed de Instagram de AK Producciones y:
 *  - Clasifica las fotos en el catálogo público usando expresiones regulares.
 *  - Inserta los reels/videos en la sección de videos de la Galería pública junto a los de YouTube.
 */
export async function syncInstagramPosts(
  internalToken?: symbol
): Promise<{ success: boolean; photosCount: number; videosCount: number; plannerCount: number; error?: string }> {
  if (internalToken !== MARKETING_AUTOMATION_INTERNAL_TOKEN) {
    const permiso = await requirePermiso(PERMISOS.CRM);
    if (!permiso.ok) {
      return { success: false, photosCount: 0, videosCount: 0, plannerCount: 0, error: permiso.error };
    }
  }
  try {
    // 1. Obtener la conexión de Instagram si está configurada (fallback a posts por defecto)
    const connections = await readData<any[]>('social-connections.json', []);
    const instagramConn = connections.find(c => c.platform === 'Instagram' && c.isConnected);

    // 2. Definir publicaciones representativas de Instagram del feed real
    const fallbackInstagramFeed: InstagramFeedPost[] = [
      {
        id: 'ig_post_001',
        mediaType: 'video',
        mediaUrl: '/media/catalogo-servicios/xv-pista-iluminada-01.jpeg', // Para visualización en la galería
        videoUrl: 'https://www.instagram.com/p/C_Reel_Discoteca_LED/',
        text: '¡Increíble noche de XV Años en Salto! Pista de luces LED activa y diversión asegurada al 100% 💫🎉 #xv #fiestas #discoteca #luces #akproducciones',
        likes: 342
      },
      {
        id: 'ig_post_002',
        mediaType: 'image',
        mediaUrl: '/media/catalogo-servicios/barra-tragos-ak-01.jpeg',
        text: 'Nuestra barra premium lista para recibir a los invitados. Tragos de autor, jugos naturales y barra libre toda la noche 🍹✨ #barra #catering #bebidas',
        likes: 219
      },
      {
        id: 'ig_post_003',
        mediaType: 'image',
        mediaUrl: '/media/catalogo-servicios/candy-bar-completo-ak-02.jpeg',
        text: 'Los detalles hacen la diferencia. Candy bar personalizado para la boda de Sofía & Juan 💍🍬 #candybar #decoracion #bodas #torta',
        likes: 185
      },
      {
        id: 'ig_post_004',
        mediaType: 'video',
        mediaUrl: '/media/catalogo-servicios/photobooth-vogue-01.jpeg',
        videoUrl: 'https://www.instagram.com/p/C_Reel_Cabina_360/',
        text: '¡Diversión en el Muro Social! Capturamos sonrisas en tiempo real con nuestra fotocabina interactiva 📸🥳 #fotocabina #invitados #diversion #plataforma #360',
        likes: 412
      },
      {
        id: 'ig_post_005',
        mediaType: 'image',
        mediaUrl: '/media/catalogo-servicios/catering-mesa-ak-01.jpeg',
        text: 'Servicio de plato principal premium para bodas civiles. Lomo relleno con papas rústicas 🍽️🥩 #catering #comida #recepcion #bodas',
        likes: 284
      }
    ];

    const guessCategoryFromText = (text: string): string => {
      return classifyGalleryCategories('', text, '')[0];
    };

    // 3. Cargar bases de datos actuales
    const catalogoFotos = await readData<any[]>('catalogo-fotos.json', []);
    const galeriaData = await readData<{ fotos: any[]; videos: any[] }>('galeria-publica.json', { fotos: [], videos: [] });
    const socialPosts = await readData<SocialPost[]>(POSTS_FILE, []);

    let addedPhotosCount = 0;
    let addedVideosCount = 0;
    let addedPlannerCount = 0;

    const publicFeed = await getPublicInstagramFeed(instagramConn?.profileUrl);
    const graphFeed: InstagramFeedPost[] | null = publicFeed.length
      ? publicFeed.map((post) => ({
          id: post.id,
          mediaType: post.mediaType,
          mediaUrl: post.mediaUrl,
          videoUrl: post.permalink,
          text: post.caption,
          likes: post.likes,
        }))
      : null;
    const allowDemoFallback =
      process.env.NODE_ENV !== 'production' &&
      process.env.AK_ALLOW_DEMO_INSTAGRAM === 'true';
    const instagramFeed = graphFeed || (allowDemoFallback ? fallbackInstagramFeed : null);

    if (!instagramFeed) {
      const hasToken = Boolean(
        instagramConn?.pageAccessToken ||
        instagramConn?.accessToken ||
        process.env.INSTAGRAM_ACCESS_TOKEN ||
        process.env.META_INSTAGRAM_ACCESS_TOKEN
      );
      const hasAccountId = Boolean(
        instagramConn?.instagramAccountId ||
        instagramConn?.pageId ||
        process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ||
        process.env.INSTAGRAM_USER_ID
      );
      const missingReason = !hasToken && !hasAccountId
        ? 'Falta ingresar el Token de Meta y el Instagram Account ID en Ajustes > Redes Sociales.'
        : !hasToken
        ? 'Falta ingresar el Token de Meta en Ajustes > Redes Sociales.'
        : !hasAccountId
        ? 'Falta ingresar el Instagram Account ID en Ajustes > Redes Sociales.'
        : 'No se pudieron obtener fotos de Meta Graph API. Verificá que el Token de Meta no esté vencido.';

      // Instagram todavia no esta conectado
      return {
        success: false,
        photosCount: 0,
        videosCount: 0,
        plannerCount: 0,
        error: `Instagram no está conectado: ${missingReason}`,
      };
    }

    for (const post of instagramFeed) {
      const category = guessCategoryFromText(post.text);
      const now = new Date().toISOString();

      if (post.mediaType === 'video') {
        // Los IDs de Instagram son estables; la URL CDN puede cambiar y debe actualizarse.
        const existingVideoIndex = galeriaData.videos.findIndex(v =>
          v.id === post.id
          || v.youtubeId === post.id
          || (v.source === 'instagram' && v.sourceId === post.id)
        );
        const syncedVideo = {
          id: post.id,
          tipo: 'video',
          youtubeUrl: post.videoUrl,
          youtubeId: post.id,
          plataforma: 'archivo',
          thumbnailUrl: post.mediaUrl,
          titulo: `Reel de Instagram: ${category}`,
          descripcion: post.text,
          categoria: category,
          destacada: true,
          orden: existingVideoIndex >= 0 ? galeriaData.videos[existingVideoIndex].orden : galeriaData.videos.length,
          createdAt: existingVideoIndex >= 0 ? galeriaData.videos[existingVideoIndex].createdAt : now,
          source: 'instagram',
          sourceId: post.id,
          sourceUrl: post.videoUrl,
        };
        if (existingVideoIndex >= 0) {
          galeriaData.videos[existingVideoIndex] = {
            ...galeriaData.videos[existingVideoIndex],
            ...syncedVideo,
          };
        } else {
          galeriaData.videos.push({
            ...syncedVideo,
          });
          addedVideosCount++;
        }
      } else {
        const existingPhotoIndex = catalogoFotos.findIndex(f =>
          f.id === post.id
          || (f.source === 'instagram' && f.sourceId === post.id)
        );
        const syncedPhoto = {
          id: post.id,
          url: post.mediaUrl,
          titulo: `Instagram: ${category}`,
          descripcion: post.text,
          categoriaServicio: category,
          destacada: true,
          orden: existingPhotoIndex >= 0 ? catalogoFotos[existingPhotoIndex].orden : catalogoFotos.length,
          source: 'instagram',
          sourceId: post.id,
          sourceUrl: post.videoUrl || instagramConn?.profileUrl,
          createdAt: existingPhotoIndex >= 0 ? catalogoFotos[existingPhotoIndex].createdAt : now,
        };
        if (existingPhotoIndex >= 0) {
          catalogoFotos[existingPhotoIndex] = {
            ...catalogoFotos[existingPhotoIndex],
            ...syncedPhoto,
          };
        } else {
          catalogoFotos.push({
            ...syncedPhoto,
          });
          addedPhotosCount++;
        }
      }

      const plannerId = `ig_sync_${post.id}`;
      const plannerIndex = socialPosts.findIndex(item => item.id === plannerId);
      const syncedPlanner: SocialPost = {
        ...(plannerIndex >= 0 ? socialPosts[plannerIndex] : {} as SocialPost),
        id: plannerId,
        platform: 'Instagram',
        isGeneralCampaign: true,
        publishDate: now,
        text: post.text,
        link: post.videoUrl || instagramConn?.profileUrl,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType === 'video' ? 'video' : 'image',
        status: 'Importado de IG',
        performance: {
          likes: post.likes,
          interactions: post.likes,
        },
        createdAt: plannerIndex >= 0 ? socialPosts[plannerIndex].createdAt : now,
        updatedAt: now,
      };
      if (plannerIndex >= 0) {
        socialPosts[plannerIndex] = syncedPlanner;
      } else {
        socialPosts.push({
          ...syncedPlanner,
        });
        addedPlannerCount++;
      }
    }

    // 4. Guardar datos actualizados
    // También persiste cambios de URL/miniatura de elementos ya sincronizados.
    await Promise.all([
      writeData('catalogo-fotos.json', catalogoFotos),
      writeData('galeria-publica.json', galeriaData),
      writeData(POSTS_FILE, socialPosts, (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()),
    ]);

    console.log(`[Instagram Sync] Proceso de sincronización completado. Fotos: +${addedPhotosCount}, Reels/Videos: +${addedVideosCount}, Planner: +${addedPlannerCount}`);
    return { success: true, photosCount: addedPhotosCount, videosCount: addedVideosCount, plannerCount: addedPlannerCount };
  } catch (error: any) {
    console.error('[Instagram Sync] Error en la sincronización:', error.message || error);
    return { success: false, photosCount: 0, videosCount: 0, plannerCount: 0, error: error.message };
  }
}

/**
 * Bloque J — Genera borradores sugeridos en el planificador a partir de las mejores fotos aprobadas de una fiesta.
 * IMPORTANTE: Nunca se publica solo; los posteos quedan en estado 'Borrador' esperando aprobación del equipo.
 */
export async function generateDraftPostsFromPartyPhotos(
  fiestaId: string
): Promise<{ success: boolean; createdCount?: number; posts?: SocialPost[]; error?: string }> {
  try {
    const permiso = await requirePermiso(PERMISOS.CRM);
    if (!permiso.ok) return { success: false, error: permiso.error };

    const { getFiestaById } = await import('@/app/actions/fiesta/fiesta.actions');
    const { getPublicSocialPosts } = await import('@/app/actions/social-gallery');
    const { esAprobadoParaMostrar } = await import('@/lib/social-fiesta/visibilidad');

    const [fiesta, allPosts] = await Promise.all([
      getFiestaById(fiestaId),
      getPublicSocialPosts(fiestaId).catch(() => []),
    ]);

    if (!fiesta) {
      return { success: false, error: 'Fiesta no encontrada.' };
    }

    const nombreEvento = fiesta.configuracion?.nombreEvento
      || fiesta.configuracion?.clienteNombre
      || 'Evento AK';
    const tipoEvento = String(fiesta.configuracion?.tipoCelebracion || 'fiesta').toLowerCase();
    const tipoHashtag = tipoEvento.includes('15') || tipoEvento.includes('xv')
      ? 'QuinceAños'
      : tipoEvento.includes('boda') || tipoEvento.includes('casam')
        ? 'Boda'
        : tipoEvento.includes('cumple')
          ? 'Cumpleaños'
          : 'EventoSocial';

    // Filtrar fotos aprobadas (no videos, con imagen válida)
    const approvedPhotos = allPosts
      .filter((p) => esAprobadoParaMostrar(p) && p.imageUrl && !p.imageUrl.match(/\.(mp4|webm|mov|ogg)(\?|$)/i))
      .sort((a, b) => (b.likes || 0) - (a.likes || 0));

    if (approvedPhotos.length === 0) {
      return {
        success: false,
        error: 'No se encontraron fotos aprobadas en esta fiesta para armar los posteos.',
      };
    }

    const selectedPhotos = approvedPhotos.slice(0, 4);
    const existingPlannerPosts = await readData<SocialPost[]>(POSTS_FILE, []);
    const now = new Date();

    const salon = fiesta.configuracion?.nombreLugar || 'Salto, Uruguay';
    const fecha = fiesta.configuracion?.fechaEvento || '';
    const invitadosCount = fiesta.invitados?.length;

    // Contexto verificado de la fiesta sin inventar datos
    const partyContext = `Fiesta: ${nombreEvento}. Tipo: ${tipoEvento}. Salón: ${salon}.${fecha ? ` Fecha: ${fecha}.` : ''}${invitadosCount ? ` Invitados: ${invitadosCount}.` : ''}`;

    const fallbackTemplates = [
      {
        platform: 'Instagram' as const,
        text: `¡Así se vivió la fiesta de ${nombreEvento}! 📸✨\n\nUna noche llena de emoción, risas y momentos únicos junto a familia y amigos en Salto. ¡Gracias por confiar en el equipo de AK Producciones para hacerla realidad! 🎉\n\n#AKProducciones #EventosSalto #FiestasUruguay #${tipoHashtag} #MomentosInolvidables`,
      },
      {
        platform: 'Instagram' as const,
        text: `Cada detalle cuenta cuando se trata de celebrar a lo grande. ✨\n\nAsí lució la ambientación y los momentos mágicos de ${nombreEvento}. ¡Nos apasiona crear experiencias que quedan grabadas para siempre! 💫\n\n#Ambientacion #EventosSalto #SaltoUruguay #AKProducciones #${tipoHashtag}`,
      },
      {
        platform: 'Facebook' as const,
        text: `¡La pista no paró ni un segundo en ${nombreEvento}! 🎶🔥\n\nLuces, buena música y la mejor energía de todos los invitados para festejar como se debe. ¡Felicitaciones! 💃🕺\n\n#Fiesta #Discoteca #EventosUY #AKProducciones #Salto`,
      },
      {
        platform: 'Instagram' as const,
        text: `Risas, poses y recuerdos que duran para siempre. 📸🥳\n\nLos invitados de ${nombreEvento} coparon la cabina y nos dejaron las mejores postales de la noche. ¿Estuviste ahí? ¡Contanos en los comentarios!\n\n#Fotocabina #Recuerdos #FiestasSalto #AKProducciones`,
      },
    ];

    const aiPrompts = [
      {
        platform: 'Instagram' as const,
        angle: 'Emoción y agradecimiento general',
        request: `Escribí un posteo corto y emocionante para Instagram sobre la fiesta de ${nombreEvento}. Tono rioplatense (uruguayo, vos). Agradecé por elegir a AK Producciones en Salto. Incluí emojis y hashtags apropiados. No inventes detalles no provistos.`,
      },
      {
        platform: 'Instagram' as const,
        angle: 'Ambientación y puesta en escena',
        request: `Escribí un posteo para Instagram destacando la ambientación, las luces y la puesta en escena de ${nombreEvento} en ${salon}. Tono rioplatense cercano y profesional. Hashtags de diseño y eventos.`,
      },
      {
        platform: 'Facebook' as const,
        angle: 'Pista de baile y música',
        request: `Escribí un posteo para Facebook sobre la fiesta y la discoteca de ${nombreEvento}. Destacá la energía de la pista de baile, la música y la diversión de los invitados. Tono festivo y rioplatense.`,
      },
      {
        platform: 'Instagram' as const,
        angle: 'Fotocabina y recuerdos de invitados',
        request: `Escribí un posteo interactivo para Instagram sobre las fotos y recuerdos que se llevaron los invitados en la cabina de ${nombreEvento}. Invitalos a comentar o etiquetarse. Tono canchero y divertido.`,
      },
    ];

    const canUseAI = await hayPresupuestoParaIA().catch(() => false);
    const finalPostsData: Array<{ platform: 'Instagram' | 'Facebook'; text: string }> = [];
    let aiUsedCount = 0;

    if (canUseAI) {
      for (let i = 0; i < selectedPhotos.length; i++) {
        const item = aiPrompts[i % aiPrompts.length];
        try {
          const aiResponse = await chatWithMarketingAgent({
            request: item.request,
            context: partyContext,
            platform: item.platform,
            eventType: tipoEvento,
          });

          if (aiResponse && aiResponse.content && aiResponse.content.trim().length > 20) {
            finalPostsData.push({
              platform: item.platform,
              text: aiResponse.content.trim(),
            });
            aiUsedCount += 1;
            continue;
          }
        } catch {
          // Fallback silencioso al template en caso de error del servicio de IA
        }
        finalPostsData.push(fallbackTemplates[i % fallbackTemplates.length]);
      }

      if (aiUsedCount > 0) {
        await registrarConsumoIA('material-post-evento', aiUsedCount).catch(() => {});
      }
    } else {
      // Sin presupuesto de IA o fallback: usar templates
      selectedPhotos.forEach((_, idx) => {
        finalPostsData.push(fallbackTemplates[idx % fallbackTemplates.length]);
      });
    }

    const generatedPosts: SocialPost[] = [];

    selectedPhotos.forEach((photo, idx) => {
      const postData = finalPostsData[idx] || fallbackTemplates[idx % fallbackTemplates.length];
      const scheduledDate = new Date(now.getTime() + (idx + 1) * 86400000); // 1 día por post sugerido

      const newPost: SocialPost = {
        id: `draft_${fiestaId}_${Date.now()}_${idx}`,
        platform: postData.platform,
        isGeneralCampaign: false,
        eventId: fiestaId,
        eventName: nombreEvento,
        publishDate: scheduledDate.toISOString(),
        text: postData.text,
        mediaUrl: photo.imageUrl,
        mediaType: 'image',
        status: 'Borrador',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      generatedPosts.push(newPost);
      existingPlannerPosts.unshift(newPost);
    });

    await writeData(
      POSTS_FILE,
      existingPlannerPosts,
      (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );

    return {
      success: true,
      createdCount: generatedPosts.length,
      posts: generatedPosts,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al generar borradores de redes.' };
  }
}

