export type EstadoEtapa = 'Pendiente' | 'En Progreso' | 'Completada' | 'Retrasada' | 'Cancelada';
export type CategoriaEtapa = 'Montaje' | 'Catering' | 'DJ' | 'Entrada' | 'Torta' | 'Brindis' | 'Fotografía' | 'Cierre' | 'General';

export interface ChecklistItemEtapa {
  id: string;
  texto: string;
  completado: boolean;
  completadoPor?: string;
  completadoEn?: string; // ISO string
}

export interface EtapaTimeline {
  id: string;
  nombre: string;
  descripcion?: string;
  horaInicio: string; // "HH:MM" format
  horaFin?: string;   // "HH:MM" format
  categoria: CategoriaEtapa;
  estado: EstadoEtapa;
  responsableLead: string;
  checklist: ChecklistItemEtapa[];
  alertaRetraso?: boolean;
  minutosRetraso?: number;
  notas?: string;
  orden: number;
}

export interface MissionControlData {
  fiestaId: string;
  etapas: EtapaTimeline[];
  ultimaActualizacion: string; // ISO string
  estadoGeneral: 'En Preparación' | 'En Curso' | 'Completado';
  notasGenerales?: string;
}
