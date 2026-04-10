import type { TipoEvento } from './presupuesto';

export interface PlaybookTarea {
  titulo: string;
  descripcion?: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  categoria?: string;
  diasAntesEvento: number; // negative = before event, 0 = day-of
}

export interface PlaybookDocumento {
  nombre: string;
  tipo: string;
  obligatorio: boolean;
}

export interface PlaybookCompra {
  nombre: string;
  categoria: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  descripcion?: string;
}

export interface PlaybookEtapa {
  nombre: string;
  descripcion: string;
  orden: number;
  tareas: PlaybookTarea[];
}

export interface Playbook {
  id: string;
  nombre: string;
  tipoEvento: TipoEvento | 'Otro';
  descripcion: string;
  tareas: PlaybookTarea[];
  documentos: PlaybookDocumento[];
  compras: PlaybookCompra[];
  etapas: PlaybookEtapa[];
  timingsRecomendados: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  esPlantillaDefault: boolean;
}

export interface PlaybookAplicacion {
  id: string;
  playbookId: string;
  fiestaId: string;
  aplicadoEn: string;
  aplicadoPor: string;
  tareasGeneradas: number;
  documentosGenerados: number;
}
