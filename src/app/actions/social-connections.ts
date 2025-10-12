
'use server';

import type { SocialConnection, SocialPlatformName } from '@/types/settings';
import { readData, writeData } from '@/lib/data-service';

const CONNECTIONS_FILE = 'social-connections.json';

export async function getSocialConnections(): Promise<SocialConnection[]> {
  return readData<SocialConnection[]>(CONNECTIONS_FILE, []);
}

export async function saveWhatsAppNumber(
  phoneNumber: string,
  logoUrl?: string
): Promise<{ success: boolean; connection?: SocialConnection; error?: string }> {
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
  let connections = await getSocialConnections();
  const initialLength = connections.length;
  connections = connections.filter(c => c.platform !== platform);
  
  if (connections.length === initialLength) {
    return { success: false, error: `No se encontró una conexión para ${platform}.`};
  }
  
  await writeData(CONNECTIONS_FILE, connections);
  return { success: true };
}
