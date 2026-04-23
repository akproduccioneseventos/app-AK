import type { CuentaBancaria } from './fiesta';

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
  assistantWelcomeMessage?: string; // Mensaje inicial del asistente AK
  assistantFinalMessage?: string; // Mensaje final del asistente AK
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
  assistantWelcomeMessage: "¡Hola! Soy el Asistente AK 👋",
  assistantFinalMessage: "¿Hablamos? En una sola reunión resolvés todo y tu fiesta queda lista 🚀",
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
    cuentasBancariasPortal?: CuentaBancaria[];
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

export type ContractType =
  | 'servicios'
  | 'cancelacion'
  | 'cancelacion-servicios'
  | 'cambio-fecha'
  | 'salon'
  | string;

export interface ContractTemplateItem {
  id: string;
  type: ContractType;
  name: string;
  template: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const defaultContractSettings: ContractSettings = {
  headerText: 'En la ciudad de Salto, República Oriental del Uruguay, a los {{CIUDAD_FECHA}}, comparecen por una parte AK PRODUCCIONES EVENTOS, RUT 220372680019, Nº de Empresa 0000008898364, representada en este acto por el Tec. Alexander Knuth, C.I. 4.617.350-8, con domicilio en Gaboto 3390, Salto, Uruguay, en adelante "LA EMPRESA"; y por otra parte {{CLIENTE_NOMBRE}}, C.I. {{CLIENTE_CI}}, con domicilio en {{CLIENTE_DOMICILIO}}, teléfono {{CLIENTE_TELEFONO}}, en adelante "LA CLIENTE". Ambas partes acuerdan celebrar el presente contrato, sujeto a las siguientes cláusulas: - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -',
  footerText: '',
  companySignerName: 'Tec. Alexander Knuth',
  companySignerRole: 'POR AK PRODUCCIONES EVENTOS',
  clauses: [
    {
      id: 'c1', order: 1, isActive: true,
      title: 'CLÁUSULA 1 – OBJETO DEL CONTRATO',
      content: 'LA EMPRESA brindará a LA CLIENTE el servicio integral para la organización y realización del evento contratado, cuya fecha es el {{FECHA_EVENTO}}, con una duración máxima de siete (7) horas desde el inicio del evento. Toda hora extra tendrá un costo de $5.000 (pesos uruguayos cinco mil) por cada hora o fracción. El evento se realizará en salón a convenir, cuyo costo será asumido exclusivamente por LA CLIENTE. Los servicios incluidos serán únicamente los que figuren en el presupuesto firmado por ambas partes. Todo servicio que no figure allí se considerará adicional y deberá abonarse por separado.',
    },
    {
      id: 'c2', order: 2, isActive: true,
      title: 'CLÁUSULA 2 – PRESUPUESTO VIGENTE Y AJUSTE ANUAL',
      content: 'a) El presupuesto vigente será el presupuesto original firmado, más cualquier cambio, agregado, reducción o adenda firmada por ambas partes y, cuando corresponda, más el ajuste anual previsto en esta cláusula. b) El ajuste anual del quince por ciento (15%) se aplicará únicamente cuando el evento sea en un año posterior al de la firma del contrato. c) Si corresponde, el ajuste se aplicará cada 1° de enero y será acumulativo y progresivo. d) Si el evento se realiza dentro del mismo año de la firma no se aplicará el aumento anual.',
    },
    {
      id: 'c3', order: 3, isActive: true,
      title: 'CLÁUSULA 3 – PLAN DE PAGOS, PAGO MÍNIMO E INCUMPLIMIENTO',
      content: 'a) LA CLIENTE entregará una seña de {{MONTO_SENA}} al firmar este contrato. Esa seña forma parte del precio total del evento y, si hay cancelación, también se tomará como parte de la multa que corresponda. b) LA CLIENTE deberá completar como mínimo el treinta por ciento (30%) del presupuesto vigente dentro del plazo de doce (12) meses desde la firma del contrato. c) El total del presupuesto deberá quedar pago como mínimo treinta (30) días corridos antes del evento. d) En cada período de tres (3) meses LA CLIENTE deberá abonar como mínimo un total de $5.000 (pesos uruguayos cinco mil). e) Si LA CLIENTE no regulariza, LA EMPRESA podrá dar por terminado el contrato por incumplimiento.',
    },
    {
      id: 'c4', order: 4, isActive: true,
      title: 'CLÁUSULA 4 – CAMBIO DE FECHA Y CANCELACIÓN',
      content: 'a) Si LA CLIENTE quiere cambiar la fecha del evento, deberá avisar con al menos treinta (30) días corridos de anticipación. b) Cada cambio de fecha tendrá una multa equivalente al diez por ciento (10%) del presupuesto vigente. c) Si la nueva fecha pasa a otro año, además se aplicará el ajuste anual que corresponda. d) Si LA CLIENTE cancela total o parcialmente el evento, deberá pagar una multa equivalente al treinta por ciento (30%) del presupuesto vigente ajustado. e) La seña entregada se tomará como parte de esa multa.',
    },
    {
      id: 'c5', order: 5, isActive: true,
      title: 'CLÁUSULA 5 – LISTA FINAL DE INVITADOS, AUMENTO O DISMINUCIÓN, MENÚS Y AJUSTES',
      content: 'a) LA CLIENTE deberá entregar la lista final de invitados con al menos siete (7) días corridos de anticipación. b) LA CLIENTE podrá reducir hasta un 10% del total de invitados contratados. Asimismo, podrá aumentar hasta un 30%, sujeto a disponibilidad, con al menos quince (15) días de anticipación. c) Si la mesa de personal externo contratado por LA CLIENTE (fotógrafo, show, etc.) requiere comida de LA EMPRESA, deberá solicitarlo antes y abonar la diferencia.',
    },
    {
      id: 'c6', order: 6, isActive: true,
      title: 'CLÁUSULA 6 – CONTRATO PERSONAL, PAGOS DE TERCEROS Y RECIBOS',
      content: 'a) Este contrato es personal e intransferible. b) La única responsable frente a LA EMPRESA será siempre la persona que firma este contrato. c) LA EMPRESA podrá recibir pagos de terceros, pero eso no cambia quién es la responsable. d) Todos los recibos se emitirán a nombre de LA CLIENTE. e) LA EMPRESA solo tomará como válidas las indicaciones hechas directamente por LA CLIENTE, salvo autorización escrita.',
    },
    {
      id: 'c7', order: 7, isActive: true,
      title: 'CLÁUSULA 7 – MENORES, ADOLESCENTES, DAÑOS Y RESPONSABILIDAD',
      content: 'a) LA EMPRESA no tendrá funciones de cuidado, control, guarda ni vigilancia de menores de edad o adolescentes. b) Será responsabilidad de LA CLIENTE cualquier daño causado a instalaciones, mobiliario, decoración, vajilla, sonido, iluminación, barra o utilería de LA EMPRESA. c) Ese daño deberá pagarse dentro de quince (15) días corridos desde que sea notificado. d) LA EMPRESA no será responsable por pérdidas, hurtos, conflictos entre asistentes u otras situaciones fuera de su control.',
    },
    {
      id: 'c8', order: 8, isActive: true,
      title: 'CLÁUSULA 8 – ELEMENTOS PROVISTOS',
      content: 'Todos los elementos usados para decoración, discoteca, barra, catering, iluminación, mobiliario, vajilla, manteleria, estructuras, utilería y demás servicios contratados pertenecen a LA EMPRESA. Ni LA CLIENTE ni sus invitados podrán retirarlos, quedárselos o retenerlos. Al finalizar el evento, solo se entregarán los sobrantes de comida del catering, la porción correspondiente de torta o postres, y la bebida comprada por LA CLIENTE.',
    },
    {
      id: 'c9', order: 9, isActive: true,
      title: 'CLÁUSULA 9 – USO DE IMAGEN',
      content: 'LA CLIENTE autoriza a LA EMPRESA a usar fotos y videos del evento con fines promocionales y publicitarios, en redes sociales, sitio web y otros medios. Si no autoriza ese uso, deberá comunicarlo por escrito antes del evento.',
    },
    {
      id: 'c10', order: 10, isActive: true,
      title: 'CLÁUSULA 10 – FUERZA MAYOR O CASO FORTUITO',
      content: 'a) Solo se considerarán casos de fuerza mayor o caso fortuito aquellos hechos extraordinarios, imprevisibles o inevitables, ajenos a la voluntad de las partes, que hagan imposible de verdad la realización del evento y que además puedan ser probados. b) Se incluyen, entre otros casos similares, desastres naturales, incendios, inundaciones, fenómenos climáticos graves, medidas de autoridad que impidan el evento, disturbios graves, el fallecimiento de LA CLIENTE o de la persona homenajeada o del titular de la empresa, o una enfermedad grave de cualquiera de ellas, siempre que se demuestre con la documentación correspondiente. c) No se considerarán fuerza mayor problemas económicos, malestares pasajeros, enfermedades leves, conflictos familiares, separaciones, arrepentimientos, cambios de opinión, falta de organización o falta de pago. d) Si lo que se invoca no se prueba, se aplicarán normalmente las reglas de cambio de fecha, cancelación y demás cláusulas del contrato. e) Si la situación realmente configura fuerza mayor y permite reprogramar, las partes procurarán acordar una nueva fecha, manteniéndose la vigencia económica del contrato con los ajustes que correspondan.',
    },
    {
      id: 'c11', order: 11, isActive: true,
      title: 'CLÁUSULA 11 – AGADU',
      content: 'Todos los pagos, permisos, declaraciones y trámites vinculados a AGADU serán responsabilidad exclusiva de LA CLIENTE. LA EMPRESA no será responsable por multas, recargos o sanciones relacionadas con ese tema.',
    },
    {
      id: 'c12', order: 12, isActive: true,
      title: 'CLÁUSULA 12 – PRESUPUESTO FIRMADO Y MODIFICACIONES',
      content: 'El presupuesto firmado por ambas partes forma parte de este contrato. Cualquier cambio, agregado, reducción o modificación de servicios deberá hacerse por escrito y con firma de ambas partes. No serán válidos los cambios hechos solo de palabra o por mensajes informales.',
    },
    {
      id: 'c13', order: 13, isActive: true,
      title: 'CLÁUSULA 13 – NOTIFICACIONES Y DOMICILIOS',
      content: 'Para este contrato, serán válidos los domicilios indicados al comienzo y el número de teléfono denunciado por LA CLIENTE. Toda notificación o intimación podrá hacerse por telegrama colacionado, carta documento, acta notarial u otro medio fehaciente.',
    },
    {
      id: 'c14', order: 14, isActive: true,
      title: 'CLÁUSULA 14 – JURISDICCIÓN',
      content: 'Para cualquier conflicto derivado de este contrato, las partes acuerdan someterse a la competencia de los Juzgados Letrados de Salto, renunciando a cualquier otro fuero o jurisdicción.',
    },
    {
      id: 'c15', order: 15, isActive: true,
      title: 'CLÁUSULA 15 – ACEPTACIÓN FINAL',
      content: 'Leído el presente contrato, las partes manifiestan comprenderlo y aceptarlo en todos sus términos, firmando dos ejemplares del mismo tenor en el lugar y fecha indicados.',
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
    cuentasBancariasPortal: [],
};
