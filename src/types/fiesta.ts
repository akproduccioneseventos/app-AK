
import type { TipoEvento } from './presupuesto';
import type { UnidadServicio } from './empresa';
import type { SocialGalleryPost } from './social-gallery';

// --- NOTIFICACIONES ---
export interface Notificacion {
  id: string;
  mensaje: string;
  href?: string;
  fecha: string;
  leida: boolean;
  icono?: string;
}

// --- INVITADOS ---
export type RsvpStatus = 'Pendiente' | 'Confirmado' | 'Rechazado' | 'Tal vez';
export type CategoriaInvitado = 'Adulto' | 'Niño/Adolescente';

export type DietaryRestriction = 'Ninguna' | 'Celiaco' | 'Vegetariano' | 'Vegano' | 'Otro';

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
  cancionesDJ?: string[];
}

// --- MENU MESA ---
export interface MenuMesaData {
  protagonistaFotoUrl?: string;
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
  tipo: 'globo' | 'flor' | 'arco' | 'lazo' | 'candelabro' | 'mesaTorta' | 'tela' | 'globosMacizos' | 'centroMesa';
  x: number;
  y: number;
  escala: number;
  colores: string[];
  rotacion?: number;
  etiqueta?: string;
}

// --- CREATOR PARTY EXTENDED TYPES ---

export interface DecoItem {
  id: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  /** @deprecated use costoUnitario for internal cost tracking */
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
}

export interface SocialGallerySettings {
  enabled: boolean;
  title?: string;
  subtitle?: string;
  allowLikes: boolean;
  allowComments: boolean;
  uploadsActive: boolean;
  backgroundColor?: string;
  accentColor?: string;
  chatEnabled?: boolean;
  maxPhotos?: number;
  showAds?: boolean;
  showSongRequests?: boolean;
  showPolls?: boolean;
  showDedications?: boolean;
  photoFrame?: boolean;
  momentosActivos?: { id: string; nombre: string; emoji: string; timestamp: string }[];
  sorteoParticipantesRedes?: { nombre: string; timestamp: string }[];
  sorteoGanadores?: string[];
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
}

export interface CartaTragosData {
  titulo?: string;
  protagonistaNombre?: string;
  numeroPrincipal?: string;
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

export interface FiestaEnPlanificacion {
  id: string;
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
  menuMesa?: MenuMesaData;
  numerosMesa?: NumerosMesaData;
  contratoServicioTexto?: string;
  contratoFirmaInfo?: ContratoFirmaInfo; 
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
}

export interface ContratoFirmaInfo {
    isSigned: boolean;
    signedAt?: string;
    method?: 'digital' | 'physical';
    signedBy?: string;
    ip?: string;
    physicalContractUrl?: string; 
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
export type DocumentoTipo = 'contrato-servicio' | 'contrato_servicio' | 'contrato-salon' | 'contrato_salon' | 'cancelacion' | 'cambio-fecha' | 'presupuesto_firmado' | 'recibo_pago' | 'recibo_salon' | 'recibo_agadu' | 'recibo_personal' | 'otro';

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
