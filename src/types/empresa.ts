
export type CategoriaServicio =
  | 'Servicio de catering'
  | 'Servicio de filmación'
  | 'Servicio de fotografía'
  | 'Servicio de decoración'
  | 'Servicio de entretenimiento'
  | 'Servicio de bebidas'
  | 'Servicio de discoteca'
  | 'Servicio de repostería'
  | 'Regalo exclusivo'
  | 'Personal'
  | 'Otros servicios'
  | 'Insumo/Ingrediente'
  | 'Activo Fijo';

export const ALL_CATEGORIAS_SERVICIO: CategoriaServicio[] = [
  'Servicio de catering',
  'Servicio de filmación',
  'Servicio de fotografía',
  'Servicio de decoración',
  'Servicio de entretenimiento',
  'Servicio de bebidas',
  'Servicio de discoteca',
  'Servicio de repostería',
  'Regalo exclusivo',
  'Personal',
  'Otros servicios',
  'Insumo/Ingrediente',
  'Activo Fijo',
];

export type UnidadServicio = 'Unidad' | 'Set' | 'Metro' | 'Kg' | 'Litro' | 'Caja' | 'Rollo' | 'Docena' | 'Por persona' | 'Por evento' | 'Gramos' | 'Cc' | 'Pack';
export const ALL_UNIDADES_SERVICIO: UnidadServicio[] = ['Unidad', 'Set', 'Metro', 'Kg', 'Litro', 'Caja', 'Rollo', 'Docena', 'Por persona', 'Por evento', 'Gramos', 'Cc', 'Pack'];

export type TipoItemEmpresa = 'Insumo/Ingrediente' | 'Bebida (Insumo)' | 'Activo Fijo' | 'Servicio';
export const ALL_TIPOS_ITEM_EMPRESA: TipoItemEmpresa[] = ['Insumo/Ingrediente', 'Bebida (Insumo)', 'Activo Fijo', 'Servicio'];

export interface TramoDePrecio {
  id: string;
  desde: number;
  hasta: number;
  precio: number;
}

export interface ServicioEmpresa { 
  id: string;
  nombre: string;
  tipoItem?: TipoItemEmpresa; 
  categoria: CategoriaServicio;
  subcategoria?: string; 
  
  // Inventory/Cost fields
  cantidadDisponible?: number; 
  valorUnitarioEstimado?: number; // Representa el COSTO
  proveedor?: string; // Nuevo campo para el proveedor
  unidad?: UnidadServicio; 
  notas?: string;
  
  // Pricing fields (primarily for 'Servicio' type)
  calculationMethod?: 'fijo' | 'porPersona' | 'ratio' | 'tramos';
  precioVenta?: number; // Used for 'fijo' and as a fallback
  precioPorPersona?: number; // Used for 'porPersona'
  precioBase?: number; // Used for 'ratio'
  invitadosPorUnidad?: number; // Used for 'ratio'
  tramosDePrecio?: TramoDePrecio[]; // Used for 'tramos'

  contactoPrincipal?: string;
}
