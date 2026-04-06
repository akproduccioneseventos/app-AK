'use server';
/**
 * @fileOverview Flujo de IA optimizado para documentos de AK Producciones.
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
  model: 'googleai/gemini-2.5-flash',
  input: { schema: ExtractContractInputSchema },
  output: { schema: ExtractContractOutputSchema },
  config: {
    temperature: 0,
  },
  prompt: `Actúa como un asistente experto de AK Producciones. Tu misión es extraer datos de un presupuesto o contrato que puede tener varias páginas.

    GUÍA DE EXTRACCIÓN ESPECÍFICA PARA EL FORMATO VISUAL ADJUNTO:
    1. CLIENTE: Busca el nombre justo antes de los detalles del evento. En tu formato suele aparecer centrado como "Nombre Apellido XV Años 2026". Extrae solo el nombre (ej: "Carla Lourado").
    2. TIPO DE EVENTO: Identifica si dice "XV Años", "Boda", "Infantil", etc.
    3. FECHA DEL EVENTO:
       - Busca menciones del año del evento (ej: "2026") cerca del nombre del cliente.
       - La tabla pequeña de arriba contiene una "Fecha" (ej: 28/10/2024), esa es la fecha de EMISIÓN del documento.
       - Si no encuentras una fecha de evento específica (día/mes), usa el año encontrado y asume el 1 de enero de ese año para el formato ISO (ej: "2026-01-01").
    4. MONTO TOTAL:
       - Busca al final de la tabla de artículos.
       - Está etiquetado como "Importe total".
       - Suele tener prefijos como "NU$" o "$". Ignora el prefijo y extrae el número final (ej: de "NU$ 238.040,00" extrae 238040).

    Documento completo: {{media url=fileDataUri}}`,
});

const extractContractFlow = ai.defineFlow(
  {
    name: 'extractContractFlow',
    inputSchema: ExtractContractInputSchema,
    outputSchema: ExtractContractOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error("La IA no devolvió resultados válidos.");
      }
      return output;
    } catch (error: any) {
      console.error("Error en extractContractFlow:", error);
      throw new Error("Error al analizar el documento: " + error.message);
    }
  }
);

export async function extractContractData(input: ExtractContractInput): Promise<ExtractContractOutput> {
  return extractContractFlow(input);
}