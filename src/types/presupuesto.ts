

import type { ServicioEmpresa } from './empresa';

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
  precioUnitario: number; // The price used for calculation in this budget (can be overridden)
  precioUnitarioPresupuesto: number; // The price at the moment the budget was created/last updated
  costoTotalItem: number; // Final calculated cost for this line item
  categoriaServicio?: string;
  esRegalo?: boolean;
  
  // Fields to support complex calculations, copied from catalog or overridden
  calculationMethod?: 'fijo' | 'porPersona' | 'ratio' | 'tramos';
  precioBase?: number;
  precioPorPersona?: number;
  invitadosPorUnidad?: number;
  tramosDePrecio?: { id: string; desde: number; hasta: number; precio: number }[];
}

export interface Presupuesto {
  id: string;
  clienteNombre: string;
  clienteContacto?: string;
  eventoTipo: TipoEvento | string;
  eventoFecha: string; // ISO String
  invitadosCantidad: number; // Total de invitados (adultos + ninos + adolescentes)
  invitadosAdultos?: number;
  invitadosNinos?: number;
  invitadosAdolescentes?: number;
  salonFiestas: string;
  nombreEmpresa?: string;
  protagonista1Nombre?: string;
  protagonista2Nombre?: string;
  itemsPresupuestados: ItemPresupuestado[];
  costoTotalEstimado: number; // Sum of non-gift items (subtotal BEFORE discount)
  nombrePromocion?: string;
  descuentoTipo?: 'porcentaje' | 'fijo';
  descuentoValor?: number;
  totalConDescuento?: number; // Calculated: costoTotalEstimado - discount
  vigenciaPromocion?: string;
  timestamp: string; // ISO String
  estado: 'Borrador' | 'Enviado' | 'Aceptado' | 'Rechazado' | 'Facturado';
  notas?: string;
  invoiceId?: string;
  ajusteAnualActivo?: boolean; // NEW: Controls visibility of annual adjustment
  leadId?: string;
}

// FormData for the new unified builder.
export interface PresupuestoFormData {
  clienteNombre: string;
  clienteContacto?: string;
  eventoTipo: TipoEvento | string;
  eventoFecha: Date | undefined;
  invitadosCantidad: number | null; // Total, se mantiene para consistencia general
  invitadosAdultos: number | null;
  invitadosNinos: number | null; // Represents children + teenagers
  invitadosAdolescentes: number | null; // Deprecated for new forms, but kept for type safety
  salonFiestas: string;
  protagonista1Nombre?: string;
  protagonista2Nombre?: string;
  nombreEmpresa?: string;
  serviciosSeleccionados: Map<string, {
    cantidad: number;
    precioUnitarioOriginal: number; // Price from catalog, for reference
    precioUnitarioPresupuesto: number; // Overridden price for this budget
    nombreServicio: string;
    unidad?: string;
    categoriaServicio?: string;
    esRegalo: boolean;
    // Calculation details from catalog, can be overridden
    calculationMethod?: 'fijo' | 'porPersona' | 'ratio' | 'tramos';
    precioBase?: number;
    precioPorPersona?: number;
    invitadosPorUnidad?: number;
    tramosDePrecio?: { id: string; desde: number; hasta: number; precio: number }[];
  }>;
  
  // Gastronomic selections
  selectedMenuId?: string;

  nombrePromocion?: string;
  descuentoTipo?: 'porcentaje' | 'fijo';
  descuentoValor?: string;
  vigenciaPromocion?: string;
  notas: string;
  // Campos que no están en el form pero se necesitan para la lógica
  id?: string;
  estado: Presupuesto['estado'];
  invoiceId?: string;
}
