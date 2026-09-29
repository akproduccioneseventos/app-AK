export interface FotoParaTexto {
  titulo?: string | null;
  descripcion?: string | null;
  categoriaServicio?: string | null;
  categoria?: string | null;
  servicio?: string | null;
  categorias?: string[];
  [key: string]: any;
}

/**
 * Función pura que resuelve el texto visible de una foto de galería.
 * Si el título empieza con "Img" seguido de números (/^img[\s_-]*\d+/i),
 * muestra la categoría del servicio en su lugar.
 * Si la descripción es la genérica del catálogo, la oculta.
 */
export function textoVisibleDeLaFoto(foto: FotoParaTexto): {
  titulo: string;
  descripcion: string;
} {
  const rawTitulo = (foto.titulo || '').trim();
  const rawDesc = (foto.descripcion || '').trim();
  const cat =
    foto.categoriaServicio ||
    foto.categoria ||
    foto.servicio ||
    (Array.isArray(foto.categorias) && foto.categorias[0] ? foto.categorias[0] : null) ||
    'Evento';

  let tituloFinal = rawTitulo;
  if (/^img[\s_-]*\d+/i.test(rawTitulo)) {
    tituloFinal = cat;
  }

  let descFinal = rawDesc;
  if (/del cat[aá]logo de servicios reales/i.test(rawDesc)) {
    descFinal = '';
  }

  return {
    titulo: tituloFinal,
    descripcion: descFinal,
  };
}
