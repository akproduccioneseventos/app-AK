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
  regalos: {
    ...defaultInvitacionDigitalData.regalos,
    titulo: { text: 'Mesa de Regalos', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#D4AF37' } },
    texto: { text: 'Tu presencia es el mejor regalo. Si querés hacerme un obsequio, podés consultarme o usar los datos de abajo 💛', style: { fontFamily: 'Dancing_Script', fontSize: '1rem', color: '#8B6914' } },
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
  regalos: {
    ...defaultInvitacionDigitalData.regalos,
    titulo: { text: 'Mesa de Regalos', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#9B59B6' } },
    texto: { text: '¡Tu presencia ya es el mejor regalo! Si querés regalarme algo, podés hacerlo con los datos de abajo 💜', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#2C0E37' } },
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
  regalos: {
    ...defaultInvitacionDigitalData.regalos,
    titulo: { text: 'Mesa de Regalos', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#9B7EC8' } },
    texto: { text: '🌸 Tu presencia es el regalo más especial. Si querés hacerme un obsequio, con los datos de abajo podés coordinarlo 🦋', style: { fontFamily: 'Dancing_Script', fontSize: '1rem', color: '#4A2C6E' } },
  },
  despedida: { visible: true },
  footer: {
    ...defaultInvitacionDigitalData.footer,
    titulo: { text: 'Con flores, Florencia y familia', style: { fontFamily: 'Dancing_Script', fontSize: '1.2rem', color: '#4A2C6E' } },
    nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#9B7EC8' } },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CUMPLEAÑOS
// ─────────────────────────────────────────────────────────────────────────────

/** 7. 🎂 Fiesta de Cumpleaños — Alegre y colorida. Paleta: amarillo + naranja + turquesa. */
export const tplCumpleFiesta: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl_cumple_fiesta',
  name: '🎂 Fiesta de Cumpleaños',
  category: 'Cumpleaños',
  plantilla: 'Allegria',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Martín',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/birthday1200/1200/1800',
    subtitulo: {
      text: '¡celebra su cumpleaños y te invita a ser parte!',
      style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#7A3E00' },
    },
    paletaColores: {
      primary: '#F59E0B',
      secondary: '#F97316',
      accent: '#06B6D4',
    },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/birthday1200/1200/800',
    titulo: {
      text: '¡A Celebrar!',
      style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#F59E0B' },
    },
    texto: {
      text: '🎉 ¡Un año más y hay que festejarlo con todo! Venite a pasarla increíble con nosotros en una noche llena de música, baile y buenos momentos 🎊',
      style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#7A3E00' },
    },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: {
      text: 'Mi Historia',
      style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#F59E0B' },
    },
    texto: {
      text: 'Cada año trae nuevas aventuras, nuevos amigos y nuevos recuerdos. Este cumpleaños es una excusa perfecta para reunir a todos los que hacen mi vida más alegre y colorida.',
      style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#7A3E00' },
    },
    imagenFondoUrl: 'https://picsum.photos/seed/birthday1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: {
    ...defaultInvitacionDigitalData.detallesEvento,
    ceremoniaReligiosa: {
      ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa,
      visible: false,
    },
    celebracion: {
      ...defaultInvitacionDigitalData.detallesEvento.celebracion,
      visible: true,
      titulo: '¡La Fiesta!',
    },
  },
  regalos: {
    ...defaultInvitacionDigitalData.regalos,
    titulo: { text: 'Mesa de Regalos', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#F59E0B' } },
    texto: { text: '🎁 ¡Tu presencia ya es un regalo! Si igualmente querés hacerme un obsequio, podés usar los datos de abajo 🎉', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#7A3E00' } },
  },
  redesSociales: {
    ...defaultInvitacionDigitalData.redesSociales,
    hashtag: '#CumpleMartin',
    texto: { text: '¡Etiquétame en tus fotos!', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#F59E0B' } },
  },
  despedida: { visible: true },
  footer: {
    ...defaultInvitacionDigitalData.footer,
    titulo: { text: 'Con alegría, Martín y familia 🎂', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#7A3E00' } },
    nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#F59E0B' } },
  },
};

/** 8. 🌟 Cumpleaños Elegante — Sofisticado. Paleta: negro + dorado + champagne. */
export const tplCumpleElegante: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl_cumple_elegante',
  name: '🌟 Cumpleaños Elegante',
  category: 'Cumpleaños',
  plantilla: 'Grazia',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Carolina',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/elegantbday/1200/1800',
    subtitulo: {
      text: 'te invita a celebrar un año más lleno de elegancia y alegría',
      style: { fontFamily: 'Playfair_Display', fontSize: '1.2rem', color: '#C6A84B' },
    },
    paletaColores: {
      primary: '#C6A84B',
      secondary: '#1A1A1A',
      accent: '#F5EDD6',
    },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/elegantbday/1200/800',
    titulo: {
      text: '¡Celebremos Juntos!',
      style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#C6A84B' },
    },
    texto: {
      text: '✨ Una velada especial para celebrar la vida y los momentos que nos unen. Tu presencia hará esta noche inolvidable.',
      style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#4A3700' },
    },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: {
      text: 'Mi Historia',
      style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#C6A84B' },
    },
    texto: {
      text: 'Con cada año que pasa, la vida se vuelve más rica en experiencias y personas valiosas. Quiero celebrar este nuevo capítulo rodeada de quienes amo.',
      style: { fontFamily: 'Dancing_Script', fontSize: '1rem', color: '#4A3700' },
    },
    imagenFondoUrl: 'https://picsum.photos/seed/elegantbday/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: {
    ...defaultInvitacionDigitalData.detallesEvento,
    ceremoniaReligiosa: {
      ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa,
      visible: false,
    },
    celebracion: {
      ...defaultInvitacionDigitalData.detallesEvento.celebracion,
      visible: true,
      titulo: 'La Celebración',
    },
  },
  regalos: {
    ...defaultInvitacionDigitalData.regalos,
    titulo: { text: 'Mesa de Regalos', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#C6A84B' } },
    texto: { text: 'Tu presencia es el mejor obsequio. Si aun así querés regalarme algo, podés encontrar opciones abajo 🌟', style: { fontFamily: 'Dancing_Script', fontSize: '1rem', color: '#4A3700' } },
  },
  redesSociales: {
    ...defaultInvitacionDigitalData.redesSociales,
    hashtag: '#CumpleCarolina',
    texto: { text: '¡Comparte la noche!', style: { fontFamily: 'Dancing_Script', fontSize: '2rem', color: '#C6A84B' } },
  },
  despedida: { visible: true },
  footer: {
    ...defaultInvitacionDigitalData.footer,
    titulo: { text: 'Con cariño, Carolina y familia ✨', style: { fontFamily: 'Dancing_Script', fontSize: '1.2rem', color: '#4A3700' } },
    nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#C6A84B' } },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERAL
// ─────────────────────────────────────────────────────────────────────────────

/** 9. 🎊 Evento General — Versátil y neutro. Paleta: violeta suave + gris + blanco. */
export const tplEventoGeneral: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl_evento_general',
  name: '🎊 Evento General',
  category: 'General',
  plantilla: 'Allegria',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Nuestro Evento',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/generalevent/1200/1800',
    subtitulo: {
      text: 'te invitamos a ser parte de algo especial',
      style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#5B4E7E' },
    },
    paletaColores: {
      primary: '#7C6FA0',
      secondary: '#C4B8E0',
      accent: '#F8F6FF',
    },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/generalevent/1200/800',
    titulo: {
      text: '¡Te Esperamos!',
      style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#7C6FA0' },
    },
    texto: {
      text: '🎊 Estamos emocionados de compartir este momento especial con vos. Será una noche para recordar, llena de alegría y buenos momentos.',
      style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#3D3260' },
    },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: {
      text: 'Nuestro Evento',
      style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#7C6FA0' },
    },
    texto: {
      text: 'Cada evento es una oportunidad de crear recuerdos únicos. Este es nuestro espacio para reunirnos, celebrar y disfrutar juntos.',
      style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#3D3260' },
    },
    imagenFondoUrl: 'https://picsum.photos/seed/generalevent/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: {
    ...defaultInvitacionDigitalData.detallesEvento,
    ceremoniaReligiosa: {
      ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa,
      visible: false,
    },
    celebracion: {
      ...defaultInvitacionDigitalData.detallesEvento.celebracion,
      visible: true,
      titulo: 'El Evento',
    },
  },
  regalos: {
    ...defaultInvitacionDigitalData.regalos,
    titulo: { text: 'Información Adicional', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#7C6FA0' } },
    texto: { text: 'Si tenés alguna consulta adicional, no dudes en contactarnos. ¡Gracias por ser parte de este evento!', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#3D3260' } },
  },
  redesSociales: {
    ...defaultInvitacionDigitalData.redesSociales,
    hashtag: '#NuestroEvento',
    texto: { text: '¡Compartí el evento!', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#7C6FA0' } },
  },
  despedida: { visible: true },
  footer: {
    ...defaultInvitacionDigitalData.footer,
    titulo: { text: 'Con alegría, el equipo organizador 🎊', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#3D3260' } },
    nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#7C6FA0' } },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ADULTOS / 50 AÑOS
// ─────────────────────────────────────────────────────────────────────────────

/** 10. 🎩 Gatsby Dorado — Elegante Art Déco. Paleta: negro + dorado + champagne. */
export const tplAdultos50Gatsby: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl_adultos_gatsby',
  name: '🎩 Gatsby Dorado',
  category: 'Cumpleaños',
  plantilla: 'Grazia',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Roberto',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/gatsby1200/1200/1800',
    subtitulo: {
      text: 'celebra sus 50 años y te invita a una noche extraordinaria',
      style: { fontFamily: 'Playfair_Display', fontSize: '1.2rem', color: '#C6A84B' },
    },
    paletaColores: {
      primary: '#C6A84B',
      secondary: '#1A1A1A',
      accent: '#F5EDD6',
    },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/gatsby1200/1200/800',
    titulo: {
      text: '50 Años de Gran Historia',
      style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#C6A84B' },
    },
    texto: {
      text: '✨ Medio siglo de vida, de amor y de momentos que valen oro. Esta noche, el lujo y la elegancia se unen para celebrar una vida plena y extraordinaria.',
      style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#1A1A1A' },
    },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: {
      text: 'Cinco Décadas de Vida',
      style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#C6A84B' },
    },
    texto: {
      text: 'Cincuenta años construyendo sueños, formando una familia y dejando huella en cada persona que tuvo el privilegio de conocerte. Esta noche es un brindis a todo lo vivido y a lo que aún está por venir.',
      style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#1A1A1A' },
    },
    imagenFondoUrl: 'https://picsum.photos/seed/gatsby1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: {
    ...defaultInvitacionDigitalData.detallesEvento,
    ceremoniaReligiosa: {
      ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa,
      visible: false,
    },
    celebracion: {
      ...defaultInvitacionDigitalData.detallesEvento.celebracion,
      visible: true,
      titulo: 'La Gran Velada',
    },
  },
  regalos: {
    ...defaultInvitacionDigitalData.regalos,
    titulo: { text: 'Lista de Regalos', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#C6A84B' } },
    texto: { text: '🥂 Tu presencia ya es el mejor obsequio. Si deseás hacerle un regalo, encontrarás opciones a continuación.', style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#1A1A1A' } },
  },
  redesSociales: {
    ...defaultInvitacionDigitalData.redesSociales,
    hashtag: '#50AnosRoberto',
    texto: { text: '¡Compartí esta noche dorada!', style: { fontFamily: 'Playfair_Display', fontSize: '2rem', color: '#C6A84B' } },
  },
  despedida: { visible: true },
  footer: {
    ...defaultInvitacionDigitalData.footer,
    titulo: { text: 'Con cariño, Roberto y familia 🥂', style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#1A1A1A' } },
    nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#C6A84B' } },
  },
};

/** 11. 🪩 Retro Disco — Vibrante y festivo. Paleta: fucsia + turquesa neón + amarillo. */
export const tplAdultos50Retro: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl_adultos_retro',
  name: '🪩 Retro Disco',
  category: 'Cumpleaños',
  plantilla: 'Allegria',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Graciela',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/disco1200/1200/1800',
    subtitulo: {
      text: '¡50 años y con más energía que nunca!',
      style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#FF1493' },
    },
    paletaColores: {
      primary: '#FF1493',
      secondary: '#00E5FF',
      accent: '#FFE600',
    },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/disco1200/1200/800',
    titulo: {
      text: '¡A Bailar los 50!',
      style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#FF1493' },
    },
    texto: {
      text: '🕺 ¡La pista de baile está caliente y los años no se notan! Esta noche nos vamos a reír, bailar y celebrar como nunca. ¡No podés faltar! 💃',
      style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#1A0033' },
    },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: {
      text: '50 Años de Locura Sana',
      style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#FF1493' },
    },
    texto: {
      text: 'Medio siglo de baile, de risas y de vivir con toda la energía del mundo. Graciela no celebra años, ¡celebra décadas de ser la más divertida del grupo!',
      style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#1A0033' },
    },
    imagenFondoUrl: 'https://picsum.photos/seed/disco1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: {
    ...defaultInvitacionDigitalData.detallesEvento,
    ceremoniaReligiosa: {
      ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa,
      visible: false,
    },
    celebracion: {
      ...defaultInvitacionDigitalData.detallesEvento.celebracion,
      visible: true,
      titulo: '¡La Disco de los 50!',
    },
  },
  regalos: {
    ...defaultInvitacionDigitalData.regalos,
    titulo: { text: 'Mesa de Regalos', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#FF1493' } },
    texto: { text: '🎁 ¡Con que vengas a bailar ya es suficiente! Pero si insistís con el regalo, acá van los datos 😄', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#1A0033' } },
  },
  redesSociales: {
    ...defaultInvitacionDigitalData.redesSociales,
    hashtag: '#Graciela50Disco',
    texto: { text: '¡Subí tus mejores fotos!', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#FF1493' } },
  },
  despedida: { visible: true },
  footer: {
    ...defaultInvitacionDigitalData.footer,
    titulo: { text: 'Con todo el amor, Graciela 🕺', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#1A0033' } },
    nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#FF1493' } },
  },
};

/** 12. 🥂 Clásico Minimal — Limpio y formal. Paleta: blanco + gris pizarra + plata. */
export const tplAdultos50Minimal: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl_adultos_minimal',
  name: '🥂 Clásico Minimal',
  category: 'Cumpleaños',
  plantilla: 'Grazia',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Elena',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/minimal50/1200/1800',
    subtitulo: {
      text: 'te invita a celebrar sus cincuenta años',
      style: { fontFamily: 'Belleza', fontSize: '1.2rem', color: '#64748B' },
    },
    paletaColores: {
      primary: '#64748B',
      secondary: '#94A3B8',
      accent: '#F8FAFC',
    },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/minimal50/1200/800',
    titulo: {
      text: 'Cincuenta',
      style: { fontFamily: 'Playfair_Display', fontSize: '3rem', color: '#334155' },
    },
    texto: {
      text: 'Una celebración íntima y elegante para honrar este momento especial. Tu presencia es lo que hace que esta noche sea verdaderamente memorable.',
      style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#475569' },
    },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: {
      text: 'Mi Historia',
      style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#334155' },
    },
    texto: {
      text: 'Cincuenta años de aprender, crecer y disfrutar cada capítulo de la vida. Hoy quiero compartir este momento especial con las personas más importantes de mi camino.',
      style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#475569' },
    },
    imagenFondoUrl: 'https://picsum.photos/seed/minimal50/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: {
    ...defaultInvitacionDigitalData.detallesEvento,
    ceremoniaReligiosa: {
      ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa,
      visible: false,
    },
    celebracion: {
      ...defaultInvitacionDigitalData.detallesEvento.celebracion,
      visible: true,
      titulo: 'La Celebración',
    },
  },
  regalos: {
    ...defaultInvitacionDigitalData.regalos,
    titulo: { text: 'Regalos', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#334155' } },
    texto: { text: 'Tu presencia es mi regalo más valioso. Si deseas obsequiarme algo, encontrarás los datos a continuación.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#475569' } },
  },
  redesSociales: {
    ...defaultInvitacionDigitalData.redesSociales,
    hashtag: '#Elena50',
    texto: { text: 'Compartí este momento', style: { fontFamily: 'Playfair_Display', fontSize: '2rem', color: '#334155' } },
  },
  despedida: { visible: true },
  footer: {
    ...defaultInvitacionDigitalData.footer,
    titulo: { text: 'Con cariño, Elena', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#475569' } },
    nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#64748B' } },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// INFANTILES
// ─────────────────────────────────────────────────────────────────────────────

/** 13. 🦁 Safari Aventurero — Selva y animales. Paleta: verde selva + marrón + beige cálido. */
export const tplInfantilSafari: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl_infantil_safari',
  name: '🦁 Safari Aventurero',
  category: 'Infantil',
  plantilla: 'Allegria',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Tomás',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/safari1200/1200/1800',
    subtitulo: {
      text: '¡cumple 5 años y te invita a una gran aventura!',
      style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#5C4218' },
    },
    paletaColores: {
      primary: '#2D6A4F',
      secondary: '#8B5E3C',
      accent: '#F4E3C1',
    },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/safari1200/1200/800',
    titulo: {
      text: '¡La Aventura Comienza!',
      style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#2D6A4F' },
    },
    texto: {
      text: '🦁 Los animales de la selva están listos para la gran celebración. ¡Prepará tu mochila exploradora y venite a vivir la aventura más épica del año! 🌿🐘',
      style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#5C4218' },
    },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: {
      text: 'El Pequeño Explorador',
      style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#2D6A4F' },
    },
    texto: {
      text: 'Desde que abrió los ojos al mundo, Tomás no paró de explorar, descubrir y sorprender. Hoy cumple 5 años y quiere celebrarlo rodeado de sus mejores amigos aventureros.',
      style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#5C4218' },
    },
    imagenFondoUrl: 'https://picsum.photos/seed/safari1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: {
    ...defaultInvitacionDigitalData.detallesEvento,
    ceremoniaReligiosa: {
      ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa,
      visible: false,
    },
    celebracion: {
      ...defaultInvitacionDigitalData.detallesEvento.celebracion,
      visible: true,
      titulo: '¡Campamento Safari!',
    },
  },
  regalos: {
    ...defaultInvitacionDigitalData.regalos,
    titulo: { text: 'Lista de Regalos', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#2D6A4F' } },
    texto: { text: '🎁 ¡Con tu visita ya es suficiente aventura! Si querés traerle un regalo al explorador, acá encontrás los datos.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#5C4218' } },
  },
  redesSociales: {
    ...defaultInvitacionDigitalData.redesSociales,
    hashtag: '#SafariDeTomas',
    texto: { text: '¡Compartí la aventura!', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#2D6A4F' } },
  },
  despedida: { visible: true },
  footer: {
    ...defaultInvitacionDigitalData.footer,
    titulo: { text: 'Con amor, la familia de Tomás 🦁', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#5C4218' } },
    nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#2D6A4F' } },
  },
};

/** 14. 🚀 Explorador Espacial — Ciencia ficción. Paleta: azul profundo + índigo + estrellas. */
export const tplInfantilEspacio: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl_infantil_espacio',
  name: '🚀 Explorador Espacial',
  category: 'Infantil',
  plantilla: 'Allegria',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Valentín',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/space1200/1200/1800',
    subtitulo: {
      text: '¡cumple 6 años y parte en una misión intergaláctica!',
      style: { fontFamily: 'Belleza', fontSize: '1.2rem', color: '#A5B4FC' },
    },
    paletaColores: {
      primary: '#4F46E5',
      secondary: '#1E1B4B',
      accent: '#E0E7FF',
    },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/space1200/1200/800',
    titulo: {
      text: '¡Despegue en 3, 2, 1!',
      style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#818CF8' },
    },
    texto: {
      text: '🚀 La NASA no tiene la misión más épica del año, ¡la tiene Valentín! Astronautas de todas las galaxias están invitados a esta celebración intergaláctica. ⭐🌌',
      style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#C7D2FE' },
    },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: {
      text: 'El Pequeño Astronauta',
      style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#818CF8' },
    },
    texto: {
      text: 'Desde su primer año de vida, Valentín miró las estrellas con la misma emoción con la que hoy cumple 6 años. Un niño que sueña en grande, ama los planetas y quiere explorar el universo.',
      style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#C7D2FE' },
    },
    imagenFondoUrl: 'https://picsum.photos/seed/space1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: {
    ...defaultInvitacionDigitalData.detallesEvento,
    ceremoniaReligiosa: {
      ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa,
      visible: false,
    },
    celebracion: {
      ...defaultInvitacionDigitalData.detallesEvento.celebracion,
      visible: true,
      titulo: '¡Base Espacial!',
    },
  },
  regalos: {
    ...defaultInvitacionDigitalData.regalos,
    titulo: { text: 'Lista de Regalos', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#818CF8' } },
    texto: { text: '🎁 El astronauta agradece tu presencia. Si querés traerle un regalo a la misión, acá van los datos del comandante.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#C7D2FE' } },
  },
  redesSociales: {
    ...defaultInvitacionDigitalData.redesSociales,
    hashtag: '#MisionValentin',
    texto: { text: '¡Compartí la misión!', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#818CF8' } },
  },
  despedida: { visible: true },
  footer: {
    ...defaultInvitacionDigitalData.footer,
    titulo: { text: 'Con amor, la familia de Valentín 🚀', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#C7D2FE' } },
    nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#818CF8' } },
  },
};

/** 15. 🏰 Castillo Mágico — Cuento de hadas. Paleta: rosa + lila + lavanda + destellos dorados. */
export const tplInfantilCastillo: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl_infantil_castillo',
  name: '🏰 Castillo Mágico',
  category: 'Infantil',
  plantilla: 'Grazia',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Sofía',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/castle1200/1200/1800',
    subtitulo: {
      text: 'la princesa cumple 5 años y te invita a su reino mágico',
      style: { fontFamily: 'Dancing_Script', fontSize: '1.3rem', color: '#9B59B6' },
    },
    paletaColores: {
      primary: '#E91E8C',
      secondary: '#9B59B6',
      accent: '#FCE4EC',
    },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/castle1200/1200/800',
    titulo: {
      text: '¡Bienvenidos al Reino Mágico!',
      style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#E91E8C' },
    },
    texto: {
      text: '👸 En un castillo lleno de magia, brillos y hadas madrinas, la princesa Sofía te espera para festejar su cumpleaños. ¡Vestite de cuento y venite a celebrar! 🌟🦄',
      style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#6B1F7E' },
    },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: {
      text: 'La Princesa Sofía',
      style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#E91E8C' },
    },
    texto: {
      text: 'Hace 5 años llegó al mundo la princesa más especial del reino. Con su sonrisa mágica y su corazón de oro, Sofía ilumina la vida de todos los que la rodean. ¡Hoy es SU día!',
      style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#6B1F7E' },
    },
    imagenFondoUrl: 'https://picsum.photos/seed/castle1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: {
    ...defaultInvitacionDigitalData.detallesEvento,
    ceremoniaReligiosa: {
      ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa,
      visible: false,
    },
    celebracion: {
      ...defaultInvitacionDigitalData.detallesEvento.celebracion,
      visible: true,
      titulo: '¡La Gran Fiesta del Castillo!',
    },
  },
  regalos: {
    ...defaultInvitacionDigitalData.regalos,
    titulo: { text: 'Lista de Regalos 🎁', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#E91E8C' } },
    texto: { text: '👑 ¡Con tu presencia el reino ya es más feliz! Si querés traerle un regalo a la princesa, acá encontrás los datos. 🌸', style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#6B1F7E' } },
  },
  redesSociales: {
    ...defaultInvitacionDigitalData.redesSociales,
    hashtag: '#CastilloDeSofia',
    texto: { text: '¡Compartí la magia!', style: { fontFamily: 'Dancing_Script', fontSize: '2rem', color: '#E91E8C' } },
  },
  despedida: { visible: true },
  footer: {
    ...defaultInvitacionDigitalData.footer,
    titulo: { text: 'Con todo el amor, la familia de Sofía 👸', style: { fontFamily: 'Dancing_Script', fontSize: '1.2rem', color: '#6B1F7E' } },
    nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#E91E8C' } },
  },
};


// ─────────────────────────────────────────────────────────────────────────────
// NUEVAS PLANTILLAS — 25 adicionales
// ─────────────────────────────────────────────────────────────────────────────

// ── BODAS (5 nuevas) ──────────────────────────────────────────────────────────

/** tpl-boda-jardin-dorado-1 */
export const tplBodaJardinDorado: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-boda-jardin-dorado-1',
  name: '🌻 Jardín Dorado',
  category: 'Boda',
  plantilla: 'Grazia',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'María',
    protagonista2: 'Andrés',
    imagenFondoUrl: 'https://picsum.photos/seed/gardengold1200/1200/1800',
    subtitulo: { text: 'se unen en un jardín lleno de luz y amor', style: { fontFamily: 'Playfair_Display', fontSize: '1.25rem', color: '#5C4A1E' } },
    paletaColores: { primary: '#D4AF37', secondary: '#3D5A3E', accent: '#FFF8E7' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/gardengold1200/1200/800',
    titulo: { text: 'Nuestro Gran Día', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#D4AF37' } },
    texto: { text: '🌻 Entre flores y luz dorada, queremos compartir este momento mágico con las personas más especiales de nuestra vida.', style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#5C4A1E' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'Nuestra Historia', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#D4AF37' } },
    texto: { text: 'Nos conocimos un atardecer de verano y desde entonces nuestros corazones han crecido juntos como un jardín en flor.', style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#5C4A1E' } },
    imagenFondoUrl: 'https://picsum.photos/seed/gardengold1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: true, titulo: 'Ceremonia' }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: 'Festejo' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Lista de Regalos', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#D4AF37' } }, texto: { text: 'Tu presencia es el mejor regalo. Si deseás hacernos un obsequio, encontrarás opciones a continuación.', style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#5C4A1E' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#JardinDoradoBoda', texto: { text: '¡Compartí nuestra alegría!', style: { fontFamily: 'Playfair_Display', fontSize: '2rem', color: '#D4AF37' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: 'Con amor, María & Andrés 🌻', style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#5C4A1E' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#D4AF37' } } },
};

/** tpl-boda-noche-estrellada-2 */
export const tplBodaNocheEstrellada: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-boda-noche-estrellada-2',
  name: '✨ Noche Estrellada',
  category: 'Boda',
  plantilla: 'Allegria',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Camila',
    protagonista2: 'Diego',
    imagenFondoUrl: 'https://picsum.photos/seed/starrynight1200/1200/1800',
    subtitulo: { text: 'bajo las estrellas, prometemos amarnos para siempre', style: { fontFamily: 'Dancing_Script', fontSize: '1.4rem', color: '#C8D8E8' } },
    paletaColores: { primary: '#4A90D9', secondary: '#1B2A4A', accent: '#F0E6CC' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/starrynight1200/1200/800',
    titulo: { text: 'Una Noche para Siempre', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#4A90D9' } },
    texto: { text: '⭐ Cuando el cielo se llenó de estrellas, supimos que ese era el momento de decir sí. Los invitamos a ser parte de esta noche mágica.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#C8D8E8' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'Nuestra Constelación', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#4A90D9' } },
    texto: { text: 'Dos almas que la vida unió bajo el mismo cielo estrellado. Desde aquella noche mágica, nunca más quisimos estar separados.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#C8D8E8' } },
    imagenFondoUrl: 'https://picsum.photos/seed/starrynight1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: true, titulo: 'Ceremonia' }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: 'Fiesta Estelar' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Regalos', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#4A90D9' } }, texto: { text: '🌙 Tu presencia ilumina nuestra noche. Si querés obsequiarnos algo, encontrás los datos abajo.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#C8D8E8' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#NocheEstrelladaBoda', texto: { text: '¡Compartí esta magia!', style: { fontFamily: 'Dancing_Script', fontSize: '2rem', color: '#4A90D9' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: 'Con amor eterno, Camila & Diego ⭐', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#C8D8E8' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#4A90D9' } } },
};

/** tpl-boda-rustica-natural-3 */
export const tplBodaRusticaNatural: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-boda-rustica-natural-3',
  name: '🌿 Rústica Natural',
  category: 'Boda',
  plantilla: 'Grazia',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Laura',
    protagonista2: 'Martín',
    imagenFondoUrl: 'https://picsum.photos/seed/rusticnature1200/1200/1800',
    subtitulo: { text: 'celebran su amor rodeados de naturaleza y madera', style: { fontFamily: 'Belleza', fontSize: '1.2rem', color: '#5C3D2E' } },
    paletaColores: { primary: '#8B5E3C', secondary: '#4A7C59', accent: '#F5EDD6' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/rusticnature1200/1200/800',
    titulo: { text: 'Amor en la Naturaleza', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#8B5E3C' } },
    texto: { text: '🌿 Entre árboles, flores silvestres y el aroma de la tierra, queremos unir nuestras vidas en una celebración auténtica y llena de calidez.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#5C3D2E' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'Nuestro Camino', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#8B5E3C' } },
    texto: { text: 'Como dos raíces que se encuentran bajo la tierra, nuestro amor creció fuerte y natural, sin prisa pero sin pausa, hasta llegar a este momento.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#5C3D2E' } },
    imagenFondoUrl: 'https://picsum.photos/seed/rusticnature1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: true, titulo: 'Ceremonia al Aire Libre' }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: 'Festejo Rústico' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Lista de Regalos', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#8B5E3C' } }, texto: { text: 'Tu presencia es más que suficiente. Si querés traernos algo, acá encontrás nuestras opciones 🍃', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#5C3D2E' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#RusticaNaturalBoda', texto: { text: '¡Compartí nuestro amor!', style: { fontFamily: 'Playfair_Display', fontSize: '2rem', color: '#8B5E3C' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: 'Con amor natural, Laura & Martín 🌿', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#5C3D2E' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#8B5E3C' } } },
};

/** tpl-boda-art-deco-4 */
export const tplBodaArtDeco: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-boda-art-deco-4',
  name: '🏛️ Art Deco',
  category: 'Boda',
  plantilla: 'Grazia',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Isabella',
    protagonista2: 'Rodrigo',
    imagenFondoUrl: 'https://picsum.photos/seed/artdecoboda/1200/1800',
    subtitulo: { text: 'con elegancia y sofisticación los invitan a su boda', style: { fontFamily: 'Belleza', fontSize: '1.2rem', color: '#B8860B' } },
    paletaColores: { primary: '#B8860B', secondary: '#1C1C1C', accent: '#F5EDD6' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/artdecoboda/1200/800',
    titulo: { text: 'Una Noche Única', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#B8860B' } },
    texto: { text: 'La elegancia del Art Deco enmarcará el inicio de nuestra vida juntos. Una celebración donde el estilo y la sofisticación son los protagonistas.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#F0E6CC' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'Nuestra Obra Maestra', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#B8860B' } },
    texto: { text: 'Como dos piezas de un mismo mosaico, nuestra historia se fue construyendo con paciencia y amor, hasta crear esta obra maestra llamada nosotros.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#F0E6CC' } },
    imagenFondoUrl: 'https://picsum.photos/seed/artdecoboda/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: true, titulo: 'Ceremonia' }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: 'Velada Art Deco' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Lista de Regalos', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#B8860B' } }, texto: { text: 'Tu presencia ya es un obsequio invaluable. Si deseás más, encontrarás opciones abajo.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#F0E6CC' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#ArtDecoBoda', texto: { text: '¡Compartí esta elegancia!', style: { fontFamily: 'Playfair_Display', fontSize: '2rem', color: '#B8860B' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: 'Con distinción, Isabella & Rodrigo', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#F0E6CC' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#B8860B' } } },
};

/** tpl-boda-minimalista-blanca-5 */
export const tplBodaMinimalistaBlanca: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-boda-minimalista-blanca-5',
  name: '🤍 Minimalista Blanca',
  category: 'Boda',
  plantilla: 'Grazia',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Sofía',
    protagonista2: 'Emilio',
    imagenFondoUrl: 'https://picsum.photos/seed/minimalwhite1200/1200/1800',
    subtitulo: { text: 'menos es más, y su amor lo es todo', style: { fontFamily: 'Belleza', fontSize: '1.2rem', color: '#94A3B8' } },
    paletaColores: { primary: '#CBD5E1', secondary: '#1E293B', accent: '#F8FAFC' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/minimalwhite1200/1200/800',
    titulo: { text: 'Simplemente Nosotros', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#334155' } },
    texto: { text: 'Sin excesos, sin artificios — solo nosotros dos y las personas que más amamos, celebrando el comienzo de nuestra historia juntos.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#475569' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'Lo Nuestro', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#334155' } },
    texto: { text: 'Una historia sencilla y profunda. Nos encontramos, nos enamoramos y decidimos que el resto de nuestros días los queremos vivir juntos.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#475569' } },
    imagenFondoUrl: 'https://picsum.photos/seed/minimalwhite1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: true, titulo: 'Ceremonia' }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: 'Celebración' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Regalos', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#334155' } }, texto: { text: 'Tu compañía es el regalo más significativo. Si aun así querés obsequiarnos algo, aquí los datos.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#475569' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#MinimalistaBoda', texto: { text: 'Compartí este momento', style: { fontFamily: 'Playfair_Display', fontSize: '2rem', color: '#334155' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: 'Con sencillez y amor, Sofía & Emilio', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#475569' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#94A3B8' } } },
};

// ── XV AÑOS (5 nuevas) ────────────────────────────────────────────────────────

/** tpl-xv-mariposas-rosadas-1 */
export const tplXvMariposas: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-xv-mariposas-rosadas-1',
  name: '🦋 Mariposas Rosadas',
  category: 'XV Años',
  plantilla: 'Allegria',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Valentina',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/butterfly1200/1200/1800',
    subtitulo: { text: 'cumple sus XV años y te invita a volar junto a ella', style: { fontFamily: 'Dancing_Script', fontSize: '1.4rem', color: '#C2185B' } },
    paletaColores: { primary: '#E91E8C', secondary: '#AD1457', accent: '#FCE4EC' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/butterfly1200/1200/800',
    titulo: { text: '¡Mis XV Años!', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#E91E8C' } },
    texto: { text: '🦋 Como una mariposa que abre sus alas, hoy Valentina celebra su transformación y te invita a ser parte de este vuelo lleno de color y amor.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#880E4F' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'Mi Historia', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#E91E8C' } },
    texto: { text: 'Quince años de crecer, soñar y ser amada por una familia increíble. Cada día fue un capítulo hermoso de esta historia que hoy celebramos juntos.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#880E4F' } },
    imagenFondoUrl: 'https://picsum.photos/seed/butterfly1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: true, titulo: 'Misa de XV' }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: '¡La Fiesta!' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Lista de Regalos 🦋', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#E91E8C' } }, texto: { text: '¡Con tu presencia ya tengo el mejor regalo! Si querés traerme algo especial, acá encontrás ideas.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#880E4F' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#XV_Valentina', texto: { text: '¡Compartí mis 15!', style: { fontFamily: 'Dancing_Script', fontSize: '2rem', color: '#E91E8C' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: 'Con amor, Valentina y familia 🦋', style: { fontFamily: 'Dancing_Script', fontSize: '1.2rem', color: '#880E4F' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#E91E8C' } } },
};

/** tpl-xv-corona-dorada-2 */
export const tplXvCoronaDorada: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-xv-corona-dorada-2',
  name: '👑 Corona Dorada',
  category: 'XV Años',
  plantilla: 'Grazia',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Luciana',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/goldcrown1200/1200/1800',
    subtitulo: { text: 'la princesa del reino celebra sus quince años', style: { fontFamily: 'Playfair_Display', fontSize: '1.3rem', color: '#B8860B' } },
    paletaColores: { primary: '#D4AF37', secondary: '#8B6914', accent: '#FFF8E7' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/goldcrown1200/1200/800',
    titulo: { text: 'Una Princesa de 15', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#D4AF37' } },
    texto: { text: '👑 El reino entero se prepara para celebrar a su princesa más querida. Quince años de magia, amor y sueños hechos realidad.', style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#5C4A1E' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'La Historia de Luciana', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#D4AF37' } },
    texto: { text: 'Quince años de gracia, de sonrisas que iluminan cada habitación y de un corazón generoso que hace del mundo un lugar mejor.', style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#5C4A1E' } },
    imagenFondoUrl: 'https://picsum.photos/seed/goldcrown1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: true, titulo: 'Misa de XV' }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: 'Baile Real' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Lista de Regalos 👑', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#D4AF37' } }, texto: { text: '✨ Tu presencia es el mejor regalo para la princesa. Si querés obsequiarle algo, encontrarás las opciones abajo.', style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#5C4A1E' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#XV_Luciana', texto: { text: '¡Compartí el reinado!', style: { fontFamily: 'Playfair_Display', fontSize: '2rem', color: '#D4AF37' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: 'Con amor real, Luciana y familia 👑', style: { fontFamily: 'Playfair_Display', fontSize: '1.2rem', color: '#5C4A1E' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#D4AF37' } } },
};

/** tpl-xv-neon-violeta-3 */
export const tplXvNeonVioleta: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-xv-neon-violeta-3',
  name: '💜 Neón Violeta',
  category: 'XV Años',
  plantilla: 'Allegria',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Sofía',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/neonviolet1200/1200/1800',
    subtitulo: { text: 'brilla con luz propia en sus XV años', style: { fontFamily: 'Belleza', fontSize: '1.3rem', color: '#CE93D8' } },
    paletaColores: { primary: '#9C27B0', secondary: '#6A0080', accent: '#F3E5F5' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/neonviolet1200/1200/800',
    titulo: { text: '¡Mis XV Brillan!', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#CE93D8' } },
    texto: { text: '💜 Sofía enciende la noche con sus quince años llenos de energía, música y vibras únicas. ¡No te pierdas esta noche que va a quedar en la memoria!', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#E1BEE7' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'Mi Energía', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#CE93D8' } },
    texto: { text: 'Quince años de ser la más auténtica, la más creativa y la más querida. Sofía no sigue tendencias, las crea.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#E1BEE7' } },
    imagenFondoUrl: 'https://picsum.photos/seed/neonviolet1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: true, titulo: 'Misa de XV' }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: '¡La Fiesta Neón!' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Regalos 💜', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#CE93D8' } }, texto: { text: '✨ ¡Con que aparezcas con toda tu energía ya es suficiente! Pero si insistís con el regalo, acá van los datos.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#E1BEE7' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#XV_Sofia', texto: { text: '¡Subí tus fotos neón!', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#CE93D8' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: 'Con vibras, Sofía y familia 💜', style: { fontFamily: 'Belleza', fontSize: '1.2rem', color: '#E1BEE7' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#CE93D8' } } },
};

/** tpl-xv-cuento-de-hadas-4 */
export const tplXvCuentoHadas: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-xv-cuento-de-hadas-4',
  name: '🧚 Cuento de Hadas',
  category: 'XV Años',
  plantilla: 'Grazia',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Martina',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/fairytale1200/1200/1800',
    subtitulo: { text: 'érase una vez una princesa que cumplía sus quince años', style: { fontFamily: 'Dancing_Script', fontSize: '1.3rem', color: '#9C6DB2' } },
    paletaColores: { primary: '#9C6DB2', secondary: '#6A3D8A', accent: '#F3E5F5' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/fairytale1200/1200/800',
    titulo: { text: '¡Había Una Vez...', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#9C6DB2' } },
    texto: { text: '🧚 ...una princesa llamada Martina que cumplía sus quince años y convocó a todos sus seres queridos para vivir la fiesta más mágica del reino.', style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#4A1F6E' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'El Cuento de Martina', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#9C6DB2' } },
    texto: { text: 'Hace quince años comenzó el cuento más bonito: el de Martina. Una historia llena de aventuras, amistades, sueños y el amor infinito de su familia.', style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#4A1F6E' } },
    imagenFondoUrl: 'https://picsum.photos/seed/fairytale1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: true, titulo: 'Misa de XV' }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: 'El Baile Encantado' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'La Lista de Deseos 🧚', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#9C6DB2' } }, texto: { text: '✨ El hada madrina dice que tu presencia ya concede el deseo más grande. Si querés traer un regalo, encontrás las opciones abajo.', style: { fontFamily: 'Dancing_Script', fontSize: '1rem', color: '#4A1F6E' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#XV_Martina', texto: { text: '¡Compartí la magia del cuento!', style: { fontFamily: 'Dancing_Script', fontSize: '2rem', color: '#9C6DB2' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: 'Con magia y amor, Martina y familia 🧚', style: { fontFamily: 'Dancing_Script', fontSize: '1.2rem', color: '#4A1F6E' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#9C6DB2' } } },
};

/** tpl-xv-tropical-glam-5 */
export const tplXvTropicalGlam: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-xv-tropical-glam-5',
  name: '🌺 Tropical Glam',
  category: 'XV Años',
  plantilla: 'Allegria',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Camila',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/tropicalglam1200/1200/1800',
    subtitulo: { text: 'sus XV son una fiesta tropical llena de color y energía', style: { fontFamily: 'Belleza', fontSize: '1.2rem', color: '#FF6B35' } },
    paletaColores: { primary: '#FF6B35', secondary: '#00897B', accent: '#FFF9C4' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/tropicalglam1200/1200/800',
    titulo: { text: '¡Tropical XV!', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#FF6B35' } },
    texto: { text: '🌺 Camila cumple quince años y lo va a celebrar con todo el color y la vibra del trópico. ¡Prepará tu mejor look y venite a disfrutar!', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#3E2723' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'Mis 15 Trópicos', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#FF6B35' } },
    texto: { text: 'Quince años de color, de música que no para y de ser la que siempre pone buena onda en cualquier reunión. ¡Camila es así y lo celebra así!', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#3E2723' } },
    imagenFondoUrl: 'https://picsum.photos/seed/tropicalglam1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: true, titulo: 'Misa de XV' }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: '¡Fiesta Tropical!' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Regalos ��', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#FF6B35' } }, texto: { text: '🌴 ¡Con que vengas a bailar ya es suficiente! Pero si traés algo, mejor todavía.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#3E2723' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#XV_Camila', texto: { text: '¡Subí tus fotos tropicales!', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#FF6B35' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: 'Con mucho ritmo, Camila y familia 🌺', style: { fontFamily: 'Belleza', fontSize: '1.2rem', color: '#3E2723' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#FF6B35' } } },
};

// ── CUMPLEAÑOS (3 nuevos) ─────────────────────────────────────────────────────

/** tpl-cumple-confetti-pop-1 */
export const tplCumpleConfettiPop: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-cumple-confetti-pop-1',
  name: '🎊 Confetti Pop',
  category: 'Cumpleaños',
  plantilla: 'Allegria',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Nicolás',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/confettipop1200/1200/1800',
    subtitulo: { text: '¡la fiesta que está a punto de explotar de alegría!', style: { fontFamily: 'Belleza', fontSize: '1.2rem', color: '#FF4081' } },
    paletaColores: { primary: '#FF4081', secondary: '#651FFF', accent: '#FFFF00' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/confettipop1200/1200/800',
    titulo: { text: '¡Hora de Festejar!', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#FF4081' } },
    texto: { text: '🎊 Nicolás cumple años y lo va a festejar con todo el confetti, la música y la alegría que se merece. ¡Prepará la mejor energía porque esto va a explotar!', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#FFFFFF' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: '¡Así Soy Yo!', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#FF4081' } },
    texto: { text: 'Otro año más de ser el alma de la fiesta. Nicolás tiene el don de hacer que cada momento valga y esta vez no va a ser diferente.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#FFFFFF' } },
    imagenFondoUrl: 'https://picsum.photos/seed/confettipop1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: false }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: '¡La Fiesta!' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Regalos 🎊', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#FF4081' } }, texto: { text: '🎁 ¡Tu presencia es el mejor regalo! Si querés traer algo más, acá tenés las opciones.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#FFFFFF' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#CumpleNicolas', texto: { text: '¡Subí tus fotos del festejo!', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#FF4081' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: '¡Con alegría, Nicolás! 🎊', style: { fontFamily: 'Belleza', fontSize: '1.2rem', color: '#FFFFFF' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#FF4081' } } },
};

/** tpl-cumple-neon-party-2 */
export const tplCumpleNeonParty: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-cumple-neon-party-2',
  name: '🌈 Neon Party',
  category: 'Cumpleaños',
  plantilla: 'Allegria',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Agustina',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/neonparty1200/1200/1800',
    subtitulo: { text: '¡enciende la noche con sus colores neón favoritos!', style: { fontFamily: 'Belleza', fontSize: '1.2rem', color: '#00E5FF' } },
    paletaColores: { primary: '#00E5FF', secondary: '#FF1744', accent: '#CCFF90' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/neonparty1200/1200/800',
    titulo: { text: '¡Neón Total!', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#00E5FF' } },
    texto: { text: '🌈 Agustina apaga las luces normales y enciende los neones para festejar su cumple. ¡Vestite con colores neón y prepará para la noche más brillante del año!', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#FFFFFF' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'Así Brillo Yo', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#00E5FF' } },
    texto: { text: 'Un año más de brillar con luz propia. Agustina ilumina cada espacio con su personalidad única y esta noche va a ser su mayor destello.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#FFFFFF' } },
    imagenFondoUrl: 'https://picsum.photos/seed/neonparty1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: false }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: '¡La Neon Party!' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Regalos 🌈', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#00E5FF' } }, texto: { text: '✨ ¡Con que vengas con algo neón ya es suficiente! Pero si querés traer algo más, acá están los datos.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#FFFFFF' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#NeonPartyAgustina', texto: { text: '¡Subí tus fotos neón!', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#00E5FF' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: '¡Con luz propia, Agustina! 🌈', style: { fontFamily: 'Belleza', fontSize: '1.2rem', color: '#FFFFFF' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#00E5FF' } } },
};

/** tpl-cumple-elegante-negro-oro-3 */
export const tplCumpleEleganteNegroOro: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-cumple-elegante-negro-oro-3',
  name: '✨ Elegante Negro & Oro',
  category: 'Cumpleaños',
  plantilla: 'Grazia',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Federico',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/blackgold1200/1200/1800',
    subtitulo: { text: 'celebra con elegancia y distinción', style: { fontFamily: 'Playfair_Display', fontSize: '1.2rem', color: '#D4AF37' } },
    paletaColores: { primary: '#D4AF37', secondary: '#212121', accent: '#F5EDD6' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/blackgold1200/1200/800',
    titulo: { text: 'Una Noche Dorada', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#D4AF37' } },
    texto: { text: '✨ Federico celebra su cumpleaños con la elegancia que lo caracteriza. Una velada íntima y sofisticada donde el negro y el oro son los colores de la noche.', style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#F0E6CC' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'Mi Historia', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#D4AF37' } },
    texto: { text: 'Años de construir, de crecer y de aprender que la verdadera elegancia se cultiva. Federico celebra su historia con la distinción con que ha vivido cada momento.', style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#F0E6CC' } },
    imagenFondoUrl: 'https://picsum.photos/seed/blackgold1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: false }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: 'La Velada' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Lista de Regalos', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#D4AF37' } }, texto: { text: 'Tu presencia ya es el mejor obsequio. Si deseás agasajarme, encontrarás las opciones abajo.', style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#F0E6CC' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#CumpleFederico', texto: { text: 'Compartí esta noche dorada', style: { fontFamily: 'Playfair_Display', fontSize: '2rem', color: '#D4AF37' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: 'Con distinción, Federico ✨', style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#F0E6CC' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#D4AF37' } } },
};

// ── INFANTIL (5 nuevas) ───────────────────────────────────────────────────────

/** tpl-infantil-unicornio-magico-1 */
export const tplInfantilUnicornio: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-infantil-unicornio-magico-1',
  name: '🦄 Unicornio Mágico',
  category: 'Infantil',
  plantilla: 'Allegria',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Mía',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/unicornmagic1200/1200/1800',
    subtitulo: { text: '¡cumple años y te invita al mundo mágico de los unicornios!', style: { fontFamily: 'Dancing_Script', fontSize: '1.3rem', color: '#FF69B4' } },
    paletaColores: { primary: '#FF69B4', secondary: '#9B59B6', accent: '#FFF0F8' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/unicornmagic1200/1200/800',
    titulo: { text: '¡Cumple de Unicornio!', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#FF69B4' } },
    texto: { text: '🦄 ¡El reino mágico de los unicornios te espera! Mía cumple años y convoca a todos sus amigos y familia para una fiesta de colores, brillos y mucha magia.', style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#6B1F7E' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'La Historia de Mía', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#FF69B4' } },
    texto: { text: 'Mía llegó al mundo con la magia de un unicornio y desde ese día, todo a su alrededor brilla un poquito más. ¡Hoy festejamos esa magia con toda la familia!', style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#6B1F7E' } },
    imagenFondoUrl: 'https://picsum.photos/seed/unicornmagic1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: false }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: '¡La Fiesta Mágica!' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Lista de Regalos 🦄', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#FF69B4' } }, texto: { text: '🌈 ¡Con tu presencia el reino ya brilla más! Si querés traerle un regalo a Mía, acá encontrás las opciones.', style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#6B1F7E' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#CumpleMia', texto: { text: '¡Compartí la magia!', style: { fontFamily: 'Dancing_Script', fontSize: '2rem', color: '#FF69B4' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: 'Con magia y amor, la familia de Mía 🦄', style: { fontFamily: 'Dancing_Script', fontSize: '1.2rem', color: '#6B1F7E' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#FF69B4' } } },
};

/** tpl-infantil-dinosaurios-2 */
export const tplInfantilDinosaurios: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-infantil-dinosaurios-2',
  name: '🦕 Dinosaurios',
  category: 'Infantil',
  plantilla: 'Allegria',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Mateo',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/dinoparty1200/1200/1800',
    subtitulo: { text: '¡rugidos de felicidad por sus años de vida!', style: { fontFamily: 'Belleza', fontSize: '1.3rem', color: '#4CAF50' } },
    paletaColores: { primary: '#4CAF50', secondary: '#2E7D32', accent: '#F9FBE7' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/dinoparty1200/1200/800',
    titulo: { text: '¡Rugido de Cumpleaños!', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#4CAF50' } },
    texto: { text: '🦕 RAWR! Mateo cumple años y lo va a festejar como los dinosaurios: A LO GRANDE. Una fiesta prehistórica llena de rugidos, amigos y mucha diversión.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#1B5E20' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'El Dino Mateo', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#4CAF50' } },
    texto: { text: 'Desde que llegó, Mateo conquistó el mundo como el mejor dinosaurio: con fuerza, con energía y con ese rugido de alegría que hace reír a todos.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#1B5E20' } },
    imagenFondoUrl: 'https://picsum.photos/seed/dinoparty1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: false }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: '¡La Fiesta Jurásica!' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Lista de Regalos 🦕', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#4CAF50' } }, texto: { text: '🌿 ¡Con tu presencia Mateo ya ruge de alegría! Si querés traerle algo, acá encontrás las opciones.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#1B5E20' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#CumpleMateo', texto: { text: '¡Compartí el rugido!', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#4CAF50' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: 'RAWR con amor, la familia de Mateo 🦕', style: { fontFamily: 'Belleza', fontSize: '1.2rem', color: '#1B5E20' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#4CAF50' } } },
};

/** tpl-infantil-sirenas-3 */
export const tplInfantilSirenas: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-infantil-sirenas-3',
  name: '🧜 Sirenas',
  category: 'Infantil',
  plantilla: 'Allegria',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Valentina',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/mermaid1200/1200/1800',
    subtitulo: { text: '¡te invita a su fiesta bajo el mar!', style: { fontFamily: 'Dancing_Script', fontSize: '1.3rem', color: '#00BCD4' } },
    paletaColores: { primary: '#00BCD4', secondary: '#006064', accent: '#E0F7FA' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/mermaid1200/1200/800',
    titulo: { text: '¡Fiesta Bajo el Mar!', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#00BCD4' } },
    texto: { text: '🧜 Las sirenas del océano tienen una noticia: Valentina cumple años y el fondo del mar se llenará de música, colores y magia. ¡Bucéa hacia la fiesta!', style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#004D40' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'La Sirena Valentina', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#00BCD4' } },
    texto: { text: 'Desde su nacimiento, Valentina tiene la alegría del mar: profunda, brillante y llena de vida. ¡Hoy el océano entero celebra con ella!', style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#004D40' } },
    imagenFondoUrl: 'https://picsum.photos/seed/mermaid1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: false }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: '¡La Fiesta Marina!' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Lista de Regalos 🧜', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#00BCD4' } }, texto: { text: '🌊 ¡Con tu presencia el mar ya está más feliz! Si querés traerle algo a Valentina, encontrás las opciones acá.', style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#004D40' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#CumpleValentina', texto: { text: '¡Compartí la magia marina!', style: { fontFamily: 'Dancing_Script', fontSize: '2rem', color: '#00BCD4' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: 'Con ondas de amor, la familia de Valentina 🧜', style: { fontFamily: 'Dancing_Script', fontSize: '1.2rem', color: '#004D40' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#00BCD4' } } },
};

/** tpl-infantil-superheroes-4 */
export const tplInfantilSuperheroes: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-infantil-superheroes-4',
  name: '�� Superhéroes',
  category: 'Infantil',
  plantilla: 'Allegria',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Santiago',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/superhero1200/1200/1800',
    subtitulo: { text: '¡el superhéroe del barrio cumple años!', style: { fontFamily: 'Belleza', fontSize: '1.3rem', color: '#F44336' } },
    paletaColores: { primary: '#F44336', secondary: '#1565C0', accent: '#FFF9C4' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/superhero1200/1200/800',
    titulo: { text: '¡Al Rescate del Cumple!', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#F44336' } },
    texto: { text: '🦸 ¡La ciudad entera necesita tu ayuda! Santiago cumple años y convoca a todos los superhéroes para la misión más importante: ¡celebrar su cumpleaños!', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#FFFFFF' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'El Héroe Santiago', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#F44336' } },
    texto: { text: 'Cada día Santiago demuestra sus superpoderes más increíbles: hacer reír a todos, dar los mejores abrazos y tener la energía de diez superhéroes juntos.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#FFFFFF' } },
    imagenFondoUrl: 'https://picsum.photos/seed/superhero1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: false }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: '¡La Base de los Héroes!' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Lista de Regalos 🦸', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#F44336' } }, texto: { text: '🌟 ¡Todo héroe merece un buen regalo! Si querés traerle algo a Santiago, acá encontrás las opciones.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#FFFFFF' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#CumpleSantiago', texto: { text: '¡Compartí la misión!', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#F44336' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: '¡Al infinito y más allá, la familia de Santiago! 🦸', style: { fontFamily: 'Belleza', fontSize: '1.2rem', color: '#FFFFFF' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#F44336' } } },
};

/** tpl-infantil-circo-divertido-5 */
export const tplInfantilCirco: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-infantil-circo-divertido-5',
  name: '🎪 Circo Divertido',
  category: 'Infantil',
  plantilla: 'Allegria',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Lucía',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/circus1200/1200/1800',
    subtitulo: { text: '¡el circo más divertido llega por su cumpleaños!', style: { fontFamily: 'Dancing_Script', fontSize: '1.3rem', color: '#FF5722' } },
    paletaColores: { primary: '#FF5722', secondary: '#9C27B0', accent: '#FFEB3B' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/circus1200/1200/800',
    titulo: { text: '¡Que Empiece el Circo!', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#FF5722' } },
    texto: { text: '🎪 ¡Señoras y señores, el circo más maravilloso del mundo llega para celebrar el cumpleaños de Lucía! Malabares, risas y mucha diversión garantizados.', style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#4A148C' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'La Estrella del Circo', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#FF5722' } },
    texto: { text: 'Lucía es la estrella más brillante de cualquier espectáculo. Su risa es contagiosa, su energía es infinita y su alegría ilumina hasta la carpa más grande.', style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#4A148C' } },
    imagenFondoUrl: 'https://picsum.photos/seed/circus1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: false }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: '¡La Gran Función!' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Lista de Regalos 🎪', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#FF5722' } }, texto: { text: '🎠 ¡Con tu presencia el circo ya es un éxito! Si querés traerle algo a Lucía, aquí encontrás las opciones.', style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#4A148C' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#CumpleLucia', texto: { text: '¡Compartí el espectáculo!', style: { fontFamily: 'Dancing_Script', fontSize: '2rem', color: '#FF5722' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: 'Con amor artístico, la familia de Lucía 🎪', style: { fontFamily: 'Dancing_Script', fontSize: '1.2rem', color: '#4A148C' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#FF5722' } } },
};

// ── GENERAL (7 nuevas) ────────────────────────────────────────────────────────

/** tpl-general-corporativo-azul-1 */
export const tplGeneralCorporativoAzul: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-general-corporativo-azul-1',
  name: '🏢 Corporativo Azul',
  category: 'General',
  plantilla: 'Grazia',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'AK Producciones',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/corporate1200/1200/1800',
    subtitulo: { text: 'te invita a su evento corporativo', style: { fontFamily: 'Belleza', fontSize: '1.2rem', color: '#1565C0' } },
    paletaColores: { primary: '#1976D2', secondary: '#0D47A1', accent: '#E3F2FD' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/corporate1200/1200/800',
    titulo: { text: 'Evento Corporativo', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#1976D2' } },
    texto: { text: 'Nos complace invitarte a participar de nuestro evento especial, un espacio de networking, aprendizaje y celebración de logros compartidos.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#0D2137' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'Nuestra Misión', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#1976D2' } },
    texto: { text: 'Construimos juntos un camino de excelencia y compromiso. Este evento es la celebración de todo lo que hemos logrado como equipo.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#0D2137' } },
    imagenFondoUrl: 'https://picsum.photos/seed/corporate1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: false }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: 'El Evento' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Información', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#1976D2' } }, texto: { text: 'Para cualquier consulta o confirmación de asistencia, no dudes en comunicarte con nosotros.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#0D2137' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#EventoCorporativo', texto: { text: 'Compartí el evento', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#1976D2' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: 'AK Producciones 🏢', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#0D2137' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#1976D2' } } },
};

/** tpl-general-graduacion-2 */
export const tplGeneralGraduacion: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-general-graduacion-2',
  name: '🎓 Graduación',
  category: 'General',
  plantilla: 'Grazia',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Emiliano',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/graduation1200/1200/1800',
    subtitulo: { text: 'celebra su graduación y te invita a compartir este logro', style: { fontFamily: 'Playfair_Display', fontSize: '1.2rem', color: '#1A237E' } },
    paletaColores: { primary: '#303F9F', secondary: '#1A237E', accent: '#E8EAF6' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/graduation1200/1200/800',
    titulo: { text: '¡Lo Logré!', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#303F9F' } },
    texto: { text: '🎓 Años de esfuerzo, noches de estudio y momentos de incertidumbre culminan hoy en este gran logro. Gracias por estar en este camino.', style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#1A237E' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'Mi Camino', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#303F9F' } },
    texto: { text: 'Cada obstáculo fue una lección, cada logro fue una confirmación. Hoy me recibo con la certeza de que el aprendizaje nunca termina.', style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#1A237E' } },
    imagenFondoUrl: 'https://picsum.photos/seed/graduation1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: false }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: 'La Fiesta de Egresados' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Regalos 🎓', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#303F9F' } }, texto: { text: 'Tu apoyo a lo largo de este camino fue el mejor regalo. Si deseás obsequiarme algo, encontrarás opciones abajo.', style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#1A237E' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#GraduacionEmiliano', texto: { text: '¡Compartí este logro!', style: { fontFamily: 'Playfair_Display', fontSize: '2rem', color: '#303F9F' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: 'Con gratitud, Emiliano 🎓', style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#1A237E' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#303F9F' } } },
};

/** tpl-general-baby-shower-rosa-3 */
export const tplGeneralBabyShowerRosa: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-general-baby-shower-rosa-3',
  name: '🌸 Baby Shower Rosa',
  category: 'General',
  plantilla: 'Grazia',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Florencia',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/babyshower1200/1200/1800',
    subtitulo: { text: 'espera con amor la llegada de su bebé', style: { fontFamily: 'Dancing_Script', fontSize: '1.3rem', color: '#F48FB1' } },
    paletaColores: { primary: '#E91E63', secondary: '#C2185B', accent: '#FCE4EC' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/babyshower1200/1200/800',
    titulo: { text: 'Un Nuevo Amor Llega', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#E91E63' } },
    texto: { text: '🌸 Con el corazón lleno de emoción y gratitud, Florencia te invita a celebrar la llegada de su pequeña princesa. Un momento de amor que queremos compartir con vos.', style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#880E4F' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'Nuestra Historia de Amor', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#E91E63' } },
    texto: { text: 'Un nuevo capítulo comienza, lleno de pañales, risas, noches en vela y el amor más grande que existe. Estamos listos para este viaje.', style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#880E4F' } },
    imagenFondoUrl: 'https://picsum.photos/seed/babyshower1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: false }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: 'Baby Shower' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Lista de Regalos para Bebé', style: { fontFamily: 'Dancing_Script', fontSize: '2rem', color: '#E91E63' } }, texto: { text: '🎀 Tu presencia y tus buenos deseos son el mejor regalo. Si querés traer algo para la bebé, encontrás la lista abajo.', style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#880E4F' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#BabyShowerFlorencia', texto: { text: '¡Compartí la alegría!', style: { fontFamily: 'Dancing_Script', fontSize: '2rem', color: '#E91E63' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: 'Con mucho amor, Florencia y familia 🌸', style: { fontFamily: 'Dancing_Script', fontSize: '1.2rem', color: '#880E4F' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#E91E63' } } },
};

/** tpl-general-baby-shower-celeste-4 */
export const tplGeneralBabyShowerCeleste: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-general-baby-shower-celeste-4',
  name: '💙 Baby Shower Celeste',
  category: 'General',
  plantilla: 'Grazia',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Carolina',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/babyblue1200/1200/1800',
    subtitulo: { text: 'espera con amor la llegada de su varón', style: { fontFamily: 'Dancing_Script', fontSize: '1.3rem', color: '#4FC3F7' } },
    paletaColores: { primary: '#0288D1', secondary: '#01579B', accent: '#E1F5FE' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/babyblue1200/1200/800',
    titulo: { text: '¡Viene un Varón!', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#0288D1' } },
    texto: { text: '💙 Carolina y su familia están emocionados de compartir este momento tan especial: la llegada de su pequeño aventurero. ¡Los esperamos con los brazos abiertos!', style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#01579B' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'Una Nueva Historia', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#0288D1' } },
    texto: { text: 'Pronto llegará quien nos enseñará que el amor puede crecer sin límites. Estamos preparando el nido con mucho amor para este pequeño.', style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#01579B' } },
    imagenFondoUrl: 'https://picsum.photos/seed/babyblue1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: false }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: 'Baby Shower' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Lista de Regalos para Bebé', style: { fontFamily: 'Dancing_Script', fontSize: '2rem', color: '#0288D1' } }, texto: { text: '🎁 Tu presencia ya llena de alegría este nido. Si querés traer algo para el bebé, acá encontrás la lista.', style: { fontFamily: 'Dancing_Script', fontSize: '1.1rem', color: '#01579B' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#BabyShowerCarolina', texto: { text: '¡Compartí la noticia!', style: { fontFamily: 'Dancing_Script', fontSize: '2rem', color: '#0288D1' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: 'Con mucho amor, Carolina y familia 💙', style: { fontFamily: 'Dancing_Script', fontSize: '1.2rem', color: '#01579B' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#0288D1' } } },
};

/** tpl-general-aniversario-oro-5 */
export const tplGeneralAniversarioOro: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-general-aniversario-oro-5',
  name: '💛 Aniversario Oro',
  category: 'General',
  plantilla: 'Grazia',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Jorge',
    protagonista2: 'Elena',
    imagenFondoUrl: 'https://picsum.photos/seed/anniversary1200/1200/1800',
    subtitulo: { text: 'celebran 50 años de amor, vida y familia', style: { fontFamily: 'Playfair_Display', fontSize: '1.3rem', color: '#D4AF37' } },
    paletaColores: { primary: '#D4AF37', secondary: '#8B6914', accent: '#FFF8E7' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/anniversary1200/1200/800',
    titulo: { text: '50 Años Juntos', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#D4AF37' } },
    texto: { text: '💛 Medio siglo de amor, de complicidad, de construir una familia y de demostrarse cada día que el amor verdadero no se acaba. Los invitamos a celebrar este hito.', style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#5C4A1E' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: '50 Capítulos de Amor', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#D4AF37' } },
    texto: { text: 'Cinco décadas de risas, de lágrimas compartidas, de crecer juntos y de demostrar que cuando el amor es verdadero, el tiempo solo lo hace más profundo.', style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#5C4A1E' } },
    imagenFondoUrl: 'https://picsum.photos/seed/anniversary1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: true, titulo: 'Misa de Acción de Gracias' }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: 'Celebración de Aniversario' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Regalos 💛', style: { fontFamily: 'Playfair_Display', fontSize: '2.5rem', color: '#D4AF37' } }, texto: { text: 'Su mayor regalo es saber que están rodeados de amor. Si deseás obsequiarles algo, encontrás las opciones abajo.', style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#5C4A1E' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#50AnosJuntos', texto: { text: '¡Compartí este amor eterno!', style: { fontFamily: 'Playfair_Display', fontSize: '2rem', color: '#D4AF37' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: 'Con amor de siempre, Jorge & Elena 💛', style: { fontFamily: 'Playfair_Display', fontSize: '1rem', color: '#5C4A1E' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#D4AF37' } } },
};

/** tpl-general-jubilacion-6 */
export const tplGeneralJubilacion: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-general-jubilacion-6',
  name: '🎉 Jubilación',
  category: 'General',
  plantilla: 'Allegria',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Roberto',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/retirement1200/1200/1800',
    subtitulo: { text: 'se jubila y lo quiere celebrar con vos', style: { fontFamily: 'Belleza', fontSize: '1.2rem', color: '#FF8F00' } },
    paletaColores: { primary: '#FF8F00', secondary: '#E65100', accent: '#FFF8E1' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/retirement1200/1200/800',
    titulo: { text: '¡Fin de Jornada Laboral!', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#FF8F00' } },
    texto: { text: '🎉 Después de tantos años de trabajo, dedicación y esfuerzo, Roberto celebra su jubilación. ¡Es hora de disfrutar cada momento sin horarios ni compromisos!', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#3E2723' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'Una Carrera Extraordinaria', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#FF8F00' } },
    texto: { text: 'Años de compromiso, de aprendizaje y de dar siempre lo mejor. Hoy Roberto cierra un capítulo extraordinario para abrir otro lleno de libertad y nuevas aventuras.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#3E2723' } },
    imagenFondoUrl: 'https://picsum.photos/seed/retirement1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: false }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: '¡La Fiesta de Jubilación!' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Regalos 🎉', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#FF8F00' } }, texto: { text: 'El mayor regalo es el tiempo libre que viene. Si querés agasajar a Roberto, encontrás las opciones abajo.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#3E2723' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#JubilacionRoberto', texto: { text: '¡Compartí este nuevo comienzo!', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#FF8F00' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: 'Con gratitud y alegría, Roberto 🎉', style: { fontFamily: 'Belleza', fontSize: '1.2rem', color: '#3E2723' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#FF8F00' } } },
};

/** tpl-general-despedida-7 */
export const tplGeneralDespedida: InvitacionDigitalTemplate = {
  ...defaultInvitacionDigitalData,
  id: 'tpl-general-despedida-7',
  name: '👋 Despedida',
  category: 'General',
  plantilla: 'Allegria',
  cabecera: {
    ...defaultInvitacionDigitalData.cabecera,
    protagonista1: 'Paola',
    protagonista2: '',
    imagenFondoUrl: 'https://picsum.photos/seed/farewell1200/1200/1800',
    subtitulo: { text: 'se va a una nueva aventura y quiere despedirse con estilo', style: { fontFamily: 'Belleza', fontSize: '1.2rem', color: '#AB47BC' } },
    paletaColores: { primary: '#8E24AA', secondary: '#4A148C', accent: '#F3E5F5' },
  },
  bienvenida: {
    ...defaultInvitacionDigitalData.bienvenida,
    imagenFondoUrl: 'https://picsum.photos/seed/farewell1200/1200/800',
    titulo: { text: '¡Hasta Luego, Salto!', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#8E24AA' } },
    texto: { text: '👋 Paola emprende una nueva aventura y antes de irse quiere reunir a todos los que la quieren para una despedida que no se va a olvidar. ¡Venite!', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#4A148C' } },
  },
  historia: {
    ...defaultInvitacionDigitalData.historia,
    titulo: { text: 'Gracias por Todo', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#8E24AA' } },
    texto: { text: 'Cada persona que estará en esta reunión es parte de la historia que me llevo. Gracias por los momentos, las risas y el apoyo incondicional de siempre.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#4A148C' } },
    imagenFondoUrl: 'https://picsum.photos/seed/farewell1200/1200/800',
  },
  cuentaRegresiva: { visible: true },
  confirmacion: { visible: true },
  detallesEvento: { ...defaultInvitacionDigitalData.detallesEvento, ceremoniaReligiosa: { ...defaultInvitacionDigitalData.detallesEvento.ceremoniaReligiosa, visible: false }, celebracion: { ...defaultInvitacionDigitalData.detallesEvento.celebracion, visible: true, titulo: 'La Despedida' } },
  regalos: { ...defaultInvitacionDigitalData.regalos, titulo: { text: 'Regalos 👋', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#8E24AA' } }, texto: { text: 'Los recuerdos que me llevo no tienen precio. Si querés darme algo para el camino, acá encontrás las opciones.', style: { fontFamily: 'Belleza', fontSize: '1rem', color: '#4A148C' } } },
  redesSociales: { ...defaultInvitacionDigitalData.redesSociales, hashtag: '#DespedidaPaola', texto: { text: '¡Compartí este momento!', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#8E24AA' } } },
  despedida: { visible: true },
  footer: { ...defaultInvitacionDigitalData.footer, titulo: { text: 'Con amor y agradecimiento, Paola 👋', style: { fontFamily: 'Belleza', fontSize: '1.2rem', color: '#4A148C' } }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#8E24AA' } } },
};
