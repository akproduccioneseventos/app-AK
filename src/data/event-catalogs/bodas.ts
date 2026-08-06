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
      'Organizamos cada detalle para que el dÃ­a mÃ¡s importante de tu vida sea exactamente como lo soÃ±aste. DÃ©cor, catering, mÃºsica, fotografÃ­a â€” todo en un solo lugar.',
    gradientClasses:
      'from-rose-50 via-pink-50 to-red-50',
    accentColor: 'rose',
    emoji: 'ðŸ’',
    ctaLabel: 'Â¡Cotizar mi boda!',
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
      text: 'Â¡AK Producciones hizo nuestra boda un sueÃ±o! Cada detalle fue perfecto, desde las flores hasta la torta. Eternamente agradecidos. ðŸ’•',
      date: 'Marzo 2024',
    },
    {
      id: 't2',
      authorName: 'Carolina M.',
      source: 'whatsapp',
      text: 'No puedo creer lo hermoso que quedÃ³ todo. El equipo estuvo presente en todo momento y nosotros solo tuvimos que disfrutar. Â¡100% recomendados!',
      date: 'Diciembre 2023',
    },
    {
      id: 't3',
      authorName: 'Florencia & MatÃ­as',
      source: 'google',
      text: 'Llevamos aÃ±os pensando en nuestra boda y AK superÃ³ todas nuestras expectativas. Profesionales, cÃ¡lidos y creativos.',
      date: 'Octubre 2023',
    },
  ],
  promotion: {
    ...sharedPromotion,
    gifts: [
      ...sharedPromotion.gifts,
      {
        id: 'luna-de-miel',
        icon: 'ðŸŒ™',
        title: 'Detalle luna de miel',
        description: 'Un regalo sorpresa para la pareja en su primera noche como casados.',
      },
    ],
  },
  faqs: [
    ...sharedFAQs,
    {
      id: 'ceremonia',
      question: 'Â¿Organizan la ceremonia religiosa o civil tambiÃ©n?',
      answer:
        'SÃ­. Coordinamos todo lo relacionado con la ceremonia: decoraciÃ³n del espacio, coordinaciÃ³n con el sacerdote o juez de paz, flores, pajes y mÃ¡s.',
    },
  ],
  paymentMethods: sharedPaymentMethods,
  gallery: [
    { id: 'g1', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Ceremonia nupcial', size: 'wide' },
    { id: 'g2', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'RecepciÃ³n decorada' },
    { id: 'g3', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Torta de bodas' },
    { id: 'g4', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Primer baile' },
    { id: 'g5', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Arreglos florales', size: 'wide' },
    { id: 'g6', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Los novios' },
  ],
  whyUs: sharedWhyUs,
  process: sharedProcess,
  whatsappNumber: '59899123456',
  whatsappMessage:
    'Â¡Hola AK Producciones! Quiero cotizar una BODA. Me gustarÃ­a conocer sus paquetes.',
};

export default bodasData;
