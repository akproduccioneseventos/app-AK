import { ai, getGeminiModelForAgent } from '@/ai/genkit';
import { z } from 'zod';

export const GenerateSalesPitchSchema = z.object({
  clienteNombre: z.string(),
  eventoTipo: z.string(),
  invitados: z.number(),
  precioTotal: z.number(),
  servicios: z.array(z.string()),
});

export type GenerateSalesPitchInput = z.infer<typeof GenerateSalesPitchSchema>;

export async function generateSalesPitchFlow(input: GenerateSalesPitchInput): Promise<string> {
  try {
    const prompt = `Actúa como un cerrador de ventas experto en eventos (Wedding & Event Planner) para "AK Producciones".
Necesito un mensaje corto de WhatsApp para enviarle a un cliente junto con el enlace de su presupuesto.
El mensaje debe ser cálido, persuasivo y mostrar el valor de elegirnos.

Datos del cliente y presupuesto:
- Nombre del cliente: ${input.clienteNombre}
- Tipo de evento: ${input.eventoTipo}
- Invitados: ${input.invitados}
- Servicios destacados: ${input.servicios.join(', ')}
- Inversión total estimada: $${input.precioTotal.toLocaleString('es-UY')}

Reglas:
- Sé empático y profesional pero cercano.
- Usa el dialecto uruguayo sutilmente (vos).
- Menciona que el presupuesto incluye todo lo necesario para que no se preocupe por nada.
- Cierra con un llamado a la acción claro para coordinar una reunión o llamada.
- NO devuelvas JSON, devuelve directamente el texto del mensaje listo para copiar y pegar en WhatsApp.`;

    const model = getGeminiModelForAgent('comercial');
    const result = await ai.generate({
      model,
      prompt,
    });

    return result.text;
  } catch (error) {
    console.error('Error in generateSalesPitchFlow:', error);
    return 'Hubo un error al generar el mensaje.';
  }
}
