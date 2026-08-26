import React from 'react';

export interface ArticleJsonLdProps {
  url: string;
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  publisherName?: string;
  publisherLogo?: string;
}

export function ArticleJsonLd({
  url,
  title,
  description,
  image,
  datePublished,
  dateModified,
  authorName = 'AK Producciones Eventos',
  publisherName = 'AK Producciones Eventos',
  publisherLogo = 'https://akproducciones.uy/logo.png',
}: ArticleJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    headline: title,
    description,
    image: [image.startsWith('http') ? image : `https://akproducciones.uy${image}`],
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: authorName,
      url: 'https://akproducciones.uy',
    },
    publisher: {
      '@type': 'Organization',
      name: publisherName,
      logo: {
        '@type': 'ImageObject',
        url: publisherLogo,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
