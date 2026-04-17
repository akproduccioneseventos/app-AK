
import type {
  FiestaEnPlanificacion,
  DecoracionData,
  ClientPortalSettings,
  MusicaFiesta,
  ReposteriaData,
  BebidasData,
  GestionCostosData,
  VideoVidaData,
  ProgramaEventoItem,
  InvitacionDigitalData,
  NumerosMesaData,
  MenuMesaData,
  ModulosContratados,
  ZonaContratada,
  TextStyle,
  CartaTragosData,
  GiftItem,
  BebidaCalculable,
  FaqItem,
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

export const defaultBebidaItems: BebidaCalculable[] = [
  { id: 'cerveza', nombre: 'Cerveza Corona', emoji: '🍺', cantidadPorPersona: 5, unidad: 'unidades', clienteLleva: false, visible: true, color: 'amber' },
  { id: 'refresco', nombre: 'Agua / Gaseosa', emoji: '🥤', cantidadPorPersona: 1.5, unidad: 'litros', clienteLleva: false, visible: true, color: 'sky' },
  { id: 'hielo', nombre: 'Hielo', emoji: '🧊', cantidadPorPersona: 1, unidad: 'kg', clienteLleva: false, visible: true, color: 'slate' },
  { id: 'agua', nombre: 'Agua mineral', emoji: '💧', cantidadPorPersona: 0.5, unidad: 'litros', clienteLleva: false, visible: true, color: 'blue' },
  { id: 'cotillon', nombre: 'Cotillón', emoji: '🎉', cantidadPorPersona: 1, unidad: 'kits', clienteLleva: false, visible: true, color: 'pink' },
];

export const defaultFaq: FaqItem[] = [
  { id: 'faq_1', pregunta: '¿Puedo agregar o quitar invitados?', respuesta: 'Sí, podés simularlo en el "Simulador de Invitados" del portal. Tené en cuenta que reducir tiene una penalización mínima según contrato. Para confirmar cambios, contactá al organizador.' },
  { id: 'faq_2', pregunta: '¿Cómo confirmo mi asistencia?', respuesta: 'Podés confirmar tu asistencia usando el link de RSVP que figura en tu invitación digital. Es importante confirmar antes de la fecha indicada.' },
  { id: 'faq_3', pregunta: '¿Cuándo debo pagar el saldo?', respuesta: 'El saldo restante debe abonarse antes del evento según lo pactado en contrato. Podés ver tu estado de pagos en la sección "Pagos y Saldo" del portal.' },
  { id: 'faq_4', pregunta: '¿Puedo cambiar el menú?', respuesta: 'Sí, siempre que esté dentro de los plazos acordados. Contactá a tu organizador a través del botón de WhatsApp del portal para coordinar cambios.' },
  { id: 'faq_5', pregunta: '¿Qué pasa si llueve?', respuesta: 'El evento cuenta con alternativas cubiertas. Tu organizador te informará el plan B en caso de necesitarlo.' },
];

export const defaultClientPortalSettings: ClientPortalSettings = {
    enabled: false, accessKey: '', checklist: { visible: false, editable: false }, itinerario: { visible: false },
    musica: { visible: false, editable: false }, videoVida: { visible: true, editable: true }, listaRegalos: { visible: false },
    documentos: { visible: true }, notasCliente: { visible: false, editable: true }, invitados: { visible: true },
    paginaPublica: { visible: true }, fotografiaYFilmacion: { visible: true }, moodboard: { visible: false, editable: true },
    contrato: { visible: true }, pagos: { visible: true }, simuladorInvitados: { visible: true, minReductionPercent: 10, maxIncreasePercent: 30 },
    simuladorInvitadosConfig: { limiteReduccionPorcentaje: 10, limiteAumentoPorcentaje: 30, penalizacionReduccion: true },
    calculadoraBebidas: { visible: false, items: defaultBebidaItems },
    serviciosContratados: { visible: true },
    ubicacion: { visible: true },
    menu: { visible: true },
    cartaTragos: { visible: false },
    dressCode: { visible: false },
    faq: { visible: true },
    informarPago: { visible: true, editable: true },
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
    decoracionTorta: { descripcion: '', imageUrl: '', dataAiHint: 'cake design' }, items: [], zonasContratadas: defaultZonasContratadas, generalNotesDecoracion: 'Detalles pendientes de definir.',
    salonWidth: 15, salonHeight: 15, salonElements: [], pixelsPerMeter: 40, moodboardItems: []
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
        { id: 'cafeteria', nombreDisplay: 'Servicio de Cafetería', activada: false, items: [], descripcion: 'Café, té, instituciones.' }
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

const defaultTextStyle: TextStyle = { fontFamily: 'Inter', fontSize: '1rem', color: '#6b7280' };
const defaultTitleStyle: TextStyle = { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#363636' };

export const defaultInvitacionDigitalData: InvitacionDigitalData = {
  plantilla: 'Grazia', name: 'Plantilla Grazia por Defecto', category: 'Boda', musicaFondoUrl: '',
  secciones: [],
  cabecera: {
    visible: true, protagonista1: 'Novio/a 1', protagonista2: 'Novio/a 2',
    subtitulo: { text: 'Nuestra Boda', style: { fontFamily: 'Inter', fontSize: '1.25rem', color: '#654321' } },
    paletaColores: { primary: '#6d8b74', secondary: '#e6d5b8', accent: '#a47e63' },
  },
  bienvenida: {
    visible: true,
    titulo: { text: '¡Nos Casamos!', style: defaultTitleStyle },
    texto: { text: 'Después de un hermoso camino juntos, damos el siguiente paso.', style: defaultTextStyle },
  },
  cuentaRegresiva: { visible: true },
  detallesEvento: {
    visible: true,
    ceremoniaReligiosa: { visible: true, titulo: 'Ceremonia', hora: '20:00', nombreLugar: 'Catedral', direccionLugar: '', mapaUrl: '', imagenUrl: '' },
    ceremoniaCivil: { visible: false, titulo: '', hora: '', nombreLugar: '', direccionLugar: '', mapaUrl: '', imagenUrl: '' },
    celebracion: { visible: true, titulo: 'Fiesta', hora: '21:30', nombreLugar: 'Salón El Paraíso', direccionLugar: '', mapaUrl: '', imagenUrl: '' },
  },
  itinerario: { visible: true },
  galeria: { visible: true, fotos: [] },
  historia: { visible: true, titulo: { text: 'Nuestra Historia', style: defaultTitleStyle }, texto: { text: '', style: defaultTextStyle } },
  regalos: { visible: true, titulo: { text: 'Lista de Regalos', style: defaultTitleStyle }, texto: { text: '', style: defaultTextStyle }, datosBancarios: '', items: [] },
  dressCode: { visible: true },
  musica: { visible: true, placeholder: 'Ej: Bohemian Rhapsody - Queen' },
  redesSociales: { visible: true, hashtag: '#BodaJuanYMaria', texto: { text: '¡Comparte tus momentos!', style: { ...defaultTitleStyle, fontSize: '2rem' } } },
  confirmacion: { visible: true, showRelationshipTags: true },
  despedida: { visible: true },
  footer: { visible: true, titulo: { text: '¡Te esperamos!', style: defaultTextStyle }, nombreEmpresa: { text: 'AK Producciones', style: defaultTextStyle } }
};

export const defaultNumerosMesaData: NumerosMesaData = {
  protagonistaNombre: "La Agasajada",
  fechaEvento: "01/01/2025",
  backgroundImageUrl: "https://picsum.photos/seed/floral-background/800/400",
  colorPrincipal: "#9333ea",
  colorSecundario: "#363636",
  fontFamily: 'Playfair Display',
};

export const defaultMenuMesaData: MenuMesaData = {
    titulo: 'MENÚ',
    protagonistaNombre: 'La Agasajada',
    fontFamily: 'Playfair Display',
    paletaColores: { primary: '#8b5cf6', secondary: '#4b5563', accent: '#3b82f6', background: '#ffffff' },
    entrada: '', platoPrincipal: '', adolescentes: '', postres: '', bebidas: '',
    empresa: { linea1: 'AK PRODUCCIONES', linea2: 'Servicio integral', contacto: '098 355 530' }
};

export const defaultGiftItems: GiftItem[] = [];

export const defaultCartaTragosData: CartaTragosData = {
  titulo: 'CARTA DE TRAGOS',
  protagonistaNombre: 'La Agasajada',
  numeroPrincipal: 'Mis XV',
  fontFamily: 'Playfair Display',
  titleSize: 'medium',
  protagonistaFotoUrl: '',
  backgroundImageUrl: '',
  backgroundColor: '#ffffff',
  paletaColores: { primary: '#9333ea', secondary: '#363636', accent: '#ffffff' },
  items: [
    { id: 'trago_1', nombre: 'Daiquiri de Durazno', imageUrl: '', aiHint: 'peach daiquiri cocktail' },
    { id: 'trago_2', nombre: 'Caipirinha', imageUrl: '', aiHint: 'caipirinha lime cocktail' },
    { id: 'trago_3', nombre: 'Arizona', imageUrl: '', aiHint: 'arizona iced tea cocktail' },
    { id: 'trago_4', nombre: 'Daiquiri de Ananá', imageUrl: '', aiHint: 'pineapple daiquiri cocktail' },
    { id: 'trago_5', nombre: 'Daiquiri de Frutilla', imageUrl: '', aiHint: 'strawberry daiquiri cocktail' },
    { id: 'trago_6', nombre: 'Atomic Green', imageUrl: '', aiHint: 'green cocktail atomic' },
    { id: 'trago_7', nombre: 'Daiquiri Primavera', imageUrl: '', aiHint: 'spring daiquiri colorful cocktail' },
    { id: 'trago_8', nombre: 'Fernet con Coca', imageUrl: '', aiHint: 'fernet cola drink' },
    { id: 'trago_9', nombre: 'Atardecer', imageUrl: '', aiHint: 'sunset tequila sunrise cocktail' },
    { id: 'trago_10', nombre: 'Destornillador', imageUrl: '', aiHint: 'screwdriver vodka orange cocktail' },
  ],
  empresa: { linea1: 'AK PRODUCCIONES', linea2: 'Servicio de fiestas integral', contacto: '098 355 530' },
};

export const defaultModulosContratados: ModulosContratados = {
    tareas: true, invitados: true, paginaWeb: true, decoracion: true, catering: true, musica: true, personal: true,
    itinerario: true, documentos: true, costos: true, cargaOperativa: true, fotografia: true, videoVida: true,
    reuniones: true, muroSocial: true, regalos: false, feedback: false, menuMesa: false,
    checkin: false, resumenImprimible: false, configuracion: true, disenoSalon: true, listaCompras: true, portalCliente: true,
    numerosMesa: true, mesasCliente: true, resumenPlanificacion: true, enVivo: true, carteleria: true
};

export const initialFiestaActualData: FiestaEnPlanificacion = {
  id: `fiesta_${Date.now()}`,
  configuracion: {
    nombreEvento: 'Nuevo Evento',
    tipoCelebracion: 'Boda',
    fechaEvento: '',
    horaInicio: '21:00',
    horaFin: '04:00',
    nombreLugar: 'Salón a definir',
    invitadosEstimados: 100,
    presupuestoEstimado: 0,
    notesAdicionales: '',
  },
  modulosContratados: defaultModulosContratados,
  personalAsignado: [],
  invoiceIds: [],
  reuniones: [],
  tareas: [],
  decoracion: defaultDecoracion,
  invitados: [],
  invitacionDigital: defaultInvitacionDigitalData,
  menuMesa: defaultMenuMesaData,
  numerosMesa: defaultNumerosMesaData,
  clientPortalSettings: defaultClientPortalSettings,
  socialGallerySettings: { enabled: true, allowLikes: true, allowComments: true, uploadsActive: true, chatEnabled: true },
  musica: { cancionesTortaBrindis: [] },
  reposteria: defaultReposteriaData,
  bebidas: defaultBebidasData,
  listaDeCargaOperativa: { categorias: [] },
  gestionCostos: defaultGestionCostos,
  videoVida: defaultVideoVidaData,
  programa: [],
  fotografiaYFilmacion: { servicios: [], notasGenerales: '' },
  othersDocumentos: [],
  pagosProveedores: [],
  estadosCompra: [],
  liveState: { 
    llegadaProtagonistas: { enCamino: false, confirmado: false },
    entregas: [],
    incidentes: [],
    staffCheckIn: {}
  }
};
