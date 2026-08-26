import 'server-only';

import { generateWithGeminiFallback, getGeminiGenerationConfigForAgent } from '@/ai/genkit';
import type { AkAgentType, AkMultiAgentInput, AkMultiAgentOutput } from '@/types/multiagent';
import { runMultiAgent } from '@/ai/flows/multiagent-flow';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { getCrmLeads } from '@/app/actions/crm';
import { getFiestaById, getAllFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { hayPresupuestoParaIA } from '@/lib/ai/consumo-servidor';

export const MAX_ESPECIALISTAS_POR_PEDIDO = 3;
export const MAX_VUELTAS_POR_PEDIDO = 5;

export interface EspecialistaProgreso {
  id: AkAgentType;
  nombre: string;
  estado: 'consultando' | 'listo' | 'error';
  resumen?: string;
}

export interface EncargadoExecutionResult extends AkMultiAgentOutput {
  especialistasConsultados: EspecialistaProgreso[];
  vueltasRealizadas: number;
  preguntasAlDueno?: string[];
  presupuestoRestanteAviso?: string;
}

/**
 * Detecta qué especialistas son necesarios para resolver la consulta.
 * Limita estrictamente a un máximo de 3 especialistas.
 */
export function seleccionarEspecialistas(mensaje: string, pathname?: string, fiestaId?: string): AkAgentType[] {
  const msg = mensaje.toLowerCase();
  const especialistas: Set<AkAgentType> = new Set();

  const esFinanciero = /(pago|cuota|saldo|factura|rentabilidad|ganancia|costo|ingreso|seña|sena|deuda|cobro|plata|cuanto sale)/i.test(msg);
  const esFiesta = /(fiesta|evento|cumple|boda|xv|quince|mozo|salon|salón|catering|menu|menú|invitados|decoracion|decoración|dj)/i.test(msg) || Boolean(fiestaId);
  const esComercial = /(lead|prospecto|presupuesto|cliente|vender|venta|cotiz|cerrar)/i.test(msg);
  const esMarketing = /(redes|instagram|facebook|tiktok|anuncio|publicar|post|historia|reel|publicidad)/i.test(msg);
  const esSecretaria = /(agenda|reunion|reunión|cita|recordatorio|llamar|llamada|horario)/i.test(msg);

  if (esFiesta) especialistas.add('fiesta');
  if (esFinanciero) especialistas.add('contable');
  if (esComercial) especialistas.add('comercial');
  if (esMarketing) especialistas.add('marketing');
  if (esSecretaria) especialistas.add('secretaria');

  if (especialistas.size === 0) {
    especialistas.add('central');
  }

  // Tope estricto de máximo 3 especialistas
  return Array.from(especialistas).slice(0, MAX_ESPECIALISTAS_POR_PEDIDO);
}

/**
 * El Encargado coordina a su equipo de especialistas, ejecuta en vueltas,
 * comprueba los resultados y sintetiza una respuesta unificada en criollo.
 */
export async function ejecutarEncargado(input: AkMultiAgentInput): Promise<EncargadoExecutionResult> {
  const hayPresupuesto = await hayPresupuestoParaIA().catch(() => true);
  if (!hayPresupuesto) {
    return {
      success: true,
      response: 'Che, este mes ya usé todo lo que tengo asignado de inteligencia artificial; sigo contestando lo que pueda con los datos guardados en la app sin consultar al modelo.',
      agentType: 'central',
      agentName: 'Encargado General AK',
      especialistasConsultados: [],
      vueltasRealizadas: 0,
      presupuestoRestanteAviso: 'Tope mensual alcanzado.',
    };
  }

  const especialistas = seleccionarEspecialistas(input.message, input.pathname, input.fiestaId);
  const progreso: EspecialistaProgreso[] = [];
  const hallazgos: string[] = [];

  // Si es un solo especialista directo, delegamos directamente
  if (especialistas.length === 1 && especialistas[0] !== 'central') {
    const singleResult = await runMultiAgent({
      ...input,
      agentType: especialistas[0],
    });

    return {
      ...singleResult,
      especialistasConsultados: [
        {
          id: especialistas[0],
          nombre: singleResult.agentName,
          estado: singleResult.success ? 'listo' : 'error',
          resumen: singleResult.response?.slice(0, 100),
        },
      ],
      vueltasRealizadas: 1,
    };
  }

  // Consulta a los especialistas seleccionados (hasta 3)
  for (const esp of especialistas) {
    const nombreEsp = esp === 'contable' ? 'Contabilidad' : esp === 'fiesta' ? 'Coordinación de Fiestas' : esp === 'comercial' ? 'Ventas' : esp === 'marketing' ? 'Marketing' : esp === 'secretaria' ? 'Secretaría' : 'General';
    progreso.push({ id: esp, nombre: nombreEsp, estado: 'consultando' });

    try {
      const resEsp = await runMultiAgent({
        ...input,
        agentType: esp,
      });

      const progItem = progreso.find((p) => p.id === esp);
      if (progItem) {
        progItem.estado = resEsp.success ? 'listo' : 'error';
        progItem.resumen = resEsp.response;
      }

      if (resEsp.success && resEsp.response) {
        hallazgos.push(`[${nombreEsp}]: ${resEsp.response}`);
      }
    } catch {
      const progItem = progreso.find((p) => p.id === esp);
      if (progItem) progItem.estado = 'error';
      hallazgos.push(`[${nombreEsp}]: no pude obtener datos en este momento.`);
    }
  }

  // Síntesis en primera persona Rioplatense por el Encargado
  const promptSintesis = `Sos el Encargado General de AK Producciones Eventos.
El dueño te preguntó: "${input.message}".
Consultaste a tus especialistas y trajeron esto:
${hallazgos.join('\n\n')}

Instrucciones:
1. Hablá en primera persona, en español rioplatense natural (vos, bo, che, dale).
2. NUNCA digas "el agente contable informa" ni "el especialista de marketing dice".
3. Unificá todo en una sola respuesta clara, directa, con viñetas concisas y máximo 4-5 líneas.
4. Si algún especialista no pudo responder, decilo simple: "del personal no pude averiguar".
5. Si falta una decisión que cambie la plata o fecha, hacé una sola pregunta clara al final.
6. Usá 2-3 emojis pertinentes.`;

  try {
    const sintesis = await generateWithGeminiFallback({
      prompt: promptSintesis,
      config: {
        temperature: 0.3,
        maxOutputTokens: 500,
      },
    });

    const respuestaFinal = sintesis.text?.trim() || hallazgos.join('\n');

    return {
      success: true,
      response: respuestaFinal,
      agentType: 'central',
      agentName: 'Encargado General AK',
      especialistasConsultados: progreso,
      vueltasRealizadas: 1,
    };
  } catch {
    return {
      success: true,
      response: hallazgos.join('\n\n'),
      agentType: 'central',
      agentName: 'Encargado General AK',
      especialistasConsultados: progreso,
      vueltasRealizadas: 1,
    };
  }
}
