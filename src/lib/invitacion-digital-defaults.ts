

import type { InvitacionDigitalData, SeccionInvitacion, TextStyle, ColorPalette } from '@/types/fiesta';

export const defaultInvitacionDigitalData: InvitacionDigitalData = {
  plantilla: 'Grazia',
  musicaFondoUrl: '',
  secciones: [
    {
      id: 'cabecera',
      tipo: 'cabecera',
      data: {
        visible: true,
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
        texto: { text: 'Y queremos que seas parte de este día tan especial...', style: { fontFamily: 'Inter', fontSize: '1rem', color: '#6b7280' } }
      }
    },
    { id: 'cuentaRegresiva', tipo: 'cuentaRegresiva', data: { visible: true } },
    { id: 'detallesEvento', tipo: 'detallesEvento', data: { visible: true, infoPadresVisible: false } },
    { id: 'itinerario', tipo: 'itinerario', data: { visible: true } },
    { id: 'dressCode', tipo: 'dressCode', data: { visible: true, texto: 'Elegante Sport' } },
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
    { id: 'confirmacion', tipo: 'confirmacion', data: { visible: true } },
    { id: 'despedida', tipo: 'despedida', data: { visible: true, texto: '¡Te esperamos!' } },
  ],
  // Flat structure for easy access in editor - can be deprecated later if fully modular
  cabecera: {
    visible: true,
    protagonista1: '',
    protagonista2: '',
    subtitulo: { text: 'Nuestra Boda', style: { fontFamily: 'Inter', fontSize: '1.5rem', color: '#333' } },
    paletaColores: {
        primary: '#EF4444',
        secondary: '#F97316',
        accent: '#FBBF24'
    }
  },
  bienvenida: {
    visible: true,
    titulo: { text: '¡Nos Casamos!', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#000' } },
    texto: { text: 'Y queremos que seas parte de este día tan especial para nosotros. Prepárate para una noche llena de alegría, música y buenos momentos.', style: { fontFamily: 'Inter', fontSize: '1rem', color: '#6b7280' } },
  },
  cuentaRegresiva: {
      visible: true
  },
  detallesEvento: {
    visible: true,
    infoPadresVisible: false,
    nombrePadre1: '',
    nombrePadre2: '',
    nombreMadre1: '',
    nombreMadre2: '',
  },
  itinerario: {
    visible: true,
  },
  galeria: {
    visible: false,
    fotos: [],
  },
  historia: {
    visible: false,
    titulo: { text: 'Nuestra Historia', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#000' } },
    texto: { text: 'Un breve relato de cómo llegamos hasta aquí...', style: { fontFamily: 'Inter', fontSize: '1rem', color: '#6b7280' } },
  },
  regalos: {
    visible: true,
    titulo: { text: 'Lista de Regalos', style: { fontFamily: 'Belleza', fontSize: '2rem', color: '#000' } },
    texto: { text: 'Tu presencia es nuestro mejor regalo. Si aún así deseas obsequiarnos algo, puedes elegir una de estas opciones o ayudarnos con nuestra luna de miel.', style: { fontFamily: 'Inter', fontSize: '1rem', color: '#6b7280' } },
    datosBancarios: '',
    items: [],
  },
  dressCode: {
    visible: true,
    texto: 'Elegante Sport',
  },
  confirmacion: {
    visible: true,
  },
  despedida: {
    visible: true,
    texto: '¡Te esperamos para celebrar juntos!',
  },
  footer: {
    visible: true,
    titulo: { text: 'Visita nuestras redes sociales', style: { fontFamily: 'Inter', fontSize: '1rem', color: '#6b7280' } },
    nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#EF4444' } },
  }
};
