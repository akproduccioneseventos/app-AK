
'use server';

import type { SocialConnection, SocialPlatformName } from '@/types/settings';
import { readData, writeData } from '@/lib/data-service';
import { requireAppSession } from '@/lib/auth/require-session';

const CONNECTIONS_FILE = 'social-connections.json';

export async function getSocialConnections(): Promise<SocialConnection[]> {
  await requireAppSession();
  return readData<SocialConnection[]>(CONNECTIONS_FILE, []);
}

/** Sin comprobar sesion: solo para uso interno de este archivo y de las publicas. */
async function leerConexiones(): Promise<SocialConnection[]> {
  return readData<SocialConnection[]>(CONNECTIONS_FILE, []);
}

/**
 * Las redes de AK para mostrarle los botones "seguinos" al invitado.
 *
 * **Devuelve solo lo que se ve en pantalla.** La version completa guarda ademas el
 * permiso de publicacion de Facebook e Instagram, y estas pantallas son publicas:
 * se abrian sin cuenta y el permiso viajaba hasta el navegador de cada invitado,
 * donde queda a la vista en el codigo de la pagina. Con ese permiso, cualquiera
 * podia publicar en las cuentas de la empresa.
 */
export async function getSocialConnectionsPublicas(): Promise<SocialConnection[]> {
  const conexiones = await leerConexiones();
  return conexiones.map(({ pageId, pageAccessToken, instagramAccountId, tokenExpiresAt, ...visible }) => {
    void pageId; void pageAccessToken; void instagramAccountId; void tokenExpiresAt;
    return visible;
  });
}

export async function saveWhatsAppNumber(
  phoneNumber: string,
  logoUrl?: string
): Promise<{ success: boolean; connection?: SocialConnection; error?: string }> {
  await requireAppSession();
  if (!phoneNumber || !/^\d+$/.test(phoneNumber.replace(/\s/g, ''))) {
    return { success: false, error: "Por favor, ingresa un número de teléfono válido (solo dígitos)." };
  }
  
  const connections = await leerConexiones();
  const cleanPhoneNumber = phoneNumber.replace(/\s/g, '');

  const newConnection: SocialConnection = {
    platform: 'WhatsApp',
    isConnected: true,
    username: `WhatsApp (${cleanPhoneNumber})`,
    phoneNumber: cleanPhoneNumber,
    profileUrl: `https://wa.me/${cleanPhoneNumber}`,
    logoUrl: logoUrl,
    connectedAt: new Date().toISOString(),
  };

  const existingIndex = connections.findIndex(c => c.platform === 'WhatsApp');
  if (existingIndex > -1) {
    connections[existingIndex] = { ...connections[existingIndex], ...newConnection };
  } else {
    connections.push(newConnection);
  }

  await writeData(CONNECTIONS_FILE, connections);
  return { success: true, connection: newConnection };
}

export async function saveSocialLink(
  platform: SocialPlatformName,
  url: string,
  logoUrl?: string
): Promise<{ success: boolean; connection?: SocialConnection; error?: string }> {
  await requireAppSession();
  if (platform === 'WhatsApp') {
    return { success: false, error: 'Usa la función de guardar número para WhatsApp.' };
  }
  if (!url || !url.startsWith('http')) {
    return { success: false, error: "Por favor, ingresa una URL válida." };
  }

  const connections = await leerConexiones();
  const newConnection: SocialConnection = {
    platform,
    isConnected: true,
    username: `${platform} Perfil`,
    profileUrl: url,
    logoUrl: logoUrl,
    connectedAt: new Date().toISOString(),
  };

  const existingIndex = connections.findIndex(c => c.platform === platform);
  if (existingIndex > -1) {
    connections[existingIndex] = { ...connections[existingIndex], ...newConnection };
  } else {
    connections.push(newConnection);
  }
  
  await writeData(CONNECTIONS_FILE, connections);
  return { success: true, connection: newConnection };
}

export async function disconnectSocialPlatform(platform: SocialPlatformName): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  let connections = await leerConexiones();
  const initialLength = connections.length;
  connections = connections.filter(c => c.platform !== platform);
  
  if (connections.length === initialLength) {
    return { success: false, error: `No se encontró una conexión para ${platform}.`};
  }
  
  await writeData(CONNECTIONS_FILE, connections);
  return { success: true };
}

/**
 * Guarda credenciales y permisos oficiales de publicación de Meta (Facebook e Instagram).
 * Requiere sesión autenticada interna.
 */
export async function saveMetaPublishingCredentials(params: {
  pageId: string;
  pageAccessToken: string;
  instagramAccountId?: string;
  pageName?: string;
}): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();

  const { pageId, pageAccessToken, instagramAccountId, pageName } = params;

  if (!pageId || !pageAccessToken) {
    return { success: false, error: 'Se requiere el Page ID y el Page Access Token de Meta.' };
  }

  const connections = await leerConexiones();
  const now = new Date().toISOString();

  // 1. Conexión de Facebook
  const fbIndex = connections.findIndex((c) => c.platform === 'Facebook');
  const fbConn: SocialConnection = {
    platform: 'Facebook',
    isConnected: true,
    username: pageName || 'Página de Facebook AK Producciones',
    profileUrl: `https://facebook.com/${pageId}`,
    pageId,
    pageAccessToken,
    connectedAt: now,
  };

  if (fbIndex > -1) {
    connections[fbIndex] = { ...connections[fbIndex], ...fbConn };
  } else {
    connections.push(fbConn);
  }

  // 2. Conexión de Instagram (si viene vinculada la cuenta de IG Business)
  if (instagramAccountId) {
    const igIndex = connections.findIndex((c) => c.platform === 'Instagram');
    const igConn: SocialConnection = {
      platform: 'Instagram',
      isConnected: true,
      username: '@akproduccionesfiestasyeventos',
      profileUrl: 'https://www.instagram.com/akproduccionesfiestasyeventos/',
      pageId,
      pageAccessToken,
      instagramAccountId,
      connectedAt: now,
    };

    if (igIndex > -1) {
      connections[igIndex] = { ...connections[igIndex], ...igConn };
    } else {
      connections.push(igConn);
    }
  }

  await writeData(CONNECTIONS_FILE, connections);
  return { success: true };
}

/**
 * Guarda credenciales y tokens de API para cualquier plataforma oficial (TikTok, YouTube, Google, Pinterest, X, Threads).
 */
export async function saveSocialCredentials(
  platform: SocialPlatformName,
  credentials: {
    profileUrl?: string;
    logoUrl?: string;
    pageId?: string;
    pageAccessToken?: string;
    instagramAccountId?: string;
    apiKey?: string;
    accessToken?: string;
    refreshToken?: string;
    channelId?: string;
    locationId?: string;
    boardId?: string;
    webhookUrl?: string;
  }
): Promise<{ success: boolean; connection?: SocialConnection; error?: string }> {
  await requireAppSession();

  const connections = await leerConexiones();
  const existingIndex = connections.findIndex((c) => c.platform === platform);
  const now = new Date().toISOString();

  const updatedConnection: SocialConnection = {
    ...(existingIndex > -1 ? connections[existingIndex] : { platform, isConnected: true }),
    ...credentials,
    platform,
    isConnected: true,
    connectedAt: now,
  };

  if (existingIndex > -1) {
    connections[existingIndex] = updatedConnection;
  } else {
    connections.push(updatedConnection);
  }

  await writeData(CONNECTIONS_FILE, connections);
  return { success: true, connection: updatedConnection };
}

/**
 * Guarda la configuración de Pasarela / Webhook Unificado (Camino B: n8n, Make, Upload-Post, Postiz).
 */
export async function saveUnifiedGatewaySettings(params: {
  webhookUrl: string;
  apiKey?: string;
}): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  const { webhookUrl, apiKey } = params;

  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, error: 'Por favor, ingresá una URL válida de Webhook (https://...).' };
  }

  const connections = await leerConexiones();
  const now = new Date().toISOString();

  // Guardamos la configuración en una entrada de conexión especial o genérica
  const existingIndex = connections.findIndex((c) => c.webhookUrl !== undefined);
  const conn: SocialConnection = {
    platform: 'Facebook', // Ancla a una plataforma existente
    isConnected: true,
    webhookUrl,
    apiKey,
    connectedAt: now,
  };

  if (existingIndex > -1) {
    connections[existingIndex] = { ...connections[existingIndex], webhookUrl, apiKey };
  } else {
    connections.push(conn);
  }

  await writeData(CONNECTIONS_FILE, connections);
  return { success: true };
}

