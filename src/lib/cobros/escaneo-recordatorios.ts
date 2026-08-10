/**
 * Escaneo de facturas para armar los recordatorios de pago.
 *
 * Vive acá y no dentro de la acción de servidor por un motivo concreto: la
 * acción exige sesión de usuario, y una tarea programada no tiene sesión.
 * Poniendo la lógica en un módulo común la usan las dos —el botón del equipo,
 * con sesión, y la tarea programada, con su clave— sin abrir una acción sin
 * control que se pueda llamar desde cualquier navegador.
 *
 * Defecto real que motivó esto: la función existía y **nadie la llamaba nunca**,
 * así que ningún cliente con la cuota vencida recibía el aviso. La plata quedaba
 * sin reclamar y nadie se enteraba.
 */
import type { Invoice } from '@/types/invoice';

/** Cuánto se espera antes de volver a avisarle al mismo cliente por lo mismo. */
export const HORAS_ENTRE_AVISOS = 24;

/** Con cuántos días de anticipación se avisa que la cuota está por vencer. */
export const DIAS_DE_AVISO_PREVIO = 3;

export type TipoDeAviso = 'pago_vencido' | 'pago_por_vencer';

export interface MensajeYaProgramado {
  targetId?: string;
  templateType?: string;
  status?: string;
  sentAt?: string;
}

export interface AvisoAEnviar {
  trigger: TipoDeAviso;
  invoice: Invoice;
  balance: number;
}

function aMedianoche(fecha: Date): Date {
  const copia = new Date(fecha);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

/**
 * Decide qué tipo de aviso corresponde según los días que faltan para el
 * vencimiento. Devuelve null si todavía no hay nada que avisar.
 */
export function tipoDeAvisoPorFecha(diasParaVencer: number): TipoDeAviso | null {
  if (diasParaVencer < 0) return 'pago_vencido';
  if (diasParaVencer <= DIAS_DE_AVISO_PREVIO) return 'pago_por_vencer';
  return null;
}

/**
 * true si a ese cliente ya se le mandó o se le va a mandar el mismo aviso.
 * Evita que le lleguen dos mensajes iguales el mismo día.
 */
export function yaSeLeAviso(
  mensajes: MensajeYaProgramado[],
  clienteId: string,
  trigger: TipoDeAviso,
  ahora: Date = new Date(),
): boolean {
  const limite = new Date(ahora.getTime() - HORAS_ENTRE_AVISOS * 60 * 60 * 1000);
  return mensajes.some(m =>
    m.targetId === clienteId &&
    m.templateType === trigger &&
    (m.status === 'pendiente' || (m.status === 'enviado' && !!m.sentAt && new Date(m.sentAt) > limite))
  );
}

/**
 * Recorre las facturas y devuelve a quiénes hay que avisarles. No manda nada:
 * sólo decide. Así se puede probar sin tocar WhatsApp ni la base.
 */
export function calcularAvisosPendientes(
  invoices: Invoice[],
  mensajesYaProgramados: MensajeYaProgramado[],
  opciones: {
    saldoDeFactura: (invoice: Invoice) => number;
    leerFecha: (fecha: string) => Date;
    ahora?: Date;
  },
): AvisoAEnviar[] {
  const ahora = opciones.ahora ?? new Date();
  const hoy = aMedianoche(ahora);
  const avisos: AvisoAEnviar[] = [];

  for (const inv of invoices) {
    if (inv.status === 'Paid') continue;

    const balance = opciones.saldoDeFactura(inv);
    if (balance <= 0) continue;

    const vencimiento = aMedianoche(opciones.leerFecha(inv.dueDate));
    const diasParaVencer = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    const trigger = tipoDeAvisoPorFecha(diasParaVencer);
    if (!trigger) continue;

    if (yaSeLeAviso(mensajesYaProgramados, inv.customer.id, trigger, ahora)) continue;

    avisos.push({ trigger, invoice: inv, balance });
  }

  return avisos;
}
