import React from 'react';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQJsonLdProps {
  items: FAQItem[];
}

/**
 * Preguntas frecuentes estructuradas (FAQPage) para que Google muestre resultados enriquecidos.
 * REGLA: Sólo contiene respuestas reales basadas en la información verificada de la empresa.
 */
export function FAQJsonLd({ items }: FAQJsonLdProps) {
  if (!items || items.length === 0) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * FAQs reales verificadas de AK Producciones para eventos en Salto, Uruguay.
 */
export const EVENTOS_FAQS: Record<'bodas' | 'quinceaneras' | 'cumpleanos' | 'general', FAQItem[]> = {
  general: [
    {
      question: '¿Qué incluye el servicio integral de AK Producciones en Salto?',
      answer: 'Incluye discoteca con sonido profesional e iluminación LED, gastronomía gourmet con catering completo, salones exclusivos como Club Uruguay, coordinación presencial y tecnología interactiva como fotocabinas y pantalla gigante.',
    },
    {
      question: '¿Con cuánta anticipación se debe reservar una fecha de evento?',
      answer: 'Recomendamos reservar con 6 a 12 meses de anticipación para asegurar disponibilidad del salón y los servicios principales, especialmente para fechas de temporada alta en Salto.',
    },
    {
      question: '¿Cómo son las formas de pago y señas para contratar?',
      answer: 'Se reserva con una seña inicial congelando la fecha y el saldo se puede abonar en cuotas coordinadas hasta la fecha de la celebración.',
    },
  ],
  bodas: [
    {
      question: '¿Qué capacidad de invitados tiene el salón Club Uruguay para bodas?',
      answer: 'Salón Club Uruguay en Salto tiene capacidad para eventos de hasta 250 invitados cómodamente sentados con pista de baile, ambientación y recepción.',
    },
    {
      question: '¿Se puede personalizar el menú gastronómico de la boda?',
      answer: 'Sí, contamos con opciones de menú gourmet adaptables a preferencias, incluyendo platos celíacos, vegetarianos e infantiles.',
    },
  ],
  quinceaneras: [
    {
      question: '¿Qué tecnología interactiva tienen para fiestas de 15 años?',
      answer: 'Contamos con pista de luces LED, plataforma 360°, fotocabina con impresión y QR instantáneo, muro social de fotos en vivo y trivias interactivas para los invitados.',
    },
    {
      question: '¿Los padres pueden seguir el presupuesto online?',
      answer: 'Sí, la familia cuenta con un simulador interactivo y un panel de seguimiento para ver cada rubro contratado sin sorpresas ni costos ocultos.',
    },
  ],
  cumpleanos: [
    {
      question: '¿Organizan cumpleaños de adultos e infantiles en salones propios o a domicilio?',
      answer: 'Trabajamos tanto en nuestro salón exclusivo Club Uruguay como en cualquier salón o quinta en Salto con montaje completo de sonido, luces y catering.',
    },
  ],
};
