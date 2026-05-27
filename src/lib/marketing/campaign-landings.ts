import type { ServiceItem } from '@/components/landing/ServicesSection';

export interface CampaignLandingConfig {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  objective: string;
  hero: {
    headline: string;
    subheadline: string;
    backgroundImageUrl: string;
  };
  services: ServiceItem[];
  cta: {
    headline: string;
    subheadline: string;
    label: string;
  };
  whatsappMessage: string;
  audience: string;
}

const DEFAULT_FEATURES = [
  'Consulta directa por WhatsApp',
  'Presupuesto personalizado',
  'Produccion integral AK',
  'Tecnologia visible para cliente e invitados',
];

export const CAMPAIGN_LANDINGS: CampaignLandingConfig[] = [
  {
    slug: 'tecnologia-ak',
    title: 'Tecnologia para fiestas - AK Producciones',
    shortTitle: 'Tecnologia AK',
    description: 'Portal del cliente, invitacion web, QR, muro social, pantalla LED y experiencia digital para fiestas.',
    objective: 'Vender el diferencial tecnologico de AK antes del presupuesto.',
    audience: 'Clientes que ya comparan salones, servicios o paquetes de fiesta.',
    hero: {
      headline: 'Tecnologia AK\npara tu fiesta',
      subheadline: 'Portal del cliente, invitacion web, QR, muro social, pantalla LED y recuerdos digitales en una experiencia conectada.',
      backgroundImageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=85&auto=format&fit=crop',
    },
    services: [
      {
        id: 'tech-portal',
        title: 'Portal, QR y pantalla',
        subtitle: 'Experiencia conectada',
        description: 'El cliente y los invitados tienen accesos claros antes, durante y despues de la fiesta.',
        features: ['Portal del cliente', 'Invitacion web con QR', 'Muro social en vivo', 'Pantalla LED y modo presentacion'],
        imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1000&q=80&auto=format&fit=crop',
        imageHint: 'event screen lights',
        accentColor: 'bg-sky-600',
        emoji: 'AK',
        whatsappMessage: 'Hola AK Producciones, quiero conocer la tecnologia AK para mi fiesta.',
      },
    ],
    cta: {
      headline: 'Quiero una fiesta\ncon tecnologia',
      subheadline: 'Escribinos por WhatsApp y te mostramos que partes aplican a tu evento.',
      label: 'Consultar tecnologia',
    },
    whatsappMessage: 'Hola AK Producciones, vi la landing de Tecnologia AK y quiero consultarla para mi fiesta.',
  },
  {
    slug: 'xv-anos-tecnologia',
    title: 'XV anos con tecnologia - AK Producciones',
    shortTitle: 'XV con tecnologia',
    description: 'Una fiesta de XV con portal, invitacion digital, muro social, pantalla, fotocabina y recuerdos compartibles.',
    objective: 'Captar familias que buscan una fiesta de XV moderna y completa.',
    audience: 'Padres, madres y quinceaneras.',
    hero: {
      headline: 'XV anos\ncon experiencia digital',
      subheadline: 'Invitacion web, RSVP, muro social, pantalla, musica, fotos y momentos listos para compartir.',
      backgroundImageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1920&q=85&auto=format&fit=crop',
    },
    services: [
      {
        id: 'xv-tech',
        title: 'Fiesta XV interactiva',
        subtitle: 'Antes, durante y despues',
        description: 'La quinceanera y sus invitados participan desde el celular y ven la fiesta en pantalla.',
        features: ['Invitacion digital', 'Lista de musica', 'Muro social', 'Fotocabina y recuerdos'],
        imageUrl: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1000&q=80&auto=format&fit=crop',
        imageHint: 'teen party lights',
        accentColor: 'bg-fuchsia-600',
        emoji: 'XV',
        whatsappMessage: 'Hola AK Producciones, quiero una fiesta de XV con tecnologia e interaccion.',
      },
    ],
    cta: {
      headline: 'Hablemos de\nsus XV',
      subheadline: 'Te ayudamos a transformar la idea en una experiencia completa.',
      label: 'Cotizar XV',
    },
    whatsappMessage: 'Hola AK Producciones, vi la campana de XV anos con tecnologia y quiero cotizar.',
  },
  {
    slug: 'fotocabina-360',
    title: 'Fotocabina y plataforma 360 - AK Producciones',
    shortTitle: 'Fotocabina 360',
    description: 'Activaciones para fiestas: fotocabina, plataforma 360, espejo magico, QR y contenido compartible.',
    objective: 'Vender tecnologia puntual como entrada rapida a nuevos clientes.',
    audience: 'Clientes que quieren sumar entretenimiento a una fiesta ya encaminada.',
    hero: {
      headline: 'Fotocabina y 360\npara tu evento',
      subheadline: 'Contenido divertido, marca del evento, QR y recuerdos listos para compartir por WhatsApp y redes.',
      backgroundImageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1920&q=85&auto=format&fit=crop',
    },
    services: [
      {
        id: 'cabina-360',
        title: 'Contenido social para invitados',
        subtitle: 'Entretenimiento tecnologico',
        description: 'Ideal para sumar interaccion sin rehacer toda la organizacion del evento.',
        features: DEFAULT_FEATURES,
        imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1000&q=80&auto=format&fit=crop',
        imageHint: 'party photo booth',
        accentColor: 'bg-violet-600',
        emoji: '360',
        whatsappMessage: 'Hola AK Producciones, quiero consultar fotocabina o plataforma 360 para mi evento.',
      },
    ],
    cta: {
      headline: 'Sumar entretenimiento\nal evento',
      subheadline: 'Contanos fecha, lugar y cantidad de invitados para confirmar disponibilidad.',
      label: 'Consultar fecha',
    },
    whatsappMessage: 'Hola AK Producciones, vi la campana de fotocabina y 360. Quiero consultar disponibilidad.',
  },
  {
    slug: 'muro-social-eventos',
    title: 'Muro social para eventos - AK Producciones',
    shortTitle: 'Muro social',
    description: 'Fotos, mensajes, QR, pantalla y participacion de invitados en vivo durante el evento.',
    objective: 'Promocionar pantalla, QR y experiencia participativa en fiestas.',
    audience: 'Clientes que buscan una fiesta con invitados activos y contenido en vivo.',
    hero: {
      headline: 'Muro social\nen vivo',
      subheadline: 'Los invitados suben fotos y mensajes, AK modera el contenido y la fiesta lo ve en pantalla.',
      backgroundImageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1920&q=85&auto=format&fit=crop',
    },
    services: [
      {
        id: 'social-wall',
        title: 'Pantalla + QR + invitados',
        subtitle: 'Participacion en vivo',
        description: 'Una experiencia simple para que todos participen sin instalar apps.',
        features: ['QR para invitados', 'Fotos y mensajes', 'Moderacion AK', 'Pantalla en vivo'],
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&q=80&auto=format&fit=crop',
        imageHint: 'event audience screen',
        accentColor: 'bg-indigo-600',
        emoji: 'QR',
        whatsappMessage: 'Hola AK Producciones, quiero consultar el muro social para mi evento.',
      },
    ],
    cta: {
      headline: 'Que tus invitados\nparticipen mas',
      subheadline: 'Te mostramos como funciona el muro social y que necesita tu evento.',
      label: 'Consultar muro social',
    },
    whatsappMessage: 'Hola AK Producciones, vi la campana de muro social y quiero saber como funciona.',
  },
];

export const CAMPAIGN_LANDING_MAP = Object.fromEntries(
  CAMPAIGN_LANDINGS.map((campaign) => [campaign.slug, campaign])
) as Record<string, CampaignLandingConfig>;
