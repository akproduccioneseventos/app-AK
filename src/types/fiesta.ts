
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

// This will grow to include Tareas, Invitados, Decoracion, etc.
export interface FiestaEnPlanificacion {
  id: string; 
  configuracion: ConfigEventoDataStorage; // Non-optional after initialization
  personalAsignado: PersonalAsignadoDetalleStorage[];
  menuAsignadoId?: string; // ID of the FullMenu assigned to this party
  presupuestoId?: string; // ID of the Presupuesto assigned to this party
  invoiceIds?: string[]; // IDs of Invoices assigned to this party
  reuniones?: Reunion[]; // Nuevo campo para reuniones
  // tareas?: Tarea[]; // Future: Define Tarea type
  // invitados?: Invitado[]; // Future: Define Invitado type
  // decoracion?: DecoracionData; // Future
}

