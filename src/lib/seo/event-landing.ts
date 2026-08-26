import type { Metadata } from 'next';

const SITE_URL = 'https://akproducciones.uy';

export interface EventLandingSeoInput {
  slug: 'bodas' | 'xv-anos' | 'eventos' | 'quinceaneras' | 'cumpleanos';
  title: string;
  description: string;
  image: string;
  imageAlt: string;
}

const CANONICAL_BY_SLUG: Record<string, string> = {
  bodas: '/bodas',
  'xv-anos': '/quinceaneras',
  quinceaneras: '/quinceaneras',
  eventos: '/cumpleanos',
  cumpleanos: '/cumpleanos',
};

export function createEventLandingMetadata({
  slug,
  title,
  description,
  image,
  imageAlt,
}: EventLandingSeoInput): Metadata {
  const path = CANONICAL_BY_SLUG[slug] || `/${slug}`;
  const url = new URL(path, SITE_URL).toString();

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      siteName: 'AK Producciones Eventos',
      locale: 'es_UY',
      images: [{ url: image, width: 1200, height: 630, alt: imageAlt }],
    },
  };
}
