
import type { TipoEvento } from './presupuesto';

export interface ConfigEventoDataStorage {
  nombreEvento: string;
  tipoCelebracion: TipoEvento | string;
  fechaEvento?: string; // ISO string for storage
  horaInicio: string;
  horaFin: string;
  nombreLugar: string;
  direccionLugar: string;
  invitadosEstimados: number | string;
  presupuestoEstimado: number | string;
  notasAdicionales: string;
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
  quantity: number; // Aunque para un plano visual 1 elemento = 1 visualización, quantity podría ser informativo. Para el visual, cada "unidad" se añade como un elemento individual.
  notes?: string; 
  imageUrl?: string; // URL de la imagen para este elemento
  x: number; // Coordenada X en el plano
  y: number; // Coordenada Y en el plano
  width?: number; // Ancho del elemento en el plano (en px, por ejemplo)
  height?: number; // Alto del elemento en el plano (en px)
  rotation?: number; // Rotación en grados
  type: 'predefined' | 'custom'; // Para diferenciar si es de una biblioteca o algo añadido por el usuario
  category?: string; // Ej: 'Mobiliario', 'Decoración', 'Equipamiento'
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
}

export interface DecoracionData {
  tema?: string;
  paletaColores?: ColorPalette;
  moodboardImageUrl?: string;
  items?: DecorationItem[]; // Cambiado de notas a una lista de items
  generalNotes?: string; // Se puede mantener para notas generales de decoración
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
}

