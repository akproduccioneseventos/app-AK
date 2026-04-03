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
