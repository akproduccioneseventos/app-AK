
'use server';

import type { SocialConnection, SocialPlatformName } from '@/types/settings';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const CONNECTIONS_FILE_PATH = path.join(DATA_DIR, 'social-connections.json');

async function ensureDataFileExists() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
  try {
    await fs.access(CONNECTIONS_FILE_PATH);
  } catch {
    await fs.writeFile(CONNECTIONS_FILE_PATH, '[]', 'utf-8');
  }
}

async function readConnectionsFile(): Promise<SocialConnection[]> {
  await ensureDataFileExists();
  const fileContent = await fs.readFile(CONNECTIONS_FILE_PATH, 'utf-8');
  return fileContent.trim() === '' ? [] : JSON.parse(fileContent);
}

async function writeConnectionsFile(data: SocialConnection[]): Promise<void> {
  await ensureDataFileExists();
  await fs.writeFile(CONNECTIONS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getSocialConnections(): Promise<SocialConnection[]> {
  return readConnectionsFile();
}

export async function saveWhatsAppNumber(phoneNumber: string): Promise<{ success: boolean; connection?: SocialConnection; error?: string }> {
  if (!phoneNumber || !/^\d+$/.test(phoneNumber.replace(/\s/g, ''))) {
    return { success: false, error: "Por favor, ingresa un número de teléfono válido (solo dígitos)." };
  }
  
  const connections = await readConnectionsFile();
  const existingConnection = connections.find(c => c.platform === 'WhatsApp');

  const newConnection: SocialConnection = {
    platform: 'WhatsApp',
    isConnected: true,
    username: `WhatsApp (${phoneNumber})`,
    phoneNumber: phoneNumber,
    connectedAt: new Date().toISOString(),
  };

  if (existingConnection) {
    const updatedConnections = connections.map(c => c.platform === 'WhatsApp' ? newConnection : c);
    await writeConnectionsFile(updatedConnections);
  } else {
    connections.push(newConnection);
    await writeConnectionsFile(connections);
  }

  return { success: true, connection: newConnection };
}


export async function connectSocialPlatform(platform: SocialPlatformName): Promise<{ success: boolean; connection?: SocialConnection; error?: string }> {
  if (platform === 'WhatsApp') {
    return { success: false, error: 'La conexión de WhatsApp se gestiona con un número de teléfono.' };
  }

  const connections = await readConnectionsFile();
  const existingConnection = connections.find(c => c.platform === platform);

  if (existingConnection?.isConnected) {
    return { success: false, error: `La cuenta de ${platform} ya está conectada.` };
  }

  // Simulate a successful OAuth connection
  const newConnection: SocialConnection = {
    platform,
    isConnected: true,
    username: `${platform}User_${Math.random().toString(36).substring(2, 8)}`,
    profilePictureUrl: 'https://placehold.co/40x40.png',
    connectedAt: new Date().toISOString(),
  };

  if (existingConnection) {
    // Update existing entry
    const updatedConnections = connections.map(c => c.platform === platform ? newConnection : c);
    await writeConnectionsFile(updatedConnections);
  } else {
    // Add new entry
    connections.push(newConnection);
    await writeConnectionsFile(connections);
  }

  return { success: true, connection: newConnection };
}

export async function disconnectSocialPlatform(platform: SocialPlatformName): Promise<{ success: boolean; error?: string }> {
  let connections = await readConnectionsFile();
  const initialLength = connections.length;
  connections = connections.filter(c => c.platform !== platform);
  
  if (connections.length === initialLength) {
    return { success: false, error: `No se encontró una conexión para ${platform}.`};
  }
  
  await writeConnectionsFile(connections);
  return { success: true };
}
