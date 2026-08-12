'use server';

import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { normalizeUruguayPhone } from '@/lib/commercial/contact';
import { getArmadoRapidoConfig, captureSimulatorLeadProgress, generateBudgetAndLeadFromSimulator } from '@/app/actions/armado-rapido';
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
        prompt: `Extraé los siguientes datos del historial de chat. Formato JSON estricto con las claves: "nombre" (string), "telefono" (string), "evento" (string), "invitados" (number), "fecha" (string). Si no hay algún dato, poné null.
Historial:
${JSON.stringify(history)}
Último mensaje:
${newMessage}`,
        output: { format: 'json' }
      });

      const data = extractionResponse.output;
      if (data && data.nombre && data.telefono && data.evento) {
        const progressRes = await captureSimulatorLeadProgress({
          clienteNombre: data.nombre,
          clienteContacto: data.telefono,
          eventoTipo: data.evento,
          eventoFecha: data.fecha || undefined,
          invitados: Number(data.invitados) || 100,
          marketingConsent: true,
        });

        if (progressRes.success && progressRes.leadId) {
          const budgetRes = await generateBudgetAndLeadFromSimulator({
            clienteNombre: data.nombre,
            clienteContacto: data.telefono,
            eventoTipo: data.evento,
            eventoFecha: data.fecha || undefined,
            invitadosAdultos: Number(data.invitados) || 100,
            invitadosNinos: 0,
            invitadosAdolescentes: 0,
          }, { source: 'simulator_assistant' });

          if (budgetRes.success) {
            return {
              success: true,
              text: '¡Genial! Tu presupuesto está listo.',
              budgetGenerated: true,
              budgetUrl: `/presupuestos/${budgetRes.presupuestoId}/ver?token=${budgetRes.token}`
            };
          }
        }
      }
      
      return {
        success: true,
        text: 'Ya tomé tus datos, pero tuve un problema armando el link directo. ¡A la brevedad uno de nuestros asesores te va a contactar por WhatsApp con todo armado!'
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
