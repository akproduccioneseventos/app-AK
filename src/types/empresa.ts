
export type CategoriaServicio =
  | 'Servicio de catering'
  | 'Servicio de filmación'
  | 'Servicio de fotografía'
  | 'Servicio de decoración'
  | 'Servicio de entretenimiento'
  | 'Servicio de bebidas'
  | 'Servicio de discoteca'
  | 'Servicio de repostería y regalos'
  | 'Regalo exclusivo'
  | 'Personal'
  | 'Mobiliario' 
  | 'Equipamiento Técnico' 
  | 'Textiles y Mantelería' 
  | 'Decoración Floral'
  | 'Utensilios de Cocina'
  | 'Material de Oficina/Papelería'
  | 'Insumos Consumibles (Ej: limpieza)'
  // Tipos específicos para el catálogo maestro de "insumos"
  | 'Ingrediente Seco'
  | 'Ingrediente Fresco'
  | 'Bebida (Insumo)'
  | 'Material Descartable'
  | 'Otros Activos' 
  | 'Otros servicios'; 

export const ALL_CATEGORIAS_SERVICIO: CategoriaServicio[] = [
  'Mobiliario',
  'Equipamiento Técnico',
  'Textiles y Mantelería',
  'Decoración Floral',
  'Utensilios de Cocina',
  'Material de Oficina/Papelería',
  'Insumos Consumibles (Ej: limpieza)',
  'Ingrediente Seco',
  'Ingrediente Fresco',
  'Bebida (Insumo)',
  'Material Descartable',
  'Servicio de catering',
  'Servicio de filmación',
  'Servicio de fotografía',
  'Servicio de decoración',
  'Servicio de entretenimiento',
  'Servicio de bebidas', // Este es el servicio de barra/bebidas, no el insumo.
  'Servicio de discoteca',
  'Servicio de repostería y regalos',
  'Regalo exclusivo',
  'Personal',
  'Otros Activos',
  'Otros servicios'
];

export type UnidadServicio = 'Unidad' | 'Set' | 'Metro' | 'Kg' | 'Litro' | 'Caja' | 'Rollo' | 'Docena' | 'Por persona' | 'Por evento' | 'Gramos' | 'Cc' | 'Pack';
export const ALL_UNIDADES_SERVICIO: UnidadServicio[] = ['Unidad', 'Set', 'Metro', 'Kg', 'Litro', 'Caja', 'Rollo', 'Docena', 'Por persona', 'Por evento', 'Gramos', 'Cc', 'Pack'];

export type TipoItemEmpresa = 'Insumo/Ingrediente' | 'Prestador de Servicio' | 'Activo Fijo' | 'Otro';
export const ALL_TIPOS_ITEM_EMPRESA: TipoItemEmpresa[] = ['Insumo/Ingrediente', 'Prestador de Servicio', 'Activo Fijo', 'Otro'];


export interface ServicioEmpresa { // Esta interfaz ahora representa un Ítem de Inventario o un Servicio
  id: string;
  nombre: string;
  tipoItem?: TipoItemEmpresa; // Nuevo campo para diferenciar
  categoria: CategoriaServicio;
  precioVenta?: number; // Precio al que la empresa VENDE este servicio/ítem (si aplica)
  
  // Campos de inventario/costo (más relevantes para insumos)
  cantidadDisponible?: number; // Stock actual si es un ítem físico
  valorUnitarioEstimado?: number; // Costo de compra/reposición por unidad del ítem
  unidad?: UnidadServicio; // Unidad de medida para cantidadDisponible y valorUnitarioEstimado
  
  // Campos para proveedores de servicios (si tipoItem es 'Prestador de Servicio')
  contactoPrincipal?: string; // Nombre del contacto
  telefonoContacto?: string;
  emailContacto?: string;
  descripcionServicio?: string; // Descripción del servicio que ofrecen
  productosOfrecidos?: string; // Resumen de productos/servicios, podría ser un string simple.
}

