
export type TipoEvento =
  | 'Boda'
  | 'XV años'
  | 'Cumpleaños'
  | 'Evento corporativo'
  | 'Cumpleaños infantil'
  | 'Otro';

export const ALL_TIPOS_EVENTO: (TipoEvento | 'Otro')[] = ['Boda', 'XV años', 'Cumpleaños', 'Evento corporativo', 'Cumpleaños infantil', 'Otro'];

export interface ItemPresupuestado {
  idServicioCatalogo: string;
  nombreServicio: string;
  descripcionServicio?: string;
  cantidad: number;
  unidad?: string;
  precioUnitario: number;
  costoTotalItem: number;
  categoriaServicio?: string;
  esRegalo?: boolean; // Nuevo campo para marcar como regalo
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
  descuentoValor?: number; // El valor numérico del descuento
  totalConDescuento?: number; // Calculado: costoTotalEstimado - (descuento si aplica)
  vigenciaPromocion?: string; // Ej: "Hasta 30/06/2024" o una fecha
  timestamp: string; // ISO String
  estado: 'Borrador' | 'Enviado' | 'Aceptado' | 'Rechazado' | 'Facturado';
  notas?: string;
  invoiceId?: string; // ID de la factura si este presupuesto fue facturado
  
  // Legacy fields for migration, should not be used in new code
  platosSeleccionados?: any[];
  serviciosAdicionales?: any[];
}


// FormData para el proceso de creación de varios pasos.
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
  serviciosSeleccionados: Map<string, {
    cantidad: number;
    precioUnitarioOriginal: number;
    precioUnitarioPresupuesto: number;
    nombreServicio: string;
    unidad?: string;
    categoriaServicio?: string;
    esRegalo: boolean; // Nuevo campo
  }>;

  // Paso 3 (Resumen) - Descuentos y Notas
  nombrePromocion?: string;
  descuentoTipo?: 'porcentaje' | 'fijo';
  descuentoValor?: string; // Como string para el input, se convierte a número al guardar/calcular
  vigenciaPromocion?: string;
  notas: string;
}
