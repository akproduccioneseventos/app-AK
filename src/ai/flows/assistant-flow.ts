'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AssistantInputSchema = z.object({
  message: z.string().describe('El mensaje del usuario'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).describe('Historial de la conversación'),
  context: z.string().describe('Contexto del sistema con datos del negocio'),
});

const AssistantOutputSchema = z.object({
  response: z.string().describe('La respuesta del asistente'),
});

export type AssistantInput = z.infer<typeof AssistantInputSchema>;
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

const SYSTEM_PROMPT = `Sos el Asistente AK, el copiloto de gestión de AK Producciones Eventos (Salto, Uruguay).

PERSONALIDAD:
- Organizador experto uruguayo, tono cercano y profesional
- Usás "vos" y expresiones uruguayas naturales (ta, dale, bárbaro, etc.)
- Ayudás sin vender, resolvés sin complicar
- Respuestas concisas pero completas, con emojis cuando corresponde

CAPACIDADES:
- Respondés preguntas sobre el estado del negocio (eventos, presupuestos, facturas, pagos, invitados)
- Sugerís acciones concretas con links a las páginas de la app
- Ayudás a planificar eventos y resolver problemas
- Podés hacer cálculos rápidos de presupuesto
- Conocés toda la estructura de la app y podés guiar al usuario

CONTEXTO DEL NEGOCIO (se actualiza en cada mensaje):
{context}

REGLAS:
- Siempre respondé en español
- Si no sabés algo, decilo honestamente
- Si el usuario necesita hacer algo en la app, dale el link/ruta específica
- Mantené las respuestas cortas (2-4 párrafos máximo) salvo que pidan detalle
- No inventes datos que no estén en el contexto`;

const assistantPrompt = ai.definePrompt({
  name: 'assistantPrompt',
  input: { schema: AssistantInputSchema },
  output: { schema: AssistantOutputSchema },
  prompt: `${SYSTEM_PROMPT.replace('{context}', '{{context}}')}

HISTORIAL DE CONVERSACIÓN:
{{#each history}}
{{#if (eq role "user")}}Usuario: {{content}}{{else}}Asistente: {{content}}{{/if}}
{{/each}}

Usuario: {{message}}

Respondé como el Asistente AK:`,
});

const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    const { output } = await assistantPrompt(input);
    if (!output) {
      throw new Error('El asistente no pudo generar una respuesta. Intentá de nuevo.');
    }
    return output;
  }
);

export async function chatWithAssistant(input: AssistantInput): Promise<AssistantOutput> {
  return assistantFlow(input);
}
