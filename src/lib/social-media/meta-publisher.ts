/**
 * Publicador real en Meta Graph API (Facebook Fanpage e Instagram Business).
 * IMPORTANTE: Nada se publica automáticamente; siempre requiere aprobación humana explícita.
 * Soporta fotos, videos en Facebook y REELS en Instagram.
 */

export interface MetaPublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export async function publishToFacebookPage(options: {
  pageId: string;
  pageAccessToken: string;
  message: string;
  imageUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
}): Promise<MetaPublishResult> {
  const { pageId, pageAccessToken, message, imageUrl, videoUrl, linkUrl } = options;

  if (!pageId || !pageAccessToken) {
    return {
      success: false,
      error: 'Faltan las credenciales de Facebook (ID de página o Token de acceso). Configuralas en Ajustes > Redes Sociales.',
    };
  }

  try {
    const isVideoPost = Boolean(videoUrl && videoUrl.startsWith('http'));
    const isPhotoPost = Boolean(!isVideoPost && imageUrl && imageUrl.startsWith('http'));

    let endpoint: string;
    const body: Record<string, string> = {
      access_token: pageAccessToken,
    };

    if (isVideoPost && videoUrl) {
      endpoint = `https://graph.facebook.com/v19.0/${pageId}/videos`;
      body.file_url = videoUrl;
      body.description = message;
    } else if (isPhotoPost && imageUrl) {
      endpoint = `https://graph.facebook.com/v19.0/${pageId}/photos`;
      body.url = imageUrl;
      body.caption = message;
    } else {
      endpoint = `https://graph.facebook.com/v19.0/${pageId}/feed`;
      body.message = message;
      if (linkUrl && linkUrl.startsWith('http')) {
        body.link = linkUrl;
      }
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.error) {
      const msg = data?.error?.message || `Error HTTP ${res.status} al publicar en Facebook`;
      console.error('[MetaPublisher] Error publicando en Facebook:', data);
      return {
        success: false,
        error: `Facebook rechazó la publicación: ${msg}`,
      };
    }

    const postId = data.id || data.post_id;
    return {
      success: true,
      postId,
      postUrl: postId ? `https://www.facebook.com/${postId}` : undefined,
    };
  } catch (err: any) {
    console.error('[MetaPublisher] Error de conexión con Facebook:', err);
    return {
      success: false,
      error: `Error de red al conectar con Facebook: ${err?.message || 'Fallo de conexión'}`,
    };
  }
}

export async function publishToInstagramBusiness(options: {
  instagramAccountId: string;
  pageAccessToken: string;
  caption: string;
  imageUrl?: string;
  videoUrl?: string;
  isReel?: boolean;
}): Promise<MetaPublishResult> {
  const { instagramAccountId, pageAccessToken, caption, imageUrl, videoUrl, isReel } = options;

  if (!instagramAccountId || !pageAccessToken) {
    return {
      success: false,
      error: 'Faltan las credenciales de Instagram (ID de cuenta o Token). Configuralas en Ajustes > Redes Sociales.',
    };
  }

  const isVideo = Boolean(videoUrl || isReel);
  const mediaUrl = videoUrl || imageUrl;

  if (!mediaUrl || !mediaUrl.startsWith('http')) {
    return {
      success: false,
      error: 'Instagram requiere una imagen o video accesible públicamente (URL https://) para publicar.',
    };
  }

  try {
    // Paso 1: Crear contenedor de medio (Foto o REELS)
    const containerBody: Record<string, string> = {
      caption,
      access_token: pageAccessToken,
    };

    if (isVideo) {
      containerBody.media_type = 'REELS';
      containerBody.video_url = mediaUrl;
    } else {
      containerBody.image_url = mediaUrl;
    }

    const containerRes = await fetch(
      `https://graph.facebook.com/v19.0/${instagramAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(containerBody),
      }
    );

    const containerData = await containerRes.json().catch(() => ({}));

    if (!containerRes.ok || containerData.error || !containerData.id) {
      const msg = containerData?.error?.message || `Error al crear contenedor (${containerRes.status})`;
      console.error('[MetaPublisher] Error creando contenedor Instagram:', containerData);
      return {
        success: false,
        error: `Instagram rechazó la imagen/contenido: ${msg}`,
      };
    }

    const creationId = containerData.id;

    // Si es REELS, esperar a que el contenedor diga FINISHED
    if (isVideo) {
      let statusContainer = 'IN_PROGRESS';
      let intentos = 0;
      while (statusContainer !== 'FINISHED' && intentos < 10) {
        await new Promise((r) => setTimeout(r, 1000));
        intentos++;
        const checkRes = await fetch(
          `https://graph.facebook.com/v19.0/${creationId}?fields=status_code&access_token=${pageAccessToken}`
        );
        const checkData = await checkRes.json().catch(() => ({}));
        statusContainer = checkData.status_code || statusContainer;
        if (statusContainer === 'ERROR') {
          return {
            success: false,
            error: 'Instagram falló al procesar el video de Reel: status ERROR',
          };
        }
      }
    }

    // Paso 2: Publicar el contenedor creado
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${instagramAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: pageAccessToken,
        }),
      }
    );

    const publishData = await publishRes.json().catch(() => ({}));

    if (!publishRes.ok || publishData.error || !publishData.id) {
      const msg = publishData?.error?.message || `Error al confirmar publicación (${publishRes.status})`;
      console.error('[MetaPublisher] Error confirmando publicación Instagram:', publishData);
      return {
        success: false,
        error: `Instagram no pudo publicar el posteo: ${msg}`,
      };
    }

    const mediaId = publishData.id;
    return {
      success: true,
      postId: mediaId,
      postUrl: mediaId ? `https://www.instagram.com/p/${mediaId}/` : undefined,
    };
  } catch (err: any) {
    console.error('[MetaPublisher] Error de conexión con Instagram:', err);
    return {
      success: false,
      error: `Error de red al conectar con Instagram: ${err?.message || 'Fallo de conexión'}`,
    };
  }
}
