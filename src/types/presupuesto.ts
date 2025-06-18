
export type TipoEvento =
  | 'Boda'
  | 'XV años'
  | 'Cumpleaños'
  | 'Evento corporativo'
  | 'Cumpleaños infantil'
  | 'Otro';

export const ALL_TIPOS_EVENTO: TipoEvento[] = ['Boda', 'XV años', 'Cumpleaños', 'Evento corporativo', 'Cumpleaños infantil', 'Otro'];

// This interface will now represent a selected service in the budget
export interface ItemPresupuestado {
  idServicioCatalogo: string; // ID from servicios-empresa.json
  nombreServicio: string;
  descripcionServicio?: string; // Optional, can be copied from catalog or edited
  cantidad: number;
  unidad?: string; // From catalog, e.g., "unidad", "evento", "persona"
  precioUnitario: number; // Can be default from catalog or overridden for this budget
  costoTotalItem: number; // cantidad * precioUnitario
  categoriaServicio?: string; // From catalog, for grouping/display
}

export interface Presupuesto {
  id: string;
  clienteNombre: string;
  eventoTipo: TipoEvento | string;
  eventoFecha: string; // ISO String
  invitadosCantidad: number;
  salonFiestas: string;
  nombreEmpresa?: string; // Para eventos corporativos
  protagonista1Nombre?: string; // Para homenajeado o novio/a 1
  protagonista2Nombre?: string; // Para novio/a 2 (solo en bodas)

  itemsPresupuestados: ItemPresupuestado[];

  costoTotalEstimado: number; // Sum of all costoTotalItem (subtotal BEFORE discount)

  // Discount fields
  nombrePromocion?: string;
  descuentoTipo?: 'porcentaje' | 'fijo';
  descuentoValor?: number;
  totalConDescuento?: number; // Calculated: costoTotalEstimado - descuento
  vigenciaPromocion?: string; // e.g., "Válido hasta DD/MM/AAAA"

  timestamp: string; // ISO String
  estado: 'Borrador' | 'Enviado' | 'Aceptado' | 'Rechazado' | 'Facturado';
  notas?: string;
  invoiceId?: string;
}

// FormData for the multi-step creation process
// Kept clean of derived data like 'resumen'
export interface PresupuestoFormData {
  pasoActual: number;

  // Step 1
  clienteNombre: string;
  eventoTipo: TipoEvento | string; // Can be one of TipoEvento or a custom string if "Otro"
  eventoFecha: Date | undefined;
  invitadosCantidad: number | null;
  salonFiestas: string;
  nombreEmpresa?: string;
  protagonista1Nombre?: string;
  protagonista2Nombre?: string;

  // Step 2 - Service Selection
  serviciosSeleccionados: Map<string, { // Key is servicioId from catalog
    cantidad: number;
    precioUnitarioOriginal: number;
    precioUnitarioPresupuesto: number;
    nombreServicio: string;
    unidad?: string;
    categoriaServicio?: string;
  }>;

  // Step 3 - Discount and Notes
  nombrePromocion?: string;
  descuentoTipo?: 'porcentaje' | 'fijo';
  descuentoValor?: string; // Input as string, convert to number on save/calculation
  vigenciaPromocion?: string;
  notas: string;
}
