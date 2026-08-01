/**
 * Notion API Integration
 * 
 * Permite sincronizar los leads y eventos confirmados del CRM interno
 * con un tablero de Notion para la organización del staff operativo.
 */

export interface NotionEventData {
  fiestaId: string;
  clientName: string;
  eventType: string; // '15 años', 'Boda', etc.
  eventDate: string;
  guestCount: number;
}

export async function syncEventToNotion(data: NotionEventData): Promise<{ success: boolean; error?: string }> {
  const notionToken = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notionToken || !databaseId) {
    console.warn('[Notion Sync] Falta NOTION_API_KEY o NOTION_DATABASE_ID. Omitiendo sincronización.');
    return { success: true }; // Retorna true en dev para no bloquear el flujo
  }

  try {
    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          'Nombre del Cliente': {
            title: [
              {
                text: { content: data.clientName }
              }
            ]
          },
          'Tipo de Evento': {
            select: { name: data.eventType }
          },
          'Fecha': {
            date: { start: data.eventDate }
          },
          'ID Fiesta': {
            rich_text: [
              {
                text: { content: data.fiestaId }
              }
            ]
          },
          'Invitados': {
            number: data.guestCount
          },
          'Estado': {
            status: { name: 'Por Planificar' }
          }
        },
        children: [
          {
            object: 'block',
            type: 'to_do',
            to_do: {
              rich_text: [{ type: 'text', text: { content: 'Contactar al DJ' } }],
              checked: false
            }
          },
          {
            object: 'block',
            type: 'to_do',
            to_do: {
              rich_text: [{ type: 'text', text: { content: 'Confirmar Catering' } }],
              checked: false
            }
          }
        ]
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Notion Sync] Falló la API de Notion:', err);
      return { success: false, error: 'Fallo al crear página en Notion' };
    }

    return { success: true };
  } catch (error) {
    console.error('[Notion Sync] Error de red:', error);
    return { success: false, error: 'Error conectando a Notion' };
  }
}
