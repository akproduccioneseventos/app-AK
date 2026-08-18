export type DirectorioTipo = 'gratis' | 'pago';

export interface DirectorioItem {
  id: string;
  nombre: string;
  tipo: DirectorioTipo;
  url: string;
  descripcion: string;
  completado: boolean;
  completadoAt?: string;
  notas?: string;
}

export interface DirectorioAltasResumen {
  items: DirectorioItem[];
  total: number;
  completados: number;
  pendientes: number;
  porcentaje: number;
}
