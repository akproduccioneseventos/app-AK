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
  /**
   * Cuánta seña se le pide al cliente cuando el presupuesto no trae una acordada.
   * Decisión del dueño: es un monto fijo, no un porcentaje. Se edita acá para no
   * tener que tocar el código el día que suba.
   */
  bookingDepositAmount?: number;
  whatsappMessageTemplate?: string; // Lo que se envía por WA
  valuePropositions?: string[]; // Beneficios tipo "Por qué elegirnos"
  assistantWelcomeMessage?: string; // Mensaje inicial del asistente AK
  assistantFinalMessage?: string; // Mensaje final del asistente AK
  virtualAssistantEnabled?: boolean; // Apagado de fábrica
  // Configuración de bienvenida y adicionales del simulador
  simulatorWelcomeTitle?: string;
  simulatorWelcomeSubtitle?: string;
  serviciosAdicionalesVisibles?: string[];
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
  bookingDepositAmount: 5000,
  whatsappMessageTemplate: "Hola, ya generé un presupuesto para mi evento y me gustaría coordinar una reunión para revisar detalles, despejar dudas y confirmar disponibilidad.",
  assistantWelcomeMessage: "¡Hola! Soy el Asistente AK 👋",
  assistantFinalMessage: "¿Hablamos? En una sola reunión resolvés todo y tu fiesta queda lista 🚀",
  virtualAssistantEnabled: false,
  valuePropositions: [
    "Equipamiento profesional de alta gama",
    "Personal capacitado y con amplia experiencia",
    "Flexibilidad en la planificación",
    "Compromiso de puntualidad y dedicación"
  ],
  simulatorWelcomeTitle: "Ingresá tus datos de contacto",
  simulatorWelcomeSubtitle: "Guardamos tu avance para que el equipo pueda ayudarte si no terminás la simulación."
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

export type SocialPlatformName = 'Facebook' | 'Instagram' | 'Google' | 'TikTok' | 'WhatsApp' | 'YouTube' | 'Threads' | 'X' | 'Pinterest';

export interface SocialConnection {
  platform: SocialPlatformName;
  isConnected: boolean;
  username?: string;
  profileUrl?: string;
  logoUrl?: string;
  connectedAt?: string;
  phoneNumber?: string;
  /** Permisos de publicación de Meta / Facebook / Instagram */
  pageId?: string;
  pageAccessToken?: string;
  instagramAccountId?: string;
  tokenExpiresAt?: string;
  /** Permisos para TikTok / YouTube / Google / Pinterest / X / Webhooks */
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  channelId?: string;
  locationId?: string;
  boardId?: string;
  webhookUrl?: string;
  autoPublishEnabled?: boolean;
  /** Estado real de verificación / prueba de la conexión */
  lastTestedAt?: string;
  testStatus?: 'success' | 'failed' | 'not_tested';
  testMessage?: string;
  lastPhotosCount?: number;
  lastSyncAt?: string;
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
    googleReviewsLink?: string;
    emailContador?: string;
    enableGoogleReviewsAutoRequest?: boolean;
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
  headerText: 'En la ciudad de Salto, República Oriental del Uruguay, {{FECHA_FIRMA_TEXTO}}, comparecen por una parte AK PRODUCCIONES EVENTOS, RUT 220372680019, Nº de Empresa 0000008898364, representada por el Tec. Alexander Knuth, C.I. 4.617.350-8, con domicilio en Gaboto 3390, Salto, Uruguay, en adelante "LA EMPRESA"; y por otra parte {{CLIENTE_NOMBRE}}, C.I. {{CLIENTE_CI}}, con domicilio en {{CLIENTE_DOMICILIO}}, teléfono {{CLIENTE_TELEFONO}}, en adelante "EL/LA CLIENTE". Ambas partes acuerdan celebrar el presente contrato sujeto a las siguientes cláusulas:',
  footerText: '',
  companySignerName: 'Tec. Alexander Knuth',
  companySignerRole: 'POR AK PRODUCCIONES EVENTOS',
  clauses: [
    {
      id: 'c1', order: 1, isActive: true,
      title: 'CLÁUSULA 1 - OBJETO, DURACIÓN Y SERVICIOS CONTRATADOS',
      content: 'LA EMPRESA brindará a EL/LA CLIENTE el servicio integral para la organización y realización del evento previsto para el {{FECHA_EVENTO}}, en {{SALON}}, con una duración máxima de siete (7) horas desde el inicio del evento. Toda hora extra tendrá un costo fijo de $5.000 (pesos uruguayos cinco mil) por cada hora o fracción y dicho importe no estará sujeto al ajuste anual previsto en este contrato. El costo del salón no se considerará incluido salvo que figure expresamente en el presupuesto vigente. LA EMPRESA únicamente estará obligada a prestar los servicios que figuren expresamente en el presupuesto firmado por EL/LA CLIENTE y aquellos que posteriormente sean solicitados por ésta, aceptados por LA EMPRESA y documentados en presupuesto, factura, adenda o constancia equivalente. Ningún servicio, elemento o prestación que no figure documentado podrá considerarse incluido ni exigirse posteriormente. Los servicios adicionales estarán sujetos a disponibilidad y al precio informado por LA EMPRESA.',
    },
    {
      id: 'c2', order: 2, isActive: true,
      title: 'CLÁUSULA 2 - PRESUPUESTO VIGENTE, PRECIOS Y AJUSTE ANUAL',
      content: 'a) El presupuesto vigente estará integrado por el presupuesto original firmado, las modificaciones, agregados o reducciones válidamente documentadas y los ajustes anuales que correspondan. b) El ajuste anual será del quince por ciento (15%) y se aplicará cada 1º de enero cuando el evento se realice en un año posterior al de la contratación. Será acumulativo y progresivo, calculándose cada nuevo ajuste sobre el importe ya ajustado del año anterior. c) Servicios ya contratados: si EL/LA CLIENTE aumenta invitados, unidades o cantidades de un servicio que ya integraba el presupuesto original, se mantendrá como base el precio unitario efectivamente contratado, incluyendo promociones o descuentos originales, y sobre dicho valor se aplicarán los ajustes anuales que correspondan. d) Servicios nuevos: todo servicio no incluido originalmente y agregado con posterioridad se cotizará al precio vigente al momento de su incorporación. Los ajustes anuales de ese servicio se aplicarán únicamente desde su incorporación, sin ajustes retroactivos por años anteriores. e) Las promociones o descuentos del presupuesto original se mantendrán para aumentos de cantidad del mismo servicio originalmente contratado, pero no se extenderán automáticamente a servicios nuevos agregados posteriormente. f) Todos los importes se expresan en pesos uruguayos (UYU), salvo indicación expresa en contrario, y se entienden comprensivos de los tributos que legalmente correspondan según el régimen aplicable a LA EMPRESA, salvo que el presupuesto indique expresamente otra cosa. g) Sobre el presupuesto vigente se calcularán saldos, cláusulas penales, reintegros, porcentajes mínimos de pago y demás importes previstos en este contrato.',
    },
    {
      id: 'c3', order: 3, isActive: true,
      title: 'CLÁUSULA 3 - PLAN DE PAGOS, MÍNIMOS Y MORA',
      content: 'a) EL/LA CLIENTE abonará al momento de la firma la seña acordada, que se imputará al precio total y confirmará la reserva de la fecha, sujeta al cumplimiento de las obligaciones previstas en este contrato. b) Desde la fecha de firma y hasta la cancelación total del presupuesto, EL/LA CLIENTE deberá abonar como mínimo $10.000 (pesos uruguayos diez mil) dentro de cada período sucesivo de tres (3) meses contado desde dicha fecha. Podrá realizar uno o varios pagos dentro de cada período y podrá abonar importes superiores en cualquier momento. c) Al cumplirse el primer tercio del tiempo comprendido entre la firma y la fecha del evento deberá encontrarse abonado, como mínimo, el treinta por ciento (30%) del presupuesto vigente. Para este contrato, dicho hito corresponde al {{HITO_30}}. d) Al cumplirse la mitad del tiempo comprendido entre la firma y la fecha del evento deberá encontrarse abonado, como mínimo, el cincuenta por ciento (50%) del presupuesto vigente. Para este contrato, dicho hito corresponde al {{HITO_50}}. e) Una vez alcanzado el 50%, EL/LA CLIENTE podrá continuar realizando entregas parciales hasta completar el saldo, manteniéndose el mínimo de $10.000 por cada período de tres meses. Todos los importes y porcentajes indicados son mínimos; EL/LA CLIENTE podrá adelantar pagos o cancelar anticipadamente cualquier parte del presupuesto. f) La seña y todos los pagos efectuados se computarán para alcanzar los mínimos indicados. La totalidad del presupuesto deberá encontrarse cancelada como máximo treinta (30) días corridos antes del evento; en este contrato, el {{FECHA_SALDO_TOTAL}}. g) El vencimiento de cualquiera de los mínimos u obligaciones de pago colocará a EL/LA CLIENTE en mora de pleno derecho, sin necesidad de interpelación previa. No obstante, antes de resolver el contrato por falta de pago, LA EMPRESA intimará a EL/LA CLIENTE para que regularice dentro de quince (15) días corridos. Si no regulariza, LA EMPRESA podrá resolver el contrato y aplicar la cláusula penal que corresponda. No se establece recargo automático por mora, sin perjuicio de los gastos o consecuencias que legalmente pudieran corresponder.',
    },
    {
      id: 'c4', order: 4, isActive: true,
      title: 'CLÁUSULA 4 - CAMBIO DE FECHA, CANCELACIÓN Y CLÁUSULA PENAL',
      content: 'a) Todo cambio de fecha deberá solicitarse con al menos treinta (30) días corridos de anticipación y quedará sujeto a disponibilidad de LA EMPRESA. b) Cada cambio de fecha tendrá una cláusula penal equivalente al diez por ciento (10%) del presupuesto vigente, pagadera al confirmar la nueva fecha. Si la nueva fecha corresponde a otro año, se aplicarán además los ajustes anuales correspondientes. La penalidad del 10% no se aplicará cuando la reprogramación se origine en un caso de fuerza mayor o caso fortuito debidamente acreditado y aceptado conforme a la cláusula correspondiente. c) Si EL/LA CLIENTE cancela total o parcialmente el evento, o elimina servicios ya contratados fuera de los supuestos de reducción de invitados permitidos por este contrato, deberá abonar una cláusula penal equivalente al treinta por ciento (30%) del presupuesto vigente al momento de la cancelación. En una cancelación parcial, el 30% se calculará sobre el valor de los servicios eliminados o reducidos. d) La seña y los pagos efectuados se imputarán a la cláusula penal. Si lo abonado excediera el importe que corresponda, LA EMPRESA reintegrará la diferencia que corresponda dentro de treinta (30) días corridos contados desde que quede determinado el importe definitivo a devolver. e) Si la cláusula penal quedara impaga, LA EMPRESA podrá intimar por medio fehaciente otorgando quince (15) días corridos para regularizar y, vencido dicho plazo, ejercer las acciones que correspondan.',
    },
    {
      id: 'c5', order: 5, isActive: true,
      title: 'CLÁUSULA 5 - CANTIDAD DE INVITADOS, LISTA FINAL Y MENÚES',
      content: 'a) La cantidad de invitados contratada podrá modificarse hasta quince (15) días corridos antes del evento. Hasta ese plazo, EL/LA CLIENTE podrá reducir como máximo un diez por ciento (10%) de la última cantidad contratada y documentada. La reducción afectará únicamente los conceptos presupuestados por persona; no corresponderá devolución o reducción por costos fijos, personal, estructura, logística, reservas o gastos ya comprometidos. b) Si dentro de ese plazo EL/LA CLIENTE solicita una reducción superior al 10%, el primer 10% se regirá por el literal anterior y la parte que exceda dicho porcentaje se considerará cancelación parcial, aplicándose sobre los servicios por persona eliminados la cláusula penal del treinta por ciento (30%) prevista en la cláusula 4. c) Vencido el plazo de quince (15) días, la última cantidad de invitados contratada quedará establecida como cantidad mínima facturable. Desde ese momento no corresponderá reducción, devolución, descuento ni crédito por personas que no confirmen, desistan o no concurran. Tampoco generará devolución un cambio posterior hacia una categoría de menú de menor valor. d) EL/LA CLIENTE podrá aumentar hasta un veinte por ciento (20%) la cantidad contratada, sujeto a disponibilidad de LA EMPRESA. Todo aumento deberá ser informado con al menos quince (15) días corridos de anticipación y abonado previamente. Los aumentos solicitados fuera de plazo sólo podrán aceptarse si LA EMPRESA confirma expresamente su posibilidad de prestación. El precio de los aumentos se calculará conforme a las reglas previstas para servicios ya contratados en la cláusula 2. e) La lista nominal definitiva deberá entregarse como máximo siete (7) días corridos antes del evento e incluir a todas las personas que concurrirán, sin excepción: persona homenajeada, familiares, acompañantes, niños, adolescentes, adultos y demás participantes. Deberá indicar además la categoría de menú correspondiente a cada persona. f) LA EMPRESA podrá cotejar la lista con la cantidad y categorías contratadas. Si detecta omisiones, diferencias o personas no incluidas, notificará a EL/LA CLIENTE para su regularización y, cuando corresponda, facturará la diferencia antes del evento. Si no se entrega la lista en plazo, se mantendrán como válidas las últimas cantidades y categorías contratadas. g) Si el día del evento concurren personas adicionales o de una categoría de mayor valor que no hayan sido regularizadas, LA EMPRESA podrá limitar la prestación a lo efectivamente contratado o exigir el pago de la diferencia antes de brindar el servicio adicional.',
    },
    {
      id: 'c6', order: 6, isActive: true,
      title: 'CLÁUSULA 6 - MENÚES ESPECIALES, ALERGIAS, INTOLERANCIAS Y RESTRICCIONES ALIMENTARIAS',
      content: 'a) EL/LA CLIENTE deberá informar durante las reuniones de organización y, en todo caso, como máximo quince (15) días corridos antes del evento, la existencia de invitados con celiaquía, alergias, intolerancias u otras restricciones alimentarias. b) Toda preparación especial deberá ser solicitada, presupuestada y abonada de forma expresa, pudiendo tener un precio diferente al menú común. Las solicitudes fuera del plazo de quince días quedarán sujetas a disponibilidad y posibilidad real de prestación. c) EL/LA CLIENTE declara conocer que el lugar de elaboración y servicio utilizado para el evento no dispone de áreas, equipamiento ni utensilios de uso exclusivo para preparaciones libres de gluten, alérgenos u otras sustancias determinadas. Los espacios de trabajo, utensilios y equipamiento también se utilizan para los restantes menús, por lo que LA EMPRESA no puede garantizar ausencia absoluta de trazas o contacto cruzado. d) Si EL/LA CLIENTE contrata una preparación especial únicamente para una parte del menú, la obligación de LA EMPRESA se limitará a esa prestación expresamente contratada. Los restantes alimentos comunes no se considerarán adaptados ni aptos para la restricción alimentaria informada. e) Si, luego de recibir esta información, EL/LA CLIENTE decide que una persona con restricción alimentaria consuma alimentos del menú común o alimentos no contratados como especiales, dicha decisión será de su responsabilidad, sin perjuicio de la responsabilidad que legalmente pueda corresponder a LA EMPRESA por sus propios actos u omisiones.',
    },
    {
      id: 'c7', order: 7, isActive: true,
      title: 'CLÁUSULA 7 - ORGANIZACIÓN, PERSONALIZACIÓN, CONFORMIDAD Y PRESTACIÓN',
      content: 'a) La personalización del evento se definirá en una o más reuniones previas entre LA EMPRESA y EL/LA CLIENTE. En dichas reuniones EL/LA CLIENTE decidirá los aspectos personalizables de los servicios contratados dentro de las opciones y posibilidades de cada servicio. b) Las decisiones adoptadas en la coordinación previa constituirán las instrucciones de EL/LA CLIENTE. Al finalizar la coordinación, podrá confeccionarse una Ficha de Coordinación Final que, una vez aceptada por EL/LA CLIENTE, formará parte de la documentación del evento. c) Toda condición que EL/LA CLIENTE considere indispensable deberá quedar expresamente definida durante la coordinación y documentada. Las modificaciones posteriores estarán sujetas a disponibilidad, viabilidad y, cuando corresponda, a costo adicional. d) En servicios que admiten apreciación estética o personal, tales como decoración, comida, fotografía, filmación, música, presentación o ambientación, las diferencias de gusto, preferencia o expectativa subjetiva no constituirán por sí solas incumplimiento si el servicio fue efectivamente prestado y respeta las características objetivamente acordadas. e) Las opiniones o disconformidades de familiares, invitados o terceros no modificarán las condiciones acordadas con EL/LA CLIENTE ni constituirán por sí mismas prueba de incumplimiento. f) Si durante el evento EL/LA CLIENTE advierte una situación susceptible de corrección, deberá comunicarla directamente a LA EMPRESA tan pronto como sea razonablemente posible, a efectos de procurar su solución durante el desarrollo del evento. g) Si por una causa directamente imputable a LA EMPRESA no se prestara en forma total uno o más servicios expresamente contratados y abonados, y no se acordara con EL/LA CLIENTE una sustitución equivalente, cumplimiento posterior cuando fuera posible o reprogramación, LA EMPRESA reintegrará dentro de treinta (30) días corridos los importes efectivamente abonados que correspondan a los servicios no prestados. Si la imposibilidad imputable a LA EMPRESA alcanzara a la totalidad del evento y no se acordara reprogramación, el reintegro comprenderá los importes abonados correspondientes a las prestaciones no realizadas, sin perjuicio de los derechos que legalmente correspondan a EL/LA CLIENTE. Lo previsto en este literal no convierte una diferencia subjetiva de gusto o expectativa en falta de prestación.',
    },
    {
      id: 'c8', order: 8, isActive: true,
      title: 'CLÁUSULA 8 - INTERLOCUCIÓN, PAGOS DE TERCEROS Y MODIFICACIONES',
      content: 'a) Este contrato es personal e intransferible. EL/LA CLIENTE firmante será la única interlocutora autorizada para impartir instrucciones, solicitar cambios, aprobar decisiones y formular observaciones vinculadas con la organización y ejecución del evento, salvo autorización escrita en favor de otra persona. b) Las solicitudes u opiniones de familiares, invitados o terceros no obligarán a LA EMPRESA si no son confirmadas por EL/LA CLIENTE. c) LA EMPRESA podrá recibir pagos efectuados por terceros, pero ello no modifica la identidad ni las obligaciones de EL/LA CLIENTE. Los recibos y comprobantes se emitirán a nombre de EL/LA CLIENTE. LA EMPRESA no responderá por préstamos, acuerdos o conflictos económicos entre EL/LA CLIENTE y terceros. d) El WhatsApp y demás medios de contacto declarados podrán utilizarse para coordinación operativa y pedidos. Todo cambio que afecte precios, cantidades o servicios deberá quedar posteriormente documentado en presupuesto, factura, adenda, ficha de coordinación u otra constancia aceptada por EL/LA CLIENTE.',
    },
    {
      id: 'c9', order: 9, isActive: true,
      title: 'CLÁUSULA 9 - PERSONAL Y SERVICIOS EXTERNOS',
      content: 'Si EL/LA CLIENTE contrata por su cuenta fotógrafos, maquilladores, shows, animadores, músicos u otros prestadores ajenos a LA EMPRESA, deberá informarlo con anticipación. La comida, bebida o atención de esas personas no se encuentra incluida salvo que haya sido solicitada, agregada al presupuesto y abonada previamente.',
    },
    {
      id: 'c10', order: 10, isActive: true,
      title: 'CLÁUSULA 10 - MENORES, DAÑOS Y RESPONSABILIDAD',
      content: 'a) LA EMPRESA no asume funciones de guarda, custodia, vigilancia o control de menores o adolescentes asistentes. Dicha responsabilidad corresponde a sus padres, madres, tutores, responsables legales o adultos designados. b) LA EMPRESA no responderá por conductas, salidas, conflictos o hechos de invitados o terceros que no le sean legalmente atribuibles, sin perjuicio de la responsabilidad que corresponda por sus propios actos u omisiones. c) EL/LA CLIENTE será responsable por los daños causados por ella, sus invitados o terceros vinculados al evento a instalaciones, mobiliario, decoración, vajilla, sonido, iluminación, barra, utilería u otros elementos provistos por LA EMPRESA. El importe deberá abonarse dentro de quince (15) días corridos desde su notificación. d) LA EMPRESA no responderá por pérdidas, hurtos, conflictos entre asistentes, problemas del local, cortes de servicios, fenómenos climáticos u otras circunstancias ajenas a su control, salvo en aquello que legalmente le sea imputable.',
    },
    {
      id: 'c11', order: 11, isActive: true,
      title: 'CLÁUSULA 11 - ELEMENTOS PROVISTOS Y SOBRANTES',
      content: 'a) Los elementos utilizados para decoración, discoteca, barra de tragos, iluminación, mobiliario, vajilla, mantelería, estructuras, utilería y demás materiales de trabajo pertenecen a LA EMPRESA o a sus proveedores y no podrán ser retirados, retenidos ni apropiados por EL/LA CLIENTE o sus invitados. b) Al finalizar el evento, EL/LA CLIENTE podrá retirar la comida sobrante, tortas y postres, refrescos y bebidas alcohólicas que hayan sido aportadas por EL/LA CLIENTE o facturadas específicamente por LA EMPRESA, siempre que se encuentren disponibles y en condiciones de entrega. c) No se entregarán sobrantes, insumos ni elementos correspondientes al servicio de barra de tragos de canilla libre, ni elementos pertenecientes a los servicios de discoteca, decoración, iluminación, mobiliario, vajilla, mantelería u otros materiales de trabajo. d) Una vez entregados los alimentos o bebidas sobrantes, su traslado, conservación y consumo quedarán bajo responsabilidad de EL/LA CLIENTE.',
    },
    {
      id: 'c12', order: 12, isActive: true,
      title: 'CLÁUSULA 12 - USO DE IMAGEN',
      content: 'La autorización de imagen es independiente de la contratación de los servicios y su aceptación o rechazo no modifica el precio ni las prestaciones contratadas. EL/LA CLIENTE podrá autorizar a LA EMPRESA a utilizar su propia imagen y, cuando corresponda legalmente, la imagen de menores respecto de los cuales ejerza representación, en fotografías o fragmentos audiovisuales del evento con fines promocionales en redes sociales, sitio web y material publicitario. Para el uso promocional de imágenes identificables de otros menores, LA EMPRESA deberá contar con la autorización de sus padres, madres, tutores o representantes legales cuando corresponda. Esta autorización no sustituye los consentimientos que legalmente deban obtenerse de terceros. EL/LA CLIENTE deberá marcar una opción: [ ] AUTORIZO [ ] NO AUTORIZO. Iniciales o firma de EL/LA CLIENTE: ________________________________.',
    },
    {
      id: 'c13', order: 13, isActive: true,
      title: 'CLÁUSULA 13 - FUERZA MAYOR O CASO FORTUITO',
      content: 'a) Se considerarán fuerza mayor o caso fortuito los hechos extraordinarios, imprevisibles o inevitables, ajenos a la voluntad de las partes, que hagan realmente imposible la realización del evento y puedan ser acreditados. b) Podrán comprender, entre otros, desastres naturales, incendios, inundaciones, fenómenos climáticos graves, medidas de autoridad que impidan el evento, disturbios graves, fallecimiento de EL/LA CLIENTE o de la persona homenajeada, o enfermedad grave debidamente documentada. c) No constituirán fuerza mayor los problemas económicos, malestares pasajeros, enfermedades leves, conflictos familiares, separaciones, arrepentimientos, cambios de opinión, falta de organización o falta de pago. d) Si el hecho configura fuerza mayor y permite reprogramar, las partes procurarán acordar una nueva fecha, sin aplicación de la penalidad del diez por ciento (10%) por cambio de fecha, manteniéndose la vigencia económica del contrato con los ajustes que correspondan. Si la reprogramación resultara imposible, se liquidarán las prestaciones efectivamente cumplidas y los gastos no recuperables debidamente comprometidos, reintegrándose en su caso el saldo que corresponda dentro de treinta (30) días corridos desde que quede determinado el importe definitivo.',
    },
    {
      id: 'c14', order: 14, isActive: true,
      title: 'CLÁUSULA 14 - AGADU',
      content: 'Los pagos, permisos, declaraciones y trámites vinculados a AGADU serán responsabilidad de EL/LA CLIENTE, salvo que expresamente se encuentren incluidos como servicio en el presupuesto vigente. LA EMPRESA no asumirá multas, recargos o sanciones originados en obligaciones que correspondan a EL/LA CLIENTE.',
    },
    {
      id: 'c15', order: 15, isActive: true,
      title: 'CLÁUSULA 15 - NOTIFICACIONES Y DOMICILIOS',
      content: 'Serán válidos los domicilios y datos de contacto declarados en este contrato. Las comunicaciones operativas podrán efectuarse por WhatsApp u otros medios habituales. Las intimaciones formales podrán realizarse por telegrama colacionado, carta documento, acta notarial u otro medio fehaciente. EL/LA CLIENTE deberá comunicar formalmente cualquier cambio de domicilio o teléfono.',
    },
    {
      id: 'c16', order: 16, isActive: true,
      title: 'CLÁUSULA 16 - JURISDICCIÓN',
      content: 'Para toda controversia se aplicará la normativa uruguaya y serán competentes los tribunales que correspondan conforme a las normas imperativas vigentes. En aquellas materias en que la elección territorial resulte legalmente admisible, las partes acuerdan la competencia de los tribunales de Salto.',
    },
    {
      id: 'c17', order: 17, isActive: true,
      title: 'CLÁUSULA 17 - ACEPTACIÓN FINAL',
      content: 'EL/LA CLIENTE declara haber leído y comprendido el presente contrato, el presupuesto vigente y las condiciones aquí establecidas, aceptándolos en todos sus términos. Se firman dos ejemplares del mismo tenor en el lugar y fecha indicados.',
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
    googleReviewsLink: "",
    enableGoogleReviewsAutoRequest: false,
};

export interface AjustesLlegadaPersonal {
  llegadaConUbicacion: boolean;
  radioMetros: number;
}

export const defaultAjustesLlegadaPersonal: AjustesLlegadaPersonal = {
  llegadaConUbicacion: false,
  radioMetros: 300,
};
