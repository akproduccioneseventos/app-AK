export interface GaleriaFoto {
  id: string;
  tipo: 'foto';
  url: string;
  titulo?: string;
  descripcion?: string;
  categoria: string;
  servicio?: string;
  eventoId?: string;
  destacada: boolean;
  orden: number;
  createdAt: string;
}

export interface GaleriaVideo {
  id: string;
  tipo: 'video';
  youtubeUrl: string;
  youtubeId: string;
  thumbnailUrl: string;
  titulo: string;
  descripcion?: string;
  categoria: string;
  servicio?: string;
  eventoId?: string;
  destacada: boolean;
  orden: number;
  createdAt: string;
}

export interface GaleriaData {
  fotos: GaleriaFoto[];
  videos: GaleriaVideo[];
}

export const GALERIA_CATEGORIAS = [
  'Decoración',
  'DJ/Sonido',
  'Iluminación',
  'Catering',
  'Salón',
  'Candy Bar',
  'Photobooth',
  'Filmación',
  'Fotografía',
  'Entretenimiento',
  'Repostería',
  'Bebidas',
  'Bodas',
  'XV Años',
  'Eventos Corporativos',
  'Infantiles',
  'Cumpleaños',
  'Bautismo',
  'Comunión',
  'Graduación',
  'Aniversario',
] as const;

export type GaleriaCategoria = (typeof GALERIA_CATEGORIAS)[number];
