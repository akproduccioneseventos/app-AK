import 'server-only';

import { createHash, randomUUID } from 'crypto';
import { readDataConDetalle } from '@/lib/data-service';
import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';
import { getAsistenteSettings, estaEnHorarioNoMolestar, getHoraUruguay } from './avisar-al-duenio';
import { getReglaParaTarea } from '@/lib/ia/reglas-de-la-ia';
import { sendMetaWhatsAppMessage } from '@/lib/whatsapp/meta-sender';
import { getFiestaTimeRange } from '@/lib/staff-agenda-conflicts';
import { toWhatsAppDigits } from '@/lib/commercial/contact';
import type { AsistentePropuesta } from './propuestas-service';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Empleado } from '@/types/empleado';
import type { Rol } from '@/types/rol';

interface Entrega {
  intento: string;
  estado: 'reservada' | 'enviada' | 'incierta' | 'rechazada';
  fecha: string;
  messageId?: string;
}

const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** Solo avisos internos: identidad autorizada, fiesta activa y una reserva por tema/hora/destino. */
export async function enviarAvisosOperativosWhatsApp(
  propuestas: Pick<AsistentePropuesta, 'clave' | 'fiestaId' | 'tipoPropuesta'>[],
  fiestas: FiestaEnPlanificacion[],
  ahora = new Date(),
): Promise<{ enviados: number; inciertos: number; motivos: string[] }> {
  const resultado = { enviados: 0, inciertos: 0, motivos: [] as string[] };
  const avisos = propuestas.filter(p => p.tipoPropuesta === 'vigilante_noche' && p.fiestaId);
  if (!avisos.length || await getReglaParaTarea('vigilante_noche') !== 'sola') return resultado;
  const settings = await getAsistenteSettings();
  if (settings.avisosProactivosActivos === false || !settings.whatsappDuenioHabilitado) return resultado;
  if (estaEnHorarioNoMolestar(getHoraUruguay(ahora), settings.horarioNoMolestarInicio, settings.horarioNoMolestarFin)) {
    resultado.motivos.push('Horario de descanso: los avisos siguen disponibles en la app.');
    return resultado;
  }
  const apiToken = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_API_TOKEN || '';
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  if (!apiToken || !phoneNumberId) {
    resultado.motivos.push('Falta la conexion de WhatsApp; no se confirmo ningun envio.');
    return resultado;
  }
  const equipo = new Map((settings.numerosEquipo || []).map(p => [toWhatsAppDigits(p.telefono), p]));
  const [empleados, roles] = await Promise.all([
    readDataConDetalle<Empleado[]>('empleados.json', []),
    readDataConDetalle<Rol[]>('roles.json', []),
  ]);
  if (empleados.huboFalla || roles.huboFalla) {
    resultado.motivos.push('No se pudo verificar el personal; los avisos quedan en la app.');
    return resultado;
  }
  const rolesCoordinacion = new Set(roles.valor.filter(r => /^(coordinadora?|encargad[oa])( de evento)?$/.test(normalizar(r.nombre))).map(r => r.id));
  for (const aviso of avisos) {
    const fiesta = fiestas.find(f => f.id === aviso.fiestaId);
    if (!fiesta || !aviso.clave) continue;
    if (fiesta.id.startsWith('demo_') || /^(?:suspendid[ao]|cancelad[ao]|archivad[ao]|demo ak)$/i.test(String(fiesta.estado || '').trim())) continue;
    const rango = getFiestaTimeRange(fiesta);
    if (!rango || ahora.getTime() < rango.startMs || ahora.getTime() > rango.endMs) continue;
    const match = /^agente:vigilante_noche:(.+):(programa|personal|barra):(\d{4}-\d{2}-\d{2}-\d{2})$/.exec(aviso.clave);
    if (!match || match[1] !== fiesta.id) continue;
    const hora = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Montevideo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).format(ahora).replace(' ', '-');
    if (match[3] !== hora) continue;
    const destinos = new Set<string>();
    const dueno = toWhatsAppDigits(settings.numeroDuenio || '');
    if (equipo.has(dueno) && /^(duen[oa]|administradora?)$/.test(normalizar(equipo.get(dueno)!.rol))) destinos.add(dueno);
    for (const persona of fiesta.personalAsignado || []) {
      if (persona.asistenciaConfirmada === false) continue;
      if (!rolesCoordinacion.has(persona.rolId)) continue;
      const empleado = empleados.valor.find(e => e.id === persona.empleadoId);
      const telefono = toWhatsAppDigits(empleado?.telefono || '');
      const autorizado = equipo.get(telefono);
      if (autorizado && /^(duen[oa]|administradora?|coordinadora?|organizadora?|encargad[oa])$/.test(normalizar(autorizado.rol))) destinos.add(telefono);
    }
    if (!destinos.size) resultado.motivos.push('No hay dueno o coordinador asignado con numero autorizado; revisar el aviso en la app.');
    for (const to of destinos) {
      if (!/^5989\d{7}$/.test(to)) continue;
      const clave = createHash('sha256').update(`${aviso.clave}|${to}`).digest('hex');
      const intento = randomUUID();
      let reservado = false;
      await mutarDocumentoConTransaccion<Record<string, Entrega>>('asistente/avisos-operativos.json', {}, registro => {
        reservado = false;
        if (registro[clave] && registro[clave].estado !== 'rechazada') return null;
        reservado = true;
        const recientes = Object.fromEntries(Object.entries(registro).filter(([, e]) => Date.parse(e.fecha) > ahora.getTime() - 7 * 86400000));
        return { ...recientes, [clave]: { intento, estado: 'reservada', fecha: ahora.toISOString() } };
      });
      if (!reservado) continue;
      const tema = { programa: 'el programa', personal: 'la llegada del personal', barra: 'el stock de barra' }[match[2] as 'programa' | 'personal' | 'barra'];
      // El telefono nunca recibe importes, deudas ni datos de invitados.
      const envio = await sendMetaWhatsAppMessage({ to, apiToken, phoneNumberId,
        text: `Aviso operativo AK: revisar ${tema} de la fiesta en curso. Detalle y acciones en https://akproducciones.uy/fiestas/nueva?fiestaId=${encodeURIComponent(fiesta.id)}`,
      }).catch(() => ({ success: false, delivery: 'uncertain' as const, messageId: undefined }));
      const estado = envio.success && envio.messageId ? 'enviada' : envio.delivery === 'not_sent' ? 'rechazada' : 'incierta';
      await mutarDocumentoConTransaccion<Record<string, Entrega>>('asistente/avisos-operativos.json', {}, registro => {
        if (registro[clave]?.intento !== intento || registro[clave]?.estado === 'enviada') return null;
        return { ...registro, [clave]: { intento, estado, fecha: ahora.toISOString(), ...(envio.messageId ? { messageId: envio.messageId } : {}) } };
      });
      if (estado === 'enviada') resultado.enviados++;
      else if (estado === 'incierta') resultado.inciertos++;
      else resultado.motivos.push('Meta rechazo un aviso; sigue pendiente en la app.');
    }
  }
  return resultado;
}
