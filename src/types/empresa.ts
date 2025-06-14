
export type CategoriaServicio =
  | 'Servicio de catering'
  | 'Servicio de filmación'
  | 'Servicio de fotografía'
  | 'Servicio de decoración'
  | 'Servicio de entretenimiento'
  | 'Servicio de bebidas'
  | 'Servicio de discoteca'
  | 'Servicio de repostería y regalos'
  | 'Regalo exclusivo' // Modificado
  | 'Personal' // Añadido
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
  'Regalo exclusivo', // Modificado
  'Personal', // Añadido
  'Otros servicios'
];

export type UnidadServicio = 'Por persona' | 'Por evento';
export const ALL_UNIDADES_SERVICIO: UnidadServicio[] = ['Por persona', 'Por evento'];


export interface ServicioEmpresa {
  id: string;
  nombre: string;
  categoria: CategoriaServicio;
  precioVenta?: number;
  costoReal?: number;
  unidad?: UnidadServicio;
  // Campos específicos de catering podrían ir aquí si se decide persistirlos
  // cateringSubCategory?: CateringSubCategory; 
  // cateringPersonalDetail?: string;
}

// Si se decide persistir la subcategoría de catering:
// export type CateringSubCategory = 
// | 'Entrada' 
// | 'Mobiliario' 
// | 'Vajilla' 
// | 'Mantelería' 
// | 'Entrada plato principal' 
// | 'Personal' 
// | '';

