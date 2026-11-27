import type { Metadata } from 'next';

const SITE_URL = 'https://akproducciones.uy';

export interface EventLandingSeoInput {
  slug:
    | 'bodas'
    | 'xv-anos'
    | 'eventos'
    | 'quinceaneras'
    | 'cumpleanos'
    | 'fiestas-empresariales'
    | 'fiestas-infantiles'
    | 'fiestas';
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
  'fiestas-empresariales': '/fiestas-empresariales',
  'fiestas-infantiles': '/fiestas-infantiles',
  fiestas: '/fiestas',
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
  const cleanTitle = title.replace(/\s*\|\s*AK Producciones(?:\s+Eventos)?$/i, '').trim();
  const ogTitle = `${cleanTitle} | AK Producciones`;

  return {
    metadataBase: new URL(SITE_URL),
    title: cleanTitle,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: ogTitle,
      description,
      type: 'website',
      url,
      siteName: 'AK Producciones Eventos',
      locale: 'es_UY',
      images: [{ url: image, width: 1200, height: 630, alt: imageAlt }],
    },
  };
}
