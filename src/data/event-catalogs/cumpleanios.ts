import type { EventCatalog } from '@/types/public-landing';

export const cumpleaniosCatalog: EventCatalog = {
  id: 'cumpleanios',
  slug: 'cumpleanios',
  title: 'Cumpleaños',
  subtitle: 'Cada Año Merece ser Celebrado',
  description:
    'Desde los primeros añitos hasta los cumpleaños más importantes de tu vida, organizamos fiestas únicas para cada edad y estilo.',
  heroImageUrl:
    'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=1920&q=85&auto=format&fit=crop',
  heroImageHint: 'birthday party celebration',
  emoji: '🎂',
  accentColor: 'bg-amber-500',
  whatsappMessage: '¡Hola AK Producciones! Me gustaría cotizar un Cumpleaños.',
  packages: [
    {
      id: 'cumple-infantil',
      name: 'Cumple Infantil',
      description: 'Magia y diversión para los más chiquitos.',
      includes: [
        'Decoración temática para hasta 60 personas',
        'Animación infantil y juegos',
        'Mesa dulce y torta personalizada',
        'Globos y sorpresas',
        'Coordinador del evento',
      ],
      imageUrl:
        'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80&auto=format&fit=crop',
      imageHint: 'children birthday party',
    },
    {
      id: 'cumple-adultos',
      name: 'Cumple Adultos',
      description: 'Una fiesta de adultos a tu medida, con todo el estilo.',
      includes: [
        'Salón decorado para hasta 100 personas',
        'Catering con menú variado',
        'DJ profesional + pista de baile',
        'Mesa de tragos y aperitivos',
        'Torta artesanal personalizada',
        'Coordinador del evento',
      ],
      imageUrl:
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80&auto=format&fit=crop',
      imageHint: 'adult birthday celebration',
      popular: true,
    },
  ],
};
