'use server';

import type { Invitado, LayoutElement } from '@/types/fiesta';

import { requireAppSession } from '@/lib/auth/require-session';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
export async function autoAssignTables(
  invitados: Invitado[],
  tables: LayoutElement[]
): Promise<{ success: boolean; updatedInvitados: Invitado[]; logs: string[] }> {
  await requireAppSession();
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
  /**
   * Freno contra robots: este chat le pregunta a la inteligencia artificial y eso
   * se paga por pedido.
   *
   * Van dos frenos, y hacen falta los dos:
   *
   * - **Por celular** (25 cada cuarto de hora): frena a un robot solo insistiendo.
   * - **Por fiesta** (120 cada cuarto de hora, sin mirar de que celular viene):
   *   es el techo de gasto de la noche. Sin este, cien direcciones distintas
   *   pidiendo una vez cada una gastan lo mismo que una pidiendo cien veces.
   *
   * El de la fiesta va alto a proposito: en un evento hay muchos invitados
   * preguntando a la vez y no puede cortarse en el medio.
   */
  try {
    await enforcePublicRateLimit({
      scope: 'guest-bot',
      limit: 25,
      windowMs: 15 * 60_000,
    });
    await enforcePublicRateLimit({
      scope: 'guest-bot-techo',
      identity: `fiesta-${fiesta?.id || 'sin-fiesta'}`,
      limit: 120,
      windowMs: 15 * 60_000,
      ignoreClientAddress: true,
    });
  } catch {
    return {
      success: true,
      response: 'Uy, me estan preguntando muchas cosas a la vez. Dame un minutito y volve a intentar.',
    };
  }

  try {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: true, response: getMockBotResponse(message, fiesta) };
    }

    // Lo que se paga pasa por el contador, siempre. Sin esto el gasto de este chat
    // no aparecia en ningun lado y el tope mensual no lo frenaba.
    const { hayPresupuestoParaIA, registrarConsumoIA } = await import('@/lib/ai/consumo-servidor');
    if (!(await hayPresupuestoParaIA())) {
      return { success: true, response: getMockBotResponse(message, fiesta) };
    }

    const { generateWithGeminiFallback, geminiModel } = await import('@/ai/genkit');

    const historyText = history
      .slice(-10)
      .map(h => `${h.role === 'bot' ? 'Asistente' : 'Invitado'}: ${h.text}`)
      .join('\n');

    const response = await generateWithGeminiFallback({
      model: geminiModel,
      system: `Sos el Asistente Virtual IA de la fiesta de ${fiesta.configuracion?.nombreAgasajado || fiesta.clienteNombre || 'nuestro anfitrión'}.
Tu objetivo es responder de forma amable, alegre y festiva a los invitados sobre los detalles de la fiesta.
Usá el dialecto rioplatense (uruguayo: vos, che, ta, dale) de forma sutil y amigable.

Detalles de la fiesta:
- Nombre del agasajado/a: ${fiesta.configuracion?.nombreAgasajado || 'No especificado'}
- Tipo de fiesta: ${fiesta.eventoTipo || 'No especificado'}
- Fecha: ${fiesta.fecha || 'No especificado'}
- Hora de inicio: ${fiesta.configuracion?.horaInicio || 'NO CARGADO'}
- Ubicación / Salón: ${fiesta.configuracion?.salonNombre || 'NO CARGADO'}
- Código de vestimenta (Dresscode): ${fiesta.configuracion?.dressCode || 'NO CARGADO'}
- Detalles adicionales: ${fiesta.configuracion?.notasAdicionales || '¡Traer buena onda y ganas de bailar!'}

Responde de manera concisa (máximo 2 párrafos cortos). Si te preguntan algo que no sabés, deciles que le consulten al anfitrión o a los organizadores.

REGLA QUE NO SE ROMPE: si un dato de arriba dice NO CARGADO, **no lo inventes ni lo estimes**. Decí que ese dato todavía no está y que lo consulten en la invitación o con el anfitrión. Un invitado que llega a la hora equivocada porque la inventaste se queda afuera.`,
      prompt: [historyText ? `Conversacion previa:\n${historyText}` : '', `Mensaje del invitado:\n${message}`].filter(Boolean).join('\n\n'),
    });

    await registrarConsumoIA('chat-de-la-fiesta');

    return { success: true, response: response.text };
  } catch (error: any) {
    console.error("Error in chatWithGuestBot:", error);
    return { success: false, response: getMockBotResponse(message, fiesta) };
  }
}

/**
 * La respuesta del chat cuando no hay inteligencia artificial disponible.
 *
 * **Nunca completa un dato que no esta cargado.** Antes, si la fiesta no tenia
 * hora, contestaba "empezamos puntual a las 21:00 hs"; si no tenia salon, "el
 * Salon Principal"; si no tenia codigo de vestimenta, "Elegante Sport". Eran datos
 * inventados, dichos con total seguridad, **al invitado, la noche de la fiesta**.
 * Un invitado que llega a las 21:00 a una fiesta que empieza a las 22:00 se queda
 * una hora en la puerta, y el que se viste elegante sport en una de etiqueta pasa
 * verguenza.
 *
 * Regla: si el dato no esta, se dice que no esta y se manda a preguntarle al
 * anfitrion. Es la respuesta correcta y no cuesta nada.
 */
function getMockBotResponse(message: string, fiesta: any): string {
  const lower = message.toLowerCase();
  const config = fiesta?.configuracion;
  const anfitrion = config?.nombreAgasajado;

  const preguntaPorHora = lower.includes('hora') || lower.includes('cuando') || lower.includes('cuándo');
  const preguntaPorRopa = lower.includes('ropa') || lower.includes('vestimenta')
    || lower.includes('ponerme') || lower.includes('vestir');
  const preguntaPorLugar = lower.includes('donde') || lower.includes('dónde')
    || lower.includes('lugar') || lower.includes('salon') || lower.includes('salón');

  if (preguntaPorHora) {
    if (config?.horaInicio) {
      const deQuien = anfitrion ? `La fiesta de ${anfitrion}` : 'La fiesta';
      const cuando = fiesta?.fecha ? ` es el ${fiesta.fecha} y` : '';
      return `${deQuien}${cuando} empieza a las ${config.horaInicio}. ¡No llegues tarde!`;
    }
    return 'La hora todavía no está cargada acá. Fijate en la invitación o preguntale al anfitrión, así no te arriesgás.';
  }

  if (preguntaPorRopa) {
    if (config?.dressCode) {
      return `El código de vestimenta es: ${config.dressCode}. ¡Vení cómodo para bailar!`;
    }
    return 'El código de vestimenta no está cargado acá. Mejor preguntale al anfitrión antes de elegir.';
  }

  if (preguntaPorLugar) {
    if (config?.salonNombre) {
      return `Te esperamos en: ${config.salonNombre}. Buscá la ubicación en la invitación.`;
    }
    return 'El lugar no está cargado acá. Está en la invitación, o preguntale al anfitrión.';
  }

  return '¡Hola! Te esperamos con muchas ganas en la fiesta. Cualquier duda, consultale al anfitrión.';
}
