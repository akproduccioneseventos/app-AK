

export interface Paquete {
  id: string;
  nombre: string;
  serviciosIncluidos: string[]; // Array de IDs de ServicioEmpresa
}

export type CondicionTipo = 'invitados' | 'servicio_seleccionado';
export type CondicionOperador = 'mayor_que' | 'menor_que' | 'igual_a';
export type AccionTipo = 'agregar_servicio' | 'aplicar_descuento_porcentaje' | 'aplicar_descuento_fijo';

export interface Condicion {
  tipo: CondicionTipo;
  operador: CondicionOperador;
  valor: number | string; // number para invitados, string para ID de servicio
}

export interface Accion {
  tipo: AccionTipo;
  servicioId?: string; // Para agregar_servicio
  descuento?: number; // Para descuentos
  cantidad?: number; // Para agregar_servicio
}

export interface Regla {
  id: string;
  condicion: Condicion;
  accion: Accion;
  descripcion: string;
}

export interface ConfiguracionGeneral {
    titulo: string;
    descripcion: string;
}

export interface ArmadoRapidoConfig {
  paquetes: Paquete[];
  reglas: Regla[];
  configuracionGeneral: ConfiguracionGeneral;
}
