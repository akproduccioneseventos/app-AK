
import type { FiestaEnPlanificacion, ConfigEventoDataStorage, Tarea, DecoracionData, ColorPalette, EventWebPageSettings, ClientPortalSettings, SocialGallerySettings, MusicaFiesta, ZonaContratada, ReposteriaData, ReposteriaCategoria, BebidasData, BebidaCategoria, ListaDeCargaOperativa, GestionCostosData, GiftItem, LayoutElement, ClientTarea, ProgramaEventoItem, TareaAsignadaA, FotografiaYFilmacionData, BebidasConsumoConfig, TipoAsistente, ReposteriaConsumoConfig, OtroDocumento, VideoVidaData, BebidaReceta } from '@/types/fiesta';

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
  { texto: 'Definir lista de invitados', completada: false, descripcion: 'Crear borrador inicial de la lista de invitados y estimar cantidad final.', horaVencimiento: undefined, recordatorio: undefined, esPredeterminada: false, asignadaA: 'Organizador' },
  { texto: 'Seleccionar catering y menú', completada: false, descripcion: 'Contactar proveedores de catering, degustar opciones y definir el menú.', horaVencimiento: undefined, recordatorio: undefined, esPredeterminada: false, asignadaA: 'Organizador' },
  { texto: 'Contratar DJ o música', completada: false, descripcion: 'Buscar y contratar DJ, banda o sistema de sonido.', horaVencimiento: undefined, recordatorio: undefined, esPredeterminada: false, asignadaA: 'Organizador' },
  { texto: 'Elegir decoración y temática', completada: false, descripcion: 'Definir el estilo, colores y elementos decorativos principales.', horaVencimiento: undefined, recordatorio: undefined, esPredeterminada: false, asignadaA: 'Organizador' },
  { texto: 'Enviar invitaciones', completada: false, descripcion: 'Diseñar, imprimir y enviar las invitaciones físicas o digitales.', horaVencimiento: undefined, recordatorio: undefined, esPredeterminada: false, asignadaA: 'Cliente' },
];

export const defaultClientChecklist: Omit<ClientTarea, 'id'>[] = [
    { texto: 'Confirmar lista final de invitados', asignadaA: 'Cliente', completada: false },
    { texto: 'Elegir el diseño de la torta', asignadaA: 'Cliente', completada: false },
    { texto: 'Proporcionar lista de canciones especiales', asignadaA: 'Cliente', completada: false },
    { texto: 'Revisar y aprobar el presupuesto final', asignadaA: 'Organizador', completada: false },
];

export const defaultPrograma: ProgramaEventoItem[] = [
  { id: 'prog_1', hora: '22:00', titulo: 'Comienzo', descripcion: 'Recepción de invitados con música suave.', icono: 'PartyPopper' },
  { id: 'prog_2', hora: '22:15', titulo: 'Servicio de Entrada 1', descripcion: 'Se sirve la primera tanda de bocaditos.', icono: 'Utensils' },
  { id: 'prog_3', hora: '22:30', titulo: 'Entrada de la Quinceañera y Vals', descripcion: 'Momento emotivo principal.', icono: 'Diamond' },
  { id: 'prog_4', hora: '22:45', titulo: 'Servicio de Entrada 2', descripcion: 'Segunda tanda de bocaditos.', icono: 'Utensils' },
  { id: 'prog_5', hora: '00:00', titulo: '¡A Bailar!', descripcion: 'Se abre la pista de baile.', icono: 'Music' },
  { id: 'prog_6', hora: '01:00', titulo: 'Cena / Cierre de Barra', descripcion: 'Se sirve el plato principal. La barra se cierra temporalmente.', icono: 'Utensils' },
  { id: 'prog_7', hora: '01:45', titulo: 'Video de Vida', descripcion: 'Proyección del video emotivo.', icono: 'Camera' },
  { id: 'prog_8', hora: '02:00', titulo: 'Reapertura de Barra y Baile', descripcion: 'Continúa la fiesta.', icono: 'GlassWater' },
  { id: 'prog_9', hora: '02:30', titulo: 'Plataforma 360 / Fotocabina', descripcion: 'Activación de entretenimiento fotográfico.', icono: 'Camera' },
  { id: 'prog_10', hora: '03:00', titulo: 'Cotillón', descripcion: 'Reparto de cotillón para el carnaval carioca.', icono: 'Sparkles' },
  { id: 'prog_11', hora: '03:45', titulo: 'Fuente de Chocolate', descripcion: 'Se habilita la mesa de postres o fuente de chocolate.', icono: 'CakeSlice' },
  { id: 'prog_12', hora: '04:00', titulo: 'Apagado de Velas y Torta', descripcion: 'Momento de cantar y cortar la torta.', icono: 'CakeSlice' },
  { id: 'prog_13', hora: '05:00', titulo: 'Final de la Fiesta', descripcion: 'Cierre del evento.', icono: 'Clock' },
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
  showOurStory: false, // Default OFF
  eventDetailsTitle: 'Detalles del Evento',
  eventDetailsText: 'Fecha, hora, lugar y más información importante.',
  showEventDetails: true,
  dressCodeText: 'Elegante Sport',
  showDressCode: false, // Default OFF
  giftRegistryTitle: 'Lista de Regalos',
  giftRegistryText: 'Tu presencia es nuestro mejor regalo. Si deseas obsequiarnos algo, aquí algunas ideas...',
  showGiftRegistry: false, // Default OFF
  giftRegistry: [],
  showRsvp: true,
  showPrograma: false, // Default OFF
  musicaEspecialText: '',
  showGallery: false, // Default OFF
};

export const defaultClientPortalSettings: ClientPortalSettings = {
  enabled: false,
  accessKey: '',
  checklist: { visible: false, editable: false },
  itinerario: { visible: false },
  musica: { visible: false, editable: false },
  videoVida: { visible: true, editable: true },
  listaRegalos: { visible: false },
  documentos: { visible: true },
  notasCliente: { visible: false, editable: true },
  invitados: { visible: true },
  paginaPublica: { visible: true },
  fotografiaYFilmacion: { visible: true },
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

export const defaultReposteriaConsumoConfig: ReposteriaConsumoConfig = {
  tortas_personalizadas: { adulto: 0.1, adolescente: 0.1, nino: 0.08 }, // kg por persona
  cupcakes_minitortas: { adulto: 1.5, adolescente: 2, nino: 1 }, // unidades por persona
  candy_bar: { adulto: 1, adolescente: 1.5, nino: 2 }, // porción/100gr por persona
  fuente_chocolate: { adulto: 1, adolescente: 1, nino: 1 }, // porción por persona
  mesa_dulce_tradicional: { adulto: 2, adolescente: 2, nino: 1.5 }, // porciones por persona
  mesa_helada: { adulto: 1, adolescente: 1.5, nino: 1.5 }, // porciones por persona
  postres_individuales: { adulto: 1.5, adolescente: 1.5, nino: 1 }, // unidades por persona
};

export const defaultReposteriaData: ReposteriaData = {
  categorias: JSON.parse(JSON.stringify(defaultReposteriaCategorias)),
  consumoConfig: JSON.parse(JSON.stringify(defaultReposteriaConsumoConfig)),
  notasGenerales: '',
};

export const defaultBebidasCategorias: BebidaCategoria[] = [
  { id: 'coctel_bienvenida', nombreDisplay: 'Cóctel de Bienvenida', activada: true, items: [], recetas: [
    {
      id: 'receta_coctel_100p', nombre: 'Coctel 100 Personas - 50 Litros', capacidadBaseLt: 50, porcionesBase: 100, costoTotalReceta: 2910,
      ingredientes: [
        { id: 'ing_1', insumoId: '', nombreInsumo: 'Jugo de Naranja', cantidad: 6000, unidad: 'ml', costoUnitario: 0.04, costoTotal: 240 },
        { id: 'ing_2', insumoId: '', nombreInsumo: 'Banana', cantidad: 5000, unidad: 'g', costoUnitario: 0.05, costoTotal: 250 },
        { id: 'ing_3', insumoId: '', nombreInsumo: 'Otra fruta (mix)', cantidad: 2000, unidad: 'g', costoUnitario: 0.07, costoTotal: 140 },
        { id: 'ing_4', insumoId: '', nombreInsumo: 'Agua', cantidad: 25000, unidad: 'ml', costoUnitario: 0, costoTotal: 0 },
        { id: 'ing_5', insumoId: '', nombreInsumo: 'Durazno en lata', cantidad: 4, unidad: 'lata', costoUnitario: 100, costoTotal: 400 },
        { id: 'ing_6', insumoId: '', nombreInsumo: 'Ananá en lata', cantidad: 2, unidad: 'lata', costoUnitario: 140, costoTotal: 280 },
        { id: 'ing_7', insumoId: '', nombreInsumo: 'Vino rosado dulce', cantidad: 3, unidad: 'botella', costoUnitario: 100, costoTotal: 300 },
        { id: 'ing_8', insumoId: '', nombreInsumo: 'Vino blanco dulce', cantidad: 3, unidad: 'botella', costoUnitario: 130, costoTotal: 390 },
        { id: 'ing_9', insumoId: '', nombreInsumo: 'Jugo rinde 2', cantidad: 6, unidad: 'sobre', costoUnitario: 18, costoTotal: 108 },
        { id: 'ing_10', insumoId: '', nombreInsumo: 'Azúcar', cantidad: 3, unidad: 'kg', costoUnitario: 65, costoTotal: 195 },
        { id: 'ing_11', insumoId: '', nombreInsumo: 'Sidra 750ml', cantidad: 3, unidad: 'botella', costoUnitario: 69, costoTotal: 207 },
        { id: 'ing_12', insumoId: '', nombreInsumo: 'Licor de Frutilla', cantidad: 0.5, unidad: 'lt', costoUnitario: 400, costoTotal: 200 },
        { id: 'ing_13', insumoId: '', nombreInsumo: 'Licor de Durazno', cantidad: 0.5, unidad: 'lt', costoUnitario: 400, costoTotal: 200 },
      ]
    }
  ], descripcion: 'El cóctel especial que se sirve al recibir a los invitados.' },
  { id: 'refrescos_gaseosas', nombreDisplay: 'Refrescos / Gaseosas', activada: false, items: [], descripcion: 'Variedad de bebidas carbonatadas.' },
  { id: 'jugos', nombreDisplay: 'Jugos Naturales y Envasados', activada: false, items: [], descripcion: 'Opciones frutales y refrescantes.' },
  { id: 'aguas_saborizadas', nombreDisplay: 'Aguas Saborizadas y Minerales', activada: false, items: [], descripcion: 'Con y sin gas, opciones saborizadas.' },
  { id: 'cervezas', nombreDisplay: 'Cervezas', activada: false, items: [], descripcion: 'Variedad de cervezas nacionales e importadas.' },
  { id: 'vinos_espumantes', nombreDisplay: 'Vinos y Espumantes', activada: false, items: [], descripcion: 'Selección de tintos, blancos, rosados y espumosos.' },
  { id: 'barra_tragos', nombreDisplay: 'Barra de Tragos', activada: false, items: [], recetas: [], descripcion: 'Cócteles con y sin alcohol preparados al momento.' },
  { id: 'cafeteria', nombreDisplay: 'Servicio de Cafetería', activada: false, items: [], descripcion: 'Café, té, infusiones.' },
];

export const defaultBebidasConsumoConfig: BebidasConsumoConfig = {
  coctel_bienvenida: { adulto: 0.5, adolescente: 0.5, nino: 0.3 }, // Litros por persona total
  refrescos_gaseosas: { adulto: 0.2, adolescente: 0.3, nino: 0.25 },
  jugos: { adulto: 0.1, adolescente: 0.15, nino: 0.15 },
  aguas_saborizadas: { adulto: 0.15, adolescente: 0.1, nino: 0.1 },
  cervezas: { adulto: 0.4, adolescente: 0.0, nino: 0.0 },
  vinos_espumantes: { adulto: 0.3, adolescente: 0.0, nino: 0.0 },
  barra_tragos: { adulto: 0.2, adolescente: 0.0, nino: 0.0 },
  cafeteria: { adulto: 0.05, adolescente: 0.0, nino: 0.0 },
};

export const defaultBebidasData: BebidasData = {
  categorias: JSON.parse(JSON.stringify(defaultBebidasCategorias)),
  consumoConfig: JSON.parse(JSON.stringify(defaultBebidasConsumoConfig)),
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
  galleryEnabled: true,
  photosUploaded: false,
  songSuggestion: '',
  customText: '',
  photoCount: 50,
};

export const defaultFotografiaYFilmacionData: FotografiaYFilmacionData = {
    estadoEntrega: 'Pendiente',
    recibidoPorCliente: false,
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
    asignadaA: t.asignadaA || 'Organizador',
   }))],
  clientChecklist: [...defaultClientChecklist.map(t => ({ ...t, id: `client_task_${Date.now()}_${Math.random().toString(36).substring(2,9)}` }))],
  clientNotes: '',
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
  fotografiaYFilmacion: { ...defaultFotografiaYFilmacionData },
  
  // New flexible document storage
  otrosDocumentos: [],
  // New provider payment tracking
  pagosProveedores: [],
};
