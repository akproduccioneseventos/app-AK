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
      'Cumpleaños, despedidas, graduaciones, reuniones temáticas — organizamos la celebración perfecta a tu medida, sea grande o íntima.',
    gradientClasses: 'from-amber-50 via-yellow-50 to-orange-50',
    accentColor: 'amber',
    emoji: '🎉',
    ctaLabel: '¡Organizar mi fiesta!',
  },
  services: sharedServices,
  testimonials: [
    {
      id: 't1',
      authorName: 'Gabriel S.',
      source: 'instagram',
      text: 'Organizamos el cumple de 50 de mi mamá con AK y fue increíble. Decoración espectacular, la comida riquísima y el DJ hizo bailar a todos. ¡Gracias! 🎊',
      date: 'Mayo 2024',
    },
    {
      id: 't2',
      authorName: 'Daniela F.',
      source: 'whatsapp',
      text: 'Contratamos para una despedida de soltera y quedamos fascinadas. Muy creativos, súper atentos y con precios justos.',
      date: 'Febrero 2024',
    },
    {
      id: 't3',
      authorName: 'Martín R.',
      source: 'google',
      text: 'La graduación de mi hija fue un evento de revista. Todo coordinado a la perfección. No dudaría en volver a contratar.',
      date: 'Diciembre 2023',
    },
  ],
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
  whatsappNumber: '59899123456',
  whatsappMessage:
    '¡Hola AK Producciones! Quiero organizar una FIESTA. Me gustaría conocer sus paquetes y disponibilidad.',
};

export default fiestasData;
