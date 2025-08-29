
export type ServicioCategoriaArmadoRapido = 'Entrada' | 'Plato Principal' | 'Menú Adolescente / Niño' | 'Servicio Adicional';

export interface TramoDePrecio {
  id: string;
  desde: number;
  hasta: number;
  precio: number;
}

export interface ServicioIncluidoArmadoRapido {
  id: string; // Corresponds to ServicioEmpresa id
  nombre: string;
  precioFijo: number; // For menu items, this is PER PERSON
  categoria: ServicioCategoriaArmadoRapido;
  
  // For package services, more complex pricing is possible
  precioBase?: number;
  precioPorPersona?: number;
  calculationMethod?: 'fijo' | 'porPersona' | 'ratio' | 'tramos';
  invitadosPorUnidad?: number;
  tramosDePrecio?: TramoDePrecio[];
}

export interface MenuArmadoRapido {
  id: string;
  nombre: string;
  descripcion?: string;
  serviciosIncluidos: ServicioIncluidoArmadoRapido[];
}

export interface PaqueteArmadoRapido {
  id: string; 
  nombre: string;
  descripcion?: string;
  serviciosIncluidos: ServicioIncluidoArmadoRapido[];
}

export interface ArmadoRapidoConfig {
  menus: MenuArmadoRapido[];
  paquetes: PaqueteArmadoRapido[];
  descuentoGeneral?: number; 
}


export interface LeadGenerationData {
  nombrePaquete: string;
  nombreMenu: string;
  tipoEvento: string;
  cantidadInvitados: number;
  costoEstimado: number;
  clienteNombre: string;
  salon: string;
}

    