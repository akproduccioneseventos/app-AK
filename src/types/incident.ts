export type PrioridadIncidente = 'Critica' | 'Alta' | 'Media' | 'Baja';

export type EstadoIncidente = 'Abierto' | 'En Proceso' | 'Resuelto' | 'Cerrado';

export type CategoriaIncidente =
  | 'Proveedor'
  | 'Catering'
  | 'Técnico'
  | 'Clima'
  | 'Invitados'
  | 'Personal'
  | 'Logística'
  | 'Otro';

export interface IncidenteActualizacion {
  id: string;
  texto: string;
  autor: string;
  timestamp: string;
}

export interface Incidente {
  id: string;
  fiestaId: string;
  titulo: string;
  descripcion: string;
  categoria: CategoriaIncidente;
  prioridad: PrioridadIncidente;
  estado: EstadoIncidente;
  responsable: string;
  planAccion: string;
  seguimiento: string;
  leccionesAprendidas?: string;
  registradoEn: string;
  registradoPor: string;
  resolvedAt?: string;
  actualizaciones: IncidenteActualizacion[];
}
