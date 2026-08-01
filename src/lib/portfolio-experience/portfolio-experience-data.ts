export type DeviceMode = 'led' | 'desktop' | 'tablet' | 'mobile';

export type PortfolioIcon =
  | 'salon'
  | 'decoracion'
  | 'catering'
  | 'barra'
  | 'musica'
  | 'fotoVideo'
  | 'invitacion'
  | 'portalCliente'
  | 'portalInvitado'
  | 'muroSocial'
  | 'pantallaLed'
  | 'zonaDigital'
  | 'fotocabina'
  | 'plataforma360'
  | 'espejoMagico'
  | 'totems'
  | 'audioRitmico'
  | 'coordinacion'
  | 'agenda'
  | 'postFiesta';

export type PortfolioPhase = 'Antes' | 'Durante' | 'Despues';

export type DevicePreset = {
  id: DeviceMode;
  label: string;
  description: string;
  frameClassName: string;
  screenClassName: string;
};

export type PortfolioService = {
  id: string;
  title: string;
  phase: PortfolioPhase;
  icon: PortfolioIcon;
  tagline: string;
  details: string;
  imageUrl: string;
  accent: string;
};

export type TechnologyStep = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  imageUrl: string;
  accent: string;
};

export type InvitationTemplate = {
  id: string;
  title: string;
  mood: string;
  description: string;
  imageUrl: string;
  accent: string;
};

export type LedTechnologyPackage = {
  id: string;
  title: string;
  sellAs: string;
  clientValue: string;
  includes: string[];
  accent: string;
};

export type LedSalesStoryStep = {
  id: string;
  title: string;
  goal: string;
  howToShow: string;
  proof: string;
  accent: string;
};

export type LedSalesImpactStat = {
  label: string;
  value: string;
  copy: string;
  accent: string;
};

export type LedClientDecisionScene = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  sellerLine: string;
  bullets: string[];
  imageUrl: string;
  accent: string;
};

export type LedEventCatalog = {
  id: 'boda' | 'xv' | 'fiesta';
  label: string;
  eventType: string;
  eyebrow: string;
  title: string;
  description: string;
  heroImage: string;
  imageAlt: string;
  accent: string;
  highlights: string[];
  galleryImages: Array<{ src: string; alt: string }>;
};

export const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: 'led',
    label: 'Pantalla gigante',
    description: 'Formato panoramico para venta, salon o LED.',
    frameClassName: 'w-full max-w-[1500px] aspect-[16/9]',
    screenClassName: 'rounded-[2rem]',
  },
  {
    id: 'desktop',
    label: 'PC',
    description: 'Formato escritorio para reuniones y oficina.',
    frameClassName: 'w-full max-w-6xl aspect-[16/10]',
    screenClassName: 'rounded-[1.5rem]',
  },
  {
    id: 'tablet',
    label: 'Tablet',
    description: 'Formato intermedio para mostrar sentado con el cliente.',
    frameClassName: 'w-full max-w-3xl aspect-[4/3]',
    screenClassName: 'rounded-[2rem]',
  },
  {
    id: 'mobile',
    label: 'Celular',
    description: 'Lo que ve el cliente o invitado desde el telefono.',
    frameClassName: 'w-full max-w-[390px] aspect-[9/16]',
    screenClassName: 'rounded-[2.4rem]',
  },
];

export const LED_EVENT_CATALOGS: LedEventCatalog[] = [
  {
    id: 'xv',
    label: 'XV anos',
    eventType: 'XV anos',
    eyebrow: 'Catalogo XV',
    title: 'Tus XV, desde la entrada hasta el ultimo baile.',
    description: 'Ambientacion, catering, discoteca, fotografia, filmacion, entretenimiento, barra y reposteria coordinados por un solo equipo.',
    heroImage: '/media/catalogo-servicios/quinceanera_hero.png',
    imageAlt: 'Quinceanera celebrando en una pista iluminada',
    accent: '#db2777',
    highlights: [
      'Decoracion y mesa principal personalizadas',
      'Discoteca, iluminacion y momentos especiales',
      'Catering para adultos y adolescentes',
      'Foto, video y entretenimiento para compartir',
    ],
    galleryImages: [
      { src: '/media/catalogo-servicios/xv-pista-iluminada-01.jpeg', alt: 'Baile de quince en pista iluminada' },
      { src: '/media/catalogo-servicios/xv-mesa-principal-ak-02.jpeg', alt: 'Mesa principal de quince con equipo AK' },
      { src: '/media/catalogo-servicios/candy-bar-xv-luces-04.jpeg', alt: 'Candy bar iluminado para fiesta de quince' },
    ],
  },
  {
    id: 'boda',
    label: 'Bodas',
    eventType: 'Boda',
    eyebrow: 'Catalogo bodas',
    title: 'Una boda completa, cuidada como una sola experiencia.',
    description: 'Salon, montaje, catering, decoracion, discoteca, fotografia, filmacion, barra y recuerdos organizados sin proveedores sueltos.',
    heroImage: '/media/catalogo-servicios/boda_persuasiva.png',
    imageAlt: 'Pareja celebrando su boda con familiares e invitados',
    accent: '#be123c',
    highlights: [
      'Montaje, manteleria, vajilla y personal',
      'Decoracion de ceremonia y fiesta',
      'Fotografia y filmacion de cada momento',
      'Barra, reposteria y servicios adicionales',
    ],
    galleryImages: [
      { src: '/media/catalogo-servicios/decoracion-boda-mesa-01.jpeg', alt: 'Decoracion de mesa principal para boda' },
      { src: '/media/catalogo-servicios/catering-mesa-ak-01.jpeg', alt: 'Servicio de catering preparado por AK Producciones' },
      { src: '/media/catalogo-servicios/barra-tragos-ak-01.jpeg', alt: 'Barra de tragos AK para bodas y eventos' },
    ],
  },
  {
    id: 'fiesta',
    label: 'Fiestas',
    eventType: 'Fiesta',
    eyebrow: 'Catalogo celebraciones',
    title: 'Cumpleanos y celebraciones con todo resuelto en un lugar.',
    description: 'Una propuesta flexible para aniversarios, cumpleanos y fiestas sociales, con servicios combinables segun tus invitados y tu estilo.',
    heroImage: '/media/catalogo-servicios/familia_feliz_evento.png',
    imageAlt: 'Familia celebrando una fiesta producida por AK',
    accent: '#2563eb',
    highlights: [
      'Catering y bebidas segun el tipo de fiesta',
      'Discoteca, pista y entretenimiento',
      'Decoracion, torta y mesa de postres',
      'Fotos, recuerdos y experiencia social',
    ],
    galleryImages: [
      { src: '/media/catalogo-servicios/discoteca-salon-ak-02.jpeg', alt: 'Salon con discoteca e iluminacion AK' },
      { src: '/media/catalogo-servicios/social_persuasivo.png', alt: 'Invitados compartiendo durante una fiesta' },
      { src: '/media/catalogo-servicios/reposteria-tortas-ak-03.jpeg', alt: 'Mesa de tortas y reposteria AK' },
    ],
  },
];

export const HERO_IMAGES = LED_EVENT_CATALOGS.map((catalog) => catalog.heroImage);

export const SERVICE_MAP: PortfolioService[] = [
  {
    id: 'salon',
    title: 'Salon y montaje',
    phase: 'Antes',
    icon: 'salon',
    tagline: 'El lugar se muestra como experiencia, no como una lista.',
    details: 'Fotos de referencia, capacidad, sectores, estilo de mesa y recorrido visual para que el cliente imagine la fiesta armada.',
    imageUrl: '/media/catalogo-servicios/salon-discoteca-ak-01.jpeg',
    accent: '#dc2626',
  },
  {
    id: 'decoracion',
    title: 'Decoracion',
    phase: 'Antes',
    icon: 'decoracion',
    tagline: 'Colores, ambientacion y mesa dulce con vista previa.',
    details: 'La propuesta visual puede partir de ejemplos y luego reemplazarse con fotos reales del evento o del salon elegido.',
    imageUrl: '/media/catalogo-servicios/decoracion-xv-lila-01.jpeg',
    accent: '#e11d48',
  },
  {
    id: 'catering',
    title: 'Catering y menu',
    phase: 'Antes',
    icon: 'catering',
    tagline: 'El cliente entiende que va a comer y como se sirve.',
    details: 'Entradas, menu adolescente/adulto, opciones y fotos de ejemplo para que la decision sea simple y visual.',
    imageUrl: '/media/catalogo-servicios/catering-mesa-ak-01.jpeg',
    accent: '#f59e0b',
  },
  {
    id: 'barra',
    title: 'Barra y brindis',
    phase: 'Durante',
    icon: 'barra',
    tagline: 'La barra se vende por energia y momentos.',
    details: 'Tragos, brindis, sectores de servicio y fotos para que se vea premium antes de hablar de precio.',
    imageUrl: '/media/catalogo-servicios/barra-tragos-ak-01.jpeg',
    accent: '#06b6d4',
  },
  {
    id: 'musica',
    title: 'Musica y fiesta',
    phase: 'Durante',
    icon: 'musica',
    tagline: 'La pista se muestra con ritmo, luces y participacion.',
    details: 'DJ, playlist, momentos especiales, entrada, vals o baile principal conectados a la experiencia del evento.',
    imageUrl: '/media/catalogo-servicios/discoteca-salon-ak-02.jpeg',
    accent: '#7c3aed',
  },
  {
    id: 'foto-video',
    title: 'Foto y video',
    phase: 'Durante',
    icon: 'fotoVideo',
    tagline: 'El recuerdo se vende viendo recuerdos.',
    details: 'Galerias de ejemplo, momentos destacados y entrega posterior integrada a la experiencia digital.',
    imageUrl: '/media/catalogo-servicios/fotografia_cabina_img_268_p29_x1727.jpeg',
    accent: '#2563eb',
  },
  {
    id: 'invitacion',
    title: 'Invitacion digital',
    phase: 'Antes',
    icon: 'invitacion',
    tagline: 'La primera impresion de la fiesta empieza en el celular.',
    details: 'Fotos de ejemplo, nombre, fecha, ubicacion, RSVP y opcion de sumar la fiesta al calendario.',
    imageUrl: '/media/catalogo-servicios/recepcion-display-evento-01.jpeg',
    accent: '#db2777',
  },
  {
    id: 'portal-cliente',
    title: 'Portal del cliente',
    phase: 'Antes',
    icon: 'portalCliente',
    tagline: 'El cliente ve todo claro sin pedirlo por WhatsApp.',
    details: 'Pagos, documentos, reuniones, tareas, invitados y decisiones importantes ordenadas por evento.',
    imageUrl: '/media/catalogo-servicios/organizador_equipo.png',
    accent: '#dc2626',
  },
  {
    id: 'portal-invitado',
    title: 'Portal del invitado',
    phase: 'Antes',
    icon: 'portalInvitado',
    tagline: 'Confirmar asistencia tiene que ser facil desde el celular.',
    details: 'RSVP, ubicacion, calendario, mensajes, datos utiles y acceso a la experiencia social privada.',
    imageUrl: '/media/catalogo-servicios/social_persuasivo.png',
    accent: '#16a34a',
  },
  {
    id: 'muro-social',
    title: 'Muro social',
    phase: 'Durante',
    icon: 'muroSocial',
    tagline: 'Lo que la gente sube se convierte en parte de la fiesta.',
    details: 'Mensajes, fotos, destacados y moderacion para pantalla grande durante el evento.',
    imageUrl: '/media/catalogo-servicios/tecnologia_fiesta.png',
    accent: '#f97316',
  },
  {
    id: 'zona-digital-adolescentes',
    title: 'Zona digital adolescente',
    phase: 'Durante',
    icon: 'zonaDigital',
    tagline: 'Retos, juegos, emojis, ranking y QR para que los adolescentes participen.',
    details: 'Se vende como una zona propia de la fiesta: el invitado entra con QR, elige retos, sube fotos, vota, reacciona y aparece en pantalla si el operador lo aprueba.',
    imageUrl: '/media/catalogo-servicios/quinceanera_persuasiva.png',
    accent: '#ec4899',
  },
  {
    id: 'entretenimiento-viral',
    title: 'Fotocabina, 360, Bogue y espejo',
    phase: 'Durante',
    icon: 'fotocabina',
    tagline: 'Estaciones para crear fotos, loops y clips listos para compartir.',
    details: 'La pantalla LED muestra que cada estacion puede tener plantilla, filtro, marca del evento, QR, galeria y salida hacia el muro social.',
    imageUrl: '/media/catalogo-servicios/photobooth-vogue-01.jpeg',
    accent: '#8b5cf6',
  },
  {
    id: 'barra-tecnologica',
    title: 'Barra tecnologica tactil',
    phase: 'Durante',
    icon: 'barra',
    tagline: 'El invitado elige tragos y el barman recibe la cola en otra pantalla.',
    details: 'La venta no es solo bebida: es una experiencia interactiva con descripcion, video, pedidos en pantalla, fotos y reglas para seguir redes antes de compartir.',
    imageUrl: '/media/catalogo-servicios/barra-tragos-ak-01.jpeg',
    accent: '#06b6d4',
  },
  {
    id: 'pantalla-led',
    title: 'Pantalla LED',
    phase: 'Durante',
    icon: 'pantallaLed',
    tagline: 'La tecnologia se ve en vivo, no queda escondida.',
    details: 'Presentacion, agenda, mensajes, fotos y momentos preparados para verse bien en formato gigante.',
    imageUrl: '/media/catalogo-servicios/tecnologia_fiesta.png',
    accent: '#dc2626',
  },
  {
    id: 'pantallas-totem',
    title: 'Totems sincronizados',
    phase: 'Durante',
    icon: 'totems',
    tagline: 'Pantallas verticales con fondos movibles, QR, fotos y nombre del evento.',
    details: 'Sirven para entrada, barra, pista o selfie point. Se pueden personalizar por fiesta y sincronizar con muro social, invitacion y pantalla LED.',
    imageUrl: '/media/catalogo-servicios/recepcion-display-evento-01.jpeg',
    accent: '#14b8a6',
  },
  {
    id: 'modo-audioritmico',
    title: 'Modo discoteca audiorritmico',
    phase: 'Durante',
    icon: 'audioRitmico',
    tagline: 'Visuales que se mueven con el momento de baile.',
    details: 'La pantalla deja de ser solo mural y pasa a modo show: figuras, pulsos, colores, nombres, hashtag y QR para seguir participando.',
    imageUrl: '/media/catalogo-servicios/xv-pista-iluminada-01.jpeg',
    accent: '#f43f5e',
  },
  {
    id: 'coordinacion',
    title: 'Coordinacion AK',
    phase: 'Antes',
    icon: 'coordinacion',
    tagline: 'Cada decision queda conectada con el equipo.',
    details: 'Responsables, reuniones, tareas, pendientes y avisos para que nada dependa de acordarse de memoria.',
    imageUrl: '/media/catalogo-servicios/montaje_equipo.png',
    accent: '#0f766e',
  },
  {
    id: 'agenda',
    title: 'Agenda y recordatorios',
    phase: 'Antes',
    icon: 'agenda',
    tagline: 'Reuniones y momentos importantes sincronizados.',
    details: 'Fechas, reuniones, recordatorios por mail y calendario para clientes, equipo e invitados cuando corresponda.',
    imageUrl: '/media/catalogo-servicios/organizador_equipo.png',
    accent: '#4f46e5',
  },
  {
    id: 'post-fiesta',
    title: 'Post fiesta',
    phase: 'Despues',
    icon: 'postFiesta',
    tagline: 'El evento no termina cuando se apagan las luces.',
    details: 'Album final, recuerdos, agradecimientos, referidos y material para seguir vendiendo la experiencia.',
    imageUrl: '/media/catalogo-servicios/familia_feliz_evento.png',
    accent: '#0891b2',
  },
];

export const TECHNOLOGY_STEPS: TechnologyStep[] = [
  {
    id: 'invitacion',
    eyebrow: 'Primer contacto',
    title: 'Invitacion personalizada',
    description: 'El invitado recibe una pagina linda, con fotos de ejemplo reemplazables, fecha, lugar y confirmacion rapida.',
    imageUrl: '/media/catalogo-servicios/recepcion-display-evento-01.jpeg',
    accent: '#e11d48',
  },
  {
    id: 'portal-cliente',
    eyebrow: 'Organizacion',
    title: 'Portal del cliente',
    description: 'El cliente ve pagos, documentos, reuniones, invitados, tareas y todo lo que falta para llegar tranquilo.',
    imageUrl: '/media/catalogo-servicios/organizador_equipo.png',
    accent: '#dc2626',
  },
  {
    id: 'portal-invitado',
    eyebrow: 'Invitados',
    title: 'Portal del invitado',
    description: 'Cada invitado confirma, guarda la fecha y entra al espacio social sin necesitar computadora.',
    imageUrl: '/media/catalogo-servicios/social_persuasivo.png',
    accent: '#16a34a',
  },
  {
    id: 'muro-social',
    eyebrow: 'En la fiesta',
    title: 'Muro social en vivo',
    description: 'Fotos, mensajes y momentos destacados pueden verse en pantalla grande con moderacion.',
    imageUrl: '/media/catalogo-servicios/tecnologia_fiesta.png',
    accent: '#f97316',
  },
  {
    id: 'zona-digital',
    eyebrow: 'Adolescentes',
    title: 'Zona digital con retos y juegos',
    description: 'El invitado entra con QR, juega, vota, reacciona con emojis, sube fotos y participa sin instalar nada.',
    imageUrl: '/media/catalogo-servicios/quinceanera_persuasiva.png',
    accent: '#ec4899',
  },
  {
    id: 'entretenimiento-viral',
    eyebrow: 'Contenido',
    title: 'Fotocabina, 360, Bogue y espejo',
    description: 'Las estaciones generan fotos, GIFs, loops o videos con plantilla del evento, QR y salida hacia galeria o muro social.',
    imageUrl: '/media/catalogo-servicios/photobooth-vogue-01.jpeg',
    accent: '#8b5cf6',
  },
  {
    id: 'barra-tecnologica',
    eyebrow: 'Barra',
    title: 'Pedidos tactiles y pantalla del barman',
    description: 'El invitado elige el trago, ve ingredientes o video, confirma el pedido y el barman lo recibe ordenado en otra pantalla.',
    imageUrl: '/media/catalogo-servicios/barra-tragos-ak-01.jpeg',
    accent: '#06b6d4',
  },
  {
    id: 'led',
    eyebrow: 'Show visual',
    title: 'Pantalla LED y recorrido',
    description: 'El evento se presenta con agenda, recuerdos, tecnologia y momentos para que se vea premium.',
    imageUrl: '/media/catalogo-servicios/tecnologia_fiesta.png',
    accent: '#7c3aed',
  },
  {
    id: 'totems',
    eyebrow: 'Pantallas',
    title: 'Totems y LED sincronizados',
    description: 'Entrada, barra, pista y selfie points pueden mostrar fondo animado, QR, fotos, nombre del protagonista y llamados a participar.',
    imageUrl: '/media/catalogo-servicios/recepcion-display-evento-01.jpeg',
    accent: '#14b8a6',
  },
  {
    id: 'recuerdos',
    eyebrow: 'Despues',
    title: 'Album y cierre',
    description: 'AK puede dejar un resumen final para recuerdos, referidos y comunicacion posterior.',
    imageUrl: '/media/catalogo-servicios/familia_feliz_evento.png',
    accent: '#0891b2',
  },
];

export const LED_TECHNOLOGY_PACKAGES: LedTechnologyPackage[] = [
  {
    id: 'experiencia-digital-ak',
    title: 'Experiencia digital AK',
    sellAs: 'Base tecnologica para vender una fiesta moderna',
    clientValue: 'El cliente entiende que no contrata servicios sueltos: contrata organizacion, visuales y participacion conectada.',
    includes: ['Invitacion web', 'Portal cliente', 'Portal invitado', 'RSVP', 'Muro social', 'Album final'],
    accent: '#dc2626',
  },
  {
    id: 'zona-digital-adolescentes',
    title: 'Zona digital adolescente',
    sellAs: 'Producto premium para XV, cumpleanos y fiestas con publico joven',
    clientValue: 'Los adolescentes tienen un espacio propio para jugar, subir fotos, reaccionar, competir y verse en pantalla.',
    includes: ['Retos', 'Juegos', 'Emojis', 'Ranking', 'Votaciones', 'Moderacion'],
    accent: '#ec4899',
  },
  {
    id: 'entretenimiento-viral',
    title: 'Entretenimiento viral',
    sellAs: 'Estaciones de contenido para generar recuerdos compartibles',
    clientValue: 'Fotocabina, 360, Bogue y espejo magico dejan contenido listo para galeria, muro y redes.',
    includes: ['Fotocabina', 'Plataforma 360', 'Bogue', 'Espejo magico', 'QR', 'Plantillas'],
    accent: '#8b5cf6',
  },
  {
    id: 'pantallas-sincronizadas',
    title: 'Pantallas sincronizadas',
    sellAs: 'Show visual para LED, pista, entrada, barra y totems',
    clientValue: 'La tecnologia se ve en el salon: fondos movibles, fotos, QR, mensajes y modo discoteca audiorritmico.',
    includes: ['Pantalla LED', 'Totems', 'QR', 'Muro social', 'Audio ritmo', 'Hashtag'],
    accent: '#14b8a6',
  },
  {
    id: 'barra-tecnologica',
    title: 'Barra tecnologica',
    sellAs: 'Pantalla tactil para pedir tragos y activar contenido social',
    clientValue: 'El invitado ve el trago, sus ingredientes o video, pide en pantalla y puede sumar una foto compartible.',
    includes: ['Menu tactil', 'Cola del barman', 'Videos', 'Fotos', 'Redes AK', 'Moderacion'],
    accent: '#06b6d4',
  },
];

export const LED_SALES_STORYLINE: LedSalesStoryStep[] = [
  {
    id: 'abrir-wow',
    title: 'Abrir con el wow visual',
    goal: 'Que el prospecto se imagine su fiesta en pantalla grande antes de hablar de precio.',
    howToShow: 'Usar hero, fotos grandes, nombre del protagonista y selector LED/PC/tablet/celular.',
    proof: 'La presentacion ya adapta la misma experiencia a pantalla gigante y telefono.',
    accent: '#dc2626',
  },
  {
    id: 'mapa-fiesta',
    title: 'Mostrar el mapa completo',
    goal: 'Ordenar la conversacion: antes, durante y despues de la fiesta.',
    howToShow: 'Tocar nodos del mapa semantico y explicar cada servicio por beneficio.',
    proof: 'Salon, decoracion, catering, musica, foto, invitacion, portales, muro y post fiesta quedan conectados.',
    accent: '#f59e0b',
  },
  {
    id: 'producto-tecnologico',
    title: 'Vender Tecnologia AK como producto',
    goal: 'Separar lo comun de lo diferencial: AK suma una experiencia digital propia.',
    howToShow: 'Presentar paquetes: experiencia digital, zona adolescente, entretenimiento viral, pantallas y barra tecnologica.',
    proof: 'Cada paquete tiene nombre, valor para el cliente y piezas activables segun lo contratado.',
    accent: '#8b5cf6',
  },
  {
    id: 'zona-fiesta',
    title: 'Explicar la zona tecnologica de la fiesta',
    goal: 'Que el cliente entienda como participa la gente en vivo.',
    howToShow: 'Mostrar retos, juegos, fotocabina, 360, Bogue, espejo, barra tactil, totems, QR y muro social.',
    proof: 'La zona se puede activar o apagar por modulo para no prometer algo que no esta contratado.',
    accent: '#ec4899',
  },
  {
    id: 'cerrar-decision',
    title: 'Cerrar con seleccion y proximo paso',
    goal: 'Pasar del entusiasmo a una decision clara.',
    howToShow: 'Marcar lo que interesa, lo incluido y lo pendiente; despues abrir presupuesto o reunion.',
    proof: 'El vendedor LED ya tiene flujo para preparar presupuesto con los items elegidos.',
    accent: '#16a34a',
  },
];

export const LED_SALES_IMPACT_STATS: LedSalesImpactStat[] = [
  {
    label: 'Primera impresion',
    value: '90 seg',
    copy: 'Para que el cliente entienda que AK vende una fiesta completa, no una lista de precios.',
    accent: '#dc2626',
  },
  {
    label: 'Efecto showroom',
    value: '4 vistas',
    copy: 'Pantalla gigante, PC, tablet y celular para mostrar exactamente donde vive cada persona la experiencia.',
    accent: '#2563eb',
  },
  {
    label: 'Venta premium',
    value: '5 paquetes',
    copy: 'Experiencia digital, zona adolescente, entretenimiento viral, pantallas sincronizadas y barra tecnologica.',
    accent: '#8b5cf6',
  },
  {
    label: 'Cierre simple',
    value: '1 ruta',
    copy: 'Ver, elegir, marcar interes y pasar a presupuesto o reunion sin perder el entusiasmo.',
    accent: '#16a34a',
  },
];

export const LED_CLIENT_DECISION_SCENES: LedClientDecisionScene[] = [
  {
    id: 'familia-ve-fiesta',
    eyebrow: 'Momento 1',
    title: 'La familia ve su fiesta antes de contratar',
    description: 'La venta arranca mostrando el nombre, el tipo de evento, fotos de referencia y el recorrido antes/durante/despues.',
    sellerLine: 'No te estoy contando la fiesta: te la estoy mostrando.',
    bullets: ['Foto grande', 'Nombre del protagonista', 'Mapa de servicios', 'Vista celular'],
    imageUrl: '/media/catalogo-servicios/boda_persuasiva.png',
    accent: '#dc2626',
  },
  {
    id: 'cliente-siente-control',
    eyebrow: 'Momento 2',
    title: 'El cliente entiende que va a estar acompanado',
    description: 'Portal, reuniones, pagos, invitados, documentos y recordatorios se presentan como tranquilidad, no como botones tecnicos.',
    sellerLine: 'Todo lo importante queda ordenado en tu portal.',
    bullets: ['Portal cliente', 'Agenda', 'Pagos visibles', 'Pendientes claros'],
    imageUrl: '/media/catalogo-servicios/organizador_equipo.png',
    accent: '#2563eb',
  },
  {
    id: 'adolescentes-participan',
    eyebrow: 'Momento 3',
    title: 'Los adolescentes tienen una zona propia',
    description: 'Retos, juegos, emojis, ranking, fotocabina, 360, Bogue, espejo y QR se muestran como entretenimiento real de la fiesta.',
    sellerLine: 'No es una pantalla decorativa: es una zona viva para participar.',
    bullets: ['Retos y juegos', 'Fotos y clips', 'Ranking', 'Moderacion'],
    imageUrl: '/media/catalogo-servicios/quinceanera_persuasiva.png',
    accent: '#ec4899',
  },
  {
    id: 'show-en-vivo',
    eyebrow: 'Momento 4',
    title: 'La tecnologia aparece en el salon',
    description: 'Pantalla LED, totems, barra tactil, muro social y modo audiorritmico se conectan para que el valor se vea en vivo.',
    sellerLine: 'La fiesta se vuelve interactiva en todos los sectores.',
    bullets: ['LED', 'Totems', 'Barra tactil', 'Audio ritmo'],
    imageUrl: '/media/catalogo-servicios/tecnologia_fiesta.png',
    accent: '#14b8a6',
  },
  {
    id: 'cierre-presupuesto',
    eyebrow: 'Momento 5',
    title: 'El deseo baja a una decision concreta',
    description: 'Despues del impacto visual se marcan los paquetes que interesan y se pasa al presupuesto con una historia ya entendida.',
    sellerLine: 'Ahora elegimos que experiencia queres activar para tu fiesta.',
    bullets: ['Incluido', 'Opcional', 'Regalo', 'Presupuesto'],
    imageUrl: '/media/catalogo-servicios/familia_feliz_evento.png',
    accent: '#16a34a',
  },
];

export const INVITATION_TEMPLATES: InvitationTemplate[] = [
  {
    id: 'xv-glow',
    title: 'XV Glow',
    mood: 'Juvenil, luces y entrada fuerte',
    description: 'Ideal para quinceanera con portada visual, musica, RSVP y acceso a muro social.',
    imageUrl: '/media/catalogo-servicios/quinceanera_hero.png',
    accent: '#e11d48',
  },
  {
    id: 'boda-clasica',
    title: 'Boda elegante',
    mood: 'Blanco, flores, ceremonia y fiesta',
    description: 'Muestra historia, fecha, ubicacion, galeria y confirmacion simple para invitados.',
    imageUrl: '/media/catalogo-servicios/boda_persuasiva.png',
    accent: '#b91c1c',
  },
  {
    id: 'club-uruguay',
    title: 'Club Uruguay',
    mood: 'Salon historico, montaje y experiencia premium',
    description: 'Pensada para vender el salon con fotos de ejemplo, distribucion, servicios y tecnologia incluida.',
    imageUrl: '/media/catalogo-servicios/salon-discoteca-ak-01.jpeg',
    accent: '#dc2626',
  },
  {
    id: 'cumple-premium',
    title: 'Cumple premium',
    mood: 'Divertido, social y muy visual',
    description: 'Combina invitacion, asistencia, fotos, mensajes y pantalla en vivo.',
    imageUrl: '/media/catalogo-servicios/familia_feliz_evento.png',
    accent: '#f97316',
  },
];
