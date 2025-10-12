

import type { InvitacionDigitalData, SeccionInvitacion, TextStyle, ColorPalette, DetalleEventoEspecifico } from '@/types/fiesta';

const defaultDetalleEvento: DetalleEventoEspecifico = {
  visible: false,
  titulo: '',
  fecha: undefined,
  hora: '',
  nombreLugar: '',
  direccionLugar: '',
  mapaUrl: '',
  imagenUrl: '',
};

export const defaultInvitacionDigitalData: InvitacionDigitalData = {
  plantilla: 'Grazia',
  musicaFondoUrl: '',
  secciones: [
    {
      id: 'cabecera',
      tipo: 'cabecera',
      data: {
        visible: true,
        logoUrl: '',
        protagonista1: 'Novio/a 1',
        protagonista2: 'Novio/a 2',
        subtitulo: { text: 'Nuestra Boda', style: { fontFamily: 'Inter', fontSize: '1.5rem', color: '#333' } },
        paletaColores: { primary: '#EF4444', secondary: '#F97316', accent: '#FBBF24' }
      }
    },
    {
      id: 'bienvenida',
      tipo: 'bienvenida',
      data: {
        visible: true,
        titulo: { text: '¡Nos Casamos!', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#000' } },
        texto: { text: 'Y queremos que seas parte de este día tan especial para nosotros. Prepárate para una noche llena de alegría, música y buenos momentos.', style: { fontFamily: 'Inter', fontSize: '1rem', color: '#6b7280' } }
      }
    },
    { id: 'cuentaRegresiva', tipo: 'cuentaRegresiva', data: { visible: true } },
    { id: 'detallesEvento', tipo: 'detallesEvento', data: { 
        visible: true,
        ceremoniaReligiosa: { ...defaultDetalleEvento, titulo: 'Ceremonia Religiosa' },
        ceremoniaCivil: { ...defaultDetalleEvento, titulo: 'Ceremonia Civil' },
        celebracion: { ...defaultDetalleEvento, titulo: 'Celebración' },
    }},
    { id: 'itinerario', tipo: 'itinerario', data: { visible: true } },
    { id: 'dressCode', tipo: 'dressCode', data: { visible: true, texto: { text: 'Elegante Sport' } } },
    {
      id: 'regalos',
      tipo: 'regalos',
      data: {
        visible: true,
        titulo: { text: 'Lista de Regalos', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#000' } },
        texto: { text: 'Tu presencia es nuestro mejor regalo...', style: { fontFamily: 'Inter', fontSize: '1rem', color: '#6b7280' } },
        datosBancarios: '',
        items: []
      }
    },
     { id: 'galeria', tipo: 'galeria', data: { visible: true, fotos: [] } },
    { id: 'confirmacion', tipo: 'confirmacion', data: { visible: true } },
    {
      id: 'musica',
      tipo: 'musica',
      data: {
        visible: true,
        placeholder: 'Ej: Bohemian Rhapsody - Queen'
      }
    },
    {
      id: 'redesSociales',
      tipo: 'redesSociales',
      data: {
        visible: true,
        hashtag: '#NuestraBoda',
        texto: { text: '¡Comparte tus fotos y momentos con nuestro hashtag!', style: { fontFamily: 'Inter', fontSize: '1.25rem', color: '#333' } },
      },
    },
    { id: 'despedida', tipo: 'despedida', data: { visible: true, texto: { text: '¡Te esperamos!' } } },
    { id: 'footer', tipo: 'footer', data: { visible: true } },
  ],
  // Flat structure for easy access in editor - can be deprecated later if fully modular
  cabecera: {
    visible: true,
    logoUrl: '',
    protagonista1: 'María',
    protagonista2: 'Juan',
    subtitulo: { text: 'Nuestra Boda', style: { fontFamily: 'Inter', fontSize: '1.25rem', color: '#654321' } },
    paletaColores: {
        primary: '#b9936c', // Soft Gold
        secondary: '#363636', // Charcoal
        accent: '#506A61' // Emerald Green
    }
  },
  bienvenida: {
    visible: true,
    titulo: { text: '¡Nos Casamos!', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#363636' } },
    texto: { text: 'Después de un hermoso camino juntos, damos el siguiente paso. Queremos que seas parte de este día tan especial para nosotros, en una noche que promete ser inolvidable, llena de alegría, música y buenos momentos.', style: { fontFamily: 'Inter', fontSize: '1rem', color: '#555' } },
  },
  cuentaRegresiva: {
      visible: true
  },
  detallesEvento: {
    visible: true,
    ceremoniaReligiosa: { ...defaultDetalleEvento, visible: true, titulo: 'Ceremonia', fecha: '2025-11-15T20:00:00.000Z', hora: '20:00', nombreLugar: 'Catedral de San Juan', direccionLugar: 'Calle Falsa 123, Ciudad', mapaUrl: '', imagenUrl: 'https://picsum.photos/seed/ceremony/600/400' },
    ceremoniaCivil: { ...defaultDetalleEvento },
    celebracion: { ...defaultDetalleEvento, visible: true, titulo: 'Fiesta', fecha: '2025-11-15T21:30:00.000Z', hora: '21:30', nombreLugar: 'Salón El Paraíso', direccionLugar: 'Ruta 1, Km 10', mapaUrl: '', imagenUrl: 'https://picsum.photos/seed/reception/600/400' },
  },
  itinerario: {
    visible: true,
  },
  galeria: {
    visible: true,
    fotos: [
        "https://picsum.photos/seed/gallery1/600/400",
        "https://picsum.photos/seed/gallery2/600/400",
        "https://picsum.photos/seed/gallery3/600/400",
        "https://picsum.photos/seed/gallery4/600/400"
    ],
  },
  historia: {
    visible: true,
    titulo: { text: 'Nuestra Historia', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#b9936c' } },
    texto: { text: 'Desde el día que nos conocimos, supimos que nuestro camino era para recorrerlo juntos. Cada paso nos ha traído hasta aquí, y estamos emocionados por empezar este nuevo capítulo con ustedes como testigos.', style: { fontFamily: 'Inter', fontSize: '1rem', color: '#6b7280' } },
  },
  regalos: {
    visible: true,
    titulo: { text: 'Lista de Regalos', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#363636' } },
    texto: { text: 'Tu presencia es nuestro mejor regalo. Si aún así deseas obsequiarnos algo, puedes ayudarnos con nuestra luna de miel o elegir una de estas opciones.', style: { fontFamily: 'Inter', fontSize: '1rem', color: '#6b7280' } },
    datosBancarios: 'Banco Itaú\nC.A. Pesos: 1234567\nTitular: Juan Pérez',
    items: [],
  },
  dressCode: {
    visible: true,
    texto: { text: 'Elegante', style: { fontFamily: 'Inter', fontSize: '1.25rem', color: '#363636' } }
  },
   musica: {
    visible: true,
    placeholder: 'Ej: Bohemian Rhapsody - Queen'
  },
  redesSociales: {
    visible: true,
    hashtag: '#BodaJyM',
    texto: { text: '¡Usa nuestro hashtag para compartir tus momentos!', style: { fontFamily: 'Inter', fontSize: '1.25rem', color: '#333' } }
  },
  confirmacion: {
    visible: true,
  },
  despedida: {
    visible: true,
    texto: { text: '¡Te esperamos para celebrar juntos!', style: { fontFamily: 'Dancing_Script', fontSize: '2.5rem', color: '#b9936c' } },
  },
  footer: {
    visible: true,
    titulo: { text: 'Con cariño, María y Juan', style: { fontFamily: 'Inter', fontSize: '1rem', color: '#6b7280' } },
    nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#b9936c' } },
  }
};
