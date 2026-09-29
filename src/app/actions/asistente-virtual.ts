'use server';

import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { getArmadoRapidoConfig, captureSimulatorLeadProgress } from '@/app/actions/armado-rapido';
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';
import { generateWithGeminiFallback, geminiCommercialModel } from '@/ai/genkit';
import type { MessageData } from 'genkit';

export interface AssistantResponse {
  success: boolean;
  text?: string;
  error?: string;
  budgetGenerated?: boolean;
  budgetUrl?: string;
}

/**
 * Si la persona dijo que si, con sus palabras.
 *
 * No alcanza con que el resumen automatico diga que dio permiso: un resumen puede
 * equivocarse, y de ese permiso depende que despues se le mande un WhatsApp que no
 * se puede deshacer. Por eso se pide tambien que su ultimo mensaje sea un si.
 */
function esUnSi(mensaje: string): boolean {
  const limpio = (mensaje || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  if (!limpio) return false;
  if (/\b(no|nunca|prefiero que no|ni ahi)\b/.test(limpio)) return false;
  return /\b(si|sii+|dale|ok|oka|okey|obvio|claro|de una|perfecto|listo|acepto|autorizo|por supuesto|correcto|va|bueno)\b/.test(
    limpio,
  );
}

export async function chatWithVirtualAssistant(
  sessionId: string,
  history: MessageData[],
  newMessage: string
): Promise<AssistantResponse> {
  try {
    // 1. Validar límite de uso (Rate Limiting) basado en el sessionId/IP
    await enforcePublicRateLimit({
      scope: 'public-virtual-assistant',
      identity: sessionId || 'anonymous',
      limit: 20, // 20 mensajes por hora por sesión
      windowMs: 60 * 60 * 1000,
    });

    // 2. Control de presupuesto de IA
    if (!(await hayPresupuestoParaIA())) {
      return {
        success: false,
        error: 'En este momento nuestros asesores están ocupados. Por favor, utilizá nuestro simulador tradicional o escribinos por WhatsApp.',
      };
    }

    // 3. Obtener contexto del catálogo para que la IA no invente
    const config = await getArmadoRapidoConfig();
    const paquetesContext = config.paquetes.map(p => `- Paquete ${p.nombre}: ${p.descripcion}`).join('\n');
    const menusContext = config.menus.map(m => `- Menú ${m.nombre}: ${m.descripcion}`).join('\n');

    // 4. Prompt del sistema
    const systemPrompt = `Sos el asesor de ventas virtual 24/7 de AK Producciones, una empresa uruguaya de eventos.
Tu objetivo es responder dudas usando SOLO el catálogo oficial, y guiar al usuario para armar un presupuesto.
Catálogo de paquetes:
${paquetesContext}
Catálogo de menús:
${menusContext}

REGLAS ESTRICTAS:
- No inventes precios. Si preguntan precio, decí que necesitás algunos datos para armar el presupuesto a medida.
- No inventes fechas libres. Si preguntan por una fecha, decí "Te confirmo la disponibilidad exacta en un rato, pero dejame armarte el presupuesto para esa fecha".
- Escribí en español rioplatense (uruguayo), amigable y corto.
- Tu meta final es conseguir estos 5 datos: Nombre, Teléfono uruguayo (empieza con 09), Tipo de Evento, Fecha Estimada, y Cantidad de Invitados.
- IMPORTANTE: Cuando tengas los 5 datos, DEBES pedir permiso explícitamente para contactarlo: "¿Me das permiso para que te contactemos por WhatsApp con la propuesta armada?".
- SI EL USUARIO DA EL PERMISO (dice "sí", "dale", "ok", etc.) y ya tenés los 5 datos, DEBES responder exactamente y únicamente con este texto: "[GENERAR_PRESUPUESTO]". NO AGREGUES MÁS TEXTO.

Si el usuario dice algo que no entendés, preguntá amablemente.`;

    // 5. Llamada a Genkit con historial
    const response = await generateWithGeminiFallback({
      model: geminiCommercialModel,
      system: systemPrompt,
      messages: [
        ...history,
        { role: 'user', content: [{ text: newMessage }] }
      ]
    });

    const replyText = response.text?.trim() || '';
    await registrarConsumoIA('vendedor-virtual');

    // 6. Verificar si la IA decidió generar el presupuesto
    if (replyText === '[GENERAR_PRESUPUESTO]') {
      // Extraer datos estructurados con JSON
      const extractionResponse = await generateWithGeminiFallback({
        model: geminiCommercialModel,
        prompt: `Extraé los siguientes datos del historial de chat. Formato JSON estricto con las claves: "nombre" (string), "telefono" (string), "evento" (string), "invitados" (number), "fecha" (string), "permisoContacto" (boolean). Si no hay algún dato, poné null.
"permisoContacto" es true SOLO si la persona dijo con sus propias palabras que sí acepta que la contacten. Ante la menor duda, false.
Historial:
${JSON.stringify(history)}
Último mensaje:
${newMessage}`,
        output: { format: 'json' }
      });

      const data = extractionResponse.output;
      // La segunda llamada tambien se paga: se cuenta.
      await registrarConsumoIA('vendedor-virtual');

      if (data && data.nombre && data.telefono && data.evento) {
        const permisoConcedido =
          data.permisoContacto === true && esUnSi(newMessage);

        const progressRes = await captureSimulatorLeadProgress({
          clienteNombre: data.nombre,
          clienteContacto: data.telefono,
          eventoTipo: data.evento,
          eventoFecha: data.fecha || undefined,
          invitados: Number(data.invitados) || 100,
          marketingConsent: permisoConcedido,
        });

        if (progressRes.success && progressRes.leadId) {
          return {
            success: true,
            text: 'Listo, ya tengo tus datos. En un rato te pasamos el presupuesto armado a medida. Si querés adelantarlo, podés usar el simulador o escribirnos por WhatsApp.',
          };
        }
      }

      // Si no se pudo guardar el dato, igual no se deja al cliente sin respuesta.
      return {
        success: true,
        text: 'Anoté lo que me contaste. Para no hacerte esperar, escribinos por WhatsApp y te armamos el presupuesto en el momento.'
      };
    }

    return {
      success: true,
      text: replyText,
    };
  } catch (error: any) {
    console.error('[chatWithVirtualAssistant] Error:', error);
    return {
      success: false,
      error: 'En este momento nuestros asesores están ocupados. Por favor, utilizá nuestro simulador tradicional o escribinos por WhatsApp.',
    };
  }
}

/**
 * Asistente para el Portal del Cliente (Organizador).
 * Contexto filtrado en el servidor para SU fiesta únicamente.
 */
export async function chatConAsistenteCliente(
  fiestaId: string,
  history: MessageData[],
  newMessage: string
): Promise<AssistantResponse> {
  try {
    if (!fiestaId) {
      return { success: false, error: 'Identificador de fiesta no especificado.' };
    }

    await enforcePublicRateLimit({
      scope: `portal-cliente-${fiestaId}`,
      identity: fiestaId,
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });

    if (!(await hayPresupuestoParaIA())) {
      return {
        success: false,
        error: 'El asistente del portal está temporalmente ocupado. Por favor, consultanos por WhatsApp.',
      };
    }

    const { getFiestaById } = await import('@/app/actions/fiesta/fiesta.actions');
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) {
      return { success: false, error: 'No se encontró la fiesta solicitada.' };
    }

    const nombreEvento = fiesta.configuracion?.nombreEvento || fiesta.id || 'Tu Fiesta';
    const tipoCelebracion = fiesta.configuracion?.tipoCelebracion || 'Celebración';
    const fechaEvento = fiesta.configuracion?.fechaEvento || 'A coordinar';
    const salon = fiesta.configuracion?.nombreLugar || (fiesta.configuracion as any)?.salon || 'Por definir';
    const invitadosEstimados = fiesta.configuracion?.invitadosEstimados || 0;

    const tareasPendientes = (fiesta.tareas || [])
      .filter((t: any) => !t.completada && !t.hecha)
      .slice(0, 5)
      .map((t: any) => `• ${t.titulo || t.texto}`)
      .join('\n') || 'Ninguna pendiente.';

    const systemPrompt = `Sos la Asistente Virtual del Portal del Cliente de AK Producciones para la fiesta "${nombreEvento}".
Tu misión es contestar dudas al cliente organizador sobre SU fiesta con simpatía en español rioplatense (uruguayo).

DATOS REALES DE SU FIESTA (ÚNICO CONTEXTO AUTORIZADO):
- Nombre del evento: ${nombreEvento}
- Tipo de celebración: ${tipoCelebracion}
- Fecha del evento: ${fechaEvento}
- Salón / Lugar: ${salon}
- Invitados estimados: ${invitadosEstimados}
- Tareas pendientes destacadas:
${tareasPendientes}

REGLAS DE SEGURIDAD Y PRIVACIDAD:
1. SOLO hablás de esta fiesta (${nombreEvento}). Si preguntan por otros clientes, eventos o personas, decí amablemente que solo tenés acceso a esta celebración.
2. NUNCA inventes datos que no figuren acá. Si algo no está definido, decí: "Ese detalle todavía no está cargado en el portal, podés consultarlo directamente con el equipo de AK."
3. NO podés modificar datos ni agendar pagos.
4. Respuestas amables, claras y cortas con emojis.`;

    const response = await generateWithGeminiFallback({
      model: geminiCommercialModel,
      system: systemPrompt,
      messages: [
        ...history,
        { role: 'user', content: [{ text: newMessage }] }
      ]
    });

    await registrarConsumoIA('chat-de-la-fiesta');

    return {
      success: true,
      text: response.text?.trim() || '¡A las órdenes para ayudarte con tu fiesta!',
    };
  } catch (error: any) {
    console.error('[chatConAsistenteCliente] Error:', error);
    return {
      success: false,
      error: 'No se pudo conectar con el asistente en este momento.',
    };
  }
}

/**
 * Asistente para el Portal del Invitado.
 * CERO acceso a datos financieros, CERO acceso a otras mesas o personas.
 */
export async function chatConAsistenteInvitado(
  fiestaId: string,
  history: MessageData[],
  newMessage: string,
  invitadoNombre?: string,
  mesaAsignada?: string
): Promise<AssistantResponse> {
  try {
    if (!fiestaId) {
      return { success: false, error: 'Identificador de fiesta no especificado.' };
    }

    await enforcePublicRateLimit({
      scope: `portal-invitado-${fiestaId}`,
      identity: fiestaId,
      limit: 25,
      windowMs: 60 * 60 * 1000,
    });

    if (!(await hayPresupuestoParaIA())) {
      return {
        success: false,
        error: 'El asistente para invitados está temporalmente descansando. ¡Disfrutá de la fiesta!',
      };
    }

    const { getFiestaById } = await import('@/app/actions/fiesta/fiesta.actions');
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) {
      return { success: false, error: 'No se encontró la información del evento.' };
    }

    const nombreEvento = fiesta.configuracion?.nombreEvento || fiesta.id || 'El Evento';
    const fechaEvento = fiesta.configuracion?.fechaEvento || 'Fecha por confirmar';
    const salon = fiesta.configuracion?.nombreLugar || (fiesta.configuracion as any)?.salon || 'Salón por confirmar';
    const direccion = fiesta.configuracion?.direccionLugar || (fiesta.configuracion as any)?.direccionSalon || 'Salto, Uruguay';

    const systemPrompt = `Sos el Asistente Virtual para Invitados de "${nombreEvento}" producido por AK Producciones.
Tu rol es orientar a los invitados con datos útiles sobre la celebración en tono rioplatense super amigable y con emojis 🎉.

DATOS DISPONIBLES:
- Fiesta: ${nombreEvento}
- Fecha: ${fechaEvento}
- Salón / Lugar: ${salon}
- Dirección / Ubicación: ${direccion}
${invitadoNombre ? `- Invitado: ${invitadoNombre}` : ''}
${mesaAsignada ? `- Mesa Asignada: Mesa ${mesaAsignada}` : ''}

REGLAS DE AISLAMIENTO Y SEGURIDAD ESTRICTAS (INQUEBRANTABLES):
1. CERO DATOS DE DINERO: NUNCA digas presupuestos, costos, precios de la fiesta, si se pagó o cuánto se debe. Si te preguntan de plata, decí: "Como asistente de invitados no manejo información financiera del evento."
2. CERO DATOS DE OTROS INVITADOS O FIESTAS: No des teléfonos, direcciones privadas ni listas de otras personas.
3. INSTRUCCIONES:
   - Para subir fotos: "Podés subir tus fotos al Muro Social interactivo desde el portal del evento para que se vean en las pantallas."
   - Para confirmar asistencia: "Podés confirmar o actualizar tu asistencia en la sección de RSVP del portal."
4. Respuestas directas, cortas y festivas.`;

    const response = await generateWithGeminiFallback({
      model: geminiCommercialModel,
      system: systemPrompt,
      messages: [
        ...history,
        { role: 'user', content: [{ text: newMessage }] }
      ]
    });

    await registrarConsumoIA('chat-de-la-fiesta');

    return {
      success: true,
      text: response.text?.trim() || '¡Que disfrutes mucho de la fiesta!',
    };
  } catch (error: any) {
    console.error('[chatConAsistenteInvitado] Error:', error);
    return {
      success: false,
      error: 'No pudimos responderte en este momento. ¡Que tengas una gran fiesta!',
    };
  }
}
