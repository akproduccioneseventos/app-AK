
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
  'Servicio de catering',
  'Servicio de filmación',
  'Servicio de fotografía',
  'Servicio de decoración',
  'Servicio de entretenimiento',
  'Servicio de bebidas',
  'Servicio de discoteca',
  'Servicio de repostería y regalos',
  'Regalo exclusivo',
  'Personal',
  'Otros Activos',
  'Otros servicios'
];

export type UnidadServicio = 'Unidad' | 'Set' | 'Metro' | 'Kg' | 'Litro' | 'Caja' | 'Rollo' | 'Docena' | 'Por persona' | 'Por evento';
export const ALL_UNIDADES_SERVICIO: UnidadServicio[] = ['Unidad', 'Set', 'Metro', 'Kg', 'Litro', 'Caja', 'Rollo', 'Docena', 'Por persona', 'Por evento'];


export interface ServicioEmpresa { // Esta interfaz ahora representa un Ítem de Inventario o un Servicio
  id: string;
  nombre: string;
  categoria: CategoriaServicio;
  precioVenta?: number; 
  
  // Campos de inventario
  cantidadDisponible?: number;
  valorUnitarioEstimado?: number; // Costo de reposición o valor actual por unidad
  unidad?: UnidadServicio; // Unidad de medida para la cantidad
}
