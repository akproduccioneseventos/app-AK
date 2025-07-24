
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
  | 'Insumo/Ingrediente' // From previous inventory module
  | 'Activo Fijo'; // From previous inventory module

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

export type TipoItemEmpresa = 'Insumo/Ingrediente' | 'Activo Fijo' | 'Servicio';
export const ALL_TIPOS_ITEM_EMPRESA: TipoItemEmpresa[] = ['Insumo/Ingrediente', 'Activo Fijo', 'Servicio'];


export interface ServicioEmpresa { // Esta interfaz ahora representa un Ítem de Inventario o un Servicio
  id: string;
  nombre: string;
  tipoItem?: TipoItemEmpresa; 
  categoria: CategoriaServicio;
  subcategoria?: 'Entrada' | 'Plato Principal' | 'Postre' | 'Menú Niños y Adolescentes' | 'Personal' | 'Mobiliario' | 'Vajilla' | 'Mantelería' | 'Portero' | 'Seguridad' | 'Mesa de Postres' | 'Torta Principal' | 'Souvenirs Comestibles' | string; 
  
  // Campos de inventario/costo (más relevantes para insumos y activos)
  cantidadDisponible?: number; 
  valorUnitarioEstimado?: number; 
  unidad?: UnidadServicio; 
  
  // Nuevo campo de observaciones
  notas?: string;
  
  // Campo de precio de venta (para usar en presupuestos)
  precioVenta?: number; 
  
  // Campo para contacto principal/proveedor asociado (para insumos/activos)
  contactoPrincipal?: string;
}
