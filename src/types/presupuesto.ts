
export type TipoEvento =
  | 'Boda'
  | 'XV años'
  | 'Cumpleaños'
  | 'Evento corporativo'
  | 'Cumpleaños infantil'
  | 'Otro';

export interface PlatoPresupuesto {
  id: string;
  nombre: string;
  descripcion?: string;
  imagenUrl?: string; // URL de la imagen del plato
  dataAiHint?: string; // Para la búsqueda de imágenes
  costoPorPersona: number;
  seleccionado?: boolean; // Para UI
}

export interface ServicioAdicional {
  id: string;
  nombre: string;
  costo: number;
  seleccionado?: boolean; // Para UI
}

export interface Presupuesto {
  id: string; // ID del documento
  clienteNombre: string;
  eventoTipo: TipoEvento | string; // string para 'Otro'
  eventoFecha: string; // ISO date string
  invitadosCantidad: number;
  platosSeleccionados: {
    idPlato: string;
    nombrePlato: string;
    cantidad: number; // Generalmente igual a invitadosCantidad
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
  timestamp: string; // ISO date string del momento de creación/actualización
  estado: 'Borrador' | 'Enviado' | 'Aceptado' | 'Rechazado';
  notas?: string;
  // Los nuevos campos como salonFiestas, nombreHomenajeado1/2, nombreEmpresa no se añaden aquí
  // directamente a menos que se especifique que deben persistirse en el objeto Presupuesto final.
  // Por ahora, se recopilan en el formulario (PresupuestoFormData).
}

// Para el formulario multi-paso
export interface PresupuestoFormData {
  pasoActual: number;
  
  // Paso 1
  clienteNombre: string;
  eventoTipo: TipoEvento | string;
  eventoFecha: Date | undefined;
  invitadosCantidad: number | null;
  salonFiestas: string; // Nuevo campo obligatorio
  nombreHomenajeado1: string; // Para cumple/otro o Novio
  nombreHomenajeado2: string; // Para Novia (si es Boda)
  nombreEmpresa: string; // Para Evento Corporativo

  // Paso 2
  platosDisponibles: PlatoPresupuesto[]; // Cargados
  platosSeleccionadosIds: Set<string>; // IDs de platos seleccionados

  // Paso 3
  serviciosDisponibles: ServicioAdicional[]; // Definidos o cargados
  serviciosSeleccionadosIds: Set<string>; // IDs de servicios seleccionados

  // Paso 4 (Cálculos y resumen)
  resumen?: Presupuesto; // El presupuesto final calculado
  notas: string;
}

