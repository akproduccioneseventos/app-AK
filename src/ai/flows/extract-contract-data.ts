
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
  config: {
    temperature: 0,
  },
  prompt: `Actúa como un asistente administrativo experto de la empresa AK Producciones.
    Tu misión es leer el documento adjunto (contrato o presupuesto) y extraer datos específicos.
    
    INSTRUCCIONES DE EXTRACCIÓN:
    1. CLIENTE: Busca el nombre completo de la persona o empresa contratante.
    2. FECHA: Busca la fecha del evento. Devuélvela SIEMPRE en formato YYYY-MM-DD. 
       Si dice "15 de agosto de 2024", debes devolver "2024-08-15".
    3. MONTO: Busca el PRECIO TOTAL o SALDO FINAL. Es el número más grande al final del desglose. Devuelve solo el número sin símbolos de moneda.
    4. TIPO: Identifica si es Boda, 15 años, Cumpleaños infantil, etc.

    Si el documento es una foto o un escaneo de mala calidad, haz tu mejor esfuerzo usando OCR.

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
      throw new Error("No se pudo procesar el documento. Asegúrate de que los datos sean legibles.");
    }
    return output;
  }
);

export async function extractContractData(input: ExtractContractInput): Promise<ExtractContractOutput> {
  return extractContractFlow(input);
}
