import type { EventCatalogData } from '@/types/public-landing';
import {
  sharedServices,
  sharedFAQs,
  sharedPaymentMethods,
  sharedWhyUs,
  sharedProcess,
  sharedPromotion,
} from './shared';

const xvAnosData: EventCatalogData = {
  eventType: 'xv-anos',
  slug: 'xv-anos',
  name: 'XV AÃ±os',
  hero: {
    headline: 'Los mejores XV aÃ±os de su vida',
    subheadline:
      'Convertimos sus XV aÃ±os en una noche de ensueÃ±o. Decoraciones de cuento, mÃºsica, catering y todo lo que necesita para brillar como merece.',
    gradientClasses: 'from-purple-50 via-fuchsia-50 to-pink-50',
    accentColor: 'purple',
    emoji: 'ðŸ‘‘',
    ctaLabel: 'Â¡Cotizar mis XV!',
  },
  services: sharedServices.map((s) =>
    s.id === 'premium'
      ? {
          ...s,
          included: [
            ...s.included,
            'Trono o silla real decorada',
            'Corona de quinceaÃ±era',
            'CoreografÃ­a de vals + chambelanes',
          ],
        }
      : s
  ),
  testimonials: [
    {
      id: 't1',
      authorName: 'Familia RodrÃ­guez',
      source: 'instagram',
      text: 'Â¡La fiesta de mis XV fue como un cuento de hadas! Gracias AK por hacer todo tan perfecto. Mis amigas no podÃ­an creerlo. ðŸ‘‘âœ¨',
      date: 'Junio 2024',
    },
    {
      id: 't2',
      authorName: 'Luciana P.',
      source: 'whatsapp',
      text: 'Desde la primera reuniÃ³n hasta el Ãºltimo baile, el equipo de AK estuvo impecable. Muy profesionales y creativos. Â¡Los recomiendo con los ojos cerrados!',
      date: 'Enero 2024',
    },
    {
      id: 't3',
      authorName: 'Romina G.',
      source: 'google',
      text: 'Mi hija lleva meses hablando de su fiesta. Todo fue exactamente como lo imaginamos, o mejor. Gracias por hacer su sueÃ±o realidad.',
      date: 'Noviembre 2023',
    },
  ],
  promotion: {
    ...sharedPromotion,
    sectionTitle: 'ðŸŽ Regalos especiales para la quinceaÃ±era',
    gifts: [
      ...sharedPromotion.gifts,
      {
        id: 'corona',
        icon: 'ðŸ‘‘',
        title: 'Corona y banda personalizadas',
        description: 'Con su nombre y la fecha de su celebraciÃ³n, para que se sienta la princesa del evento.',
      },
      {
        id: 'libro-firmas',
        icon: 'ðŸ“–',
        title: 'Libro de firmas y mensajes',
        description: 'Un recuerdo especial donde sus invitados dejan sus deseos y palabras de cariÃ±o.',
      },
    ],
  },
  faqs: [
    ...sharedFAQs,
    {
      id: 'vals',
      question: 'Â¿Coordinan el vals y la coreografÃ­a con los chambelanes?',
      answer:
        'SÃ­. Nos encargamos de coordinar los ensayos del vals y la coreografÃ­a con los chambelanes, asegurÃ¡ndonos de que todo salga perfecto el dÃ­a del evento.',
    },
  ],
  paymentMethods: sharedPaymentMethods,
  gallery: [
    { id: 'g1', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'SalÃ³n decorado para XV', size: 'wide' },
    { id: 'g2', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Trono de quinceaÃ±era' },
    { id: 'g3', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Torta de XV aÃ±os' },
    { id: 'g4', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Vals de quinceaÃ±era' },
    { id: 'g5', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'DecoraciÃ³n floral', size: 'wide' },
    { id: 'g6', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'QuinceaÃ±era con amigas' },
  ],
  whyUs: sharedWhyUs,
  process: sharedProcess,
  whatsappNumber: '59899123456',
  whatsappMessage:
    'Â¡Hola AK Producciones! Quiero cotizar una FIESTA DE XV AÃ‘OS. Me gustarÃ­a conocer sus paquetes.',
};

export default xvAnosData;
