
import type { InvitacionDigitalData, SeccionInvitacion } from '@/types/fiesta';

export const defaultInvitacionDigitalData: InvitacionDigitalData = {
  plantilla: 'Grazia',
  musicaFondoUrl: '',
  secciones: [
    { id: 'cabecera', tipo: 'cabecera', data: { visible: true, protagonista1: 'Novio/a 1', protagonista2: 'Novio/a 2' } },
    { id: 'bienvenida', tipo: 'bienvenida', data: { visible: true, titulo: '¡Nos Casamos!', texto: 'Y queremos que seas parte de este día tan especial...' } },
    { id: 'cuentaRegresiva', tipo: 'cuentaRegresiva', data: { visible: true } },
    { id: 'detallesEvento', tipo: 'detallesEvento', data: { visible: true, infoPadresVisible: false } },
    { id: 'itinerario', tipo: 'itinerario', data: { visible: true } },
    { id: 'dressCode', tipo: 'dressCode', data: { visible: true, texto: 'Elegante Sport' } },
    { id: 'regalos', tipo: 'regalos', data: { visible: true, titulo: 'Lista de Regalos', texto: 'Tu presencia es nuestro mejor regalo...', datosBancarios: '', items: [] } },
    { id: 'confirmacion', tipo: 'confirmacion', data: { visible: true } },
    { id: 'instagram', tipo: 'instagram', data: { visible: true, hashtag: '#NuestraBoda', texto: '¡Comparte tus fotos!' } },
    { id: 'despedida', tipo: 'despedida', data: { visible: true, texto: '¡Te esperamos!' } },
  ],
  // Flat structure for easy access in editor
  cabecera: {
    visible: true,
    protagonista1: '',
    protagonista2: '',
    paletaColores: {
        primary: '#EF4444',
        secondary: '#F97316',
        accent: '#FBBF24'
    }
  },
  bienvenida: {
    visible: true,
    titulo: '¡Nos Casamos!',
    texto: 'Y queremos que seas parte de este día tan especial para nosotros. Prepárate para una noche llena de alegría, música y buenos momentos.',
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
    titulo: 'Nuestra Historia',
    texto: '',
  },
  regalos: {
    visible: true,
    titulo: 'Lista de Regalos',
    texto: 'Tu presencia es nuestro mejor regalo. Si aún así deseas obsequiarnos algo, puedes elegir una de estas opciones o ayudarnos con nuestra luna de miel.',
    datosBancarios: '',
    items: [],
  },
  dressCode: {
    visible: true,
    texto: 'Elegante Sport',
  },
  instagram: {
    visible: true,
    hashtag: '#BodaAnaYJuan',
    texto: '¡Comparte tus fotos y momentos con nuestro hashtag!',
  },
  confirmacion: {
    visible: true,
  },
  despedida: {
    visible: true,
    texto: '¡Te esperamos para celebrar juntos!',
  }
};
