// Los testimonios de relleno se sacaron el 18 de agosto de 2026.
//
// Tenian nombre y apellido, fecha y de que red salian, pero **no eran reales** y
// les faltaba lo unico que los hacia creibles: la captura del comentario
// (`screenshotUrl`). Un visitante no tenia forma de saber que eran de mentira.
//
// La lista queda vacia a proposito: el carrusel se esconde solo cuando no hay
// nada, asi que no deja hueco. Cuando entren los comentarios de verdad de las
// redes, se muestran esos.

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
    emoji: '🎂',
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
  testimonials: [],
  promotion: {
    ...sharedPromotion,
    sectionTitle: '🎁 Regalos incluidos en tus paquetes de cumpleaños',
    gifts: [
      ...sharedPromotion.gifts,
      {
        id: 'mesa-dulces',
        icon: '🍭',
        title: 'Mesa de dulces temática',
        description: 'Una mesa de candy bar decorada a juego con la temática del cumpleaños.',
      },
    ],
  },
  faqs: sharedFAQs,
  paymentMethods: sharedPaymentMethods,
  gallery: [
    { id: 'g1', src: '/images/events/cumpleanos/decoracion.jpg', alt: 'Decoración temática', size: 'wide' },
    { id: 'g2', src: '/images/events/cumpleanos/torta.jpg', alt: 'Torta de cumpleaños' },
    { id: 'g3', src: '/images/events/cumpleanos/globos.jpg', alt: 'Globos personalizados' },
    { id: 'g4', src: '/images/events/cumpleanos/mesa-dulces.jpg', alt: 'Mesa de dulces' },
    { id: 'g5', src: '/images/events/cumpleanos/fiesta.jpg', alt: 'Fiesta de cumpleaños', size: 'wide' },
    { id: 'g6', src: '/images/events/cumpleanos/ninos.jpg', alt: 'Festejado feliz' },
  ],
  whyUs: sharedWhyUs,
  process: sharedProcess,
  whatsappNumber: '59899123456',
  whatsappMessage:
    '¡Hola AK Producciones! Quiero organizar un CUMPLEAÑOS. Me gustaría conocer sus paquetes.',
};

export default cumpleanosData;
