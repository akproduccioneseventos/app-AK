/**
 * Lo que dice el portal del cliente sobre cuánto falta para la fiesta.
 *
 * Antes decía siempre "Faltan N días". El día de la fiesta mostraba
 * **"Faltan 0 días"**, que suena a error, y con un día decía "Faltan 1 días".
 * Es lo primero que ve el cliente al abrir su portal.
 */
import { hoyEnUruguay } from '@/lib/utils';

export function textoDeCuentaRegresiva(dias: number | null): string {
  if (dias === null || !Number.isFinite(dias)) return 'Fecha a confirmar';
  if (dias < 0) return '¡Ya la festejaste!';
  if (dias === 0) return '¡Es hoy!';
  if (dias === 1) return '¡Es mañana!';
  return `Faltan ${dias} días`;
}

/**
 * Determina el texto del evento para el portal del cliente según la fecha
 * comparada con el día de hoy en Uruguay (Orden 285 - Bloque 7).
 *
 * Si es hoy: "¡Llegó el gran día!"
 * Si ya pasó: "¡Ya la festejaste!"
 */
export function textoDeEstadoDeFiestaParaPortal(
  fechaEvento?: string | null,
  hoy: string = hoyEnUruguay()
): string {
  if (!fechaEvento) return 'Fecha a confirmar';
  const fechaStr = String(fechaEvento).slice(0, 10);
  if (fechaStr.length < 10) return 'Fecha a confirmar';

  if (fechaStr === hoy) {
    return '¡Llegó el gran día!';
  }
  if (fechaStr < hoy) {
    return '¡Ya la festejaste!';
  }

  const diffMs = new Date(`${fechaStr}T12:00:00Z`).getTime() - new Date(`${hoy}T12:00:00Z`).getTime();
  const dias = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return textoDeCuentaRegresiva(dias);
}

export const textoEstadoEvento = textoDeEstadoDeFiestaParaPortal;
export const determinarTextoGranDiaOPasado = textoDeEstadoDeFiestaParaPortal;

/**
 * Determina el texto de la cuenta regresiva para la invitación pública o portal general:
 * Si es hoy: "¡Es hoy!"
 * Si ya pasó: "¡Ya la festejaste!"
 */
export function textoDeCuentaRegresivaFecha(
  fechaEvento?: string | null,
  hoy: string = hoyEnUruguay()
): string {
  if (!fechaEvento) return 'Fecha a confirmar';
  const fechaStr = String(fechaEvento).slice(0, 10);
  if (fechaStr.length < 10) return 'Fecha a confirmar';

  if (fechaStr === hoy) {
    return '¡Es hoy!';
  }
  if (fechaStr < hoy) {
    return '¡Ya la festejaste!';
  }

  const diffMs = new Date(`${fechaStr}T12:00:00Z`).getTime() - new Date(`${hoy}T12:00:00Z`).getTime();
  const dias = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return textoDeCuentaRegresiva(dias);
}
