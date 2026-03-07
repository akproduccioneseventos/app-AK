
import type { TipoEvento } from './presupuesto';
import type { Invitado } from './invitado'; 
import type { UnidadServicio } from './empresa';
import type { SocialGalleryPost } from './social-gallery';

// --- NOTIFICACIONES ---
export interface Notificacion {
  id: string;
  mensaje: string;
  href?: string; // Link a la página relevante
  fecha: string; // ISO String
  leida: boolean;
  icono?: string; // Nombre de un icono de lucide-react
}

// --- CARTA DE TRAGOS / MENU MESA ---
export interface Trago {
  id: string;
  nombre: string;
  imageUrl: string;
  aiHint?: string;
}

export interface CartaTragosData {
    titulo?: string;
    items: Trago[];
    protagonistaFotoUrl?: string; 
    protagonistaNombre?: string;
    numeroPrincipal?: string;
    backgroundImageUrl?: string;
    paletaColores?: Partial<ColorPalette>;
    backgroundColor?: string;
    empresa: {
        linea1: string;
        linea2: string;
        contacto: string;
    };
}

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
}

// --- MODULO 6: LIVE EVENT TYPES ---
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

// --- RESTO DE TIPOS ---

export interface ConfigEventoDataStorage {
  nombreEvento: string;
  tipoCelebracion: TipoEvento | string;
  fechaEvento?: string; 
  horaInicio: string;
  horaFin: string;
  nombreLugar: string;
  invitadosEstimados: number | string;
  presupuestoEstimado: number | string;
  notasAdicionales: string;
  clienteId?: string; 
  protagonista1Nombre?: string; 
  protagonista2Nombre?: string; 
  protagonistaFotoUrl?: string;
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
  width: number;
  height: number;
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

export interface DecoracionData {
  tema?: string;
  paletaColores?: ColorPalette;
  moodboardItems?: MoodboardItem[]; 
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
  completado?: boolean; // Módulo 6: Seguimiento en vivo
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
  category?: 'Boda' | 'XV Años' | 'Cumpleaños' | 'General';
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
    showRelationshipTags?: boolean; // Nuevo: Activar/Desactivar etiquetas de relación
  };
  despedida: {
    visible: boolean;
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

interface PortalViewOnlyModuleSettings {
  visible: boolean;
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
}

export interface SocialGallerySettings {
  enabled: boolean;
  title?: string;
  subtitle?: string;
  allowLikes: boolean;
  allowComments: boolean;
  uploadsActive: boolean;
  posts?: SocialGalleryPost[];
  backgroundColor?: string;
  accentColor?: string;
  chatEnabled?: boolean;
}

export interface MusicaFiesta {
  cancionEntrada?: string;
  cancionVals?: string;
  cancionesTortaBrindis?: string[]; 
  playlistFiesta?: string;
  listaNoReproducir?: string;
  sugerenciasInvitados?: string; 
}

export interface ReposteriaItem {
  id: string;
  nombre: string;
  description?: string;
  cantidad?: number;
  unidad?: 'unidad' | 'docena' | 'kg' | 'porción';
  costoEstimado?: number;
  precioSugerido?: number;
  imagenReferenciaUrl?: string;
  dataAiHint?: string;
  notas?: string;
  origenId?: string; 
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
  notas?: string;
  origenId?: string; 
  unidad?: UnidadServicio | string;
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
  cartaTragos: boolean;
  checkin: boolean;
  resumenImprimible: boolean;
  configuracion: boolean;
  disenoSalon: boolean;
  listaCompras: boolean;
  portalCliente: boolean;
  numerosMesa: boolean;
  mesasCliente: boolean;
  resumenPlanificacion: boolean;
  enVivo: boolean; // Nuevo: Módulo 6
}

export interface CompraProveedorEstado {
    proveedor: string;
    pedido: boolean;
    pagado: boolean;
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
  cartaTragos?: CartaTragosData;
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
  otrosDocumentos?: OtroDocumento[];
  pagosProveedores?: PagoProveedor[];
  estadosCompra?: CompraProveedorEstado[];
  generadoDesdeHistorico?: boolean; 
  liveState?: LiveEventState; // Nuevo: Módulo 6
}

export interface ContratoFirmaInfo {
    isSigned: boolean;
    signedAt?: string;
    method?: 'digital' | 'physical';
    signedBy?: string;
    ip?: string;
    physicalContractUrl?: string; 
}
