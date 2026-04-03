import type { EventCatalog } from '@/types/public-landing';

export const bodasCatalog: EventCatalog = {
  id: 'bodas',
  slug: 'bodas',
  title: 'Bodas',
  subtitle: 'El Día Más Especial de tu Vida',
  description:
    'Hacemos realidad la boda de tus sueños. Nos encargamos de cada detalle para que solo tengas que disfrutar y recordar cada momento.',
  heroImageUrl:
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=85&auto=format&fit=crop',
  heroImageHint: 'elegant wedding celebration',
  emoji: '💍',
  accentColor: 'bg-rose-500',
  whatsappMessage: '¡Hola AK Producciones! Me gustaría cotizar mi Boda.',
  packages: [
    {
      id: 'bodas-esencial',
      name: 'Paquete Esencial',
      description: 'Todo lo necesario para una boda íntima y elegante.',
      includes: [
        'Salón decorado para hasta 80 personas',
        'Catering con menú de 3 tiempos',
        'Música ambiental y pista de baile',
        'Mesa de torta y decoración floral',
        'Coordinador de evento el día del casamiento',
      ],
      imageUrl:
        'https://images.unsplash.com/photo-1510076857177-7470076d4098?w=800&q=80&auto=format&fit=crop',
      imageHint: 'intimate wedding dinner',
    },
    {
      id: 'bodas-premium',
      name: 'Paquete Premium',
      description: 'Una celebración completa con todos los detalles premium.',
      includes: [
        'Salón decorado para hasta 150 personas',
        'Catering gourmet con menú de 4 tiempos',
        'DJ profesional + iluminación LED',
        'Decoración floral premium y mesa dulce',
        'Invitaciones digitales + RSVP online',
        'Cobertura fotográfica básica',
        'Coordinador full-day',
      ],
      imageUrl:
        'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80&auto=format&fit=crop',
      imageHint: 'premium wedding venue',
      popular: true,
    },
    {
      id: 'bodas-todo-incluido',
      name: 'Todo Incluido',
      description: 'La experiencia de boda más completa y sin preocupaciones.',
      includes: [
        'Salón decorado para hasta 200 personas',
        'Catering gourmet + barra libre',
        'DJ profesional + banda en vivo + iluminación',
        'Decoración y ambientación full premium',
        'Invitaciones digitales + portal del cliente',
        'Cobertura fotográfica y video',
        'Mesa dulce, candy bar y torta artesanal',
        'Coordinador + asistentes',
        'Transporte de novios',
      ],
      imageUrl:
        'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80&auto=format&fit=crop',
      imageHint: 'luxurious wedding all inclusive',
    },
  ],
};
