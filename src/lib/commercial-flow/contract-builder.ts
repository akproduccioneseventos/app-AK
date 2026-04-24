/**
 * AK Producciones — Motor de Contratos Unificado
 *
 * buildContractData genera un objeto normalizado con todos los datos
 * necesarios para renderizar cualquier contrato o recibo.
 * Tanto recibo-contrato/page.tsx como contrato-servicio/page.tsx
 * pueden usar esta función en lugar de duplicar la lógica.
 */

import type { Presupuesto } from '@/types/presupuesto';

export interface CustomerContractData {
  nombre: string;
  telefono?: string;
  ci?: string;
  domicilio?: string;
  empresa?: string;
  taxId?: string;
}

export interface EventContractData {
  fecha: string;       // ISO string o fecha formateada
  salon: string;
  tipoEvento?: string;
  horaInicio?: string;
  invitados?: number;
}

export interface EconomicContractData {
  total: number;
  senia?: number;
  saldo?: number;
  descuentoTipo?: 'porcentaje' | 'fijo';
  descuentoValor?: number;
  totalConDescuento?: number;
  marketingMarkupPercent?: number;
  modoDescuentoPromocional?: boolean;
}

export interface ContractBuilderInput {
  /** Datos del cliente (puede venir del formulario de booking o del presupuesto) */
  customer: CustomerContractData;
  /** Datos del evento */
  event: EventContractData;
  /** Datos económicos */
  economic: EconomicContractData;
  /** Texto adicional o notas de cláusulas */
  clausulas?: string;
  /** Fecha de generación del contrato (ISO string, por defecto now) */
  generadoEn?: string;
}

export interface ContractData {
  customer: CustomerContractData;
  event: EventContractData;
  economic: EconomicContractData;
  clausulas?: string;
  generadoEn: string;
  /** Total real (sin markup visual ni descuento promocional) */
  totalReal: number;
  /** Precio de lista (con markup visual si aplica) */
  precioLista?: number;
  /** Descuento visual (solo si modoDescuentoPromocional) */
  descuentoVisual?: number;
}

/**
 * Construye los datos del contrato de forma normalizada.
 * Los descuentos promocionales se tratan como lógica comercial válida.
 */
export function buildContractData(input: ContractBuilderInput): ContractData {
  const { customer, event, economic, clausulas, generadoEn } = input;

  const totalBase = economic.totalConDescuento ?? economic.total;

  // Precio de lista: total con markup visual si aplica
  let precioLista: number | undefined;
  if (economic.marketingMarkupPercent && economic.marketingMarkupPercent > 0) {
    precioLista = Math.round(totalBase * (1 + economic.marketingMarkupPercent / 100));
  }

  // Descuento visual (diferencia entre precio de lista y total real)
  let descuentoVisual: number | undefined;
  if (economic.modoDescuentoPromocional && precioLista !== undefined) {
    descuentoVisual = precioLista - totalBase;
  }

  return {
    customer: {
      nombre: customer.nombre || '',
      telefono: customer.telefono,
      ci: customer.ci,
      domicilio: customer.domicilio,
      empresa: customer.empresa,
      taxId: customer.taxId,
    },
    event: {
      fecha: event.fecha || '',
      salon: event.salon || '',
      tipoEvento: event.tipoEvento,
      horaInicio: event.horaInicio,
      invitados: event.invitados,
    },
    economic: {
      total: economic.total,
      senia: economic.senia,
      saldo: economic.saldo ?? (totalBase - (economic.senia ?? 0)),
      descuentoTipo: economic.descuentoTipo,
      descuentoValor: economic.descuentoValor,
      totalConDescuento: totalBase,
      marketingMarkupPercent: economic.marketingMarkupPercent,
      modoDescuentoPromocional: economic.modoDescuentoPromocional,
    },
    clausulas,
    generadoEn: generadoEn ?? new Date().toISOString(),
    totalReal: totalBase,
    precioLista,
    descuentoVisual,
  };
}

/**
 * Construye los datos del contrato a partir de un presupuesto existente,
 * permitiendo sobreescribir datos del cliente desde el formulario de booking.
 */
export function buildContractDataFromPresupuesto(
  presupuesto: Presupuesto,
  customerOverrides?: Partial<CustomerContractData>,
  eventOverrides?: Partial<EventContractData>,
  senia?: number
): ContractData {
  const totalBase =
    presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado ?? 0;

  return buildContractData({
    customer: {
      nombre: presupuesto.clienteNombre || '',
      telefono: presupuesto.clienteContacto,
      ...customerOverrides,
    },
    event: {
      fecha: presupuesto.eventoFecha || '',
      salon: presupuesto.salonFiestas || '',
      tipoEvento: presupuesto.eventoTipo,
      horaInicio: presupuesto.eventoHoraInicio,
      invitados: presupuesto.invitadosCantidad,
      ...eventOverrides,
    },
    economic: {
      total: presupuesto.costoTotalEstimado ?? 0,
      senia: senia ?? presupuesto.senia,
      saldo: presupuesto.saldo,
      descuentoTipo: presupuesto.descuentoTipo,
      descuentoValor: presupuesto.descuentoValor,
      totalConDescuento: totalBase,
      marketingMarkupPercent: presupuesto.marketingMarkupPercent,
      modoDescuentoPromocional: presupuesto.modoDescuentoPromocional,
    },
  });
}
