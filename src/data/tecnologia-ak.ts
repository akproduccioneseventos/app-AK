/**
 * @fileOverview Base de datos de tecnologías de AK Producciones.
 * Única fuente de verdad para la vidriera, /tecnologia, /experiencia y la demo en vivo.
 */

export type GrupoTecnologia =
  | 'invitados'
  | 'cliente'
  | 'fiesta'
  | 'entretenimiento'
  | 'recuerdos'
  | 'organizacion';

export interface ItemTecnologiaAK {
  id: string;
  nombre: string;
  descripcionCorta: string;
  grupo: GrupoTecnologia;
  rutaApp: string; // Ruta que existe en la app
  pasoDemo: number; // 1 a 5
  foto: string;
  youtubeId?: string;
  icono?: string;
}

export const GRUPOS_TECNOLOGIA: Record<GrupoTecnologia, { nombre: string; descripcion: string }> = {
  invitados: {
    nombre: 'Para tus invitados',
    descripcion: 'Invitación personalizada, confirmación de asistencia y portal con mesa asignada.',
  },
  cliente: {
    nombre: 'Para vos',
    descripcion: 'Portal privado para organizar cuotas, menú, invitados y ver tu salón en 3D.',
  },
  fiesta: {
    nombre: 'En la fiesta',
    descripcion: 'Pantalla gigante en vivo, recepción interactiva y barra tecnológica.',
  },
  entretenimiento: {
    nombre: 'Entretenimiento',
    descripcion: 'Fotocabina, plataforma 360, espejo mágico, Bogue y buzón de recuerdos.',
  },
  recuerdos: {
    nombre: 'Los recuerdos',
    descripcion: 'Álbum digital con reconocimiento facial, fotos en alta resolución y Video de Vida.',
  },
  organizacion: {
    nombre: 'La organización',
    descripcion: 'Simulador transparente, presupuestos formales y contrato con firma digital.',
  },
};

export const TECNOLOGIAS_AK: ItemTecnologiaAK[] = [
  // 1. Invitados
  {
    id: 'invitacion-digital',
    nombre: 'Invitación Digital Interactiva',
    descripcionCorta: 'Diseño responsive con cuenta regresiva, mapa GPS, vestimenta y música.',
    grupo: 'invitados',
    rutaApp: '/invitacion',
    pasoDemo: 1,
    foto: '/tecnologia/invitacion.webp',
  },
  {
    id: 'confirmacion-rsvp',
    nombre: 'Confirmación de Asistencia (RSVP)',
    descripcionCorta: 'Confirmación online con menú celíaco, vegetariano y canciones para el DJ.',
    grupo: 'invitados',
    rutaApp: '/portal-cliente',
    pasoDemo: 1,
    foto: '/tecnologia/rsvp.webp',
  },
  {
    id: 'portal-invitado-qr',
    nombre: 'Portal del Invitado con QR',
    descripcionCorta: 'Credencial digital con número de mesa, cronograma y acceso al muro.',
    grupo: 'invitados',
    rutaApp: '/invitacion',
    pasoDemo: 2,
    foto: '/tecnologia/portal-invitado.webp',
  },

  // 2. Cliente
  {
    id: 'portal-cliente-dashboard',
    nombre: 'Portal del Cliente Online',
    descripcionCorta: 'Panel privado con avance de invitados, cuotas pagadas y tareas pendientes.',
    grupo: 'cliente',
    rutaApp: '/portal-cliente',
    pasoDemo: 3,
    foto: '/tecnologia/portal-cliente.webp',
  },
  {
    id: 'salon-3d-interactivo',
    nombre: 'Salón 3D con Medidas Reales',
    descripcionCorta: 'Visualización tridimensional del salón decorado, distribución de mesas y pista.',
    grupo: 'cliente',
    rutaApp: '/portal',
    pasoDemo: 3,
    foto: '/tecnologia/salon-3d.webp',
  },
  {
    id: 'asistente-cliente',
    nombre: 'Asistente AK del Cliente',
    descripcionCorta: 'Respuestas automáticas basadas en el contrato y coordinación sin fricción.',
    grupo: 'cliente',
    rutaApp: '/portal-cliente',
    pasoDemo: 3,
    foto: '/tecnologia/asistente-cliente.webp',
  },

  // 3. En la fiesta
  {
    id: 'pantalla-gigante-muro',
    nombre: 'Pantalla Gigante con Muro en Vivo',
    descripcionCorta: 'Rotación en vivo de fotos y dedicatorias de los invitados con moderación.',
    grupo: 'fiesta',
    rutaApp: '/evento/en-vivo',
    pasoDemo: 4,
    foto: '/tecnologia/pantalla-gigante.webp',
  },
  {
    id: 'barra-tecnologica',
    nombre: 'Barra de Tragos Tecnológica',
    descripcionCorta: 'Tótem táctil para pedir tragos, foto de recuerdo y aviso cuando está listo.',
    grupo: 'fiesta',
    rutaApp: '/evento/barra',
    pasoDemo: 4,
    foto: '/tecnologia/barra.webp',
  },
  {
    id: 'recepcion-digital',
    nombre: 'Recepción y Check-in Digital',
    descripcionCorta: 'Escaneo de QR o búsqueda por nombre en la entrada con aviso de mesa.',
    grupo: 'fiesta',
    rutaApp: '/recepcion',
    pasoDemo: 4,
    foto: '/tecnologia/recepcion.webp',
  },

  // 4. Entretenimiento
  {
    id: 'fotocabina',
    nombre: 'Fotocabina con Tiras Personalizadas',
    descripcionCorta: 'Fotos instantáneas con marcos temáticos, impresión y subida automática al muro.',
    grupo: 'entretenimiento',
    rutaApp: '/evento/social',
    pasoDemo: 4,
    foto: '/tecnologia/fotocabina.webp',
  },
  {
    id: 'plataforma-360',
    nombre: 'Plataforma Giratoria 360',
    descripcionCorta: 'Videos con efectos dinámicos y descarga instantánea por QR.',
    grupo: 'entretenimiento',
    rutaApp: '/evento/plataforma-360',
    pasoDemo: 4,
    foto: '/tecnologia/360.webp',
  },
  {
    id: 'espejo-magico',
    nombre: 'Espejo Mágico Táctil',
    descripcionCorta: 'Animaciones interactivas, firma en pantalla y fotos de cuerpo entero.',
    grupo: 'entretenimiento',
    rutaApp: '/evento/espejo-magico',
    pasoDemo: 4,
    foto: '/tecnologia/espejo.webp',
  },
  {
    id: 'buzon-recuerdos',
    nombre: 'Buzón de Recuerdos en Audio',
    descripcionCorta: 'Teléfono vintage donde los invitados graban mensajes de voz emotivos.',
    grupo: 'entretenimiento',
    rutaApp: '/evento/buzon',
    pasoDemo: 4,
    foto: '/tecnologia/buzon.webp',
  },

  // 5. Recuerdos
  {
    id: 'album-inteligente',
    nombre: 'Álbum del Recuerdo Inteligente',
    descripcionCorta: 'Galería completa que agrupa fotos de cada invitado con reconocimiento facial.',
    grupo: 'recuerdos',
    rutaApp: '/evento/social',
    pasoDemo: 5,
    foto: '/tecnologia/album.webp',
  },
  {
    id: 'video-de-vida',
    nombre: 'Video de Vida de la Fiesta',
    descripcionCorta: 'Resumen visual de los mejores momentos al ritmo de la música.',
    grupo: 'recuerdos',
    rutaApp: '/video-vida',
    pasoDemo: 5,
    foto: '/tecnologia/video-vida.webp',
  },

  // 6. Organización
  {
    id: 'simulador-presupuestos',
    nombre: 'Simulador de Presupuestos Transparente',
    descripcionCorta: 'Elegí tus servicios y calculá el costo exacto con ajuste anual claro.',
    grupo: 'organizacion',
    rutaApp: '/simulador-ak',
    pasoDemo: 1,
    foto: '/tecnologia/simulador.webp',
  },
];
