
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
  texto: string;
  completada: boolean;
  fechaLimite?: string; // ISO string, opcional
  asignadaA?: string;   // Opcional
}

export interface ColorPalette {
  primary: string; // Ejemplo: Color Principal (ej. cubremantel)
  secondary: string; // Ejemplo: Color Globos
  accent: string; // Ejemplo: Colores de acento o detalles
}

export interface DecorationItem {
  id: string;
  name: string;
  category?: string; // Ej: Flores, Iluminación, Textil, Mobiliario Pequeño, Centro de Mesa, Entrada, Zona de Regalos, Cuadro de Firmas
  quantity: number;
  estimatedCost?: number; 
  supplier?: string;
  notes?: string; // Esto puede ser la "Descripción" para el PDF
  imageUrl?: string;
  dataAiHint?: string;
}

export interface ZonaPersonalizada {
  id: string;
  nombreZona: string; // Ej: Atrás de la torta, Frente del salón, Zona de fotografía
  descripcion?: string;
  imageUrl?: string;
  dataAiHint?: string;
}

export interface DecoracionData {
  tema?: string;
  paletaColores?: ColorPalette;
  moodboardImageUrl?: string; // Para "Imagen de portada decorativa" del PDF
  colorCubremantel?: string;
  generalNotes?: string; // Para "Descripción general de la decoración" en la app y potencialmente en el PDF
  decoracionTorta?: {
    descripcion?: string;
    imageUrl?: string;
    dataAiHint?: string;
  };
  items?: DecorationItem[]; // Para elementos generales
  zonasPersonalizadas?: ZonaPersonalizada[]; // Para "Zonas activadas/personalizadas"
  pdfNotasAdicionales?: string; // Notas específicas para el PDF
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
}
    