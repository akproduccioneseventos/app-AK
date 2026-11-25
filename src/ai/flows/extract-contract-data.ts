import 'server-only';
/**
 * @fileOverview Flujo de IA optimizado para documentos de AK Producciones.
 */

import { pedirTexto } from '@/ai/cerebro';
import { z } from 'genkit';

const ExtractContractInputSchema = z.object({
  fileDataUri: z.string().describe("El archivo del contrato o presupuesto como data URI (base64)."),
});
export type ExtractContractInput = z.infer<typeof ExtractContractInputSchema>;

export const ExtractContractOutputSchema = z.object({
  clienteNombre: z.string().describe("Nombre del cliente o empresa."),
  eventoFecha: z.string().describe("Fecha del evento en formato ISO (YYYY-MM-DD)."),
  montoTotal: z.number().describe("Monto total final del contrato o presupuesto."),
  // .nullish() because Gemini structured output may return null instead of omitting the field.
  tipoEvento: z.string().nullish().describe("Tipo de evento (Boda, XV, etc)."),
  telefono: z.string().nullish().describe("Teléfono de contacto del cliente."),
  invitadosAdultos: z.number().nullish().describe("Cantidad de invitados adultos."),
  invitadosNinos: z.number().nullish().describe("Cantidad de invitados niños o adolescentes."),
  fechaFirmaContrato: z.string().nullish().describe("Fecha de firma del contrato en formato ISO (YYYY-MM-DD)."),
  contratoFirmado: z.boolean().nullish().describe("Indica si el contrato figura firmado."),
  serviciosContratados: z.array(z.string()).nullish().describe("Lista de nombres de servicios contratados."),
  sena: z.number().nullish().describe("Monto de la seña acordada."),
  cuotas: z.array(z.object({
    monto: z.number(),
    fecha: z.string().nullish(),
    concepto: z.string().nullish(),
  })).nullish().describe("Detalle de cuotas pactadas en el contrato."),
  tipoAjusteAnual: z.enum(['acumulativo', 'simple']).nullish().describe("Tipo de ajuste anual pactado."),
});
export type ExtractContractOutput = z.infer<typeof ExtractContractOutputSchema>;

function limpiarYParsearJsonContrato(texto: string): unknown {
  const limpio = (texto || '').trim();
  const sinBloques = limpio
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(sinBloques);
  } catch {
    const inicio = sinBloques.indexOf('{');
    const fin = sinBloques.lastIndexOf('}');
    if (inicio !== -1 && fin > inicio) {
      return JSON.parse(sinBloques.slice(inicio, fin + 1));
    }
    throw new Error('La respuesta de la IA no contiene un JSON válido.');
  }
}

export async function extractContractData(input: ExtractContractInput): Promise<ExtractContractOutput> {
  const parsedInput = ExtractContractInputSchema.parse(input);
  const prompt = `Actúa como un asistente experto de AK Producciones. Tu misión es extraer datos de un presupuesto o contrato que puede tener varias páginas.

GUÍA DE EXTRACCIÓN ESPECÍFICA PARA EL DOCUMENTO ADJUNTO:
1. clienteNombre: Busca el nombre del cliente o empresa justo antes de los detalles del evento. Si aparece como "Nombre Apellido XV Años 2026", extrae solo el nombre (ej: "Carla Lourado").
2. tipoEvento: Identifica si dice "XV Años", "Boda", "Cumpleaños", "Evento corporativo", "Cumpleaños infantil", etc. (o null).
3. eventoFecha: Busca la fecha del evento en formato ISO "YYYY-MM-DD". La tabla pequeña de arriba suele traer la fecha de emisión; no la confundas con la fecha del evento. Si solo figura el año del evento, usa "YYYY-01-01".
4. montoTotal: Busca el "Importe total" al final de la tabla. Ignora prefijos como "NU$" o "$" y extrae el número final (ej: de "NU$ 238.040,00" extrae 238040).
5. telefono: Teléfono o celular del cliente si figura (o null).
6. invitadosAdultos: Cantidad numérica de adultos si figura (o null).
7. invitadosNinos: Cantidad numérica de niños o adolescentes si figura (o null).
8. fechaFirmaContrato: Fecha en que se firmó el contrato en formato ISO "YYYY-MM-DD" si figura (o null).
9. contratoFirmado: true si el documento indica que el contrato está firmado o aceptado; false o null si no consta.
10. serviciosContratados: Array de strings con los nombres de los servicios o menú contratados que figuran en el contrato (o null).
11. sena: Monto numérico de la seña acordada si figura (o null).
12. cuotas: Array de objetos { "monto": number, "fecha": "YYYY-MM-DD" | null, "concepto": string | null } si hay cuotas pactadas (o null).
13. tipoAjusteAnual: Si el contrato dice explícitamente ajuste simple o no acumulativo, devolvé "simple". Si dice acumulativo o no aclara cómo se calcula el ajuste, devolvé "acumulativo".

Devolvé SOLO un objeto JSON válido con estas claves exactas, sin texto adicional ni bloques markdown:
{
  "clienteNombre": string,
  "eventoFecha": string,
  "montoTotal": number,
  "tipoEvento": string | null,
  "telefono": string | null,
  "invitadosAdultos": number | null,
  "invitadosNinos": number | null,
  "fechaFirmaContrato": string | null,
  "contratoFirmado": boolean | null,
  "serviciosContratados": string[] | null,
  "sena": number | null,
  "cuotas": [{ "monto": number, "fecha": string | null, "concepto": string | null }] | null,
  "tipoAjusteAnual": "acumulativo" | "simple"
}`;

  try {
    // extractContractDataAction en historicos.ts ya valida hayPresupuestoParaIA() y registra el consumo;
    // pasamos consumoYaGestionado: true para evitar doble conteo.
    const respuesta = await pedirTexto({
      prompt,
      quien: 'extraccion-contrato',
      consumoYaGestionado: true,
      adjunto: { url: parsedInput.fileDataUri },
    });

    if (!respuesta.ok) {
      throw new Error(respuesta.error || 'La IA no devolvió resultados válidos.');
    }

    const parsedJson = limpiarYParsearJsonContrato(respuesta.texto);
    return ExtractContractOutputSchema.parse(parsedJson);
  } catch (error: any) {
    console.error("Error en extractContractData:", error);
    throw new Error("Error al analizar el documento: " + (error?.message || 'Error desconocido'));
  }
}
