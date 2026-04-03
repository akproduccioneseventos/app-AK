import type { EventCatalogData } from '@/types/public-landing';
import {
  sharedFAQs,
  sharedPaymentMethods,
  sharedWhyUs,
  sharedProcess,
  sharedPromotion,
} from './shared';

const corporativosData: EventCatalogData = {
  eventType: 'corporativos',
  slug: 'corporativos',
  name: 'Eventos Corporativos',
  hero: {
    headline: 'Eventos corporativos de alto impacto',
    subheadline:
      'Reuniones de empresa, cenas de fin de año, team building, lanzamientos de producto — los organizamos con la elegancia y profesionalismo que tu empresa merece.',
    gradientClasses: 'from-slate-50 via-gray-50 to-zinc-50',
    accentColor: 'slate',
    emoji: '🏢',
    ctaLabel: '¡Solicitar propuesta!',
  },
  services: [
    {
      id: 'empresarial',
      title: 'Paquete Empresarial',
      description: 'Ideal para reuniones de equipo y almuerzos corporativos.',
      included: [
        'Decoración corporativa (logo, colores de empresa)',
        'Catering ejecutivo',
        'Equipo audiovisual básico',
        'Coordinación del evento',
      ],
      price: 'Consultar',
    },
    {
      id: 'gala',
      title: 'Paquete Gala Empresarial',
      description: 'La opción ideal para cenas de fin de año y celebraciones de logros.',
      included: [
        'Decoración temática de gala',
        'Cena de 3 pasos + barra libre',
        'Presentador/MC profesional',
        'Show musical o espectáculo',
        'Fotografía y video',
        'Mesa de premios y reconocimientos',
      ],
      price: 'Consultar',
      highlighted: true,
    },
    {
      id: 'teambuilding',
      title: 'Paquete Team Building',
      description: 'Para fomentar la integración y el bienestar del equipo.',
      included: [
        'Actividades de integración guiadas',
        'Catering tipo picnic o asado',
        'Ambientación al aire libre',
        'Coordinación completa',
        'Registro fotográfico',
      ],
      price: 'Consultar',
    },
  ],
  testimonials: [
    {
      id: 't1',
      authorName: 'Empresa Tech S.A.',
      source: 'google',
      text: 'Organizamos nuestra cena anual de fin de año con AK y fue un éxito rotundo. Muy profesionales, puntuales y con excelente atención al detalle.',
      date: 'Diciembre 2023',
    },
    {
      id: 't2',
      authorName: 'Recursos Humanos - Grupo Norte',
      source: 'whatsapp',
      text: 'El team building que organizaron superó todas las expectativas. El equipo quedó encantado y nuestro CEO no paraba de elogiarlos.',
      date: 'Octubre 2023',
    },
  ],
  promotion: {
    ...sharedPromotion,
    sectionTitle: '🏆 Beneficios especiales para empresas',
    gifts: [
      {
        id: 'factura',
        icon: '📄',
        title: 'Facturación empresarial',
        description: 'Emitimos facturas a nombre de empresa para facilitar el proceso de gastos corporativos.',
      },
      {
        id: 'descuento',
        icon: '💰',
        title: 'Descuentos por fidelidad',
        description: 'Empresas que organizan más de 2 eventos anuales acceden a tarifas preferenciales.',
      },
      {
        id: 'propuesta',
        icon: '📋',
        title: 'Propuesta en 48 horas',
        description: 'Recibís un presupuesto detallado y personalizado en menos de 48 horas hábiles.',
      },
      {
        id: 'coordinacion-empresa',
        icon: '📋',
        title: 'Coordinador dedicado',
        description: 'Un punto de contacto único que conoce tu empresa y tus necesidades.',
      },
    ],
  },
  faqs: [
    ...sharedFAQs,
    {
      id: 'facturacion',
      question: '¿Emiten factura empresarial?',
      answer:
        'Sí. Podemos emitir comprobantes fiscales a nombre de la empresa para facilitar la gestión de gastos internos.',
    },
  ],
  paymentMethods: sharedPaymentMethods,
  gallery: [
    { id: 'g1', src: '/images/events/corporativos/gala.jpg', alt: 'Gala empresarial', size: 'wide' },
    { id: 'g2', src: '/images/events/corporativos/decoracion.jpg', alt: 'Decoración corporativa' },
    { id: 'g3', src: '/images/events/corporativos/catering.jpg', alt: 'Catering ejecutivo' },
    { id: 'g4', src: '/images/events/corporativos/teambuilding.jpg', alt: 'Team building' },
    { id: 'g5', src: '/images/events/corporativos/salon.jpg', alt: 'Salón preparado', size: 'wide' },
    { id: 'g6', src: '/images/events/corporativos/entrega.jpg', alt: 'Entrega de reconocimientos' },
  ],
  whyUs: sharedWhyUs,
  process: sharedProcess,
  whatsappNumber: '59899123456',
  whatsappMessage:
    '¡Hola AK Producciones! Quiero cotizar un EVENTO CORPORATIVO para mi empresa. Me gustaría recibir una propuesta.',
};

export default corporativosData;
