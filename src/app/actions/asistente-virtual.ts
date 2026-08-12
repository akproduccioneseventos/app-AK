'use server';

import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { normalizeUruguayPhone } from '@/lib/commercial/contact';
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
        // El permiso para escribirle despues NO se deduce ni se asume: es lo que
        // habilita mandarle WhatsApp automatico mas adelante. Se exige que el
        // resumen lo marque explicitamente Y que la persona lo haya dicho en su
        // ultimo mensaje. Si no, el presupuesto se arma igual pero queda sin
        // permiso: se pierde poder escribirle solo, que se arregla llamandola,
        // y no al reves.
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
          // A proposito NO se arma el presupuesto desde el chat.
          //
          // Armarlo requiere subtotal, costo estimado y la lista de servicios
          // incluidos, que son las cuentas que despues el cliente ve como precio
          // firme. Sacarlas de una conversacion es inventar plata, y un numero
          // mal en esa pantalla se discute delante del cliente. El dato queda
          // guardado y el equipo arma el presupuesto con el simulador, que es el
          // unico lugar donde esas cuentas estan bien hechas.
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
