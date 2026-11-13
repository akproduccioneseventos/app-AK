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

const fiestasData: EventCatalogData = {
  eventType: 'fiestas',
  slug: 'fiestas',
  name: 'Fiestas',
  hero: {
    headline: 'Fiestas que se recuerdan para siempre',
    subheadline:
      'Cumpleaños, despedidas, graduaciones, reuniones temáticas — organizamos la celebración perfecta a tu medida, sea grande o íntima.',
    gradientClasses: 'from-amber-50 via-yellow-50 to-orange-50',
    accentColor: 'amber',
    emoji: '🎉',
    ctaLabel: '¡Organizar mi fiesta!',
  },
  services: sharedServices,
  testimonials: [],
  promotion: sharedPromotion,
  faqs: sharedFAQs,
  paymentMethods: sharedPaymentMethods,
  gallery: [
    { id: 'g1', src: '/images/events/fiestas/salon.jpg', alt: 'Salón decorado para fiesta', size: 'wide' },
    { id: 'g2', src: '/images/events/fiestas/cake.jpg', alt: 'Torta de cumpleaños' },
    { id: 'g3', src: '/images/events/fiestas/dj.jpg', alt: 'DJ en acción' },
    { id: 'g4', src: '/images/events/fiestas/table.jpg', alt: 'Mesa temática decorada' },
    { id: 'g5', src: '/images/events/fiestas/candy.jpg', alt: 'Candy bar', size: 'wide' },
    { id: 'g6', src: '/images/events/fiestas/group.jpg', alt: 'Invitados celebrando' },
  ],
  whyUs: sharedWhyUs,
  process: sharedProcess,
  whatsappNumber: AK_WHATSAPP_NUMBER,
  whatsappMessage:
    '¡Hola AK Producciones! Quiero organizar una FIESTA. Me gustaría conocer sus paquetes y disponibilidad.',
};

export default fiestasData;
