
import type { ServicioEmpresa } from './empresa';

export interface ServicioIncluidoArmadoRapido {
  id: string; // Corresponds to ServicioEmpresa id
  esRegalo?: boolean;
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


export interface PlatoVisible {
  id: string; // ID del MenuItem
  visible: boolean;
}

export interface ArmadoRapidoConfig {
  menus: MenuArmadoRapido[];
  paquetes: PaqueteArmadoRapido[];
  descuentoGeneral?: number; 
  mostrarPrecios?: boolean;
  platosVisibles?: PlatoVisible[]; // NEW: To control simulator dish visibility
}

export interface LeadFromQuickBudget {
  clienteNombre: string;
  clienteContacto?: string;
  adultos: number;
  ninos: number;
  costoEstimado: number;
  serviciosIncluidos: string[];
  paqueteNombre?: string;
}

  
