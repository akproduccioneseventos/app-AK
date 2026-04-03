import type { EventCatalog } from '@/types/public-landing';

export const fiestasTematicosCatalog: EventCatalog = {
  id: 'fiestas-tematicas',
  slug: 'fiestas-tematicas',
  title: 'Fiestas Temáticas',
  subtitle: 'Transforma tu Celebración en una Experiencia',
  description:
    'Creamos mundos únicos para tu fiesta. Desde carnavales y mardi gras hasta noches de Hollywood, galácticas o de época.',
  heroImageUrl:
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=85&auto=format&fit=crop',
  heroImageHint: 'themed party celebration',
  emoji: '🎭',
  accentColor: 'bg-violet-600',
  whatsappMessage: '¡Hola AK Producciones! Me gustaría cotizar una Fiesta Temática.',
  packages: [
    {
      id: 'tematica-standard',
      name: 'Temática Standard',
      description: 'Decoración y ambientación completa para tu tema elegido.',
      includes: [
        'Decoración temática completa para hasta 80 personas',
        'Props y elementos de decoración',
        'Música temática curada',
        'Coordinador del evento',
      ],
      imageUrl:
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80&auto=format&fit=crop',
      imageHint: 'themed decoration party',
    },
    {
      id: 'tematica-premium',
      name: 'Temática Premium',
      description: 'Una inmersión total en el mundo de tu tema favorito.',
      includes: [
        'Decoración y escenografía premium para hasta 130 personas',
        'Catering temático personalizado',
        'Animación en personaje + shows',
        'Iluminación especial y efectos',
        'Fotografía temática en booth',
        'Coordinador full-day',
      ],
      imageUrl:
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80&auto=format&fit=crop',
      imageHint: 'premium themed party experience',
      popular: true,
    },
  ],
};
