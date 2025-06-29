

export type CategoriaServicio =
  | 'Decoración'
  | 'Catering'
  | 'Discoteca'
  | 'Repostería'
  | 'Barra de Tragos'
  | 'Mobiliario'
  | 'Fotografía y Video'
  | 'Personal'
  | 'Otros';

export const ALL_CATEGORIAS_SERVICIO: CategoriaServicio[] = [
  'Decoración',
  'Catering',
  'Discoteca',
  'Repostería',
  'Barra de Tragos',
  'Mobiliario',
  'Fotografía y Video',
  'Personal',
  'Otros'
];

export type UnidadServicio = 'Unidad' | 'Set' | 'Metro' | 'Kg' | 'Litro' | 'Caja' | 'Rollo' | 'Docena' | 'Por persona' | 'Por evento' | 'Gramos' | 'Cc' | 'Pack';
export const ALL_UNIDADES_SERVICIO: UnidadServicio[] = ['Unidad', 'Set', 'Metro', 'Kg', 'Litro', 'Caja', 'Rollo', 'Docena', 'Por persona', 'Por evento', 'Gramos', 'Cc', 'Pack'];

export type TipoItemEmpresa = 'Insumo/Ingrediente' | 'Activo Fijo';
export const ALL_TIPOS_ITEM_EMPRESA: TipoItemEmpresa[] = ['Insumo/Ingrediente', 'Activo Fijo'];


export interface ServicioEmpresa { // Esta interfaz ahora representa un Ítem de Inventario o un Servicio
  id: string;
  nombre: string;
  tipoItem?: TipoItemEmpresa; 
  categoria: CategoriaServicio;
  subcategoria?: string; 
  
  // Campos de inventario/costo (más relevantes para insumos y activos)
  cantidadDisponible?: number; 
  valorUnitarioEstimado?: number; 
  unidad?: UnidadServicio; 
  
  // Nuevo campo de observaciones
  notas?: string;
  
  // Campo de precio de venta (para usar en presupuestos)
  precioVenta?: number; 
}
