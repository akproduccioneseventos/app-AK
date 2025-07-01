
import type { FiestaEnPlanificacion, ConfigEventoDataStorage, Tarea, DecoracionData, ColorPalette, EventWebPageSettings, ClientPortalSettings, SocialGallerySettings, MusicaFiesta, ZonaContratada, ReposteriaData, ReposteriaCategoria, BebidasData, BebidaCategoria, ListaDeCargaOperativa, GestionCostosData, VideoVidaData, GiftItem, LayoutElement, ClientTarea, ProgramaEventoItem } from '@/types/fiesta';

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

export const defaultClientChecklist: Omit<ClientTarea, 'id'>[] = [
    { texto: 'Confirmar lista final de invitados', asignadaA: 'Cliente', completada: false },
    { texto: 'Elegir el diseño de la torta', asignadaA: 'Cliente', completada: false },
    { texto: 'Proporcionar lista de canciones especiales', asignadaA: 'Cliente', completada: false },
    { texto: 'Revisar y aprobar el presupuesto final', asignadaA: 'Organizador', completada: false },
];

export const defaultPrograma: ProgramaEventoItem[] = [
  { id: 'prog_1', hora: '20:00', titulo: 'Recepción de Invitados', descripcion: 'Música suave y cóctel de bienvenida.', icono: 'GlassWater' },
  { id: 'prog_2', hora: '21:00', titulo: 'Entrada Principal', descripcion: 'Entrada de los agasajados al salón.', icono: 'Sparkles' },
  { id: 'prog_3', hora: '21:30', titulo: 'Cena', descripcion: 'Servicio de plato principal.', icono: 'Utensils' },
  { id: 'prog_4', hora: '23:00', titulo: '¡A Bailar!', descripcion: 'Se abre la pista de baile.', icono: 'Music' },
  { id: 'prog_5', hora: '00:30', titulo: 'Corte de Torta y Brindis', descripcion: 'Momento especial con la torta y el brindis.', icono: 'CakeSlice' },
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

export const defaultGiftItems: Omit<GiftItem, 'id' | 'isClaimed'>[] = [
    { name: 'Noche de hotel', description: 'Una noche de relax en un hotel especial.', imageUrl: 'https://placehold.co/200x150.png', dataAiHint: 'hotel room' },
    { name: 'Cena para dos', description: 'Una cena romántica en nuestro restaurante favorito.', imageUrl: 'https://placehold.co/200x150.png', dataAiHint: 'romantic dinner' },
    { name: 'Set de Copas de Vino', description: 'Un elegante set de copas para brindar en ocasiones especiales.', imageUrl: 'https://placehold.co/200x150.png', dataAiHint: 'wine glasses' },
    { name: 'Electrodoméstico para la cocina', description: 'Una ayuda moderna para nuestro día a día en la cocina.', imageUrl: 'https://placehold.co/200x150.png', dataAiHint: 'kitchen appliance' },
    { name: 'Aporte para la Luna de Miel', description: '¡Ayúdanos a hacer nuestro viaje de bodas inolvidable!', imageUrl: 'https://placehold.co/200x150.png', dataAiHint: 'honeymoon travel' },
    { name: 'Día de Spa', description: 'Un día completo de masajes y relajación para dos.', imageUrl: 'https://placehold.co/200x150.png', dataAiHint: 'spa day' },
];

export const defaultDecoracion: DecoracionData = {
  tema: 'Elegante y Moderno',
  paletaColores: { ...defaultColorPalette },
  moodboardImageUrl: '',
  colorCubremantel: '',
  colorGlobos: '',
  decoracionTorta: { descripcion: '', imageUrl: '', dataAiHint: 'cake design' },
  items: [],
  zonasContratadas: JSON.parse(JSON.stringify(defaultZonasContratadas)),
  generalNotesDecoracion: "Detalles pendientes de definir: colores, cubre mantel, decoración torta, centros de mesa, etc.",
  pdfNotasAdicionales: '',
  salonWidth: 800,
  salonHeight: 600,
  salonPlanBackgroundImageUrl: '',
  salonElements: [],
  generalNotesSalonLayout: 'Disposición estándar del salón, ajustar según necesidad.',
  layoutMode: 'libre',
  guestNameStyle: 'full',
  guestIconStyle: 'color',
  layoutTemplateName: '',
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
  giftRegistry: [],
  showRsvp: true,
  showPrograma: true,
  musicaEspecialText: '',
  showGallery: true,
};

export const defaultClientPortalSettings: ClientPortalSettings = {
  enabled: true,
  accessKey: '',
  checklist: { visible: true, editable: true },
  itinerario: { visible: true, editable: false },
  musica: { visible: true, editable: true },
  videoVida: { visible: true, editable: true },
  listaRegalos: { visible: true, editable: false },
  documentos: { visible: true, editable: false },
  notasCliente: { visible: true, editable: true },
};

export const defaultSocialGallerySettings: SocialGallerySettings = {
  enabled: false,
  allowLikes: true,
  allowComments: true,
  uploadsActive: true,
};

export const defaultMusicaFiesta: MusicaFiesta = {
  cancionEntrada: '',
  cancionVals: '',
  cancionesTortaBrindis: [],
  playlistFiesta: '',
  listaNoReproducir: '',
};

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

export const defaultBebidasCategorias: BebidaCategoria[] = [
  { id: 'refrescos_gaseosas', nombreDisplay: 'Refrescos / Gaseosas', activada: false, items: [], descripcion: 'Variedad de bebidas carbonatadas.', consumoEstimadoPorPersona: { formal: 0.5, juvenil: 1.5, corporativo: 0.75, mixto_estandar: 1.0 } },
  { id: 'jugos', nombreDisplay: 'Jugos Naturales y Envasados', activada: false, items: [], descripcion: 'Opciones frutales y refrescantes.', consumoEstimadoPorPersona: { formal: 0.25, juvenil: 0.5, corporativo: 0.3, mixto_estandar: 0.4 } },
  { id: 'aguas_saborizadas', nombreDisplay: 'Aguas Saborizadas y Minerales', activada: false, items: [], descripcion: 'Con y sin gas, opciones saborizadas.', consumoEstimadoPorPersona: { formal: 0.75, juvenil: 0.5, corporativo: 1.0, mixto_estandar: 0.6 } },
  { id: 'bebidas_alcoholicas_varias', nombreDisplay: 'Bebidas Alcohólicas Varias', activada: false, items: [], descripcion: 'Licores, aperitivos, etc.', consumoEstimadoPorPersona: { formal: 0.4, juvenil: 0.2, corporativo: 0.3, mixto_estandar: 0.3 } },
  { id: 'vinos_espumantes', nombreDisplay: 'Vinos y Espumantes', activada: false, items: [], descripcion: 'Selección de tintos, blancos, rosados y espumosos.', consumoEstimadoPorPersona: { formal: 0.5, juvenil: 0.1, corporativo: 0.4, mixto_estandar: 0.3 } },
  { id: 'barra_tragos', nombreDisplay: 'Barra de Tragos', activada: false, items: [], descripcion: 'Cócteles con y sin alcohol preparados al momento.', consumoEstimadoPorPersona: { formal: 0.8, juvenil: 1.0, corporativo: 0.6, mixto_estandar: 0.9 } },
  { id: 'cafeteria', nombreDisplay: 'Servicio de Cafetería', activada: false, items: [], descripcion: 'Café, té, infusiones.', consumoEstimadoPorPersona: { formal: 0.2, juvenil: 0.1, corporativo: 0.5, mixto_estandar: 0.2 } },
];

export const defaultBebidasData: BebidasData = {
  categorias: JSON.parse(JSON.stringify(defaultBebidasCategorias)),
  tipoEventoAjuste: 'mixto_estandar',
  notasGenerales: '',
};

export const defaultListaDeCargaOperativa: ListaDeCargaOperativa = {
  categorias: [],
  notasGenerales: '',
};

export const initialGestionCostosData: GestionCostosData = {
  costosItems: [],
  ingresosTotalesEstimados: 0,
  notasGeneralesCostos: '',
};

export const defaultVideoVidaData: VideoVidaData = {
  galleryEnabled: false,
  photosUploaded: false,
  uploadDate: undefined,
  songSuggestion: '',
  customText: '',
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
  clientChecklist: [...defaultClientChecklist.map(t => ({ ...t, id: `client_task_${Date.now()}_${Math.random().toString(36).substring(2,9)}` }))],
  decoracion: {
    ...defaultDecoracion,
    items: [],
    paletaColores: { ...defaultColorPalette },
    zonasContratadas: JSON.parse(JSON.stringify(defaultZonasContratadas)),
  },
  invitados: [],
  webPageSettings: { ...defaultWebPageSettings, galleryImageUrls: [], giftRegistry: [] },
  clientPortalSettings: { ...defaultClientPortalSettings },
  socialGallerySettings: { ...defaultSocialGallerySettings },
  musica: { ...defaultMusicaFiesta, cancionesTortaBrindis: [] },
  reposteria: { ...defaultReposteriaData, categorias: JSON.parse(JSON.stringify(defaultReposteriaCategorias)) },
  bebidas: { ...defaultBebidasData, categorias: JSON.parse(JSON.stringify(defaultBebidasCategorias)) },
  listaDeCargaOperativa: { ...defaultListaDeCargaOperativa },
  gestionCostos: { ...initialGestionCostosData },
  videoVida: { ...defaultVideoVidaData },
  programa: [...defaultPrograma.map(p => ({ ...p, id: `prog_${Date.now()}_${Math.random().toString(36).substring(2,9)}` }))],
};
