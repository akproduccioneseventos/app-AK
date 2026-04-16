

import type { ServicioEmpresa } from './empresa';

export type MetodoPago = 'Efectivo' | 'Transferencia Bancaria' | 'MercadoPago' | 'Cheque' | 'Tarjeta' | 'Otro';

export const ALL_METODOS_PAGO: MetodoPago[] = [
  'Efectivo',
  'Transferencia Bancaria',
  'MercadoPago',
  'Cheque',
  'Tarjeta',
  'Otro',
];

export type EstadoPago = 'confirmado' | 'pendiente_confirmacion';

export interface PagoCliente {
  id: string;
  fecha: string; // ISO date string
  monto: number;
  metodoPago: MetodoPago;
  referencia?: string; // Notes / transaction reference
  estadoPago?: EstadoPago; // Payment confirmation status
  comprobanteUrl?: string; // URL or base64 of payment receipt image
  motivoRechazo?: string; // Reason for rejection (if rejected by admin)
}

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
  subcategoria?: string;
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
  numero?: number;
  clienteNombre: string;
  clienteContacto?: string;
  eventoTipo: TipoEvento | string;
  eventoFecha: string; // ISO String
  eventoHoraInicio?: string; // HH:mm
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
  cuponCodigo?: string; // Código del cupón aplicado
  cuponId?: string; // ID del cupón aplicado
  timestamp: string; // ISO String
  estado: 'Borrador' | 'Pendiente Verificación' | 'Enviado' | 'Aceptado' | 'Rechazado' | 'Facturado';
  notas?: string;
  invoiceId?: string;
  ajusteAnualActivo?: boolean; // NEW: Controls visibility of annual adjustment
  leadId?: string;
  source?: 'manual' | 'simulator';
  pagosCliente?: PagoCliente[]; // Detailed client payment records
  marketingMarkupPercent?: number; // Marketing: fictitious markup % over total real (e.g. 15 → Precio de Lista)
  senia?: number; // Monto de la seña acordada
  saldo?: number; // Saldo restante a pagar
  ajusteAnualPorcentaje?: number; // Porcentaje de ajuste anual pactado
  fechaFirmaContrato?: string; // ISO date de firma del contrato
  archived?: boolean; // Soft-delete: when true the budget is hidden from active lists
  archivedAt?: string; // ISO timestamp of archival
}

// FormData for the new unified builder.
export interface PresupuestoFormData {
  clienteNombre: string;
  clienteContacto?: string;
  eventoTipo: TipoEvento | string;
  eventoFecha: Date | undefined;
  eventoHoraInicio?: string;
  invitadosCantidad: number | null; // Total, se mantiene para consistencia general
  invitadosAdultos: number | null;
  invitadosNinos: number | null;
  invitadosAdolescentes: number | null;
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
    subcategoria?: string;
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
  cuponCodigo?: string;
  cuponId?: string;
  cuponDescuento?: number; // Monto calculado del cupón
  notas: string;
  // Campos que no están en el form pero se necesitan para la lógica
  id?: string;
  numero?: number;
  estado: Presupuesto['estado'];
  invoiceId?: string;
  pagosCliente?: PagoCliente[];
  marketingMarkupPercent?: number; // Marketing: fictitious markup % over total real
  timestamp?: string;
}
