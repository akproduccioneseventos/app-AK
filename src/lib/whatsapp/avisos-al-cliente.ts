import { rellenarPlantilla } from '@/lib/whatsapp/plantilla-mensaje';
import { saveScheduledMessage } from '@/app/actions/scheduled-messages';
import { WHATSAPP_AUTOMATION_INTERNAL_TOKEN } from '@/lib/whatsapp/internal-token';
import { evaluarReglasParaFiesta } from '@/lib/automatizaciones-engine';
import { readData } from '@/lib/data-service';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { marcarCorrida } from '@/lib/automatico/tareas-automaticas';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

export const PLANTILLAS_AVISOS_CLIENTE: Record<string, string> = {
  'faltan-canciones':
    '¡Hola {{NOMBRE}}! ¿Cómo estás? Te escribimos de AK Producciones. Cuando tengas un tiempito pasanos la lista de canciones o los temas especiales para la fiesta, así el DJ va preparando todo.',
  'faltan-fotos-video-vida':
    '¡Hola {{NOMBRE}}! ¿Todo bien? Te mandamos este mensajito para recordarte las fotos del video de vida. Si nos las pasás estos días ya lo vamos editando con tiempo.',
  'menu-sin-definir':
    '¡Hola {{NOMBRE}}! ¿Cómo andás? Te escribimos de AK Producciones para coordinar la elección del menú de la fiesta. Avisanos cuando puedas y lo dejamos definido.',
  'invitados-sin-confirmar':
    '¡Hola {{NOMBRE}}! ¿Cómo van los preparativos? Te recordamos revisar las confirmaciones de los invitados para ir cerrando la cantidad con el catering y el salón.',
};

export function armarTextoAviso(reglaId: string, nombreCliente: string): string {
  const plantilla =
    PLANTILLAS_AVISOS_CLIENTE[reglaId] ||
    '¡Hola {{NOMBRE}}! Te escribimos de AK Producciones para coordinar detalles de tu fiesta.';
  return rellenarPlantilla(plantilla, { NOMBRE: nombreCliente });
}

export interface ResultadoProcesamientoAviso {
  reglaId: string;
  enviado: boolean;
  motivo?: string;
  messageId?: string;
}

/**
 * Prepara los mensajes de recordatorio al cliente para una fiesta específica.
 * - Solo guarda si tiene teléfono en fiesta.configuracion.telefonoAsistencia.
 * - No repite si ya fue preparado antes (revisa fiesta.avisosPreparados).
 * - Guarda con sendingMode: 'manual_click'.
 */
export async function procesarAvisosAlClienteParaFiesta(
  fiesta: FiestaEnPlanificacion,
  guardarFn: typeof saveScheduledMessage = saveScheduledMessage
): Promise<{ resultados: ResultadoProcesamientoAviso[]; fiestaModificada: boolean }> {
  const telefono = fiesta.configuracion?.telefonoAsistencia?.trim();
  const nombreCliente =
    fiesta.configuracion?.clienteNombre ||
    fiesta.configuracion?.nombreAgasajado ||
    fiesta.configuracion?.nombreEvento ||
    'Cliente';

  const alertas = evaluarReglasParaFiesta(fiesta);
  const alertasRecordatorio = alertas.filter((a) => a.tipo === 'recordatorio');

  const avisosPreparados: Record<string, string> = { ...(fiesta.avisosPreparados || {}) };
  let fiestaModificada = false;
  const resultados: ResultadoProcesamientoAviso[] = [];

  for (const alerta of alertasRecordatorio) {
    const reglaId = alerta.id.replace(`_${fiesta.id}`, '');

    // 1. Si ya se preparó para esta regla y fiesta, no se repite
    if (avisosPreparados[reglaId]) {
      resultados.push({
        reglaId,
        enviado: false,
        motivo: 'Aviso ya preparado anteriormente',
      });
      continue;
    }

    // 2. Si no hay teléfono, no se guarda nada
    if (!telefono) {
      resultados.push({
        reglaId,
        enviado: false,
        motivo: 'Esta fiesta no tiene teléfono del cliente',
      });
      continue;
    }

    // 3. Arma el texto con rellenarPlantilla
    const texto = armarTextoAviso(reglaId, nombreCliente);

    // 4. Lo guarda en la bandeja con sendingMode: 'manual_click'
    const res = await guardarFn(
      {
        targetType: 'cliente',
        targetId: fiesta.id,
        targetName: nombreCliente,
        targetPhone: telefono,
        templateType: 'personalizado',
        messageText: texto,
        scheduledAt: new Date().toISOString(),
        status: 'pendiente',
        sendingMode: 'manual_click',
        fiestaId: fiesta.id,
        automationRuleId: reglaId,
      },
      WHATSAPP_AUTOMATION_INTERNAL_TOKEN
    );

    if (res.success && res.message) {
      avisosPreparados[reglaId] = new Date().toISOString();
      fiesta.avisosPreparados = avisosPreparados;
      fiestaModificada = true;
      resultados.push({
        reglaId,
        enviado: true,
        messageId: res.message.id,
      });
    } else {
      resultados.push({
        reglaId,
        enviado: false,
        motivo: res.error || 'Error al guardar mensaje programado',
      });
    }
  }

  return { resultados, fiestaModificada };
}

/**
 * Tarea diaria automática 'avisos-al-cliente'.
 * Recorre todas las fiestas activas y prepara los avisos pendientes en la bandeja.
 */
export async function correrTareaAvisosAlCliente(): Promise<{
  totalFiestas: number;
  mensajesGenerados: number;
}> {
  const fiestas = await readData<FiestaEnPlanificacion[]>('fiestas.json', []);
  let mensajesGenerados = 0;

  let fallas = 0;

  for (const fiesta of fiestas) {
    // DOS PASOS (Codex, auditoría 81). La transacción de la fiesta la base la puede repetir, y
    // guardar en la bandeja adentro dejaba el aviso repetido. Adentro sólo se RESERVA (se anota
    // la regla como preparada); el mensaje se guarda después, una vez, afuera.
    type Pendiente = Parameters<typeof saveScheduledMessage>[0];
    let reservados: Array<{ reglaId: string; mensaje: Pendiente }> = [];
    const res = await actualizarFiesta(fiesta.id, async (fiestaFresca) => {
      reservados = [];
      await procesarAvisosAlClienteParaFiesta(fiestaFresca, (async (mensaje: Pendiente) => {
        reservados.push({ reglaId: String(mensaje.automationRuleId), mensaje });
        return { success: true, message: { id: 'reservado' } };
      }) as unknown as typeof saveScheduledMessage);
      return fiestaFresca;
    }, { publicRsvp: true });
    if (!res.success) {
      console.warn(`[avisos-al-cliente] No se pudo actualizar fiesta ${fiesta.id}:`, res.error);
      fallas++;
      continue;
    }

    const noGuardados: string[] = [];
    for (const { reglaId, mensaje } of reservados) {
      const guardado = await saveScheduledMessage(mensaje, WHATSAPP_AUTOMATION_INTERNAL_TOKEN);
      if (guardado.success) mensajesGenerados++;
      else noGuardados.push(reglaId);
    }
    // Lo que no se pudo guardar se libera, para que la próxima corrida lo vuelva a preparar.
    if (noGuardados.length > 0) {
      fallas++;
      await actualizarFiesta(fiesta.id, async (fiestaFresca) => {
        const avisos = { ...(fiestaFresca.avisosPreparados || {}) };
        for (const reglaId of noGuardados) delete avisos[reglaId];
        fiestaFresca.avisosPreparados = avisos;
        return fiestaFresca;
      }, { publicRsvp: true });
    }
  }

  if (fallas > 0) {
    throw new Error(`No se pudieron preparar los avisos de ${fallas} fiesta(s). Se reintenta en la próxima corrida.`);
  }
  await marcarCorrida('avisos-al-cliente');

  return {
    totalFiestas: fiestas.length,
    mensajesGenerados,
  };
}
