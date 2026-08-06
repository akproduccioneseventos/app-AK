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
    emoji: 'ðŸ’›',
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
  testimonials: [
    {
      id: 't1',
      authorName: 'Roberto y Marta',
      source: 'instagram',
      text: 'Nuestras Bodas de Oro fueron más hermosas que nuestra boda original. Gracias AK por este regalo tan especial. ðŸ’›',
      date: 'Julio 2024',
    },
    {
      id: 't2',
      authorName: 'Familia González',
      source: 'whatsapp',
      text: 'Organizamos una sorpresa de aniversario de 25 años para mis padres y lloramos de emoción. AK capturó todo perfectamente.',
      date: 'Marzo 2024',
    },
  ],
  promotion: {
    ...sharedPromotion,
    sectionTitle: 'ðŸŽ Detalles especiales para aniversarios',
    gifts: [
      ...sharedPromotion.gifts,
      {
        id: 'video-memoria',
        icon: 'ðŸŽžï¸',
        title: 'Video de memorias',
        description: 'Armamos un video emocionante con fotos del camino recorrido juntos, proyectado durante el evento.',
      },
      {
        id: 'renovacion',
        icon: 'ðŸ’',
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
    { id: 'g1', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Decoración romántica', size: 'wide' },
    { id: 'g2', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Mesa especial' },
    { id: 'g3', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Torta de aniversario' },
    { id: 'g4', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'La pareja celebrando' },
    { id: 'g5', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Arreglos florales románticos', size: 'wide' },
    { id: 'g6', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Brindis especial' },
  ],
  whyUs: sharedWhyUs,
  process: sharedProcess,
  whatsappNumber: '59899123456',
  whatsappMessage:
    '¡Hola AK Producciones! Quiero organizar un ANIVERSARIO especial. Me gustaría conocer sus propuestas.',
};

export default aniversariosData;
