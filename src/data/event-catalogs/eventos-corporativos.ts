import type { EventCatalog } from '@/types/public-landing';

export const eventosCorporativosCatalog: EventCatalog = {
  id: 'eventos-corporativos',
  slug: 'eventos-corporativos',
  title: 'Eventos Corporativos',
  subtitle: 'Profesionalismo en Cada Detalle',
  description:
    'Organizamos eventos corporativos que reflejan la imagen de tu empresa. Lanzamientos, cenas de fin de año, teambuilding y más.',
  heroImageUrl:
    'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1920&q=85&auto=format&fit=crop',
  heroImageHint: 'corporate event conference',
  emoji: '🏢',
  accentColor: 'bg-blue-600',
  whatsappMessage: '¡Hola AK Producciones! Me gustaría cotizar un Evento Corporativo.',
  packages: [
    {
      id: 'corp-reunion',
      name: 'Reunión Empresarial',
      description: 'Espacio y logística para reuniones y presentaciones profesionales.',
      includes: [
        'Sala configurada para hasta 50 personas',
        'Coffee break y catering ligero',
        'Equipamiento audiovisual',
        'Coordinador logístico',
      ],
      imageUrl:
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80&auto=format&fit=crop',
      imageHint: 'business meeting professional',
    },
    {
      id: 'corp-gala',
      name: 'Cena o Gala Empresarial',
      description: 'Una cena o gala de empresa que impresiona a clientes y equipo.',
      includes: [
        'Salón decorado para hasta 150 personas',
        'Catering de gala con menú de 3 tiempos',
        'Animación y entretenimiento',
        'Producción audiovisual',
        'Coordinador full-day',
      ],
      imageUrl:
        'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&q=80&auto=format&fit=crop',
      imageHint: 'corporate gala dinner',
      popular: true,
    },
  ],
};
