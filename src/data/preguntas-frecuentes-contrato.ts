export interface PreguntaFrecuenteContrato {
  pregunta: string;
  respuesta: string;
}

export const PREGUNTAS_FRECUENTES_DEL_CONTRATO: PreguntaFrecuenteContrato[] = [
  {
    pregunta: "¿Cómo reservo la fecha?",
    respuesta: "Firmando el contrato y abonando la seña acordada: confirma la reserva y se descuenta del total.",
  },
  {
    pregunta: "¿Qué incluye el servicio?",
    respuesta: "Sólo lo que figura en el presupuesto firmado y lo que se agregue después por escrito (presupuesto, factura o adenda). El salón no está incluido salvo que figure en el presupuesto.",
  },
  {
    pregunta: "¿Cuántas horas dura la fiesta?",
    respuesta: "Hasta 7 horas desde el inicio. Cada hora extra o fracción cuesta $5.000, un precio fijo que no lleva el ajuste anual.",
  },
  {
    pregunta: "¿El precio cambia si la fiesta es el año que viene?",
    respuesta: "Sí. Cada 1º de enero se aplica un ajuste del 15% sobre lo que falte, acumulado año a año, si el evento es en un año posterior al de la firma.",
  },
  {
    pregunta: "¿Cómo pago?",
    respuesta: "En cuotas libres: como mínimo $10.000 en cada período de tres meses contado desde la firma; al primer tercio del plazo tiene que estar pago el 30%, a la mitad el 50%, y el total 30 días antes de la fiesta. Podés adelantar cuando quieras.",
  },
  {
    pregunta: "¿Qué pasa si me atraso con un pago?",
    respuesta: "No hay recargo automático. Antes de cualquier medida te avisamos y tenés 15 días para ponerte al día; si no, el contrato se puede dar por terminado y se aplica la cláusula penal.",
  },
  {
    pregunta: "¿Puedo cambiar la fecha?",
    respuesta: "Sí, pidiéndolo con 30 días de anticipación y según disponibilidad. Cada cambio tiene un costo del 10% del presupuesto, salvo que sea por un caso de fuerza mayor.",
  },
  {
    pregunta: "¿Y si cancelo?",
    respuesta: "La cancelación tiene una penalidad del 30% del presupuesto vigente. Lo que ya pagaste se descuenta de eso, y si pagaste de más se te devuelve la diferencia dentro de los 30 días.",
  },
  {
    pregunta: "¿Y si cancelo sólo una parte?",
    respuesta: "Si cancelás o quitás parte del servicio o del presupuesto, la penalidad del 30% se cobra únicamente sobre lo que se saca, sin tocar el resto.",
  },
  {
    pregunta: "¿Puedo cambiar la cantidad de invitados?",
    respuesta: "Hasta 15 días antes: podés bajar hasta un 10% o subir hasta un 20% (según disponibilidad, y el aumento se paga antes). Si querés bajar más del 10%, lo que pase de ese 10% se toma como cancelación parcial (30% sobre esa parte). Después de ese día, la cantidad queda fija.",
  },
  {
    pregunta: "¿Qué pasa si sube la cantidad de invitados o sumo un servicio nuevo?",
    respuesta: "Si sube la cantidad de invitados, se respeta el precio original por persona fijado en el contrato. Un servicio nuevo se cobra al precio de ese momento.",
  },
  {
    pregunta: "¿Puedo cambiar el menú de algunos invitados (adulto, adolescente, infantil)?",
    respuesta: "Sí, podés adaptar el menú para adultos, adolescentes o niños según la edad y preferencia de cada invitado; cada menú tiene su precio.",
  },
  {
    pregunta: "¿Cuándo entrego la lista de invitados?",
    respuesta: "Como máximo 7 días antes, con todos los que van (incluidos niños y adolescentes) y el menú de cada uno.",
  },
  {
    pregunta: "¿Hacen menú sin gluten o para alergias?",
    respuesta: "Sí, avisando en la reunión de organización o hasta 15 días antes; se presupuesta aparte. La cocina no tiene un sector exclusivo, así que no se puede asegurar que no haya trazas.",
  },
  {
    pregunta: "¿Quién decide los detalles de la fiesta?",
    respuesta: "Vos, en las reuniones de organización. Lo que se define ahí queda por escrito. Sólo la persona que firmó puede pedir cambios, salvo que autorice a otra por escrito.",
  },
  {
    pregunta: "¿Qué pasa si paga otra persona?",
    respuesta: "No hay problema con que otra persona transfiera o pague, pero el contrato y los recibos siguen siempre a nombre de la clienta.",
  },
  {
    pregunta: "¿Puedo llevar fotógrafo, show o maquilladora por mi cuenta?",
    respuesta: "Sí, avisando antes. Su comida y bebida no están incluidas salvo que se agreguen al presupuesto.",
  },
  {
    pregunta: "¿Me puedo llevar lo que sobra?",
    respuesta: "Sí, la comida, tortas, postres y bebidas que aportaste o que se facturaron aparte. No lo de la barra libre ni los materiales de trabajo.",
  },
  {
    pregunta: "¿Quién cuida a los niños?",
    respuesta: "Sus padres o los adultos responsables; el equipo no cumple funciones de cuidado.",
  },
  {
    pregunta: "¿Usan las fotos de mi fiesta?",
    respuesta: "Sólo si lo autorizás en el contrato; si no, no cambia nada del precio ni del servicio. Para mostrar a otros menores se pide permiso a sus padres.",
  },
  {
    pregunta: "¿Y AGADU?",
    respuesta: "Corre por cuenta del cliente, salvo que esté incluido en el presupuesto.",
  },
  {
    pregunta: "¿Los precios incluyen impuestos?",
    respuesta: "Sí: todo está en pesos uruguayos e incluye los impuestos que correspondan, salvo que el presupuesto diga otra cosa.",
  },
  {
    pregunta: "¿Y si AK no puede cumplir con algo?",
    respuesta: "Si AK no puede cumplir algo, primero se busca una solución y, si no hay acuerdo, se devuelve lo pagado.",
  },
  {
    pregunta: "¿Qué pasa si hay un imprevisto grave?",
    respuesta: "Si es un caso de fuerza mayor (desastre, orden de la autoridad, fallecimiento o enfermedad grave documentada), se acuerda una fecha nueva sin el costo del 10%, manteniendo el contrato (con el ajuste anual si pasa de año); si no se puede, se liquida lo hecho y los gastos ya comprometidos, y se devuelve el saldo dentro de los 30 días.",
  },
];
