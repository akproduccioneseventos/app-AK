
import type { TipoEvento } from './presupuesto';
import type { UnidadServicio } from './empresa';
import type { SocialGalleryPost } from './social-gallery';
import type { ContractType } from './settings';

// --- NOTIFICACIONES ---
export type NotificacionTipo = 'info' | 'aviso' | 'urgente' | 'exito';

export interface Notificacion {
  id: string;
  titulo?: string;
  mensaje: string;
  tipo?: NotificacionTipo;
  href?: string;
  fecha: string;
  leida: boolean;
  icono?: string;
  entidadRelacionadaId?: string;
  rolDestino?: string;
}

// --- INVITADOS ---
export type RsvpStatus = 'Pendiente' | 'Confirmado' | 'Rechazado' | 'Tal vez';
export type CategoriaInvitado = 'Adulto' | 'Niño/Adolescente';

export type DietaryRestriction = 'Ninguna' | 'Celiaco' | 'Vegetariano' | 'Vegano' | 'Sin Gluten' | 'Sin Lactosa' | 'Alergia Mariscos' | 'Alergia Frutos Secos' | 'Otro';

// Phase 3.9: Personalized Guest Experience - Guest profile segments
export type PerfilInvitado = 'General' | 'VIP' | 'Familia' | 'Necesidades Especiales';
/** Alias for PerfilInvitado — used in segmentation views and reports */
export type SegmentoInvitado = PerfilInvitado;

export interface GuestExperienceStats {
  openedAt?: string;
  clickedWhatsapp?: boolean;
  clickedInstagram?: boolean;
  clickedLanding?: boolean;
  clickedSimulator?: boolean;
}

export interface Invitado {
  id: string;
  nombre: string;
  categoria?: CategoriaInvitado;
  contacto?: string;
  rsvp: RsvpStatus;
  partySize?: number;
  tableNumber?: string;
  notes?: string;
  companionNames?: string[];
  checkedIn?: boolean;
  checkInTimestamp?: string;
  isCeliac?: boolean;
  tag?: string;
  dietaryRestriction?: DietaryRestriction;
  alergiasEspecificas?: string;
  cancionesDJ?: string[];
  mensaje?: string;
  fotosSubidas?: string[];
  // Phase 3.9: VIP/Segmentation fields
  perfil?: PerfilInvitado;
  mensajePersonalizado?: string;
  requiereAccesibilidad?: boolean;
  /** 0-100 readiness score reflecting how complete the guest's event preparation data is */
  readinessScore?: number;
  /** Secure token for QR-based access control (preferred over raw guestId) */
  guestAccessToken?: string;
  /** Tracking stats for guest experience CTAs */
  guestExperienceStats?: GuestExperienceStats;
}

// --- MENU MESA ---
export interface MenuMesaData {
  protagonistaFotoUrl?: string;
  titulo?: string;
  protagonistaNombre?: string;
  fontFamily?: string;
  paletaColores: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  entrada: string;
  platoPrincipal: string;
  adolescentes: string;
  postres: string;
  bebidas: string;
  empresa: {
    linea1: string;
    linea2: string;
    contacto: string;
  };
}

export interface NumerosMesaData {
  protagonistaNombre: string;
  fechaEvento: string;
  backgroundImageUrl: string;
  colorPrincipal: string;
  colorSecundario: string;
  labels?: Record<string, string>; // Etiquetas para mesas (ej: {"1": "Familia", "2": "Trabajo"})
  // Styling controls
  fontSize?: 'small' | 'medium' | 'large' | 'xlarge'; // Size of the table number
  numberColor?: string; // Color of the table number text
  cardBgColor?: string; // Background color of the card
  fontFamily?: string;
}

// --- LIVE EVENT ---
export interface EntregaCritica {
    id: string;
    nombre: string;
    horaEstimada: string;
    llego: boolean;
    timestampLlegada?: string;
    proveedor?: string;
}

export interface IncidenteEvento {
    id: string;
    hora: string;
    descripcion: string;
    resuelto: boolean;
}

export interface LiveEventState {
    llegadaProtagonistas: {
        enCamino: boolean;
        timestampAviso?: string;
        confirmado: boolean;
    };
    entregas: EntregaCritica[];
    incidentes: IncidenteEvento[];
    staffCheckIn: Record<string, { llego: boolean, hora?: string }>;
}

// --- CONFIGURACIÓN ---
export interface ConfigEventoDataStorage {
  nombreEvento: string;
  tipoCelebracion: TipoEvento | string;
  fechaEvento?: string; 
  horaInicio: string;
  horaFin: string;
  nombreLugar: string;
  direccionLugar?: string;
  googleMapsUrl?: string;
  invitadosEstimados: number;
  invitadosAdultos?: number;
  invitadosNinos?: number;
  invitadosAdolescentes?: number;
  presupuestoEstimado: number;
  notesAdicionales: string;
  clienteId?: string; 
  protagonista1Nombre?: string; 
  protagonista2Nombre?: string; 
  protagonistaFotoUrl?: string;
  // Legacy / extended optional fields
  nombreAgasajado?: string;
  clienteNombre?: string;
  primaryColor?: string;
  carteleriaQrTexto?: string;
  // Phase 3.10: Logistics & Accessibility
  infoEstacionamiento?: string;
  rutaAccesibilidad?: string;
  telefonoAsistencia?: string;
  protocoloLluvia?: string;
  mapaDelSalonUrl?: string;
  instruccionesLlegada?: string;
}

export interface PersonalAsignadoDetalleStorage {
  empleadoId: string;
  rolId: string; 
  eventSalary: number;
}

export interface ReunionChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Reunion {
  id: string;
  titulo: string;
  fecha?: string; 
  notas: string;
  acuerdos?: string; 
  checklist?: ReunionChecklistItem[]; 
  fiestaId?: string;
}

export type LayoutElementType = 'element' | 'area';

export interface LayoutElement {
  id: string;
  name: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation: number;
  type: LayoutElementType;
  category?: string;
  shape?: 'rectangle' | 'circle';
  backgroundColor?: string;
  seats?: number;
  zIndex?: number;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
}

export interface DecorationItem {
  id: string;
  name: string;
  category?: string;
  quantity: number;
  estimatedCost?: number;
  supplier?: string;
  notes?: string;
  imageUrl?: string;
  dataAiHint?: string;
}

export interface ZonaContratada {
  id: 'atras_torta' | 'frente_salon' | 'zona_regalos' | 'zona_fotografia' | 'centro_salon';
  nombreDisplay: string;
  activada: boolean;
  descripcion?: string;
  imagenReferenciaUrl?: string;
  dataAiHint?: string;
}

export interface MoodboardItem {
  id: string;
  url: string;
  description?: string;
  likedByClient?: boolean;
  uploadedBy?: 'Organizador' | 'Cliente';
  timestamp: string;
}

export interface ElementoDecorativo {
  id: string;
  tipo: 'globo' | 'flor' | 'arco' | 'lazo' | 'candelabro' | 'mesaTorta' | 'tela' | 'globosMacizos' | 'centroMesa' | 'corazon' | 'estrella' | 'mariposa' | 'corona' | string;
  x: number;
  y: number;
  escala: number;
  colores: string[];
  rotacion?: number;
  etiqueta?: string;
  width?: number;
  height?: number;
  zona?: string;
  imageDataUri?: string;
  isCustom?: boolean;
  zIndex?: number;
  opacity?: number;
  tintColor?: string;
  tintOpacity?: number;
}

// --- CREATOR PARTY EXTENDED TYPES ---

export interface DecoItem {
  id: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  /** @deprecated Use `costoUnitario` for internal cost tracking. Retained for backward compatibility with existing event data. */
  precioUnitario?: number;
  /** Costo interno del elemento (no se suma al presupuesto del cliente) */
  costoUnitario?: number;
  zona?: string;
  color?: string;
  notas?: string;
  estado?: 'pendiente' | 'comprado' | 'instalado';
  imageUrl?: string;
}

/** Una zona de diseño con su propio lienzo visual */
export interface ZonaDiseno {
  id: string;
  nombre: string;
  vistaDecorativa: {
    elementos: ElementoDecorativo[];
    fondoColor?: string;
    fondoImagenUrl?: string;
  };
}

export interface DecoZona {
  id: string;
  nombre: string; // 'Entrada', 'Mesas', 'Mesa Principal', 'Pista', 'Candy Bar', etc.
  items: string[]; // IDs de DecoItem
  preview?: string; // URL de preview
}

export interface DecoChecklistItem {
  id: string;
  item: string;
  zona: string;
  completado: boolean;
}

export interface DecoracionData {
  tema?: string;
  paletaColores?: ColorPalette;
  moodboardItems?: MoodboardItem[]; 
  moodboardImageUrl?: string;
  colorCubremantel?: string;
  colorGlobos?: string;
  decoracionTorta?: {
    descripcion?: string;
    imageUrl?: string;
    dataAiHint?: string;
  };
  items?: DecorationItem[];
  zonasContratadas?: ZonaContratada[];
  generalNotesDecoracion?: string;
  pdfNotasAdicionales?: string;
  salonWidth?: number;
  salonHeight?: number;
  salonPlanBackgroundImageUrl?: string;
  salonElements?: LayoutElement[];
  generalNotesSalonLayout?: string;
  layoutTemplateName?: string;
  pixelsPerMeter?: number; 
  seatingMode?: 'numerada' | 'mixta' | 'libre';
  vistaDecorativa?: {
    elementos: ElementoDecorativo[];
    fondoColor?: string;
    fondoImagenUrl?: string;
  };
  // Creator Party extended fields
  colorPalette?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  estiloDecoracion?: 'elegante' | 'rustico' | 'moderno' | 'infantil' | 'tropical' | 'romantico' | 'industrial';
  itemsDecoracion?: DecoItem[];
  moodboardImages?: string[];
  zonas?: DecoZona[];
  /** Zonas de diseño con su propio lienzo visual */
  zonasDiseno?: ZonaDiseno[];
  presupuestoDecoracion?: number;
  checklistDecoracion?: DecoChecklistItem[];
  documentacionImageUrl?: string;
  salonPreview3dUrl?: string;
  plantillasGuardadas?: Array<{ id: string; nombre: string; elementos: ElementoDecorativo[]; creadaEn: string }>;
  customElements?: Array<{ id: string; nombre: string; imageDataUri: string }>;
}

export interface GiftItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  dataAiHint?: string;
  isClaimed: boolean;
  claimedBy?: string; 
}

export interface ProgramaEventoItem {
  id: string;
  hora: string; 
  titulo: string;
  descripcion?: string;
  descripcionCliente?: string;
  visibleParaCliente?: boolean;
  icono?: string; 
  completado?: boolean;
}

export interface TextStyle {
    fontFamily?: 'Belleza' | 'Inter' | 'Playfair_Display' | 'Dancing_Script';
    fontSize?: string; 
    color?: string; 
}

export interface TextWithStyle {
    text: string;
    style?: TextStyle;
}

export interface DetalleEventoEspecifico {
  visible: boolean;
  titulo: string;
  fecha?: string;
  hora?: string;
  nombreLugar?: string;
  direccionLugar?: string;
  mapaUrl?: string;
  imagenUrl?: string;
}

export interface SeccionInvitacion {
  id: string;
  tipo: 'cabecera' | 'bienvenida' | 'cuentaRegresiva' | 'detallesEvento' | 'itinerario' | 'dressCode' | 'galeria' | 'historia' | 'regalos' | 'confirmacion' | 'despedida' | 'footer' | 'redesSociales' | 'musica';
  data: any; 
}

// --- INVITACIÓN DIGITAL CONFIG (Simplified central configuration) ---

export interface InvitacionDigitalDressCode {
  tipo: 'formal' | 'semi-formal' | 'casual' | 'personalizado';
  textoPersonalizado?: string;
  colorSugerido?: string;
  restricciones?: string;
}

export interface InvitacionDigitalRegalos {
  tipo: 'regalos' | 'dinero' | 'ambos' | 'ninguno';
  textoPersonalizado?: string;
  aliasCBU?: string;
  banco?: string;
  titular?: string;
  cuentaNumero?: string;
  instruccionesRegalos?: string;
  linkListaRegalos?: string;
}

export interface InvitacionDigitalCronograma {
  hora: string;
  actividad: string;
  icono?: string;
}

export type InvitacionPlantillaId = 'EleganteDorado' | 'ModernoMinimalista' | 'RomanticoFloral' | 'FiestaVibrante' | 'Grazia' | 'Allegria';

export type InvitacionSectionId =
  | 'hero'
  | 'bienvenida'
  | 'contador'
  | 'cronograma'
  | 'ubicacion'
  | 'dressCode'
  | 'galeria'
  | 'regalos'
  | 'rsvp'
  | 'muroSocial'
  | 'ctaAk'
  | 'footer';

export interface InvitacionTypographyConfig {
  heroTitleMobile?: string;
  heroTitleDesktop?: string;
  sectionTitle?: string;
  body?: string;
  button?: string;
  lineHeight?: string;
  spacing?: string;
}

export interface InvitacionSectionConfig {
  id: InvitacionSectionId;
  visible: boolean;
  order: number;
}

export interface InvitacionDigitalConfig {
  // Basic data
  nombreHomenajeada: string;
  nombreHomenajeado2?: string;
  tipoEvento: '15' | '18' | 'boda' | 'cumpleanos' | 'bautismo' | 'otro';
  estiloEvento: 'formal' | 'semi-formal' | 'casual';

  // Colors (global change)
  colorPrincipal: string;
  colorSecundario: string;
  colorAcento: string;
  colorSugeridoInvitados?: string;

  // Location
  nombreSalon: string;
  direccionSalon: string;
  linkMaps: string;

  // Date and time
  fechaEvento: string;
  horaEvento: string;

  // Visual
  fotoPortada: string;
  galeriaFotos: string[];
  textoBienvenida: string;

  // Dress code
  dressCode: InvitacionDigitalDressCode;
  mostrarDressCode: boolean;

  // Gifts
  regalos: InvitacionDigitalRegalos;

  // Template
  plantillaId: InvitacionPlantillaId;

  // RSVP
  rsvpActivo: boolean;
  rsvpTexto?: string;

  // WhatsApp
  whatsappNumero?: string;
  whatsappMensaje?: string;

  // Timeline
  cronograma?: InvitacionDigitalCronograma[];

  // Countdown
  contadorActivo: boolean;

  // Social portal
  portalSocialActivo: boolean;
  hashtagEvento?: string;

  // Typography configuration
  typography?: InvitacionTypographyConfig;

  // Section visibility and ordering
  sectionsConfig?: InvitacionSectionConfig[];

  // AK Marketing CTA section
  ctaAkActivo?: boolean;
  ctaAkTitulo?: string;
  ctaAkTexto?: string;
  ctaAkLandingUrl?: string;
  ctaAkWhatsapp?: string;
}

export interface InvitacionDigitalData {
  name?: string; 
  category?: 'Boda' | 'XV Años' | 'Cumpleaños' | 'General' | 'Infantil';
  plantilla: 'Grazia' | 'Allegria';
  musicaFondoUrl?: string;
  secciones: SeccionInvitacion[];
  cabecera: {
    visible: boolean;
    logoUrl?: string;
    videoFondoUrl?: string;
    imagenFondoUrl?: string;
    protagonista1: string;
    protagonista2: string;
    subtitulo: TextWithStyle;
    paletaColores: ColorPalette;
  };
  bienvenida: {
    visible: boolean;
    imagenFondoUrl?: string;
    titulo: TextWithStyle;
    texto: TextWithStyle;
  };
   cuentaRegresiva: {
    visible: boolean;
  };
  detallesEvento: {
    visible: boolean;
    ceremoniaReligiosa: DetalleEventoEspecifico;
    ceremoniaCivil: DetalleEventoEspecifico;
    celebracion: DetalleEventoEspecifico;
  };
  itinerario: {
    visible: boolean;
    imagenFondoUrl?: string;
  };
  galeria: {
    visible: boolean;
    imagenFondoUrl?: string;
    fotos: string[];
  };
  historia: {
    visible: boolean;
    titulo: TextWithStyle;
    texto: TextWithStyle;
    imagenFondoUrl?: string;
    fotoHistoriaUrl?: string;
  };
  regalos: {
    visible: boolean;
    imagenFondoUrl?: string;
    titulo: TextWithStyle;
    texto: TextWithStyle;
    datosBancarios: string;
    items: GiftItem[];
  };
  dressCode: {
    visible: boolean;
    imagenFondoUrl?: string;
    texto?: TextWithStyle;
    tipo?: string;
    sugeridos?: string[];
    evitar?: string[];
  };
  redesSociales: {
    visible: boolean;
    hashtag: string;
    texto: TextWithStyle;
  };
  confirmacion: {
    visible: boolean;
    showRelationshipTags?: boolean;
  };
  despedida: {
    visible: boolean;
    texto?: TextWithStyle;
  };
  musica: {
    visible: boolean;
    placeholder?: string;
  };
  footer: {
    visible: boolean;
    titulo: TextWithStyle;
    nombreEmpresa: TextWithStyle;
  }
}

interface PortalModuleSettings {
  visible: boolean;
  editable: boolean;
}

export interface PortalViewOnlyModuleSettings {
  visible: boolean;
}

export interface SimuladorInvitadosSettings {
  visible: boolean;
  minReductionPercent?: number;
  maxIncreasePercent?: number;
}

export interface BebidaCalculable {
  id: string;
  nombre: string;
  emoji: string;
  cantidadPorPersona: number;
  unidad: string;
  clienteLleva: boolean;
  visible: boolean;
  color: string;
}

export interface CalculadoraBebidasSettings {
  visible: boolean;
  items: BebidaCalculable[];
  // Legacy fields kept for backward compatibility
  clienteLlevaBebida?: boolean;
  clienteLlevaCerveza?: boolean;
  clienteLlevaHielo?: boolean;
}

export interface FaqItem {
  id: string;
  pregunta: string;
  respuesta: string;
}

export interface ClientPortalSettings {
  enabled: boolean;
  accessKey?: string;
  checklist: PortalModuleSettings;
  itinerario: PortalViewOnlyModuleSettings;
  musica: PortalModuleSettings;
  videoVida: PortalModuleSettings;
  listaRegalos: PortalViewOnlyModuleSettings;
  documentos: PortalViewOnlyModuleSettings;
  notasCliente: PortalModuleSettings;
  invitados: PortalViewOnlyModuleSettings;
  paginaPublica: PortalViewOnlyModuleSettings;
  fotografiaYFilmacion: PortalViewOnlyModuleSettings;
  moodboard: PortalModuleSettings;
  contrato: PortalViewOnlyModuleSettings;
  pagos: PortalViewOnlyModuleSettings;
  simuladorInvitados: SimuladorInvitadosSettings;
  simuladorInvitadosConfig?: {
    limiteReduccionPorcentaje: number;
    limiteAumentoPorcentaje: number;
    penalizacionReduccion: boolean;
    textoReduccion?: string;
    textoAumento?: string;
  };
  calculadoraBebidas: CalculadoraBebidasSettings;
  serviciosContratados: PortalViewOnlyModuleSettings;
  ubicacion: PortalViewOnlyModuleSettings;
  menu: PortalViewOnlyModuleSettings;
  cartaTragos: PortalViewOnlyModuleSettings;
  dressCode: PortalViewOnlyModuleSettings;
  faq: PortalViewOnlyModuleSettings;
  informarPago: PortalModuleSettings;
  cuentasBancarias?: CuentaBancaria[];
}

export type ActiveGameType =
  | 'siONo'
  | 'trivia'
  | 'encuesta'
  | 'baileLibre'
  | 'verdadODesafio'
  | 'preguntaAbierta';

export interface ActiveGameOption {
  id: string;
  text: string;
  emoji?: string;
  votes?: number;
}

export interface ActiveGameData {
  type: ActiveGameType;
  title: string;
  subtitle?: string;
  options?: ActiveGameOption[];
  correctOptionId?: string;
  launchedAt: string;
  /** Reference to a linked poll ID (for type 'encuesta') */
  pollId?: string;
}

export interface SocialGallerySettings {
  enabled: boolean;
  title?: string;
  subtitle?: string;
  allowLikes: boolean;
  allowComments: boolean;
  uploadsActive: boolean;
  marketingTickerText?: string;
  /** Whether the marketing ticker (social/network footer bar) is enabled */
  marketingTickerEnabled?: boolean;
  /** Text color for the marketing ticker (CSS color string) */
  marketingTickerColor?: string;
  /** Background color for the marketing ticker */
  marketingTickerBgColor?: string;
  ledMarqueeText?: string;
  /** Whether the LED marquee is enabled/visible on the giant screen */
  ledMarqueeEnabled?: boolean;
  /** Text color for the LED marquee (CSS color string) */
  ledMarqueeColor?: string;
  /** Background color for the LED marquee */
  ledMarqueeBgColor?: string;
  backgroundColor?: string;
  accentColor?: string;
  chatEnabled?: boolean;
  maxPhotos?: number;
  /** Maximum photos a single named author can upload per event (default: 10) */
  maxPhotosPerPerson?: number;
  showAds?: boolean;
  showSongRequests?: boolean;
  showPolls?: boolean;
  showDedications?: boolean;
  photoFrame?: boolean;
  momentosActivos?: { id: string; nombre: string; emoji: string; timestamp: string }[];
  sorteoParticipantesRedes?: { nombre: string; timestamp: string }[];
  sorteoGanadores?: string[];
  /** Currently displayed sorteo winner on the giant screen (TTL: ~20s) */
  activeSorteoWinner?: string;
  activeSorteoTimestamp?: string;
  /** Timestamp when a sorteo spin was started — triggers wheel animation on the big screen */
  sorteoSpinStartedAt?: string;
  /** When true, the raffle wheel is displayed statically on the big screen before spinning */
  sorteoOnScreen?: boolean;
  /** Prize description shown alongside the sorteo winner on the giant screen */
  sorteoPremio?: string;
  screenMode?: ScreenModeSettings;
  screenMediaLibrary?: ScreenMediaAsset[];
  /** Real AK branding shown on the giant screen */
  brand?: SocialGalleryBrand;
  /** Active game to display on the giant screen */
  activeGame?: ActiveGameData;
  /** Dark mode for the giant screen display (default: true = dark, false = light/white) */
  screenDarkMode?: boolean;
  /** Cover photo URL shown on the mobile control/social wall entry screen */
  mobileControlCoverUrl?: string;
  /** Custom event moments configured by the operator (merged with the hardcoded defaults) */
  customMomentos?: Array<{ id: string; nombre: string; emoji: string }>;
}

export interface SocialGalleryBrand {
  logoUrl?: string;
  companyName?: string;
  instagramHandle?: string;
  facebookHandle?: string;
  tiktokHandle?: string;
  whatsappNumber?: string;
  landingUrl?: string;
  ctaText?: string;
}

export type ScreenLayoutMode = 'auto' | 'landscape' | 'portrait';
export type ScreenPlaylistItemType = 'video' | 'mural' | 'redes' | 'juego' | 'dedicaciones' | 'chat' | 'canciones';

export interface ScreenMediaAsset {
  id: string;
  url: string;
  type: 'video' | 'image';
  sourceFiestaId: string;
  sourceFiestaNombre?: string;
  createdAt: string;
  title?: string;
}

export interface ScreenSocialTemplateConfig {
  templateId: 'neon' | 'vip' | 'minimal';
  showInstagram: boolean;
  showTikTok: boolean;
  showWhatsApp: boolean;
  showFacebook: boolean;
  instagramHandle?: string;
  tiktokHandle?: string;
  whatsappHandle?: string;
  facebookHandle?: string;
  qrUrl?: string;
  ctaText?: string;
}

export interface ScreenPlaylistItem {
  id: string;
  type: ScreenPlaylistItemType;
  title: string;
  durationSeconds: number;
  enabled: boolean;
  layout?: ScreenLayoutMode;
  mediaAssetId?: string;
  mediaUrl?: string;
  socialTemplate?: ScreenSocialTemplateConfig;
}

export interface ScreenModeSettings {
  enabled: boolean;
  loop: boolean;
  isPlaying: boolean;
  currentItemIndex: number;
  startedAt?: string;
  playlist: ScreenPlaylistItem[];
}

export interface MusicaFiesta {
  cancionEntrada?: string;
  cancionVals?: string;
  cancionesTortaBrindis?: string[]; 
  playlistFiesta?: string;
  listaNoReproducir?: string;
  sugerenciasInvitados?: string; 
}

export interface Trago {
  id: string;
  nombre: string;
  imageUrl?: string;
  aiHint?: string;
  ingredientes?: string[];
  recetaIngredientes?: TragoRecetaIngrediente[];
  stockDisponible?: number;
}

export interface TragoRecetaIngrediente {
  id?: string;
  insumoId: string;
  nombre: string;
  cantidad: number;
  unidad: string;
}

export interface CartaTragosData {
  titulo?: string;
  protagonistaNombre?: string;
  numeroPrincipal?: string;
  fontFamily?: string;
  titleSize?: 'small' | 'medium' | 'large' | 'xlarge';
  protagonistaFotoUrl?: string;
  backgroundImageUrl?: string;
  backgroundColor?: string;
  paletaColores?: {
    primary: string;
    secondary: string;
    accent: string;
    background?: string;
  };
  items: Trago[];
  empresa: {
    linea1: string;
    linea2: string;
    contacto: string;
  };
}

export interface ReposteriaItem {
  id: string;
  nombre: string;
  description?: string;
  cantidad?: number;
  unidad?: string;
  costoEstimado?: number;
  precioSugerido?: number;
  imagenReferenciaUrl?: string;
  dataAiHint?: string;
  notas?: string;
  origenId?: string; 
  proveedor?: string;
}

export interface ReposteriaCategoria {
  id: string;
  nombreDisplay: string;
  activada: boolean;
  descripcion?: string;
  cantidadEstimadaPersonas?: number;
  items: ReposteriaItem[];
}

export interface ReposteriaData {
  categorias: ReposteriaCategoria[];
  notasGenerales?: string;
}

export interface BebidaItem {
  id: string;
  nombre: string;
  cantidadNecesaria?: number; 
  unidadCantidad?: string; 
  costoUnitario?: number; 
  costoTotal?: number; 
  proveedorHabitual?: string;
  notas?: string;
  origenId?: string;
}

export interface BebidaCategoria {
  id: string;
  nombreDisplay: string;
  activada: boolean;
  descripcion?: string;
  items: BebidaItem[];
  recetas?: any[];
}

export interface BebidasData {
  categorias: BebidaCategoria[];
  notasGenerales?: string;
}

export interface Tarea {
  id: string;
  texto: string;
  descripcion?: string;
  completada: boolean;
  fechaLimite?: string; 
  horaVencimiento?: string; 
  recordatorio?: string; 
  asignadaA?: 'Cliente' | 'Organizador';
  esPredeterminada?: boolean;
}

export interface ClientTarea {
  id: string;
  texto: string;
  completada: boolean;
}

export interface CargaOperativaItem {
  id: string;
  nombre: string;
  cantidad: string; 
  cargado: boolean;
  retornado?: boolean;
  notas?: string;
  origenId?: string; 
  unidad?: string;
  unit?: string; // alias for unidad (legacy)
  hasConflict?: boolean; 
  availableStockAtDate?: number; 
}

export interface CargaOperativaCategoria {
  id: string; 
  nombre: string; 
  items: CargaOperativaItem[];
}

export interface ListaDeCargaOperativa {
  id?: string;
  name?: string;
  categorias: CargaOperativaCategoria[];
  notasGenerales?: string;
}

export interface CostoItem {
  id: string;
  nombre: string;
  category: string;
  montoEstimado: number;
  notas?: string;
}

export interface PagoProveedor {
  id: string;
  costoAsociadoId: string; 
  fecha: string; 
  monto: number;
  metodoPago?: string; 
  notas?: string;
}

export interface GestionCostosData {
  costosItems: CostoItem[];
  ingresosTotalesEstimados: number; 
  notasGeneralesCostos?: string;
  others?: Record<string, number>;
}

export interface VideoVidaData {
  galleryEnabled: boolean;
  photosUploaded: boolean;
  songSuggestion?: string;
  customText?: string;
  photoCount?: number;
}

export interface OtroDocumento {
  id: string;
  nombre: string;
  tipo: string;
  fileName: string; 
  timestamp: string; 
}

export interface ModulosContratados {
  tareas: boolean;
  invitados: boolean;
  paginaWeb: boolean;
  decoracion: boolean;
  catering: boolean;
  musica: boolean;
  personal: boolean;
  itinerario: boolean;
  documentos: boolean;
  costos: boolean;
  cargaOperativa: boolean;
  fotografia: boolean;
  videoVida: boolean;
  reuniones: boolean;
  muroSocial: boolean;
  regalos: boolean;
  feedback: boolean;
  menuMesa: boolean;
  checkin: boolean;
  resumenImprimible: boolean;
  configuracion: boolean;
  disenoSalon: boolean;
  listaCompras: boolean;
  portalCliente: boolean;
  numerosMesa: boolean;
  mesasCliente: boolean;
  resumenPlanificacion: boolean;
  enVivo: boolean;
  carteleria?: boolean;
}

export interface CompraProveedorEstado {
    proveedor: string;
    pedido: boolean;
    pagado: boolean;
}

export type PlanPagoEstadoCuota = 'pendiente' | 'pagado' | 'vencido' | 'parcial';

export interface CuotaPlanPago {
  id: string;
  descripcion: string; // e.g. "Seña", "Cuota 1", "Saldo Final"
  monto: number;
  fechaVencimiento: string; // ISO date
  estado: PlanPagoEstadoCuota;
  montoPagado?: number; // for 'parcial'
  fechaPago?: string;
  metodoPago?: string;
  notas?: string;
}

export interface PlanDePagos {
  id: string;
  fiestaId: string;
  cuotas: CuotaPlanPago[];
  notas?: string;
  createdAt: string;
  updatedAt: string;
}

// --- TIMELINE ---
export interface TimelineHito {
  id: string;
  nombre: string;
  emoji: string;
  fechaProgramada: string;
  completado: boolean;
  fechaCompletado?: string;
  notas?: string;
}

// --- MENU SELECTION PORTAL ---
export interface MenuSeleccionPortal {
  entrada?: string;
  principal?: string;
  postre?: string;
  bebidas?: string;
  restriccionesAlimentarias?: string;
  confirmado?: boolean;
  fechaConfirmacion?: string;
}

// --- MUSIC LIST PORTAL ---
export interface ListaMusicaPortal {
  imprescindibles?: string[];
  siEsPosible?: string[];
  noQuiero?: string[];
  fechaActualizacion?: string;
}

export interface GuestPortalSettings {
  showMural: boolean;
  showFotos: boolean;
  showInvitacionWeb: boolean;
  showMesaAsignada: boolean;
  showItinerario: boolean;
  showMusica: boolean;
  showRegalos: boolean;
  showCheckin: boolean;
  welcomeMessage?: string;
  customBgColor?: string;
  customAccentColor?: string;
  coverImageUrl?: string;
}

// --- CLIENTE DEBE LLEVAR ---
export interface ClienteDebeLlevarItem {
  id: string;
  texto: string;
  completado: boolean;
  estado?: 'pendiente' | 'enviado' | 'revisado' | 'listo';
  obligatorio?: boolean;
  fechaLimite?: string;
  notas?: string;
}

// --- GUEST EXPERIENCE SETTINGS ---
export interface GuestExperienceSettings {
  enabled: boolean;
  showAkBranding: boolean;
  showLandingCta: boolean;
  showSocialCta: boolean;
  showBudgetSimulatorCta: boolean;
  landingUrl?: string;
  simulatorUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  /** Full WhatsApp URL, e.g. https://wa.me/59898355530 */
  whatsappUrl?: string;
  /** @deprecated Use whatsappUrl instead. Kept for legacy QR links. */
  whatsappNumber?: string;
  ctaTitle?: string;
  ctaText?: string;
  ctaDescription?: string;
  accentColor?: string;
  /** Whether guests can suggest songs via RSVP form */
  allowSongSuggestions: boolean;
  /** Whether guests can upload photos */
  allowPhotoUpload: boolean;
  /** Whether guests can access a persistent guest portal */
  allowGuestPortal: boolean;
}

// --- CLIENTE PORTAL EXPERIENCE ---
export interface ClientePortalExperience {
  heroImageUrl?: string;
  protagonistImageUrl?: string;
  primaryColor?: string;
  eventDisplayName?: string;
  welcomeMessage?: string;
  organizerMessage?: string;
  simplicityMode?: boolean;
  clienteDebeLlevar?: ClienteDebeLlevarItem[];
}

export interface FiestaEnPlanificacion {
  id: string;
  invitacionSlug?: string;
  configuracion: ConfigEventoDataStorage;
  estado?: string;
  modulosContratados?: ModulosContratados;
  personalAsignado: PersonalAsignadoDetalleStorage[];
  menuAsignadoId?: string;
  presupuestoId?: string;
  invoiceIds?: string[];
  reuniones?: Reunion[];
  tareas?: Tarea[];
  decoracion?: DecoracionData;
  invitados?: Invitado[];
  clientChecklist?: ClientTarea[];
  clientNotes?: string; 
  invitacionDigital?: InvitacionDigitalData;
  invitacionConfig?: InvitacionDigitalConfig;
  menuMesa?: MenuMesaData;
  numerosMesa?: NumerosMesaData;
  contratoServicioTexto?: string;
  contratoGenerado?: ContratoGeneradoInfo;
  contratoFirmaInfo?: ContratoFirmaInfo;
  contratoDatos?: ContratoDatos;
  clientPortalSettings?: ClientPortalSettings;
  socialGallerySettings?: SocialGallerySettings;
  musica?: MusicaFiesta;
  reposteria?: ReposteriaData;
  bebidas?: BebidasData;
  listaDeCargaOperativa?: ListaDeCargaOperativa;
  gestionCostos?: GestionCostosData;
  videoVida?: VideoVidaData;
  programa?: ProgramaEventoItem[];
  fotografiaYFilmacion?: FotografiaYFilmacionData;
  cartaTragos?: CartaTragosData;
  faqPortal?: FaqItem[];
  othersDocumentos?: OtroDocumento[];
  pagosProveedores?: PagoProveedor[];
  others?: any;
  estadosCompra?: CompraProveedorEstado[];
  generadoDesdeHistorico?: boolean; 
  liveState?: LiveEventState;
  planDePagos?: PlanDePagos;
  eventoEnVivo?: EventoEnVivoData;
  clientPaymentNotifications?: ClientPaymentNotification[];
  clientMenuChangeRequests?: ClientMenuChangeRequest[];
  timeline?: TimelineHito[];
  menuSeleccionPortal?: MenuSeleccionPortal;
  listaMusicaPortal?: ListaMusicaPortal;
  // Phase 3 - Post-Event Premium
  referidoPor?: string;           // Who referred this client
  referidosGenerados?: string[];  // New referral names generated by this event
  npsScore?: number;              // 0-10 post-event NPS score
  galeriaEntregada?: boolean;     // Whether photo gallery was delivered to client
  galeriaUrl?: string;            // URL to delivered gallery
  postEventoCompletado?: boolean; // Post-event process completed flag
  screenPlaylist?: ScreenPlaylist;
  mediaLibrary?: MediaLibraryItem[];
  cateringChangeRequests?: CateringChangeRequest[];
  socialScreenConfig?: SocialScreenConfig;
  guestPortalSettings?: GuestPortalSettings;
  clienteDebeLlevar?: ClienteDebeLlevarItem[];
  guestExperienceSettings?: GuestExperienceSettings;
  clientePortalExperience?: ClientePortalExperience;
}

export interface ContratoFirmaInfo {
    isSigned: boolean;
    signedAt?: string;
    method?: 'digital' | 'physical';
    signedBy?: string;
    ip?: string;
    physicalContractUrl?: string;
    notes?: string;
}

export interface CuotaPlanPagoContrato {
  id: string;
  descripcion: string;
  fechaVencimiento: string; // ISO
  montoMinimo: number;
  montoObjetivo?: number; // para la cuota del 30%
  esCuotaClave: boolean; // true = la cuota del 30%
  estado: 'pendiente' | 'parcial' | 'completada' | 'vencida';
  pagosAplicados: string[]; // IDs de PagoCliente
  montoAcumulado: number;
}

export interface PlanPagos {
  activo: boolean;
  pagoMinimoTrimestral: number; // default 5000
  porcentajeMinimoAntesFecha: number; // default 30
  mesesLimiteAntesFecha: number; // calculado automáticamente
  fechaLimite30Porciento: string; // ISO date calculada
  montoObjetivo30Porciento: number; // totalContrato * 0.30
  cuotas: CuotaPlanPagoContrato[];
  aceptadoPorCliente: boolean;
  aceptadoAt?: string;
  generadoAt: string;
}

export interface ContratoDatos {
  senia?: number;
  saldo?: number;
  ajusteAnualPorcentaje?: number;
  fechaFirmaContrato?: string;
  clausulas?: string;
  planPagos?: PlanPagos;
}

export interface ContratoGeneradoInfo {
  tipo: ContractType;
  fecha: string;
  plantillaId: string;
}

export interface FotoEnVivo {
  id: string;
  url: string;
  autor: string;
  mensaje?: string;
  timestamp: string;
}

export interface SolicitudCancion {
  id: string;
  invitadoNombre: string;
  cancion: string;
  artista?: string;
  timestamp: string;
  reproducida?: boolean;
}

export interface MensajeEnVivo {
  id: string;
  autor: string;
  mensaje: string;
  timestamp: string;
  destacado?: boolean;
}

export interface VotacionOpcion {
  id: string;
  texto: string;
  votos: number;
}

export interface VotacionEnVivo {
  id: string;
  pregunta: string;
  opciones: VotacionOpcion[];
  activa: boolean;
  timestamp: string;
}

export interface EventoEnVivoData {
  fotos: FotoEnVivo[];
  solicitudesCanciones: SolicitudCancion[];
  mensajes: MensajeEnVivo[];
  votaciones: VotacionEnVivo[];
}

// --- FOTOGRAFÍA Y FILMACIÓN ---
export type EntregaMaterialEstado = 'Pendiente' | 'En edición' | 'En revisión' | 'Entregado parcial' | 'Entregado completo';

export interface ServicioFotografia {
  id: string;
  nombre: string;
  estado: EntregaMaterialEstado;
  fechaEntregaEstimada?: string;
  linkEntrega?: string;
  notas?: string;
}

export interface FotografiaYFilmacionData {
  servicios: ServicioFotografia[];
  notasGenerales?: string;
}

// --- BACKUP / RESTORE POINTS ---
export interface RestorePoint {
  name: string;
  timestamp: string;
  displayDate: string;
}

// --- ITINERARY TEMPLATES ---
export interface ItineraryTemplate {
  id: string;
  name: string;
  items: ProgramaEventoItem[];
}

// --- DOCUMENT TYPES ---
export type DocumentoTipo =
  | 'contrato_fiesta'
  | 'contrato-servicio'
  | 'contrato_servicio'
  | 'contrato-salon'
  | 'contrato_salon'
  | 'presupuesto_firmado'
  | 'contrato_cambio_fecha'
  | 'cambio-fecha'
  | 'seña_pago'
  | 'recibo_pago'
  | 'contrato_catering'
  | 'cancelacion'
  | 'cancelacion-parcial'
  | 'recibo_salon'
  | 'recibo_agadu'
  | 'recibo_personal'
  | 'otro';

// --- BEBIDA RECETAS ---
export interface IngredienteReceta {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  costoUnitario?: number;
}

export interface BebidaReceta {
  id: string;
  nombre: string;
  porcionesBase: number;
  costoTotalReceta?: number;
  ingredientes: IngredienteReceta[];
  notas?: string;
}

// --- COSTO CATEGORIA ---
export type CostoCategoria = string;

// --- CLIENT PAYMENT NOTIFICATIONS ---
export interface ClientPaymentNotification {
  id: string;
  monto: number;
  comprobanteBase64?: string; // base64 encoded receipt image
  comprobanteNombre?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  timestamp: string;
  approvedAt?: string;
  notas?: string;
}

export interface ClientMenuChangeRequest {
  id: string;
  createdAt: string;
  status: 'pendiente' | 'aprobada' | 'rechazada';
  adultosDelta: number;
  ninosAdolescentesDelta: number;
  montoAdicional: number;
  nuevoTotalEstimado: number;
  notaCliente?: string;
}

export interface CuentaBancaria {
  id: string;
  banco: string;
  titular: string;
  numero: string;
  tipo?: string; // 'Caja de ahorro' | 'Cuenta corriente' | etc.
}

export interface DecoCanvasTemplate {
  id: string;
  nombre: string;
  elementos: ElementoDecorativo[];
  fondoColor: string;
  fondoImagenUrl?: string;
  creadoEn: string;
  miniatura?: string;
}

// --- SCREEN PLAYLIST ---
export type PlaylistItemType = 'muro-fotos' | 'video-publicitario' | 'redes-sociales' | 'ruleta' | 'votacion';

export interface PlaylistItem {
  id: string;
  type: PlaylistItemType;
  label: string;
  durationSeconds: number;
  mediaUrl?: string;   // for video-publicitario
  enabled: boolean;
}

export interface ScreenPlaylist {
  items: PlaylistItem[];
  loop: boolean;
  orientation: 'landscape' | 'portrait'; // 16:9 vs 9:16
  isPlaying: boolean;
  currentIndex: number;
}

// --- MEDIA LIBRARY ---
export interface MediaLibraryItem {
  id: string;
  fiestaId: string;
  fileName: string;
  url: string;
  type: 'video' | 'image';
  uploadedAt: string;
  label?: string;
  globalShared: boolean; // available in global library
}

// --- CATERING CHANGE REQUESTS ---
export type CateringChangeStatus = 'pendiente' | 'aprobada' | 'rechazada';

export interface CateringChangeRequest {
  id: string;
  timestamp: string;
  clientName?: string;
  adultosMenuId?: string;
  adultosMenuNombre?: string;
  adultosCount?: number;
  ninosMenuId?: string;
  ninosMenuNombre?: string;
  ninosCount?: number;
  estimatedCostDelta: number;
  newTotal?: number;
  status: CateringChangeStatus;
  adminNotes?: string;
  resolvedAt?: string;
}

// --- SOCIAL SCREEN TEMPLATES ---
export type SocialScreenTemplate = 'minimal' | 'gradient' | 'dark-luxury';

export interface SocialScreenConfig {
  template: SocialScreenTemplate;
  instagramHandle?: string;
  tiktokHandle?: string;
  facebookHandle?: string;
  whatsappNumber?: string;
  showQR: boolean;
  qrUrl?: string;
  customTitle?: string;
  visibleNetworks: ('instagram' | 'tiktok' | 'facebook' | 'whatsapp')[];
}
