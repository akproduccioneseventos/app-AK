import type { FiestaEnPlanificacion, InvitacionDigitalData } from '@/types/fiesta';

/**
 * Datos que la invitación necesita sí o sí antes de compartirla.
 *
 * No sirve para bloquear el guardado: el equipo arma la invitación de a poco y
 * tiene que poder dejarla a medias. Sirve para avisar justo antes de mandarla,
 * que es cuando el hueco se vuelve un problema del invitado.
 *
 * Vive en su propio archivo y no dentro de la pantalla porque una pantalla de
 * Next sólo puede exportar la pantalla misma; exportar otra cosa desde ahí rompe
 * la compilación y la aplicación deja de poder publicarse.
 */

/** Marcador de posición que se usa en los contratos cuando el salón no está definido. */
const SALON_SIN_DEFINIR = '___________________';

function primero(...valores: (string | undefined)[]): string {
  return valores.find((valor) => Boolean(valor && valor.trim()))?.trim() ?? '';
}

export function getDatosMinimosFaltantesInvitacion(
  fiesta: FiestaEnPlanificacion | null,
  invitacionData: InvitacionDigitalData,
): string[] {
  const detalles = invitacionData?.detallesEvento;
  const celebracion = detalles?.celebracion;
  const ceremonia = detalles?.ceremoniaReligiosa;
  const faltantes: string[] = [];

  const fecha = primero(
    fiesta?.configuracion?.fechaEvento,
    celebracion?.fecha,
    ceremonia?.fecha,
  );
  if (!fecha) faltantes.push('Falta la fecha del evento.');

  const hora = primero(fiesta?.configuracion?.horaInicio, celebracion?.hora, ceremonia?.hora);
  if (!hora) faltantes.push('Falta la hora de inicio.');

  const salon = primero(
    fiesta?.configuracion?.nombreLugar,
    celebracion?.nombreLugar,
    ceremonia?.nombreLugar,
  );
  if (!salon || salon === SALON_SIN_DEFINIR) {
    faltantes.push('Falta el nombre del salón o lugar.');
  }

  const direccion = primero(
    celebracion?.direccionLugar,
    ceremonia?.direccionLugar,
    fiesta?.configuracion?.direccionLugar,
  );
  if (!direccion) {
    faltantes.push('Falta la dirección de la celebración. Sin eso el invitado no sabe adónde ir.');
  }

  return faltantes;
}
