import type { EventCatalogData } from '@/types/public-landing';
import {
  sharedServices,
  sharedFAQs,
  sharedPaymentMethods,
  sharedWhyUs,
  sharedProcess,
  sharedPromotion,
} from './shared';

const fiestasData: EventCatalogData = {
  eventType: 'fiestas',
  slug: 'fiestas',
  name: 'Fiestas',
  hero: {
    headline: 'Fiestas que se recuerdan para siempre',
    subheadline:
      'CumpleaÃ±os, despedidas, graduaciones, reuniones temÃ¡ticas â€” organizamos la celebraciÃ³n perfecta a tu medida, sea grande o Ã­ntima.',
    gradientClasses: 'from-amber-50 via-yellow-50 to-orange-50',
    accentColor: 'amber',
    emoji: 'ðŸŽ‰',
    ctaLabel: 'Â¡Organizar mi fiesta!',
  },
  services: sharedServices,
  testimonials: [
    {
      id: 't1',
      authorName: 'Gabriel S.',
      source: 'instagram',
      text: 'Organizamos el cumple de 50 de mi mamÃ¡ con AK y fue increÃ­ble. DecoraciÃ³n espectacular, la comida riquÃ­sima y el DJ hizo bailar a todos. Â¡Gracias! ðŸŽŠ',
      date: 'Mayo 2024',
    },
    {
      id: 't2',
      authorName: 'Daniela F.',
      source: 'whatsapp',
      text: 'Contratamos para una despedida de soltera y quedamos fascinadas. Muy creativos, sÃºper atentos y con precios justos.',
      date: 'Febrero 2024',
    },
    {
      id: 't3',
      authorName: 'MartÃ­n R.',
      source: 'google',
      text: 'La graduaciÃ³n de mi hija fue un evento de revista. Todo coordinado a la perfecciÃ³n. No dudarÃ­a en volver a contratar.',
      date: 'Diciembre 2023',
    },
  ],
  promotion: sharedPromotion,
  faqs: sharedFAQs,
  paymentMethods: sharedPaymentMethods,
  gallery: [
    { id: 'g1', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'SalÃ³n decorado para fiesta', size: 'wide' },
    { id: 'g2', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Torta de cumpleaÃ±os' },
    { id: 'g3', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'DJ en acciÃ³n' },
    { id: 'g4', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Mesa temÃ¡tica decorada' },
    { id: 'g5', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Candy bar', size: 'wide' },
    { id: 'g6', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Invitados celebrando' },
  ],
  whyUs: sharedWhyUs,
  process: sharedProcess,
  whatsappNumber: '59899123456',
  whatsappMessage:
    'Â¡Hola AK Producciones! Quiero organizar una FIESTA. Me gustarÃ­a conocer sus paquetes y disponibilidad.',
};

export default fiestasData;
