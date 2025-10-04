'use server';
/**
 * @fileOverview A comprehensive AI assistant for marketing and event planning.
 * This assistant is designed to have knowledge of the company's services,
 * menus, and packages to provide contextual advice and generate content.
 * It can also use tools, such as an image generator and web search.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { getMenus } from '@/app/actions/menus-catering';
import { getArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { getOcupiedDates } from '@/app/actions/agenda';
import { generateImage } from './generate-image-flow';
import { googleSearch } from 'genkitx-google-search';


const AssistantInputSchema = z.object({
  query: z.string().describe('The user\'s request to the assistant.'),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

const AssistantOutputSchema = z.object({
  response: z.string().describe('The assistant\'s response in Markdown format.'),
  imageUrl: z.string().optional().describe('URL of a generated image, if requested.'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

// Exported function to be called from the UI
export async function assistant(input: AssistantInput): Promise<AssistantOutput> {
  return assistantFlow(input);
}


// Define a tool for image generation
const imageGenerationTool = ai.defineTool(
  {
    name: 'generateImage',
    description: 'Generates an image based on a textual description. Use this when the user explicitly asks to "generate an image", "create a picture", "draw", or similar visual creation requests.',
    inputSchema: z.object({
      prompt: z.string().describe('A detailed English description of the image to generate, focusing on visual elements.'),
    }),
    outputSchema: z.object({
      imageUrl: z.string(),
    }),
  },
  async ({ prompt }) => {
    // We call the existing generateImage flow to perform the action
    const result = await generateImage({ prompt });
    return { imageUrl: result.imageUrl };
  }
);


const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
    // Provide the tools to the AI
    tools: [imageGenerationTool, googleSearch],
  },
  async (input) => {
    // 1. Fetch all relevant company data to provide as context to the AI
    const [
      servicios,
      menus,
      paquetesConfig,
      companyInfo,
      occupiedDates,
    ] = await Promise.all([
      getServiciosEmpresa(),
      getMenus(),
      getArmadoRapidoConfig(),
      getInvoiceTemplateSettings(),
      getOcupiedDates(),
    ]);
    
    // 2. Format the data into a structured string for the prompt
    const companyData = `
        **Company Name:** ${companyInfo.companyName || 'AK Producciones'}
        
        **Available Services Catalog:**
        ${servicios.map(s => `- ${s.nombre} (Category: ${s.categoria}, Price: ${s.precioVenta || s.precioPorPersona || 'Variable'})`).join('\n')}

        **Catering Menus:**
        ${menus.map(m => `- ${m.name}: ${m.description}`).join('\n')}

        **Simulator Packages:**
        ${paquetesConfig.paquetes.map(p => `- ${p.nombre}`).join('\n')}

        **Occupied Event Dates (YYYY-MM-DD):**
        ${occupiedDates.join(', ')}
    `;

    // 3. Generate the response using the AI model
    const llmResponse = await ai.generate({
      prompt: input.query,
      // The model will be automatically selected from the genkit configuration file.
      // The system prompt "trains" the AI for this specific request
      system: `You are "Asistente AK," an expert marketing and event planning assistant for a company named AK Producciones. Your tone should be creative, helpful, and professional.

        Your primary goal is to help the user with their marketing efforts by creating content, brainstorming ideas, and providing strategic advice.
        
        You have been provided with the company's internal data, including a list of dates that are already booked for other events. Use ALL of this information to give specific, relevant, and actionable responses. For example, if asked for a post about a service, use the actual service name from the catalog. If asked about availability, consult the list of occupied dates.
        
        If the user asks a general question about a topic (e.g., 'What are the latest wedding trends?'), use the 'googleSearch' tool to find relevant information from the web.
                
        If the user asks you to generate an image, use the 'generateImage' tool. Do not describe the image in text; instead, call the tool and let the user see the result. For image generation, provide a concise confirmation in your text response, like "Aquí tienes la imagen que pediste:".

        Always respond in Spanish and use Markdown for formatting (e.g., lists, bold text).
        
        Here is the company's data for your reference:
        ---
        ${companyData}
        ---
      `,
      tools: [imageGenerationTool, googleSearch],
    });

    const textResponse = llmResponse.text;
    let finalImageUrl: string | undefined = undefined;

    // Check if the AI decided to use the image generation tool
    const imageToolCall = llmResponse.toolCalls?.find(call => call.tool === 'generateImage');
    if (imageToolCall) {
      const toolResult = await imageGenerationTool(imageToolCall.input);
      finalImageUrl = toolResult.imageUrl;
    }

    return {
      response: textResponse,
      imageUrl: finalImageUrl,
    };
  }
);
