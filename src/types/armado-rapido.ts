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
  recommended?: boolean; // NEW: Flag for "Most Chosen" package
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
  recommended?: boolean; // NEW: Flag for recommended dish
}

export interface ServiceDependency {
  id: string; // Unique ID for the dependency rule
  triggerServiceId: string; // The service that triggers the dependency (e.g., a specific dish)
  requiredServiceId: string; // The service that must be added (e.g., an asador)
}

export interface ArmadoRapidoConfig {
  menus: MenuArmadoRapido[];
  paquetes: PaqueteArmadoRapido[];
  descuentoGeneral?: number; 
  mostrarPrecios?: boolean;
  platosVisibles?: PlatoVisible[]; // To control simulator dish visibility
  serviceDependencies?: ServiceDependency[];
  recommendedDishIds?: string[]; // Alternative way to store recommended dishes
}

export interface LeadFromQuickBudget {
  clienteNombre: string;
  clienteContacto?: string;
  eventoFecha?: string; // ISO string
  eventoHoraInicio?: string; // HH:mm
  adultos: number;
  ninos: number;
  subtotal: number;
  costoEstimado: number; // Final cost after discount
  descuentoGeneral?: number;
  serviciosIncluidos: string[];
  paqueteNombre?: string;
}
