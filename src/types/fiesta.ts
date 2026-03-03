
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


// --- CONFIGURACIÓN DEL ASISTENTE AK ---
export interface AsistentePasoOpcion {
  id: string;
  nombre: string;
  costoBase?: number;
  costoPorPersona?: number;
  multiplicadorCosto?: number;
  img?: string;
  hint?: string;
  valor?: boolean; 
}

export interface AsistentePasoConfig {
  pregunta: string;
  descripcion: string;
  opciones: AsistentePasoOpcion[];
}

export interface AsistenteAkConfig {
  pasos: {
    tipoFiesta: AsistentePasoConfig;
  }
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
    protagonistaFotoUrl?: string; // Foto principal de la carta
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


// --- RESTO DE TIPOS ---

export interface ConfigEventoDataStorage {
  nombreEvento: string;
  tipoCelebracion: TipoEvento | string;
  fechaEvento?: string; // ISO string for storage
  horaInicio: string;
  horaFin: string;
  nombreLugar: string;
  invitadosEstimados: number | string;
  presupuestoEstimado: number | string;
  notasAdicionales: string;
  clienteId?: string; // ID del cliente principal vinculado a esta fiesta
  protagonista1Nombre?: string; // Nuevo campo para el nombre del agasajado/a
  protagonista2Nombre?: string; // Nuevo campo para bodas
  protagonistaFotoUrl?: string;
}

export interface PersonalAsignadoDetalleStorage {
  empleadoId: string;
  rolId: string; // ID of the specific role for this event
  eventSalary: number;
}


export interface Reunion {
  id: string;
  titulo: string;
  fecha?: string; // ISO string, opcional
  notas: string;
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

export interface DecoracionData {
  tema?: string;
  paletaColores?: ColorPalette;
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
}

export interface GiftItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  dataAiHint?: string;
  isClaimed: boolean;
  claimedBy?: string; // Name of the guest who claimed it
}

export interface ProgramaEventoItem {
  id: string;
  hora: string; // HH:mm format
  titulo: string;
  descripcion?: string;
  icono?: string; // Nombre del icono de lucide-react
}

export interface ItineraryTemplate {
  id: string;
  name: string;
  items: ProgramaEventoItem[];
}

export interface TextStyle {
    fontFamily?: 'Belleza' | 'Inter' | 'Playfair_Display' | 'Dancing_Script';
    fontSize?: string; // '16px', '2rem', etc.
    color?: string; // hex, rgb, etc.
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
  data: any; // El contenido específico de cada sección
}

export interface InvitacionDigitalData {
  name?: string; // Only for templates
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
  };
  despedida: {
    visible: boolean;
    texto: TextWithStyle;
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
}

export interface SocialGallerySettings {
  enabled: boolean;
  title?: string;
  subtitle?: string;
  allowLikes: boolean;
  allowComments: boolean;
  uploadsActive: boolean;
  posts?: SocialGalleryPost[];
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
  descripcion?: string;
  cantidad?: number;
  unidad?: 'unidad' | 'docena' | 'kg' | 'porción';
  costoEstimado?: number;
  precioSugerido?: number;
  imagenReferenciaUrl?: string;
  dataAiHint?: string;
  notas?: string;
  origenId?: string; // Link to Insumo if applicable
}

export type ReposteriaCategoriaId =
  | 'tortas_personalizadas'
  | 'cupcakes_minitortas'
  | 'candy_bar'
  | 'fuente_chocolate'
  | 'mesa_dulce_tradicional'
  | 'mesa_helada'
  | 'postres_individuales';

export interface ReposteriaCategoria {
  id: ReposteriaCategoriaId;
  nombreDisplay: string;
  activada: boolean;
  descripcion?: string;
  cantidadEstimadaPersonas?: number;
  items: ReposteriaItem[];
}

export type TipoAsistente = 'adulto' | 'adolescente' | 'nino';

export type ReposteriaConsumoConfig = {
  [key in ReposteriaCategoriaId]: Record<TipoAsistente, number>;
};


export interface ReposteriaData {
  categorias: ReposteriaCategoria[];
  consumoConfig?: ReposteriaConsumoConfig;
  notasGenerales?: string;
}

export type BebidaItemEstado = 'Pendiente' | 'A Comprar' | 'Reservado Stock' | 'Contratado';

export interface BebidaItem {
  id: string;
  nombre: string;
  marca?: string;
  presentacion?: string; 
  cantidadNecesaria?: number; 
  unidadCantidad?: string; 
  costoUnitario?: number; 
  costoTotal?: number; 
  proveedorHabitual?: string;
  notas?: string;
  mlPorUnidad?: number; 
  origenId?: string;
  estado?: BebidaItemEstado;
  stockDisponible?: number;
}

export interface IngredienteReceta {
    id: string; // Unique within the recipe
    insumoId: string; // ID from a "ServicioEmpresa" of type "Insumo/Ingrediente" or "Bebida (Insumo)"
    nombreInsumo: string; // Denormalized name
    cantidad: number;
    unidad: string; // e.g., "lt", "kg", "unidad"
    costoUnitario: number; // Cost of 1 unit of this ingredient
    costoTotal: number; // cantidad * costoUnitario
}

export interface BebidaReceta {
    id: string;
    nombre: string;
    capacidadBaseLt: number; // e.g., 50
    porcionesBase: number; // e.g., 100
    ingredientes: IngredienteReceta[];
    costoTotalReceta: number;
    precioVentaSugerido?: number;
    notas?: string;
}

export type BebidaCategoriaId =
  | 'coctel_bienvenida'
  | 'refrescos_gaseosas'
  | 'jugos'
  | 'aguas_saborizadas'
  | 'cervezas'
  | 'vinos_espumantes'
  | 'barra_tragos'
  | 'cafeteria';
  

export type BebidasConsumoConfig = {
  [key in BebidaCategoriaId]: Record<TipoAsistente, number>;
};

export interface BebidaCategoria {
  id: BebidaCategoriaId;
  nombreDisplay: string;
  activada: boolean;
  descripcion?: string;
  items: BebidaItem[];
  recetas?: BebidaReceta[];
}


export interface BebidasData {
  categorias: BebidaCategoria[];
  consumoConfig?: BebidasConsumoConfig;
  notasGenerales?: string;
}

export type TareaAsignadaA = 'Cliente' | 'Organizador';

export interface Tarea {
  id: string;
  texto: string;
  descripcion?: string;
  completada: boolean;
  fechaLimite?: string; 
  horaVencimiento?: string; 
  recordatorio?: string; 
  asignadaA?: TareaAsignadaA;
  esPredeterminada?: boolean;
}

export interface ClientTarea {
  id: string;
  texto: string;
  completada: boolean;
  asignadaA: TareaAsignadaA;
}


export interface CargaOperativaItem {
  id: string;
  nombre: string;
  cantidad: string; // '1', '100', '1 por persona'
  cargado: boolean;
  notas?: string;
  origenId?: string; 
  unidad?: UnidadServicio | string;
  calculationMethod?: 'fijo' | 'porPersona' | 'porRatio';
  ratioPorInvitado?: number; // e.g., 1 unit for every 4 guests
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

export type CostoCategoria = 
  | 'Servicio Proveedor' 
  | 'Personal Evento' 
  | 'Compra General' 
  | 'Marketing y Publicidad'
  | 'Imprevistos'
  | 'Otro Costo Directo'
  | 'Pago de Salón';

export interface CostoItem {
  id: string;
  nombre: string;
  category: CostoCategoria;
  montoEstimado: number;
  montoReal?: number;
  notas?: string;
  proveedorSugerido?: string; 
}

export interface PagoProveedor {
  id: string;
  costoAsociadoId: string; // ID del CostoItem al que pertenece este pago
  fecha: string; // ISO date string
  monto: number;
  metodoPago?: string; // Ej: 'Transferencia', 'Efectivo'
  notas?: string;
}

export interface GestionCostosData {
  costosItems: CostoItem[];
  ingresosTotalesEstimados: number; 
  notasGeneralesCostos?: string;
}

export type EntregaMaterialEstado = 'Pendiente' | 'En edición' | 'En revisión' | 'Entregado parcial' | 'Entregado completo';

export interface ServicioFotografia {
    id: string;
    nombre: string;
    estado: EntregaMaterialEstado;
    fechaEntregaEstimada?: string; // ISO String
    linkEntrega?: string;
}

export interface FotografiaYFilmacionData {
    servicios: ServicioFotografia[];
    notasGenerales?: string;
}

export interface VideoVidaData {
  galleryEnabled: boolean;
  photosUploaded: boolean;
  songSuggestion?: string;
  customText?: string;
  photoCount?: number;
}

export type DocumentoTipo = 'contrato_salon' | 'contrato_servicio' | 'presupuesto_firmado' | 'recibo_pago' | 'recibo_salon' | 'recibo_agadu' | 'recibo_personal' | 'otro';
export interface OtroDocumento {
  id: string;
  nombre: string;
  tipo: DocumentoTipo;
  fileName: string; // e.g., 'contrato-salon-fiesta123.pdf'
  timestamp: string; // ISO String
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
}

export interface CompraProveedorEstado {
    proveedor: string;
    pedido: boolean;
    pagado: boolean;
}

export interface FiestaEnPlanificacion {
  id: string;
  configuracion: ConfigEventoDataStorage;
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
  
  // New unified object for digital presence
  invitacionDigital?: InvitacionDigitalData;

  // New object for drink menu
  cartaTragos?: CartaTragosData;
  menuMesa?: MenuMesaData;
  numerosMesa?: NumerosMesaData;

  // Event specific contract text (override template)
  contratoServicioTexto?: string;

  // Deprecated - will be migrated to invitacionDigital
  webPageSettings?: EventWebPageSettings; 

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
  
  // New flexible document storage
  otrosDocumentos?: OtroDocumento[];
  // New provider payment tracking
  pagosProveedores?: PagoProveedor[];

  estadosCompra?: CompraProveedorEstado[];
  generadoDesdeHistorico?: boolean; // Flag para rastrear origen
}

export interface RestorePoint {
  name: string;
  timestamp: string;
  displayDate: string;
}

// Deprecated, keep for data migration if necessary
export interface EventWebPageSettings {
  pageTitle: string;
  heroSubtitle?: string;
  welcomeMessage: string;
  coverImageUrl: string; 
  galleryImageUrls: string[]; 
  showCountdown: boolean;
  ourStoryTitle?: string;
  ourStoryText?: string;
  ourStoryImageUrl?: string; 
  showOurStory: boolean; 
  eventDetailsTitle?: string;
  eventDetailsText?: string;
  showEventDetails: boolean;
  dressCodeText?: string;
  showDressCode: boolean;
  giftRegistryTitle?: string;
  giftRegistryText?: string;
  showGiftRegistry: boolean;
  giftRegistry?: GiftItem[];
  showRsvp: boolean;
  showPrograma: boolean;
  musicaEspecialText?: string;
  showGallery: boolean; 
  templateName: 'Obsidiana' | 'Grazia' | 'Allegria';
}
