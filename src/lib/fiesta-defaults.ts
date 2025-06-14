
// src/lib/fiesta-defaults.ts
import type { FiestaEnPlanificacion, ConfigEventoDataStorage, Tarea, DecoracionData, ColorPalette, EventWebPageSettings, SalonLayoutData, MusicaFiesta } from '@/types/fiesta';

export const defaultConfiguracion: ConfigEventoDataStorage = {
  nombreEvento: 'Mi Próximo Evento Increíble',
  tipoCelebracion: 'Cumpleaños',
  fechaEvento: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()).toISOString(),
  horaInicio: '19:00',
  horaFin: '02:00',
  nombreLugar: 'Salón de Ensueño',
  direccionLugar: 'Calle Principal 123, Ciudad',
  invitadosEstimados: 50,
  presupuestoEstimado: 100000,
  notasAdicionales: 'Planificación inicial.',
  clienteId: undefined,
};

// Define defaultTareas without IDs, they will be assigned in initialFiestaActualData
export const baseDefaultTareas: Omit<Tarea, 'id'>[] = [
  { texto: 'Definir lista de invitados', completada: false },
  { texto: 'Seleccionar catering y menú', completada: false },
  { texto: 'Contratar DJ o música', completada: false },
  { texto: 'Elegir decoración y temática', completada: false },
  { texto: 'Enviar invitaciones', completada: false },
];

export const defaultColorPalette: ColorPalette = {
  primary: '#007bff',
  secondary: '#6c757d',
  accent: '#28a745',
};

export const defaultDecoracion: DecoracionData = {
  tema: 'Elegante y Moderno',
  paletaColores: { ...defaultColorPalette },
  moodboardImageUrl: '',
  items: [],
  generalNotes: "Decoración base, detalles por definir.",
};

export const defaultSalonLayout: SalonLayoutData = {
    backgroundImageUrl: '',
    elements: [],
    generalNotes: 'Disposición estándar del salón.',
};

export const defaultWebPageSettings: EventWebPageSettings = {
  pageTitle: 'Mi Evento Especial',
  heroSubtitle: '¡Una celebración inolvidable!',
  welcomeMessage: '¡Bienvenidos a la celebración de nuestro evento!',
  coverImageUrl: '',
  galleryImageUrls: [],
  showCountdown: true,
  ourStoryTitle: 'Nuestra Historia',
  ourStoryText: 'Un breve relato de cómo llegamos hasta aquí...',
  ourStoryImageUrl: '',
  showOurStory: true,
  eventDetailsTitle: 'Detalles del Evento',
  eventDetailsText: 'Fecha, hora, lugar y más información importante.',
  showEventDetails: true,
  dressCodeText: 'Elegante Sport',
  showDressCode: false,
  giftRegistryTitle: 'Lista de Regalos',
  giftRegistryText: 'Tu presencia es nuestro mejor regalo. Si deseas obsequiarnos algo, aquí algunas ideas...',
  showGiftRegistry: false,
  showGallery: true,
  showRsvp: true,
};

export const defaultMusicaFiesta: MusicaFiesta = {
  cancionEntrada: '',
  cancionVals: '',
  playlistFiesta: '',
  listaNoReproducir: '',
};

export const initialFiestaActualData: FiestaEnPlanificacion = {
  id: `fiesta_${Date.now()}`, 
  configuracion: { ...defaultConfiguracion },
  personalAsignado: [],
  menuAsignadoId: undefined,
  presupuestoId: undefined,
  invoiceIds: [],
  reuniones: [],
  salonLayout: { ...defaultSalonLayout, elements: [] },
  tareas: [...baseDefaultTareas.map(t => ({...t, id: `task_${Date.now()}_${Math.random().toString(36).substring(2,9)}`}))],
  decoracion: {
    ...defaultDecoracion,
    items: [],
    paletaColores: { ...defaultColorPalette }
  },
  invitados: [],
  webPageSettings: { ...defaultWebPageSettings, galleryImageUrls: [] },
  musica: { ...defaultMusicaFiesta },
};
