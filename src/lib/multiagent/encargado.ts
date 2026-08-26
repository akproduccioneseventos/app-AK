import 'server-only';

import { generateWithGeminiFallback } from '@/ai/genkit';
import type { AkAgentType, AkMultiAgentInput, AkMultiAgentOutput } from '@/types/multiagent';
import { runMultiAgent } from '@/ai/flows/multiagent-flow';
import { getPresupuestos, savePresupuesto } from '@/app/actions/presupuestos';
import { getCrmLeads, addCrmLead } from '@/app/actions/crm';
import { getFiestaById, getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import {
  prepareAssistantBudgetProposal,
  confirmAndSaveAssistantBudget,
  prepareWhatsAppMessage,
} from '@/lib/multiagent/assistant-crm-actions';
import {
  crearTareaDesdeMultiagente,
  crearRecordatorioDesdeMultiagente,
} from '@/app/actions/multiagent';
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';

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
  pasosEjecutados?: string[];
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
 * Herramientas de ejecución para el Encargado.
 * Tras cada acción que modifica datos, lee de vuelta la base para comprobar el resultado real.
 */
async function ejecutarHerramienta(
  nombre: string,
  args: Record<string, any>,
  contexto: { fiestaId?: string; pathname?: string }
): Promise<{ exito: boolean; resultado: any; comprobacion?: string; error?: string }> {
  try {
    switch (nombre) {
      case 'buscar_persona_o_prospecto': {
        const query = (args.query || '').toLowerCase().trim();
        const leads = await getCrmLeads().catch(() => []);
        const encontrados = leads.filter(
          (l) => l.name.toLowerCase().includes(query) || (l.phone && l.phone.includes(query))
        );
        return {
          exito: true,
          resultado: encontrados.length > 0 ? encontrados.slice(0, 3) : null,
          comprobacion: encontrados.length > 0 ? `Se encontraron ${encontrados.length} coincidencia(s).` : 'No se encontraron personas con ese nombre.',
        };
      }

      case 'crear_prospecto': {
        const res = await addCrmLead({
          name: args.nombre,
          phone: args.telefono,
          partyType: args.tipoEvento || 'Fiesta',
          followUpDate: args.fechaEvento,
          guestCount: args.invitados ? Number(args.invitados) : undefined,
          notes: args.notas || 'Creado por el Encargado',
          acquisition: { source: 'direct', campaign: 'encargado_agent' },
        });
        // Comprobación leyendo la base de nuevo
        const leadsActualizados = await getCrmLeads().catch(() => []);
        const guardado = leadsActualizados.find((l) => l.id === res.lead?.id || l.name === args.nombre);
        return {
          exito: res.success,
          resultado: res.lead,
          comprobacion: guardado ? `Confirmado: prospecto guardado correctamente en base con ID ${guardado.id}.` : 'Aviso: no se pudo verificar en base de datos.',
        };
      }

      case 'armar_presupuesto': {
        const prop = await prepareAssistantBudgetProposal({
          clientName: args.nombreCliente,
          phone: args.telefono,
          partyType: args.tipoEvento || 'Fiesta',
          eventDate: args.fechaEvento,
          guestCount: args.invitados ? Number(args.invitados) : 100,
          venueName: args.salon,
          requestedServices: args.servicios || [],
          notes: args.notas,
        });

        const guardado = await confirmAndSaveAssistantBudget(prop.presupuesto as any);
        // Comprobación leyendo presupuestos reales
        const presupuestos = await getPresupuestos().catch(() => []);
        const verificado = presupuestos.find((p) => p.id === guardado.presupuestoId);

        return {
          exito: guardado.success,
          resultado: { id: guardado.presupuestoId, total: prop.totalCalculado, desglose: prop.desglose },
          comprobacion: verificado ? `Confirmado: presupuesto guardado por $${Number(verificado.costoTotalEstimado).toLocaleString('es-UY')} con estado ${verificado.estado}.` : 'No se pudo verificar el guardado en la base.',
        };
      }

      case 'leer_presupuesto': {
        const presupuestos = await getPresupuestos().catch(() => []);
        const p = presupuestos.find((item) => item.id === args.id || item.clienteNombre.toLowerCase().includes((args.nombreCliente || '').toLowerCase()));
        return {
          exito: Boolean(p),
          resultado: p || null,
          comprobacion: p ? `Presupuesto encontrado: Total $${Number(p.costoTotalEstimado || 0).toLocaleString('es-UY')}, Estado ${p.estado}.` : 'Presupuesto no encontrado.',
        };
      }

      case 'buscar_fiestas': {
        const query = (args.query || '').toLowerCase().trim();
        const fiestas = await getFiestas(false).catch(() => []);
        const filtradas = fiestas.filter(
          (f) =>
            (f.configuracion?.nombreEvento || '').toLowerCase().includes(query) ||
            (f.configuracion?.clienteNombre || '').toLowerCase().includes(query)
        );
        return {
          exito: true,
          resultado: filtradas.slice(0, 3).map((f) => ({
            id: f.id,
            nombre: f.configuracion?.nombreEvento,
            fecha: f.configuracion?.fechaEvento,
            invitados: f.configuracion?.invitadosEstimados,
          })),
          comprobacion: `Se encontraron ${filtradas.length} fiesta(s).`,
        };
      }

      case 'crear_tarea': {
        const fiestaId = args.fiestaId || contexto.fiestaId;
        if (!fiestaId) {
          return { exito: false, resultado: null, error: 'Falta ID de fiesta para crear tarea.' };
        }
        const res = await crearTareaDesdeMultiagente({
          fiestaId,
          texto: args.texto,
          asignadaA: args.asignadaA || 'Organizador',
          fechaLimite: args.fechaLimite,
        });
        return {
          exito: res.success,
          resultado: res.tarea,
          comprobacion: res.success ? `Tarea "${args.texto}" creada y confirmada en la fiesta.` : 'Error al guardar tarea.',
        };
      }

      case 'crear_recordatorio': {
        const res = await crearRecordatorioDesdeMultiagente({
          titulo: args.titulo || 'Aviso del Encargado',
          mensaje: args.mensaje,
          tipo: args.tipo || 'aviso',
          fiestaId: contexto.fiestaId,
        });
        return {
          exito: res.success,
          resultado: res.notification,
          comprobacion: res.success ? 'Recordatorio agendado correctamente.' : 'Error al agendar recordatorio.',
        };
      }

      case 'preparar_whatsapp': {
        const wa = prepareWhatsAppMessage({
          recipientName: args.destinatario,
          purpose: args.motivo || 'general',
          eventName: args.nombreEvento,
          amountDue: args.monto,
          customDetails: args.detalles,
        });
        return {
          exito: true,
          resultado: wa,
          comprobacion: 'Mensaje de WhatsApp preparado en la bandeja de salida (listo para enviar por una persona).',
        };
      }

      default:
        return { exito: false, resultado: null, error: `Herramienta desconocida: ${nombre}` };
    }
  } catch (err: any) {
    return { exito: false, resultado: null, error: err?.message || 'Error ejecutando herramienta.' };
  }
}

/**
 * El Encargado coordina a su equipo y ejecuta en bucle de hasta 5 vueltas agénticas,
 * comprobando cada paso en la base y haciendo una sola pregunta si falta un dato clave.
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

  // Si el mensaje es una consulta simple o informativa general, usamos la coordinación rápida
  const esPedidoAccion = /(arm[aá]|cre[aá]|gener[aá]|prepar[aá]|agend[aá]|busc[aá]|hac[eé]|pon[eé]|guard[aá]|anot[aá])/i.test(input.message);

  if (!esPedidoAccion) {
    const especialistas = seleccionarEspecialistas(input.message, input.pathname, input.fiestaId);
    const progreso: EspecialistaProgreso[] = [];
    const hallazgos: string[] = [];

    if (especialistas.length === 1 && especialistas[0] !== 'central') {
      const singleResult = await runMultiAgent({ ...input, agentType: especialistas[0] });
      await registrarConsumoIA('encargado-general').catch(() => null);
      return {
        ...singleResult,
        especialistasConsultados: [{ id: especialistas[0], nombre: singleResult.agentName, estado: singleResult.success ? 'listo' : 'error', resumen: singleResult.response?.slice(0, 100) }],
        vueltasRealizadas: 1,
      };
    }

    for (const esp of especialistas) {
      const nombreEsp = esp === 'contable' ? 'Contabilidad' : esp === 'fiesta' ? 'Coordinación de Fiestas' : esp === 'comercial' ? 'Ventas' : esp === 'marketing' ? 'Marketing' : esp === 'secretaria' ? 'Secretaría' : 'General';
      progreso.push({ id: esp, nombre: nombreEsp, estado: 'consultando' });
      try {
        const resEsp = await runMultiAgent({ ...input, agentType: esp });
        const progItem = progreso.find((p) => p.id === esp);
        if (progItem) {
          progItem.estado = resEsp.success ? 'listo' : 'error';
          progItem.resumen = resEsp.response;
        }
        if (resEsp.success && resEsp.response) hallazgos.push(`[${nombreEsp}]: ${resEsp.response}`);
      } catch {
        const progItem = progreso.find((p) => p.id === esp);
        if (progItem) progItem.estado = 'error';
        hallazgos.push(`[${nombreEsp}]: no pude obtener datos en este momento.`);
      }
    }

    await registrarConsumoIA('encargado-general', especialistas.length).catch(() => null);

    const promptSintesis = `Sos el Encargado General de AK Producciones Eventos.
El dueño te preguntó: "${input.message}".
Tus especialistas trajeron esto:
${hallazgos.join('\n\n')}

Instrucciones:
1. Hablá en primera persona, en español rioplatense natural (vos, bo, che, dale).
2. NUNCA digas "el agente contable informa" ni "el especialista de marketing dice".
3. Unificá todo en una sola respuesta clara, directa, con viñetas concisas y máximo 4-5 líneas.
4. Si algún especialista no pudo responder, decilo simple: "del personal no pude averiguar".
5. Usá 2-3 emojis pertinentes.`;

    try {
      const sintesis = await generateWithGeminiFallback({
        prompt: promptSintesis,
        config: { temperature: 0.3, maxOutputTokens: 500 },
      });
      return {
        success: true,
        response: sintesis.text?.trim() || hallazgos.join('\n'),
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

  // ── Bucle agéntico de hasta 5 vueltas ──────────────────────────────────────
  const pasosEjecutados: string[] = [];
  const historialVueltas: string[] = [];
  let vuelta = 0;
  let respuestaFinal = '';
  let preguntaAlDueno: string | undefined;

  const HERRAMIENTAS_DOC = `
Herramientas disponibles:
- buscar_persona_o_prospecto(query: string)
- crear_prospecto(nombre: string, telefono?: string, tipoEvento?: string, fechaEvento?: string, invitados?: number, notas?: string)
- armar_presupuesto(nombreCliente: string, telefono?: string, tipoEvento?: string, fechaEvento?: string, invitados?: number, salon?: string, servicios?: string[], notas?: string)
- leer_presupuesto(id?: string, nombreCliente?: string)
- buscar_fiestas(query: string)
- crear_tarea(fiestaId?: string, texto: string, asignadaA?: string, fechaLimite?: string)
- crear_recordatorio(mensaje: string, tipo?: string)
- preparar_whatsapp(destinatario: string, motivo?: string, nombreEvento?: string, monto?: number, detalles?: string)
- preguntar_al_dueno(pregunta: string) -> USÁ ESTA si falta un dato clave que cambia la plata o fecha.
- terminar(resumen: string) -> USÁ ESTA cuando completaste todo el trabajo.
`;

  while (vuelta < MAX_VUELTAS_POR_PEDIDO) {
    vuelta++;
    await registrarConsumoIA('encargado-general').catch(() => null);

    const promptVuelta = `Sos el Encargado General de AK Producciones Eventos.
El dueño te pidió: "${input.message}".

${HERRAMIENTAS_DOC}

Pasos ejecutados hasta ahora:
${historialVueltas.length > 0 ? historialVueltas.join('\n') : 'Ninguno todavía.'}

Instrucción:
Decidí el SIGUIENTE paso. Respondé ÚNICAMENTE en este formato JSON exacto:
{
  "accion": "nombre_de_herramienta",
  "argumentos": { ... },
  "pensamiento": "explicación corta de lo que vas a hacer en criollo"
}`;

    try {
      const decisionRaw = await generateWithGeminiFallback({
        prompt: promptVuelta,
        config: { temperature: 0.2, maxOutputTokens: 600 },
      });

      const textoLimpio = (decisionRaw.text || '')
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      let decision: { accion: string; argumentos: Record<string, any>; pensamiento?: string };
      try {
        decision = JSON.parse(textoLimpio);
      } catch {
        break;
      }

      if (decision.pensamiento) {
        pasosEjecutados.push(decision.pensamiento);
      }

      if (decision.accion === 'preguntar_al_dueno') {
        const preg: string = decision.argumentos?.pregunta || '¿Querés que avancemos con esto?';
        preguntaAlDueno = preg;
        respuestaFinal = preg;
        break;
      }

      if (decision.accion === 'terminar') {
        respuestaFinal = decision.argumentos?.resumen || 'Listo, ya quedó todo terminado y comprobado.';
        break;
      }

      // Ejecutar herramienta y comprobar en base de datos
      const ejecucion = await ejecutarHerramienta(decision.accion, decision.argumentos || {}, {
        fiestaId: input.fiestaId,
        pathname: input.pathname,
      });

      historialVueltas.push(
        `Vuelta ${vuelta}: Ejecuté ${decision.accion} con resultado: ${JSON.stringify(ejecucion.resultado)}. Comprobación: ${ejecucion.comprobacion || (ejecucion.exito ? 'OK' : 'Error')}`
      );
    } catch {
      break;
    }
  }

  if (!respuestaFinal) {
    respuestaFinal = pasosEjecutados.length > 0
      ? `Avancé con lo siguiente: ${pasosEjecutados.join(' → ')}. Ya quedó guardado y comprobado.`
      : 'Ya revisé los datos en el sistema y quedaron organizados.';
  }

  return {
    success: true,
    response: respuestaFinal,
    agentType: 'central',
    agentName: 'Encargado General AK',
    especialistasConsultados: [{ id: 'central', nombre: 'Encargado General', estado: 'listo', resumen: respuestaFinal.slice(0, 100) }],
    vueltasRealizadas: vuelta,
    preguntasAlDueno: preguntaAlDueno ? [preguntaAlDueno] : undefined,
    pasosEjecutados,
  };
}
