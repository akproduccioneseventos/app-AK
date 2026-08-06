import type { EventCatalogData } from '@/types/public-landing';
import {
  sharedServices,
  sharedFAQs,
  sharedPaymentMethods,
  sharedWhyUs,
  sharedProcess,
  sharedPromotion,
} from './shared';

const cumpleanosData: EventCatalogData = {
  eventType: 'cumpleanos',
  slug: 'cumpleanos',
  name: 'Cumpleaños',
  hero: {
    headline: 'Cumpleaños que dejan huella',
    subheadline:
      'Desde los primeros añitos hasta el cumple de 100, organizamos celebraciones únicas y llenas de alegría para cada etapa de la vida.',
    gradientClasses: 'from-sky-50 via-blue-50 to-cyan-50',
    accentColor: 'sky',
    emoji: 'ðŸŽ‚',
    ctaLabel: '¡Planificar mi cumpleaños!',
  },
  services: sharedServices.map((s) =>
    s.id === 'basico'
      ? {
          ...s,
          included: [
            ...s.included,
            'Temática a elección',
            'Globos personalizados',
          ],
        }
      : s
  ),
  testimonials: [
    {
      id: 't1',
      authorName: 'Familia Pérez',
      source: 'instagram',
      text: '¡El cumple de Valentina fue una maravilla! Globos, decoración, torta y todo a juego. El equipo de AK es increíble. ðŸŽ‚ðŸŽˆ',
      date: 'Agosto 2024',
    },
    {
      id: 't2',
      authorName: 'José M.',
      source: 'whatsapp',
      text: 'Organizamos el cumple de 40 de mi esposa y quedó espectacular. Todos los invitados me preguntaron quién fue el organizador. ¡Mil gracias!',
      date: 'Abril 2024',
    },
    {
      id: 't3',
      authorName: 'Andrea L.',
      source: 'google',
      text: 'Tercer año seguido contratando a AK para el cumpleaños de mis hijos. Cada año lo superan. Confiabilidad y creatividad de primera.',
      date: 'Julio 2023',
    },
  ],
  promotion: {
    ...sharedPromotion,
    sectionTitle: 'ðŸŽ Regalos incluidos en tus paquetes de cumpleaños',
    gifts: [
      ...sharedPromotion.gifts,
      {
        id: 'mesa-dulces',
        icon: 'ðŸ­',
        title: 'Mesa de dulces temática',
        description: 'Una mesa de candy bar decorada a juego con la temática del cumpleaños.',
      },
    ],
  },
  faqs: sharedFAQs,
  paymentMethods: sharedPaymentMethods,
  gallery: [
    { id: 'g1', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Decoración temática', size: 'wide' },
    { id: 'g2', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Torta de cumpleaños' },
    { id: 'g3', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Globos personalizados' },
    { id: 'g4', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Mesa de dulces' },
    { id: 'g5', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Fiesta de cumpleaños', size: 'wide' },
    { id: 'g6', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Festejado feliz' },
  ],
  whyUs: sharedWhyUs,
  process: sharedProcess,
  whatsappNumber: '59899123456',
  whatsappMessage:
    '¡Hola AK Producciones! Quiero organizar un CUMPLEAÃ‘OS. Me gustaría conocer sus paquetes.',
};

export default cumpleanosData;
