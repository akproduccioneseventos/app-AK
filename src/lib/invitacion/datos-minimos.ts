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

/**
 * Los datos de la boda de ejemplo con la que arranca el editor.
 *
 * El control de abajo miraba sólo que los campos **estuvieran llenos**, no que
 * fueran de verdad. Asi que "Catedral de San Juan, Calle Falsa 123, Ciudad"
 * pasaba sin problema, y una invitación podía salir con la dirección de mentira
 * del ejemplo. El invitado la abría y leía una calle que no existe.
 *
 * Es la quinta vez en este proyecto que un dato de relleno llega a una pantalla
 * que ve un cliente o un invitado. Por eso ahora se frena antes de compartir.
 */
const DATOS_DE_EJEMPLO = [
  'calle falsa',
  'catedral de san juan',
  'salon el paraiso',
  'salón el paraíso',
  'bodajuanymaria',
  'picsum.photos',
  'soundhelix',
  'lorem ipsum',
];

function pareceDeEjemplo(valor: string): boolean {
  const limpio = valor
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return DATOS_DE_EJEMPLO.some((muestra) => limpio.includes(
    muestra.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
  ));
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

  // Que el campo esté lleno no alcanza: puede seguir teniendo el dato del
  // ejemplo con el que arranca el editor.
  const aRevisar: [string, string][] = [
    [salon, 'el nombre del salón'],
    [direccion, 'la dirección'],
    [ceremonia?.nombreLugar ?? '', 'el lugar de la ceremonia'],
    [ceremonia?.direccionLugar ?? '', 'la dirección de la ceremonia'],
  ];
  for (const [valor, queEs] of aRevisar) {
    if (valor && pareceDeEjemplo(valor)) {
      faltantes.push(`Quedó ${queEs} de la invitación de ejemplo ("${valor}"). Cambialo por el de verdad.`);
    }
  }

  // Y una última pasada por TODA la invitación, no campo por campo.
  //
  // El editor arranca de una boda de ejemplo con fotos traídas al azar de
  // internet. Revisar campo por campo obliga a acordarse de cada uno, y siempre
  // falta alguno: acá se mira el contenido entero de una sola vez, así que
  // también entran las fotos, el hashtag y los nombres del ejemplo.
  if (fotosDeEjemplo(invitacionData)) {
    faltantes.push('Quedaron fotos de la invitación de ejemplo. Subí las de la fiesta antes de compartirla.');
  }

  return faltantes;
}

/** Busca fotos de relleno en cualquier parte de la invitación, sin enumerar campos. */
function fotosDeEjemplo(invitacionData: InvitacionDigitalData): boolean {
  try {
    return /picsum\.photos|placeholder\.com|dummyimage/i.test(JSON.stringify(invitacionData ?? {}));
  } catch {
    return false;
  }
}
