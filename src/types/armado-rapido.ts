
export type ServicioCategoriaArmadoRapido = 'Entrada' | 'Plato Principal' | 'Menú Adolescente' | 'Menú Niño' | 'Servicio Adicional';

export interface ServicioIncluidoArmadoRapido {
  id: string; // Corresponds to ServicioEmpresa id
  nombre: string;
  precioFijo: number;
  categoria: ServicioCategoriaArmadoRapido;
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
