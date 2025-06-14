
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
  estado: 'Borrador' | 'Enviado' | 'Aceptado' | 'Rechazado' | 'Facturado'; // Nuevo estado
  notas?: string;
  invoiceId?: string; // ID de la factura asociada si está facturado
}

// Para el formulario multi-paso
export interface PresupuestoFormData {
  pasoActual: number;
  
  // Paso 1
  clienteNombre: string;
  eventoTipo: TipoEvento | string;
  eventoFecha: Date | undefined;
  invitadosCantidad: number | null;
  salonFiestas: string; 
  nombreHomenajeado1: string; 
  nombreHomenajeado2: string; 
  nombreEmpresa: string; 

  // Paso 2
  platosDisponibles: PlatoPresupuesto[]; 
  platosSeleccionadosIds: Set<string>; 

  // Paso 3
  serviciosDisponibles: ServicioAdicional[]; 
  serviciosSeleccionadosIds: Set<string>; 

  // Paso 4 (Cálculos y resumen)
  resumen?: Presupuesto; 
  notas: string;
}

