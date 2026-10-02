import { generateWithGeminiFallback, getGeminiModelForAgent } from '@/ai/genkit';
import { z } from 'zod';

export const GenerateTimelineSchema = z.object({
  eventoTipo: z.string(),
  duracionHoras: z.number().optional(),
  horaInicio: z.string(),
  serviciosContratados: z.array(z.string()),
});

export type GenerateTimelineInput = z.infer<typeof GenerateTimelineSchema>;

export const TimelineItemSchema = z.object({
  hora: z.string(),
  titulo: z.string(),
  descripcion: z.string(),
  descripcionCliente: z.string(),
  icono: z.string(),
});

export type TimelineItemOutput = z.infer<typeof TimelineItemSchema>;

export async function generateTimelineFlow(input: GenerateTimelineInput): Promise<TimelineItemOutput[]> {
  try {
    const prompt = `Actúa como un experto Wedding & Event Planner. 
Necesito un cronograma minuto a minuto para una fiesta.
Tipo de evento: ${input.eventoTipo}
Hora de inicio: ${input.horaInicio}
Duración aproximada: ${input.duracionHoras ? input.duracionHoras + ' horas' : '8 horas'}
Servicios contratados: ${input.serviciosContratados.join(', ')}

Genera un cronograma lógico y fluido. Considera tiempos de recepción, cena, baile, cortes de torta, shows (si aplica), etc.
El resultado debe ser un JSON Array, donde cada objeto tenga:
- hora: (formato HH:MM)
- titulo: (ej. "Recepción de Invitados")
- descripcion: (breve nota operativa para el equipo)
- descripcionCliente: (texto amigable para el portal del cliente)
- icono: uno de estos exactamente [Clock, Utensils, GlassWater, Music, CakeSlice, Camera, Diamond, PartyPopper]

Devuelve SOLO el JSON array.`;

    const model = getGeminiModelForAgent('fiestas_general');
    const result = await generateWithGeminiFallback({
      model,
      prompt,
      output: { format: 'json' },
    });

    const parsed = JSON.parse(result.text);
    return parsed;
  } catch (error) {
    console.error('Error in generateTimelineFlow:', error);
    return [];
  }
}
