export type PortalLedTechnologyId =
  | 'portal_cliente'
  | 'portal_invitado'
  | 'invitacion_digital'
  | 'rsvp_lista'
  | 'red_social_privada'
  | 'muro_social'
  | 'zona_digital_adolescente'
  | 'entretenimiento_viral'
  | 'barra_tecnologica'
  | 'totems_sincronizados'
  | 'modo_audioritmico'
  | 'juegos_sorteos'
  | 'album_digital'
  | 'seguimiento_ak';

export type PortalLedTechnologyItem = {
  id: PortalLedTechnologyId;
  title: string;
  shortPitch: string;
  benefit: string;
  clientPain: string;
  sellerScript: string;
  priority: number;
  visibleInLed: boolean;
};

export type PortalLedTechnologyShowcase = {
  headline: string;
  subtitle: string;
  positioning: string;
  items: PortalLedTechnologyItem[];
  closingPhrase: string;
};

export const PORTAL_LED_TECHNOLOGY_SHOWCASE: PortalLedTechnologyShowcase = {
  headline: 'Tecnologia AK: tu fiesta conectada antes, durante y despues',
  subtitle: 'No es solo una app. Es una experiencia digital vendible: organiza, confirma, entretiene, muestra en pantalla y genera recuerdos.',
  positioning: 'Esto diferencia a AK de contratar proveedores sueltos: la organizacion, los invitados, la zona tecnologica y los recuerdos quedan conectados en un solo sistema.',
  closingPhrase: 'La tecnologia no reemplaza la fiesta: la hace mas facil, mas ordenada, mas participativa y mas memorable.',
  items: [
    {
      id: 'portal_cliente',
      title: 'Portal Cliente VIP',
      shortPitch: 'El cliente ve avances, pagos, pendientes, documentos y datos importantes.',
      benefit: 'Mas tranquilidad y control durante toda la organizacion.',
      clientPain: 'No saber que falta, cuanto se pago o que queda pendiente.',
      sellerScript: 'Vas a tener un portal para seguir tu fiesta sin depender de mensajes perdidos.',
      priority: 1,
      visibleInLed: true,
    },
    {
      id: 'portal_invitado',
      title: 'Portal del Invitado',
      shortPitch: 'Cada invitado puede ver datos, ubicacion, QR, mesa, juegos y participacion.',
      benefit: 'Menos consultas y mas participacion de los invitados.',
      clientPain: 'Invitados preguntando hora, lugar, mesa o como confirmar.',
      sellerScript: 'Tus invitados tambien tienen su espacio para vivir la fiesta desde antes.',
      priority: 2,
      visibleInLed: true,
    },
    {
      id: 'invitacion_digital',
      title: 'Invitacion digital',
      shortPitch: 'Una invitacion moderna, personalizada y compartible por link o WhatsApp.',
      benefit: 'La primera impresion de la fiesta ya se ve profesional.',
      clientPain: 'Invitaciones simples, datos dispersos o confirmaciones desordenadas.',
      sellerScript: 'La invitacion no es solo linda: tambien ordena la informacion del evento.',
      priority: 3,
      visibleInLed: true,
    },
    {
      id: 'rsvp_lista',
      title: 'Confirmaciones y lista automatica',
      shortPitch: 'Los invitados confirman y se arma la lista con mejor control.',
      benefit: 'Mas orden para porteria, mesas, catering y organizacion.',
      clientPain: 'Listas por WhatsApp, nombres repetidos o invitados no autorizados.',
      sellerScript: 'Cada invitado confirma de forma controlada para evitar desorden.',
      priority: 4,
      visibleInLed: true,
    },
    {
      id: 'red_social_privada',
      title: 'Red social privada de la fiesta',
      shortPitch: 'Un espacio propio para mensajes, fotos, previa y participacion.',
      benefit: 'La fiesta empieza antes y los invitados se involucran mas.',
      clientPain: 'La fiesta dura pocas horas y despues se pierden recuerdos y mensajes.',
      sellerScript: 'Creamos una mini red social solo para tu evento.',
      priority: 5,
      visibleInLed: true,
    },
    {
      id: 'muro_social',
      title: 'Muro social en pantalla',
      shortPitch: 'Fotos, mensajes, ranking y momentos destacados en pantalla gigante.',
      benefit: 'Mas show, mas interaccion y una experiencia distinta.',
      clientPain: 'Invitados mirando el celular sin integrarse a la fiesta.',
      sellerScript: 'La pantalla se transforma en parte del entretenimiento.',
      priority: 6,
      visibleInLed: true,
    },
    {
      id: 'zona_digital_adolescente',
      title: 'Zona digital adolescente',
      shortPitch: 'Retos, juegos, emojis, ranking, votaciones y QR para que los jovenes participen.',
      benefit: 'La fiesta tiene una zona propia de interaccion, especialmente fuerte para XV y adolescentes.',
      clientPain: 'Adolescentes dispersos, poca participacion o entretenimiento digital sin control.',
      sellerScript: 'Podemos activar una zona digital para que los invitados jueguen, suban fotos, reaccionen y se vean en pantalla con moderacion.',
      priority: 7,
      visibleInLed: true,
    },
    {
      id: 'entretenimiento_viral',
      title: 'Fotocabina, Plataforma 360 y Espejo Magico',
      shortPitch: 'Fotocabina, Plataforma 360 y Espejo Magico para fotos, GIFs, loops, branding, QR, WhatsApp, galeria y LED.',
      benefit: 'El evento produce contenido compartible, recuerdos con marca de la fiesta y material listo para redes.',
      clientPain: 'Fotos aisladas en celulares sin galeria, QR ni salida visual para la pantalla.',
      sellerScript: 'A diferencia de una cabina suelta, AK conecta fotocabina, 360 y espejo con galeria, muro social, QR, WhatsApp, pantalla LED y post-fiesta.',
      priority: 8,
      visibleInLed: true,
    },
    {
      id: 'barra_tecnologica',
      title: 'Barra tecnologica tactil',
      shortPitch: 'El invitado elige tragos en pantalla y el barman recibe los pedidos ordenados.',
      benefit: 'La barra se convierte en una experiencia visual e interactiva, no solo en despacho de bebidas.',
      clientPain: 'Colas, pedidos desordenados o invitados que no saben que trago elegir.',
      sellerScript: 'Podemos mostrar ingredientes, videos y una cola para barman en otra pantalla.',
      priority: 9,
      visibleInLed: true,
    },
    {
      id: 'totems_sincronizados',
      title: 'Totems sincronizados',
      shortPitch: 'Pantallas verticales con fondos movibles, QR, fotos y nombre del evento.',
      benefit: 'Entrada, barra, pista y selfie points tienen presencia visual propia.',
      clientPain: 'La tecnologia se ve solo en una pantalla y no acompana los distintos espacios del salon.',
      sellerScript: 'Podemos poner pantallas por sectores para invitar a participar y mostrar contenido vivo.',
      priority: 10,
      visibleInLed: true,
    },
    {
      id: 'modo_audioritmico',
      title: 'Modo discoteca audiorritmico',
      shortPitch: 'Visuales para momentos de baile con QR, hashtag, fotos y movimiento.',
      benefit: 'La pantalla acompana la energia de la pista y mantiene viva la participacion.',
      clientPain: 'Pantallas estaticas durante la discoteca o contenido que no acompana el ritmo.',
      sellerScript: 'Cuando empieza la pista, la pantalla puede pasar a modo visual de baile y seguir llamando a participar.',
      priority: 11,
      visibleInLed: true,
    },
    {
      id: 'juegos_sorteos',
      title: 'Juegos, desafios y sorteos',
      shortPitch: 'Dinamicas simples para mover a los invitados y crear momentos.',
      benefit: 'Mas diversion y participacion sin contratar otro show.',
      clientPain: 'Momentos muertos o invitados que no participan.',
      sellerScript: 'Podemos sumar dinamicas para que la fiesta tenga mas vida.',
      priority: 12,
      visibleInLed: true,
    },
    {
      id: 'album_digital',
      title: 'Album digital final',
      shortPitch: 'Entrega organizada de fotos y recuerdos despues de la fiesta.',
      benefit: 'El recuerdo queda presentado de forma profesional.',
      clientPain: 'Fotos desperdigadas, links perdidos o entregas poco claras.',
      sellerScript: 'Despues de la fiesta tambien seguimos cuidando la experiencia.',
      priority: 13,
      visibleInLed: true,
    },
    {
      id: 'seguimiento_ak',
      title: 'Seguimiento AK',
      shortPitch: 'Tareas, pendientes, mensajes y control interno para no olvidar nada.',
      benefit: 'Mejor organizacion interna y menos errores.',
      clientPain: 'Detalles que se pierden entre reuniones y mensajes.',
      sellerScript: 'Todo queda registrado para que la organizacion no dependa de la memoria.',
      priority: 14,
      visibleInLed: true,
    },
  ],
};

export function getPortalLedTechnologyItems(): PortalLedTechnologyItem[] {
  return [...PORTAL_LED_TECHNOLOGY_SHOWCASE.items].sort((a, b) => a.priority - b.priority);
}

export function getPortalLedVisibleTechnologyItems(): PortalLedTechnologyItem[] {
  return getPortalLedTechnologyItems().filter(item => item.visibleInLed);
}

export function buildPortalLedTechnologySalesScript(): string[] {
  return [
    PORTAL_LED_TECHNOLOGY_SHOWCASE.headline,
    PORTAL_LED_TECHNOLOGY_SHOWCASE.positioning,
    ...getPortalLedVisibleTechnologyItems().map(item => `${item.title}: ${item.sellerScript}`),
    PORTAL_LED_TECHNOLOGY_SHOWCASE.closingPhrase,
  ];
}

export function buildPortalLedTechnologyChecklist(): string[] {
  return [
    'Mostrar Tecnologia AK antes de hablar solo de servicios y precio.',
    'Explicar cada herramienta por beneficio, no por nombre tecnico.',
    'Conectar invitacion, confirmaciones, invitados, zona digital, estaciones, muro y album como una experiencia unica.',
    'Separar lo incluido, lo opcional y lo apagado para no prometer modulos no contratados.',
    'Usar frases cortas para pantalla LED y explicacion oral en la entrevista.',
    'Cerrar la seccion mostrando que AK vende organizacion, tecnologia, entretenimiento y tranquilidad.',
  ];
}
