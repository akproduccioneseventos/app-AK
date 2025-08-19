
export interface ServicioIncluido {
  id: string; // Corresponds to ServicioEmpresa id
  nombre: string;
  precioBase?: number; // Costo fijo, no depende de invitados
  precioPorPersona?: number; // Costo que se multiplica por invitado
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
