// This type represents a service included in a package for the quick budget builder.
// It mainly serves as a reference, as pricing logic now primarily resides in the main service catalog.
export interface ServicioIncluidoArmadoRapido {
  id: string; // Corresponds to ServicioEmpresa id
  esRegalo?: boolean;
  // Deprecated fields, kept for potential data migration but not used by new logic.
  nombre?: string;
  categoria?: string;
  precioFijo?: number;
}

export interface PaqueteArmadoRapido {
  id: string;
  nombre: string;
  descripcion?: string;
  serviciosIncluidos: ServicioIncluidoArmadoRapido[];
}

export interface MenuArmadoRapido {
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
