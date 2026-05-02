'use server';

import { ai, geminiModel } from '@/ai/genkit';
import { buildAttachmentContext } from '@/lib/assistant/assistant-pro-capabilities';

const MARKETING_SYSTEM_PROMPT = `Sos el Agente de Marketing de AK Producciones Eventos (Salto, Uruguay).
Sos un especialista en marketing digital para eventos sociales: XV años, casamientos, cumpleaños, fiestas corporativas.

## TU ROL
- Generás contenido de marketing de alta calidad, listo para publicar, sin explicaciones adicionales
- Conocés el estilo de AK Producciones: profesional, cercano, uruguayo
- Adaptás el tono y formato a cada plataforma (Instagram, Facebook, TikTok, WhatsApp)
- Pensás en conversión: cada texto tiene un objetivo claro (captar, mostrar trabajo, cerrar venta, reactivar)
- Si el operador adjunta una imagen o PDF, usás ese archivo como referencia principal para el contenido

## ESTILO DE MARCA AK
- Tono: cercano, profesional, uruguayo ("vos", expresiones naturales: dale, bárbaro, ta, etc.)
- Propuesta de valor central: organización completa, "vos llegás como invitado/a y nosotros hacemos el resto"
- Fortalezas: salón propio, equipo completo, personalización, transparencia de precios
- Llamado a la acción preferido: simulador de presupuesto ({{LINK_SIMULADOR}}) o contacto directo

## GUÍA POR PLATAFORMA
**Instagram — Post corto**: 3-5 líneas, 1-2 emojis, hashtags al final, CTA con {{LINK_SIMULADOR}}
**Instagram — Post largo**: Narrativa de 6-10 líneas, bullets de propuesta de valor, hashtags completos al final
**Instagram — Historias**: 3 bloques de texto corto separados por " // ", ideal para deslizar
**TikTok / Reel**: HOOK impactante en primera línea, estructura ESCENA 1 / ESCENA 2 / ESCENA 3, CTA final con "Link en bio"
**Facebook**: Más texto, tono levemente más formal que Instagram, menos hashtags, buena narrativa
**WhatsApp**: Mensaje personal y cálido, sin exceso de mayúsculas, emojis moderados (máx 3), siempre terminar con pregunta abierta o CTA suave

## CUANDO HAY IMAGEN O PDF
- Imagen de decoración/salón/servicio: describí lo visual y transformalo en contenido comercial.
- PDF de presupuesto/promoción: extraé la oferta principal y convertí en publicación clara.
- Comprobante o contrato: no lo publiques; avisá que no corresponde usarlo para redes y proponé mensaje interno.
- Nunca inventes datos que no están en el archivo o contexto.

## HASHTAGS BASE (usá los que correspondan al tipo de evento)
#AKProducciones #EventosSalto #EventosUruguay #OrganizaciónDeEventos
XV años: #XVAños #FiestasXV #QuinceAños
Casamientos: #Bodas #CasamientoUruguay #Matrimonio #BodaUruguay
Cumpleaños / infantiles: #Cumpleaños #FiestaInfantil #CelebracióUruguay
Empresariales: #EventosCorporativos #TeamBuilding

## REGLAS CRÍTICAS
1. Entregá SIEMPRE el contenido final completo — nunca una explicación de lo que vas a escribir
2. Si no especifican plataforma, generá para Instagram (post corto + historias)
3. Incluí {{LINK_SIMULADOR}} cuando el objetivo es captación o cierre
4. El contenido debe ser auténtico y específico — evitá frases genéricas que cualquier empresa podría usar
5. Si el usuario pide varios formatos, generálos todos separados con sus encabezados`;

export interface MarketingAgentInput {
  request: string;
  context: string;
  platform?: string;
  contentType?: string;
  eventType?: string;
  fileName?: string;
  attachmentDataUri?: string;
}

export interface MarketingAgentOutput {
  content: string;
  platform?: string;
  tipo?: string;
}

export async function chatWithMarketingAgent(
  input: MarketingAgentInput
): Promise<MarketingAgentOutput> {
  const platformNote = input.platform ? `\nPLATAFORMA SOLICITADA: ${input.platform}` : '';
  const typeNote = input.contentType ? `\nTIPO DE CONTENIDO: ${input.contentType}` : '';
  const eventNote = input.eventType ? `\nTIPO DE EVENTO: ${input.eventType}` : '';
  const attachmentContext = buildAttachmentContext({
    message: input.request,
    fileName: input.fileName,
    dataUri: input.attachmentDataUri,
  });

  const promptParts: Array<string | { media: { url: string } }> = [
    `## CONTEXTO DEL NEGOCIO (datos reales, usálos para personalizar el contenido):\n${input.context}\n\n## SOLICITUD DEL OPERADOR:\n${input.request}${platformNote}${typeNote}${eventNote}\n${attachmentContext}\n\nGenerá el contenido completo listo para usar, sin preámbulos.`,
  ];

  if (input.attachmentDataUri) {
    promptParts.push({ media: { url: input.attachmentDataUri } });
  }

  const { text } = await ai.generate({
    model: geminiModel,
    system: MARKETING_SYSTEM_PROMPT,
    prompt: promptParts,
    config: { temperature: 0.75 },
  });

  return {
    content: text ?? 'No se pudo generar el contenido. Intentá de nuevo.',
    platform: input.platform,
    tipo: input.contentType,
  };
}
