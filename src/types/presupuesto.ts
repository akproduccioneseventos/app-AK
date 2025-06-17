
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

  itemsPresupuestados: ItemPresupuestado[]; // Replaces platosSeleccionados and serviciosAdicionales

  // Totals will be calculated based on itemsPresupuestados
  // costoSubtotalPlatos and costoSubtotalServicios are removed
  costoTotalEstimado: number; // Sum of all costoTotalItem

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
export interface PresupuestoFormData {
  pasoActual: number;

  // Step 1
  clienteNombre: string;
  eventoTipo: TipoEvento | string;
  eventoFecha: Date | undefined;
  invitadosCantidad: number | null;
  salonFiestas: string;
  nombreEmpresa?: string; // For "Evento corporativo"
  protagonista1Nombre?: string; // For main honoree or one partner
  protagonista2Nombre?: string; // For second partner (weddings)

  // Step 2 - Service Selection from Catalog (servicios-empresa.json)
  // Stores IDs of selected services from the catalog and their quantities + overridden prices if any
  serviciosSeleccionados: Map<string, { // Key is servicioId from catalog
    cantidad: number;
    precioUnitarioOriginal: number; // From catalog
    precioUnitarioPresupuesto: number; // Potentially overridden for this budget
    nombreServicio: string; // For display in summary
    unidad?: string; // From catalog
    categoriaServicio?: string; // From catalog
  }>;

  // Step 3 - Discount and Notes
  nombrePromocion?: string;
  descuentoTipo?: 'porcentaje' | 'fijo';
  descuentoValor?: string; // Input as string, convert to number on save
  vigenciaPromocion?: string;
  notas: string;

  // Generated summary for review before saving
  resumen?: Presupuesto;

  // This is no longer used for general services, platosDisponibles is also removed
  // serviciosDisponibles and serviciosSeleccionadosIds are replaced by serviciosSeleccionados Map
}
