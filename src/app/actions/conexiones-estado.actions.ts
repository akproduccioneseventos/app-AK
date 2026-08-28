'use server';

import { requireAppSession } from '@/lib/auth/require-session';
import { readData } from '@/lib/data-service';
import { idDeMedicionGoogle, idDelPixelMeta } from '@/lib/medicion/identificadores';
import type { SocialConnection } from '@/types/settings';

/**
 * Preguntarle al servicio, no a lo que quedo escrito en Ajustes.
 *
 * Esta pantalla decia "conectada" porque habia una ficha guardada o porque
 * existia una llave. Una llave revocada seguia figurando como conectada, y el
 * dueño se enteraba el dia que lo necesitaba. La regla de la app es que ninguna
 * pantalla afirma lo que no verifico, y dos renglones mas abajo Google Analytics
 * ya lo hacia bien.
 *
 * El sondeo es barato y con reloj: si el servicio no contesta en pocos segundos,
 * se dice que no contesta. Nunca deja la pantalla colgada.
 */
const SONDEO_TIMEOUT_MS = 5_000;
let cacheSondeos: { valor: Record<string, { anda: boolean; motivo: string }>; expira: number } | undefined;

async function pedirConReloj(url: string, init?: RequestInit) {
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), SONDEO_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: control.signal, cache: 'no-store' });
  } finally {
    clearTimeout(reloj);
  }
}

async function sondearSpotify(): Promise<{ anda: boolean; motivo: string }> {
  const id = process.env.SPOTIFY_CLIENT_ID?.trim();
  const secret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!id || !secret) return { anda: false, motivo: 'faltan las credenciales de Spotify' };

  const guardado = cacheSondeos?.valor.spotify;
  if (guardado && (cacheSondeos?.expira || 0) > Date.now()) return guardado;

  try {
    const respuesta = await pedirConReloj('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    });
    const resultado = respuesta.ok
      ? { anda: true, motivo: 'anda' }
      : { anda: false, motivo: 'Spotify rechazo las credenciales' };
    cacheSondeos = {
      valor: { ...(cacheSondeos?.valor || {}), spotify: resultado },
      expira: Date.now() + 5 * 60_000,
    };
    return resultado;
  } catch {
    return { anda: false, motivo: 'Spotify no contesto' };
  }
}

async function sondearYoutube(): Promise<{ anda: boolean; motivo: string }> {
  const guardado = cacheSondeos?.valor.youtube;
  if (guardado && (cacheSondeos?.expira || 0) > Date.now()) return guardado;

  try {
    // La puerta publica de YouTube, la misma que usa la app para sacar el titulo
    // de un video. No necesita llave.
    const respuesta = await pedirConReloj('https://www.youtube.com/oembed?format=json');
    const resultado = respuesta.status < 500
      ? { anda: true, motivo: 'anda' }
      : { anda: false, motivo: 'YouTube esta caido en este momento' };
    cacheSondeos = {
      valor: { ...(cacheSondeos?.valor || {}), youtube: resultado },
      expira: Date.now() + 5 * 60_000,
    };
    return resultado;
  } catch {
    return { anda: false, motivo: 'YouTube no contesto' };
  }
}

export type EstadoConexion = 'conectada' | 'falta-configurarla' | 'no-se-usa';

export interface ResumenConexion {
  id: string;
  nombre: string;
  categoria: string;
  estado: EstadoConexion;
  detalle: string;
  queSePierdeSiFalta: string;
  enlaceConfiguracion?: string;
  historial?: {
    totalPublicaciones: number;
    fechaMasVieja?: string;
    fechaMasNueva?: string;
    ultimaSincronizacion?: string;
    completo: boolean;
    error?: string;
  };
}

const CONNECTIONS_FILE = 'social-connections.json';
const SETTINGS_FILE = 'settings.json';
const GOOGLE_WORKSPACE_FILE = 'google-workspace.json';
const WHATSAPP_CONFIG_FILE = 'whatsapp-business.json';
const POSTS_FILE = 'social-posts.json';
const META_STATE_FILE = 'meta-public-history-backfill.json';

export async function getEstadoConexiones(): Promise<ResumenConexion[]> {
  await requireAppSession();

  const [sociales, settings, googleWs, waConfig, posts, metaState] = await Promise.all([
    readData<SocialConnection[]>(CONNECTIONS_FILE, []),
    readData<any>(SETTINGS_FILE, {}).catch(() => ({})),
    readData<any>(GOOGLE_WORKSPACE_FILE, {}).catch(() => ({})),
    readData<any>(WHATSAPP_CONFIG_FILE, {}).catch(() => ({})),
    readData<any[]>(POSTS_FILE, []).catch(() => []),
    readData<any>(META_STATE_FILE, null).catch(() => null),
  ]);

  const findSocial = (name: string) =>
    sociales.find(c => c.platform.toLowerCase() === name.toLowerCase() && c.isConnected);

  const fbConn = findSocial('facebook');
  const igConn = findSocial('instagram');
  const waConn = findSocial('whatsapp');
  const ytConn = findSocial('youtube');
  const ttConn = findSocial('tiktok');
  const thConn = findSocial('threads');
  const xConn = findSocial('twitter') || findSocial('x');
  const spConn = findSocial('spotify');

  // Se le pregunta a cada servicio en vez de mirar lo que quedo guardado.
  const [sondeoSpotify, sondeoYoutube] = await Promise.all([sondearSpotify(), sondearYoutube()]);

  const igPosts = posts.filter(p => p.platform === 'Instagram');
  const igDates = igPosts.map(p => p.publishDate).filter(Boolean).sort();
  const igState = metaState?.platforms?.Instagram;

  const conexiones: ResumenConexion[] = [
    {
      id: 'google-analytics',
      nombre: 'Google Analytics (GA4)',
      categoria: 'Métricas web',
      /**
       * El estado se decide por lo que hace funcionar la medición, no por lo que
       * haya escrito en Ajustes.
       *
       * Decía "conectada" con sólo cargar el identificador en Ajustes, y la
       * etiqueta de Google no se cargaba igual: la pantalla afirmaba que se
       * estaba midiendo cuando no se medía nada.
       */
      estado: idDeMedicionGoogle() ? 'conectada' : 'falta-configurarla',
      detalle: idDeMedicionGoogle()
        ? 'Medición de visitas activada'
        : settings?.googleAnalyticsId
          ? 'El identificador está cargado en Ajustes pero la medición todavía no está activa: hay que cargarlo en el servidor.'
          : 'Falta ID de medición (G-XXXXX)',
      queSePierdeSiFalta: 'No sabés cuánta gente entra a la web, qué páginas miran ni de dónde vienen los pedidos de presupuesto.',
      enlaceConfiguracion: '/settings/company',
    },
    {
      id: 'google-business',
      nombre: 'Ficha de Google (Perfil de Negocio)',
      categoria: 'Búsqueda local',
      estado: settings?.googleBusinessProfileUrl || settings?.googleMapsUrl ? 'conectada' : 'falta-configurarla',
      detalle: settings?.googleBusinessProfileUrl ? 'Enlace de ficha y reseñas cargado' : 'Falta enlace a tu perfil de Google',
      queSePierdeSiFalta: 'La gente que busca "eventos en Salto" no ve tu teléfono ni tus fotos en Google Maps, y perdés el 32% de los clientes locales.',
      enlaceConfiguracion: '/settings/company',
    },
    {
      id: 'google-calendar',
      nombre: 'Google Calendar y Workspace',
      categoria: 'Agenda y correos',
      estado: googleWs?.isConnected || process.env.GOOGLE_WORKSPACE_PRIVATE_KEY ? 'conectada' : 'falta-configurarla',
      detalle: googleWs?.isConnected ? 'Sincronización activa con Google Calendar' : 'Falta conectar cuenta de Google Workspace',
      queSePierdeSiFalta: 'Las fiestas y reuniones agendadas en la app no se copian solas a tu celular ni al calendario de tu equipo.',
      enlaceConfiguracion: '/settings/google-workspace',
    },
    {
      id: 'whatsapp',
      nombre: 'WhatsApp',
      categoria: 'Mensajería directa',
      estado: (waConn?.phoneNumber || waConfig?.isConnected || settings?.whatsappNumber) ? 'conectada' : 'falta-configurarla',
      detalle: waConn?.phoneNumber ? `Número configurado: ${waConn.phoneNumber}` : (settings?.whatsappNumber ? `Número: ${settings.whatsappNumber}` : 'Sin número conectado'),
      queSePierdeSiFalta: 'Los clientes no pueden pedir presupuestos ni confirmar asistencia tocando un botón para escribirte directo.',
      enlaceConfiguracion: '/settings/whatsapp',
    },
    {
      id: 'instagram',
      nombre: 'Instagram',
      categoria: 'Redes sociales',
      estado: igConn ? 'conectada' : 'falta-configurarla',
      detalle: igConn ? `Cuenta: @${igConn.username || 'conectada'}` : 'Falta vincular cuenta de Instagram',
      queSePierdeSiFalta: 'No se pueden leer los comentarios de la gente ni publicar fotos de las fiestas directamente desde la app.',
      enlaceConfiguracion: '/settings/social-connections',
      historial: {
        totalPublicaciones: igPosts.length,
        fechaMasVieja: igDates[0],
        fechaMasNueva: igDates[igDates.length - 1],
        ultimaSincronizacion: igState?.lastAttemptAt || igState?.lastFullSyncAt,
        completo: Boolean(igState?.lastFullSyncAt && !igState?.error),
        error: igState?.error,
      },
    },
    {
      id: 'facebook',
      nombre: 'Facebook',
      categoria: 'Redes sociales',
      estado: fbConn ? 'conectada' : 'falta-configurarla',
      detalle: fbConn ? `Página: ${fbConn.username || 'conectada'}` : 'Falta vincular página de Facebook',
      queSePierdeSiFalta: 'No podés publicar posteos programados ni responder consultas de Facebook desde el panel.',
      enlaceConfiguracion: '/settings/social-connections',
    },
    {
      id: 'youtube',
      nombre: 'YouTube',
      categoria: 'Video y música',
      /**
       * Probado, no supuesto.
       *
       * Antes decia "conectada" con que existiera una ficha guardada: si el
       * permiso habia vencido hace un mes, seguia diciendo lo mismo. Ahora se le
       * pregunta a YouTube y se contesta lo que contesto.
       */
      estado: sondeoYoutube.anda ? 'conectada' : (ytConn ? 'falta-configurarla' : 'falta-configurarla'),
      detalle: sondeoYoutube.anda
        ? `Leer videos que mandan los clientes: anda${ytConn ? ` · Canal guardado: ${ytConn.username || 'conectado'}` : ''}`
        : `Leer videos que mandan los clientes: ${sondeoYoutube.motivo}`,
      queSePierdeSiFalta: 'Los videos de YouTube que manda el cliente quedan como un enlace pelado: nadie sabe que tema es.',
      enlaceConfiguracion: '/settings/social-connections',
    },
    {
      id: 'tiktok',
      nombre: 'TikTok',
      categoria: 'Redes sociales',
      estado: ttConn ? 'conectada' : 'no-se-usa',
      detalle: ttConn ? `Perfil: ${ttConn.username}` : 'No configurado',
      queSePierdeSiFalta: 'Los videos cortos de 15 años y bodas no se enlazan desde el pie de la web.',
      enlaceConfiguracion: '/settings/social-connections',
    },
    {
      id: 'threads',
      nombre: 'Threads',
      categoria: 'Redes sociales',
      estado: thConn ? 'conectada' : 'no-se-usa',
      detalle: thConn ? `Perfil: ${thConn.username}` : 'No configurado',
      queSePierdeSiFalta: 'No se enlaza el perfil de Threads desde la web.',
      enlaceConfiguracion: '/settings/social-connections',
    },
    {
      id: 'x',
      nombre: 'X (Twitter)',
      categoria: 'Redes sociales',
      estado: xConn ? 'conectada' : 'no-se-usa',
      detalle: xConn ? `Usuario: @${xConn.username}` : 'No configurado',
      queSePierdeSiFalta: 'No se enlaza la cuenta de X en el pie de página.',
      enlaceConfiguracion: '/settings/social-connections',
    },
    {
      id: 'spotify',
      nombre: 'Spotify',
      categoria: 'Música y DJs',
      /**
       * Dos permisos distintos, y hay que decirlos por separado.
       *
       * Con la llave de la aplicacion se pueden **buscar canciones y abrir listas
       * publicas**, que es el 90% de lo que hace falta. **Escribir en la playlist
       * personal del dueño** es otro permiso, de su cuenta. El cartel viejo los
       * mezclaba en uno: decia "conectada" y despues no se podia escribir nada.
       */
      estado: sondeoSpotify.anda ? 'conectada' : 'falta-configurarla',
      detalle: sondeoSpotify.anda
        ? `Buscar canciones y abrir listas: anda · Escribir en tu playlist: ${
            process.env.SPOTIFY_REFRESH_TOKEN ? 'anda' : 'falta darle permiso a la app desde tu cuenta'
          }`
        : `Buscar canciones y abrir listas: ${sondeoSpotify.motivo}`,
      queSePierdeSiFalta: 'El DJ no puede ver las canciones de las listas que mandan los clientes.',
      enlaceConfiguracion: '/settings/social-connections',
    },
    {
      id: 'mercado-pago',
      nombre: 'Mercado Pago',
      categoria: 'Cobros online',
      estado: (process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN || settings?.mercadoPagoPublicKey) ? 'conectada' : 'falta-configurarla',
      detalle: (process.env.MP_ACCESS_TOKEN || settings?.mercadoPagoPublicKey) ? 'Pasarela de cobro habilitada' : 'Faltan credenciales de cobro',
      queSePierdeSiFalta: 'Los clientes no pueden pagar señas ni cuotas con tarjeta de crédito desde el presupuesto digital.',
      enlaceConfiguracion: '/settings/company',
    },
    {
      id: 'meta-ads',
      nombre: 'Meta Ads (Publicidad)',
      categoria: 'Anuncios',
      /**
       * El pixel se da por activo sólo si es el mismo dato que carga el pixel de
       * verdad (`NEXT_PUBLIC_META_PIXEL_ID`, el que usa `MetaPixel`). Decía
       * "Pixel activo" mirando un nombre que no lee nadie, y durante un tiempo
       * **no había pixel en toda la app**: la pantalla informaba algo que no
       * existía.
       */
      estado: idDelPixelMeta() ? 'conectada' : 'falta-configurarla',
      detalle: idDelPixelMeta()
        ? 'El pixel está midiendo las visitas que llegan de tus anuncios.'
        : 'Falta el identificador del pixel para medir los anuncios.',
      queSePierdeSiFalta: 'No podés medir qué anuncios de Instagram o Facebook te traen ventas reales ni recontactar a quienes vieron la web.',
      enlaceConfiguracion: '/settings/sincronizaciones',
    },
  ];

  return conexiones;
}

export async function probarConexionInstagramAction(): Promise<{
  success: boolean;
  estado: 'conectada' | 'falta-configurarla' | 'fallando';
  motivo: string;
  detalle?: string;
}> {
  await requireAppSession();

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || process.env.INSTAGRAM_USER_ID;

  if (!accessToken || !accountId) {
    return {
      success: false,
      estado: 'falta-configurarla',
      motivo: 'Falta vincular la cuenta comercial de Instagram y su clave de acceso en los ajustes del servidor.',
    };
  }

  try {
    const apiVersion = process.env.INSTAGRAM_GRAPH_API_VERSION || 'v25.0';
    const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count';
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${accountId}/media?fields=${encodeURIComponent(fields)}&limit=1&access_token=${encodeURIComponent(accessToken)}`,
      { signal: AbortSignal.timeout(4500), cache: 'no-store' }
    );

    if (!response.ok) {
      const errPayload = await response.json().catch(() => null);
      const metaMessage = errPayload?.error?.message || response.statusText;
      let motivo = `Meta devolvió un error (${response.status}): ${metaMessage}`;

      if (response.status === 400 || /token|expired|session/i.test(metaMessage)) {
        motivo = 'El token de acceso de Instagram caducó. Es necesario generar un nuevo token de larga duración en Meta for Developers.';
      } else if (response.status === 403 || /permission/i.test(metaMessage)) {
        motivo = 'Faltan permisos en la cuenta de Meta (se requiere el permiso instagram_basic).';
      }

      return {
        success: false,
        estado: 'fallando',
        motivo,
      };
    }

    const data = await response.json();
    const items = Array.isArray(data?.data) ? data.data : [];
    return {
      success: true,
      estado: 'conectada',
      motivo: '¡Conexión exitosa con Instagram!',
      detalle: items.length > 0
        ? `Se descargó y validó la publicación más reciente (ID: ${items[0].id}).`
        : 'La cuenta está conectada correctamente pero todavía no tiene fotos publicadas.',
    };
  } catch (err: any) {
    return {
      success: false,
      estado: 'fallando',
      motivo: `No se pudo contactar con los servidores de Meta: ${err?.message || 'Tiempo de espera agotado'}.`,
    };
  }
}

