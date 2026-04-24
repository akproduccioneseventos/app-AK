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
  const tipoMap: Record<string, InvitacionDigitalConfig['tipoEvento']> = {
    'XV años': '15',
    'XV Años': '15',
    '18 años': '18',
    'Boda': 'boda',
    'Cumpleaños': 'cumpleanos',
    'Bautismo': 'bautismo',
  };

  return {
    ...defaultInvitacionConfig,
    ...existing,
    nombreHomenajeada: existing?.nombreHomenajeada || config.protagonista1Nombre || config.nombreEvento || '',
    nombreHomenajeado2: existing?.nombreHomenajeado2 ?? config.protagonista2Nombre ?? '',
    tipoEvento: existing?.tipoEvento || tipoMap[config.tipoCelebracion || ''] || 'otro',
    fechaEvento: existing?.fechaEvento || config.fechaEvento || '',
    horaEvento: existing?.horaEvento || config.horaInicio || '',
    nombreSalon: existing?.nombreSalon || config.nombreLugar || '',
    direccionSalon: existing?.direccionSalon || config.direccionLugar || '',
    linkMaps: existing?.linkMaps || config.googleMapsUrl || '',
    colorPrincipal: existing?.colorPrincipal || config.primaryColor || defaultInvitacionConfig.colorPrincipal,
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
    descripcion: 'Tonos dorados y champagne, tipografía serif elegante, bordes ornamentales. Ideal para quinceañeras.',
    preview: '✨',
    categorias: ['15', '18', 'boda'],
  },
  ModernoMinimalista: {
    nombre: 'Moderno Minimalista',
    descripcion: 'Diseño limpio, sans-serif, mucho espacio blanco, fotos grandes. Versátil para cualquier evento.',
    preview: '◻️',
    categorias: ['18', 'cumpleanos', 'otro'],
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
    categorias: ['18', 'cumpleanos', 'otro'],
  },
};
