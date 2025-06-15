
// src/lib/fiesta-defaults.ts
import type { FiestaEnPlanificacion, ConfigEventoDataStorage, Tarea, DecoracionData, ColorPalette, EventWebPageSettings, MusicaFiesta, ZonaContratada, ReposteriaData, ReposteriaCategoria, BebidasData, BebidaCategoria, LayoutElement } from '@/types/fiesta';

export const defaultConfiguracion: ConfigEventoDataStorage = {
  nombreEvento: 'Mi Próximo Evento Increíble',
  tipoCelebracion: 'Cumpleaños',
  fechaEvento: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()).toISOString(),
  horaInicio: '19:00',
  horaFin: '02:00',
  nombreLugar: 'Salón de Ensueño',
  invitadosEstimados: 50,
  presupuestoEstimado: 100000,
  notasAdicionales: 'Planificación inicial.',
  clienteId: undefined,
};

export const baseDefaultTareas: Omit<Tarea, 'id'>[] = [
  { texto: 'Definir lista de invitados', completada: false, descripcion: 'Crear borrador inicial de la lista de invitados y estimar cantidad final.', horaVencimiento: undefined, recordatorio: undefined, esPredeterminada: false },
  { texto: 'Seleccionar catering y menú', completada: false, descripcion: 'Contactar proveedores de catering, degustar opciones y definir el menú.', horaVencimiento: undefined, recordatorio: undefined, esPredeterminada: false },
  { texto: 'Contratar DJ o música', completada: false, descripcion: 'Buscar y contratar DJ, banda o sistema de sonido.', horaVencimiento: undefined, recordatorio: undefined, esPredeterminada: false },
  { texto: 'Elegir decoración y temática', completada: false, descripcion: 'Definir el estilo, colores y elementos decorativos principales.', horaVencimiento: undefined, recordatorio: undefined, esPredeterminada: false },
  { texto: 'Enviar invitaciones', completada: false, descripcion: 'Diseñar, imprimir y enviar las invitaciones físicas o digitales.', horaVencimiento: undefined, recordatorio: undefined, esPredeterminada: false },
];

export const tareasPredeterminadasEjemplo: Pick<Tarea, 'texto' | 'descripcion' | 'esPredeterminada'>[] = [
  { texto: 'Confirmar catering y menú final', descripcion: 'Llamar al proveedor de catering para confirmar el número final de comensales y el menú seleccionado.', esPredeterminada: true },
  { texto: 'Contratar fotógrafo y videógrafo', descripcion: 'Investigar, seleccionar y firmar contrato con los servicios de fotografía y video.', esPredeterminada: true },
  { texto: 'Preparar playlist de música', descripcion: 'Crear o seleccionar listas de reproducción para los diferentes momentos del evento.', esPredeterminada: true },
  { texto: 'Coordinar entrada de homenajeado/novios', descripcion: 'Planificar la música, el momento y los detalles de la entrada principal.', esPredeterminada: true },
  { texto: 'Cargar presupuesto final y realizar pagos', descripcion: 'Actualizar el presupuesto con todos los costos finales y efectuar los pagos pendientes.', esPredeterminada: true },
  { texto: 'Confirmar diseño de decoración y globos', descripcion: 'Revisar y aprobar con el decorador los arreglos florales, globos y otros elementos.', esPredeterminada: true },
  { texto: 'Comprar bebidas y hielo', descripcion: 'Realizar la compra de bebidas no alcohólicas, alcohólicas (si aplica) y hielo suficiente.', esPredeterminada: true },
  { texto: 'Definir cronograma del evento', descripcion: 'Establecer un horario detallado para cada actividad y momento importante de la fiesta.', esPredeterminada: true },
  { texto: 'Prueba de peinado y maquillaje', descripcion: 'Agendar y realizar la prueba de peinado y maquillaje para la/el protagonista.', esPredeterminada: true },
  { texto: 'Recoger traje/vestido', descripcion: 'Coordinar la prueba final y recogida del atuendo principal.', esPredeterminada: true },
];


export const defaultColorPalette: ColorPalette = {
  primary: '#D9B8FF', // Lila pastel
  secondary: '#FCD3DE', // Rosa pastel
  accent: '#F0E6CC', // Crema/Beige claro
};

export const defaultZonasContratadas: ZonaContratada[] = [
  { id: 'atras_torta', nombreDisplay: 'Atrás de la torta', activada: false, descripcion: '', imagenReferenciaUrl: '', dataAiHint: 'cake backdrop' },
  { id: 'frente_salon', nombreDisplay: 'Frente del salón / Entrada principal', activada: false, descripcion: '', imagenReferenciaUrl: '', dataAiHint: 'event entrance' },
  { id: 'zona_regalos', nombreDisplay: 'Zona de regalos', activada: false, descripcion: '', imagenReferenciaUrl: '', dataAiHint: 'gift table' },
  { id: 'zona_fotografia', nombreDisplay: 'Zona de fotografía / Photocall', activada: false, descripcion: '', imagenReferenciaUrl: '', dataAiHint: 'photo booth' },
  { id: 'centro_salon', nombreDisplay: 'Centro del salón / Ambientación general', activada: false, descripcion: '', imagenReferenciaUrl: '', dataAiHint: 'event hall center' },
];

export const defaultDecoracion: DecoracionData = {
  tema: 'Elegante y Moderno',
  paletaColores: { ...defaultColorPalette },
  moodboardImageUrl: '',
  colorCubremantel: '',
  colorGlobos: '', // Nuevo
  decoracionTorta: { descripcion: '', imageUrl: '', dataAiHint: 'cake design' },
  items: [],
  zonasContratadas: JSON.parse(JSON.stringify(defaultZonasContratadas)),
  generalNotesDecoracion: "Detalles pendientes de definir: colores, cubre mantel, decoración torta, centros de mesa, etc.",
  pdfNotasAdicionales: '',
  salonPlanBackgroundImageUrl: '', // fusionado de SalonLayoutData
  salonElements: [],               // fusionado de SalonLayoutData
  generalNotesSalonLayout: 'Disposición estándar del salón, ajustar según necesidad.', // fusionado de SalonLayoutData
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

// Defaults para Repostería
export const defaultReposteriaCategorias: ReposteriaCategoria[] = [
  { id: 'tortas_personalizadas', nombreDisplay: 'Tortas Personalizadas', activada: false, items: [], descripcion: 'Diseño y sabores a medida.', cantidadEstimadaPersonas: 0 },
  { id: 'cupcakes_minitortas', nombreDisplay: 'Cupcakes / Mini Tortas', activada: false, items: [], descripcion: 'Pequeñas delicias individuales.', cantidadEstimadaPersonas: 0 },
  { id: 'candy_bar', nombreDisplay: 'Candy Bar Temático', activada: false, items: [], descripcion: 'Mesa de dulces y golosinas variadas.', cantidadEstimadaPersonas: 0 },
  { id: 'fuente_chocolate', nombreDisplay: 'Fuente de Chocolate', activada: false, items: [], descripcion: 'Con frutas, malvaviscos y más.', cantidadEstimadaPersonas: 0 },
  { id: 'mesa_dulce_tradicional', nombreDisplay: 'Mesa Dulce Tradicional', activada: false, items: [], descripcion: 'Variedad de postres clásicos.', cantidadEstimadaPersonas: 0 },
  { id: 'mesa_helada', nombreDisplay: 'Mesa Helada', activada: false, items: [], descripcion: 'Selección de helados y toppings.', cantidadEstimadaPersonas: 0 },
  { id: 'postres_individuales', nombreDisplay: 'Postres Individuales', activada: false, items: [], descripcion: 'Porciones individuales de postres variados.', cantidadEstimadaPersonas: 0 },
];

export const defaultReposteriaData: ReposteriaData = {
  categorias: JSON.parse(JSON.stringify(defaultReposteriaCategorias)),
  notasGenerales: '',
};

// Defaults para Bebidas
export const defaultBebidasCategorias: BebidaCategoria[] = [
  { id: 'refrescos_gaseosas', nombreDisplay: 'Refrescos / Gaseosas', activada: false, items: [], descripcion: 'Variedad de bebidas carbonatadas.' },
  { id: 'jugos', nombreDisplay: 'Jugos Naturales y Envasados', activada: false, items: [], descripcion: 'Opciones frutales y refrescantes.' },
  { id: 'aguas_saborizadas', nombreDisplay: 'Aguas Saborizadas y Minerales', activada: false, items: [], descripcion: 'Con y sin gas, opciones saborizadas.' },
  { id: 'bebidas_alcoholicas_varias', nombreDisplay: 'Bebidas Alcohólicas Varias', activada: false, items: [], descripcion: 'Licores, aperitivos, etc.' },
  { id: 'vinos_espumantes', nombreDisplay: 'Vinos y Espumantes', activada: false, items: [], descripcion: 'Selección de tintos, blancos, rosados y espumosos.' },
  { id: 'barra_tragos', nombreDisplay: 'Barra de Tragos', activada: false, items: [], descripcion: 'Cócteles con y sin alcohol preparados al momento.' },
  { id: 'cafeteria', nombreDisplay: 'Servicio de Cafetería', activada: false, items: [], descripcion: 'Café, té, infusiones.' },
];

export const defaultBebidasData: BebidasData = {
  categorias: JSON.parse(JSON.stringify(defaultBebidasCategorias)),
  tipoEventoAjuste: 'mixto_estandar',
  notasGenerales: '',
};


export const initialFiestaActualData: FiestaEnPlanificacion = {
  id: `fiesta_${Date.now()}`,
  configuracion: { ...defaultConfiguracion },
  personalAsignado: [],
  menuAsignadoId: undefined,
  presupuestoId: undefined,
  invoiceIds: [],
  reuniones: [],
  tareas: [...baseDefaultTareas.map(t => ({
    ...t,
    id: `task_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
    descripcion: t.descripcion || undefined,
    horaVencimiento: t.horaVencimiento || undefined,
    recordatorio: t.recordatorio || undefined,
    esPredeterminada: t.esPredeterminada || false,
   }))],
  decoracion: { // Contiene ahora todos los campos de decoración y layout
    ...defaultDecoracion, // Esto ya incluye salonPlanBackgroundImageUrl, salonElements, etc.
    items: [],
    paletaColores: { ...defaultColorPalette },
    zonasContratadas: JSON.parse(JSON.stringify(defaultZonasContratadas)),
  },
  invitados: [],
  webPageSettings: { ...defaultWebPageSettings, galleryImageUrls: [] },
  musica: { ...defaultMusicaFiesta },
  reposteria: { ...defaultReposteriaData, categorias: JSON.parse(JSON.stringify(defaultReposteriaCategorias)) },
  bebidas: { ...defaultBebidasData, categorias: JSON.parse(JSON.stringify(defaultBebidasCategorias)) },
};

    
