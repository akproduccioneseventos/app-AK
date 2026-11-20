import type { InvitacionDigitalConfig, InvitacionSectionConfig, InvitacionTypographyConfig, FiestaEnPlanificacion } from '@/types/fiesta';

export const DEFAULT_TYPOGRAPHY_CONFIG: InvitacionTypographyConfig = {
  heroTitleMobile: 'text-4xl sm:text-6xl',
  heroTitleDesktop: 'lg:text-8xl',
  sectionTitle: 'text-2xl sm:text-3xl',
  body: 'text-base',
  button: 'text-sm',
  lineHeight: 'leading-tight',
  spacing: 'normal',
};

export const DEFAULT_SECTIONS_CONFIG: InvitacionSectionConfig[] = [
  { id: 'hero', visible: true, order: 1 },
  { id: 'bienvenida', visible: true, order: 2 },
  { id: 'contador', visible: true, order: 3 },
  { id: 'cronograma', visible: true, order: 4 },
  { id: 'ubicacion', visible: true, order: 5 },
  { id: 'dressCode', visible: true, order: 6 },
  { id: 'galeria', visible: true, order: 7 },
  { id: 'regalos', visible: true, order: 8 },
  { id: 'rsvp', visible: true, order: 9 },
  { id: 'muroSocial', visible: true, order: 10 },
];

export const defaultInvitacionConfig: InvitacionDigitalConfig = {
  nombreHomenajeada: '',
  tipoEvento: '15',
  estiloEvento: 'formal',
  colorPrincipal: '#d4a574',
  colorSecundario: '#f5e6d3',
  colorAcento: '#8b6f47',
  colorSugeridoInvitados: '',
  nombreSalon: '',
  direccionSalon: '',
  linkMaps: '',
  fechaEvento: '',
  horaEvento: '',
  fotoPortada: '',
  galeriaFotos: [],
  textoBienvenida: '',
  dressCode: {
    tipo: 'formal',
  },
  mostrarDressCode: true,
  regalos: {
    tipo: 'ninguno',
  },
  plantillaId: 'EleganteDorado',
  rsvpActivo: true,
  contadorActivo: true,
  portalSocialActivo: false,
  typography: DEFAULT_TYPOGRAPHY_CONFIG,
  sectionsConfig: DEFAULT_SECTIONS_CONFIG,
};

export function buildInvitacionConfigFromFiesta(
  fiesta: Pick<FiestaEnPlanificacion, 'configuracion'> & { invitacionConfig?: Partial<InvitacionDigitalConfig> },
  existing?: Partial<InvitacionDigitalConfig>
): InvitacionDigitalConfig {
  const config = fiesta.configuracion;
  const saved = existing ?? fiesta.invitacionConfig;
  const tipoMap: Record<string, InvitacionDigitalConfig['tipoEvento']> = {
    'XV años': '15',
    'XV Años': '15',
    '18 años': '18',
    'Boda': 'boda',
    'Cumpleaños': 'cumpleanos',
    'Bautismo': 'bautismo',
  };

  const digital = (fiesta as any).invitacionDigital;
  const digitalPalette = digital?.cabecera?.paletaColores;

  return {
    ...defaultInvitacionConfig,
    ...saved,
    plantillaId: saved?.plantillaId || digital?.plantilla || defaultInvitacionConfig.plantillaId,
    nombreHomenajeada: saved?.nombreHomenajeada || config.protagonista1Nombre || config.nombreEvento || '',
    nombreHomenajeado2: saved?.nombreHomenajeado2 ?? config.protagonista2Nombre ?? '',
    tipoEvento: saved?.tipoEvento || tipoMap[config.tipoCelebracion || ''] || 'otro',
    fechaEvento: config.fechaEvento || saved?.fechaEvento || '',
    horaEvento: config.horaInicio || saved?.horaEvento || '',
    nombreSalon: config.nombreLugar || saved?.nombreSalon || '',
    direccionSalon: config.direccionLugar || saved?.direccionSalon || '',
    linkMaps: config.googleMapsUrl || saved?.linkMaps || '',
    colorPrincipal: saved?.colorPrincipal || digitalPalette?.primary || config.primaryColor || defaultInvitacionConfig.colorPrincipal,
    colorSecundario: saved?.colorSecundario || digitalPalette?.secondary || defaultInvitacionConfig.colorSecundario,
    colorAcento: saved?.colorAcento || digitalPalette?.accent || defaultInvitacionConfig.colorAcento,
    textoBienvenida: saved?.textoBienvenida || digital?.cabecera?.bienvenida || defaultInvitacionConfig.textoBienvenida,
  };
}

export const TIPO_EVENTO_LABELS: Record<InvitacionDigitalConfig['tipoEvento'], string> = {
  '15': 'Mis 15 Años',
  '18': 'Mis 18 Años',
  'boda': 'Nuestra Boda',
  'cumpleanos': 'Mi Cumpleaños',
  'bautismo': 'Mi Bautismo',
  'otro': 'Evento Especial',
};

export const PLANTILLA_INFO: Record<string, { nombre: string; descripcion: string; preview: string; categorias: string[] }> = {
  EleganteDorado: {
    nombre: 'Elegante Dorado',
    descripcion: 'Tonos dorados y champagne, tipografía serif elegante, bordes ornamentales. Ideal para quinceañeras y bodas.',
    preview: '✨',
    categorias: ['15', '18', 'boda', 'empresa', 'otro'],
  },
  ModernoMinimalista: {
    nombre: 'Moderno Minimalista',
    descripcion: 'Diseño limpio, sans-serif, mucho espacio blanco, fotos grandes. Versátil para cualquier evento y empresas.',
    preview: '◻️',
    categorias: ['18', 'cumpleanos', 'boda', 'otro', 'empresa'],
  },
  RomanticoFloral: {
    nombre: 'Romántico Floral',
    descripcion: 'Bordes florales, colores suaves, fuentes script. Perfecto para bodas y quinceañeras.',
    preview: '🌸',
    categorias: ['boda', '15', 'bautismo'],
  },
  FiestaVibrante: {
    nombre: 'Fiesta Vibrante',
    descripcion: 'Colores vivos, gradientes, estilo juvenil. Ideal para 18 años y cumpleaños.',
    preview: '🎉',
    categorias: ['18', 'cumpleanos', '15', 'otro'],
  },
  XV_NeonParty: {
    nombre: 'XV Neón Party',
    descripcion: 'Estilo nocturno con luces neón fucsia y cyan, ideal para fiestas de 15 y cumpleaños juveniles.',
    preview: '⚡',
    categorias: ['15', '18', 'cumpleanos'],
  },
  XV_PrincesaClasica: {
    nombre: 'XV Princesa Clásica',
    descripcion: 'Pétalos suaves, tipografía clásica en itálica y estética romántica.',
    preview: '👑',
    categorias: ['15', 'boda'],
  },
  XV_GlowInTheDark: {
    nombre: 'XV Glow UV',
    descripcion: 'Colores vibrantes fluorescentes sobre fondo oscuro para fiestas temáticas.',
    preview: '🌟',
    categorias: ['15', '18', 'cumpleanos'],
  },
  XV_MinimalChic: {
    nombre: 'Minimal Chic',
    descripcion: 'Tipografía liviana espaciada y estética editorial de revista.',
    preview: '💎',
    categorias: ['15', 'boda', 'empresa', 'otro'],
  },
};

export function mapTemplateToPlantillaId(
  plantilla?: string
): import('@/types/fiesta').InvitacionPlantillaId {
  switch (plantilla) {
    case 'XvModerna':
      return 'XV_NeonParty';
    case 'XvClasica':
      return 'XV_PrincesaClasica';
    case 'FiestaNoche':
      return 'XV_GlowInTheDark';
    case 'BodaMinimalista':
    case 'Corporativo':
      return 'ModernoMinimalista';
    case 'BodaCampo':
      return 'RomanticoFloral';
    case 'Allegria':
      return 'FiestaVibrante';
    case 'Grazia':
    default:
      return 'EleganteDorado';
  }
}
