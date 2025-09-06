
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

export type TipoItemEmpresa = 'Insumo/Ingrediente' | 'Bebida (Insumo)' | 'Activo Fijo' | 'Servicio' | 'Entrada' | 'Plato Principal' | 'Menú Niños/Adolescentes' | 'Servicio de catering';
export const ALL_TIPOS_ITEM_EMPRESA: TipoItemEmpresa[] = ['Insumo/Ingrediente', 'Bebida (Insumo)', 'Activo Fijo', 'Servicio', 'Entrada', 'Plato Principal', 'Menú Niños/Adolescentes', 'Servicio de catering'];

export interface ServicioEmpresa { // Esta interfaz ahora representa un Ítem de Inventario (Activo/Insumo) o un Servicio
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
  
  // Campo de precio de venta (para usar en presupuestos, principalmente para servicios)
  precioVenta?: number; 
  
  // Campo para contacto principal/proveedor asociado (para insumos/activos)
  contactoPrincipal?: string;
}
