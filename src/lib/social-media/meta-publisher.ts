/**
 * Publicador real en Meta Graph API (Facebook Fanpage e Instagram Business).
 * IMPORTANTE: Nada se publica automáticamente; siempre requiere aprobación humana explícita.
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
  linkUrl?: string;
}): Promise<MetaPublishResult> {
  const { pageId, pageAccessToken, message, imageUrl, linkUrl } = options;

  if (!pageId || !pageAccessToken) {
    return {
      success: false,
      error: 'Faltan las credenciales de Facebook (ID de página o Token de acceso). Configuralas en Ajustes > Redes Sociales.',
    };
  }

  try {
    const isPhotoPost = Boolean(imageUrl && imageUrl.startsWith('http'));
    const endpoint = isPhotoPost
      ? `https://graph.facebook.com/v19.0/${pageId}/photos`
      : `https://graph.facebook.com/v19.0/${pageId}/feed`;

    const body: Record<string, string> = {
      access_token: pageAccessToken,
    };

    if (isPhotoPost && imageUrl) {
      body.url = imageUrl;
      body.caption = message;
    } else {
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
  imageUrl: string;
}): Promise<MetaPublishResult> {
  const { instagramAccountId, pageAccessToken, caption, imageUrl } = options;

  if (!instagramAccountId || !pageAccessToken) {
    return {
      success: false,
      error: 'Faltan las credenciales de Instagram (ID de cuenta o Token). Configuralas en Ajustes > Redes Sociales.',
    };
  }

  if (!imageUrl || !imageUrl.startsWith('http')) {
    return {
      success: false,
      error: 'Instagram requiere una imagen accesible públicamente (URL https://) para publicar.',
    };
  }

  try {
    // Paso 1: Crear contenedor de medio
    const containerRes = await fetch(
      `https://graph.facebook.com/v19.0/${instagramAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption,
          access_token: pageAccessToken,
        }),
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
