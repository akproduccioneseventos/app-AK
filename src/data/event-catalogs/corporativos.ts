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
      'Reuniones de empresa, cenas de fin de aÃ±o, team building, lanzamientos de producto â€” los organizamos con la elegancia y profesionalismo que tu empresa merece.',
    gradientClasses: 'from-slate-50 via-gray-50 to-zinc-50',
    accentColor: 'slate',
    emoji: 'ðŸ¢',
    ctaLabel: 'Â¡Solicitar propuesta!',
  },
  services: [
    {
      id: 'empresarial',
      title: 'Paquete Empresarial',
      description: 'Ideal para reuniones de equipo y almuerzos corporativos.',
      included: [
        'DecoraciÃ³n corporativa (logo, colores de empresa)',
        'Catering ejecutivo',
        'Equipo audiovisual bÃ¡sico',
        'CoordinaciÃ³n del evento',
      ],
      price: 'Consultar',
    },
    {
      id: 'gala',
      title: 'Paquete Gala Empresarial',
      description: 'La opciÃ³n ideal para cenas de fin de aÃ±o y celebraciones de logros.',
      included: [
        'DecoraciÃ³n temÃ¡tica de gala',
        'Cena de 3 pasos + barra libre',
        'Presentador/MC profesional',
        'Show musical o espectÃ¡culo',
        'FotografÃ­a y video',
        'Mesa de premios y reconocimientos',
      ],
      price: 'Consultar',
      highlighted: true,
    },
    {
      id: 'teambuilding',
      title: 'Paquete Team Building',
      description: 'Para fomentar la integraciÃ³n y el bienestar del equipo.',
      included: [
        'Actividades de integraciÃ³n guiadas',
        'Catering tipo picnic o asado',
        'AmbientaciÃ³n al aire libre',
        'CoordinaciÃ³n completa',
        'Registro fotogrÃ¡fico',
      ],
      price: 'Consultar',
    },
  ],
  testimonials: [
    {
      id: 't1',
      authorName: 'Empresa Tech S.A.',
      source: 'google',
      text: 'Organizamos nuestra cena anual de fin de aÃ±o con AK y fue un Ã©xito rotundo. Muy profesionales, puntuales y con excelente atenciÃ³n al detalle.',
      date: 'Diciembre 2023',
    },
    {
      id: 't2',
      authorName: 'Recursos Humanos - Grupo Norte',
      source: 'whatsapp',
      text: 'El team building que organizaron superÃ³ todas las expectativas. El equipo quedÃ³ encantado y nuestro CEO no paraba de elogiarlos.',
      date: 'Octubre 2023',
    },
  ],
  promotion: {
    ...sharedPromotion,
    sectionTitle: 'ðŸ† Beneficios especiales para empresas',
    gifts: [
      {
        id: 'factura',
        icon: 'ðŸ“„',
        title: 'FacturaciÃ³n empresarial',
        description: 'Emitimos facturas a nombre de empresa para facilitar el proceso de gastos corporativos.',
      },
      {
        id: 'descuento',
        icon: 'ðŸ’°',
        title: 'Descuentos por fidelidad',
        description: 'Empresas que organizan mÃ¡s de 2 eventos anuales acceden a tarifas preferenciales.',
      },
      {
        id: 'propuesta',
        icon: 'ðŸ“‹',
        title: 'Propuesta en 48 horas',
        description: 'RecibÃ­s un presupuesto detallado y personalizado en menos de 48 horas hÃ¡biles.',
      },
      {
        id: 'coordinacion-empresa',
        icon: 'ðŸ“‹',
        title: 'Coordinador dedicado',
        description: 'Un punto de contacto Ãºnico que conoce tu empresa y tus necesidades.',
      },
    ],
  },
  faqs: [
    ...sharedFAQs,
    {
      id: 'facturacion',
      question: 'Â¿Emiten factura empresarial?',
      answer:
        'SÃ­. Podemos emitir comprobantes fiscales a nombre de la empresa para facilitar la gestiÃ³n de gastos internos.',
    },
  ],
  paymentMethods: sharedPaymentMethods,
  gallery: [
    { id: 'g1', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Gala empresarial', size: 'wide' },
    { id: 'g2', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'DecoraciÃ³n corporativa' },
    { id: 'g3', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Catering ejecutivo' },
    { id: 'g4', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Team building' },
    { id: 'g5', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'SalÃ³n preparado', size: 'wide' },
    { id: 'g6', src: '/media/salon-discoteca-ak-01.jpeg', alt: 'Entrega de reconocimientos' },
  ],
  whyUs: sharedWhyUs,
  process: sharedProcess,
  whatsappNumber: '59899123456',
  whatsappMessage:
    'Â¡Hola AK Producciones! Quiero cotizar un EVENTO CORPORATIVO para mi empresa. Me gustarÃ­a recibir una propuesta.',
};

export default corporativosData;
