import type { InvitacionDigitalData } from '@/types/fiesta';
import { defaultInvitacionDigitalData } from '@/lib/invitacion-digital-defaults';
import type { InvitacionDigitalTemplate } from '@/app/actions/invitacion-digital-templates';

// ─────────────────────────────────────────────────────────────────────────────
// BODAS
// ─────────────────────────────────────────────────────────────────────────────

/** 1. 🌹 Rosa Eterna — Romántico clásico. Paleta: rosa pálido + oro + blanco crema. */
export const tplBodaRosaEterna: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl_boda_rosa',
  name: '🌹 Rosa Eterna',
  category: 'Boda',
  plantilla: 'Grazia',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Valentina',
    protagonista2: 'Matías',
    imagenFondoUrl: 'https://picsum.photos/seed/roses1200/1200/1800',
    subtitulo: {
      text: 'con todo nuestro amor los invitamos a celebrar',
      style: { fontFamily: 'Playfair_Display', fontSize: '1.25rem', color: '#5C4033' },
    },
    paletaColores: {
      primary: '#C8A2A2',
      secondary: '#D4AF37',
      accent: '#F9F5F0',
    },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/roses1200/1200/800',
    titulo: {
      text: 'Nos Casamos',
      style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#C8A2A2' },
    },
    texto: {
      text: '✨ Con todo nuestro amor, los invitamos a compartir este momento tan especial ✨',
      style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#5C4033' },
    },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: {
      text: 'Nuestra Historia',
      style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#C8A2A2' },
    },
    texto: {
      text: 'Desde el primer momento supimos que nuestros caminos estaban destinados a cruzarse. Hoy los invitamos a ser parte de un día lleno de amor, rosas y recuerdos eternos.',
      style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#5C4033' },
    },
    imagenFondoUrl: 'https://picsum.photos/seed/roses1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: {
    ...defaultInvitacionDigitalData.detallesEvento,
    ceremoniaReligiosa: {
      ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa,
      visible: true,
      titulo: 'Ceremonia Religiosa',
    },
    celebracion: {
      ...defaultInvitacionDigitalData.detallesEvento.celebracion,
      visible: true,
      titulo: 'Recepción y Fiesta',
    },
  },
  despedida: { visible: true },
  footer: {
    ...defaultInvitacionDigitalData.footer,
    titulo: { text: 'Con amor, Valentina y Matías', style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#5C4033' } },
    nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#D4AF37' } },
  },
};

/** 2. 🌿 Mística Boho — Bohemio natural. Paleta: terracota + verde salvia + beige. */
export const tplBodaBohoMistica: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl_boda_boho',
  name: '🌿 Mística Boho',
  category: 'Boda',
  plantilla: 'Allegria',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Sofía',
    protagonista2: 'Nicolás',
    imagenFondoUrl: 'https://picsum.photos/seed/boho1200/1200/1800',
    subtitulo: {
      text: 'se unen en una celebración llena de naturaleza y amor',
      style: { fontFamily: 'Dancing_Script', fontSize: '1.5rem', color: '#3D2B1F' },
    },
    paletaColores: {
      primary: '#C97B5A',
      secondary: '#7D9B76',
      accent: '#E8DCC8',
    },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/boho1200/1200/800',
    titulo: {
      text: '¡Nos Casamos!',
      style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#C97B5A' },
    },
    texto: {
      text: '🌿 El amor no sigue un camino recto, sino el más hermoso 🌿',
      style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#3D2B1F' },
    },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: {
      text: 'Nuestra Historia',
      style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#C97B5A' },
    },
    texto: {
      text: 'Nos encontramos en el camino menos esperado y supimos que juntos formaríamos algo único. Una historia de amor salvaje, libre y llena de vida.',
      style: { fontFamily: 'Dancing_Script', fontSize: '1rem', color: '#3D2B1F' },
    },
    imagenFondoUrl: 'https://picsum.photos/seed/boho1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: {
    ...defaultInvitacionDigitalData.detallesEvento,
    ceremoniaReligiosa: {
      ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa,
      visible: true,
      titulo: 'Ceremonia',
    },
    celebracion: {
      ...defaultInvitacionDigitalData.detallesEvento.celebracion,
      visible: true,
      titulo: 'Celebración Boho',
    },
  },
  despedida: { visible: true },
  footer: {
    ...defaultInvitacionDigitalData.footer,
    titulo: { text: 'Con amor, Sofía y Nicolás', style: { fontFamily: 'Dancing_Script', fontSize: '1.2rem', color: '#3D2B1F' } },
    nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#7D9B76' } },
  },
};

/** 3. 🖤 Elegancia Moderna — Minimalista elegante. Paleta: negro + plata + blanco. */
export const tplBodaEleganciaModerna: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl_boda_moderna',
  name: '🖤 Elegancia Moderna',
  category: 'Boda',
  plantilla: 'Grazia',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Isabella',
    protagonista2: 'Sebastián',
    imagenFondoUrl: 'https://picsum.photos/seed/modern1200/1200/1800',
    subtitulo: {
      text: 'Un amor que trasciende el tiempo',
      style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#1A1A2E' },
    },
    paletaColores: {
      primary: '#1A1A2E',
      secondary: '#C0C0C0',
      accent: '#FFFFFF',
    },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/modern1200/1200/800',
    titulo: {
      text: 'Nuestra Boda',
      style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#1A1A2E' },
    },
    texto: {
      text: 'La elegancia no es ser notado, es ser recordado. Los invitamos a compartir un evento que quedará grabado en el tiempo.',
      style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#1A1A2E' },
    },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: {
      text: 'Nuestra Historia',
      style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#1A1A2E' },
    },
    texto: {
      text: 'Dos almas que encontraron en la elegancia y la complicidad la base perfecta para construir una vida juntos. Hoy celebramos ese amor que trasciende.',
      style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#1A1A2E' },
    },
    imagenFondoUrl: 'https://picsum.photos/seed/modern1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: {
    ...defaultInvitacionDigitalData.detallesEvento,
    ceremoniaReligiosa: {
      ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa,
      visible: true,
      titulo: 'Ceremonia',
    },
    celebracion: {
      ...defaultInvitacionDigitalData.detallesEvento.celebracion,
      visible: true,
      titulo: 'Cena y Celebración',
    },
  },
  despedida: { visible: true },
  footer: {
    ...defaultInvitacionDigitalData.footer,
    titulo: { text: 'Con elegancia, Isabella y Sebastián', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#1A1A2E' } },
    nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#C0C0C0' } },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// XV AÑOS
// ─────────────────────────────────────────────────────────────────────────────

/** 4. 👑 Princesa Dorada — Estilo princesa clásica. Paleta: dorado + rosa chicle + blanco. */
export const tplXvPrincesaDorada: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl_xv_princesa',
  name: '👑 Princesa Dorada',
  category: 'XV Años',
  plantilla: 'Grazia',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Luciana',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/princess1200/1200/1800',
    subtitulo: {
      text: 'cumple sus XV años',
      style: { fontFamily: 'Dancing_Script', fontSize: '1.5rem', color: '#8B6914' },
    },
    paletaColores: {
      primary: '#D4AF37',
      secondary: '#FF9EC4',
      accent: '#FFFAF0',
    },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/princess1200/1200/800',
    titulo: {
      text: '¡Mis XV Años!',
      style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#D4AF37' },
    },
    texto: {
      text: '👑 Una noche de magia, elegancia y amor para celebrar tu llegada a la vida ✨',
      style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#8B6914' },
    },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: {
      text: 'Mi Historia',
      style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#D4AF37' },
    },
    texto: {
      text: 'Quince años de sueños, risas y aventuras. Hoy celebro con todo mi amor a mi familia y amigos que han sido parte de cada uno de mis momentos especiales.',
      style: { fontFamily: 'Dancing_Script', fontSize: '1rem', color: '#8B6914' },
    },
    imagenFondoUrl: 'https://picsum.photos/seed/princess1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: {
    ...defaultInvitacionDigitalData.detallesEvento,
    ceremoniaReligiosa: {
      ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa,
      visible: true,
      titulo: 'Misa de XV',
    },
    celebracion: {
      ...defaultInvitacionDigitalData.detallesEvento.celebracion,
      visible: true,
      titulo: 'Fiesta de XV',
    },
  },
  redesSociales: {
    ...defaultInvitacionDigitalData.redesSociales,
    hashtag: '#XV_Luciana',
    texto: { text: '¡Comparte mis XV!', style: { fontFamily: 'Dancing_Script', fontSize: '2rem', color: '#D4AF37' } },
  },
  despedida: { visible: true },
  footer: {
    ...defaultInvitacionDigitalData.footer,
    titulo: { text: 'Con amor, Luciana y familia', style: { fontFamily: 'Dancing_Script', fontSize: '1.2rem', color: '#8B6914' } },
    nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#D4AF37' } },
  },
};

/** 5. 💜 Arco Iris Neon — Vibrante y juvenil. Paleta: fucsia + violeta + celeste. */
export const tplXvNeonVibrante: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl_xv_neon',
  name: '💜 Arco Iris Neon',
  category: 'XV Años',
  plantilla: 'Allegria',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Valentina',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/neon1200/1200/1800',
    subtitulo: {
      text: 'sus XV años de pura energía y color',
      style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#2C0E37' },
    },
    paletaColores: {
      primary: '#9B59B6',
      secondary: '#E91E8C',
      accent: '#00BCD4',
    },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/neon1200/1200/800',
    titulo: {
      text: '¡Mis XV!',
      style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#9B59B6' },
    },
    texto: {
      text: '💜 ¡Ven a bailar, reír y celebrar esta noche increíble! 🎉',
      style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#2C0E37' },
    },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: {
      text: 'Mi Camino',
      style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#9B59B6' },
    },
    texto: {
      text: 'Quince años llenos de colores, música y alegría. ¡Y esto es solo el comienzo de una historia vibrante que quiero compartir con todos ustedes!',
      style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#2C0E37' },
    },
    imagenFondoUrl: 'https://picsum.photos/seed/neon1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: {
    ...defaultInvitacionDigitalData.detallesEvento,
    ceremoniaReligiosa: {
      ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa,
      visible: true,
      titulo: 'Misa de XV',
    },
    celebracion: {
      ...defaultInvitacionDigitalData.detallesEvento.celebracion,
      visible: true,
      titulo: '¡La Fiesta!',
    },
  },
  redesSociales: {
    ...defaultInvitacionDigitalData.redesSociales,
    hashtag: '#XV_Valentina',
    texto: { text: '¡Etiquétame en tus fotos!', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#9B59B6' } },
  },
  despedida: { visible: true },
  footer: {
    ...defaultInvitacionDigitalData.footer,
    titulo: { text: 'Con energía, Valentina y familia', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#2C0E37' } },
    nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#9B59B6' } },
  },
};

/** 6. 🌸 Jardín de Sueños — Romántico jardín. Paleta: lila + verde menta + blanco. */
export const tplXvJardinDeSuenos: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl_xv_jardin',
  name: '🌸 Jardín de Sueños',
  category: 'XV Años',
  plantilla: 'Grazia',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Florencia',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/garden1200/1200/1800',
    subtitulo: {
      text: 'celebra sus XV años entre flores y sueños',
      style: { fontFamily: 'Dancing_Script', fontSize: '1.5rem', color: '#4A2C6E' },
    },
    paletaColores: {
      primary: '#9B7EC8',
      secondary: '#90EE90',
      accent: '#F0F8FF',
    },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/garden1200/1200/800',
    titulo: {
      text: 'Mis XV Años',
      style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#9B7EC8' },
    },
    texto: {
      text: '🌸 Como una flor que florece, así comienza la mejor etapa de tu vida 🦋',
      style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#4A2C6E' },
    },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: {
      text: 'Mi Jardín de Recuerdos',
      style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#9B7EC8' },
    },
    texto: {
      text: 'Como flores en un jardín, mis quince años han sido llenos de colores, fragancias y momentos únicos. Gracias por ser parte de este jardín de vida.',
      style: { fontFamily: 'Dancing_Script', fontSize: '1rem', color: '#4A2C6E' },
    },
    imagenFondoUrl: 'https://picsum.photos/seed/garden1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: {
    ...defaultInvitacionDigitalData.detallesEvento,
    ceremoniaReligiosa: {
      ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa,
      visible: true,
      titulo: 'Misa de XV',
    },
    celebracion: {
      ...defaultInvitacionDigitalData.detallesEvento.celebracion,
      visible: true,
      titulo: 'Fiesta en el Jardín',
    },
  },
  redesSociales: {
    ...defaultInvitacionDigitalData.redesSociales,
    hashtag: '#XV_Florencia',
    texto: { text: '¡Comparte este jardín de momentos!', style: { fontFamily: 'Dancing_Script', fontSize: '2rem', color: '#9B7EC8' } },
  },
  despedida: { visible: true },
  footer: {
    ...defaultInvitacionDigitalData.footer,
    titulo: { text: 'Con flores, Florencia y familia', style: { fontFamily: 'Dancing_Script', fontSize: '1.2rem', color: '#4A2C6E' } },
    nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#9B7EC8' } },
  },
};
