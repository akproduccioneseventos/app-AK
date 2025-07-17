

import type { TipoEvento } from './presupuesto';
import type { Invitado } from './invitado'; // Importar Invitado
import type { UnidadServicio } from './empresa';

// --- CONFIGURACIÓN DEL ASISTENTE AK ---
export interface AsistentePasoOpcion {
  id: string;
  nombre: string;
  costoBase?: number;
  costoPorPersona?: number;
  multiplicadorCosto?: number;
  img?: string;
  hint?: string;
  valor?: boolean; // For simple yes/no steps like 'Regalos'
}

export interface AsistentePasoConfig {
  pregunta: string;
  descripcion: string;
  opciones: AsistentePasoOpcion[];
}

export interface AsistenteAkConfig {
  pasos: {
    tipoFiesta: AsistentePasoConfig;
    decoracion: AsistentePasoConfig;
    catering: AsistentePasoConfig;
    bebidas: AsistentePasoConfig;
    fotoVideo: AsistentePasoConfig;
    musica: AsistentePasoConfig;
    reposteria: AsistentePasoConfig;
    entretenimiento: AsistentePasoConfig;
    regalos: AsistentePasoConfig;
  }
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
}

export interface PersonalAsignadoDetalleStorage {
  empleadoId: string;
  eventSalary: number;
}

export interface Reunion {
  id: string;
  titulo: string;
  fecha?: string; // ISO string, opcional
  notas: string;
}

export interface LayoutElement {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  imageUrl?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  type: 'predefined' | 'custom';
  category?: string;
  dataAiHint?: string;
  seats?: number;
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
  layoutMode?: 'libre' | 'asignado';
  guestNameStyle?: 'full' | 'initials' | 'none';
  guestIconStyle?: 'color' | 'bw';
  layoutTemplateName?: string;
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

export interface EventWebPageSettings {
  pageTitle?: string;
  heroSubtitle?: string;
  welcomeMessage?: string;
  coverImageUrl?: string; // Data URI or URL
  galleryImageUrls?: string[]; // Array of Data URIs or URLs
  showCountdown?: boolean;
  ourStoryTitle?: string;
  ourStoryText?: string;
  ourStoryImageUrl?: string; // Data URI or URL
  showOurStory?: boolean;
  eventDetailsTitle?: string;
  eventDetailsText?: string; // Can include program/schedule here
  showEventDetails?: boolean;
  dressCodeText?: string;
  showDressCode?: boolean;
  giftRegistryTitle?: string;
  giftRegistryText?: string;
  showGiftRegistry?: boolean;
  giftRegistry?: GiftItem[];
  showRsvp?: boolean;
  showPrograma?: boolean;
  musicaEspecialText?: string;
  showGallery?: boolean; // Added this
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
  fotografiaYFilmacion: PortalViewOnlyModuleSettings; // Added for new module
}

export interface SocialGallerySettings {
  enabled: boolean;
  allowLikes: boolean;
  allowComments: boolean;
  uploadsActive: boolean;
}

export interface MusicaFiesta {
  cancionEntrada?: string;
  cancionVals?: string;
  cancionesTortaBrindis?: string[]; // Música para corte de torta y brindis
  playlistFiesta?: string;
  listaNoReproducir?: string;
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
  imagenReferenciaUrl?: string;
  dataAiHint?: string;
}

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
  presentacion?: string; // Ej: "Botella 2.25L", "Lata 355ml"
  cantidadNecesaria?: number; // Cantidad de unidades a comprar
  unidadCantidad?: string; // Ej: "botellas", "packs", "cajas"
  costoUnitario?: number; // Costo por unidad de compra
  costoTotal?: number; // cantidad * costoUnitario
  proveedorHabitual?: string;
  notas?: string;
  mlPorUnidad?: number; // Ej: 2250 para una botella de 2.25L
  origenId?: string;
  estado?: BebidaItemEstado;
  stockDisponible?: number;
}

export type BebidaCategoriaId =
  | 'refrescos_gaseosas'
  | 'jugos'
  | 'aguas_saborizadas'
  | 'cervezas'
  | 'vinos_espumantes'
  | 'barra_tragos'
  | 'cafeteria';
  
export type TipoAsistente = 'adulto' | 'adolescente' | 'nino';

export type BebidasConsumoConfig = {
  [key in BebidaCategoriaId]: Record<TipoAsistente, number>;
};


export interface BebidaCategoria {
  id: BebidaCategoriaId;
  nombreDisplay: string;
  activada: boolean;
  descripcion?: string;
  items: BebidaItem[];
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
  fechaLimite?: string; // ISO string
  horaVencimiento?: string; // HH:mm
  recordatorio?: string; // Ej: "1 día antes", "2 horas antes"
  asignadaA?: TareaAsignadaA;
  esPredeterminada?: boolean; // Indica si es una tarea base que se puede reutilizar
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
  cantidad: string; // Mantenemos string para flexibilidad (ej: "10", "1 caja", "Set completo")
  cargado: boolean;
  notas?: string;
  origenId?: string; // ID del ítem original en el catálogo maestro (servicios-empresa.json)
  unidad?: UnidadServicio | string; // Unidad del ítem, idealmente desde el catálogo
}

export interface CargaOperativaCategoria {
  id: string; 
  nombre: string; 
  items: CargaOperativaItem[];
}

export interface ListaDeCargaOperativa {
  categorias: CargaOperativaCategoria[];
  notasGenerales?: string;
}

// Tipos para Gestión de Costos y Rentabilidad
export type CostoCategoria = 
  | 'Servicio Proveedor' 
  | 'Personal Evento' 
  | 'Compra General' 
  | 'Marketing y Publicidad'
  | 'Gastronomía (Catering)'
  | 'Gastronomía (Reposteria)'
  | 'Gastronomía (Bebidas)'
  | 'Imprevistos'
  | 'Otro Costo Directo';

export interface CostoItem {
  id: string;
  nombre: string;
  categoria: CostoCategoria;
  montoEstimado: number;
  montoReal?: number;
  notas?: string;
  proveedorSugerido?: string; // Opcional, para referencia
}

export interface GestionCostosData {
  costosItems: CostoItem[];
  ingresosTotalesEstimados: number; // Ingreso manual del evento
  notasGeneralesCostos?: string;
}

export interface VideoVidaData {
  galleryEnabled: boolean;
  photosUploaded: boolean;
  uploadDate?: string; // ISO string
  songSuggestion?: string;
  customText?: string;
}

export type EntregaMaterialEstado = 'Pendiente' | 'En edición' | 'En revisión' | 'Entregado parcial' | 'Entregado completo';

export interface FotografiaYFilmacionData {
    fechaEstimadaEntregaFotos?: string; // ISO String
    fechaEstimadaEntregaVideo?: string; // ISO String
    fechaEntregaFinal?: string; // ISO String
    estadoEntrega: EntregaMaterialEstado;
    linkDescargaFotos?: string;
    linkDescargaVideo?: string;
    recibidoPorCliente: boolean;
    notasEntrega?: string;
}

export interface FiestaEnPlanificacion {
  id: string;
  configuracion: ConfigEventoDataStorage;
  personalAsignado: PersonalAsignadoDetalleStorage[];
  menuAsignadoId?: string;
  presupuestoId?: string;
  invoiceIds?: string[];
  reuniones?: Reunion[];
  tareas?: Tarea[];
  decoracion?: DecoracionData;
  invitados?: Invitado[];
  clientChecklist?: ClientTarea[];
  clientNotes?: string; // Added field for client notes
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
}
