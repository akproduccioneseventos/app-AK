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
    headline: 'CelebrÃ¡ el amor que construyeron juntos',
    subheadline:
      'Bodas de plata, oro o cualquier aniversario merece ser celebrado con la misma magia que el primer dÃ­a. Hacemos de tu fecha especial una noche inolvidable.',
    gradientClasses: 'from-yellow-50 via-amber-50 to-orange-50',
    accentColor: 'amber',
    emoji: 'ðŸ’›',
    ctaLabel: 'Â¡Celebrar nuestro aniversario!',
  },
  services: sharedServices.map((s) =>
    s.id === 'premium'
      ? {
          ...s,
          included: [
            ...s.included,
            'RenovaciÃ³n de votos (opcional)',
            'Ãlbum de memorias de la pareja',
            'ProjecciÃ³n de fotos del camino recorrido',
          ],
        }
      : s
  ),
  testimonials: [
    {
      id: 't1',
      authorName: 'Roberto y Marta',
      source: 'instagram',
      text: 'Nuestras Bodas de Oro fueron mÃ¡s hermosas que nuestra boda original. Gracias AK por este regalo tan especial. ðŸ’›',
      date: 'Julio 2024',
    },
    {
      id: 't2',
      authorName: 'Familia GonzÃ¡lez',
      source: 'whatsapp',
      text: 'Organizamos una sorpresa de aniversario de 25 aÃ±os para mis padres y lloramos de emociÃ³n. AK capturÃ³ todo perfectamente.',
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
        title: 'RenovaciÃ³n de votos',
        description: 'Coordinamos una emotiva ceremonia de renovaciÃ³n de votos para que vuelvan a decirse "sÃ­".',
      },
    ],
  },
  faqs: [
    ...sharedFAQs,
    {
      id: 'sorpresa',
      question: 'Â¿Pueden organizar el evento como sorpresa?',
      answer:
        'SÃ­. Organizamos eventos sorpresa con total discreciÃ³n. Coordinamos con familiares y amigos para que el festejado no se entere de nada hasta el momento especial.',
    },
  ],
  paymentMethods: sharedPaymentMethods,
  gallery: [
    { id: 'g1', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'DecoraciÃ³n romÃ¡ntica', size: 'wide' },
    { id: 'g2', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Mesa especial' },
    { id: 'g3', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Torta de aniversario' },
    { id: 'g4', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'La pareja celebrando' },
    { id: 'g5', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Arreglos florales romÃ¡nticos', size: 'wide' },
    { id: 'g6', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Brindis especial' },
  ],
  whyUs: sharedWhyUs,
  process: sharedProcess,
  whatsappNumber: '59899123456',
  whatsappMessage:
    'Â¡Hola AK Producciones! Quiero organizar un ANIVERSARIO especial. Me gustarÃ­a conocer sus propuestas.',
};

export default aniversariosData;
