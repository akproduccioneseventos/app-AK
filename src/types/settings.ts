export interface PromotionalDiscount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
}

export interface BudgetDisplaySettings {
  showClientData: boolean;
  showEventTypeAndDate: boolean;
  showPaymentMethodNotes: boolean;
  showCompanyLogo: boolean;
  showPriceBreakdown: boolean;
  showIndividualPrices: boolean; // Toggle to show/hide individual service prices in budget
  annualAdjustmentPercentage?: number;
  promotionalDiscounts?: PromotionalDiscount[];
  // Campos Estratégicos de Venta
  successMessage?: string; // El mensaje persuasivo después de "Presupuesto Listo"
  bookingTerms?: string; // El texto de la seña/reserva
  whatsappMessageTemplate?: string; // Lo que se envía por WA
  valuePropositions?: string[]; // Beneficios tipo "Por qué elegirnos"
}

export const defaultBudgetDisplaySettings: BudgetDisplaySettings = {
  showClientData: true,
  showEventTypeAndDate: true,
  showPaymentMethodNotes: true,
  showCompanyLogo: true,
  showPriceBreakdown: true,
  showIndividualPrices: true,
  annualAdjustmentPercentage: 15,
  promotionalDiscounts: [],
  successMessage: "Ahora podés coordinar una reunión con nuestro equipo para revisar todos los detalles, despejar dudas y asegurar tu fecha.",
  bookingTerms: "Para confirmar la promoción y reservar todos los servicios, se requiere una seña de $5.000. El presupuesto es válido por 30 días.",
  whatsappMessageTemplate: "Hola, ya generé un presupuesto para mi evento y me gustaría coordinar una reunión para revisar detalles, despejar dudas y confirmar disponibilidad.",
  valuePropositions: [
    "Equipamiento profesional de alta gama",
    "Personal capacitado y con amplia experiencia",
    "Flexibilidad absoluta en la planificación",
    "Garantía de satisfacción y puntualidad"
  ]
};

export interface InvoiceTemplateSettings {
  logoUrl?: string | null;
  primaryColor: string;
  accentColor: string;
  logoPosition: 'left' | 'center' | 'right';
}

export const defaultInvoiceTemplateSettings: InvoiceTemplateSettings = {
  logoUrl: "https://placehold.co/150x60.png?text=Mi+Logo",
  primaryColor: "#EF4444",
  accentColor: "#F97316",
  logoPosition: 'left',
};

import type { WhatsAppAutomationRule } from './whatsapp-automation';

export interface WhatsAppSettings {
  enabled: boolean;
  sendingMode: 'automatic' | 'manual';
  reminderMessageTemplate: string;
  paymentReminderTemplate: string;
  automationRules?: WhatsAppAutomationRule[];
}

export const defaultWhatsAppSettings: WhatsAppSettings = {
  enabled: true,
  sendingMode: 'manual',
  reminderMessageTemplate: 'Hola {{NOMBRE}}, te recordamos que tienes una reunión con *AK Producciones* el {{FECHA}} a las {{HORA}} hs. ¡Te esperamos!',
  paymentReminderTemplate: 'Hola {{NOMBRE}}, te recordamos que tienes un saldo pendiente de *{{SALDO}}* para tu evento del {{FECHA_EVENTO}}. Podés ver el detalle completo en: {{LINK}}',
};

export interface WhatsAppTemplates {
  budgetShareTemplate: string;
  contractShareTemplate: string;
  welcomeTemplate: string;
  eventConfirmationTemplate: string;
}

export const defaultWhatsAppTemplates: WhatsAppTemplates = {
  budgetShareTemplate: 'Hola {{NOMBRE}}, te comparto el presupuesto para tu evento del {{FECHA_EVENTO}}. Podés verlo aquí: {{LINK}}',
  contractShareTemplate: 'Hola {{NOMBRE}}, te enviamos el contrato para tu evento del {{FECHA_EVENTO}} para que lo puedas revisar: {{LINK}}',
  welcomeTemplate: 'Hola {{NOMBRE}}, gracias por contactarte con *AK Producciones Eventos*. Estamos listos para hacer de tu evento una experiencia única. ¿En qué podemos ayudarte?',
  eventConfirmationTemplate: 'Hola {{NOMBRE}}, te confirmamos la reserva de tu evento para el {{FECHA_EVENTO}} en {{SALON}}. ¡Muchas gracias por elegirnos!',
};

export type SocialPlatformName = 'Facebook' | 'Instagram' | 'TikTok' | 'WhatsApp';

export interface SocialConnection {
  platform: SocialPlatformName;
  isConnected: boolean;
  username?: string;
  profileUrl?: string;
  logoUrl?: string;
  connectedAt?: string;
  phoneNumber?: string;
}

export interface CompanyInfo {
    companyName: string;
    companyAddress: string;
    companyTaxId: string;
    companyContact: string;
    defaultDocumentNotes: string;
    invoiceCustomFooter: string;
    signatureUrl?: string | null;
}

export interface ContractClause {
  id: string;
  order: number;
  title: string;
  content: string;
  isActive: boolean;
}

export interface ContractSettings {
  clauses: ContractClause[];
  headerText: string;
  footerText: string;
  companySignerName: string;
  companySignerRole: string;
}

export const defaultContractSettings: ContractSettings = {
  headerText: 'En la ciudad de {{CIUDAD_FECHA}}, comparecen por una parte AK PRODUCCIONES EVENTOS, RUT: 220372680019, Nº de Empresa: 0000008898364, representado en este acto por el Tec. Alexander Knuth, C.I. 46173508, con domicilio en Gaboto 3390, Salto, Uruguay, correo electrónico akproduccionessalto@gmail.com, en adelante el "PRESTADOR DEL SERVICIO". Por otra parte, la Sra. {{CLIENTE_NOMBRE}}, con domicilio en {{CLIENTE_DOMICILIO}}, cédula de identidad N° {{CLIENTE_CI}}, número de contacto {{CLIENTE_TELEFONO}}, en adelante el "CLIENTE". Ambas partes acuerdan celebrar el presente contrato, sujeto a los términos y condiciones que se establecen a continuación:',
  footerText: '',
  companySignerName: 'Tec. Alexander Knuth',
  companySignerRole: 'POR AK PRODUCCIONES EVENTOS',
  clauses: [
    {
      id: 'c1', order: 1, isActive: true,
      title: 'PRIMERA: OBJETO',
      content: 'El presente contrato tiene por objeto la prestación de servicios para la organización y realización de una fiesta o evento en la fecha {{FECHA_EVENTO}}, con una duración aproximada de siete (7) horas desde el inicio del evento como máximo, cobrándose un monto de cinco mil pesos por cada hora extra, conforme a las condiciones establecidas en el presupuesto adjunto, el cual forma parte integral del presente contrato. La prestación de los servicios se llevará a cabo en el {{SALON}}, cuyo costo será asumido exclusivamente por el CLIENTE.',
    },
    {
      id: 'c2', order: 2, isActive: true,
      title: 'SEGUNDA: FORMA DE PAGO',
      content: 'El CLIENTE abonará el precio total estipulado en el presupuesto adjunto conforme a las siguientes modalidades: a) Seña inicial: al momento de la firma del contrato, el CLIENTE abonará la suma de {{MONTO_SENA}}, la cual se imputará al precio total del servicio contratado. En caso de cancelación, dicha suma se considerará parte integrante de la multa prevista en la cláusula de cancelación y no será reintegrada. b) Pagos parciales: luego de la seña inicial, el CLIENTE podrá realizar pagos parciales en los montos y fechas que disponga, los cuales serán imputados al precio total del servicio. c) Saldo final: el saldo pendiente deberá estar totalmente cancelado con una antelación mínima de treinta (30) días corridos a la fecha del evento. El pago podrá realizarse en efectivo, transferencia bancaria a la cuenta designada por el PRESTADOR, o cualquier otro medio válido, entregándose siempre el comprobante correspondiente. El incumplimiento en la cancelación total en el plazo establecido facultará al PRESTADOR a rescindir el contrato, pudiendo exigir al CLIENTE el pago de una multa equivalente al treinta por ciento (30%) del presupuesto total.',
    },
    {
      id: 'c3', order: 3, isActive: true,
      title: 'TERCERA: CAMBIO DE FECHA',
      content: 'Si por razones de fuerza mayor o decisión de EL CLIENTE, este debiera solicitar un cambio de fecha, deberá comunicarlo con una antelación mínima de 30 (treinta) días a la fecha establecida para el evento. El cambio quedará sujeto a la disponibilidad del PRESTADOR DEL SERVICIO. Cada cambio de fecha solicitado por EL CLIENTE implicará el pago de una multa equivalente al 10% (diez por ciento) del presupuesto total contratado, la cual deberá abonarse al momento de confirmar la nueva fecha. Si el cambio solicitado corresponde pase a otro año, además de la multa indicada, se aplicará un ajuste del 15% (quince por ciento) anual correspondiente sobre el presupuesto. De no cumplirse con la antelación establecida o no encontrarse disponibilidad en la agenda de la empresa para la nueva fecha requerida, se aplicarán las condiciones de cancelación establecidas en la Cláusula Cuarta.',
    },
    {
      id: 'c4', order: 4, isActive: true,
      title: 'CUARTA: CANCELACIÓN',
      content: 'En caso de que EL CLIENTE decida cancelar el evento o desistir de uno o más servicios previamente contratados, sea total o parcialmente, deberá abonar al PRESTADOR DEL SERVICIO una multa equivalente al 30% (treinta por ciento). Cuando la cancelación sea total, la multa se calculará sobre el monto total del presupuesto contratado. Cuando la cancelación sea parcial, ya sea por la eliminación o reducción de uno o más servicios, la multa se calculará sobre el valor correspondiente al o los servicios cancelados o reducidos, tomando como base el presupuesto previamente acordado. Esta penalización tiene por finalidad cubrir los costos de reserva, planificación, logística, tiempo de trabajo y cualquier otro gasto o perjuicio generado por la modificación o cancelación del servicio.',
    },
    {
      id: 'c5', order: 5, isActive: true,
      title: 'QUINTA: AJUSTE ANUAL DE PRECIOS',
      content: 'Si el presente contrato se firma con una anticipación igual o superior a un (1) año respecto a la fecha del evento, se aplicará un ajuste del 15% (quince por ciento) anual, el cual se efectuará automáticamente el 1° de enero de cada año, independientemente de la fecha en que se haya suscrito el contrato. En caso de que la fecha del evento sea de más de un año posterior, se aplicará un ajuste adicional del 15% (quince por ciento) sobre el monto ya ajustado del año anterior, de manera acumulativa.',
    },
    {
      id: 'c6', order: 6, isActive: true,
      title: 'SEXTA: INVITADOS',
      content: 'El costo del evento se basará en el número total de invitados contratados, independientemente de su asistencia. El CLIENTE podrá reducir hasta un 10% (diez por ciento) del número de invitados contratados sin costo adicional, notificando con al menos 7 días de anticipación. Asimismo, podrá aumentar hasta un 20% (veinte por ciento) del número de invitados contratados, sujeto a la disponibilidad de AK PRODUCCIONES EVENTOS, notificando con al menos 15 días de anticipación.',
    },
    {
      id: 'c7', order: 7, isActive: true,
      title: 'SÉPTIMA: PAGO',
      content: 'Al momento de la firma del contrato, el CLIENTE abonará la suma de {{MONTO_SENA}} como seña, recibiendo el comprobante correspondiente. El saldo del precio se abonará conforme al plan de pagos acordado, y una vez cancelado el total, AK PRODUCCIONES EVENTOS emitirá el comprobante correspondiente.',
    },
    {
      id: 'c8', order: 8, isActive: true,
      title: 'OCTAVA – DAÑOS Y ROTURAS',
      content: 'Cualquier daño o rotura ocasionada por el Cliente, sus invitados, o terceros contratados por él, a las instalaciones, mobiliario, decoración, equipamiento o cualquier elemento provisto por el Prestador, será responsabilidad exclusiva del Cliente, quien deberá reintegrar el valor total del daño, previa evaluación, teniendo 7 días corridos para hacerlo después de ser notificado por el servicio.',
    },
    {
      id: 'c9', order: 9, isActive: true,
      title: 'NOVENA – ELEMENTOS PROVISTOS',
      content: 'Todos los elementos utilizados en la decoración, barra de tragos, discoteca, iluminación, mobiliario, utilería y demás servicios contratados son de uso exclusivo para el evento. Queda expresamente prohibido al Cliente o a sus invitados retirarlos, conservarlos o reclamarlos una vez finalizado el evento. Únicamente se entregará al Cliente la comida sobrante del catering, la porción correspondiente de la torta o postres, y la bebida alcohólica y no alcohólica traída por él.',
    },
    {
      id: 'c10', order: 10, isActive: true,
      title: 'DÉCIMA – EXONERACIÓN DE RESPONSABILIDAD',
      content: 'El Prestador no se responsabiliza por accidentes, daños personales, pérdidas u otros perjuicios causados por invitados, terceros o por situaciones fuera de su control. Cualquier incidente ajeno a la ejecución directa del servicio será responsabilidad exclusiva del Cliente.',
    },
    {
      id: 'c11', order: 11, isActive: true,
      title: 'DÉCIMO PRIMERA – USO DE IMAGEN',
      content: 'El Cliente autoriza al Prestador a utilizar fotografías y videos del evento con fines promocionales en redes sociales, sitio web y material publicitario. Si el Cliente no autoriza dicho uso, deberá informarlo por escrito antes del evento.',
    },
    {
      id: 'c12', order: 12, isActive: true,
      title: 'DÉCIMO SEGUNDA – FUERZA MAYOR',
      content: 'El Prestador no será responsable por incumplimientos ocasionados por fuerza mayor, tales como fenómenos naturales, cortes de energía u otras circunstancias fuera de su control. En tales casos, las partes procurarán reprogramar el evento en la primera fecha disponible sin penalización para ninguna de las partes.',
    },
    {
      id: 'c13', order: 13, isActive: true,
      title: 'DÉCIMO TERCERA: PRESUPUESTO Y MODIFICACIONES POSTERIORES',
      content: 'Se adjunta a éste contrato el presupuesto final de los servicios contratados, sus costos individuales y el total a pagar por el cliente, el cual será firmado por ambas partes y las mismas reconocen y aceptan éste presupuesto como el acuerdo final de los servicios y costos. Toda modificación, reducción, agregado o ajuste de los servicios contratados deberá realizarse por escrito y con la firma de ambas partes. No se aceptarán modificaciones informales, ya sea de palabra, por mensajes o cualquier otro medio no formalizado. Cualquier modificación que implique un ajuste económico se documentará en una adenda al presente contrato, donde constarán los cambios y el nuevo valor acordado.',
    },
    {
      id: 'c14', order: 14, isActive: true,
      title: 'DÉCIMO CUARTA: RESPONSABILIDAD DE IMPUESTOS',
      content: 'El cliente asume la totalidad del pago correspondiente a Agadu; el Prestador no asume responsabilidad por el incumplimiento o multa por éste concepto.',
    },
    {
      id: 'c15', order: 15, isActive: true,
      title: 'DÉCIMO QUINTA: JURISDICCIÓN',
      content: 'Para cualquier conflicto derivado del presente contrato, ambas partes acuerdan someterse a la competencia de los Juzgados Letrados de Salto, constituyendo domicilio en los indicados al inicio del documento.',
    },
    {
      id: 'c16', order: 16, isActive: true,
      title: 'DÉCIMO SEXTA: DISPOSICIONES FINALES',
      content: 'Las partes declaran haber leído, comprendido y aceptado todas y cada una de las cláusulas del presente contrato, firmando dos ejemplares de un mismo tenor y a un solo efecto. En señal de conformidad, ambas partes firman el presente contrato.',
    },
  ],
};

export const defaultCompanyInfo: CompanyInfo = {
    companyName: "AK Producciones",
    companyAddress: "Salto, Uruguay",
    companyTaxId: "RUT Ejemplo 123456789012",
    companyContact: "akproduccionessalto@gmail.com",
    defaultDocumentNotes: "El presupuesto es válido por 30 días. Para asegurar el presupuesto debe abonar el 20% del total como seña.",
    invoiceCustomFooter: "Información de pago: Banco X, Cuenta Y, Titular Z.\nConsulte por otros métodos de pago.",
    signatureUrl: null,
};
