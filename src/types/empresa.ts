

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

export type TipoItemEmpresa = 'Insumo/Ingrediente' | 'Prestador de Servicio' | 'Activo Fijo' | 'Otro';
export const ALL_TIPOS_ITEM_EMPRESA: TipoItemEmpresa[] = ['Insumo/Ingrediente', 'Prestador de Servicio', 'Activo Fijo', 'Otro'];


export interface ServicioEmpresa { // Esta interfaz ahora representa un Ítem de Inventario o un Servicio
  id: string;
  nombre: string;
  tipoItem?: TipoItemEmpresa; 
  categoria: CategoriaServicio;
  subcategoria?: string; 
  precioVenta?: number; 
  
  // Campos de inventario/costo (más relevantes para insumos y activos)
  cantidadDisponible?: number; 
  valorUnitarioEstimado?: number; 
  unidad?: UnidadServicio; 
  
  // Campos para proveedores de servicios
  contactoPrincipal?: string; 
  telefonoContacto?: string;
  emailContacto?: string;
  descripcionServicio?: string; 
  productosOfrecidos?: string;

  // Nuevo campo de observaciones
  notas?: string;
}
