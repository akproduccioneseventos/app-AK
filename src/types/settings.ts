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
  headerText: "En la ciudad de Salto, República Oriental del Uruguay, {{FECHA_FIRMA_TEXTO}}, comparecen por una parte AK PRODUCCIONES EVENTOS, RUT 220372680019, Nº de Empresa 0000008898364, representada por el Tec. Alexander Knuth, C.I. 4.617.350-8, con domicilio en Gaboto 3390, Salto, Uruguay, en adelante \"LA EMPRESA\"; y por otra parte {{CLIENTE_NOMBRE}}, C.I. {{CLIENTE_CI}}, con domicilio en {{CLIENTE_DOMICILIO}}, teléfono {{CLIENTE_TELEFONO}}, en adelante \"EL/LA CLIENTE\". Ambas partes acuerdan celebrar el presente contrato bajo las siguientes condiciones.",
  footerText: '',
  companySignerName: 'Tec. Alexander Knuth',
  companySignerRole: 'POR AK PRODUCCIONES EVENTOS',
  clauses: [
    {
        "id": "c1",
        "order": 1,
        "isActive": true,
        "title": "CLÁUSULA 1 - SERVICIO CONTRATADO Y DURACIÓN",
        "content": "a) LA EMPRESA organizará y realizará el evento de EL/LA CLIENTE el {{FECHA_EVENTO}}, en {{SALON}}. La duración máxima será de siete (7) horas desde el inicio de la fiesta. b) Cada hora extra o fracción tendrá un costo fijo de $5.000 (pesos uruguayos cinco mil), sin ajuste anual. c) El salón sólo estará incluido si figura expresamente en el presupuesto. d) LA EMPRESA deberá brindar únicamente los servicios que aparezcan en el presupuesto firmado y los que después sean solicitados por EL/LA CLIENTE, aceptados por LA EMPRESA y agregados por escrito en presupuesto, factura, adenda, ficha u otra constancia. e) Todo servicio que no figure documentado se considerará adicional y no podrá exigirse como incluido. Los servicios agregados estarán sujetos a disponibilidad y deberán abonarse en las condiciones informadas por LA EMPRESA."
    },
    {
        "id": "c2",
        "order": 2,
        "isActive": true,
        "title": "CLÁUSULA 2 - PRESUPUESTO, PRECIOS Y AJUSTE ANUAL",
        "content": "a) El presupuesto vigente será el presupuesto original firmado, más los cambios, agregados o reducciones que hayan quedado documentados y los ajustes anuales que correspondan. b) El ajuste será del quince por ciento (15%) cada 1º de enero cuando el evento se realice en un año posterior al de la contratación. Será acumulativo, por lo que cada nuevo ajuste se calculará sobre el importe ya ajustado. c) Si EL/LA CLIENTE aumenta la cantidad de invitados, unidades o cantidades de un servicio que ya estaba contratado, se mantendrá como base el precio unitario originalmente contratado, incluso si tenía promoción o descuento, y luego se aplicarán los ajustes anuales que correspondan. d) Si EL/LA CLIENTE agrega un servicio que no estaba contratado, se tomará el precio vigente al momento de agregarlo y ese servicio sólo llevará los ajustes anuales que correspondan desde esa fecha en adelante. e) Las promociones o descuentos originales no se aplicarán automáticamente a servicios nuevos. f) Todos los importes se expresan en pesos uruguayos y comprenden los tributos que legalmente correspondan, salvo que el presupuesto indique expresamente otra cosa. g) Sobre el presupuesto vigente se calcularán saldos, penalidades, devoluciones y porcentajes mínimos de pago."
    },
    {
        "id": "c3",
        "order": 3,
        "isActive": true,
        "title": "CLÁUSULA 3 - PLAN DE PAGOS",
        "content": "a) La seña se toma a cuenta del precio total y confirma la reserva de la fecha, siempre que EL/LA CLIENTE cumpla este contrato. b) Desde la fecha de firma, EL/LA CLIENTE deberá abonar como mínimo $10.000 (pesos uruguayos diez mil) dentro de cada período sucesivo de tres (3) meses. Puede hacer uno o varios pagos dentro de ese período y también puede pagar importes mayores o adelantar pagos cuando quiera. c) Al cumplirse el primer tercio del tiempo entre la firma y la fiesta deberá tener abonado como mínimo el treinta por ciento (30%) del presupuesto vigente; para este contrato, el {{HITO_30}}. d) Al cumplirse la mitad de ese tiempo deberá tener abonado como mínimo el cincuenta por ciento (50%); para este contrato, el {{HITO_50}}. e) Una vez alcanzado el 50%, podrá seguir haciendo entregas parciales, manteniéndose el mínimo de $10.000 cada tres meses. La seña y todos los pagos realizados cuentan para alcanzar esos mínimos. f) El total del presupuesto deberá estar pago treinta (30) días antes del evento; en este contrato, el {{FECHA_SALDO_TOTAL}}. g) Si EL/LA CLIENTE no cumple alguno de estos mínimos, LA EMPRESA le notificará la situación y tendrá quince (15) días corridos para ponerse al día. Si no regulariza dentro de ese plazo, LA EMPRESA podrá dar por terminado el contrato y aplicar la penalidad que corresponda. h) No se establece recargo automático por atraso."
    },
    {
        "id": "c4",
        "order": 4,
        "isActive": true,
        "title": "CLÁUSULA 4 - CAMBIO DE FECHA Y CANCELACIÓN",
        "content": "a) Todo cambio de fecha deberá solicitarse con al menos treinta (30) días corridos de anticipación y dependerá de la disponibilidad de LA EMPRESA. b) Cada cambio de fecha tendrá una penalidad equivalente al diez por ciento (10%) del presupuesto vigente, que deberá abonarse al confirmar la nueva fecha. Si la nueva fecha pasa a otro año, también se aplicarán los ajustes anuales correspondientes. c) Si LA EMPRESA no dispone de la nueva fecha solicitada, EL/LA CLIENTE podrá mantener la fecha original; si decide no hacerlo, se aplicarán las reglas de cancelación. d) La penalidad del 10% no se aplicará cuando la reprogramación se deba a un caso de fuerza mayor previsto en este contrato. e) Si EL/LA CLIENTE cancela todo el evento, la penalidad será del treinta por ciento (30%) del presupuesto vigente. f) Si elimina sólo una parte de los servicios, el 30% se calculará sobre el valor de los servicios eliminados o reducidos, salvo las reducciones de invitados permitidas expresamente por este contrato. g) La seña y los pagos realizados se tomarán en cuenta para esa penalidad. h) Si EL/LA CLIENTE hubiera pagado de más, LA EMPRESA devolverá la diferencia dentro de treinta (30) días corridos desde que quede determinado el importe a devolver. i) Si quedara una penalidad impaga, LA EMPRESA podrá intimar su pago y otorgar quince (15) días corridos para regularizar antes de iniciar las acciones que correspondan."
    },
    {
        "id": "c5",
        "order": 5,
        "isActive": true,
        "title": "CLÁUSULA 5 - INVITADOS, AUMENTOS, REDUCCIONES, MENÚES Y LISTA FINAL",
        "content": "a) La cantidad de invitados podrá modificarse hasta quince (15) días corridos antes de la fiesta. b) Hasta ese momento EL/LA CLIENTE podrá reducir como máximo un diez por ciento (10%) de la última cantidad contratada y documentada. Esa reducción sólo afectará los servicios cobrados por persona; no se reducirán costos fijos, personal, estructura, logística, reservas ni gastos ya comprometidos. c) Si dentro de ese plazo EL/LA CLIENTE quiere reducir más del 10%, el primer 10% se tratará como reducción permitida y la parte que exceda ese porcentaje se considerará cancelación parcial, aplicándose sobre esa parte la penalidad del 30%. d) Pasados los quince (15) días, la última cantidad contratada quedará como cantidad mínima facturable y no habrá devolución, descuento ni crédito porque algunas personas no confirmen, desistan, no concurran o cambien a un menú más barato. e) Antes del cierre de quince días, si cambia la cantidad entre menú adulto, adolescente, infantil u otra categoría, se ajustará el presupuesto según el valor propio de cada menú. Las categorías tienen precios independientes y no se compensan automáticamente entre sí. Si se pasa a una categoría más cara deberá abonarse la diferencia y, si se pasa a una más económica dentro del plazo, se descontará la diferencia que corresponda. f) EL/LA CLIENTE podrá aumentar hasta un veinte por ciento (20%) la cantidad de invitados, sujeto a disponibilidad, avisando con al menos quince (15) días de anticipación y pagando previamente la diferencia. Esos aumentos se calcularán con el precio originalmente contratado para el mismo servicio, con sus promociones o descuentos y los ajustes anuales correspondientes. Los aumentos fuera de plazo sólo se aceptarán si LA EMPRESA puede realizarlos. g) La lista final de nombres deberá entregarse como máximo siete (7) días antes e incluir a todas las personas que concurran, sin excepción: homenajeado, familiares, acompañantes, niños, adolescentes, adultos y demás participantes, indicando el tipo de menú de cada uno. h) LA EMPRESA podrá revisar que la lista coincida con las cantidades y categorías contratadas. Si encuentra omisiones o diferencias, avisará a EL/LA CLIENTE para corregirlas y, cuando corresponda, facturará la diferencia antes del evento. i) Si no se entrega la lista en plazo, se tomarán como válidas las últimas cantidades y categorías contratadas. j) Si el día del evento concurren personas adicionales o personas de una categoría de mayor valor no regularizadas, LA EMPRESA podrá limitar el servicio a lo contratado o exigir el pago de la diferencia antes de brindar el adicional."
    },
    {
        "id": "c6",
        "order": 6,
        "isActive": true,
        "title": "CLÁUSULA 6 - CELÍACOS, ALERGIAS, INTOLERANCIAS Y MENÚES ESPECIALES",
        "content": "a) EL/LA CLIENTE deberá informar en las reuniones de organización y, como máximo, quince (15) días corridos antes del evento, si existen invitados con celiaquía, alergias, intolerancias u otras restricciones alimentarias. b) Toda preparación especial deberá pedirse expresamente, presupuestarse y abonarse, y podrá tener un precio diferente al menú común. Los pedidos realizados después de ese plazo quedarán sujetos a disponibilidad y a que LA EMPRESA realmente pueda realizarlos. c) EL/LA CLIENTE declara saber que el lugar de elaboración y servicio utilizado para la fiesta no cuenta con áreas, equipos ni utensilios exclusivos para preparaciones libres de gluten, alérgenos u otras sustancias determinadas. Los mismos espacios, equipos y utensilios también se utilizan para los demás menús, por lo que LA EMPRESA no puede garantizar ausencia absoluta de trazas o contacto cruzado. d) Si EL/LA CLIENTE contrata una preparación especial sólo para una parte del menú, por ejemplo la entrada, únicamente esa parte se considerará preparación especial; los demás alimentos comunes no se considerarán adaptados ni aptos para esa restricción. e) Si, conociendo esta situación, EL/LA CLIENTE decide que una persona con restricción alimentaria consuma alimentos comunes no contratados como especiales, esa decisión será de su responsabilidad. f) LA EMPRESA será responsable de brindar correctamente la preparación especial que haya sido expresamente contratada."
    },
    {
        "id": "c7",
        "order": 7,
        "isActive": true,
        "title": "CLÁUSULA 7 - ORGANIZACIÓN, PERSONALIZACIÓN Y CONFORMIDAD",
        "content": "a) La fiesta se personalizará en una o más reuniones previas con EL/LA CLIENTE. En esas reuniones EL/LA CLIENTE elegirá y aprobará los detalles de los servicios contratados dentro de las opciones y posibilidades de cada servicio. b) Lo acordado podrá quedar asentado en una Ficha de Coordinación Final y, una vez aceptada por EL/LA CLIENTE, será la guía para realizar el evento. c) Todo detalle que EL/LA CLIENTE considere indispensable deberá informarse y quedar acordado antes de la fiesta. Los cambios posteriores dependerán de disponibilidad, viabilidad y podrán tener costo adicional. d) En decoración, comida, fotografía, filmación, música, presentación, ambientación y otros servicios que también dependen del gusto personal, una diferencia de gusto, preferencia o expectativa no será por sí sola un incumplimiento si el servicio se realizó según lo acordado. e) Las opiniones de familiares, invitados o terceros tampoco cambian lo acordado con EL/LA CLIENTE ni prueban por sí solas un incumplimiento. f) Si durante la fiesta EL/LA CLIENTE detecta un problema que pueda corregirse, deberá comunicarlo a LA EMPRESA tan pronto como sea posible para intentar solucionarlo durante el evento. g) Si por una causa directamente atribuible a LA EMPRESA no se brinda total o parcialmente un servicio expresamente contratado y pagado, primero se buscará una solución, sustitución equivalente, cumplimiento posterior si fuera posible o reprogramación. h) Si no hubiera solución acordada, LA EMPRESA devolverá dentro de treinta (30) días el importe efectivamente abonado correspondiente al servicio que no se prestó. Si una causa directamente atribuible a LA EMPRESA impidiera realizar todo el evento y no se acordara una nueva fecha, se devolverán los importes abonados correspondientes a las prestaciones no realizadas."
    },
    {
        "id": "c8",
        "order": 8,
        "isActive": true,
        "title": "CLÁUSULA 8 - RESPONSABLE DEL CONTRATO, TERCEROS Y CAMBIOS",
        "content": "a) Este contrato es personal e intransferible. EL/LA CLIENTE firmante será la única persona responsable frente a LA EMPRESA y la única autorizada para dar instrucciones, pedir cambios, aprobar decisiones o hacer observaciones, salvo que autorice por escrito a otra persona. b) Lo que pidan familiares, invitados o terceros no obligará a LA EMPRESA si EL/LA CLIENTE no lo confirma. Separaciones, conflictos familiares u otros problemas personales no cambian quién es responsable del contrato. c) LA EMPRESA puede recibir pagos hechos por terceros, pero eso no transfiere el contrato ni cambia las obligaciones de EL/LA CLIENTE. Los recibos y comprobantes se emitirán a su nombre. d) LA EMPRESA no será responsable por préstamos, acuerdos o problemas económicos entre EL/LA CLIENTE y otras personas. e) WhatsApp y otros medios habituales podrán usarse para coordinar y hacer pedidos, pero todo cambio que modifique precios, cantidades o servicios deberá quedar documentado en presupuesto, factura, adenda, ficha de coordinación u otra constancia aceptada por EL/LA CLIENTE."
    },
    {
        "id": "c9",
        "order": 9,
        "isActive": true,
        "title": "CLÁUSULA 9 - PERSONAL Y SERVICIOS EXTERNOS",
        "content": "a) Si EL/LA CLIENTE contrata por su cuenta fotógrafos, maquilladores, shows, animadores, músicos u otros prestadores que no sean de LA EMPRESA, deberá informarlo con anticipación. b) La comida, bebida o atención de esas personas no está incluida en el servicio contratado, salvo que EL/LA CLIENTE la solicite expresamente, se agregue al presupuesto y se pague la diferencia correspondiente antes del evento."
    },
    {
        "id": "c10",
        "order": 10,
        "isActive": true,
        "title": "CLÁUSULA 10 - MENORES, DAÑOS Y RESPONSABILIDADES",
        "content": "a) LA EMPRESA no tendrá a su cargo el cuidado, guarda, vigilancia o control de menores y adolescentes. Esa responsabilidad corresponde a sus padres, madres, tutores, responsables legales o adultos designados. b) LA EMPRESA no responderá por conductas, salidas, conflictos o hechos de invitados o terceros que no dependan de ella. c) EL/LA CLIENTE será responsable por los daños que ella, sus invitados o terceros vinculados al evento causen al local, instalaciones, mobiliario, decoración, vajilla, sonido, iluminación, barra, utilería u otros elementos utilizados o provistos para la fiesta, y deberá abonarlos dentro de quince (15) días corridos desde que sea notificada. d) LA EMPRESA no será responsable por pérdidas, hurtos, conflictos entre asistentes, problemas propios del local, cortes de servicios, fenómenos climáticos u otras situaciones fuera de su control, sin perjuicio de la responsabilidad que legalmente corresponda por hechos directamente atribuibles a LA EMPRESA."
    },
    {
        "id": "c11",
        "order": 11,
        "isActive": true,
        "title": "CLÁUSULA 11 - ELEMENTOS DE LA EMPRESA Y SOBRANTES",
        "content": "a) Los elementos utilizados para decoración, discoteca, barra de tragos, iluminación, mobiliario, vajilla, mantelería, estructuras, utilería y demás materiales de trabajo pertenecen a LA EMPRESA o a sus proveedores y no podrán ser retirados, retenidos ni apropiados por EL/LA CLIENTE o sus invitados. b) Al terminar el evento EL/LA CLIENTE podrá retirar la comida sobrante, tortas, postres, refrescos y bebidas alcohólicas que ella haya llevado o que hayan sido compradas y facturadas específicamente para su evento, siempre que estén disponibles y en condiciones de entrega. c) No se entregarán sobrantes, insumos ni elementos correspondientes al servicio de barra de tragos de canilla libre, ni elementos pertenecientes a discoteca, decoración, iluminación, mobiliario, vajilla, mantelería u otros materiales de trabajo. d) Una vez entregados los alimentos o bebidas sobrantes, su traslado, conservación y consumo serán responsabilidad de EL/LA CLIENTE."
    },
    {
        "id": "c12",
        "order": 12,
        "isActive": true,
        "title": "CLÁUSULA 12 - USO DE IMAGEN",
        "content": "a) EL/LA CLIENTE podrá autorizar a AK PRODUCCIONES EVENTOS a utilizar fotografías y videos obtenidos durante el evento con fines promocionales y publicitarios en redes sociales, página web y otros medios de difusión de la empresa. b) Esta autorización no cambia el precio ni los servicios contratados. Marque una opción: [ ] AUTORIZO [ ] NO AUTORIZO."
    },
    {
        "id": "c13",
        "order": 13,
        "isActive": true,
        "title": "CLÁUSULA 13 - FUERZA MAYOR O CASO FORTUITO",
        "content": "a) Se considerará fuerza mayor o caso fortuito una situación extraordinaria, imprevisible o inevitable, ajena a la voluntad de las partes, que realmente impida hacer el evento y pueda comprobarse. Puede incluir desastres naturales, incendios, inundaciones, fenómenos climáticos graves, medidas de autoridad que impidan el evento, disturbios graves, fallecimiento de EL/LA CLIENTE o de la persona homenajeada, o enfermedad grave debidamente acreditada. b) No se considerarán fuerza mayor los problemas económicos, malestares pasajeros, enfermedades leves, conflictos familiares, separaciones, arrepentimientos, cambios de opinión, falta de organización o falta de pago. c) Si existe una verdadera fuerza mayor y se puede reprogramar, las partes buscarán una nueva fecha sin cobrar la penalidad del 10% por cambio de fecha, manteniéndose los ajustes económicos que correspondan. d) Si no fuera posible reprogramar, se descontarán las prestaciones ya cumplidas y los gastos no recuperables que ya estuvieran debidamente comprometidos, y el saldo que corresponda se devolverá dentro de treinta (30) días corridos desde que quede determinado."
    },
    {
        "id": "c14",
        "order": 14,
        "isActive": true,
        "title": "CLÁUSULA 14 - AGADU",
        "content": "a) Los pagos, permisos, declaraciones y trámites relacionados con AGADU serán responsabilidad de EL/LA CLIENTE, salvo que el presupuesto indique expresamente que ese servicio está incluido. b) LA EMPRESA no asumirá multas, recargos o sanciones originados en obligaciones que correspondan a EL/LA CLIENTE."
    },
    {
        "id": "c15",
        "order": 15,
        "isActive": true,
        "title": "CLÁUSULA 15 - NOTIFICACIONES Y DATOS DE CONTACTO",
        "content": "a) Serán válidos el domicilio y los datos de contacto indicados en este contrato. Las comunicaciones normales podrán hacerse por WhatsApp u otros medios habituales. b) Las intimaciones formales podrán realizarse por telegrama colacionado, carta documento, acta notarial u otro medio fehaciente. c) Si EL/LA CLIENTE cambia de domicilio o número de teléfono deberá comunicarlo formalmente; de lo contrario, seguirán siendo válidos los datos informados en este contrato."
    },
    {
        "id": "c16",
        "order": 16,
        "isActive": true,
        "title": "CLÁUSULA 16 - JURISDICCIÓN",
        "content": "a) Este contrato se rige por la normativa uruguaya. b) En caso de conflicto serán competentes los tribunales que correspondan según las normas vigentes y, cuando la elección territorial sea legalmente posible, las partes acuerdan la competencia de los tribunales de Salto."
    },
    {
        "id": "c17",
        "order": 17,
        "isActive": true,
        "title": "CLÁUSULA 17 - ACEPTACIÓN",
        "content": "a) EL/LA CLIENTE declara haber leído y comprendido este contrato, el presupuesto vigente y las condiciones aquí establecidas, y acepta sus términos. b) Se firman dos ejemplares del mismo tenor."
    }
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
