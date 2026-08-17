
'use server';

import type { SocialConnection, SocialPlatformName } from '@/types/settings';
import { readData, writeData } from '@/lib/data-service';
import { requireAppSession } from '@/lib/auth/require-session';

const CONNECTIONS_FILE = 'social-connections.json';

export async function getSocialConnections(): Promise<SocialConnection[]> {
  return readData<SocialConnection[]>(CONNECTIONS_FILE, []);
}

export async function saveWhatsAppNumber(
  phoneNumber: string,
  logoUrl?: string
): Promise<{ success: boolean; connection?: SocialConnection; error?: string }> {
  await requireAppSession();
  if (!phoneNumber || !/^\d+$/.test(phoneNumber.replace(/\s/g, ''))) {
    return { success: false, error: "Por favor, ingresa un número de teléfono válido (solo dígitos)." };
  }
  
  const connections = await getSocialConnections();
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

  const connections = await getSocialConnections();
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
  let connections = await getSocialConnections();
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

  const connections = await getSocialConnections();
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
      username: '@akproduccioneseventos',
      profileUrl: 'https://instagram.com/akproduccioneseventos',
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

