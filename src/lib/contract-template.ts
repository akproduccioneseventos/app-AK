/**
 * AK Producciones Eventos - Legal Contract Template (Revisado 30/09/2026)
 *
 * Template variables (replaced at render time):
 *   {{CIUDAD_FECHA}}       - e.g. "Salto, a los 23/12/2025"
 *   {{FECHA_FIRMA_TEXTO}}  - e.g. "a los 1 de enero de 2026"
 *   {{CLIENTE_NOMBRE}}     - e.g. "Virginia Soledad Reina Luzardo"
 *   {{CLIENTE_DOMICILIO}}  - e.g. "Atahualpa Nro. 1301"
 *   {{CLIENTE_CI}}         - e.g. "4.728.038-6"
 *   {{CLIENTE_TELEFONO}}   - e.g. "092908638"
 *   {{FECHA_EVENTO}}       - e.g. "05/09/2026"
 *   {{SALON}}              - e.g. "salón Adeom"
 *   {{MONTO_SENA}}         - e.g. "$ 20.000 (pesos uruguayos veinte mil)"
 *   {{HITO_30}}            - e.g. "1 de mayo de 2026"
 *   {{HITO_50}}            - e.g. "1 de julio de 2026"
 *   {{FECHA_SALDO_TOTAL}}  - e.g. "1 de diciembre de 2026"
 */

import { hoyEnUruguay } from '@/lib/utils';
import type { ContractSettings } from '@/types/settings';

export const CONTRACT_TEMPLATE = `CONTRATO DE PRESTACIÓN DE SERVICIOS PARA EVENTOS

En la ciudad de Salto, República Oriental del Uruguay, {{FECHA_FIRMA_TEXTO}}, comparecen por una parte AK PRODUCCIONES EVENTOS, RUT 220372680019, Nº de Empresa 0000008898364, representada por el Tec. Alexander Knuth, C.I. 4.617.350-8, con domicilio en Gaboto 3390, Salto, Uruguay, en adelante "LA EMPRESA"; y por otra parte {{CLIENTE_NOMBRE}}, C.I. {{CLIENTE_CI}}, con domicilio en {{CLIENTE_DOMICILIO}}, teléfono {{CLIENTE_TELEFONO}}, en adelante "EL/LA CLIENTE". Ambas partes acuerdan celebrar el presente contrato sujeto a las siguientes cláusulas:

CLÁUSULA 1 - OBJETO, DURACIÓN Y SERVICIOS CONTRATADOS: LA EMPRESA brindará a EL/LA CLIENTE el servicio integral para la organización y realización del evento previsto para el {{FECHA_EVENTO}}, en {{SALON}}, con una duración máxima de siete (7) horas desde el inicio del evento. Toda hora extra tendrá un costo fijo de $5.000 (pesos uruguayos cinco mil) por cada hora o fracción y dicho importe no estará sujeto al ajuste anual previsto en este contrato. El costo del salón no se considerará incluido salvo que figure expresamente en el presupuesto vigente. LA EMPRESA únicamente estará obligada a prestar los servicios que figuren expresamente en el presupuesto firmado por EL/LA CLIENTE y aquellos que posteriormente sean solicitados por ésta, aceptados por LA EMPRESA y documentados en presupuesto, factura, adenda o constancia equivalente. Ningún servicio, elemento o prestación que no figure documentado podrá considerarse incluido ni exigirse posteriormente. Los servicios adicionales estarán sujetos a disponibilidad y al precio informado por LA EMPRESA.

CLÁUSULA 2 - PRESUPUESTO VIGENTE, PRECIOS Y AJUSTE ANUAL: a) El presupuesto vigente estará integrado por el presupuesto original firmado, las modificaciones, agregados o reducciones válidamente documentadas y los ajustes anuales que correspondan. b) El ajuste anual será del quince por ciento (15%) y se aplicará cada 1º de enero cuando el evento se realice en un año posterior al de la contratación. Será acumulativo y progresivo, calculándose cada nuevo ajuste sobre el importe ya ajustado del año anterior. c) Servicios ya contratados: si EL/LA CLIENTE aumenta invitados, unidades o cantidades de un servicio que ya integraba el presupuesto original, se mantendrá como base el precio unitario efectivamente contratado, incluyendo promociones o descuentos originales, y sobre dicho valor se aplicarán los ajustes anuales que correspondan. d) Servicios nuevos: todo servicio no incluido originalmente y agregado con posterioridad se cotizará al precio vigente al momento de su incorporación. Los ajustes anuales de ese servicio se aplicarán únicamente desde su incorporación, sin ajustes retroactivos por años anteriores. e) Las promociones o descuentos del presupuesto original se mantendrán para aumentos de cantidad del mismo servicio originalmente contratado, pero no se extenderán automáticamente a servicios nuevos agregados posteriormente. f) Todos los importes se expresan en pesos uruguayos (UYU), salvo indicación expresa en contrario, y se entienden comprensivos de los tributos que legalmente correspondan según el régimen aplicable a LA EMPRESA, salvo que el presupuesto indique expresamente otra cosa. g) Sobre el presupuesto vigente se calcularán saldos, cláusulas penales, reintegros, porcentajes mínimos de pago y demás importes previstos en este contrato.

CLÁUSULA 3 - PLAN DE PAGOS, MÍNIMOS Y MORA: a) EL/LA CLIENTE abonará al momento de la firma la seña acordada, que se imputará al precio total y confirmará la reserva de la fecha, sujeta al cumplimiento de las obligaciones previstas en este contrato. b) Desde la fecha de firma y hasta la cancelación total del presupuesto, EL/LA CLIENTE deberá abonar como mínimo $10.000 (pesos uruguayos diez mil) dentro de cada período sucesivo de tres (3) meses contado desde dicha fecha. Podrá realizar uno o varios pagos dentro de cada período y podrá abonar importes superiores en cualquier momento. c) Al cumplirse el primer tercio del tiempo comprendido entre la firma y la fecha del evento deberá encontrarse abonado, como mínimo, el treinta por ciento (30%) del presupuesto vigente. Para este contrato, dicho hito corresponde al {{HITO_30}}. d) Al cumplirse la mitad del tiempo comprendido entre la firma y la fecha del evento deberá encontrarse abonado, como mínimo, el cincuenta por ciento (50%) del presupuesto vigente. Para este contrato, dicho hito corresponde al {{HITO_50}}. e) Una vez alcanzado el 50%, EL/LA CLIENTE podrá continuar realizando entregas parciales hasta completar el saldo, manteniéndose el mínimo de $10.000 por cada período de tres meses. Todos los importes y porcentajes indicados son mínimos; EL/LA CLIENTE podrá adelantar pagos o cancelar anticipadamente cualquier parte del presupuesto. f) La seña y todos los pagos efectuados se computarán para alcanzar los mínimos indicados. La totalidad del presupuesto deberá encontrarse cancelada como máximo treinta (30) días corridos antes del evento; en este contrato, el {{FECHA_SALDO_TOTAL}}. g) El vencimiento de cualquiera de los mínimos u obligaciones de pago colocará a EL/LA CLIENTE en mora de pleno derecho, sin necesidad de interpelación previa. No obstante, antes de resolver el contrato por falta de pago, LA EMPRESA intimará a EL/LA CLIENTE para que regularice dentro de quince (15) días corridos. Si no regulariza, LA EMPRESA podrá resolver el contrato y aplicar la cláusula penal que corresponda. No se establece recargo automático por mora, sin perjuicio de los gastos o consecuencias que legalmente pudieran corresponder.

CLÁUSULA 4 - CAMBIO DE FECHA, CANCELACIÓN Y CLÁUSULA PENAL: a) Todo cambio de fecha deberá solicitarse con al menos treinta (30) días corridos de anticipación y quedará sujeto a disponibilidad de LA EMPRESA. b) Cada cambio de fecha tendrá una cláusula penal equivalente al diez por ciento (10%) del presupuesto vigente, pagadera al confirmar la nueva fecha. Si la nueva fecha corresponde a otro año, se aplicarán además los ajustes anuales correspondientes. La penalidad del 10% no se aplicará cuando la reprogramación se origine en un caso de fuerza mayor o caso fortuito debidamente acreditado y aceptado conforme a la cláusula correspondiente. c) Si EL/LA CLIENTE cancela total o parcialmente el evento, o elimina servicios ya contratados fuera de los supuestos de reducción de invitados permitidos por este contrato, deberá abonar una cláusula penal equivalente al treinta por ciento (30%) del presupuesto vigente al momento de la cancelación. En una cancelación parcial, el 30% se calculará sobre el valor de los servicios eliminados o reducidos. d) La seña y los pagos efectuados se imputarán a la cláusula penal. Si lo abonado excediera el importe que corresponda, LA EMPRESA reintegrará la diferencia que corresponda dentro de treinta (30) días corridos contados desde que quede determinado el importe definitivo a devolver. e) Si la cláusula penal quedara impaga, LA EMPRESA podrá intimar por medio fehaciente otorgando quince (15) días corridos para regularizar y, vencido dicho plazo, ejercer las acciones que correspondan.

CLÁUSULA 5 - CANTIDAD DE INVITADOS, LISTA FINAL Y MENÚES: a) La cantidad de invitados contratada podrá modificarse hasta quince (15) días corridos antes del evento. Hasta ese plazo, EL/LA CLIENTE podrá reducir como máximo un diez por ciento (10%) de la última cantidad contratada y documentada. La reducción afectará únicamente los conceptos presupuestados por persona; no corresponderá devolución o reducción por costos fijos, personal, estructura, logística, reservas o gastos ya comprometidos. b) Si dentro de ese plazo EL/LA CLIENTE solicita una reducción superior al 10%, el primer 10% se regirá por el literal anterior y la parte que exceda dicho porcentaje se considerará cancelación parcial, aplicándose sobre los servicios por persona eliminados la cláusula penal del treinta por ciento (30%) prevista en la cláusula 4. c) Vencido el plazo de quince (15) días, la última cantidad de invitados contratada quedará establecida como cantidad mínima facturable. Desde ese momento no corresponderá reducción, devolución, descuento ni crédito por personas que no confirmen, desistan o no concurran. Tampoco generará devolución un cambio posterior hacia una categoría de menú de menor valor. d) EL/LA CLIENTE podrá aumentar hasta un veinte por ciento (20%) la cantidad contratada, sujeto a disponibilidad de LA EMPRESA. Todo aumento deberá ser informado con al menos quince (15) días corridos de anticipación y abonado previamente. Los aumentos solicitados fuera de plazo sólo podrán aceptarse si LA EMPRESA confirma expresamente su posibilidad de prestación. El precio de los aumentos se calculará conforme a las reglas previstas para servicios ya contratados en la cláusula 2. e) La lista nominal definitiva deberá entregarse como máximo siete (7) días corridos antes del evento e incluir a todas las personas que concurrirán, sin excepción: persona homenajeada, familiares, acompañantes, niños, adolescentes, adultos y demás participantes. Deberá indicar además la categoría de menú correspondiente a cada persona. f) LA EMPRESA podrá cotejar la lista con la cantidad y categorías contratadas. Si detecta omisiones, diferencias o personas no incluidas, notificará a EL/LA CLIENTE para su regularización y, cuando corresponda, facturará la diferencia antes del evento. Si no se entrega la lista en plazo, se mantendrán como válidas las últimas cantidades y categorías contratadas. g) Si el día del evento concurren personas adicionales o de una categoría de mayor valor que no hayan sido regularizadas, LA EMPRESA podrá limitar la prestación a lo efectivamente contratado o exigir el pago de la diferencia antes de brindar el servicio adicional.

CLÁUSULA 6 - MENÚES ESPECIALES, ALERGIAS, INTOLERANCIAS Y RESTRICCIONES ALIMENTARIAS: a) EL/LA CLIENTE deberá informar durante las reuniones de organización y, en todo caso, como máximo quince (15) días corridos antes del evento, la existencia de invitados con celiaquía, alergias, intolerancias u otras restricciones alimentarias. b) Toda preparación especial deberá ser solicitada, presupuestada y abonada de forma expresa, pudiendo tener un precio diferente al menú común. Las solicitudes fuera del plazo de quince días quedarán sujetas a disponibilidad y posibilidad real de prestación. c) EL/LA CLIENTE declara conocer que el lugar de elaboración y servicio utilizado para el evento no dispone de áreas, equipamiento ni utensilios de uso exclusivo para preparaciones libres de gluten, alérgenos u otras sustancias determinadas. Los espacios de trabajo, utensilios y equipamiento también se utilizan para los restantes menús, por lo que LA EMPRESA no puede garantizar ausencia absoluta de trazas o contacto cruzado. d) Si EL/LA CLIENTE contrata una preparación especial únicamente para una parte del menú, la obligación de LA EMPRESA se limitará a esa prestación expresamente contratada. Los restantes alimentos comunes no se considerarán adaptados ni aptos para la restricción alimentaria informada. e) Si, luego de recibir esta información, EL/LA CLIENTE decide que una persona con restricción alimentaria consuma alimentos del menú común o alimentos no contratados como especiales, dicha decisión será de su responsabilidad, sin perjuicio de la responsabilidad que legalmente pueda corresponder a LA EMPRESA por sus propios actos u omisiones.

CLÁUSULA 7 - ORGANIZACIÓN, PERSONALIZACIÓN, CONFORMIDAD Y PRESTACIÓN: a) La personalización del evento se definirá en una o más reuniones previas entre LA EMPRESA y EL/LA CLIENTE. En dichas reuniones EL/LA CLIENTE decidirá los aspectos personalizables de los servicios contratados dentro de las opciones y posibilidades de cada servicio. b) Las decisiones adoptadas en la coordinación previa constituirán las instrucciones de EL/LA CLIENTE. Al finalizar la coordinación, podrá confeccionarse una Ficha de Coordinación Final que, una vez aceptada por EL/LA CLIENTE, formará parte de la documentación del evento. c) Toda condición que EL/LA CLIENTE considere indispensable deberá quedar expresamente definida durante la coordinación y documentada. Las modificaciones posteriores estarán sujetas a disponibilidad, viabilidad y, cuando corresponda, a costo adicional. d) En servicios que admiten apreciación estética o personal, tales como decoración, comida, fotografía, filmación, música, presentación o ambientación, las diferencias de gusto, preferencia o expectativa subjetiva no constituirán por sí solas incumplimiento si el servicio fue efectivamente prestado y respeta las características objetivamente acordadas. e) Las opiniones o disconformidades de familiares, invitados o terceros no modificarán las condiciones acordadas con EL/LA CLIENTE ni constituirán por sí mismas prueba de incumplimiento. f) Si durante el evento EL/LA CLIENTE advierte una situación susceptible de corrección, deberá comunicarla directamente a LA EMPRESA tan pronto como sea razonablemente posible, a efectos de procurar su solución durante el desarrollo del evento. g) Si por una causa directamente imputable a LA EMPRESA no se prestara en forma total uno o más servicios expresamente contratados y abonados, y no se acordara con EL/LA CLIENTE una sustitución equivalente, cumplimiento posterior cuando fuera posible o reprogramación, LA EMPRESA reintegrará dentro de treinta (30) días corridos los importes efectivamente abonados que correspondan a los servicios no prestados. Si la imposibilidad imputable a LA EMPRESA alcanzara a la totalidad del evento y no se acordara reprogramación, el reintegro comprenderá los importes abonados correspondientes a las prestaciones no realizadas, sin perjuicio de los derechos que legalmente correspondan a EL/LA CLIENTE. Lo previsto en este literal no convierte una diferencia subjetiva de gusto o expectativa en falta de prestación.

CLÁUSULA 8 - INTERLOCUCIÓN, PAGOS DE TERCEROS Y MODIFICACIONES: a) Este contrato es personal e intransferible. EL/LA CLIENTE firmante será la única interlocutora autorizada para impartir instrucciones, solicitar cambios, aprobar decisiones y formular observaciones vinculadas con la organización y ejecución del evento, salvo autorización escrita en favor de otra persona. b) Las solicitudes u opiniones de familiares, invitados o terceros no obligarán a LA EMPRESA si no son confirmadas por EL/LA CLIENTE. c) LA EMPRESA podrá recibir pagos efectuados por terceros, pero ello no modifica la identidad ni las obligaciones de EL/LA CLIENTE. Los recibos y comprobantes se emitirán a nombre de EL/LA CLIENTE. LA EMPRESA no responderá por préstamos, acuerdos o conflictos económicos entre EL/LA CLIENTE y terceros. d) El WhatsApp y demás medios de contacto declarados podrán utilizarse para coordinación operativa y pedidos. Todo cambio que afecte precios, cantidades o servicios deberá quedar posteriormente documentado en presupuesto, factura, adenda, ficha de coordinación u otra constancia aceptada por EL/LA CLIENTE.

CLÁUSULA 9 - PERSONAL Y SERVICIOS EXTERNOS: Si EL/LA CLIENTE contrata por su cuenta fotógrafos, maquilladores, shows, animadores, músicos u otros prestadores ajenos a LA EMPRESA, deberá informarlo con anticipación. La comida, bebida o atención de esas personas no se encuentra incluida salvo que haya sido solicitada, agregada al presupuesto y abonada previamente.

CLÁUSULA 10 - MENORES, DAÑOS Y RESPONSABILIDAD: a) LA EMPRESA no asume funciones de guarda, custodia, vigilancia o control de menores o adolescentes asistentes. Dicha responsabilidad corresponde a sus padres, madres, tutores, responsables legales o adultos designados. b) LA EMPRESA no responderá por conductas, salidas, conflictos o hechos de invitados o terceros que no le sean legalmente atribuibles, sin perjuicio de la responsabilidad que corresponda por sus propios actos u omisiones. c) EL/LA CLIENTE será responsable por los daños causados por ella, sus invitados o terceros vinculados al evento a instalaciones, mobiliario, decoración, vajilla, sonido, iluminación, barra, utilería u otros elementos provistos por LA EMPRESA. El importe deberá abonarse dentro de quince (15) días corridos desde su notificación. d) LA EMPRESA no responderá por pérdidas, hurtos, conflictos entre asistentes, problemas del local, cortes de servicios, fenómenos climáticos u otras circunstancias ajenas a su control, salvo en aquello que legalmente le sea imputable.

CLÁUSULA 11 - ELEMENTOS PROVISTOS Y SOBRANTES: a) Los elementos utilizados para decoración, discoteca, barra de tragos, iluminación, mobiliario, vajilla, mantelería, estructuras, utilería y demás materiales de trabajo pertenecen a LA EMPRESA o a sus proveedores y no podrán ser retirados, retenidos ni apropiados por EL/LA CLIENTE o sus invitados. b) Al finalizar el evento, EL/LA CLIENTE podrá retirar la comida sobrante, tortas y postres, refrescos y bebidas alcohólicas que hayan sido aportadas por EL/LA CLIENTE o facturadas específicamente por LA EMPRESA, siempre que se encuentren disponibles y en condiciones de entrega. c) No se entregarán sobrantes, insumos ni elementos correspondientes al servicio de barra de tragos de canilla libre, ni elementos pertenecientes a los servicios de discoteca, decoración, iluminación, mobiliario, vajilla, mantelería u otros materiales de trabajo. d) Una vez entregados los alimentos o bebidas sobrantes, su traslado, conservación y consumo quedarán bajo responsabilidad de EL/LA CLIENTE.

CLÁUSULA 12 - USO DE IMAGEN: La autorización de imagen es independiente de la contratación de los servicios y su aceptación o rechazo no modifica el precio ni las prestaciones contratadas. EL/LA CLIENTE podrá autorizar a LA EMPRESA a utilizar su propia imagen y, cuando corresponda legalmente, la imagen de menores respecto de los cuales ejerza representación, en fotografías o fragmentos audiovisuales del evento con fines promocionales en redes sociales, sitio web y material publicitario. Para el uso promocional de imágenes identificables de otros menores, LA EMPRESA deberá contar con la autorización de sus padres, madres, tutores o representantes legales cuando corresponda. Esta autorización no sustituye los consentimientos que legalmente deban obtenerse de terceros. EL/LA CLIENTE deberá marcar una opción: [ ] AUTORIZO [ ] NO AUTORIZO. Iniciales o firma de EL/LA CLIENTE: ________________________________.

CLÁUSULA 13 - FUERZA MAYOR O CASO FORTUITO: a) Se considerarán fuerza mayor o caso fortuito los hechos extraordinarios, imprevisibles o inevitables, ajenos a la voluntad de las partes, que hagan realmente imposible la realización del evento y puedan ser acreditados. b) Podrán comprender, entre otros, desastres naturales, incendios, inundaciones, fenómenos climáticos graves, medidas de autoridad que impidan el evento, disturbios graves, fallecimiento de EL/LA CLIENTE o de la persona homenajeada, o enfermedad grave debidamente documentada. c) No constituirán fuerza mayor los problemas económicos, malestares pasajeros, enfermedades leves, conflictos familiares, separaciones, arrepentimientos, cambios de opinión, falta de organización o falta de pago. d) Si el hecho configura fuerza mayor y permite reprogramar, las partes procurarán acordar una nueva fecha, sin aplicación de la penalidad del diez por ciento (10%) por cambio de fecha, manteniéndose la vigencia económica del contrato con los ajustes que correspondan. Si la reprogramación resultara imposible, se liquidarán las prestaciones efectivamente cumplidas y los gastos no recuperables debidamente comprometidos, reintegrándose en su caso el saldo que corresponda dentro de treinta (30) días corridos desde que quede determinado el importe definitivo.

CLÁUSULA 14 - AGADU: Los pagos, permisos, declaraciones y trámites vinculados a AGADU serán responsabilidad de EL/LA CLIENTE, salvo que expresamente se encuentren incluidos como servicio en el presupuesto vigente. LA EMPRESA no asumirá multas, recargos o sanciones originados en obligaciones que correspondan a EL/LA CLIENTE.

CLÁUSULA 15 - NOTIFICACIONES Y DOMICILIOS: Serán válidos los domicilios y datos de contacto declarados en este contrato. Las comunicaciones operativas podrán efectuarse por WhatsApp u otros medios habituales. Las intimaciones formales podrán realizarse por telegrama colacionado, carta documento, acta notarial u otro medio fehaciente. EL/LA CLIENTE deberá comunicar formalmente cualquier cambio de domicilio o teléfono.

CLÁUSULA 16 - JURISDICCIÓN: Para toda controversia se aplicará la normativa uruguaya y serán competentes los tribunales que correspondan conforme a las normas imperativas vigentes. En aquellas materias en que la elección territorial resulte legalmente admisible, las partes acuerdan la competencia de los tribunales de Salto.

CLÁUSULA 17 - ACEPTACIÓN FINAL: EL/LA CLIENTE declara haber leído y comprendido el presente contrato, el presupuesto vigente y las condiciones aquí establecidas, aceptándolos en todos sus términos. Se firman dos ejemplares del mismo tenor en el lugar y fecha indicados.

______________________________

POR AK PRODUCCIONES EVENTOS

Tec. Alexander Knuth

C.I. 4.617.350-8

______________________________

EL/LA CLIENTE

{{CLIENTE_NOMBRE}}

C.I. {{CLIENTE_CI}}`;

const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'
];

function formatDateTexto(d: Date): string {
  return `${d.getDate()} de ${MESES_ES[d.getMonth()]} de ${d.getFullYear()}`;
}

function parseDateUruguay(dStr?: string): Date | null {
  if (!dStr) return null;
  const trimmed = dStr.trim();
  // Busca formato YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]), 12, 0, 0);
  }
  // Busca formato DD/MM/YYYY
  const slashMatch = trimmed.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    return new Date(Number(slashMatch[3]), Number(slashMatch[2]) - 1, Number(slashMatch[1]), 12, 0, 0);
  }
  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export interface ContractVarsInput {
  ciudadFecha?: string;
  fechaFirma?: string;
  fechaFirmaTexto?: string;
  clienteNombre?: string;
  clienteDomicilio?: string;
  clienteCi?: string;
  clienteTelefono?: string;
  clienteTratamiento?: 'Sr.' | 'Sra.';
  fechaEvento?: string;
  salon?: string;
  montoSena?: string;
  hito30?: string;
  hito50?: string;
  fechaSaldoTotal?: string;
}

/**
 * Llena la plantilla de contrato calculando hitos de pago, fechas uruguayas
 * y datos del cliente y del evento sin dejar marcadores sin reemplazar.
 */
export function fillContractTemplate(vars: ContractVarsInput): string {
  return replaceContractPlaceholders(CONTRACT_TEMPLATE, vars);
}

export function replaceContractPlaceholders(text: string, vars: ContractVarsInput): string {
  // 1. Determinar fecha de firma
  const hoyStr = hoyEnUruguay();
  const firmaDate = parseDateUruguay(vars.fechaFirma) || parseDateUruguay(vars.ciudadFecha) || parseDateUruguay(hoyStr) || new Date();
  const fechaFirmaFormateada = formatDateTexto(firmaDate);
  const fechaFirmaTextoFinal = vars.fechaFirmaTexto ?? `a los ${fechaFirmaFormateada}`;

  // 2. Determinar fecha del evento e hitos
  const eventoDate = parseDateUruguay(vars.fechaEvento);
  let hito30 = vars.hito30;
  let hito50 = vars.hito50;
  let fechaSaldoTotal = vars.fechaSaldoTotal;

  if (eventoDate && firmaDate) {
    const diffDias = Math.round((eventoDate.getTime() - firmaDate.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDias > 0) {
      if (!hito30) {
        const dias30 = Math.floor(diffDias / 3);
        const d30 = new Date(firmaDate.getFullYear(), firmaDate.getMonth(), firmaDate.getDate() + dias30, 12, 0, 0);
        hito30 = formatDateTexto(d30);
      }
      if (!hito50) {
        const dias50 = Math.floor(diffDias / 2);
        const d50 = new Date(firmaDate.getFullYear(), firmaDate.getMonth(), firmaDate.getDate() + dias50, 12, 0, 0);
        hito50 = formatDateTexto(d50);
      }
    }
    if (!fechaSaldoTotal) {
      const dSaldo = new Date(eventoDate.getFullYear(), eventoDate.getMonth(), eventoDate.getDate() - 30, 12, 0, 0);
      fechaSaldoTotal = formatDateTexto(dSaldo);
    }
  }

  // Fallbacks si no hubo fecha de evento válida
  hito30 = hito30 ?? 'al primer tercio del plazo';
  hito50 = hito50 ?? 'a la mitad del plazo';
  fechaSaldoTotal = fechaSaldoTotal ?? '30 días antes del evento';

  const senaFinal = vars.montoSena ?? 'la seña acordada';
  const nombreCliente = vars.clienteNombre ?? '___________________';
  const domicilioCliente = vars.clienteDomicilio ?? '___________________';
  const ciCliente = vars.clienteCi ?? '___________________';
  const telCliente = vars.clienteTelefono ?? '___________________';
  const salonFinal = vars.salon ?? 'salón a convenir';
  const fechaEventoFinal = vars.fechaEvento ? (eventoDate ? formatDateTexto(eventoDate) : vars.fechaEvento) : 'fecha a coordinar';

  const tratamiento = vars.clienteTratamiento;
  let rolCliente = 'EL/LA CLIENTE';
  let tratamientoTexto = '';
  let pronombreCliente = 'ésta';
  if (tratamiento === 'Sra.') {
    rolCliente = 'LA CLIENTE';
    tratamientoTexto = 'la Sra. ';
    pronombreCliente = 'ésta';
  } else if (tratamiento === 'Sr.') {
    rolCliente = 'EL CLIENTE';
    tratamientoTexto = 'el Sr. ';
    pronombreCliente = 'éste';
  }

  let processed = text
    .replace(/por otra parte \{\{CLIENTE_NOMBRE\}\}/g, `por otra parte ${tratamientoTexto}${nombreCliente}`)
    .replace(/\{\{FECHA_FIRMA_TEXTO\}\}/g, fechaFirmaTextoFinal)
    .replace(/\{\{CIUDAD_FECHA\}\}/g, vars.ciudadFecha ?? `Salto, ${fechaFirmaTextoFinal}`)
    .replace(/\{\{FECHA_HOY\}\}/g, fechaFirmaFormateada)
    .replace(/\{\{CLIENTE_TRATAMIENTO_TEXTO\}\}/g, tratamientoTexto)
    .replace(/\{\{CLIENTE_ROL_TEXTO\}\}/g, rolCliente)
    .replace(/\{\{CLIENTE_PRONOMBRE_TEXTO\}\}/g, pronombreCliente)
    .replace(/\{\{CLIENTE_NOMBRE\}\}/g, nombreCliente)
    .replace(/\{\{CLIENTE_DOMICILIO\}\}/g, domicilioCliente)
    .replace(/\{\{CLIENTE_DIRECCION\}\}/g, domicilioCliente)
    .replace(/\{\{CLIENTE_CI\}\}/g, ciCliente)
    .replace(/\{\{CLIENTE_TELEFONO\}\}/g, telCliente)
    .replace(/\{\{FECHA_EVENTO\}\}/g, fechaEventoFinal)
    .replace(/\{\{EVENTO_FECHA\}\}/g, fechaEventoFinal)
    .replace(/\{\{SALON\}\}/g, salonFinal)
    .replace(/\{\{EVENTO_SALON\}\}/g, salonFinal)
    .replace(/\{\{MONTO_SENA\}\}/g, senaFinal)
    .replace(/\{\{SENIA\}\}/g, senaFinal)
    .replace(/\{\{HITO_30\}\}/g, hito30)
    .replace(/\{\{HITO_50\}\}/g, hito50)
    .replace(/\{\{FECHA_SALDO_TOTAL\}\}/g, fechaSaldoTotal)
    // Limpieza de cualquier marcador restante tipo {{...}} para asegurar contrato limpio
    .replace(/\{\{[A-Z0-9_]+\}\}/g, '___________________');

  if (rolCliente !== 'EL/LA CLIENTE') {
    processed = processed.replace(/EL\/LA CLIENTE/g, rolCliente);
    if (tratamiento === 'Sr.') {
      processed = processed
        .replace(/solicitados por ésta/g, 'solicitados por éste')
        .replace(/causados por ella/g, 'causados por él');
    }
  }

  return processed;
}

export function buildContractFromSettings(
  settings: ContractSettings,
  vars: ContractVarsInput
): { title: string; intro: string; clauses: { title: string; content: string }[]; signerName: string; signerRole: string } {
  const intro = replaceContractPlaceholders(settings.headerText, vars);
  const clauses = (settings.clauses || [])
    .filter(c => c.isActive)
    .sort((a, b) => a.order - b.order)
    .map(c => ({
      title: replaceContractPlaceholders(c.title, vars),
      content: replaceContractPlaceholders(c.content, vars),
    }));

  return {
    title: 'CONTRATO DE PRESTACIÓN DE SERVICIOS PARA EVENTOS',
    intro,
    clauses,
    signerName: settings.companySignerName,
    signerRole: settings.companySignerRole,
  };
}
