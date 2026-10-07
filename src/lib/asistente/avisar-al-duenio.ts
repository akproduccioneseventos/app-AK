import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';
/**
 * @fileOverview Envío de notificaciones proactivas al dueño: Celular (Push FCM) y WhatsApp Meta.
 * Respeta rigurosamente interruptores, horario "no molestar", tope de 3 WhatsApp/día y números autorizados.
 */

import { sendPushNotificationToAll } from '@/lib/firebase/server-messaging';
import { sendMetaWhatsAppMessage } from '@/lib/whatsapp/meta-sender';
import { readData, writeData } from '@/lib/data-service';

export interface AsistenteSettings {
  avisoCelularHabilitado: boolean; // Por defecto true
  whatsappDuenioHabilitado: boolean; // Por defecto false
  numeroDuenio: string; // Por defecto '59898355530'
  horarioNoMolestarInicio: number; // Por defecto 23 (23:00)
  horarioNoMolestarFin: number; // Por defecto 8 (08:00)
  asistentesAreas?: {
    ventas: { nombre: string; color: string; responsableId?: string; responsableNombre?: string };
    cobros: { nombre: string; color: string; responsableId?: string; responsableNombre?: string };
    fiestas: { nombre: string; color: string; responsableId?: string; responsableNombre?: string };
  };
  metasMes?: string;
  responderConVoz?: boolean;
  vozSeleccionada?: string;
  /** La voz de Gemini (parte gratis por día). Decisión del dueño, 3/10/2026: con interruptor. */
  vozGeminiActiva?: boolean;
  /** La voz del teléfono, gratis siempre. Si las dos están apagadas, el asistente no habla. */
  vozTelefonoActiva?: boolean;
  numerosEquipo?: Array<{ telefono: string; nombre: string; rol: string }>;
  atenderLlamadasIaHabilitado?: boolean;
}

export const ASISTENTE_SETTINGS_DEFAULT: AsistenteSettings = {
  avisoCelularHabilitado: true,
  whatsappDuenioHabilitado: false,
  numeroDuenio: AK_WHATSAPP_NUMBER,
  horarioNoMolestarInicio: 23,
  horarioNoMolestarFin: 8,
  asistentesAreas: {
    ventas: { nombre: 'Ventas', color: 'blue', responsableNombre: 'Equipo de Ventas' },
    cobros: { nombre: 'Cobros', color: 'amber', responsableNombre: 'Administración' },
    fiestas: { nombre: 'Fiestas', color: 'emerald', responsableNombre: 'Operaciones' },
  },
  metasMes: '',
  responderConVoz: false,
  vozSeleccionada: 'Kore',
  vozGeminiActiva: true,
  vozTelefonoActiva: true,
  numerosEquipo: [
    { telefono: AK_WHATSAPP_NUMBER, nombre: 'Alexander Knuth', rol: 'Dueño' },
  ],
  atenderLlamadasIaHabilitado: false,
};

const SETTINGS_FILE = 'asistente-settings.json';
const ENVIOS_DIARIOS_FILE = 'asistente-envios-whatsapp.json';

interface RegistroEnviosDia {
  fecha: string; // YYYY-MM-DD
  cantidad: number;
}

export async function getAsistenteSettings(): Promise<AsistenteSettings> {
  try {
    const data = await readData<Partial<AsistenteSettings>>(SETTINGS_FILE, {});
    return { ...ASISTENTE_SETTINGS_DEFAULT, ...data };
  } catch {
    return ASISTENTE_SETTINGS_DEFAULT;
  }
}

export async function saveAsistenteSettings(settings: Partial<AsistenteSettings>): Promise<AsistenteSettings> {
  const current = await getAsistenteSettings();
  const updated: AsistenteSettings = { ...current, ...settings };
  await writeData(SETTINGS_FILE, updated);
  return updated;
}

/**
 * Obtiene la hora actual en Uruguay (0-23).
 */
export function getHoraUruguay(fecha: Date = new Date()): number {
  const uruguayDateStr = fecha.toLocaleString('en-US', { timeZone: 'America/Montevideo' });
  const uruguayDate = new Date(uruguayDateStr);
  return uruguayDate.getHours();
}

/**
 * Determina si la hora dada se encuentra dentro del rango de "No Molestar".
 * Ejemplo típico: inicio 23hs y fin 8hs -> 23, 0, 1, 2, 3, 4, 5, 6, 7 son no molestar.
 */
export function estaEnHorarioNoMolestar(hora: number, inicio: number = 23, fin: number = 8): boolean {
  if (inicio > fin) {
    // Cruza la medianoche (ej: 23 a 8)
    return hora >= inicio || hora < fin;
  }
  // Mismo día (ej: 14 a 16)
  return hora >= inicio && hora < fin;
}

/**
 * Obtiene la fecha YYYY-MM-DD en Uruguay.
 */
function getFechaIsoUruguay(fecha: Date = new Date()): string {
  const uruguayDateStr = fecha.toLocaleString('en-US', { timeZone: 'America/Montevideo' });
  const uruguayDate = new Date(uruguayDateStr);
  const year = uruguayDate.getFullYear();
  const month = String(uruguayDate.getMonth() + 1).padStart(2, '0');
  const day = String(uruguayDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Cuenta cuántos WhatsApp se enviaron hoy al dueño.
 */
async function getEnviosWhatsAppHoy(): Promise<number> {
  try {
    const hoyStr = getFechaIsoUruguay();
    const envios = await readData<RegistroEnviosDia>(ENVIOS_DIARIOS_FILE, { fecha: hoyStr, cantidad: 0 });
    if (envios.fecha !== hoyStr) {
      return 0;
    }
    return envios.cantidad || 0;
  } catch {
    return 0;
  }
}

/**
 * Incrementa el contador de WhatsApp enviados hoy.
 */
async function registrarEnvioWhatsAppHoy(): Promise<void> {
  try {
    const hoyStr = getFechaIsoUruguay();
    const envios = await readData<RegistroEnviosDia>(ENVIOS_DIARIOS_FILE, { fecha: hoyStr, cantidad: 0 });
    const cantidad = envios.fecha === hoyStr ? (envios.cantidad || 0) + 1 : 1;
    await writeData(ENVIOS_DIARIOS_FILE, { fecha: hoyStr, cantidad }, undefined, { skipAutoBackup: true });
  } catch (err) {
    console.warn('[AvisarAlDuenio] Error guardando envíos de WhatsApp:', err);
  }
}

export interface PropuestaParaAviso {
  clave: string;
  titulo: string;
  quePasa?: string;
  porQueImporta?: string;
  area?: string;
  esImportante?: boolean;
  monto?: number;
  diasHastaFiesta?: number;
  conflictoPersonalOSalon?: boolean;
}

export interface ResultadoAvisoDuenio {
  pushEnviado: boolean;
  pushError?: string;
  whatsAppEnviado: boolean;
  whatsAppMotivoNoEnvio?: string;
  whatsAppError?: string;
}

/**
 * Función central de aviso al dueño.
 * Filtra propuestas importantes, evalúa switches, horarios y topes.
 */
export async function avisarAlDuenio(
  propuestas: PropuestaParaAviso[],
  fechaActual: Date = new Date()
): Promise<ResultadoAvisoDuenio> {
  const settings = await getAsistenteSettings();
  const resultado: ResultadoAvisoDuenio = {
    pushEnviado: false,
    whatsAppEnviado: false,
  };

  if (!propuestas || propuestas.length === 0) {
    return resultado;
  }

  // Filtrar propuestas importantes (plata, fiesta en < 7 días, conflicto de personal/salón)
  const importantes = propuestas.filter((p) => {
    if (p.esImportante) return true;
    if (p.monto && p.monto > 0) return true;
    if (p.diasHastaFiesta !== undefined && p.diasHastaFiesta <= 7) return true;
    if (p.conflictoPersonalOSalon) return true;
    const desc = `${p.titulo} ${p.quePasa || ''}`.toLowerCase();
    return desc.includes('cuota') || desc.includes('vencid') || desc.includes('choque') || desc.includes('lluvia');
  });

  if (importantes.length === 0) {
    return resultado;
  }

  const horaUy = getHoraUruguay(fechaActual);
  const esHorarioNoMolestar = estaEnHorarioNoMolestar(
    horaUy,
    settings.horarioNoMolestarInicio,
    settings.horarioNoMolestarFin
  );

  // 1. CANAL PUSH CELULAR
  if (settings.avisoCelularHabilitado) {
    try {
      const cantidad = importantes.length;
      const texto = cantidad === 1
        ? `Tenés 1 cosa para mirar: ${importantes[0].titulo}`
        : `Tenés ${cantidad} cosas para mirar en Tu Asistente.`;

      const pushRes = await sendPushNotificationToAll({
        title: 'Tu Asistente AK',
        body: texto,
        data: {
          url: '/asistente',
          cantidad: String(cantidad),
        },
      });

      resultado.pushEnviado = pushRes.success;
      if (!pushRes.success && pushRes.error) {
        resultado.pushError = pushRes.error;
      }
    } catch (err: any) {
      resultado.pushError = err?.message || String(err);
    }
  }

  // 2. CANAL WHATSAPP AL DUEÑO
  if (!settings.whatsappDuenioHabilitado) {
    resultado.whatsAppMotivoNoEnvio = 'WhatsApp al dueño apagado en Ajustes.';
    return resultado;
  }

  if (esHorarioNoMolestar) {
    resultado.whatsAppMotivoNoEnvio = 'Horario de no molestar activo (23 a 8 hs).';
    return resultado;
  }

  const enviosHoy = await getEnviosWhatsAppHoy();
  if (enviosHoy >= 3) {
    resultado.whatsAppMotivoNoEnvio = 'Alcanzado el tope máximo de 3 WhatsApp por día.';
    return resultado;
  }

  const numeroDuenioLimpio = (settings.numeroDuenio || '').replace(/\D/g, '');
  if (!numeroDuenioLimpio) {
    resultado.whatsAppMotivoNoEnvio = 'No hay número de dueño configurado.';
    return resultado;
  }

  // WhatsApp Meta token
  const apiToken = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_API_TOKEN || '';
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || '';

  if (!apiToken || !phoneNumberId) {
    // En pruebas locales o si faltan credenciales
    resultado.whatsAppMotivoNoEnvio = 'Faltan credenciales de WhatsApp Meta en variables de entorno.';
    return resultado;
  }

  const resumenMensaje = `*Tu Asistente AK:* Tenés ${importantes.length} novedades para revisar en la app.\n\n` +
    importantes.slice(0, 3).map((p) => `• ${p.titulo}`).join('\n') +
    `\n\nRevisalas en: https://akproducciones.uy/asistente`;

  try {
    const waRes = await sendMetaWhatsAppMessage({
      to: numeroDuenioLimpio,
      text: resumenMensaje,
      apiToken,
      phoneNumberId,
    });

    if (waRes.success) {
      resultado.whatsAppEnviado = true;
      await registrarEnvioWhatsAppHoy();
    } else {
      resultado.whatsAppError = waRes.error;
      if (waRes.error?.includes('plantilla') || waRes.error?.includes('template') || waRes.error?.includes('24 hour')) {
        resultado.whatsAppMotivoNoEnvio = 'WhatsApp no salió: falta la plantilla aprobada.';
      }
    }
  } catch (err: any) {
    resultado.whatsAppError = err?.message || String(err);
  }

  return resultado;
}
