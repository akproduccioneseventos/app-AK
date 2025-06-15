
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
  // Campos relacionados con el salón y empresa, que se guardan en las notas o en campos dedicados si se decide.
  // salonFiestas?: string; // Podría ser parte de las notas o un campo separado en el futuro
  // nombreEmpresa?: string; // Para eventos corporativos, podría ir en notas o campo dedicado

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
  salonFiestas: string; // Campo obligatorio
  nombreEmpresa: string; // Para "Evento corporativo"

  platosDisponibles: PlatoPresupuesto[];
  platosSeleccionadosIds: Set<string>;

  serviciosDisponibles: ServicioAdicional[];
  serviciosSeleccionadosIds: Set<string>;

  resumen?: Presupuesto;
  notas: string;
}
