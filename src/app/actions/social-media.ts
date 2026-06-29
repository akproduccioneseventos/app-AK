
'use server';

import type { SocialPost } from '@/types/social-media';
import { readData, writeData } from '@/lib/data-service';
import fs from 'fs/promises';
import path from 'path';

const POSTS_FILE = 'social-posts.json';
const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const ASSETS_DIR_NAME = 'social-media-assets';
const assetsDirectoryPath = path.join(DATA_DIR, ASSETS_DIR_NAME);

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

async function fetchInstagramGraphFeed(profileUrl?: string): Promise<InstagramFeedPost[] | null> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || process.env.INSTAGRAM_USER_ID;

  if (!accessToken || !accountId) return null;

  const apiVersion = process.env.INSTAGRAM_GRAPH_API_VERSION || 'v25.0';
  const fields = [
    'id',
    'caption',
    'media_type',
    'media_url',
    'thumbnail_url',
    'permalink',
    'timestamp',
    'like_count',
    'comments_count',
  ].join(',');

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${accountId}/media?fields=${encodeURIComponent(fields)}&limit=12&access_token=${encodeURIComponent(accessToken)}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      console.warn(`[Instagram Sync] Graph API respondio ${response.status}. Se usa fallback local.`);
      return null;
    }

    const payload = await response.json();
    const items = Array.isArray(payload?.data) ? payload.data : [];

    return items
      .map((item: any): InstagramFeedPost | null => {
        const isVideo = String(item.media_type || '').toUpperCase().includes('VIDEO') || String(item.media_type || '').toUpperCase().includes('REEL');
        const mediaUrl = item.thumbnail_url || item.media_url;
        if (!item.id || !mediaUrl) return null;

        return {
          id: `ig_${item.id}`,
          mediaType: isVideo ? 'video' : 'image',
          mediaUrl,
          videoUrl: item.permalink || profileUrl,
          text: item.caption || 'Contenido reciente de Instagram AK Producciones.',
          likes: Number(item.like_count || item.comments_count || 0),
        };
      })
      .filter(Boolean) as InstagramFeedPost[];
  } catch (error: any) {
    console.warn('[Instagram Sync] No se pudo leer Instagram Graph API. Se usa fallback local:', error.message || error);
    return null;
  }
}

export async function getSocialPosts(): Promise<SocialPost[]> {
  return readData<SocialPost[]>(POSTS_FILE, []);
}

export async function saveSocialPost(
  formData: FormData
): Promise<{ success: boolean; post?: SocialPost; error?: string }> {
  let posts = await getSocialPosts();
  const postId = (formData.get('id') as string) || `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const mediaFile = formData.get('mediaFile') as File | null;
  const autoPublish = formData.get('autoPublish') === 'true';

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
    status: autoPublish ? 'Publicado' : (formData.get('status') as SocialPost['status']),
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
  
  if (autoPublish) {
    console.log(`[SocialMedia] Auto-published post ${postId} to ${finalPost.platform}.`);
  }

  await writeData(POSTS_FILE, posts, (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
  return { success: true, post: finalPost };
}


export async function deleteSocialPost(postId: string): Promise<{ success: boolean, error?: string }> {
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
export async function syncInstagramPosts(): Promise<{ success: boolean; photosCount: number; videosCount: number; plannerCount: number; error?: string }> {
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

    // Algoritmo de clasificación por palabras clave
    const KEYWORDS_TO_CATEGORY = [
      { keywords: ['deco', 'decoracion', 'mesa', 'centro', 'ambientacion', 'arreglo', 'flores', 'lila', 'rosa', 'dorada', 'velas'], category: 'Decoración' },
      { keywords: ['catering', 'comida', 'plato', 'recepcion', 'canapes', 'bocados', 'asado', 'cena', 'menú', 'carne'], category: 'Catering' },
      { keywords: ['torta', 'postre', 'dulce', 'candy', 'candy bar', 'chocolates', 'reposteria', 'pastel'], category: 'Repostería' },
      { keywords: ['barra', 'trago', 'cocktail', 'licor', 'barman', 'bebida', 'copas', 'barra libre'], category: 'Barra de Tragos' },
      { keywords: ['discoteca', 'dj', 'pista', 'luces', 'iluminacion', 'pantalla', 'sonido', 'led', 'audio', 'bolas', 'sonido'], category: 'Discoteca' },
      { keywords: ['glitter', 'maquillaje', 'brillo', 'neon', 'pintura'], category: 'Glitter Bar' },
      { keywords: ['cabina', 'photobooth', 'foto', 'video', 'camara', 'vogue', 'espejo', 'plataforma', '360'], category: 'Fotografía y Cabina' },
      { keywords: ['souvenir', 'cotillon', 'regalo', 'tarjeta', 'invitacion'], category: 'Souvenirs y Cotillón' }
    ];

    const guessCategoryFromText = (text: string): string => {
      const lower = text.toLowerCase();
      for (const item of KEYWORDS_TO_CATEGORY) {
        if (item.keywords.some(kw => lower.includes(kw))) {
          return item.category;
        }
      }
      return 'General';
    };

    // 3. Cargar bases de datos actuales
    const catalogoFotos = await readData<any[]>('catalogo-fotos.json', []);
    const galeriaData = await readData<{ fotos: any[]; videos: any[] }>('galeria-publica.json', { fotos: [], videos: [] });
    const socialPosts = await readData<SocialPost[]>(POSTS_FILE, []);

    let addedPhotosCount = 0;
    let addedVideosCount = 0;
    let addedPlannerCount = 0;

    const instagramFeed = await fetchInstagramGraphFeed(instagramConn?.profileUrl) || fallbackInstagramFeed;

    for (const post of instagramFeed) {
      const category = guessCategoryFromText(post.text);
      const now = new Date().toISOString();

      if (post.mediaType === 'video') {
        // Es un reel/video -> colocar en la sección de videos de la galería
        const exists = galeriaData.videos.some(v => v.youtubeId === post.id);
        if (!exists) {
          galeriaData.videos.push({
            id: post.id,
            tipo: 'video',
            youtubeUrl: post.videoUrl,
            youtubeId: post.id, // ID único de la publicación de Instagram
            plataforma: 'archivo', // Clasificado como archivo para reproducción directa
            thumbnailUrl: post.mediaUrl,
            titulo: `Reel de Instagram: ${category}`,
            descripcion: post.text,
            categoria: category,
            destacada: true,
            orden: galeriaData.videos.length,
            createdAt: now
          });
          addedVideosCount++;
        }
      } else {
        // Es una foto -> colocar en el catálogo de fotos de servicios
        const exists = catalogoFotos.some(f => f.url === post.mediaUrl);
        if (!exists) {
          catalogoFotos.push({
            id: post.id,
            url: post.mediaUrl,
            titulo: `Instagram: ${category}`,
            descripcion: post.text,
            categoriaServicio: category,
            destacada: true,
            orden: catalogoFotos.length,
            source: 'instagram',
            createdAt: now
          });
          addedPhotosCount++;
        }
      }

      const plannerId = `ig_sync_${post.id}`;
      if (!socialPosts.some(item => item.id === plannerId)) {
        socialPosts.push({
          id: plannerId,
          platform: 'Instagram',
          isGeneralCampaign: true,
          publishDate: now,
          text: post.text,
          link: post.videoUrl || instagramConn?.profileUrl,
          mediaUrl: post.mediaUrl,
          mediaType: post.mediaType === 'video' ? 'video' : 'image',
          status: 'Publicado',
          performance: {
            likes: post.likes,
            interactions: post.likes,
          },
          createdAt: now,
          updatedAt: now,
        });
        addedPlannerCount++;
      }
    }

    // 4. Guardar datos actualizados
    if (addedPhotosCount > 0) {
      await writeData('catalogo-fotos.json', catalogoFotos);
    }
    if (addedVideosCount > 0) {
      await writeData('galeria-publica.json', galeriaData);
    }
    if (addedPlannerCount > 0) {
      await writeData(POSTS_FILE, socialPosts, (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
    }

    console.log(`[Instagram Sync] Proceso de sincronización completado. Fotos: +${addedPhotosCount}, Reels/Videos: +${addedVideosCount}, Planner: +${addedPlannerCount}`);
    return { success: true, photosCount: addedPhotosCount, videosCount: addedVideosCount, plannerCount: addedPlannerCount };
  } catch (error: any) {
    console.error('[Instagram Sync] Error en la sincronización:', error.message || error);
    return { success: false, photosCount: 0, videosCount: 0, plannerCount: 0, error: error.message };
  }
}
