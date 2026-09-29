export const DEFAULT_CATALOGO_PRESENTACION_TEXT = [
  'En AK Producciones somos especialistas en transformar momentos especiales en recuerdos eternos.',
  'Nos encargamos de todo: decoración, catering, sonido, fotografía y coordinación general.',
].join(' ');

export const DEFAULT_CATALOGO_POR_QUE_TEXT = 'Un solo equipo para coordinar todo, con experiencia, calidad y seguimiento personalizado.';

/**
 * Los doce logos de las empresas para las que AK trabajó.
 *
 * **Son los reales, sacados del catálogo impreso de la empresa**, recortados uno
 * por uno y verificados a ojo antes de nombrarlos. Viven acá adentro, no en un
 * sitio de afuera: antes se cargaban desde el sitio de Canva de la empresa, y si
 * esa página cambiaba o se caía, los logos desaparecían en medio de la
 * presentación, delante del cliente.
 *
 * Cuidado con dos cosas que ya salieron mal:
 *
 * 1. **No se dibujan logos.** Una entrega los reemplazó por rectángulos de color
 *    con el nombre escrito en una tipografía cualquiera. Eso no es el logo de
 *    Antel: se ve barato y usa mal la marca de un tercero.
 * 2. **No se adivina el nombre.** Ponerle el nombre de una empresa al logo de otra
 *    es mostrarle al cliente que confundimos a nuestros propios clientes.
 *
 * El dueño puede reemplazarlos o sumar clientes nuevos desde Ajustes → Contenido
 * público.
 */
export const DEFAULT_PARTNER_LOGOS = [
  { id: '1', url: '/logos/correo-uruguayo.png', name: 'Correo Uruguayo' },
  { id: '2', url: '/logos/salto-hotel-casino.png', name: 'Salto Hotel & Casino' },
  { id: '3', url: '/logos/plus-medical.png', name: 'Plus Medical' },
  { id: '4', url: '/logos/asdemya.png', name: 'A.S.DE.M. y A.' },
  { id: '5', url: '/logos/woslen.png', name: 'Woslen' },
  { id: '6', url: '/logos/apc-salto.png', name: 'APC Salto' },
  { id: '7', url: '/logos/inc.png', name: 'INC' },
  { id: '8', url: '/logos/antel.png', name: 'Antel' },
  { id: '9', url: '/logos/abra.png', name: 'ABRA' },
  { id: '10', url: '/logos/inau.png', name: 'INAU' },
  { id: '11', url: '/logos/intendencia-salto.png', name: 'Intendencia de Salto' },
  { id: '12', url: '/logos/club-uruguay.png', name: 'Club Uruguay' },
];

/** Las doce empresas del catálogo impreso, para la ayuda de la pantalla de Ajustes. */
export const EMPRESAS_DEL_CATALOGO = [
  'Correo Uruguayo', 'Salto Hotel & Casino', 'Plus Medical', 'A.S.DE.M. y A.',
  'Woslen', 'APC Salto', 'INC', 'Antel', 'ABRA', 'INAU',
  'Intendencia de Salto', 'Club Uruguay',
];

import type { PresentacionLedSettings } from '@/types/contenido-publico';

export const DEFAULT_PRESENTACION_LED_SETTINGS: PresentacionLedSettings = {
  portada: {
    tituloPrincipal: 'AK Producciones',
    subtitulo: 'Salón, comida, música, fotos y coordinación con un solo equipo.',
    imagenFondoUrl: '',
    colorAcento: 'from-indigo-500 to-emerald-500',
  },
  porQueElegirnos: {
    beneficios: [
      { emoji: '🛡️', texto: 'Un solo proveedor para coordinar todo el evento.' },
      { emoji: '⏱️', texto: 'Puntualidad garantizada en cada etapa.' },
      { emoji: '🎧', texto: 'Atención personalizada antes, durante y después.' },
      { emoji: '⭐', texto: 'Calidad premium en servicios y ejecución.' },
      { emoji: '⚡', texto: 'Resolución inmediata ante cualquier imprevisto.' },
      { emoji: '❤️', texto: 'Experiencia que emociona y se recuerda.' },
    ],
    imagenLateralUrl: '',
  },
  salon: {
    titulo: 'Nuestro Salón - Club Uruguay',
    descripcion: 'Un salón de primer nivel en pleno centro de Salto, con más de 120 años de historia.',
    fotos: [],
  },
  equipo: {
    titulo: 'Hay Equipo 🤝',
    frase: 'El día de tu fiesta somos 11 personas trabajando para vos.',
    cantidadPersonas: 11,
    fotos: [],
  },
  empresasColaboradoras: DEFAULT_PARTNER_LOGOS,
  cierre: {
    titulo: 'Contratarnos',
    mensaje: 'Estamos listos para hacer de tu celebración un recuerdo imborrable.',
    ctaTexto: 'Generar Presupuesto Manual',
    ctaAccion: 'generar-presupuesto' as const,
  },
};
