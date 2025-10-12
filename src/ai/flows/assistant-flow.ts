'use server';

/**
 * @fileOverview An AI marketing assistant for AK Producciones.
 *
 * This flow can provide marketing copy, suggest ideas, and generate images.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { generateImage as generateImageFlow } from './generate-image-flow';

const AssistantInputSchema = z.object({
  query: z.string().describe('The user\'s request to the assistant.'),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;


const AssistantOutputSchema = z.object({
  response: z.string().describe("The assistant's main text response."),
  imageUrl: z.string().optional().describe("A URL to a relevant generated image, if requested."),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

// Wrapper function to be called from the client
export async function invokeAssistant(input: AssistantInput): Promise<AssistantOutput> {
  return assistantFlow(input);
}


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


const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    // 2. Define the main prompt with context and tools
    const llmResponse = await ai.generate({
      prompt: `Eres "Asistente AK", un asistente de IA especializado en marketing y redes sociales para "AK Producciones", una empresa de planificación de eventos. Tu personalidad es creativa, proactiva y servicial.

      **Tu Tarea:**
      Responde a la consulta del usuario de manera útil y creativa.
      - Si el usuario pide generar una imagen, USA la herramienta \`generateImage\`.
      - Si el usuario pide ideas o texto para una publicación, genera contenido atractivo y relevante. Incluye hashtags apropiados.
      - Si el usuario hace una pregunta general sobre marketing, responde de forma creativa.
      - Responde siempre en español.

      **Consulta del Usuario:**
      ${input.query}`,
      tools: [generateImageTool],
      model: 'gemini-pro', // Use the correct and available model
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
