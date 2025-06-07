export type TipoEvento = 'Cumpleaños' | 'Boda' | 'Fiesta de 15' | 'Baby Shower' | 'Otro';

export interface PlatoPresupuesto {
  id: string;
  nombre: string;
  descripcion?: string;
  imagenUrl?: string; // URL de la imagen del plato
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
  id: string; // ID del documento en Firestore
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
  estado?: 'Borrador' | 'Enviado' | 'Aceptado' | 'Rechazado'; // Opcional
  notas?: string;
}

// Para el formulario multi-paso
export interface PresupuestoFormData {
  pasoActual: number;
  
  // Paso 1
  clienteNombre: string;
  eventoTipo: TipoEvento | string;
  eventoFecha: Date | undefined;
  invitadosCantidad: number | null;

  // Paso 2
  platosDisponibles: PlatoPresupuesto[]; // Cargados de Firestore (simulado)
  platosSeleccionadosIds: Set<string>; // IDs de platos seleccionados

  // Paso 3
  serviciosDisponibles: ServicioAdicional[]; // Definidos o cargados
  serviciosSeleccionadosIds: Set<string>; // IDs de servicios seleccionados

  // Paso 4 (Cálculos y resumen)
  resumen?: Presupuesto; // El presupuesto final calculado
  notas: string; // Se inicializa vacío
}
