
export type CategoriaServicio =
  | 'Servicio de catering'
  | 'Servicio de filmación'
  | 'Servicio de fotografía'
  | 'Servicio de decoración'
  | 'Servicio de entretenimiento'
  | 'Servicio de bebidas'
  | 'Servicio de discoteca'
  | 'Servicio de repostería y regalos'
  | 'Servicio de regalo exclusivo' // Added
  | 'Otros servicios';

export const ALL_CATEGORIAS_SERVICIO: CategoriaServicio[] = [
  'Servicio de catering',
  'Servicio de filmación',
  'Servicio de fotografía',
  'Servicio de decoración',
  'Servicio de entretenimiento',
  'Servicio de bebidas',
  'Servicio de discoteca',
  'Servicio de repostería y regalos',
  'Servicio de regalo exclusivo', // Added
  'Otros servicios'
];

export type UnidadServicio = 'Por persona' | 'Por evento';
export const ALL_UNIDADES_SERVICIO: UnidadServicio[] = ['Por persona', 'Por evento'];


export interface ServicioEmpresa {
  id: string;
  nombre: string;
  categoria: CategoriaServicio;
  // descripcion?: string; // Removed
  precioVenta?: number;
  costoReal?: number;
  unidad?: UnidadServicio;
}
