
export type TipoEvento =
  | 'Boda'
  | 'XV años'
  | 'Cumpleaños'
  | 'Evento corporativo'
  | 'Cumpleaños infantil'
  | 'Otro';

export const ALL_TIPOS_EVENTO: TipoEvento[] = ['Boda', 'XV años', 'Cumpleaños', 'Evento corporativo', 'Cumpleaños infantil', 'Otro'];

export interface ItemPresupuestado {
  idServicioCatalogo: string;
  nombreServicio: string;
  descripcionServicio?: string;
  cantidad: number;
  unidad?: string;
  precioUnitario: number;
  costoTotalItem: number;
  categoriaServicio?: string;
}

export interface Presupuesto {
  id: string;
  clienteNombre: string;
  eventoTipo: TipoEvento | string;
  eventoFecha: string; // ISO String
  invitadosCantidad: number;
  salonFiestas: string;
  nombreEmpresa?: string;
  protagonista1Nombre?: string;
  protagonista2Nombre?: string;
  itemsPresupuestados: ItemPresupuestado[];
  costoTotalEstimado: number; // Suma de itemsPresupuestados (subtotal ANTES de descuento)
  nombrePromocion?: string;
  descuentoTipo?: 'porcentaje' | 'fijo';
  descuentoValor?: number;
  totalConDescuento?: number; // Calculado: costoTotalEstimado - descuento
  vigenciaPromocion?: string;
  timestamp: string; // ISO String
  estado: 'Borrador' | 'Enviado' | 'Aceptado' | 'Rechazado' | 'Facturado';
  notas?: string;
  invoiceId?: string;
}

// FormData para el proceso de creación de varios pasos.
// Mantiene solo los datos de entrada, el objeto Presupuesto completo se construye al final.
export interface PresupuestoFormData {
  pasoActual: number;

  // Paso 1
  clienteNombre: string;
  eventoTipo: TipoEvento | string;
  eventoFecha: Date | undefined;
  invitadosCantidad: number | null;
  salonFiestas: string;
  nombreEmpresa?: string;
  protagonista1Nombre?: string;
  protagonista2Nombre?: string;

  // Paso 2 - Selección de Servicios
  // La clave es el ID del servicio del catálogo.
  serviciosSeleccionados: Map<string, {
    cantidad: number;
    precioUnitarioOriginal: number; // Precio del catálogo
    precioUnitarioPresupuesto: number; // Precio ajustado para este presupuesto
    nombreServicio: string;
    unidad?: string;
    categoriaServicio?: string;
  }>;

  // Paso 3 (integrado en el resumen ahora) - Descuentos y Notas
  nombrePromocion?: string;
  descuentoTipo?: 'porcentaje' | 'fijo';
  descuentoValor?: string; // Como string para el input, se convierte a número al guardar/calcular
  vigenciaPromocion?: string;
  notas: string;
}
