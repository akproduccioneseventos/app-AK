'use server';

import { requireAppSession } from '@/lib/auth/require-session';
import { readData } from '@/lib/data-service';
import type { SocialConnection } from '@/types/settings';

export type EstadoConexion = 'conectada' | 'falta-configurarla' | 'no-se-usa';

export interface ResumenConexion {
  id: string;
  nombre: string;
  categoria: string;
  estado: EstadoConexion;
  detalle: string;
  queSePierdeSiFalta: string;
  enlaceConfiguracion?: string;
}

const CONNECTIONS_FILE = 'social-connections.json';
const SETTINGS_FILE = 'settings.json';
const GOOGLE_WORKSPACE_FILE = 'google-workspace.json';
const WHATSAPP_CONFIG_FILE = 'whatsapp-business.json';

export async function getEstadoConexiones(): Promise<ResumenConexion[]> {
  await requireAppSession();

  const [sociales, settings, googleWs, waConfig] = await Promise.all([
    readData<SocialConnection[]>(CONNECTIONS_FILE, []),
    readData<any>(SETTINGS_FILE, {}).catch(() => ({})),
    readData<any>(GOOGLE_WORKSPACE_FILE, {}).catch(() => ({})),
    readData<any>(WHATSAPP_CONFIG_FILE, {}).catch(() => ({})),
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

  const conexiones: ResumenConexion[] = [
    {
      id: 'google-analytics',
      nombre: 'Google Analytics (GA4)',
      categoria: 'Métricas web',
      estado: process.env.NEXT_PUBLIC_GA_ID || process.env.GA4_PROPERTY_ID || settings?.googleAnalyticsId ? 'conectada' : 'falta-configurarla',
      detalle: process.env.NEXT_PUBLIC_GA_ID || settings?.googleAnalyticsId ? 'Medición de visitas activada' : 'Falta ID de medición (G-XXXXX)',
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
      categoria: 'Video',
      estado: ytConn ? 'conectada' : 'falta-configurarla',
      detalle: ytConn ? `Canal: ${ytConn.username || 'conectado'}` : 'Sin canal de YouTube configurado',
      queSePierdeSiFalta: 'Los videos institucionales y de fiestas no se muestran en el carrusel de presentación ni en la web.',
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
      estado: spConn || process.env.SPOTIFY_CLIENT_ID ? 'conectada' : 'no-se-usa',
      detalle: spConn ? 'Lista o perfil vinculado' : 'Sin credenciales de Spotify',
      queSePierdeSiFalta: 'El DJ no puede previsualizar listas de Spotify creadas por los clientes.',
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
      estado: (process.env.META_ADS_TOKEN || process.env.FACEBOOK_PIXEL_ID) ? 'conectada' : 'falta-configurarla',
      detalle: (process.env.META_ADS_TOKEN || process.env.FACEBOOK_PIXEL_ID) ? 'Pixel y API de conversiones activos' : 'Falta token de anuncios / Pixel ID',
      queSePierdeSiFalta: 'No podés medir qué anuncios de Instagram o Facebook te traen ventas reales ni recontactar a quienes vieron la web.',
      enlaceConfiguracion: '/settings/sincronizaciones',
    },
  ];

  return conexiones;
}
