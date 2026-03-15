
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
  | 'Entrada'
  | 'Plato Principal'
  | 'Postre'
  | 'Menú Infantil'
  | 'Menú Infantil/Adolescente';

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
  'Entrada',
  'Plato Principal',
  'Postre',
  'Menú Infantil',
  'Menú Infantil/Adolescente'
];

export type CategoriaInsumo =
 | 'Bebida (Insumo)'
 | 'Carnes'
 | 'Congelados'
 | 'Descartables'
 | 'Equipamiento'
 | 'Fiambres'
 | 'Frutas'
 | 'Lácteos'
 | 'Panificados'
 | 'Pastas'
 | 'Pescados y Mariscos'
 | 'Verduras'
 | 'Insumos varios'
 | 'Otro Insumo';

export const ALL_CATEGORIAS_INSUMO: CategoriaInsumo[] = [
  'Bebida (Insumo)',
  'Carnes',
  'Congelados',
  'Descartables',
  'Equipamiento',
  'Fiambres',
  'Frutas',
  'Lácteos',
  'Panificados',
  'Pastas',
  'Pescados y Mariscos',
  'Verduras',
  'Insumos varios',
  'Otro Insumo'
];

export type CategoriaActivo = 'Mobiliario' | 'Discoteca' | 'Decoración (Activo)' | 'Vajilla (Activo)' | 'Mantelería' | 'Equipamiento de Cocina' | 'Otro Activo' | 'Insumos varios' | 'Barra de Tragos';
export const ALL_CATEGORIAS_ACTIVO: CategoriaActivo[] = ['Mobiliario', 'Discoteca', 'Decoración (Activo)', 'Vajilla (Activo)', 'Mantelería', 'Equipamiento de Cocina', 'Otro Activo', 'Insumos varios', 'Barra de Tragos'];


export type AnyCategoria = CategoriaServicio | CategoriaInsumo | CategoriaActivo;


export type UnidadServicio = 'Unidad' | 'Set' | 'Metro' | 'Kg' | 'Litro' | 'Caja' | 'Rollo' | 'Docena' | 'Por persona' | 'Por evento' | 'Gramos' | 'Cc' | 'Pack';
export const ALL_UNIDADES_SERVICIO: UnidadServicio[] = ['Unidad', 'Set', 'Metro', 'Kg', 'Litro', 'Caja', 'Rollo', 'Docena', 'Por persona', 'Por evento', 'Gramos', 'Cc', 'Pack'];

export type TipoItemEmpresa = 'Insumo/Ingrediente' | 'Bebida (Insumo)' | 'Activo Fijo' | 'Servicio';
export const ALL_TIPOS_ITEM_EMPRESA: TipoItemEmpresa[] = ['Insumo/Ingrediente', 'Bebida (Insumo)' , 'Activo Fijo', 'Servicio'];

export type TipoCosto = 'Personal' | 'Proveedor' | 'Insumo' | 'Gasto Fijo';

export interface TramoDePrecio {
  id: string;
  desde: number;
  hasta: number;
  precio: number;
}

export interface ServicioEmpresa { 
  id: string;
  nombre: string;
  tipoItem?: TipoItemEmpresa; 
  categoria?: AnyCategoria;
  subcategoria?: string; 
  
  // Inventory/Cost fields
  cantidadDisponible?: number; 
  valorUnitarioEstimado?: number; // Representa el COSTO base
  tipoCosto?: TipoCosto; // Naturaleza del costo para sincronización financiera
  proveedor?: string; // Nombre del proveedor o responsable del costo
  unidad?: UnidadServicio | string; 
  notas?: string;
  
  // Pricing fields (primarily for 'Servicio' type)
  calculationMethod?: 'fijo' | 'porPersona' | 'ratio' | 'tramos';
  precioVenta?: number; // Used for 'fijo' and as a fallback
  precioPorPersona?: number; // Used for 'porPersona'
  precioBase?: number; // Used for 'ratio'
  invitadosPorUnidad?: number; // Used for 'ratio'
  tramosDePrecio?: TramoDePrecio[]; // Used for 'tramos'

  contactoPrincipal?: string;
}
