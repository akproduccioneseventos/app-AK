
import type {
  FiestaEnPlanificacion,
  ConfigEventoDataStorage,
  DecoracionData,
  ClientPortalSettings,
  SocialGallerySettings,
  MusicaFiesta,
  ReposteriaData,
  BebidasData,
  ListaDeCargaOperativa,
  GestionCostosData,
  VideoVidaData,
  ProgramaEventoItem,
  FotografiaYFilmacionData,
  OtroDocumento,
  PagoProveedor,
  InvitacionDigitalData,
  SeccionInvitacion,
  DetalleEventoEspecifico,
  TextWithStyle,
  GiftItem,
} from '@/types/fiesta';

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

export const defaultClientPortalSettings: ClientPortalSettings = {
    enabled: false, accessKey: '', checklist: { visible: false, editable: false }, itinerario: { visible: false },
    musica: { visible: false, editable: false }, videoVida: { visible: true, editable: true }, listaRegalos: { visible: false },
    documentos: { visible: true }, notasCliente: { visible: false, editable: true }, invitados: { visible: true },
    paginaPublica: { visible: true }, fotografiaYFilmacion: { visible: true }
};

export const defaultZonasContratadas: ZonaContratada[] = [
    { id: 'atras_torta', nombreDisplay: 'Atrás de la torta', activada: false, dataAiHint: 'cake backdrop' },
    { id: 'frente_salon', nombreDisplay: 'Frente del salón / Entrada principal', activada: false, dataAiHint: 'event entrance' },
    { id: 'zona_regalos', nombreDisplay: 'Zona de regalos', activada: false, dataAiHint: 'gift table' },
    { id: 'zona_fotografia', nombreDisplay: 'Zona de fotografía / Photocall', activada: false, dataAiHint: 'photo booth' },
    { id: 'centro_salon', nombreDisplay: 'Centro del salón / Ambientación general', activada: false, dataAiHint: 'event hall center' },
];

export const defaultDecoracion: DecoracionData = {
    tema: 'Elegante y Moderno', paletaColores: { primary: '#D9B8FF', secondary: '#FCD3DE', accent: '#F0E6CC' },
    decoracionTorta: { dataAiHint: 'cake design' }, items: [], zonasContratadas: defaultZonasContratadas, generalNotesDecoracion: 'Detalles pendientes de definir: colores, cubre mantel, decoración torta, centros de mesa, etc.',
    salonWidth: 800, salonHeight: 600, salonElements: [], generalNotesSalonLayout: 'Disposición estándar del salón, ajustar según necesidad.', layoutMode: 'libre', guestNameStyle: 'full', guestIconStyle: 'color'
};

export const defaultReposteriaData: ReposteriaData = {
    categorias: [
        { id: 'mesa_postres', nombreDisplay: 'Mesa de Postres', activada: false, items: [], descripcion: "Variedad de postres clásicos y modernos." },
        { id: 'candy_bar', nombreDisplay: 'Candy Bar Temático', activada: false, items: [], descripcion: "Mesa de dulces y golosinas variadas." },
        { id: 'fuente_chocolate', nombreDisplay: 'Fuente de Chocolate', activada: false, items: [], descripcion: "Con frutas, malvaviscos y más." },
        { id: 'mesa_helada', nombreDisplay: 'Mesa Helada', activada: false, items: [], descripcion: "Selección de helados y toppings." }
    ], notasGenerales: ''
};

export const defaultBebidasData: BebidasData = {
    categorias: [
        { id: 'coctel_bienvenida', nombreDisplay: 'Cóctel de Bienvenida', activada: true, items: [], recetas: [], descripcion: 'El cóctel especial que se sirve al recibir a los invitados.' },
        { id: 'refrescos_gaseosas', nombreDisplay: 'Refrescos / Gaseosas', activada: false, items: [], descripcion: 'Variedad de bebidas carbonatadas.' },
        { id: 'jugos', nombreDisplay: 'Mesa de jugos naturales', activada: false, items: [], descripcion: 'Opciones frutales y refrescantes.' },
        { id: 'aguas_saborizadas', nombreDisplay: 'Aguas Saborizadas y Minerales', activada: false, items: [], descripcion: 'Con y sin gas, opciones saborizadas.' },
        { id: 'cervezas', nombreDisplay: 'Cervezas', activada: false, items: [], descripcion: 'Variedad de cervezas nacionales e importadas.' },
        { id: 'vinos_espumantes', nombreDisplay: 'Vinos y Espumantes', activada: false, items: [], descripcion: 'Selección de tintos, blancos, rosados y espumosos.' },
        { id: 'barra_tragos', nombreDisplay: 'Barra de Tragos', activada: false, items: [], recetas: [], descripcion: 'Bebidas blancas y licores para la barra.' },
        { id: 'cafeteria', nombreDisplay: 'Servicio de Cafetería', activada: false, items: [], descripcion: 'Café, té, infusiones.' }
    ], notasGenerales: ''
};


export const defaultGestionCostos: GestionCostosData = {
  costosItems: [],
  ingresosTotalesEstimados: 0,
  notasGeneralesCostos: ''
};

export const defaultVideoVidaData: VideoVidaData = {
  galleryEnabled: true,
  photosUploaded: false,
  songSuggestion: '',
  customText: '',
  photoCount: 50,
};

export const defaultGiftItems: GiftItem[] = [
    { id: 'gift_1', name: 'Aporte para la Luna de Miel', isClaimed: false, imageUrl: 'https://picsum.photos/seed/honeymoon/400/300', dataAiHint: 'tropical beach honeymoon' },
    { id: 'gift_2', name: 'Juego de Sábanas de Lino', isClaimed: false, imageUrl: 'https://picsum.photos/seed/linens/400/300', dataAiHint: 'linen bed sheets' },
    { id: 'gift_3', name: 'Cena para Dos', isClaimed: false, imageUrl: 'https://picsum.photos/seed/dinner/400/300', dataAiHint: 'romantic dinner' },
];

const defaultTextStyle: TextStyle = { fontFamily: 'Inter', fontSize: '1rem', color: '#6b7280' };
const defaultTitleStyle: TextStyle = { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#363636' };
const defaultAccentTitleStyle: TextStyle = { ...defaultTitleStyle, color: '#A2D2B0' };
const defaultDetalleEvento: DetalleEventoEspecifico = {
  visible: true, titulo: '', fecha: undefined, hora: '', nombreLugar: '', direccionLugar: '', mapaUrl: '', imagenUrl: '',
};

export const defaultInvitacionDigitalData: InvitacionDigitalData = {
  plantilla: 'Grazia', name: 'Plantilla Grazia por Defecto', category: 'Boda', musicaFondoUrl: '',
  secciones: [], // El array de secciones se construye dinámicamente en el editor.
  cabecera: {
    visible: true, protagonista1: 'Novio/a 1', protagonista2: 'Novio/a 2',
    subtitulo: { text: 'Nuestra Boda', style: { fontFamily: 'Inter', fontSize: '1.25rem', color: '#654321' } },
    paletaColores: { primary: '#6d8b74', secondary: '#e6d5b8', accent: '#a47e63' },
    videoFondoUrl: 'https://cdn.coverr.co/videos/coverr-a-man-and-a-woman-get-married-at-a-wedding-ceremony-2508/1080p.mp4'
  },
  bienvenida: {
    visible: true,
    titulo: { text: '¡Nos Casamos!', style: defaultTitleStyle },
    texto: { text: 'Después de un hermoso camino juntos, damos el siguiente paso. Queremos que seas parte de este día tan especial para nosotros, en una noche que promete ser inolvidable, llena de alegría, música y buenos momentos.', style: defaultTextStyle },
  },
  cuentaRegresiva: { visible: true },
  detallesEvento: {
    visible: true,
    ceremoniaReligiosa: { ...defaultDetalleEvento, visible: true, titulo: 'Ceremonia', fecha: new Date().toISOString(), hora: '20:00', nombreLugar: 'Catedral de San Juan', direccionLugar: 'Calle Falsa 123, Ciudad', imagenUrl: 'https://picsum.photos/seed/ceremony/600/400' },
    ceremoniaCivil: { ...defaultDetalleEvento, visible: false },
    celebracion: { ...defaultDetalleEvento, visible: true, titulo: 'Fiesta', fecha: new Date().toISOString(), hora: '21:30', nombreLugar: 'Salón El Paraíso', direccionLugar: 'Ruta 1, Km 10', imagenUrl: 'https://picsum.photos/seed/reception/600/400' },
  },
  itinerario: { visible: true },
  galeria: { visible: true, fotos: ["https://picsum.photos/seed/gallery1/800/600", "https://picsum.photos/seed/gallery2/800/600", "https://picsum.photos/seed/gallery3/800/600"] },
  historia: { visible: true, titulo: { text: 'Nuestra Historia', style: defaultAccentTitleStyle }, texto: { text: 'Un breve relato de cómo llegamos hasta aquí.', style: defaultTextStyle } },
  regalos: { visible: true, titulo: { text: 'Lista de Regalos', style: defaultTitleStyle }, texto: { text: 'Tu presencia es nuestro mejor regalo.', style: defaultTextStyle }, datosBancarios: 'Banco Itaú\nC.A. Pesos: 1234567\nTitular: Juan Pérez', items: defaultGiftItems },
  dressCode: { visible: true, texto: { text: 'Formal' } },
  musica: { visible: true, placeholder: 'Ej: Bohemian Rhapsody - Queen' },
  redesSociales: { visible: true, hashtag: '#NuestraBoda', texto: { text: '¡Comparte tus momentos!', style: { ...defaultTitleStyle, fontSize: '2rem' } } },
  confirmacion: { visible: true },
  despedida: { visible: true, texto: { text: '¡Te esperamos!', style: { fontFamily: 'Dancing_Script', fontSize: '3rem', color: '#A2D2B0' } } },
  footer: { visible: true, titulo: { text: 'Con cariño, María y Juan', style: defaultTextStyle }, nombreEmpresa: { text: 'AK Producciones', style: { fontFamily: 'Belleza', fontSize: '1.25rem', color: '#A2D2B0' } } }
};

export const defaultModulosContratados: ModulosContratados = {
    tareas: true, invitados: true, paginaWeb: true, decoracion: true, catering: true, musica: true, personal: true,
    itinerario: true, documentos: true, costos: true, cargaOperativa: true, fotografia: true, videoVida: true,
    reuniones: true, muroSocial: false, regalos: false, feedback: false, menuMesa: false, cartaTragos: false,
    checkin: false, resumenImprimible: false, configuracion: true, disenoSalon: true, listaCompras: true,
};

export const initialFiestaActualData: FiestaEnPlanificacion = {
  id: `fiesta_${Date.now()}`,
  configuracion: {
    nombreEvento: 'Mi Próximo Evento Increíble',
    tipoCelebracion: 'Cumpleaños',
    fechaEvento: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
    horaInicio: '21:00',
    horaFin: '04:00',
    nombreLugar: 'Salón de Ensueño',
    invitadosEstimados: 50,
    presupuestoEstimado: 100000,
    notasAdicionales: 'Planificación inicial.',
  },
  modulosContratados: defaultModulosContratados,
  personalAsignado: [],
  invoiceIds: [],
  reuniones: [],
  tareas: [],
  clientChecklist: [],
  clientNotes: '',
  decoracion: defaultDecoracion,
  invitados: [],
  invitacionDigital: defaultInvitacionDigitalData,
  clientPortalSettings: defaultClientPortalSettings,
  socialGallerySettings: { enabled: false, allowLikes: true, allowComments: true, uploadsActive: true },
  musica: { cancionesTortaBrindis: [] },
  reposteria: defaultReposteriaData,
  bebidas: defaultBebidasData,
  listaDeCargaOperativa: { categorias: [] },
  gestionCostos: defaultGestionCostos,
  videoVida: defaultVideoVidaData,
  programa: [],
  fotografiaYFilmacion: { servicios: [], notasGenerales: '' },
  otrosDocumentos: [],
  pagosProveedores: [],
  estadosCompra: [],
};
