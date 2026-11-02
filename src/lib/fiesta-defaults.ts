import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';

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
  ClienteDebeLlevarItem,
  GuestExperienceSettings,
} from '@/types/fiesta';
import { DEFAULT_MARKETING_TICKER_TEXT } from '@/lib/social-wall-defaults';
import { defaultZonaDigitalAdolescentesSettings } from '@/lib/zona-digital-adolescentes';

/** Default "Lo que el cliente debe llevar" checklist items */
export const defaultClienteDebeLlevar: ClienteDebeLlevarItem[] = [
  { id: 'dl_1', texto: 'Documentación personal (DNI/CI)', completado: false, obligatorio: true },
  { id: 'dl_2', texto: 'Lista final de invitados confirmados', completado: false, obligatorio: true },
  { id: 'dl_3', texto: 'Fotos para el video de vida', completado: false },
  { id: 'dl_4', texto: 'Lista de canciones especiales', completado: false },
  { id: 'dl_5', texto: 'Confirmación de menú y restricciones alimentarias', completado: false, obligatorio: true },
  { id: 'dl_6', texto: 'Seña o primer pago pendiente', completado: false, obligatorio: true },
];

/** Default guest experience / AK branding settings */
export const defaultGuestExperienceSettings: GuestExperienceSettings = {
  enabled: true,
  showAkBranding: true,
  showLandingCta: true,
  showSocialCta: true,
  showBudgetSimulatorCta: false,
  allowSongSuggestions: true,
  allowPhotoUpload: false,
  allowGuestPortal: true,
  landingUrl: 'https://akproducciones.uy',
  whatsappNumber: AK_WHATSAPP_NUMBER,
  whatsappUrl: `https://wa.me/${AK_WHATSAPP_NUMBER}`,
  instagramUrl: 'https://www.instagram.com/akproduccionesfiestasyeventos/',
  facebookUrl: 'https://www.facebook.com/akproduccionessalto/',
  tiktokUrl: 'https://www.tiktok.com/@akproduccioneseve',
  ctaTitle: '¿Te gustó esta experiencia?',
  ctaText: 'Esta experiencia fue creada por AK Producciones Eventos. Organizamos fiestas completas e inolvidables en Salto, Uruguay.',
};

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
];

export const defaultFaq: FaqItem[] = [
  { id: 'faq_1', pregunta: '¿Puedo agregar o quitar invitados?', respuesta: 'Sí, podés simularlo en el "Simulador de Invitados" del portal. Tené en cuenta que reducir tiene una penalización mínima según contrato. Para confirmar cambios, contactá al organizador.' },
  { id: 'faq_2', pregunta: '¿Cómo confirmo mi asistencia?', respuesta: 'Podés confirmar tu asistencia usando el link de RSVP que figura en tu invitación digital. Es importante confirmar antes de la fecha indicada.' },
  { id: 'faq_3', pregunta: '¿Cuándo debo pagar el saldo?', respuesta: 'El saldo restante debe abonarse antes del evento según lo pactado en contrato. Podés ver tu estado de pagos en la sección "Pagos y Saldo" del portal.' },
  { id: 'faq_4', pregunta: '¿Puedo cambiar el menú?', respuesta: 'Sí, siempre que esté dentro de los plazos acordados. Contactá a tu organizador a través del botón de WhatsApp del portal para coordinar cambios.' },
  { id: 'faq_5', pregunta: '¿Qué pasa si llueve?', respuesta: 'El evento cuenta con alternativas cubiertas. Tu organizador te informará el plan B en caso de necesitarlo.' },
];

export const defaultClientPortalSettings: ClientPortalSettings = {
    enabled: false, accessKey: '', clientPassword: '', accessPhase: 'financiera', liveAccessDaysBefore: 7,
    checklist: { visible: true, editable: true },
    itinerario: { visible: true },
    musica: { visible: true, editable: true },
    videoVida: { visible: true, editable: true },
    listaRegalos: { visible: true },
    documentos: { visible: true },
    notasCliente: { visible: true, editable: true },
    invitados: { visible: true },
    paginaPublica: { visible: true },
    fotografiaYFilmacion: { visible: true },
    moodboard: { visible: true, editable: true },
    buzon: { visible: true, editable: true },
    contrato: { visible: true },
    pagos: { visible: true },
    simuladorInvitados: { visible: true, minReductionPercent: 10, maxIncreasePercent: 30 },
    simuladorInvitadosConfig: { limiteReduccionPorcentaje: 10, limiteAumentoPorcentaje: 30, penalizacionReduccion: true },
    calculadoraBebidas: { visible: true, items: defaultBebidaItems },
    serviciosContratados: { visible: true },
    ubicacion: { visible: true },
    menu: { visible: true },
    cartaTragos: { visible: true },
    dressCode: { visible: true },
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

/**
 * Los impresos que se ponen en las mesas arrancan **vacios**, no con un ejemplo.
 *
 * Antes traian "La Agasajada", "01/01/2025" y una foto cualquiera de internet. El
 * codigo que ponia el nombre y la fecha REALES de la fiesta miraba si el campo
 * estaba vacio... y nunca lo estaba, porque el ejemplo ya ocupaba el lugar. Asi que
 * los numeros de mesa se imprimian con el nombre y la fecha de mentira salvo que
 * alguien los escribiera a mano, y en una mesa de una fiesta de verdad eso se ve.
 *
 * Vacios, el relleno del nombre y la fecha de la fiesta funciona como estaba
 * pensado.
 */
export const defaultNumerosMesaData: NumerosMesaData = {
  protagonistaNombre: "",
  fechaEvento: "",
  backgroundImageUrl: "",
  colorPrincipal: "#9333ea",
  colorSecundario: "#363636",
  fontFamily: 'Playfair Display',
};

export const defaultMenuMesaData: MenuMesaData = {
    titulo: 'MENÚ',
    // Vacio a proposito: lo llena el nombre real de la fiesta. Ver arriba.
    protagonistaNombre: '',
    fontFamily: 'Playfair Display',
    paletaColores: { primary: '#8b5cf6', secondary: '#4b5563', accent: '#3b82f6', background: '#ffffff' },
    entrada: '', platoPrincipal: '', adolescentes: '', postres: '', bebidas: '',
    empresa: { linea1: 'AK PRODUCCIONES', linea2: 'Servicio integral', contacto: '098 355 530' }
};

export const defaultGiftItems: GiftItem[] = [
  { id: 'gift_default_1',  name: '💐 Flores',                  description: 'Ramo de flores para decorar',                        isClaimed: false },
  { id: 'gift_default_2',  name: '🍾 Champagne',               description: 'Botella de champagne o espumante',                   isClaimed: false },
  { id: 'gift_default_3',  name: '🎁 Caja de regalo',          description: 'Caja con detalles y sorpresas',                      isClaimed: false },
  { id: 'gift_default_4',  name: '💳 Tarjeta de regalo',       description: 'Gift card para elegir lo que más le guste',          isClaimed: false },
  { id: 'gift_default_5',  name: '👗 Ropa o accesorios',       description: 'Prenda de vestir, cartera o accesorio de moda',      isClaimed: false },
  { id: 'gift_default_6',  name: '💄 Set de belleza',          description: 'Perfume, maquillaje o productos de cuidado personal', isClaimed: false },
  { id: 'gift_default_7',  name: '📚 Libro',                   description: 'Libro favorito o colección especial',                 isClaimed: false },
  { id: 'gift_default_8',  name: '🎭 Entradas a espectáculo',  description: 'Teatro, recital, cine u otro evento cultural',        isClaimed: false },
  { id: 'gift_default_9',  name: '🧳 Accesorios de viaje',     description: 'Valija, neceser o artículo de viaje',                 isClaimed: false },
  { id: 'gift_default_10', name: '🎮 Videojuego o consola',    description: 'Juego o gadget tecnológico',                         isClaimed: false },
  { id: 'gift_default_11', name: '🍫 Chocolates o golosinas',  description: 'Caja de bombones o dulces especiales',               isClaimed: false },
  { id: 'gift_default_12', name: '🌟 Experiencia especial',    description: 'Spa, cena romántica o actividad única',               isClaimed: false },
];

// Carta definitiva de 12 tragos del dueño (27/10/2026). Receta con alcohol reducido: alcohol principal 15 ml (½ oz de 30 ml).
// Vaso 300 ml, botella 750 ml; "completar hasta 300 ml" = 300 menos los demás líquidos y menos ~100 ml de hielo.
// No se descuenta hielo, azúcar, agua ni fruta suelta (sin insumo). La versión sin alcohol queda guardada en recetaSinAlcohol.
export const defaultCartaTragosData: CartaTragosData = {
  titulo: 'CARTA DE TRAGOS',
  // Vacio a proposito: lo llena el nombre real de la fiesta. Ver arriba.
  protagonistaNombre: '',
  // Vacio a proposito, como el nombre. Con 'Mis XV' escrito aca, la carta de tragos
  // de una BODA se imprimia diciendo "Mis XV": el codigo que pone "Nuestra Boda"
  // segun el tipo de fiesta preguntaba si el campo estaba vacio, y nunca lo estaba.
  numeroPrincipal: '',
  fontFamily: 'Playfair Display',
  titleSize: 'medium',
  protagonistaFotoUrl: '',
  backgroundImageUrl: '',
  backgroundColor: '#ffffff',
  paletaColores: { primary: '#9333ea', secondary: '#363636', accent: '#ffffff' },
  items: [
    {
      id: 'daiquiri-durazno',
      nombre: 'Daiquiri de durazno',
      imageUrl: '/images/tragos/01_daiquiri_durazno.jpg',
      descripcion: 'Ron con durazno en almíbar y jugo de naranja, licuado con hielo.',
      ingredientes: ['Ron', 'Durazno en almíbar', 'Jugo de naranja', 'Azúcar'],
      soloMayores: true,
      stockDisponible: 120,
      recetaIngredientes: [
        { insumoId: 'ing-ron', nombre: 'Ron', cantidad: 0.02, unidad: 'Botella' },
        { insumoId: 'ing-naranja', nombre: 'Jugo de Naranja', cantidad: 0.06, unidad: 'Litro' },
      ],
      recetaIngredientesSinAlcohol: [
        { insumoId: 'ing-naranja', nombre: 'Jugo de Naranja', cantidad: 0.075, unidad: 'Litro' },
      ],
      recetaSinAlcohol: ['Durazno en almíbar: 1 mitad', 'Jugo de naranja: 2½ oz (75 ml)', 'Azúcar: 1 cucharadita', 'Hielo: 3–4 cubitos', 'Agua: cantidad necesaria hasta rendir 300 ml'],
    },
    {
      id: 'daiquiri-frutilla',
      nombre: 'Daiquiri de frutilla',
      imageUrl: '/images/tragos/02_daiquiri_frutilla.jpg',
      descripcion: 'Ron con frutillas, licuado con hielo.',
      ingredientes: ['Ron', 'Frutillas', 'Azúcar'],
      soloMayores: true,
      stockDisponible: 120,
      recetaIngredientes: [
        { insumoId: 'ing-ron', nombre: 'Ron', cantidad: 0.02, unidad: 'Botella' },
      ],
      recetaIngredientesSinAlcohol: [],
      recetaSinAlcohol: ['Frutillas: 5–6 unidades', 'Azúcar: 1–2 cucharaditas', 'Hielo: 3–4 cubitos', 'Agua: cantidad necesaria hasta rendir 300 ml'],
    },
    {
      id: 'daiquiri-anana',
      nombre: 'Daiquiri de ananá',
      imageUrl: '/images/tragos/03_daiquiri_anana.jpg',
      descripcion: 'Ron con ananá y jugo de ananá, licuado con hielo.',
      ingredientes: ['Ron', 'Ananá', 'Jugo de ananá', 'Azúcar'],
      soloMayores: true,
      stockDisponible: 120,
      recetaIngredientes: [
        { insumoId: 'ing-ron', nombre: 'Ron', cantidad: 0.02, unidad: 'Botella' },
        { insumoId: 'ing-jugo-anana', nombre: 'Jugo de ananá', cantidad: 0.06, unidad: 'Litro' },
      ],
      recetaIngredientesSinAlcohol: [
        { insumoId: 'ing-jugo-anana', nombre: 'Jugo de ananá', cantidad: 0.075, unidad: 'Litro' },
      ],
      recetaSinAlcohol: ['Ananá: 2 rodajas chicas', 'Jugo de ananá: 2½ oz (75 ml)', 'Azúcar: 1 cucharadita', 'Hielo: 3–4 cubitos', 'Agua: cantidad necesaria hasta rendir 300 ml'],
    },
    {
      id: 'daiquiri-primavera',
      nombre: 'Daiquiri Primavera',
      imageUrl: '/images/tragos/04_daiquiri_primavera.jpg',
      descripcion: 'Ron con durazno, ananá y jugo de naranja, licuado con hielo.',
      ingredientes: ['Ron', 'Durazno', 'Ananá', 'Jugo de naranja', 'Azúcar'],
      soloMayores: true,
      stockDisponible: 120,
      recetaIngredientes: [
        { insumoId: 'ing-ron', nombre: 'Ron', cantidad: 0.02, unidad: 'Botella' },
        { insumoId: 'ing-naranja', nombre: 'Jugo de Naranja', cantidad: 0.06, unidad: 'Litro' },
      ],
      recetaIngredientesSinAlcohol: [
        { insumoId: 'ing-naranja', nombre: 'Jugo de Naranja', cantidad: 0.075, unidad: 'Litro' },
      ],
      recetaSinAlcohol: ['Durazno: 1 rodaja', 'Ananá: 2 rodajas chicas', 'Jugo de naranja: 2½ oz (75 ml)', 'Azúcar: 1 cucharadita', 'Hielo: 3–4 cubitos', 'Agua: cantidad necesaria hasta rendir 300 ml'],
    },
    {
      id: 'atomic-green',
      nombre: 'Atomic Green',
      imageUrl: '/images/tragos/05_atomic_green.jpg',
      descripcion: 'Vodka con jarabe de Blue Curaçao sin alcohol y jugo de naranja.',
      ingredientes: ['Vodka', 'Jarabe Blue Curaçao sin alcohol', 'Jugo de naranja'],
      soloMayores: true,
      stockDisponible: 120,
      recetaIngredientes: [
        { insumoId: 'ing-vodka', nombre: 'Vodka', cantidad: 0.02, unidad: 'Botella' },
        { insumoId: 'ing-blue-curacao-sin-alcohol', nombre: 'Jarabe Blue Curaçao sin alcohol', cantidad: 0.02, unidad: 'Botella' },
        { insumoId: 'ing-naranja', nombre: 'Jugo de Naranja', cantidad: 0.17, unidad: 'Litro' },
      ],
      recetaIngredientesSinAlcohol: [
        { insumoId: 'ing-blue-curacao-sin-alcohol', nombre: 'Jarabe Blue Curaçao sin alcohol', cantidad: 0.02, unidad: 'Botella' },
        { insumoId: 'ing-naranja', nombre: 'Jugo de Naranja', cantidad: 0.185, unidad: 'Litro' },
      ],
      recetaSinAlcohol: ['Jarabe Blue Curaçao sin alcohol: ½ oz (15 ml)', 'Hielo: ½ vaso', 'Jugo de naranja: completar hasta 300 ml'],
    },
    {
      id: 'caipirinha',
      nombre: 'Caipirinha con caña',
      imageUrl: '/images/tragos/06_caipirinha.jpg',
      descripcion: 'Caña uruguaya con limón machacado, azúcar, hielo picado y soda.',
      ingredientes: ['Caña uruguaya', 'Limón', 'Azúcar', 'Soda o agua con gas'],
      soloMayores: true,
      stockDisponible: 120,
      recetaIngredientes: [
        { insumoId: 'ing-cana-uruguaya', nombre: 'Caña uruguaya', cantidad: 0.02, unidad: 'Botella' },
        { insumoId: 'ing-soda', nombre: 'Soda', cantidad: 0.185, unidad: 'Litro' },
      ],
      recetaIngredientesSinAlcohol: [
        { insumoId: 'ing-soda', nombre: 'Soda', cantidad: 0.2, unidad: 'Litro' },
      ],
      recetaSinAlcohol: ['Limón: ½ unidad', 'Azúcar: 2 cucharaditas', 'Hielo picado: ½ vaso', 'Soda o agua con gas: completar hasta 300 ml'],
    },
    {
      id: 'arizona',
      nombre: 'Arizona – versión AK',
      imageUrl: '/images/tragos/07_arizona.jpg',
      descripcion: 'Vodka con jugo de naranja, jugo de ananá y granadina sin alcohol.',
      ingredientes: ['Vodka', 'Jugo de naranja', 'Jugo de ananá', 'Granadina sin alcohol', 'Jugo de naranja'],
      soloMayores: true,
      stockDisponible: 120,
      recetaIngredientes: [
        { insumoId: 'ing-vodka', nombre: 'Vodka', cantidad: 0.02, unidad: 'Botella' },
        { insumoId: 'ing-naranja', nombre: 'Jugo de Naranja', cantidad: 0.15, unidad: 'Litro' },
        { insumoId: 'ing-jugo-anana', nombre: 'Jugo de ananá', cantidad: 0.03, unidad: 'Litro' },
        { insumoId: 'ing-granadina-sin-alcohol', nombre: 'Granadina sin alcohol', cantidad: 0.0067, unidad: 'Botella' },
      ],
      recetaIngredientesSinAlcohol: [
        { insumoId: 'ing-naranja', nombre: 'Jugo de Naranja', cantidad: 0.165, unidad: 'Litro' },
        { insumoId: 'ing-jugo-anana', nombre: 'Jugo de ananá', cantidad: 0.03, unidad: 'Litro' },
        { insumoId: 'ing-granadina-sin-alcohol', nombre: 'Granadina sin alcohol', cantidad: 0.0067, unidad: 'Botella' },
      ],
      recetaSinAlcohol: ['Jugo de naranja: 2½ oz (75 ml)', 'Jugo de ananá: 1 oz (30 ml)', 'Granadina sin alcohol: 1 cucharadita (5 ml)', 'Hielo: ½ vaso', 'Jugo de naranja: completar hasta 300 ml'],
    },
    {
      id: 'fernet-con-coca',
      nombre: 'Fernet con Coca',
      imageUrl: '/images/tragos/08_fernet_con_coca.jpg',
      descripcion: 'Fernet con Coca-Cola y hielo.',
      ingredientes: ['Fernet', 'Coca-Cola'],
      soloMayores: true,
      stockDisponible: 120,
      recetaIngredientes: [
        { insumoId: 'ing-fernet', nombre: 'Fernet', cantidad: 0.02, unidad: 'Botella' },
        { insumoId: 'ing-coca', nombre: 'Coca-Cola', cantidad: 0.185, unidad: 'Litro' },
      ],
      recetaIngredientesSinAlcohol: [
        { insumoId: 'ing-coca', nombre: 'Coca-Cola', cantidad: 0.185, unidad: 'Litro' },
        { insumoId: 'ing-naranja', nombre: 'Jugo de Naranja', cantidad: 0.015, unidad: 'Litro' },
      ],
      recetaSinAlcohol: ['Coca-Cola: completar hasta 300 ml', 'Jugo de naranja: 1 cucharada (15 ml)', 'Hielo: ½ vaso'],
      nombreSinAlcohol: 'Cola con naranja',
    },
    {
      id: 'atardecer',
      nombre: 'Atardecer – versión AK',
      imageUrl: '/images/tragos/09_atardecer.jpg',
      descripcion: 'Ron con jugo de naranja, jugo de ananá y granadina sin alcohol, en degradé.',
      ingredientes: ['Ron', 'Jugo de naranja', 'Jugo de ananá', 'Granadina sin alcohol', 'Jugo de naranja'],
      soloMayores: true,
      stockDisponible: 120,
      recetaIngredientes: [
        { insumoId: 'ing-ron', nombre: 'Ron', cantidad: 0.02, unidad: 'Botella' },
        { insumoId: 'ing-naranja', nombre: 'Jugo de Naranja', cantidad: 0.15, unidad: 'Litro' },
        { insumoId: 'ing-jugo-anana', nombre: 'Jugo de ananá', cantidad: 0.03, unidad: 'Litro' },
        { insumoId: 'ing-granadina-sin-alcohol', nombre: 'Granadina sin alcohol', cantidad: 0.0067, unidad: 'Botella' },
      ],
      recetaIngredientesSinAlcohol: [
        { insumoId: 'ing-naranja', nombre: 'Jugo de Naranja', cantidad: 0.165, unidad: 'Litro' },
        { insumoId: 'ing-jugo-anana', nombre: 'Jugo de ananá', cantidad: 0.03, unidad: 'Litro' },
        { insumoId: 'ing-granadina-sin-alcohol', nombre: 'Granadina sin alcohol', cantidad: 0.0067, unidad: 'Botella' },
      ],
      recetaSinAlcohol: ['Jugo de naranja: 3½ oz (105 ml)', 'Jugo de ananá: 1 oz (30 ml)', 'Granadina sin alcohol: 1 cucharadita (5 ml)', 'Hielo: ½ vaso', 'Jugo de naranja: completar hasta 300 ml'],
    },
    {
      id: 'destornillador',
      nombre: 'Destornillador',
      imageUrl: '/images/tragos/10_destornillador.jpg',
      descripcion: 'Vodka con jugo de naranja y hielo.',
      ingredientes: ['Vodka', 'Jugo de naranja'],
      soloMayores: true,
      stockDisponible: 120,
      recetaIngredientes: [
        { insumoId: 'ing-vodka', nombre: 'Vodka', cantidad: 0.02, unidad: 'Botella' },
        { insumoId: 'ing-naranja', nombre: 'Jugo de Naranja', cantidad: 0.185, unidad: 'Litro' },
      ],
      recetaIngredientesSinAlcohol: [
        { insumoId: 'ing-naranja', nombre: 'Jugo de Naranja', cantidad: 0.09, unidad: 'Litro' },
        { insumoId: 'ing-soda', nombre: 'Soda', cantidad: 0.105, unidad: 'Litro' },
      ],
      recetaSinAlcohol: ['Jugo de naranja: 3 oz (90 ml)', 'Jugo de limón: 1 cucharadita (5 ml)', 'Hielo: ½ vaso', 'Soda o agua con gas: completar hasta 300 ml'],
      nombreSinAlcohol: 'Naranjada',
    },
    {
      id: 'ron-cola',
      nombre: 'Ron Cola',
      imageUrl: '/images/tragos/11_ron_cola.jpg',
      descripcion: 'Ron con Coca-Cola y hielo.',
      ingredientes: ['Ron', 'Coca-Cola'],
      soloMayores: true,
      stockDisponible: 120,
      recetaIngredientes: [
        { insumoId: 'ing-ron', nombre: 'Ron', cantidad: 0.02, unidad: 'Botella' },
        { insumoId: 'ing-coca', nombre: 'Coca-Cola', cantidad: 0.185, unidad: 'Litro' },
      ],
      recetaIngredientesSinAlcohol: [
        { insumoId: 'ing-coca', nombre: 'Coca-Cola', cantidad: 0.2, unidad: 'Litro' },
      ],
      recetaSinAlcohol: ['Coca-Cola: completar hasta 300 ml', 'Limón: 1 rodaja', 'Hielo: ½ vaso'],
      nombreSinAlcohol: 'Cola con limón',
    },
    {
      id: 'gin-con-pomelo',
      nombre: 'Gin con pomelo',
      imageUrl: '/images/tragos/12_gin_con_pomelo.jpg',
      descripcion: 'Gin con refresco de pomelo y hielo.',
      ingredientes: ['Gin', 'Refresco de pomelo'],
      soloMayores: true,
      stockDisponible: 120,
      recetaIngredientes: [
        { insumoId: 'ing-gin', nombre: 'Gin', cantidad: 0.02, unidad: 'Botella' },
        { insumoId: 'ing-pomelo', nombre: 'Gaseosa de Pomelo', cantidad: 0.185, unidad: 'Litro' },
      ],
      recetaIngredientesSinAlcohol: [
        { insumoId: 'ing-pomelo', nombre: 'Gaseosa de Pomelo', cantidad: 0.2, unidad: 'Litro' },
      ],
      recetaSinAlcohol: ['Refresco de pomelo: completar hasta 300 ml', 'Limón: 1 rodaja', 'Hielo: ½ vaso'],
      nombreSinAlcohol: 'Pomelo con limón',
    },
  ],
  empresa: { linea1: 'AK PRODUCCIONES', linea2: 'Servicio de fiestas integral', contacto: '098 355 530' },
};

export const defaultModulosContratados: ModulosContratados = {
    tareas: true, invitados: true, paginaWeb: true, decoracion: true, catering: true, musica: true, personal: true,
    itinerario: true, documentos: true, costos: true, cargaOperativa: true, fotografia: true, videoVida: true,
    reuniones: true, muroSocial: true, redSocial: true, regalos: false, feedback: false, menuMesa: false, buzon: true,
    checkin: false, resumenImprimible: false, configuracion: true, disenoSalon: true, listaCompras: true, portalCliente: true,
    numerosMesa: true, mesasCliente: true, resumenPlanificacion: true, enVivo: true, entretenimiento: true, pantallasTotem: true, barraTecnologica: true, zonaDigital: true, carteleria: true
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
  socialGallerySettings: {
    enabled: true,
    allowLikes: true,
    allowComments: true,
    uploadsActive: true,
    requireApproval: true,
    chatEnabled: true,
    showPolls: true,
    marketingTickerText: DEFAULT_MARKETING_TICKER_TEXT,
    ledMarqueeText: '',
  },
  zonaDigitalAdolescentes: defaultZonaDigitalAdolescentesSettings,
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
