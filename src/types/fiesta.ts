
import type { TipoEvento } from './presupuesto';
import type { Invitado } from './invitado'; // Importar Invitado

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
  salonPlanBackgroundImageUrl?: string;
  salonElements?: LayoutElement[];
  generalNotesSalonLayout?: string;
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
  showGallery?: boolean;
  showRsvp?: boolean;
  programaEventoText?: string;
  musicaEspecialText?: string;
}

export interface MusicaFiesta {
  cancionEntrada?: string;
  cancionVals?: string;
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

export interface ReposteriaData {
  categorias: ReposteriaCategoria[];
  notasGenerales?: string;
}

export interface BebidaItem {
  id: string;
  nombre: string;
  marca?: string;
  presentacion?: string;
  cantidadNecesaria?: number;
  unidadCantidad?: 'unidades' | 'litros' | 'botellas';
  costoUnitario?: number;
  costoTotal?: number;
  proveedorHabitual?: string;
  notas?: string;
}

export type BebidaCategoriaId =
  | 'refrescos_gaseosas'
  | 'jugos'
  | 'aguas_saborizadas'
  | 'bebidas_alcoholicas_varias'
  | 'vinos_espumantes'
  | 'barra_tragos'
  | 'cafeteria';

export interface BebidaCategoria {
  id: BebidaCategoriaId;
  nombreDisplay: string;
  activada: boolean;
  descripcion?: string;
  items: BebidaItem[];
}

export type TipoEventoAjusteBebidas = 'formal' | 'juvenil' | 'corporativo' | 'mixto_estandar';

export interface BebidasData {
  categorias: BebidaCategoria[];
  tipoEventoAjuste?: TipoEventoAjusteBebidas;
  notasGenerales?: string;
}

export interface Tarea {
  id: string;
  texto: string;
  descripcion?: string;
  completada: boolean;
  fechaLimite?: string; // ISO string
  horaVencimiento?: string; // HH:mm
  recordatorio?: string; // Ej: "1 día antes", "2 horas antes"
  asignadaA?: string;
  esPredeterminada?: boolean; // Indica si es una tarea base que se puede reutilizar
}

export interface CargaOperativaItem {
  id: string;
  nombre: string;
  cantidad: string; // Puede ser "1 caja", "20 unidades", "Equipo completo"
  cargado: boolean;
  notas?: string;
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
  webPageSettings?: EventWebPageSettings;
  musica?: MusicaFiesta;
  reposteria?: ReposteriaData;
  bebidas?: BebidasData;
  listaDeCargaOperativa?: ListaDeCargaOperativa;
}
