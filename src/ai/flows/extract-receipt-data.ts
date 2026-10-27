import 'server-only';
import { ai, ejecutarPromptConFallback, geminiModel } from '@/ai/genkit';
import { z } from 'genkit';
import { registrarConsumoIA } from '@/lib/ai/consumo-servidor';

export const ExtractReceiptInputSchema = z.object({
  receiptDataUri: z.string().describe('El ticket, factura o recibo como data URI (imagen base64 o url).'),
});
export type ExtractReceiptDataInput = z.infer<typeof ExtractReceiptInputSchema>;

export const ExtractReceiptOutputSchema = z.object({
  vendor: z.string().describe('Nombre del comercio o proveedor.'),
  date: z.string().describe('Fecha del comprobante en formato ISO YYYY-MM-DD.'),
  amount: z.number().describe('Monto total final en números.'),
  category: z.string().describe('Categoría del gasto (ej: Insumos, Bebidas, Transporte, Mantenimiento, Equipos, etc.).'),
  confidence: z.enum(['alta', 'media', 'baja']).describe('Nivel de confianza en los datos leídos.'),
  notes: z.string().describe('Notas o detalle relevante del comprobante.'),
});
export type ExtractReceiptDataOutput = z.infer<typeof ExtractReceiptOutputSchema>;

const extractReceiptPrompt = ai.definePrompt({
  name: 'extractReceiptPrompt',
  model: geminiModel,
  input: { schema: ExtractReceiptInputSchema },
  output: { schema: ExtractReceiptOutputSchema },
  prompt: `Sos un asistente contable de AK Producciones (Salto, Uruguay).
Tu tarea es extraer con precisión los datos de un ticket, factura o recibo adjunto en la imagen.

1. PROVEEDOR (vendor): Identifica el comercio, razón social o nombre de fantasía emisor del ticket.
2. FECHA (date): Fecha de emisión en formato YYYY-MM-DD. Si solo ves día y mes, asume el año corriente.
3. MONTO TOTAL (amount): Extrae el importe final numérico (Total, Importe Total, etc.). Si está en pesos uruguayos ($ / UYU), extrae el valor numérico limpio.
4. CATEGORÍA (category): Clasifícalo entre: 'Insumos', 'Bebidas', 'Equipamiento', 'Transporte', 'Servicios', 'Otros'.
5. CONFIANZA (confidence): 'alta' si el texto y el total son claros y legibles; 'media' si falta algún dato menor; 'baja' si está borroso o incompleto.
6. NOTAS (notes): Breve resumen de los ítems principales o aclaraciones.

Imagen del comprobante: {{media url=receiptDataUri}}`,
});

export async function extractReceiptData(input: ExtractReceiptDataInput): Promise<ExtractReceiptDataOutput> {
  try {
    const { output } = await ejecutarPromptConFallback(extractReceiptPrompt, input);
    if (!output) throw new Error('No se obtuvo respuesta estructurada.');
    await registrarConsumoIA('lectura-recibo').catch((e) => console.warn('[ia] No se pudo anotar el consumo:', e));
    return {
      vendor: output.vendor || 'Proveedor sin identificar',
      date: output.date || new Date().toISOString().slice(0, 10),
      amount: typeof output.amount === 'number' ? output.amount : 0,
      category: output.category || 'Insumos',
      confidence: output.confidence || 'media',
      notes: output.notes || 'Datos extraídos con Gemini.',
    };
  } catch (error) {
    console.warn('[extractReceiptData] Error con Gemini, retornando valores base:', error);
    return {
      vendor: 'Proveedor sin identificar',
      date: new Date().toISOString().slice(0, 10),
      amount: 0,
      category: 'Insumos',
      confidence: 'baja',
      notes: 'No se pudo leer el comprobante automáticamente. Por favor completá los datos manualmente.',
    };
  }
}

