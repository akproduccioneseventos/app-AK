'use server';

import type { Invitado, LayoutElement } from '@/types/fiesta';

export async function autoAssignTables(
  invitados: Invitado[],
  tables: LayoutElement[]
): Promise<{ success: boolean; updatedInvitados: Invitado[]; logs: string[] }> {
  try {
    const logs: string[] = [];
    logs.push(`Iniciando IA Auto-Acomodador: ${invitados.length} invitados, ${tables.length} mesas.`);

    // 1. Clonar lista para no mutar original
    const newInvitados = [...invitados].map(i => ({ ...i }));
    
    // 2. Extraer mesas y su capacidad
    const availableTables = tables.filter((t): t is LayoutElement & { width: number; height: number } => (
      t.category?.toLowerCase().includes('mesa') === true &&
      typeof t.width === 'number' &&
      typeof t.height === 'number'
    )).map(t => ({
      name: t.name,
      capacity: ((t.width || 0) / 40) * 2 + ((t.height || 0) / 40) * 2, // Estimación básica: perímetro. Asumimos maxCapacity viene en props o la calculamos
      seatsOccupied: 0,
      tags: new Set<string>()
    }));

    // Mejorar la capacidad: si el elemento tiene maxCapacity, usarlo, si no, asumir 8 o 10.
    // Como el tipo LayoutElement en este proyecto tiene width/height pero capaz no 'capacity' explicita, fijaremos 10 genéricamente
    const tableSeats = availableTables.map(t => ({
      ...t,
      capacity: 10 // Mock capacity for now
    }));

    // 3. Contar ocupación actual (para mantener a los que YA tienen mesa)
    newInvitados.forEach(inv => {
      if (inv.tableNumber) {
        const t = tableSeats.find(tbl => tbl.name === inv.tableNumber);
        if (t) {
          t.seatsOccupied += (inv.partySize || 1);
          if (inv.tag) t.tags.add(inv.tag);
        }
      }
    });

    // 4. Obtener los que NO tienen mesa, ordenados por grupo más grande primero para optimizar Tetris
    const unassigned = newInvitados
      .filter(i => !i.tableNumber && i.rsvp === 'Confirmado')
      .sort((a, b) => (b.partySize || 1) - (a.partySize || 1));

    logs.push(`${unassigned.length} invitados confirmados sin mesa.`);

    // 5. Algoritmo de asignación
    unassigned.forEach(inv => {
      const size = inv.partySize || 1;
      let assigned = false;

      // Intento A: Buscar mesa que ya tenga el mismo tag y tenga espacio
      if (inv.tag) {
        const tableWithTag = tableSeats.find(t => 
          t.tags.has(inv.tag!) && (t.capacity - t.seatsOccupied) >= size
        );
        if (tableWithTag) {
          inv.tableNumber = tableWithTag.name;
          tableWithTag.seatsOccupied += size;
          assigned = true;
          logs.push(`Asignado [${inv.nombre}] a ${tableWithTag.name} por afinidad (${inv.tag}).`);
        }
      }

      // Intento B: Si no se pudo por tag, buscar cualquier mesa vacía o con espacio suficiente
      if (!assigned) {
        // Preferir mesas completamente vacías primero para no mezclar si no es necesario, o las más llenas para compactar
        // Compactaremos: buscar la mesa con MENOS espacio disponible pero que igual entre
        const fitTables = tableSeats
          .filter(t => (t.capacity - t.seatsOccupied) >= size)
          .sort((a, b) => (a.capacity - a.seatsOccupied) - (b.capacity - b.seatsOccupied));

        if (fitTables.length > 0) {
          const chosen = fitTables[0];
          inv.tableNumber = chosen.name;
          chosen.seatsOccupied += size;
          if (inv.tag) chosen.tags.add(inv.tag);
          assigned = true;
          logs.push(`Asignado [${inv.nombre}] a ${chosen.name} por espacio.`);
        }
      }

      if (!assigned) {
        logs.push(`ATENCIÓN: No hay espacio en ninguna mesa para [${inv.nombre}] (grupo de ${size}).`);
      }
    });

    return { success: true, updatedInvitados: newInvitados, logs };
  } catch (error: any) {
    return { success: false, updatedInvitados: invitados, logs: [error.message] };
  }
}

export async function chatWithGuestBot(
  fiesta: any,
  message: string,
  history: Array<{ role: 'bot' | 'user'; text: string }>
): Promise<{ success: boolean; response: string }> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: true, response: getMockBotResponse(message, fiesta) };
    }

    const { ai, geminiModel } = await import('@/ai/genkit');

    const historyText = history
      .slice(-10)
      .map(h => `${h.role === 'bot' ? 'Asistente' : 'Invitado'}: ${h.text}`)
      .join('\n');

    const response = await ai.generate({
      model: geminiModel,
      system: `Sos el Asistente Virtual IA de la fiesta de ${fiesta.configuracion?.nombreAgasajado || fiesta.clienteNombre || 'nuestro anfitrión'}.
Tu objetivo es responder de forma amable, alegre y festiva a los invitados sobre los detalles de la fiesta.
Usá el dialecto rioplatense (uruguayo: vos, che, ta, dale) de forma sutil y amigable.

Detalles de la fiesta:
- Nombre del agasajado/a: ${fiesta.configuracion?.nombreAgasajado || 'No especificado'}
- Tipo de fiesta: ${fiesta.eventoTipo || 'No especificado'}
- Fecha: ${fiesta.fecha || 'No especificado'}
- Hora de inicio: ${fiesta.configuracion?.horaInicio || '21:00 hs'}
- Ubicación / Salón: ${fiesta.configuracion?.salonNombre || 'Salón Principal'}
- Código de vestimenta (Dresscode): ${fiesta.configuracion?.dressCode || 'Elegante Sport'}
- Detalles adicionales: ${fiesta.configuracion?.notasAdicionales || '¡Traer buena onda y ganas de bailar!'}

Responde de manera concisa (máximo 2 párrafos cortos). Si te preguntan algo que no sabés, deciles que le consulten al anfitrión o a los organizadores.`,
      prompt: [historyText ? `Conversacion previa:\n${historyText}` : '', `Mensaje del invitado:\n${message}`].filter(Boolean).join('\n\n'),
    });

    return { success: true, response: response.text };
  } catch (error: any) {
    console.error("Error in chatWithGuestBot:", error);
    return { success: false, response: getMockBotResponse(message, fiesta) };
  }
}

function getMockBotResponse(message: string, fiesta: any): string {
  let botResponse = "¡Hola! Te esperamos con muchas ganas en la fiesta. Si tienes alguna duda, consúltale directamente al anfitrión.";
  const lower = message.toLowerCase();
  if (lower.includes('hora') || lower.includes('cuando') || lower.includes('cuándo')) {
    botResponse = `La fiesta de ${fiesta.configuracion?.nombreAgasajado || 'nuestro anfitrión'} es el ${fiesta.fecha || 'pronto'}, empezaremos puntual a las ${fiesta.configuracion?.horaInicio || '21:00 hs'}. ¡No llegues tarde!`;
  } else if (lower.includes('ropa') || lower.includes('vestimenta') || lower.includes('ponerme') || lower.includes('vestir')) {
    botResponse = `El código de vestimenta es: ${fiesta.configuracion?.dressCode || 'Elegante Sport'}. ¡Vení cómodo para bailar!`;
  } else if (lower.includes('donde') || lower.includes('dónde') || lower.includes('lugar') || lower.includes('salon') || lower.includes('salón')) {
    botResponse = `Te esperamos en: ${fiesta.configuracion?.salonNombre || 'el Salón Principal'}. ¡Busca la ubicación en la invitación!`;
  }
  return botResponse;
}
