
export type ServicioCategoriaArmadoRapido = 'Entrada' | 'Plato Principal' | 'Menú Adolescente / Niño' | 'Servicio Adicional' | 'Servicio de catering';

export interface TramoDePrecio {
  id: string;
  desde: number;
  hasta: number;
  precio: number;
}

export interface ServicioIncluidoArmadoRapido {
  id: string; // Corresponds to ServicioEmpresa id
  nombre: string;
  categoria: ServicioCategoriaArmadoRapido;
  esRegalo?: boolean;
  
  // The complex pricing logic is now inherited from ServicioEmpresa.
  // These fields are kept for potential overrides within a package, but the primary source is the catalog.
  calculationMethod?: 'fijo' | 'porPersona' | 'ratio' | 'tramos';
  precioFijo?: number;
  precioBase?: number;
  precioPorPersona?: number;
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
  mostrarPrecios?: boolean;
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
