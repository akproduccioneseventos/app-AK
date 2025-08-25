

export type ServicioCategoriaArmadoRapido = 'Entrada' | 'Plato Principal' | 'Postre' | 'Menú Adolescente' | 'Menú Niño' | 'Servicio Adicional';

export interface ServicioIncluidoArmadoRapido {
  id: string; // Corresponds to ServicioEmpresa id
  nombre: string;
  precioFijo: number;
  categoria: ServicioCategoriaArmadoRapido;
}

// "Paquete" es ahora el único contenedor para todos los servicios
export interface PaqueteArmadoRapido {
  id: string; 
  nombre: string;
  descripcion?: string;
  // Los servicios dentro del paquete definen lo que se puede elegir
  serviciosIncluidos: ServicioIncluidoArmadoRapido[]; 
}

export interface ArmadoRapidoConfig {
  paquetes: PaqueteArmadoRapido[];
  descuentoGeneral?: number; 
}


export interface LeadGenerationData {
  nombrePaquete: string;
  nombreMenu: string; // Se puede construir a partir de las selecciones del cliente
  tipoEvento: string;
  cantidadInvitados: number;
  costoEstimado: number;
  clienteNombre: string;
  salon: string;
}
