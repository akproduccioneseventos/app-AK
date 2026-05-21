export type SimulatorSalesStepId =
  | 'dolor_cliente'
  | 'servicio_integral'
  | 'beneficios_ak'
  | 'tecnologia_ak'
  | 'prueba_valor'
  | 'precio_referencia';

export type SimulatorSalesStep = {
  id: SimulatorSalesStepId;
  title: string;
  subtitle: string;
  bullets: string[];
  cta: string;
  priority: number;
};

export type SimulatorSalesPresentation = {
  headline: string;
  intro: string;
  steps: SimulatorSalesStep[];
  beforePriceMessage: string;
  priceDisclaimer: string;
  commercialPromise: string;
  requiredBeforePriceStepIds: SimulatorSalesStepId[];
};

export const SIMULATOR_SALES_PRESENTATION: SimulatorSalesPresentation = {
  headline: 'Antes de hablar de precio, entendé qué incluye organizar tu fiesta con AK',
  intro: 'El simulador no es solo para calcular. Primero te mostramos cómo resolvemos la fiesta completa para que compares con contratar todo por separado.',
  beforePriceMessage: 'Ahora sí, con esta base clara, podemos estimar un precio de referencia para tu fiesta.',
  priceDisclaimer: 'El precio del simulador es una referencia comercial. El presupuesto final se valida en entrevista según fecha, servicios, menú y disponibilidad.',
  commercialPromise: 'AK no vende solo servicios sueltos: vende una fiesta ordenada, visible y conectada con tecnología propia.',
  requiredBeforePriceStepIds: ['dolor_cliente', 'servicio_integral', 'beneficios_ak', 'tecnologia_ak', 'prueba_valor'],
  steps: [
    {
      id: 'dolor_cliente',
      title: 'Organizar una fiesta no es solo contratar servicios',
      subtitle: 'El problema real es coordinar todo, no olvidarse de nada y llegar tranquilo al día del evento.',
      bullets: ['Muchos proveedores por separado', 'Dudas de precios y cantidades', 'Familiares trabajando en vez de disfrutar', 'Riesgo de olvidar detalles importantes'],
      cta: 'Ver cómo lo resolvemos',
      priority: 1,
    },
    {
      id: 'servicio_integral',
      title: 'Un solo equipo para toda la fiesta',
      subtitle: 'AK centraliza organización, catering, decoración, personal, tecnología, música, foto, video y coordinación.',
      bullets: ['Una entrevista para ordenar todo', 'Equipo coordinado', 'Servicios conectados entre sí', 'Acompañamiento antes, durante y después'],
      cta: 'Conocer el servicio integral',
      priority: 2,
    },
    {
      id: 'beneficios_ak',
      title: 'Beneficios que se sienten el día de la fiesta',
      subtitle: 'No vendemos solo una lista de servicios: vendemos tranquilidad, abundancia y control.',
      bullets: ['Catering abundante y de calidad', 'Se devuelve lo que sobra', 'Personal organizado', 'Planificación clara y seguimiento'],
      cta: 'Ver beneficios',
      priority: 3,
    },
    {
      id: 'tecnologia_ak',
      title: 'Tecnología AK incluida en la experiencia',
      subtitle: 'Tu fiesta queda conectada antes, durante y después.',
      bullets: ['Invitación digital', 'Portal del cliente', 'Portal del invitado', 'Confirmaciones y lista automática', 'QR inteligente', 'Red social privada y muro social', 'Álbum digital y reporte final'],
      cta: 'Ver tecnología AK',
      priority: 4,
    },
    {
      id: 'prueba_valor',
      title: 'Compará contra hacerlo por separado',
      subtitle: 'El valor no está solo en el precio: está en evitar estrés, errores y pérdida de tiempo.',
      bullets: ['Menos reuniones', 'Menos coordinación manual', 'Más control del presupuesto', 'Más experiencia para tus invitados'],
      cta: 'Comparar valor',
      priority: 5,
    },
    {
      id: 'precio_referencia',
      title: 'Precio de referencia para decidir mejor',
      subtitle: 'Después de entender la experiencia, el simulador estima un presupuesto para que sepas si estás en rango.',
      bullets: ['No reemplaza la entrevista', 'Sirve para orientarte', 'Se puede ajustar según servicios', 'Te ayuda a reservar fecha con más seguridad'],
      cta: 'Calcular mi fiesta',
      priority: 6,
    },
  ],
};

export function getSimulatorSalesSteps(): SimulatorSalesStep[] {
  return [...SIMULATOR_SALES_PRESENTATION.steps].sort((a, b) => a.priority - b.priority);
}

export function buildSimulatorSalesChatMessages(clientName?: string): string[] {
  const name = clientName?.trim() || 'vos';
  return [
    `Antes de darte un número, quiero que entiendas qué estás contratando, ${name}.`,
    SIMULATOR_SALES_PRESENTATION.commercialPromise,
    'AK no es solo catering o decoración: es organización integral para que disfrutes la fiesta como invitado.',
    'Además incluimos tecnología: invitación digital, portal cliente, portal invitado, confirmaciones, muro social y álbum digital.',
    SIMULATOR_SALES_PRESENTATION.beforePriceMessage,
  ];
}

export function buildSimulatorValuePropositionSummary(): string {
  return getSimulatorSalesSteps()
    .filter(step => step.id !== 'precio_referencia')
    .map(step => step.title)
    .join(' · ');
}

export function shouldShowPriceAfterSalesPresentation(completedStepIds: SimulatorSalesStepId[]): boolean {
  const completed = new Set(completedStepIds);
  return SIMULATOR_SALES_PRESENTATION.requiredBeforePriceStepIds.every(stepId => completed.has(stepId));
}
