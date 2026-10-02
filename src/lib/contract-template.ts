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
 *   {{HITO_30}}            - e.g. "1 de mayo de 2026"
 *   {{HITO_50}}            - e.g. "1 de julio de 2026"
 *   {{FECHA_SALDO_TOTAL}}  - e.g. "1 de diciembre de 2026"
 */

import { hoyEnUruguay } from '@/lib/utils';
import type { ContractSettings } from '@/types/settings';

export const CONTRACT_TEMPLATE = `CONTRATO DE PRESTACIÓN DE SERVICIOS PARA EVENTOS
En la ciudad de Salto, República Oriental del Uruguay, {{FECHA_FIRMA_TEXTO}}, comparecen por una parte AK PRODUCCIONES EVENTOS, RUT 220372680019, Nº de Empresa 0000008898364, representada por el Tec. Alexander Knuth, C.I. 4.617.350-8, con domicilio en Gaboto 3390, Salto, Uruguay, en adelante "LA EMPRESA"; y por otra parte {{CLIENTE_NOMBRE}}, C.I. {{CLIENTE_CI}}, con domicilio en {{CLIENTE_DOMICILIO}}, teléfono {{CLIENTE_TELEFONO}}, en adelante "EL/LA CLIENTE". Ambas partes acuerdan celebrar el presente contrato bajo las siguientes condiciones.--------------------------------------------
CLÁUSULA 1 - SERVICIO CONTRATADO Y DURACIÓN: a) LA EMPRESA organizará y realizará el evento de EL/LA CLIENTE el {{FECHA_EVENTO}}, en {{SALON}}. La duración máxima será de siete (7) horas desde el inicio de la fiesta.
b) Cada hora extra o fracción tendrá un costo fijo de $5.000 (pesos uruguayos cinco mil), sin ajuste anual.
c) El salón sólo estará incluido si figura expresamente en el presupuesto.
d) LA EMPRESA deberá brindar únicamente los servicios que aparezcan en el presupuesto firmado y los que después sean solicitados por EL/LA CLIENTE, aceptados por LA EMPRESA y agregados por escrito en presupuesto, factura, adenda, ficha u otra constancia.
e) Todo servicio que no figure documentado se considerará adicional y no podrá exigirse como incluido. Los servicios agregados estarán sujetos a disponibilidad y deberán abonarse en las condiciones informadas por LA EMPRESA.-------------------------------------
CLÁUSULA 2 - PRESUPUESTO, PRECIOS Y AJUSTE ANUAL: a) El presupuesto vigente será el presupuesto original firmado, más los cambios, agregados o reducciones que hayan quedado documentados y los ajustes anuales que correspondan.
b) El ajuste será del quince por ciento (15%) cada 1º de enero cuando el evento se realice en un año posterior al de la contratación. Será acumulativo, por lo que cada nuevo ajuste se calculará sobre el importe ya ajustado.
c) Si EL/LA CLIENTE aumenta la cantidad de invitados, unidades o cantidades de un servicio que ya estaba contratado, se mantendrá como base el precio unitario originalmente contratado, incluso si tenía promoción o descuento, y luego se aplicarán los ajustes anuales que correspondan.
d) Si EL/LA CLIENTE agrega un servicio que no estaba contratado, se tomará el precio vigente al momento de agregarlo y ese servicio sólo llevará los ajustes anuales que correspondan desde esa fecha en adelante.
e) Las promociones o descuentos originales no se aplicarán automáticamente a servicios nuevos.
f) Todos los importes se expresan en pesos uruguayos y comprenden los tributos que legalmente correspondan, salvo que el presupuesto indique expresamente otra cosa.
g) Sobre el presupuesto vigente se calcularán saldos, penalidades, devoluciones y porcentajes mínimos de pago.----------------------
CLÁUSULA 3 - PLAN DE PAGOS: a) La seña se toma a cuenta del precio total y confirma la reserva de la fecha, siempre que EL/LA CLIENTE cumpla este contrato.
b) Desde la fecha de firma, EL/LA CLIENTE deberá abonar como mínimo $10.000 (pesos uruguayos diez mil) dentro de cada período sucesivo de tres (3) meses. Puede hacer uno o varios pagos dentro de ese período y también puede pagar importes mayores o adelantar pagos cuando quiera.
c) Al cumplirse el primer tercio del tiempo entre la firma y la fiesta deberá tener abonado como mínimo el treinta por ciento (30%) del presupuesto vigente; para este contrato, el {{HITO_30}}.
d) Al cumplirse la mitad de ese tiempo deberá tener abonado como mínimo el cincuenta por ciento (50%); para este contrato, el {{HITO_50}}.
e) Una vez alcanzado el 50%, podrá seguir haciendo entregas parciales, manteniéndose el mínimo de $10.000 cada tres meses. La seña y todos los pagos realizados cuentan para alcanzar esos mínimos.
f) El total del presupuesto deberá estar pago treinta (30) días antes del evento; en este contrato, el {{FECHA_SALDO_TOTAL}}.
g) Si EL/LA CLIENTE no cumple alguno de estos mínimos, LA EMPRESA le notificará la situación y tendrá quince (15) días corridos para ponerse al día. Si no regulariza dentro de ese plazo, LA EMPRESA podrá dar por terminado el contrato y aplicar la penalidad que corresponda.
h) No se establece recargo automático por atraso.------------------------------------------------------------------------------------------------------------
CLÁUSULA 4 - CAMBIO DE FECHA Y CANCELACIÓN: a) Todo cambio de fecha deberá solicitarse con al menos treinta (30) días corridos de anticipación y dependerá de la disponibilidad de LA EMPRESA.
b) Cada cambio de fecha tendrá una penalidad equivalente al diez por ciento (10%) del presupuesto vigente, que deberá abonarse al confirmar la nueva fecha. Si la nueva fecha pasa a otro año, también se aplicarán los ajustes anuales correspondientes.
c) Si LA EMPRESA no dispone de la nueva fecha solicitada, EL/LA CLIENTE podrá mantener la fecha original; si decide no hacerlo, se aplicarán las reglas de cancelación.
d) La penalidad del 10% no se aplicará cuando la reprogramación se deba a un caso de fuerza mayor previsto en este contrato.
e) Si EL/LA CLIENTE cancela todo el evento, la penalidad será del treinta por ciento (30%) del presupuesto vigente.
f) Si elimina sólo una parte de los servicios, el 30% se calculará sobre el valor de los servicios eliminados o reducidos, salvo las reducciones de invitados permitidas expresamente por este contrato.
g) La seña y los pagos realizados se tomarán en cuenta para esa penalidad.
h) Si EL/LA CLIENTE hubiera pagado de más, LA EMPRESA devolverá la diferencia dentro de treinta (30) días corridos desde que quede determinado el importe a devolver.
i) Si quedara una penalidad impaga, LA EMPRESA podrá intimar su pago y otorgar quince (15) días corridos para regularizar antes de iniciar las acciones que correspondan.----------------------------------------------------------------------------------------------------------------------------
CLÁUSULA 5 - INVITADOS, AUMENTOS, REDUCCIONES, MENÚES Y LISTA FINAL: a) La cantidad de invitados podrá modificarse hasta quince (15) días corridos antes de la fiesta.
b) Hasta ese momento EL/LA CLIENTE podrá reducir como máximo un diez por ciento (10%) de la última cantidad contratada y documentada. Esa reducción sólo afectará los servicios cobrados por persona; no se reducirán costos fijos, personal, estructura, logística, reservas ni gastos ya comprometidos.
c) Si dentro de ese plazo EL/LA CLIENTE quiere reducir más del 10%, el primer 10% se tratará como reducción permitida y la parte que exceda ese porcentaje se considerará cancelación parcial, aplicándose sobre esa parte la penalidad del 30%.
d) Pasados los quince (15) días, la última cantidad contratada quedará como cantidad mínima facturable y no habrá devolución, descuento ni crédito porque algunas personas no confirmen, desistan, no concurran o cambien a un menú más barato.
e) Antes del cierre de quince días, si cambia la cantidad entre menú adulto, adolescente, infantil u otra categoría, se ajustará el presupuesto según el valor propio de cada menú. Las categorías tienen precios independientes y no se compensan automáticamente entre sí. Si se pasa a una categoría más cara deberá abonarse la diferencia y, si se pasa a una más económica dentro del plazo, se descontará la diferencia que corresponda.
f) EL/LA CLIENTE podrá aumentar hasta un veinte por ciento (20%) la cantidad de invitados, sujeto a disponibilidad, avisando con al menos quince (15) días de anticipación y pagando previamente la diferencia. Esos aumentos se calcularán con el precio originalmente contratado para el mismo servicio, con sus promociones o descuentos y los ajustes anuales correspondientes. Los aumentos fuera de plazo sólo se aceptarán si LA EMPRESA puede realizarlos.
g) La lista final de nombres deberá entregarse como máximo siete (7) días antes e incluir a todas las personas que concurran, sin excepción: homenajeado, familiares, acompañantes, niños, adolescentes, adultos y demás participantes, indicando el tipo de menú de cada uno.
h) LA EMPRESA podrá revisar que la lista coincida con las cantidades y categorías contratadas. Si encuentra omisiones o diferencias, avisará a EL/LA CLIENTE para corregirlas y, cuando corresponda, facturará la diferencia antes del evento.
i) Si no se entrega la lista en plazo, se tomarán como válidas las últimas cantidades y categorías contratadas.
j) Si el día del evento concurren personas adicionales o personas de una categoría de mayor valor no regularizadas, LA EMPRESA podrá limitar el servicio a lo contratado o exigir el pago de la diferencia antes de brindar el adicional.-----------------------------------------
CLÁUSULA 6 - CELÍACOS, ALERGIAS, INTOLERANCIAS Y MENÚES ESPECIALES: a) EL/LA CLIENTE deberá informar en las reuniones de organización y, como máximo, quince (15) días corridos antes del evento, si existen invitados con celiaquía, alergias, intolerancias u otras restricciones alimentarias.
b) Toda preparación especial deberá pedirse expresamente, presupuestarse y abonarse, y podrá tener un precio diferente al menú común. Los pedidos realizados después de ese plazo quedarán sujetos a disponibilidad y a que LA EMPRESA realmente pueda realizarlos.
c) EL/LA CLIENTE declara saber que el lugar de elaboración y servicio utilizado para la fiesta no cuenta con áreas, equipos ni utensilios exclusivos para preparaciones libres de gluten, alérgenos u otras sustancias determinadas. Los mismos espacios, equipos y utensilios también se utilizan para los demás menús, por lo que LA EMPRESA no puede garantizar ausencia absoluta de trazas o contacto cruzado.
d) Si EL/LA CLIENTE contrata una preparación especial sólo para una parte del menú, por ejemplo la entrada, únicamente esa parte se considerará preparación especial; los demás alimentos comunes no se considerarán adaptados ni aptos para esa restricción.
e) Si, conociendo esta situación, EL/LA CLIENTE decide que una persona con restricción alimentaria consuma alimentos comunes no contratados como especiales, esa decisión será de su responsabilidad.
f) LA EMPRESA será responsable de brindar correctamente la preparación especial que haya sido expresamente contratada.------
CLÁUSULA 7 - ORGANIZACIÓN, PERSONALIZACIÓN Y CONFORMIDAD: a) La fiesta se personalizará en una o más reuniones previas con EL/LA CLIENTE. En esas reuniones EL/LA CLIENTE elegirá y aprobará los detalles de los servicios contratados dentro de las opciones y posibilidades de cada servicio.
b) Lo acordado podrá quedar asentado en una Ficha de Coordinación Final y, una vez aceptada por EL/LA CLIENTE, será la guía para realizar el evento.
c) Todo detalle que EL/LA CLIENTE considere indispensable deberá informarse y quedar acordado antes de la fiesta. Los cambios posteriores dependerán de disponibilidad, viabilidad y podrán tener costo adicional.
d) En decoración, comida, fotografía, filmación, música, presentación, ambientación y otros servicios que también dependen del gusto personal, una diferencia de gusto, preferencia o expectativa no será por sí sola un incumplimiento si el servicio se realizó según lo acordado.
e) Las opiniones de familiares, invitados o terceros tampoco cambian lo acordado con EL/LA CLIENTE ni prueban por sí solas un incumplimiento.
f) Si durante la fiesta EL/LA CLIENTE detecta un problema que pueda corregirse, deberá comunicarlo a LA EMPRESA tan pronto como sea posible para intentar solucionarlo durante el evento.
g) Si por una causa directamente atribuible a LA EMPRESA no se brinda total o parcialmente un servicio expresamente contratado y pagado, primero se buscará una solución, sustitución equivalente, cumplimiento posterior si fuera posible o reprogramación.
h) Si no hubiera solución acordada, LA EMPRESA devolverá dentro de treinta (30) días el importe efectivamente abonado correspondiente al servicio que no se prestó. Si una causa directamente atribuible a LA EMPRESA impidiera realizar todo el evento y no se acordara una nueva fecha, se devolverán los importes abonados correspondientes a las prestaciones no realizadas.----------
CLÁUSULA 8 - RESPONSABLE DEL CONTRATO, TERCEROS Y CAMBIOS: a) Este contrato es personal e intransferible. EL/LA CLIENTE firmante será la única persona responsable frente a LA EMPRESA y la única autorizada para dar instrucciones, pedir cambios, aprobar decisiones o hacer observaciones, salvo que autorice por escrito a otra persona.
b) Lo que pidan familiares, invitados o terceros no obligará a LA EMPRESA si EL/LA CLIENTE no lo confirma. Separaciones, conflictos familiares u otros problemas personales no cambian quién es responsable del contrato.
c) LA EMPRESA puede recibir pagos hechos por terceros, pero eso no transfiere el contrato ni cambia las obligaciones de EL/LA CLIENTE. Los recibos y comprobantes se emitirán a su nombre.
d) LA EMPRESA no será responsable por préstamos, acuerdos o problemas económicos entre EL/LA CLIENTE y otras personas.
e) WhatsApp y otros medios habituales podrán usarse para coordinar y hacer pedidos, pero todo cambio que modifique precios, cantidades o servicios deberá quedar documentado en presupuesto, factura, adenda, ficha de coordinación u otra constancia aceptada por EL/LA CLIENTE.--------------------------------------------------------------------------------------------------------------------------------------------------------
CLÁUSULA 9 - PERSONAL Y SERVICIOS EXTERNOS: a) Si EL/LA CLIENTE contrata por su cuenta fotógrafos, maquilladores, shows, animadores, músicos u otros prestadores que no sean de LA EMPRESA, deberá informarlo con anticipación.
b) La comida, bebida o atención de esas personas no está incluida en el servicio contratado, salvo que EL/LA CLIENTE la solicite expresamente, se agregue al presupuesto y se pague la diferencia correspondiente antes del evento.---------------------------------------
CLÁUSULA 10 - MENORES, DAÑOS Y RESPONSABILIDADES: a) LA EMPRESA no tendrá a su cargo el cuidado, guarda, vigilancia o control de menores y adolescentes. Esa responsabilidad corresponde a sus padres, madres, tutores, responsables legales o adultos designados.
b) LA EMPRESA no responderá por conductas, salidas, conflictos o hechos de invitados o terceros que no dependan de ella.
c) EL/LA CLIENTE será responsable por los daños que ella, sus invitados o terceros vinculados al evento causen al local, instalaciones, mobiliario, decoración, vajilla, sonido, iluminación, barra, utilería u otros elementos utilizados o provistos para la fiesta, y deberá abonarlos dentro de quince (15) días corridos desde que sea notificada.
d) LA EMPRESA no será responsable por pérdidas, hurtos, conflictos entre asistentes, problemas propios del local, cortes de servicios, fenómenos climáticos u otras situaciones fuera de su control, sin perjuicio de la responsabilidad que legalmente corresponda por hechos directamente atribuibles a LA EMPRESA.-------------------------------------------------------------------------------------------------------------
CLÁUSULA 11 - ELEMENTOS DE LA EMPRESA Y SOBRANTES: a) Los elementos utilizados para decoración, discoteca, barra de tragos, iluminación, mobiliario, vajilla, mantelería, estructuras, utilería y demás materiales de trabajo pertenecen a LA EMPRESA o a sus proveedores y no podrán ser retirados, retenidos ni apropiados por EL/LA CLIENTE o sus invitados.
b) Al terminar el evento EL/LA CLIENTE podrá retirar la comida sobrante, tortas, postres, refrescos y bebidas alcohólicas que ella haya llevado o que hayan sido compradas y facturadas específicamente para su evento, siempre que estén disponibles y en condiciones de entrega.
c) No se entregarán sobrantes, insumos ni elementos correspondientes al servicio de barra de tragos de canilla libre, ni elementos pertenecientes a discoteca, decoración, iluminación, mobiliario, vajilla, mantelería u otros materiales de trabajo.
d) Una vez entregados los alimentos o bebidas sobrantes, su traslado, conservación y consumo serán responsabilidad de EL/LA CLIENTE.------------------------------------------------------------------------------------------------------------------------------------------------------------------
CLÁUSULA 12 - USO DE IMAGEN: a) EL/LA CLIENTE podrá autorizar a AK PRODUCCIONES EVENTOS a utilizar fotografías y videos obtenidos durante el evento con fines promocionales y publicitarios en redes sociales, página web y otros medios de difusión de la empresa.
b) Esta autorización no cambia el precio ni los servicios contratados. Marque una opción: [ ] AUTORIZO [ ] NO AUTORIZO.-------
CLÁUSULA 13 - FUERZA MAYOR O CASO FORTUITO: a) Se considerará fuerza mayor o caso fortuito una situación extraordinaria, imprevisible o inevitable, ajena a la voluntad de las partes, que realmente impida hacer el evento y pueda comprobarse. Puede incluir desastres naturales, incendios, inundaciones, fenómenos climáticos graves, medidas de autoridad que impidan el evento, disturbios graves, fallecimiento de EL/LA CLIENTE o de la persona homenajeada, o enfermedad grave debidamente acreditada.
b) No se considerarán fuerza mayor los problemas económicos, malestares pasajeros, enfermedades leves, conflictos familiares, separaciones, arrepentimientos, cambios de opinión, falta de organización o falta de pago.
c) Si existe una verdadera fuerza mayor y se puede reprogramar, las partes buscarán una nueva fecha sin cobrar la penalidad del 10% por cambio de fecha, manteniéndose los ajustes económicos que correspondan.
d) Si no fuera posible reprogramar, se descontarán las prestaciones ya cumplidas y los gastos no recuperables que ya estuvieran debidamente comprometidos, y el saldo que corresponda se devolverá dentro de treinta (30) días corridos desde que quede determinado.--------------------------------------------------------------------------------------------------------------------------------------------------------------
CLÁUSULA 14 - AGADU: a) Los pagos, permisos, declaraciones y trámites relacionados con AGADU serán responsabilidad de EL/LA CLIENTE, salvo que el presupuesto indique expresamente que ese servicio está incluido.
b) LA EMPRESA no asumirá multas, recargos o sanciones originados en obligaciones que correspondan a EL/LA CLIENTE.------------
CLÁUSULA 15 - NOTIFICACIONES Y DATOS DE CONTACTO: a) Serán válidos el domicilio y los datos de contacto indicados en este contrato. Las comunicaciones normales podrán hacerse por WhatsApp u otros medios habituales.
b) Las intimaciones formales podrán realizarse por telegrama colacionado, carta documento, acta notarial u otro medio fehaciente.
c) Si EL/LA CLIENTE cambia de domicilio o número de teléfono deberá comunicarlo formalmente; de lo contrario, seguirán siendo válidos los datos informados en este contrato.----------------------------------------------------------------------------------------------------------------------------
CLÁUSULA 16 - JURISDICCIÓN: a) Este contrato se rige por la normativa uruguaya.
b) En caso de conflicto serán competentes los tribunales que correspondan según las normas vigentes y, cuando la elección territorial sea legalmente posible, las partes acuerdan la competencia de los tribunales de Salto.-----------------------------------------------------------
CLÁUSULA 17 - ACEPTACIÓN: a) EL/LA CLIENTE declara haber leído y comprendido este contrato, el presupuesto vigente y las condiciones aquí establecidas, y acepta sus términos.
b) Se firman dos ejemplares del mismo tenor.------------------------------------------------------------------------------------------------------------------
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
  let fechaEventoFinal = 'fecha a coordinar';
  if (vars.fechaEvento) {
    if (eventoDate) {
      const textoFecha = formatDateTexto(eventoDate);
      const restante = vars.fechaEvento
        .replace(/^\d{4}-\d{2}-\d{2}/, '')
        .replace(/^\d{1,2}\/\d{1,2}\/\d{4}/, '')
        .trim();
      if (restante) {
        const prefijo = /^(a las|desde|de|hs)/i.test(restante) ? '' : 'a las ';
        fechaEventoFinal = `${textoFecha} ${prefijo}${restante}`.trim();
      } else {
        fechaEventoFinal = textoFecha;
      }
    } else {
      fechaEventoFinal = vars.fechaEvento;
    }
  }

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
