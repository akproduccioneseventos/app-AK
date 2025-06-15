
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

export interface SalonLayoutData {
  backgroundImageUrl?: string;
  elements: LayoutElement[];
  generalNotes?: string;
}

export interface Tarea {
  id: string;
  texto: string; // Título de la tarea
  descripcion?: string; // Descripción breve opcional
  completada: boolean;
  fechaLimite?: string; // ISO string, opcional (Solo fecha)
  horaVencimiento?: string; // Opcional, ej: "14:30"
  recordatorio?: string; // Opcional, texto libre ej: "1h antes", "Al mediodía"
  asignadaA?: string;   // Opcional
  esPredeterminada?: boolean; // Para el checkbox, UI only por ahora
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
  decoracionTorta?: {
    descripcion?: string;
    imageUrl?: string;
    dataAiHint?: string;
  };
  items?: DecorationItem[];
  zonasContratadas?: ZonaContratada[];
  generalNotes?: string;
  pdfNotasAdicionales?: string;
}

export interface EventWebPageSettings {
  pageTitle?: string;
  heroSubtitle?: string;
  welcomeMessage?: string;
  coverImageUrl?: string;
  galleryImageUrls?: string[];
  showCountdown?: boolean;
  ourStoryTitle?: string;
  ourStoryText?: string;
  ourStoryImageUrl?: string;
  showOurStory?: boolean;
  eventDetailsTitle?: string;
  eventDetailsText?: string;
  showEventDetails?: boolean;
  dressCodeText?: string;
  showDressCode?: boolean;
  giftRegistryTitle?: string;
  giftRegistryText?: string;
  showGiftRegistry?: boolean;
  showGallery?: boolean;
  showRsvp?: boolean;
}

export interface MusicaFiesta {
  cancionEntrada?: string;
  cancionVals?: string;
  playlistFiesta?: string;
  listaNoReproducir?: string;
}

// Tipos para el Módulo de Repostería
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
  // Futuro: link a receta/ingredientes
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

// Tipos para el Módulo de Bebidas
export interface BebidaItem {
  id: string;
  nombre: string;
  marca?: string;
  presentacion?: string; // Ej: Botella 2L, Lata 350ml
  cantidadNecesaria?: number; // Calculada o manual
  unidadCantidad?: 'unidades' | 'litros' | 'botellas';
  costoUnitario?: number;
  costoTotal?: number; // Calculado
  proveedorHabitual?: string;
  notas?: string;
  // Futuro: link a producto/ingrediente
}

export type BebidaCategoriaId =
  | 'refrescos_gaseosas'
  | 'jugos'
  | 'aguas_saborizadas'
  | 'bebidas_alcoholicas_varias' // Ej: Aperitivos, licores
  | 'vinos_espumantes'
  | 'barra_tragos'
  | 'cafeteria';

export interface BebidaCategoria {
  id: BebidaCategoriaId;
  nombreDisplay: string;
  activada: boolean;
  descripcion?: string;
  items: BebidaItem[];
  // Futuro: configuraciones específicas de cálculo para esta categoría
}

export type TipoEventoAjusteBebidas = 'formal' | 'juvenil' | 'corporativo' | 'mixto_estandar';

export interface BebidasData {
  categorias: BebidaCategoria[];
  tipoEventoAjuste?: TipoEventoAjusteBebidas;
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
  salonLayout?: SalonLayoutData;
  tareas?: Tarea[];
  decoracion?: DecoracionData;
  invitados?: Invitado[];
  webPageSettings?: EventWebPageSettings;
  musica?: MusicaFiesta;
  reposteria?: ReposteriaData;
  bebidas?: BebidasData;
}
    
