'use server';
/**
 * @fileOverview Flujo de IA para extraer datos de contratos y presupuestos.
 * 
 * Este flujo analiza documentos (PDF o imágenes) para extraer información clave
 * como el nombre del cliente, fecha del evento y monto total.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractContractInputSchema = z.object({
  fileDataUri: z.string().describe("El archivo del contrato o presupuesto como data URI (base64)."),
});
export type ExtractContractInput = z.infer<typeof ExtractContractInputSchema>;

const ExtractContractOutputSchema = z.object({
  clienteNombre: z.string().describe("Nombre del cliente o empresa."),
  eventoFecha: z.string().describe("Fecha del evento en formato ISO (YYYY-MM-DD)."),
  montoTotal: z.number().describe("Monto total final del contrato o presupuesto."),
  tipoEvento: z.string().optional().describe("Tipo de evento (Boda, XV, etc)."),
});
export type ExtractContractOutput = z.infer<typeof ExtractContractOutputSchema>;

const prompt = ai.definePrompt({
  name: 'extractContractPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: ExtractContractInputSchema },
  output: { schema: ExtractContractOutputSchema },
  prompt: `Actúa como un asistente administrativo experto de la empresa AK Producciones.
    Analiza el documento adjunto (que puede ser un contrato o un presupuesto).
    
    Tu misión es extraer EXACTAMENTE estos campos:
    1. El nombre del cliente o la razón social de la empresa.
    2. La fecha del evento. Busca frases como "fecha del evento", "día de la fiesta" o fechas cercanas a las firmas.
    3. El monto total final (el precio total del servicio). Busca el número más grande al final del desglose de costos.
    4. El tipo de fiesta si se menciona (Boda, 15 años, Cumpleaños, etc).

    Documento: {{media url=fileDataUri}}`,
});

const extractContractFlow = ai.defineFlow(
  {
    name: 'extractContractFlow',
    inputSchema: ExtractContractInputSchema,
    outputSchema: ExtractContractOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("No se pudo procesar el documento.");
    }
    return output;
  }
);

export async function extractContractData(input: ExtractContractInput): Promise<ExtractContractOutput> {
  return extractContractFlow(input);
}
