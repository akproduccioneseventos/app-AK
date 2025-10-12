
'use server';

/**
 * @fileOverview An AI marketing assistant for AK Producciones.
 *
 * This flow can provide marketing copy, suggest ideas, and generate images.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { getArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getMenus } from '@/app/actions/menus-catering';
import { generateImage as generateImageFlow } from './generate-image-flow';
import { getFiestas, getFiestaActual } from '@/app/actions/fiesta/fiesta.actions';

const AssistantInputSchema = z.object({
  query: z.string().describe('The user\'s request to the assistant.'),
});

export const AssistantOutputSchema = z.object({
  response: z.string().describe("The assistant's main text response."),
  imageUrl: z.string().optional().describe("A URL to a relevant generated image, if requested."),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

// Tool: Generate Image
const generateImageTool = ai.defineTool(
  {
    name: 'generateImage',
    description: 'Generates an image based on a detailed text prompt. Use this tool when the user explicitly asks to generate, create, or make an image, photo, or graphic.',
    inputSchema: z.object({
      prompt: z.string().describe('A detailed English description of the image to generate. Be specific about the subject, setting, style, and colors.'),
    }),
    outputSchema: z.string().describe("The generated image as a data URI."),
  },
  async (input) => {
    const result = await generateImageFlow({ prompt: input.prompt });
    return result.imageUrl;
  }
);


export const assistant = ai.defineFlow(
  {
    name: 'assistant',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    // 1. Fetch all relevant business context
    const [servicios, paquetes, menus, fiestas] = await Promise.all([
      getServiciosEmpresa(),
      getArmadoRapidoConfig().then(config => config.paquetes),
      getMenus(),
      getFiestas(),
    ]);

    // 2. Define the main prompt with context and tools
    const llmResponse = await ai.generate({
      prompt: `Eres "Asistente AK", un asistente de IA especializado en marketing y redes sociales para "AK Producciones", una empresa de planificación de eventos. Tu personalidad es creativa, proactiva y servicial.

      **Contexto de la Empresa (AK Producciones):**
      - **Servicios Principales:** ${servicios.map(s => s.nombre).join(', ')}.
      - **Paquetes Ofrecidos:** ${paquetes.map(p => p.nombre).join(', ')}.
      - **Menús de Catering:** ${menus.map(m => m.name).join(', ')}.
      - **Eventos Recientes/Próximos:** ${fiestas.map(f => f.configuracion.nombreEvento).join(', ')}.

      **Tu Tarea:**
      Responde a la consulta del usuario de manera útil y creativa, utilizando el contexto de la empresa.
      - Si el usuario pide generar una imagen, USA la herramienta \`generateImage\`.
      - Si el usuario pide ideas o texto para una publicación, genera contenido atractivo y relevante. Incluye hashtags apropiados.
      - Si el usuario hace una pregunta general, responde basándote en el contexto proporcionado.
      - Responde siempre en español.

      **Consulta del Usuario:**
      ${input.query}`,
      tools: [generateImageTool],
      model: 'gemini-1.5-flash-preview',
    });

    // 3. Process the response and tool output
    const textResponse = llmResponse.text;
    const toolCall = llmResponse.toolCalls?.[0];

    if (toolCall?.name === 'generateImage' && toolCall.output) {
      return {
        response: textResponse || "Aquí tienes la imagen que solicitaste.",
        imageUrl: toolCall.output,
      };
    }
    
    // If no tool was called, or it failed to return output, just return the text
    return {
      response: textResponse || "No pude procesar tu solicitud completamente, pero aquí tienes una respuesta de texto.",
    };
  }
);
