// Shared catalog content reused across all event types.
// Each event-specific file imports these and overrides only what differs.

import type {
  ServiceItem,
  FAQItem,
  PaymentMethod,
  Testimonial,
  WhyUsItem,
  ProcessStep,
  PromotionData,
} from '@/types/public-landing';
import testimonialsRaw from '@/data/testimonials.json';

export const sharedServices: ServiceItem[] = [
  {
    id: 'basico',
    title: 'Paquete Básico',
    description: 'Todo lo esencial para una celebración perfecta.',
    included: [
      'Decoración temática',
      'Mesa principal decorada',
      'Centros de mesa (hasta 10 mesas)',
      'Iluminación ambiental',
      'Coordinación el día del evento',
    ],
    price: 'Consultar',
  },
  {
    id: 'premium',
    // Los paquetes que vende AK son Básico, Intermedio y Premium. La web
    // antes publicaba una escala desactualizada con nombres que no correspondían.
    // Se renombran los carteles nada más; el contenido de cada paquete lo armó el
    // dueño y no se toca. Los identificadores internos (`premium`, `elite`) quedan
    // igual para no romper los enlaces ya compartidos.
    title: 'Paquete Intermedio',
    description: 'Experiencia completa con atención personalizada.',
    included: [
      'Todo lo del Paquete Básico',
      'Catering completo (entrada, principal y postre)',
      'Barra de bebidas',
      'DJ + iluminación profesional',
      'Fotografía profesional',
      'Torta personalizada',
      'Cotillón para invitados',
    ],
    price: 'Consultar',
    highlighted: true,
  },
  {
    id: 'elite',
    title: 'Paquete Premium',
    description: 'La experiencia más exclusiva, sin límites.',
    included: [
      'Todo lo del Paquete Intermedio',
      'Animación y show en vivo',
      'Carro de candy bar',
      'Photobooth con impresión instantánea',
      'Traslado en vehículo especial',
      'Álbum de fotos profesional',
      'Video de recuerdo editado',
    ],
    price: 'Consultar',
  },
];

export const sharedFAQs: FAQItem[] = [
  {
    id: 'reserva',
    question: '¿Con cuánta anticipación debo reservar?',
    answer:
      'Recomendamos reservar con al menos 3 meses de anticipación para fechas en temporada alta (noviembre–febrero y julio). Para otras fechas, 4 a 6 semanas suelen ser suficientes.',
  },
  {
    id: 'seña',
    question: '¿Se requiere una seña para reservar la fecha?',
    answer:
      'Sí. Para confirmar la fecha se requiere una seña de {SENIA}. En caso de cancelación rige una penalidad del 30% del presupuesto vigente. El saldo restante se abona en cuotas según lo convenido.',
  },
  {
    id: 'lluvia',
    question: '¿Qué pasa si llueve o hay un imprevisto?',
    answer:
      'Contamos con planes de contingencia para condiciones climáticas adversas. Te asesoramos para elegir salones con alternativa interior/exterior y siempre tenemos un plan B listo.',
  },
  {
    id: 'invitados',
    question: '¿Puedo ajustar la cantidad de invitados después de contratar?',
    answer:
      'Sí, dentro de ciertos límites. Ajustes menores (±10%) se pueden coordinar hasta 15 días antes del evento.',
  },
  {
    id: 'personalizar',
    question: '¿Puedo personalizar el paquete a mi gusto?',
    answer:
      'Absolutamente. Todos nuestros paquetes son puntos de partida. Trabajamos con vos para armar la propuesta ideal según tu visión y presupuesto.',
  },
  {
    id: 'reunion',
    question: '¿Cómo es el proceso de contratación?',
    answer:
      'Primero agendamos una reunión (presencial o por videollamada) para entender tu visión. Luego preparamos un presupuesto a medida, y una vez aprobado coordinamos todos los detalles.',
  },
];

export const sharedPaymentMethods: PaymentMethod[] = [
  { id: 'efectivo', name: 'Efectivo', icon: '💵', description: 'Pesos uruguayos o dólares' },
  { id: 'transferencia', name: 'Transferencia bancaria', icon: '🏦', description: 'BROU, Itaú, Santander y más' },
  { id: 'mercadopago', name: 'Mercado Pago', icon: '📲', description: 'QR o link de pago' },
  { id: 'tarjeta', name: 'Tarjetas de crédito / débito', icon: '💳', description: 'Visa, Mastercard, OCA' },
  { id: 'cuotas', name: 'Cuotas sin interés', icon: '🗓️', description: 'Hasta 6 cuotas según el monto' },
];

export const sharedWhyUs: WhyUsItem[] = [
  {
    id: 'experiencia',
    icon: '🏆',
    title: '+7 años de experiencia',
    description: 'Hemos organizado cientos de eventos, desde íntimas celebraciones familiares hasta grandes fiestas de 500 personas.',
  },
  {
    id: 'equipo',
    icon: '🤝',
    title: 'Equipo propio y de confianza',
    description: 'Trabajamos con nuestro propio equipo de ambientadores, DJs, fotógrafos y catering para cuidar la calidad.',
  },
  {
    id: 'personalizado',
    icon: '✨',
    title: 'Atención 100% personalizada',
    description: 'Cada evento es único. Escuchamos tu visión y la convertimos en realidad, cuidando cada detalle.',
  },
  {
    id: 'precio',
    icon: '💰',
    title: 'Precios transparentes',
    description: 'Sin sorpresas. Te presentamos un presupuesto claro y detallado para que sepas exactamente en qué se invierte cada peso.',
  },
  {
    id: 'soporte',
    icon: '📱',
    title: 'Seguimiento constante',
    description: 'Desde el primer contacto hasta el día después del evento, estamos disponibles para responder cualquier duda.',
  },
  {
    id: 'recuerdo',
    icon: '📸',
    title: 'Momentos que duran para siempre',
    description: 'Nos aseguramos de que cada detalle sea digno de recordarse. Tu felicidad es nuestra mejor carta de presentación.',
  },
];

export const sharedProcess: ProcessStep[] = [
  {
    id: 'contacto',
    step: 1,
    icon: '💬',
    title: 'Nos contactás',
    description: 'Envianos un mensaje por WhatsApp o redes sociales. Contanos qué tipo de evento soñás.',
  },
  {
    id: 'reunion',
    step: 2,
    icon: '📋',
    title: 'Reunión de planificación',
    description: 'Agendamos una reunión (presencial o virtual) para conocer tu visión, gustos y presupuesto disponible.',
  },
  {
    id: 'propuesta',
    step: 3,
    icon: '📄',
    title: 'Propuesta personalizada',
    description: 'Preparamos un presupuesto detallado con todas las opciones seleccionadas. Sin letra chica.',
  },
  {
    id: 'confirmacion',
    step: 4,
    icon: '🤝',
    title: 'Confirmás y reservás',
    description: 'Con una seña confirmás la fecha. A partir de ahí, ¡nos ponemos manos a la obra!',
  },
  {
    id: 'coordinacion',
    step: 5,
    icon: '🗓️',
    title: 'Coordinación previa',
    description: 'Nos reunimos las semanas previas para afinar cada detalle: ambientación, menú, lista de invitados, itinerario.',
  },
  {
    id: 'evento',
    step: 6,
    icon: '🎉',
    title: '¡A disfrutar!',
    description: 'El día del evento llegamos antes que nadie para montar todo. Vos solo tenés que aparecer y disfrutar.',
  },
];

// Testimonios REALES aprobados de clientes desde testimonials.json
export const sharedTestimonials: Testimonial[] = (testimonialsRaw as Array<{
  id: string;
  clientName: string;
  testimonialText: string;
  isApproved: boolean;
  createdAt?: string;
}>)
  .filter((t) => t.isApproved)
  .map((t) => ({
    id: t.id,
    authorName: t.clientName,
    source: 'text' as const,
    text: t.testimonialText,
    date: '2026',
  }));

export const sharedPromotion: PromotionData = {
  sectionTitle: '🎁 Regalos incluidos en todos los paquetes',
  sectionSubtitle: 'Detalles que hacen la diferencia',
  gifts: [
    {
      id: 'souvenir',
      icon: '🎀',
      title: 'Souvenir personalizado',
      description: 'Un recuerdo único para cada invitado, diseñado con el nombre y fecha del evento.',
    },
    {
      id: 'torta',
      icon: '🎂',
      title: 'Torta de regalo',
      description: 'Con diseño personalizado, según el paquete que elijas.',
    },
    {
      id: 'album',
      icon: '📷',
      title: 'Álbum digital de fotos',
      description: 'Galería privada en línea con todas las fotos del evento, lista en 7 días.',
    },
    {
      id: 'coordinacion',
      icon: '📋',
      title: 'Coordinador el día del evento',
      description: 'Un profesional dedicado a coordinar todo para que nada te preocupe.',
    },
  ],
};
