
export type CategoriaGasto =
  | 'Compra de Equipo'
  | 'Reparaciones y Mantenimiento'
  | 'Marketing y Publicidad'
  | 'Impuestos y Tasas'
  | 'Servicios Públicos (Luz, Agua, etc.)'
  | 'Alquiler Oficina/Depósito'
  | 'Sueldos Administrativos'
  | 'Otro';

export const ALL_CATEGORIAS_GASTO: CategoriaGasto[] = [
    'Compra de Equipo',
    'Reparaciones y Mantenimiento',
    'Marketing y Publicidad',
    'Impuestos y Tasas',
    'Servicios Públicos (Luz, Agua, etc.)',
    'Alquiler Oficina/Depósito',
    'Sueldos Administrativos',
    'Otro'
];

export interface GastoGeneral {
  id: string;
  fecha: string; // ISO Date String
  concepto: string;
  categoria: CategoriaGasto;
  monto: number;
  notas?: string;
}
