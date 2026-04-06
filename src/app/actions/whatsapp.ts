'use server';

import { readData, writeData } from '@/lib/data-service';
import type { WhatsAppConfig, WhatsAppConversation, WhatsAppMessage, WhatsAppStats } from '@/types/whatsapp';
import { addCrmLead, getCrmLeads } from '@/app/actions/crm';
import { createNotification } from '@/app/actions/notifications';

const CONFIG_FILE = 'whatsapp-config.json';
const CONVERSATIONS_FILE = 'whatsapp-conversations.json';

const defaultConfig: WhatsAppConfig = {
  enabled: false,
  phoneNumber: '',
  apiKey: '',
  verifyToken: '',
  provider: 'meta',
  mode: 'semi-automatic',
  messages: {
    welcome: '¡Hola! 👋 Soy el asistente de AK Producciones Eventos. ¿En qué puedo ayudarte?',
    offHours: 'Gracias por escribir. Nuestro horario de atención es de Lun a Vie de 9 a 18hs. Te responderemos a la brevedad.',
    followUp: '¡Hola! Hace unos días consultaste por nuestros servicios. ¿Pudiste decidirte? Estamos para ayudarte 🎉',
    farewell: '¡Gracias por contactarnos! Si necesitás algo más, escribinos. 🎉',
  },
  schedule: {
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    startTime: '09:00',
    endTime: '18:00',
  },
  integrations: {
    createCrmLead: true,
    sendMarketingFollowUp: true,
    logMessageHistory: true,
  },
};

// --- Config ---

export async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  const data = await readData<Partial<WhatsAppConfig>>(CONFIG_FILE, {});
  return { ...defaultConfig, ...data } as WhatsAppConfig;
}

export async function saveWhatsAppConfig(
  config: Partial<WhatsAppConfig>
): Promise<{ success: boolean; config?: WhatsAppConfig; error?: string }> {
  try {
    const current = await getWhatsAppConfig();
    const toSave: WhatsAppConfig = {
      ...current,
      ...config,
      messages: { ...current.messages, ...(config.messages ?? {}) },
      schedule: { ...current.schedule, ...(config.schedule ?? {}) },
      integrations: { ...current.integrations, ...(config.integrations ?? {}) },
    };
    await writeData(CONFIG_FILE, toSave);
    return { success: true, config: toSave };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al guardar la configuración.' };
  }
}

// --- Conversations ---

export async function getWhatsAppConversations(): Promise<WhatsAppConversation[]> {
  const data = await readData<WhatsAppConversation[]>(CONVERSATIONS_FILE, []);
  if (!Array.isArray(data)) return [];
  return [...data].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getWhatsAppConversation(id: string): Promise<WhatsAppConversation | null> {
  const conversations = await getWhatsAppConversations();
  return conversations.find(c => c.id === id) ?? null;
}

export async function sendWhatsAppMessage(
  conversationId: string,
  message: string
): Promise<{ success: boolean; message?: WhatsAppMessage; error?: string }> {
  try {
    const conversations = await readData<WhatsAppConversation[]>(CONVERSATIONS_FILE, []);
    const idx = conversations.findIndex(c => c.id === conversationId);
    if (idx === -1) return { success: false, error: 'Conversación no encontrada.' };

    const now = new Date().toISOString();
    const newMsg: WhatsAppMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      conversationId,
      from: conversations[idx].mode === 'human' ? 'human' : 'bot',
      content: message,
      timestamp: now,
      read: true,
    };

    conversations[idx].messages.push(newMsg);
    conversations[idx].updatedAt = now;
    await writeData(CONVERSATIONS_FILE, conversations);
    return { success: true, message: newMsg };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al enviar el mensaje.' };
  }
}

/**
 * Process an incoming WhatsApp message.
 * 1. Find or create a conversation for the phone number.
 * 2. If CRM integration is active, create/update lead.
 * 3. Generate a bot response based on the operating mode.
 * 4. Notify when human intervention is needed.
 */
export async function processIncomingMessage(
  phone: string,
  message: string,
  clientName?: string
): Promise<{ success: boolean; botResponse?: string; conversationId?: string; error?: string }> {
  try {
    const config = await getWhatsAppConfig();
    if (!config.enabled) {
      return { success: true };
    }

    const conversations = await readData<WhatsAppConversation[]>(CONVERSATIONS_FILE, []);
    const now = new Date().toISOString();

    // Find or create conversation
    let convIdx = conversations.findIndex(c => c.clientPhone === phone && c.status !== 'closed');
    if (convIdx === -1) {
      const newConv: WhatsAppConversation = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        clientPhone: phone,
        clientName: clientName || `WhatsApp +${phone}`,
        status: 'active',
        mode: 'bot',
        messages: [],
        createdAt: now,
        updatedAt: now,
        metadata: { source: 'whatsapp' },
      };
      conversations.push(newConv);
      convIdx = conversations.length - 1;
    }

    const conv = conversations[convIdx];

    // Save incoming message
    const incomingMsg: WhatsAppMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      conversationId: conv.id,
      from: 'client',
      content: message,
      timestamp: now,
      read: false,
    };
    conversations[convIdx].messages.push(incomingMsg);
    conversations[convIdx].updatedAt = now;

    // CRM integration: create lead if new conversation and integration enabled
    let leadId = conv.leadId;
    if (config.integrations.createCrmLead && !leadId) {
      const existingLeads = await getCrmLeads();
      const normalizedPhone = phone.replace(/\D/g, '').slice(-9);
      const existingLead = existingLeads.find(l => l.phone && l.phone.replace(/\D/g, '').slice(-9) === normalizedPhone);

      if (existingLead) {
        leadId = existingLead.id;
      } else {
        const res = await addCrmLead({
          name: clientName || `WhatsApp +${phone}`,
          phone,
          notes: `Mensaje inicial: ${message}\nFuente: WhatsApp Bot`,
          budgetSource: 'manual',
          currentStageId: '',
        } as any);
        if (res.success && res.lead) {
          leadId = res.lead.id;
        }
      }
      conversations[convIdx].leadId = leadId;
    }

    // Generate bot response based on mode
    let botResponse: string | undefined;

    if (conv.mode === 'bot') {
      if (config.mode === 'manual') {
        // Only notify, no automatic response
        await createNotification({
          mensaje: `📱 Nuevo mensaje de WhatsApp de ${conv.clientName}: "${message.substring(0, 60)}${message.length > 60 ? '...' : ''}"`,
          href: `/settings/whatsapp-business/conversations`,
          icono: 'MessageCircle',
        });
      } else if (config.mode === 'semi-automatic') {
        // Respond to common questions, notify for the rest
        botResponse = generateSemiAutoResponse(message, config);
        if (!botResponse) {
          // Notify for human to take over
          conversations[convIdx].status = 'waiting_human';
          await createNotification({
            mensaje: `📱 WhatsApp: ${conv.clientName} necesita atención. "${message.substring(0, 60)}${message.length > 60 ? '...' : ''}"`,
            href: `/settings/whatsapp-business/conversations`,
            icono: 'MessageCircle',
          });
        }
      } else {
        // Automatic mode: use welcome or generic response
        botResponse = generateAutoResponse(message, config, conv.messages.length === 1);
      }

      // Save bot response message
      if (botResponse) {
        const botMsg: WhatsAppMessage = {
          id: `msg_${Date.now() + 1}_${Math.random().toString(36).substring(2, 7)}`,
          conversationId: conv.id,
          from: 'bot',
          content: botResponse,
          timestamp: new Date().toISOString(),
          read: true,
        };
        conversations[convIdx].messages.push(botMsg);
        conversations[convIdx].updatedAt = new Date().toISOString();
      }
    }

    await writeData(CONVERSATIONS_FILE, conversations);
    return { success: true, botResponse, conversationId: conv.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al procesar el mensaje.' };
  }
}

function generateSemiAutoResponse(message: string, config: WhatsAppConfig): string | undefined {
  const lower = message.toLowerCase();

  // Greetings
  if (/^(hola|buen[ao]s|buenas|hey|hi)\b/.test(lower)) {
    return config.messages.welcome;
  }

  // Price / budget questions
  if (/precio|costo|presupuesto|cuánto|cuanto|vale|cobr/.test(lower)) {
    return '¡Gracias por tu consulta! Para darte un presupuesto personalizado necesitamos algunos datos: tipo de evento, fecha estimada y cantidad de invitados. ¿Podés contarnos más? 🎉';
  }

  // Availability questions
  if (/disponib|libre|fecha|agenda/.test(lower)) {
    return 'Para consultar disponibilidad, por favor indicanos la fecha que tenés en mente y el tipo de evento. ¡Nos fijamos enseguida!';
  }

  // Services questions
  if (/servicio|qué hacen|que hacen|ofrecen/.test(lower)) {
    return 'Ofrecemos servicios para todo tipo de eventos: catering, DJ, decoración, iluminación, coordinación y más. ¿Qué tipo de evento estás planeando?';
  }

  // Contact / location
  if (/dirección|donde están|donde estan|ubicación|ubicacion/.test(lower)) {
    return 'Estamos en Salto, Uruguay. Para más información podés contactarnos también al teléfono o por email. ¿En qué más te puedo ayudar?';
  }

  // Farewell
  if (/gracias|chau|hasta luego|adiós|adios/.test(lower)) {
    return config.messages.farewell;
  }

  return undefined; // Needs human attention
}

function generateAutoResponse(message: string, config: WhatsAppConfig, isFirst: boolean): string {
  if (isFirst) {
    return config.messages.welcome;
  }
  const semi = generateSemiAutoResponse(message, config);
  return semi ?? '¡Gracias por escribirnos! Estamos procesando tu consulta. Te responderemos a la brevedad. 😊';
}

export async function takeOverConversation(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const conversations = await readData<WhatsAppConversation[]>(CONVERSATIONS_FILE, []);
    const idx = conversations.findIndex(c => c.id === conversationId);
    if (idx === -1) return { success: false, error: 'Conversación no encontrada.' };
    conversations[idx].mode = 'human';
    conversations[idx].status = 'active';
    conversations[idx].updatedAt = new Date().toISOString();
    await writeData(CONVERSATIONS_FILE, conversations);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function returnToBotConversation(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const conversations = await readData<WhatsAppConversation[]>(CONVERSATIONS_FILE, []);
    const idx = conversations.findIndex(c => c.id === conversationId);
    if (idx === -1) return { success: false, error: 'Conversación no encontrada.' };
    conversations[idx].mode = 'bot';
    conversations[idx].updatedAt = new Date().toISOString();
    await writeData(CONVERSATIONS_FILE, conversations);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getWhatsAppStats(): Promise<WhatsAppStats> {
  const conversations = await getWhatsAppConversations();
  const active = conversations.filter(c => c.status === 'active' || c.status === 'waiting_human');
  const withLeads = conversations.filter(c => c.leadId);

  // Count question frequency from client messages
  const questionMap: Record<string, number> = {};
  for (const conv of conversations) {
    for (const msg of conv.messages) {
      if (msg.from === 'client') {
        const words = msg.content.toLowerCase().split(/\s+/).slice(0, 8).join(' ');
        questionMap[words] = (questionMap[words] ?? 0) + 1;
      }
    }
  }
  const topQuestions = Object.entries(questionMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([question, count]) => ({ question, count }));

  return {
    totalConversations: conversations.length,
    activeConversations: active.length,
    leadsGenerated: withLeads.length,
    avgResponseTime: conversations.length > 0 ? '< 1 min' : '-',
    topQuestions,
  };
}
