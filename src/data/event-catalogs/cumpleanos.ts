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
  name: 'CumpleaÃ±os',
  hero: {
    headline: 'CumpleaÃ±os que dejan huella',
    subheadline:
      'Desde los primeros aÃ±itos hasta el cumple de 100, organizamos celebraciones Ãºnicas y llenas de alegrÃ­a para cada etapa de la vida.',
    gradientClasses: 'from-sky-50 via-blue-50 to-cyan-50',
    accentColor: 'sky',
    emoji: 'ðŸŽ‚',
    ctaLabel: 'Â¡Planificar mi cumpleaÃ±os!',
  },
  services: sharedServices.map((s) =>
    s.id === 'basico'
      ? {
          ...s,
          included: [
            ...s.included,
            'TemÃ¡tica a elecciÃ³n',
            'Globos personalizados',
          ],
        }
      : s
  ),
  testimonials: [
    {
      id: 't1',
      authorName: 'Familia PÃ©rez',
      source: 'instagram',
      text: 'Â¡El cumple de Valentina fue una maravilla! Globos, decoraciÃ³n, torta y todo a juego. El equipo de AK es increÃ­ble. ðŸŽ‚ðŸŽˆ',
      date: 'Agosto 2024',
    },
    {
      id: 't2',
      authorName: 'JosÃ© M.',
      source: 'whatsapp',
      text: 'Organizamos el cumple de 40 de mi esposa y quedÃ³ espectacular. Todos los invitados me preguntaron quiÃ©n fue el organizador. Â¡Mil gracias!',
      date: 'Abril 2024',
    },
    {
      id: 't3',
      authorName: 'Andrea L.',
      source: 'google',
      text: 'Tercer aÃ±o seguido contratando a AK para el cumpleaÃ±os de mis hijos. Cada aÃ±o lo superan. Confiabilidad y creatividad de primera.',
      date: 'Julio 2023',
    },
  ],
  promotion: {
    ...sharedPromotion,
    sectionTitle: 'ðŸŽ Regalos incluidos en tus paquetes de cumpleaÃ±os',
    gifts: [
      ...sharedPromotion.gifts,
      {
        id: 'mesa-dulces',
        icon: 'ðŸ­',
        title: 'Mesa de dulces temÃ¡tica',
        description: 'Una mesa de candy bar decorada a juego con la temÃ¡tica del cumpleaÃ±os.',
      },
    ],
  },
  faqs: sharedFAQs,
  paymentMethods: sharedPaymentMethods,
  gallery: [
    { id: 'g1', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'DecoraciÃ³n temÃ¡tica', size: 'wide' },
    { id: 'g2', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Torta de cumpleaÃ±os' },
    { id: 'g3', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Globos personalizados' },
    { id: 'g4', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Mesa de dulces' },
    { id: 'g5', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Fiesta de cumpleaÃ±os', size: 'wide' },
    { id: 'g6', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Festejado feliz' },
  ],
  whyUs: sharedWhyUs,
  process: sharedProcess,
  whatsappNumber: '59899123456',
  whatsappMessage:
    'Â¡Hola AK Producciones! Quiero organizar un CUMPLEAÃ‘OS. Me gustarÃ­a conocer sus paquetes.',
};

export default cumpleanosData;
