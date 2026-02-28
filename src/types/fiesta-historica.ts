
import type { ItemPresupuestado, TipoEvento } from './presupuesto';
import type { Tarea } from './fiesta';

export interface FiestaHistorica {
  id: string;
  clienteId?: string;
  nombreEvento: string;
  clienteNombre: string;
  clienteContacto?: string;
  anioOriginal: number;
  fechaOriginal?: string;
  lugar: string;
  tipoFiesta: TipoEvento | string;
  cantidadInvitados: number;
  presupuestoTotalOriginal: number;
  detalleCostos: ItemPresupuestado[];
  checklistBase: Tarea[];
  contratoUrl?: string;
  observaciones?: string;
  fechaCreacion: string;
}

export interface ProyeccionHistorica {
  anioNuevo: number;
  añosTranscurridos: number;
  montoAjustado: number;
  factorAjuste: number;
}
