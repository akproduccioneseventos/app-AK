'use server';

import { ai, geminiModel } from '@/ai/genkit';
import { z } from 'genkit';

const MeetingIntelligenceInputSchema = z.object({
  eventContext: z.string(),
  meetingTitle: z.string(),
  meetingNotes: z.string().optional(),
  currentChecklist: z.string().optional(),
  currentFaqs: z.string().optional(),
  transcript: z.string(),
  audioDataUri: z.string().optional(),
});

const MeetingIntelligenceOutputSchema = z.object({
  resumenCliente: z.string(),
  resumenOrganizador: z.string(),
  acuerdos: z.array(z.string()),
  decisionesCliente: z.array(z.string()),
  tareasCliente: z.array(z.string()),
  tareasOrganizador: z.array(z.string()),
  preguntasCliente: z.array(z.string()),
  checklistCompletadoIds: z.array(z.string()),
  camposSincronizados: z.array(z.string()),
  alertas: z.array(z.string()),
});

export type MeetingIntelligenceOutput = z.infer<typeof MeetingIntelligenceOutputSchema>;

const meetingIntelligencePrompt = ai.definePrompt({
  name: 'meetingIntelligencePrompt',
  model: geminiModel,
  input: { schema: MeetingIntelligenceInputSchema },
  output: { schema: MeetingIntelligenceOutputSchema },
  prompt: `Sos el agente de fiesta de AK Producciones. Tu trabajo es convertir una reunion real con cliente en un acta util, simple y accionable.

Reglas:
- Escribi en espanol claro de Uruguay, sin lenguaje tecnico.
- No inventes acuerdos. Si algo no esta claro, agregalo como alerta.
- El resumen para cliente debe ser amable, corto y confirmable.
- El resumen para organizador debe ser mas operativo: decisiones, riesgos y proximos pasos.
- Las tareas del cliente son cosas que debe entregar, elegir, confirmar o responder.
- Las tareas del organizador son cosas que debe hacer AK Producciones.
- Las preguntas frecuentes deben salir de dudas reales del cliente y servir para futuras fiestas.
- Si una pregunta ya existe en las FAQ actuales, no la repitas.
- Para checklistCompletadoIds, usa solo IDs del checklist actual cuando la reunion confirma ese punto.

Contexto del evento:
{{eventContext}}

Titulo de la reunion:
{{meetingTitle}}

Notas previas:
{{meetingNotes}}

Checklist actual:
{{currentChecklist}}

FAQ actuales:
{{currentFaqs}}

Transcripcion / notas de la reunion:
{{transcript}}

{{#if audioDataUri}}
Audio de la reunion:
{{media url=audioDataUri}}
{{/if}}

Devolve solo el objeto estructurado solicitado.`,
});

const meetingIntelligenceFlow = ai.defineFlow(
  {
    name: 'meetingIntelligenceFlow',
    inputSchema: MeetingIntelligenceInputSchema,
    outputSchema: MeetingIntelligenceOutputSchema,
  },
  async (input) => {
    const { output } = await meetingIntelligencePrompt(input);
    if (!output) throw new Error('La IA no devolvio un resumen valido.');
    return output;
  }
);

export async function analyzeMeetingTranscript(input: z.infer<typeof MeetingIntelligenceInputSchema>) {
  return meetingIntelligenceFlow(input);
}
