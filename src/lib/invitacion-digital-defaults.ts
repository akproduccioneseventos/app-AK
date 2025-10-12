

import type { InvitacionDigitalData, SeccionInvitacion, TextStyle, ColorPalette, DetalleEventoEspecifico } from '@/types/fiesta';

const defaultDetalleEvento: DetalleEventoEspecifico = {
  visible: true,
  titulo: '',
  fecha: undefined,
  hora: '',
  nombreLugar: '',
  direccionLugar: '',
  mapaUrl: '',
  imagenUrl: '',
};

const defaultTextStyle: TextStyle = { fontFamily: 'Inter', fontSize: '1rem', color: '#6b7280' };
const defaultTitleStyle: TextStyle = { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#363636' };
const defaultAccentTitleStyle: TextStyle = { ...defaultTitleStyle, color: '#A2D2B0' };


export const defaultInvitacionDigitalData: InvitacionDigitalData = {
  plantilla: 'Grazia',
  name: 'Plantilla Grazia por Defecto',
  category: 'Boda',
  musicaFondoUrl: '',
  secciones: [
    {
      id: 'cabecera',
      tipo: 'cabecera',
      data: {
        visible: true,
        logoUrl: 'https://placehold.co/150x60/F3F4F6/333333?text=Logo',
        protagonista1: 'Novio/a 1',
        protagonista2: 'Novio/a 2',
        subtitulo: { text: 'Nuestra Boda', style: { fontFamily: 'Inter', fontSize: '1.25rem', color: '#654321' } },
        paletaColores: { primary: '#A2D2B0', secondary: '#363636', accent: '#F0E6CC' }
      }
    },
    {
      id: 'bienvenida',
      tipo: 'bienvenida',
      data: {
        visible: true,
        titulo: { text: '¡Nos Casamos!', style: defaultTitleStyle },
        texto: { text: 'Después de un hermoso camino juntos, damos el siguiente paso. Queremos que seas parte de este día tan especial para nosotros, en una noche que promete ser inolvidable, llena de alegría, música y buenos momentos.', style: defaultTextStyle },
        imagenFondoUrl: 'https://picsum.photos/seed/welcomebg/1200/800'
      }
    },
    { id: 'cuentaRegresiva', tipo: 'cuentaRegresiva', data: { visible: true } },
    { 
      id: 'detallesEvento', 
      tipo: 'detallesEvento', 
      data: { 
        visible: true,
        ceremoniaReligiosa: { ...defaultDetalleEvento, visible: true, titulo: 'Ceremonia', fecha: '2025-11-15T20:00:00.000Z', hora: '20:00', nombreLugar: 'Catedral de San Juan', direccionLugar: 'Calle Falsa 123, Ciudad', mapaUrl: '', imagenUrl: 'https://picsum.photos/seed/ceremony/600/400' },
        ceremoniaCivil: { ...defaultDetalleEvento, visible: false },
        celebracion: { ...defaultDetalleEvento, visible: true, titulo: 'Fiesta', fecha: '2025-11-15T21:30:00.000Z', hora: '21:30', nombreLugar: 'Salón El Paraíso', direccionLugar: 'Ruta 1, Km 10', mapaUrl: '', imagenUrl: 'https://picsum.photos/seed/reception/600/400' },
      }
    },
    { id: 'itinerario', tipo: 'itinerario', data: { visible: true, imagenFondoUrl: "https://picsum.photos/seed/itinerarybg/1200/800" } },
    { 
      id: 'historia', 
      tipo: 'historia', 
      data: { 
        visible: true, 
        titulo: { text: 'Nuestra Historia', style: defaultAccentTitleStyle },
        texto: { text: 'Desde el día que nos conocimos, supimos que nuestro camino era para recorrerlo juntos. Cada paso nos ha traído hasta aquí, y estamos emocionados por empezar este nuevo capítulo con ustedes como testigos.', style: defaultTextStyle },
        imagenFondoUrl: "https://picsum.photos/seed/storybg/1200/800"
      } 
    },
    { 
      id: 'galeria', 
      tipo: 'galeria', 
      data: { 
        visible: true, 
        fotos: [
            "https://picsum.photos/seed/gallery1/800/600",
            "https://picsum.photos/seed/gallery2/800/600",
            "https://picsum.photos/seed/gallery3/800/600",
            "https://picsum.photos/seed/gallery4/800/600"
        ] 
      } 
    },
    { id: 'dressCode', tipo: 'dressCode', data: { visible: true, texto: { text: 'Elegante' }, imagenFondoUrl: "https://picsum.photos/seed/dresscode/1200/800" } },
    { 
      id: 'regalos', 
      tipo: 'regalos', 
      data: { 
        visible: true,
        titulo: { text: 'Lista de Regalos', style: defaultTitleStyle },
        texto: { text: 'Tu presencia es nuestro mejor regalo. Si aún así deseas obsequiarnos algo, puedes ayudarnos con nuestra luna de miel o elegir una de estas opciones.', style: defaultTextStyle },
        datosBancarios: 'Banco Itaú\nC.A. Pesos: 1234567\nTitular: Juan Pérez',
        items: [] 
      } 
    },
    { id: 'confirmacion', tipo: 'confirmacion', data: { visible: true } },
    { id: 'musica', tipo: 'musica', data: { visible: true, placeholder: 'Ej: Bohemian Rhapsody - Queen' } },
    { 
      id: 'redesSociales', 
      tipo: 'redesSociales', 
      data: { 
        visible: true, 
        hashtag: '#BodaJuanYMaria',
        texto: { text: '¡Comparte tus momentos!', style: { ...defaultTitleStyle, fontSize: '2rem' } },
      } 
    },
    { id: 'despedida', tipo: 'despedida', data: { visible: true, texto: { text: '¡Te esperamos!', style: { fontFamily: 'Dancing_Script', fontSize: '3rem', color: '#A2D2B0'} } } },
    { id: 'footer', tipo: 'footer', data: { 
        visible: true,
        titulo: { text: 'Con cariño, María y Juan', style: defaultTextStyle },
        nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#A2D2B0' } }
      }
    },
  ],
  // Flat structure for direct access
  cabecera: {
    visible: true,
    logoUrl: 'https://placehold.co/150x60/F3F4F6/333333?text=Logo',
    protagonista1: 'María',
    protagonista2: 'Juan',
    subtitulo: { text: 'Nuestra Boda', style: { fontFamily: 'Inter', fontSize: '1.25rem', color: '#654321' } },
    paletaColores: { primary: '#A2D2B0', secondary: '#363636', accent: '#F0E6CC' }
  },
  bienvenida: {
    visible: true,
    titulo: { text: '¡Nos Casamos!', style: defaultTitleStyle },
    texto: { text: 'Después de un hermoso camino juntos, damos el siguiente paso. Queremos que seas parte de este día tan especial para nosotros, en una noche que promete ser inolvidable, llena de alegría, música y buenos momentos.', style: defaultTextStyle },
    imagenFondoUrl: 'https://picsum.photos/seed/welcomebg/1200/800'
  },
  cuentaRegresiva: {
      visible: true
  },
  detallesEvento: {
    visible: true,
    ceremoniaReligiosa: { ...defaultDetalleEvento, visible: true, titulo: 'Ceremonia', fecha: '2025-11-15T20:00:00.000Z', hora: '20:00', nombreLugar: 'Catedral de San Juan', direccionLugar: 'Calle Falsa 123, Ciudad', mapaUrl: '', imagenUrl: 'https://picsum.photos/seed/ceremony/600/400' },
    ceremoniaCivil: { ...defaultDetalleEvento, visible: false },
    celebracion: { ...defaultDetalleEvento, visible: true, titulo: 'Fiesta', fecha: '2025-11-15T21:30:00.000Z', hora: '21:30', nombreLugar: 'Salón El Paraíso', direccionLugar: 'Ruta 1, Km 10', mapaUrl: '', imagenUrl: 'https://picsum.photos/seed/reception/600/400' },
  },
  itinerario: {
    visible: true,
    imagenFondoUrl: "https://picsum.photos/seed/itinerarybg/1200/800"
  },
  galeria: {
    visible: true,
    fotos: [
        "https://picsum.photos/seed/gallery1/800/600",
        "https://picsum.photos/seed/gallery2/800/600",
        "https://picsum.photos/seed/gallery3/800/600",
        "https://picsum.photos/seed/gallery4/800/600"
    ],
  },
  historia: {
    visible: true,
    titulo: { text: 'Nuestra Historia', style: defaultAccentTitleStyle },
    texto: { text: 'Desde el día que nos conocimos, supimos que nuestro camino era para recorrerlo juntos. Cada paso nos ha traído hasta aquí, y estamos emocionados por empezar este nuevo capítulo con ustedes como testigos.', style: defaultTextStyle },
    imagenFondoUrl: "https://picsum.photos/seed/storybg/1200/800"
  },
  regalos: {
    visible: true,
    titulo: { text: 'Lista de Regalos', style: defaultTitleStyle },
    texto: { text: 'Tu presencia es nuestro mejor regalo. Si aún así deseas obsequiarnos algo, puedes ayudarnos con nuestra luna de miel o elegir una de estas opciones.', style: defaultTextStyle },
    datosBancarios: 'Banco Itaú\nC.A. Pesos: 1234567\nTitular: Juan Pérez',
    items: [],
  },
  dressCode: {
    visible: true,
    texto: { text: 'Elegante', style: { fontFamily: 'Inter', fontSize: '1.25rem', color: '#363636' } },
    imagenFondoUrl: "https://picsum.photos/seed/dresscode/1200/800"
  },
   musica: {
    visible: true,
    placeholder: 'Ej: Bohemian Rhapsody - Queen'
  },
  redesSociales: {
    visible: true,
    hashtag: '#BodaJuanYMaria',
    texto: { text: '¡Comparte tus momentos!', style: { ...defaultTitleStyle, fontSize: '2rem' } },
  },
  confirmacion: {
    visible: true,
  },
  despedida: {
    visible: true,
    texto: { text: '¡Te esperamos!', style: { fontFamily: 'Dancing_Script', fontSize: '3rem', color: '#A2D2B0'} },
  },
  footer: {
    visible: true,
    titulo: { text: 'Con cariño, María y Juan', style: defaultTextStyle },
    nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#A2D2B0' } },
  }
};
