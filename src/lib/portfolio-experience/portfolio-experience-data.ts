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

export const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1800&q=82',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1800&q=82',
  'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1800&q=82',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1800&q=82',
];

export const SERVICE_MAP: PortfolioService[] = [
  {
    id: 'salon',
    title: 'Salon y montaje',
    phase: 'Antes',
    icon: 'salon',
    tagline: 'El lugar se muestra como experiencia, no como una lista.',
    details: 'Fotos de referencia, capacidad, sectores, estilo de mesa y recorrido visual para que el cliente imagine la fiesta armada.',
    imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1400&q=82',
    accent: '#dc2626',
  },
  {
    id: 'decoracion',
    title: 'Decoracion',
    phase: 'Antes',
    icon: 'decoracion',
    tagline: 'Colores, ambientacion y mesa dulce con vista previa.',
    details: 'La propuesta visual puede partir de ejemplos y luego reemplazarse con fotos reales del evento o del salon elegido.',
    imageUrl: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&w=1400&q=82',
    accent: '#e11d48',
  },
  {
    id: 'catering',
    title: 'Catering y menu',
    phase: 'Antes',
    icon: 'catering',
    tagline: 'El cliente entiende que va a comer y como se sirve.',
    details: 'Entradas, menu adolescente/adulto, opciones y fotos de ejemplo para que la decision sea simple y visual.',
    imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1400&q=82',
    accent: '#f59e0b',
  },
  {
    id: 'barra',
    title: 'Barra y brindis',
    phase: 'Durante',
    icon: 'barra',
    tagline: 'La barra se vende por energia y momentos.',
    details: 'Tragos, brindis, sectores de servicio y fotos para que se vea premium antes de hablar de precio.',
    imageUrl: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1400&q=82',
    accent: '#06b6d4',
  },
  {
    id: 'musica',
    title: 'Musica y fiesta',
    phase: 'Durante',
    icon: 'musica',
    tagline: 'La pista se muestra con ritmo, luces y participacion.',
    details: 'DJ, playlist, momentos especiales, entrada, vals o baile principal conectados a la experiencia del evento.',
    imageUrl: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1400&q=82',
    accent: '#7c3aed',
  },
  {
    id: 'foto-video',
    title: 'Foto y video',
    phase: 'Durante',
    icon: 'fotoVideo',
    tagline: 'El recuerdo se vende viendo recuerdos.',
    details: 'Galerias de ejemplo, momentos destacados y entrega posterior integrada a la experiencia digital.',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=82',
    accent: '#2563eb',
  },
  {
    id: 'invitacion',
    title: 'Invitacion digital',
    phase: 'Antes',
    icon: 'invitacion',
    tagline: 'La primera impresion de la fiesta empieza en el celular.',
    details: 'Fotos de ejemplo, nombre, fecha, ubicacion, RSVP y opcion de sumar la fiesta al calendario.',
    imageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1400&q=82',
    accent: '#db2777',
  },
  {
    id: 'portal-cliente',
    title: 'Portal del cliente',
    phase: 'Antes',
    icon: 'portalCliente',
    tagline: 'El cliente ve todo claro sin pedirlo por WhatsApp.',
    details: 'Pagos, documentos, reuniones, tareas, invitados y decisiones importantes ordenadas por evento.',
    imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=82',
    accent: '#dc2626',
  },
  {
    id: 'portal-invitado',
    title: 'Portal del invitado',
    phase: 'Antes',
    icon: 'portalInvitado',
    tagline: 'Confirmar asistencia tiene que ser facil desde el celular.',
    details: 'RSVP, ubicacion, calendario, mensajes, datos utiles y acceso a la experiencia social privada.',
    imageUrl: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1400&q=82',
    accent: '#16a34a',
  },
  {
    id: 'muro-social',
    title: 'Muro social',
    phase: 'Durante',
    icon: 'muroSocial',
    tagline: 'Lo que la gente sube se convierte en parte de la fiesta.',
    details: 'Mensajes, fotos, destacados y moderacion para pantalla grande durante el evento.',
    imageUrl: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1400&q=82',
    accent: '#f97316',
  },
  {
    id: 'pantalla-led',
    title: 'Pantalla LED',
    phase: 'Durante',
    icon: 'pantallaLed',
    tagline: 'La tecnologia se ve en vivo, no queda escondida.',
    details: 'Presentacion, agenda, mensajes, fotos y momentos preparados para verse bien en formato gigante.',
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1400&q=82',
    accent: '#dc2626',
  },
  {
    id: 'coordinacion',
    title: 'Coordinacion AK',
    phase: 'Antes',
    icon: 'coordinacion',
    tagline: 'Cada decision queda conectada con el equipo.',
    details: 'Responsables, reuniones, tareas, pendientes y avisos para que nada dependa de acordarse de memoria.',
    imageUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=82',
    accent: '#0f766e',
  },
  {
    id: 'agenda',
    title: 'Agenda y recordatorios',
    phase: 'Antes',
    icon: 'agenda',
    tagline: 'Reuniones y momentos importantes sincronizados.',
    details: 'Fechas, reuniones, recordatorios por mail y calendario para clientes, equipo e invitados cuando corresponda.',
    imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=82',
    accent: '#4f46e5',
  },
  {
    id: 'post-fiesta',
    title: 'Post fiesta',
    phase: 'Despues',
    icon: 'postFiesta',
    tagline: 'El evento no termina cuando se apagan las luces.',
    details: 'Album final, recuerdos, agradecimientos, referidos y material para seguir vendiendo la experiencia.',
    imageUrl: 'https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1400&q=82',
    accent: '#0891b2',
  },
];

export const TECHNOLOGY_STEPS: TechnologyStep[] = [
  {
    id: 'invitacion',
    eyebrow: 'Primer contacto',
    title: 'Invitacion personalizada',
    description: 'El invitado recibe una pagina linda, con fotos de ejemplo reemplazables, fecha, lugar y confirmacion rapida.',
    imageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1400&q=82',
    accent: '#e11d48',
  },
  {
    id: 'portal-cliente',
    eyebrow: 'Organizacion',
    title: 'Portal del cliente',
    description: 'El cliente ve pagos, documentos, reuniones, invitados, tareas y todo lo que falta para llegar tranquilo.',
    imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=82',
    accent: '#dc2626',
  },
  {
    id: 'portal-invitado',
    eyebrow: 'Invitados',
    title: 'Portal del invitado',
    description: 'Cada invitado confirma, guarda la fecha y entra al espacio social sin necesitar computadora.',
    imageUrl: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1400&q=82',
    accent: '#16a34a',
  },
  {
    id: 'muro-social',
    eyebrow: 'En la fiesta',
    title: 'Muro social en vivo',
    description: 'Fotos, mensajes y momentos destacados pueden verse en pantalla grande con moderacion.',
    imageUrl: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1400&q=82',
    accent: '#f97316',
  },
  {
    id: 'led',
    eyebrow: 'Show visual',
    title: 'Pantalla LED y recorrido',
    description: 'El evento se presenta con agenda, recuerdos, tecnologia y momentos para que se vea premium.',
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1400&q=82',
    accent: '#7c3aed',
  },
  {
    id: 'recuerdos',
    eyebrow: 'Despues',
    title: 'Album y cierre',
    description: 'AK puede dejar un resumen final para recuerdos, referidos y comunicacion posterior.',
    imageUrl: 'https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1400&q=82',
    accent: '#0891b2',
  },
];

export const INVITATION_TEMPLATES: InvitationTemplate[] = [
  {
    id: 'xv-glow',
    title: 'XV Glow',
    mood: 'Juvenil, luces y entrada fuerte',
    description: 'Ideal para quinceanera con portada visual, musica, RSVP y acceso a muro social.',
    imageUrl: 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&w=1400&q=82',
    accent: '#e11d48',
  },
  {
    id: 'boda-clasica',
    title: 'Boda elegante',
    mood: 'Blanco, flores, ceremonia y fiesta',
    description: 'Muestra historia, fecha, ubicacion, galeria y confirmacion simple para invitados.',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=82',
    accent: '#b91c1c',
  },
  {
    id: 'club-uruguay',
    title: 'Club Uruguay',
    mood: 'Salon historico, montaje y experiencia premium',
    description: 'Pensada para vender el salon con fotos de ejemplo, distribucion, servicios y tecnologia incluida.',
    imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1400&q=82',
    accent: '#dc2626',
  },
  {
    id: 'cumple-premium',
    title: 'Cumple premium',
    mood: 'Divertido, social y muy visual',
    description: 'Combina invitacion, asistencia, fotos, mensajes y pantalla en vivo.',
    imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1400&q=82',
    accent: '#f97316',
  },
];
