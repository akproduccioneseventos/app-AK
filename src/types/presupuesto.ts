
export type TipoEvento =
  | 'Boda'
  | 'XV años'
  | 'Cumpleaños'
  | 'Evento corporativo'
  | 'Cumpleaños infantil'
  | 'Otro';

// Actualizada la lista de tipos de evento
export const ALL_TIPOS_EVENTO: TipoEvento[] = ['Boda', 'XV años', 'Cumpleaños', 'Evento corporativo', 'Cumpleaños infantil', 'Otro'];


export interface PlatoPresupuesto {
  id: string;
  nombre: string;
  descripcion?: string;
  imagenUrl?: string; 
  dataAiHint?: string; 
  costoPorPersona: number;
  seleccionado?: boolean; 
}

export interface ServicioAdicional {
  id: string;
  nombre: string;
  costo: number;
  seleccionado?: boolean; 
}

export interface Presupuesto {
  id: string; 
  clienteNombre: string;
  eventoTipo: TipoEvento | string; 
  eventoFecha: string; 
  invitadosCantidad: number;
  platosSeleccionados: {
    idPlato: string;
    nombrePlato: string;
    cantidad: number; 
    costoUnitario: number;
    costoTotalPlato: number;
  }[];
  serviciosAdicionales: {
    idServicio: string;
    nombreServicio: string;
    costoServicio: number;
  }[];
  costoSubtotalPlatos: number;
  costoSubtotalServicios: number;
  costoTotalEstimado: number;
  timestamp: string; 
  estado: 'Borrador' | 'Enviado' | 'Aceptado' | 'Rechazado' | 'Facturado';
  notas?: string;
  invoiceId?: string; 
}

export interface PresupuestoFormData {
  pasoActual: number;
  
  clienteNombre: string;
  eventoTipo: TipoEvento | string; 
  eventoFecha: Date | undefined;
  invitadosCantidad: number | null;
  salonFiestas: string; 
  nombreHomenajeado1: string; 
  nombreHomenajeado2: string; 
  nombreEmpresa: string; 

  platosDisponibles: PlatoPresupuesto[]; 
  platosSeleccionadosIds: Set<string>; 

  serviciosDisponibles: ServicioAdicional[]; 
  serviciosSeleccionadosIds: Set<string>; 

  resumen?: Presupuesto; 
  notas: string;
}
