export const CATALOGO_CATEGORIAS_SERVICIO = [
  'Decoración',
  'DJ/Sonido',
  'Iluminación',
  'Catering',
  'Candy Bar',
  'Photobooth',
  'Filmación',
  'Fotografía',
  'Entretenimiento',
  'Repostería',
  'Bebidas',
  'Salón',
] as const;

export const CATALOGO_TIPOS_FIESTA = [
  'Bodas',
  'XV Años',
  'Cumpleaños',
  'Infantiles',
  'Eventos Corporativos',
  'Bautismo',
  'Comunión',
  'Graduación',
  'Aniversario',
] as const;

export type CatalogoCategoriaServicio = (typeof CATALOGO_CATEGORIAS_SERVICIO)[number];
export type CatalogoTipoFiesta = (typeof CATALOGO_TIPOS_FIESTA)[number];

export interface CatalogoFoto {
  id: string;
  url: string;
  titulo?: string;
  descripcion?: string;
  categoriaServicio?: string;
  tipoFiesta?: string;
  tags?: string[];
  destacada: boolean;
  orden: number;
  activa: boolean;
  source: 'firebase-storage' | 'url' | 'upload';
  storagePath?: string;
  createdAt: string;
}

/**
 * Maps a ServicioEmpresa categoria string to a CatalogoCategoriaServicio.
 * E.g. "Servicio de catering" → "Catering"
 */
export function mapCategoriaToCatalogo(categoria?: string): CatalogoCategoriaServicio | undefined {
  if (!categoria) return undefined;
  const lower = categoria.toLowerCase();
  if (lower.includes('cater') || lower.includes('comida')) return 'Catering';
  if (lower.includes('decor')) return 'Decoración';
  if (lower.includes('dj') || lower.includes('discoteca') || lower.includes('música') || lower.includes('musica') || lower.includes('sonid')) return 'DJ/Sonido';
  if (lower.includes('iluminac')) return 'Iluminación';
  if (lower.includes('candy') || lower.includes('repostería') || lower.includes('reposteria')) return 'Repostería';
  if (lower.includes('photobooth') || lower.includes('photo booth')) return 'Photobooth';
  if (lower.includes('filmac') || lower.includes('video')) return 'Filmación';
  if (lower.includes('fotograf')) return 'Fotografía';
  if (lower.includes('entretenimiento') || lower.includes('shows') || lower.includes('animac')) return 'Entretenimiento';
  if (lower.includes('bebida') || lower.includes('barra') || lower.includes('bar')) return 'Bebidas';
  if (lower.includes('salón') || lower.includes('salon')) return 'Salón';
  return undefined;
}
