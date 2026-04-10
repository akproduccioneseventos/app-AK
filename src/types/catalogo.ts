export interface CatalogoFoto {
  id: string;
  url: string;
  titulo?: string;
  descripcion?: string;
  categoriaServicio: string; // Categoría del servicio (ej: 'Servicio de catering')
  tipoFiesta?: string; // Tipo de fiesta (ej: 'Casamiento', 'XV Años')
  servicioNombre?: string; // Nombre del servicio específico
  eventoId?: string;
  destacada: boolean;
  orden: number;
  source: 'manual' | 'catalogo-servicios' | 'galeria' | 'menu';
  createdAt: string;
}

export const TIPOS_FIESTA_CATALOGO = [
  'Casamiento', 'XV Años', 'Cumpleaños Adulto', 'Cumpleaños Infantil',
  'Bautismo', 'Comunión', 'Graduación', 'Corporativo', 'Aniversario', 'Otro'
] as const;
export type TipoFiestaCatalogo = (typeof TIPOS_FIESTA_CATALOGO)[number];
