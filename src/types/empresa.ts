
export type CategoriaServicio =
  | 'Servicio de catering'
  | 'Servicio de filmación'
  | 'Servicio de fotografía'
  | 'Servicio de decoración'
  | 'Servicio de entretenimiento'
  | 'Servicio de bebidas'
  | 'Servicio de discoteca'
  | 'Servicio de repostería y regalos'
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
  'Otros servicios'
];

export type UnidadServicio = 'Por persona' | 'Por evento';
export const ALL_UNIDADES_SERVICIO: UnidadServicio[] = ['Por persona', 'Por evento'];


export interface ServicioEmpresa {
  id: string;
  nombre: string;
  categoria: CategoriaServicio;
  descripcion?: string;
  precioVenta?: number; // Renombrado de precioEstimado
  costoReal?: number;   // Nuevo campo
  unidad?: UnidadServicio; // Actualizado
}
