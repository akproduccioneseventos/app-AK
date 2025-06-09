
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
  category?: string; // Ej: 'Mobiliario', 'Decoración Floral', 'Iluminación', 'Equipamiento', 'Zona', 'Otro'
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
  primary: string;
  secondary: string;
  accent: string;
}

export interface DecorationItem {
  id: string;
  name: string;
  category?: string; // Ej: Flores, Iluminación, Textil, Mobiliario Pequeño
  quantity: number;
  estimatedCost?: number; // Costo unitario o total para este item específico
  supplier?: string;
  notes?: string;
  imageUrl?: string;
}

export interface DecoracionData {
  tema?: string;
  paletaColores?: ColorPalette;
  moodboardImageUrl?: string;
  items?: DecorationItem[];
  generalNotes?: string; 
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
