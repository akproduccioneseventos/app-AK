/**
 * EL REPORTE SE MIDE POR DIA DE URUGUAY, NO POR HORA NI POR GREENWICH.
 *
 * **Lo encontro Codex el 16 de septiembre de 2026, y volvio a encontrarlo el 17.** Primero el
 * filtro comparaba la hora exacta: si alguien pedia el reporte "hasta el 30", el "30" llegaba
 * como la medianoche del 30 y **un cobro de ese mismo dia a las diez de la manana quedaba
 * afuera**. El mes cerraba con menos plata de la que entro y nadie se enteraba, porque el
 * numero se ve razonable.
 *
 * El primer arreglo comparo dias y tapo ese caso, **pero dejo abierto el de al lado**: un cobro
 * guardado con hora de Greenwich —`2026-10-01T01:00:00Z`— en Uruguay pasa el **30 de septiembre
 * a las diez de la noche**, y el reporte de septiembre lo seguia dejando afuera. Es la misma
 * plata perdida por el otro extremo del mes.
 *
 * Por eso ahora el dia se calcula **en hora de Uruguay** (tres horas menos que Greenwich, sin
 * horario de verano desde 2015) siempre que el dato traiga zona horaria. Lo que ya viene escrito
 * como dia suelto —`2026-09-30`— o con hora sin zona se respeta tal cual: eso lo escribio alguien
 * aca y convertirlo es justo lo que corria el dia.
 */

/** Uruguay esta fija en tres horas menos que Greenwich. No tiene horario de verano desde 2015. */
const HORAS_DE_DIFERENCIA_CON_GREENWICH = -3;

function diaEnUruguay(fecha: Date): string {
  const corrida = new Date(fecha.getTime() + HORAS_DE_DIFERENCIA_CON_GREENWICH * 60 * 60 * 1000);
  return corrida.toISOString().slice(0, 10);
}

export function diaCalendario(valor: string | Date): string | null {
  if (typeof valor === 'string') {
    const conZona = /(Z|[+-]\d{2}:?\d{2})$/i.test(valor.trim());
    if (!conZona) {
      // Un dia suelto, o una hora escrita sin zona: se escribio en hora de aca.
      const soloDia = valor.match(/^(\d{4}-\d{2}-\d{2})/);
      if (soloDia) return soloDia[1];
    }
  }

  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;

  // Una fecha parseada de un dia suelto cae justo en la medianoche de Greenwich. Ahi el dia que
  // se quiso decir es el de Greenwich: restarle tres horas la mandaria al dia anterior.
  const esMedianocheDeGreenwich =
    fecha.getUTCHours() === 0
    && fecha.getUTCMinutes() === 0
    && fecha.getUTCSeconds() === 0
    && fecha.getUTCMilliseconds() === 0;
  if (esMedianocheDeGreenwich) return fecha.toISOString().slice(0, 10);

  return diaEnUruguay(fecha);
}

export function inRange(dateValue: string | undefined, from: Date, to: Date): boolean {
  if (!dateValue) return false;
  const dia = diaCalendario(dateValue);
  const desde = diaCalendario(from);
  const hasta = diaCalendario(to);
  if (!dia || !desde || !hasta) return false;
  return dia >= desde && dia <= hasta;
}
