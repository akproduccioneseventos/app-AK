
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
  | 'Mobiliario' // Nueva categoría para inventario
  | 'Equipamiento Técnico' // Nueva categoría para inventario
  | 'Textiles y Mantelería' // Nueva categoría para inventario
  | 'Otros Activos' // Nueva categoría para inventario
  | 'Otros servicios'; // Mantenida por si se usa para servicios puros

export const ALL_CATEGORIAS_SERVICIO: CategoriaServicio[] = [
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
  'Mobiliario',
  'Equipamiento Técnico',
  'Textiles y Mantelería',
  'Otros Activos',
  'Otros servicios'
];

export type UnidadServicio = 'Por persona' | 'Por evento' | 'Unidad' | 'Set' | 'Metro'; // Añadidas unidades para inventario
export const ALL_UNIDADES_SERVICIO: UnidadServicio[] = ['Por persona', 'Por evento', 'Unidad', 'Set', 'Metro'];


export interface ServicioEmpresa { // Esta interfaz ahora representa un Ítem de Inventario o un Servicio
  id: string;
  nombre: string;
  categoria: CategoriaServicio;
  // Campos de servicio (pueden ser opcionales si el ítem es solo inventario)
  precioVenta?: number; // Se mantiene por si se quiere registrar precio de venta de un servicio
  
  // Campos de inventario
  cantidadDisponible?: number;
  valorUnitarioEstimado?: number; // Antes costoReal, ahora representa valor/costo de reposición por unidad
  unidad?: UnidadServicio; // Unidad de medida para la cantidad (ej: 'unidad', 'set', 'metro')
}
