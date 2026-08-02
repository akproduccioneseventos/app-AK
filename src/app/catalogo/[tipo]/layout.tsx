import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * La tarjeta que aparece al compartir el catálogo por WhatsApp.
 *
 * El catálogo por tipo de fiesta es material de venta: se le pasa el enlace al
 * prospecto o se le muestra en persona. Sin estos datos, el chat mostraba el
 * título genérico de toda la app y ninguna imagen, así que el enlace llegaba
 * pelado justo en el momento de vender.
 *
 * Va en el layout porque la pantalla es de cliente y ahí no se puede definir.
 */

type Props = { params: Promise<{ tipo: string }> };

/** Los textos son los mismos que ve el prospecto en la primera lámina. */
const TARJETAS: Record<string, { titulo: string; descripcion: string; imagen: string }> = {
  bodas: {
    titulo: 'Catálogo de Bodas',
    descripcion:
      'Tu boda perfecta, hecha realidad. Decoración, catering, música y fotografía, organizados por un solo equipo.',
    imagen: '/media/catalogo-servicios/boda_persuasiva.png',
  },
  'xv-anos': {
    titulo: 'Catálogo de XV Años',
    descripcion:
      'Los mejores XV años de su vida. Decoración de cuento, música, catering y todo lo que necesita para brillar.',
    imagen: '/media/catalogo-servicios/quinceanera_hero.png',
  },
  cumpleanos: {
    titulo: 'Catálogo de Cumpleaños',
    descripcion:
      'Cumpleaños que dejan huella. Celebraciones únicas para cada etapa de la vida, de los primeros añitos en adelante.',
    imagen: '/media/catalogo-servicios/familia_feliz_evento.png',
  },
  corporativos: {
    titulo: 'Catálogo de Eventos Corporativos',
    descripcion:
      'Eventos corporativos de alto impacto: cenas de fin de año, lanzamientos y reuniones de empresa.',
    imagen: '/media/catalogo-servicios/boda_persuasiva.png',
  },
  aniversarios: {
    titulo: 'Catálogo de Aniversarios',
    descripcion:
      'Celebrá el amor que construyeron juntos. Bodas de plata, de oro y cada fecha que merece festejarse.',
    imagen: '/media/catalogo-servicios/quinceanera_persuasiva.png',
  },
  fiestas: {
    titulo: 'Catálogo de Fiestas',
    descripcion:
      'Fiestas que se recuerdan para siempre. Despedidas, graduaciones y reuniones temáticas, a tu medida.',
    imagen: '/media/catalogo-servicios/familia_feliz_evento.png',
  },
};

const POR_DEFECTO = {
  titulo: 'Catálogo AK Producciones',
  descripcion: 'Todo lo que incluye una fiesta producida por AK Producciones, en un solo lugar.',
  imagen: '/media/catalogo-servicios/quinceanera_hero.png',
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { tipo } = await props.params;
  const tarjeta = TARJETAS[tipo] ?? POR_DEFECTO;
  const titulo = `${tarjeta.titulo} | AK Producciones`;

  return {
    title: titulo,
    description: tarjeta.descripcion,
    openGraph: {
      title: tarjeta.titulo,
      description: tarjeta.descripcion,
      type: 'website',
      siteName: 'AK Producciones Eventos',
      locale: 'es_UY',
      images: [{ url: tarjeta.imagen, width: 1200, height: 630, alt: tarjeta.titulo }],
    },
    twitter: {
      card: 'summary_large_image',
      title: tarjeta.titulo,
      description: tarjeta.descripcion,
      images: [tarjeta.imagen],
    },
  };
}

export default function CatalogoLayout({ children }: { children: ReactNode }) {
  return children;
}
