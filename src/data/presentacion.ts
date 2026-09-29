// Presentation Mode data — used by /presentacion (LED showroom kiosk)

export interface EventType {
  id: string;
  label: string;
  emoji: string;
  color: string;          // Tailwind bg color class (dark-mode safe)
  textColor: string;      // Tailwind text color class
  budgetTipo: string;     // Value sent to /presupuestos/nuevo/crear?tipo=
}

export interface Service {
  id: string;
  label: string;
  emoji: string;
  imageUrl?: string;      // Optional photo for service card
  description: string;
  specs: string[];        // Bullet-point specifications
}

// ── Event Types ────────────────────────────────────────────────────────────────

export const EVENT_TYPES: EventType[] = [
  {
    id: 'boda',
    label: 'Boda',
    emoji: '💍',
    color: 'bg-rose-600',
    textColor: 'text-rose-100',
    budgetTipo: 'Boda',
  },
  {
    id: '15-anos',
    label: '15 Años',
    emoji: '👑',
    color: 'bg-purple-700',
    textColor: 'text-purple-100',
    budgetTipo: '15 Años',
  },
  {
    id: 'cumpleanos',
    label: 'Cumpleaños',
    emoji: '🎂',
    color: 'bg-amber-600',
    textColor: 'text-amber-100',
    budgetTipo: 'Cumpleaños',
  },
  {
    id: 'infantil',
    label: 'Infantil',
    emoji: '🎈',
    color: 'bg-sky-600',
    textColor: 'text-sky-100',
    budgetTipo: 'Infantil',
  },
  {
    id: 'empresarial',
    label: 'Empresarial',
    emoji: '🏢',
    color: 'bg-emerald-700',
    textColor: 'text-emerald-100',
    budgetTipo: 'Empresarial',
  },
];

// ── Services ───────────────────────────────────────────────────────────────────

export const SERVICES: Service[] = [
  {
    id: 'catering',
    label: 'Catering',
    emoji: '🍽️',
    description:
      'Menú diseñado a medida con ingredientes frescos y servicio de mozos profesionales. Lo que sobra, se devuelve.',
    specs: [
      'Menú personalizado (adultos, adolescentes e infantil)',
      'Entrada, plato principal y postre',
      'Servicio de mozos profesional',
      'Vajilla y cristalería incluida',
      'Lo que sobra es tuyo — sin letra chica',
      'Adaptación a dietas especiales',
    ],
  },
  {
    id: 'decoracion',
    label: 'Decoración',
    emoji: '🎀',
    description:
      'Ambientación completa y personalizada según el tema elegido: flores, telas, globos, iluminación decorativa y más.',
    specs: [
      'Diseño personalizado por temática',
      'Arreglos florales o artificiales',
      'Globología y columnatas',
      'Iluminación decorativa ambiental',
      'Mesa de honor / candy bar',
      'Cartelería y detalles personalizados',
    ],
  },
  {
    id: 'discoteca',
    label: 'Discoteca / Iluminación',
    emoji: '🎶',
    description:
      'DJ profesional con equipo de sonido de alta calidad e iluminación show para mantener la pista encendida toda la noche.',
    specs: [
      'DJ profesional con +10 años de experiencia',
      'Equipo de sonido profesional',
      'Luces show: cabezas móviles, strobo, laser',
      'Pantalla LED y visuales (a confirmar)',
      'Playlist personalizada con el cliente',
      'Horario extendido disponible',
    ],
  },
  {
    id: 'foto-video',
    label: 'Foto / Video',
    emoji: '📸',
    description:
      'Cobertura fotográfica y fílmica completa del evento para que cada momento quede registrado en alta calidad.',
    specs: [
      'Fotógrafo profesional (cobertura completa)',
      'Video del evento en alta definición',
      'Edición y entrega en galería digital',
      'Video resumen (clip corto para redes)',
      'Impresión de fotos (consultar)',
      'Drone (consultar disponibilidad)',
    ],
  },
  {
    id: 'barra',
    label: 'Barra',
    emoji: '🍹',
    description:
      'Barra completa con barman profesional, cócteles de autor, bebidas alcohólicas y sin alcohol durante todo el evento.',
    specs: [
      'Barman profesional',
      'Cócteles de autor incluidos',
      'Bebidas alcohólicas y sin alcohol',
      'Barra libre por horas (consultar)',
      'Opción temática (cócteles a color)',
      'Equipo de bar completo',
    ],
  },
  {
    id: 'shows',
    label: 'Shows',
    emoji: '🎭',
    description:
      'Espectáculos en vivo para sorprender a tus invitados: bandas, animadores, shows de magia, circo, y más.',
    specs: [
      'Animadores y maestros de ceremonias',
      'Shows infantiles (magia, payasos, personajes)',
      'Bandas en vivo y grupos musicales',
      'Shows especiales (fuego, circo, etc.)',
      'Sorpresa del cumpleañero / festejado',
      'Coordinación completa del espectáculo',
    ],
  },
  {
    id: 'coordinacion',
    label: 'Coordinación',
    emoji: '📋',
    description:
      'Un coordinador dedicado para que el día del evento vos no tengas que preocuparte por nada. Gestión total.',
    specs: [
      'Coordinador exclusivo el día del evento',
      'Cronograma detallado del evento',
      'Gestión de proveedores y horarios',
      'Reuniones de seguimiento previas',
      'Resolución de imprevistos en tiempo real',
      'Informe post-evento',
    ],
  },
  {
    id: 'mobiliario',
    label: 'Mobiliario',
    emoji: '🪑',
    description:
      'Mesas, sillas, lounge y elementos de salón en distintos estilos para complementar la ambientación de tu evento.',
    specs: [
      'Mesas redondas, cuadradas o rectangulares',
      'Sillas blancas, Tiffany o tapizadas',
      'Mesas lounge y puffs',
      'Mantelería y cubre-sillas',
      'Barra y módulos de buffet',
      'Decoración de mesas incluida',
    ],
  },
];
