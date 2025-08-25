
export type CalculationMethod = 'fijo' | 'por_persona' | 'ratio' | 'escalonado';

export interface TierPrecio {
  id: string;
  hasta: number; // hasta este número de invitados
  precio: number;
}

export interface ServicioIncluido {
  id: string; // Corresponds to ServicioEmpresa id
  nombre: string;
  
  calculationMethod: CalculationMethod;
  
  // Fields for different methods. The cost is now implicit for ratio.
  costoFijo?: number;                 // For 'fijo'
  costoPorPersona?: number;           // For 'por_persona'
  invitadosPorUnidad?: number;        // For 'ratio' (e.g., 25 guests per waiter)
  tramosDePrecio?: TierPrecio[];      // For 'escalonado'
}

export interface PaqueteArmadoRapido {
  id: string; // ej: 'basico', 'premium'
  nombre: string;
  serviciosIncluidos: ServicioIncluido[];
}

export interface ArmadoRapidoConfig {
  paquetes: PaqueteArmadoRapido[];
  descuentoGeneral?: number; // Porcentaje de descuento opcional a aplicar
}

export interface LeadGenerationData {
  nombrePaquete: string;
  tipoEvento: string;
  cantidadInvitados: number;
  costoEstimado: number;
  clienteNombre: string;
  salon: string;
}
