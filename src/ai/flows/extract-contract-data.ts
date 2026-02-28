
'use server';
/**
 * @fileOverview Flujo de IA para extraer datos de contratos y presupuestos.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractContractInputSchema = z.object({
  fileDataUri: z.string().describe("El archivo del contrato o presupuesto como data URI (base64)."),
});

const ExtractContractOutputSchema = z.object({
  clienteNombre: z.string().describe("Nombre del cliente o empresa."),
  eventoFecha: z.string().describe("Fecha del evento en formato ISO (YYYY-MM-DD)."),
  montoTotal: z.number().describe("Monto total final del contrato o presupuesto."),
  tipoEvento: z.string().optional().describe("Tipo de evento (Boda, XV, etc)."),
});

export type ExtractContractOutput = z.infer<typeof ExtractContractOutputSchema>;

export async function extractContractData(input: { fileDataUri: string }): Promise<ExtractContractOutput> {
  const { output } = await ai.generate({
    model: 'googleai/gemini-1.5-flash',
    input: {
      fileDataUri: input.fileDataUri,
    },
    output: {
      schema: ExtractContractOutputSchema,
    },
    prompt: `Actúa como un asistente administrativo experto. Analiza el documento adjunto (puede ser un contrato o un presupuesto).
    Extrae la siguiente información:
    1. El nombre del cliente o la razón social de la empresa contratante.
    2. La fecha en la que se realizó o se realizará el evento.
    3. El monto total final acordado (el precio total).
    4. El tipo de evento si se menciona.

    Documento: {{media url=fileDataUri}}`,
  });

  if (!output) {
    throw new Error("No se pudo extraer información del documento.");
  }

  return output;
}
