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

const aniversariosData: EventCatalogData = {
  eventType: 'aniversarios',
  slug: 'aniversarios',
  name: 'Aniversarios',
  hero: {
    headline: 'Celebrá el amor que construyeron juntos',
    subheadline:
      'Bodas de plata, oro o cualquier aniversario merece ser celebrado con la misma magia que el primer día. Hacemos de tu fecha especial una noche inolvidable.',
    gradientClasses: 'from-yellow-50 via-amber-50 to-orange-50',
    accentColor: 'amber',
    emoji: '💛',
    ctaLabel: '¡Celebrar nuestro aniversario!',
  },
  services: sharedServices.map((s) =>
    s.id === 'premium'
      ? {
          ...s,
          included: [
            ...s.included,
            'Renovación de votos (opcional)',
            'Álbum de memorias de la pareja',
            'Projección de fotos del camino recorrido',
          ],
        }
      : s
  ),
  testimonials: [],
  promotion: {
    ...sharedPromotion,
    sectionTitle: '🎁 Detalles especiales para aniversarios',
    gifts: [
      ...sharedPromotion.gifts,
      {
        id: 'video-memoria',
        icon: '🎞️',
        title: 'Video de memorias',
        description: 'Armamos un video emocionante con fotos del camino recorrido juntos, proyectado durante el evento.',
      },
      {
        id: 'renovacion',
        icon: '💍',
        title: 'Renovación de votos',
        description: 'Coordinamos una emotiva ceremonia de renovación de votos para que vuelvan a decirse "sí".',
      },
    ],
  },
  faqs: [
    ...sharedFAQs,
    {
      id: 'sorpresa',
      question: '¿Pueden organizar el evento como sorpresa?',
      answer:
        'Sí. Organizamos eventos sorpresa con total discreción. Coordinamos con familiares y amigos para que el festejado no se entere de nada hasta el momento especial.',
    },
  ],
  paymentMethods: sharedPaymentMethods,
  gallery: [
    { id: 'g1', src: '/images/events/aniversarios/decoracion.jpg', alt: 'Decoración romántica', size: 'wide' },
    { id: 'g2', src: '/images/events/aniversarios/mesa.jpg', alt: 'Mesa especial' },
    { id: 'g3', src: '/images/events/aniversarios/torta.jpg', alt: 'Torta de aniversario' },
    { id: 'g4', src: '/images/events/aniversarios/pareja.jpg', alt: 'La pareja celebrando' },
    { id: 'g5', src: '/images/events/aniversarios/flores.jpg', alt: 'Arreglos florales románticos', size: 'wide' },
    { id: 'g6', src: '/images/events/aniversarios/brindis.jpg', alt: 'Brindis especial' },
  ],
  whyUs: sharedWhyUs,
  process: sharedProcess,
  whatsappNumber: '59899123456',
  whatsappMessage:
    '¡Hola AK Producciones! Quiero organizar un ANIVERSARIO especial. Me gustaría conocer sus propuestas.',
};

export default aniversariosData;
