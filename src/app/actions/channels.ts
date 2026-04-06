'use server';

import { readData, writeData } from '@/lib/data-service';
import type {
  ChannelType,
  ChannelConfig,
  MultiChannelConfig,
  ChannelConversation,
  ChannelMessage,
  ChannelStats,
} from '@/types/channels';

const CHANNELS_CONFIG_FILE = 'channels-config.json';
const CHANNEL_CONVERSATIONS_FILE = 'channel-conversations.json';

const defaultConfig: MultiChannelConfig = {
  globalMode: 'semi-automatic',
  sharedSchedule: true,
  globalIntegrations: {
    createCrmLead: true,
    sendMarketingFollowUp: true,
    logMessageHistory: true,
  },
  globalSchedule: {
    days: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'],
    startTime: '09:00',
    endTime: '18:00',
  },
  channels: [],
};

// --- Config CRUD ---

export async function getChannelsConfig(): Promise<MultiChannelConfig> {
  const data = await readData<MultiChannelConfig>(CHANNELS_CONFIG_FILE, defaultConfig);
  return { ...defaultConfig, ...data };
}

export async function saveChannelConfig(
  channel: ChannelType,
  config: Partial<ChannelConfig>
): Promise<{ success: boolean; error?: string }> {
  try {
    const fullConfig = await getChannelsConfig();
    const idx = fullConfig.channels.findIndex(c => c.id === channel);
    if (idx >= 0) {
      fullConfig.channels[idx] = { ...fullConfig.channels[idx], ...config };
    } else {
      fullConfig.channels.push(config as ChannelConfig);
    }
    // Update status based on required fields
    if (idx >= 0) {
      const ch = fullConfig.channels[idx];
      if (ch.enabled && ch.apiKey) {
        ch.status = 'active';
      } else if (ch.apiKey) {
        ch.status = 'configured';
      } else {
        ch.status = 'not_configured';
      }
    }
    await writeData(CHANNELS_CONFIG_FILE, fullConfig);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al guardar configuración del canal.' };
  }
}

export async function toggleChannel(
  channel: ChannelType,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const fullConfig = await getChannelsConfig();
    const idx = fullConfig.channels.findIndex(c => c.id === channel);
    if (idx < 0) return { success: false, error: 'Canal no encontrado.' };
    fullConfig.channels[idx].enabled = enabled;
    if (enabled && fullConfig.channels[idx].apiKey) {
      fullConfig.channels[idx].status = 'active';
    } else if (!enabled && fullConfig.channels[idx].status === 'active') {
      fullConfig.channels[idx].status = 'configured';
    }
    await writeData(CHANNELS_CONFIG_FILE, fullConfig);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al cambiar estado del canal.' };
  }
}

export async function saveGlobalChannelSettings(
  settings: Partial<Omit<MultiChannelConfig, 'channels'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const fullConfig = await getChannelsConfig();
    const updated: MultiChannelConfig = { ...fullConfig, ...settings };
    await writeData(CHANNELS_CONFIG_FILE, updated);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al guardar configuración global.' };
  }
}

// --- Conversations ---

export async function getChannelConversations(
  channel?: ChannelType
): Promise<ChannelConversation[]> {
  const all = await readData<ChannelConversation[]>(CHANNEL_CONVERSATIONS_FILE, []);
  if (!channel) return all;
  return all.filter(c => c.channel === channel);
}

export async function getConversation(
  id: string
): Promise<ChannelConversation | null> {
  const all = await readData<ChannelConversation[]>(CHANNEL_CONVERSATIONS_FILE, []);
  return all.find(c => c.id === id) ?? null;
}

// --- Message processing ---

export async function processIncomingChannelMessage(
  channel: ChannelType,
  clientId: string,
  message: string,
  mediaUrl?: string
): Promise<{ response: string }> {
  const config = await getChannelsConfig();
  const channelConfig = config.channels.find(c => c.id === channel);

  if (!channelConfig?.enabled) {
    return { response: '' };
  }

  // Find or create conversation
  const conversations = await readData<ChannelConversation[]>(CHANNEL_CONVERSATIONS_FILE, []);
  const existingConv = conversations.find(
    c => c.channel === channel && c.clientId === clientId && c.status !== 'closed'
  );

  const now = new Date().toISOString();
  const incomingMsg: ChannelMessage = {
    id: `msg_${Date.now()}`,
    conversationId: existingConv?.id ?? '',
    from: 'client',
    content: message,
    timestamp: now,
    read: false,
    mediaUrl,
  };

  // Build response using the Asistente AK engine (simulated for now)
  const botResponse = await generateBotResponse(channel, message, channelConfig);

  const botMsg: ChannelMessage = {
    id: `msg_${Date.now() + 1}`,
    conversationId: existingConv?.id ?? '',
    from: 'bot',
    content: botResponse,
    timestamp: new Date().toISOString(),
    read: true,
  };

  if (existingConv) {
    existingConv.messages.push(incomingMsg, botMsg);
    existingConv.updatedAt = now;
    incomingMsg.conversationId = existingConv.id;
    botMsg.conversationId = existingConv.id;
    await writeData(CHANNEL_CONVERSATIONS_FILE, conversations);
  } else {
    const newConvId = `conv_${channel}_${Date.now()}`;
    incomingMsg.conversationId = newConvId;
    botMsg.conversationId = newConvId;
    const newConv: ChannelConversation = {
      id: newConvId,
      channel,
      clientId,
      clientName: clientId,
      status: 'active',
      mode: channelConfig.mode === 'manual' ? 'human' : 'bot',
      messages: [incomingMsg, botMsg],
      createdAt: now,
      updatedAt: now,
      metadata: { source: channel },
    };
    conversations.push(newConv);
    await writeData(CHANNEL_CONVERSATIONS_FILE, conversations);

    // Create CRM lead if integration enabled
    if (channelConfig.integrations.createCrmLead || config.globalIntegrations.createCrmLead) {
      try {
        const { addCrmLead } = await import('./crm');
        await addCrmLead({
          name: clientId,
          phone: channel === 'whatsapp' ? clientId : undefined,
          currentStageId: 's1',
          notes: `Consulta recibida por ${channelConfig.name}: "${message}"`,
        });
      } catch {
        // CRM lead creation is best-effort
      }
    }
  }

  return { response: botResponse };
}

async function generateBotResponse(
  channel: ChannelType,
  message: string,
  config: ChannelConfig
): Promise<string> {
  // Use the shared Asistente AK engine
  try {
    const { chatWithAssistant } = await import('@/ai/flows/assistant-flow');
    const result = await chatWithAssistant({
      message: `[Consulta por ${config.name}] ${message}`,
      history: [],
      context: `Estás respondiendo un mensaje de un cliente que escribió por ${config.name}. Respondé de forma amable y en español uruguayo.`,
    });
    return result.response ?? config.messages.welcome;
  } catch {
    // Fallback to welcome message if AI is unavailable
    return config.messages.welcome;
  }
}

// --- Conversation actions ---

export async function takeOverConversation(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const conversations = await readData<ChannelConversation[]>(CHANNEL_CONVERSATIONS_FILE, []);
    const idx = conversations.findIndex(c => c.id === conversationId);
    if (idx < 0) return { success: false, error: 'Conversación no encontrada.' };
    conversations[idx].mode = 'human';
    conversations[idx].status = 'waiting_human';
    conversations[idx].updatedAt = new Date().toISOString();
    await writeData(CHANNEL_CONVERSATIONS_FILE, conversations);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function returnToBotConversation(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const conversations = await readData<ChannelConversation[]>(CHANNEL_CONVERSATIONS_FILE, []);
    const idx = conversations.findIndex(c => c.id === conversationId);
    if (idx < 0) return { success: false, error: 'Conversación no encontrada.' };
    conversations[idx].mode = 'bot';
    conversations[idx].status = 'active';
    conversations[idx].updatedAt = new Date().toISOString();
    await writeData(CHANNEL_CONVERSATIONS_FILE, conversations);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function closeConversation(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const conversations = await readData<ChannelConversation[]>(CHANNEL_CONVERSATIONS_FILE, []);
    const idx = conversations.findIndex(c => c.id === conversationId);
    if (idx < 0) return { success: false, error: 'Conversación no encontrada.' };
    conversations[idx].status = 'closed';
    conversations[idx].updatedAt = new Date().toISOString();
    await writeData(CHANNEL_CONVERSATIONS_FILE, conversations);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// --- Stats ---

export async function getChannelStats(
  channel?: ChannelType
): Promise<ChannelStats[]> {
  const conversations = await readData<ChannelConversation[]>(CHANNEL_CONVERSATIONS_FILE, []);
  const channels: ChannelType[] = channel
    ? [channel]
    : ['whatsapp', 'instagram', 'facebook', 'tiktok'];

  return channels.map(ch => {
    const chConvs = conversations.filter(c => c.channel === ch);
    const active = chConvs.filter(c => c.status === 'active' || c.status === 'waiting_human');
    const leadsGenerated = chConvs.filter(c => c.leadId).length;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const messagesThisMonth = chConvs
      .filter(c => new Date(c.createdAt) >= startOfMonth)
      .reduce((sum, c) => sum + c.messages.length, 0);

    return {
      channel: ch,
      totalConversations: chConvs.length,
      activeConversations: active.length,
      leadsGenerated,
      avgResponseTime: '< 1 min',
      messagesThisMonth,
    };
  });
}

// --- Test connection (simulated) ---

export async function testChannelConnection(
  channel: ChannelType
): Promise<{ success: boolean; message: string }> {
  const config = await getChannelsConfig();
  const channelConfig = config.channels.find(c => c.id === channel);

  if (!channelConfig) {
    return { success: false, message: 'Canal no encontrado.' };
  }
  if (!channelConfig.apiKey && !channelConfig.accessToken) {
    return {
      success: false,
      message: 'Configurá las credenciales del canal antes de probar la conexión.',
    };
  }

  // Simulated connection test
  return {
    success: true,
    message: `✅ Conexión simulada exitosa con ${channelConfig.name}. Cuando tengás las credenciales reales, la conexión se verificará automáticamente.`,
  };
}
