
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
  items?: DecorationItem[];
  generalNotes?: string; // Renombrado de 'notas' para evitar confusión con notas de DecorationItem
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

