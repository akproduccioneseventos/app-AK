import type { EventCatalog } from '@/types/public-landing';

export const xvAnosCatalog: EventCatalog = {
  id: 'xv-anos',
  slug: 'xv-anos',
  title: 'XV Años',
  subtitle: 'Tu Noche de Princesa',
  description:
    'Celebramos tus quince años con la magia que mereces. Creamos una fiesta única, llena de emoción y recuerdos para toda la vida.',
  heroImageUrl:
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1920&q=85&auto=format&fit=crop',
  heroImageHint: 'quinceanera birthday party',
  emoji: '👑',
  accentColor: 'bg-pink-500',
  whatsappMessage: '¡Hola AK Producciones! Me gustaría cotizar una fiesta de XV Años.',
  packages: [
    {
      id: 'xv-esencial',
      name: 'Paquete Esencial',
      description: 'Una fiesta de 15 años soñada con el estilo que te representa.',
      includes: [
        'Salón decorado para hasta 80 personas',
        'Mesa de dulces y torta de cumpleaños',
        'DJ profesional + iluminación básica',
        'Invitaciones digitales con RSVP',
        'Coordinador el día del evento',
      ],
      imageUrl:
        'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&q=80&auto=format&fit=crop',
      imageHint: 'birthday celebration',
    },
    {
      id: 'xv-premium',
      name: 'Paquete Premium',
      description: 'La fiesta de 15 años que siempre soñaste, al nivel más alto.',
      includes: [
        'Salón decorado para hasta 120 personas',
        'Catering con menú completo',
        'DJ profesional + pista LED + efectos especiales',
        'Mesa dulce + torta artesanal personalizada',
        'Invitaciones digitales + portal de invitados',
        'Sesión de fotos de 15',
        'Coordinador full-day',
      ],
      imageUrl:
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80&auto=format&fit=crop',
      imageHint: 'quinceanera premium party',
      popular: true,
    },
    {
      id: 'xv-todo-incluido',
      name: 'Todo Incluido',
      description: 'El paquete de XV más completo: tu fiesta de ensueño sin límites.',
      includes: [
        'Salón decorado para hasta 180 personas',
        'Catering premium + barra de jugos',
        'DJ + show de luces, humo y fuegos artificiales',
        'Decoración temática personalizada',
        'Mesa dulce, candy bar y torta artesanal',
        'Invitaciones digitales + portal del cliente',
        'Foto + video profesional',
        'Vals de honor + coreografía',
        'Coordinador + equipo de apoyo',
      ],
      imageUrl:
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80&auto=format&fit=crop',
      imageHint: 'luxurious quinceanera celebration',
    },
  ],
};
