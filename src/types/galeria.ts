export interface GaleriaFoto {
  id: string;
  tipo: 'foto';
  url: string;
  titulo?: string;
  descripcion?: string;
  categoria: string;
  tipoFiesta?: string;
  subCategoria?: string;
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
  'Bodas',
  'XV Años',
  'Eventos Corporativos',
  'Infantiles',
  'Cumpleaños',
  'Filmación',
  'Fotografía',
  'Entretenimiento',
  'Bebidas',
  'Repostería',
  'Personal',
  'Entrada',
  'Plato Principal',
  'Postre',
  'Menú Infantil',
] as const;

export type GaleriaCategoria = (typeof GALERIA_CATEGORIAS)[number];

export const TIPOS_FIESTA_GALERIA = [
  '15 Años',
  'Bodas',
  'Cumpleaños',
  'Empresariales',
  'Infantiles',
] as const;

export const SERVICIOS_GALERIA = [
  'Discoteca',
  'Fotografía',
  'Catering',
  'Decoración',
  'DJ/Sonido',
  'Iluminación',
  'Candy Bar',
  'Photobooth',
  'Filmación',
  'Salón',
] as const;

export const SUBCATEGORIAS_POR_SERVICIO: Record<string, string[]> = {
  Fotografía: ['Exteriores', 'Civil', 'Iglesia', 'Pintada', 'Disco'],
  Filmación: ['Exteriores', 'Civil', 'Iglesia', 'Evento completo'],
  Discoteca: ['Pista de baile', 'Efectos especiales', 'Karaoke'],
  Catering: ['Platos principales', 'Postres', 'Barra de tragos', 'Candy bar'],
};
