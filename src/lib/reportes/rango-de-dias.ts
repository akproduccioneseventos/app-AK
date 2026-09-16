/**
 * EL REPORTE SE MIDE POR DIA, NO POR HORA.
 *
 * **Lo encontro Codex el 16 de septiembre de 2026.** El filtro comparaba la hora exacta:
 * si alguien pedia el reporte "hasta el 30", el "30" llegaba como la medianoche del 30 y
 * **un cobro de ese mismo dia a las diez de la manana quedaba afuera**. El mes cerraba con
 * menos plata de la que entro, y nadie se enteraba porque el numero se ve razonable.
 *
 * Habia un segundo problema escondido, de la misma familia: una fecha guardada como
 * `2026-09-30` sola se entiende como medianoche en horario de Greenwich, que en Uruguay
 * **es el 29 a las nueve de la noche**. Comparando horas, ese cobro se corria de dia.
 *
 * Por eso ahora se compara **el dia calendario**, como lo entiende una persona: se toma el
 * dia del dato y se pregunta si cae entre el dia de inicio y el dia de fin, los dos
 * incluidos.
 */
export function diaCalendario(valor: string | Date): string | null {
  if (typeof valor === 'string') {
    // Lo que ya viene escrito como dia se respeta tal cual: no se convierte a hora,
    // que es justo donde se corria de dia.
    const soloDia = valor.match(/^(\d{4}-\d{2}-\d{2})/);
    if (soloDia) return soloDia[1];
  }
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function inRange(dateValue: string | undefined, from: Date, to: Date): boolean {
  if (!dateValue) return false;
  const dia = diaCalendario(dateValue);
  const desde = diaCalendario(from);
  const hasta = diaCalendario(to);
  if (!dia || !desde || !hasta) return false;
  return dia >= desde && dia <= hasta;
}

