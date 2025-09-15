

// Represents a service included in a package for the quick budget builder.
// The structure is simplified to only reference the service ID and its gift status.
export interface ServicioIncluidoArmadoRapido {
  id: string; // Corresponds to ServicioEmpresa id
  esRegalo?: boolean;
  // Deprecated fields are removed to enforce a single source of truth.
  // The 'categoria' is kept for menus to allow UI grouping.
  categoria?: 'Entrada' | 'Plato Principal' | 'Menú Adolescente / Niño' | 'Servicio Adicional';
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
