import type { EventCatalogData } from '@/types/public-landing';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';
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
  name: 'XV Años',
  hero: {
    headline: 'Los mejores XV años de su vida',
    subheadline:
      'Convertimos tus XV en una noche de ensueño. Decoraciones de cuento, música, catering y todo lo que necesitás para brillar como merecés.',
    gradientClasses: 'from-purple-50 via-fuchsia-50 to-pink-50',
    accentColor: 'purple',
    emoji: '👑',
    ctaLabel: '¡Cotizar mis XV!',
  },
  services: sharedServices.map((s) =>
    s.id === 'premium'
      ? {
          ...s,
          included: [
            ...s.included,
            'Trono o silla real decorada',
            'Corona de quinceañera',
            'Coreografía de vals + chambelanes',
          ],
        }
      : s
  ),
  testimonials: [],
  promotion: {
    ...sharedPromotion,
    sectionTitle: '🎁 Regalos especiales para la quinceañera',
    gifts: [
      ...sharedPromotion.gifts,
      {
        id: 'corona',
        icon: '👑',
        title: 'Corona y banda personalizadas',
        description: 'Con su nombre y la fecha de su celebración, para que se sienta la princesa del evento.',
      },
      {
        id: 'libro-firmas',
        icon: '📖',
        title: 'Libro de firmas y mensajes',
        description: 'Un recuerdo especial donde sus invitados dejan sus deseos y palabras de cariño.',
      },
    ],
  },
  faqs: [
    ...sharedFAQs,
    {
      id: 'vals',
      question: '¿Coordinan el vals y la coreografía con los chambelanes?',
      answer:
        'Sí. Nos encargamos de coordinar los ensayos del vals y la coreografía con los chambelanes, asegurándonos de que todo salga perfecto el día del evento.',
    },
  ],
  paymentMethods: sharedPaymentMethods,
  gallery: [
    { id: 'g1', src: '/images/events/xv-anos/saloon.jpg', alt: 'Salón decorado para XV', size: 'wide' },
    { id: 'g2', src: '/images/events/xv-anos/throne.jpg', alt: 'Trono de quinceañera' },
    { id: 'g3', src: '/images/events/xv-anos/cake.jpg', alt: 'Torta de XV años' },
    { id: 'g4', src: '/images/events/xv-anos/vals.jpg', alt: 'Vals de quinceañera' },
    { id: 'g5', src: '/images/events/xv-anos/flowers.jpg', alt: 'Decoración floral', size: 'wide' },
    { id: 'g6', src: '/images/events/xv-anos/group.jpg', alt: 'Quinceañera con amigas' },
  ],
  whyUs: sharedWhyUs,
  process: sharedProcess,
  whatsappNumber: AK_WHATSAPP_NUMBER,
  whatsappMessage:
    '¡Hola AK Producciones! Quiero cotizar una FIESTA DE XV AÑOS. Me gustaría conocer sus paquetes.',
};

export default xvAnosData;
