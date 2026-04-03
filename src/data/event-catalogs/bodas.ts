import type { EventCatalogData } from '@/types/public-landing';
import {
  sharedServices,
  sharedFAQs,
  sharedPaymentMethods,
  sharedWhyUs,
  sharedProcess,
  sharedPromotion,
} from './shared';

const bodasData: EventCatalogData = {
  eventType: 'bodas',
  slug: 'bodas',
  name: 'Bodas',
  hero: {
    headline: 'Tu boda perfecta, hecha realidad',
    subheadline:
      'Organizamos cada detalle para que el día más importante de tu vida sea exactamente como lo soñaste. Décor, catering, música, fotografía — todo en un solo lugar.',
    gradientClasses: 'from-rose-50 via-pink-50 to-red-50',
    accentColor: 'rose',
    emoji: '💍',
    ctaLabel: '¡Cotizar mi boda!',
  },
  services: sharedServices.map((s) =>
    s.id === 'premium'
      ? {
          ...s,
          included: [
            ...s.included,
            'Ceremonia personalizada (civil o religiosa)',
            'Arco floral de entrada',
            'Mesa de dulces nupciales',
          ],
        }
      : s
  ),
  testimonials: [
    {
      id: 't1',
      authorName: 'Valentina y Rodrigo',
      source: 'instagram',
      text: '¡AK Producciones hizo nuestra boda un sueño! Cada detalle fue perfecto, desde las flores hasta la torta. Eternamente agradecidos. 💕',
      date: 'Marzo 2024',
    },
    {
      id: 't2',
      authorName: 'Carolina M.',
      source: 'whatsapp',
      text: 'No puedo creer lo hermoso que quedó todo. El equipo estuvo presente en todo momento y nosotros solo tuvimos que disfrutar. ¡100% recomendados!',
      date: 'Diciembre 2023',
    },
    {
      id: 't3',
      authorName: 'Florencia & Matías',
      source: 'google',
      text: 'Llevamos años pensando en nuestra boda y AK superó todas nuestras expectativas. Profesionales, cálidos y creativos.',
      date: 'Octubre 2023',
    },
  ],
  promotion: {
    ...sharedPromotion,
    gifts: [
      ...sharedPromotion.gifts,
      {
        id: 'luna-de-miel',
        icon: '🌙',
        title: 'Detalle luna de miel',
        description: 'Un regalo sorpresa para la pareja en su primera noche como casados.',
      },
    ],
  },
  faqs: [
    ...sharedFAQs,
    {
      id: 'ceremonia',
      question: '¿Organizan la ceremonia religiosa o civil también?',
      answer:
        'Sí. Coordinamos todo lo relacionado con la ceremonia: decoración del espacio, coordinación con el sacerdote o juez de paz, flores, pajes y más.',
    },
  ],
  paymentMethods: sharedPaymentMethods,
  gallery: [
    { id: 'g1', src: '/images/events/bodas/ceremony.jpg', alt: 'Ceremonia nupcial', size: 'wide' },
    { id: 'g2', src: '/images/events/bodas/reception.jpg', alt: 'Recepción decorada' },
    { id: 'g3', src: '/images/events/bodas/cake.jpg', alt: 'Torta de bodas' },
    { id: 'g4', src: '/images/events/bodas/dance.jpg', alt: 'Primer baile' },
    { id: 'g5', src: '/images/events/bodas/flowers.jpg', alt: 'Arreglos florales', size: 'wide' },
    { id: 'g6', src: '/images/events/bodas/couple.jpg', alt: 'Los novios' },
  ],
  whyUs: sharedWhyUs,
  process: sharedProcess,
  whatsappNumber: '59899123456',
  whatsappMessage:
    '¡Hola AK Producciones! Quiero cotizar una BODA. Me gustaría conocer sus paquetes y disponibilidad.',
};

export default bodasData;
