import type { GrupoTutorial } from '@/types/settings';

export interface TemaTutorial {
  clave: string;
  titulo: string;
  grupo: GrupoTutorial;
  descripcion?: string;
}

export const GRUPOS_TUTORIAL: readonly GrupoTutorial[] = [
  'Prospecto',
  'Cliente',
  'Invitado',
  'Proveedor y personal',
  'Equipo en el salón',
] as const;

/**
 * Única lista oficial de pantallas y secciones externas que pueden mostrar
 * el botón "¿Cómo funciona?" con un video tutorial de YouTube.
 * Orden 350: si se agrega una pantalla pública nueva con funciones propias,
 * se registra acá una sola vez y Settings + validaciones la toman automático.
 */
export const TEMAS_TUTORIAL: readonly TemaTutorial[] = [
  // --- Prospecto ---
  {
    clave: 'simulador',
    titulo: 'Simulador de presupuesto',
    grupo: 'Prospecto',
    descripcion: 'Cómo armar tu presupuesto paso a paso y elegir servicios.',
  },
  {
    clave: 'invitados-y-precio',
    titulo: 'Cuánto sale si sumo más invitados',
    grupo: 'Prospecto',
    descripcion: 'Cómo ajustar adultos y niños para ver el precio actualizado.',
  },
  {
    clave: 'club-uruguay',
    titulo: 'Salón Club Uruguay',
    grupo: 'Prospecto',
    descripcion: 'Propuesta integral y detalles del salón Club Uruguay.',
  },
  {
    clave: 'experiencia',
    titulo: 'Experiencia AK',
    grupo: 'Prospecto',
    descripcion: 'Recorrido por nuestra tecnología, música, fotografía y show.',
  },
  {
    clave: 'paginas-por-tipo',
    titulo: 'Páginas por tipo de fiesta (bodas, 15, cumpleaños, empresas, infantiles)',
    grupo: 'Prospecto',
    descripcion: 'Cómo explorar los servicios y armar tu fiesta según el tipo de evento.',
  },
  {
    clave: 'reunion-led',
    titulo: 'Presentación en pantalla gigante (LED)',
    grupo: 'Prospecto',
    descripcion: 'Cómo usar la presentación comercial interactiva durante la reunión.',
  },
  {
    clave: 'buscar-en-la-web',
    titulo: 'Buscador de servicios y consejos',
    grupo: 'Prospecto',
    descripcion: 'Cómo buscar ideas, preguntas frecuentes y servicios de AK.',
  },
  {
    clave: 'blog-consejos',
    titulo: 'Blog de guías para tu fiesta',
    grupo: 'Prospecto',
    descripcion: 'Cómo aprovechar nuestras guías y artículos para organizar tu evento.',
  },
  {
    clave: 'enlaces-bio',
    titulo: 'Enlaces rápidos de AK (redes)',
    grupo: 'Prospecto',
    descripcion: 'Accesos directos al simulador, fiestas y contacto por WhatsApp.',
  },

  // --- Cliente ---
  {
    clave: 'portal-cliente',
    titulo: 'Portal del cliente (vista general)',
    grupo: 'Cliente',
    descripcion: 'Recorrido completo por tu portal privado para organizar tu fiesta.',
  },
  {
    clave: 'cliente-resumen',
    titulo: 'Resumen del evento en el portal',
    grupo: 'Cliente',
    descripcion: 'Dónde consultar fecha, horario, salón y datos generales de tu fiesta.',
  },
  {
    clave: 'cliente-pendientes',
    titulo: 'Cosas pendientes por completar',
    grupo: 'Cliente',
    descripcion: 'Cómo revisar y completar los pasos pendientes de tu evento.',
  },
  {
    clave: 'cliente-lo-que-llevas',
    titulo: 'Lo que tenés que llevar al salón',
    grupo: 'Cliente',
    descripcion: 'Cómo ir marcando la lista de cosas que preparás para el día del evento.',
  },
  {
    clave: 'cliente-pagos',
    titulo: 'Pagos, cuotas y comprobantes',
    grupo: 'Cliente',
    descripcion: 'Cómo ver tus cuotas, vencimientos, saldo y enviar comprobantes.',
  },
  {
    clave: 'contrato-y-pagos',
    titulo: 'Contrato y firma digital',
    grupo: 'Cliente',
    descripcion: 'Cómo leer, descargar y firmar tu contrato de servicios.',
  },
  {
    clave: 'cliente-invitados',
    titulo: 'Invitados y confirmaciones',
    grupo: 'Cliente',
    descripcion: 'Cómo cargar invitados y seguir quién confirmó asistencia.',
  },
  {
    clave: 'mesas',
    titulo: 'Mesas y ubicación en el salón',
    grupo: 'Cliente',
    descripcion: 'Cómo organizar las mesas y asignar a cada invitado.',
  },
  {
    clave: 'cliente-musica',
    titulo: 'Música y lista de canciones',
    grupo: 'Cliente',
    descripcion: 'Cómo cargar tus canciones favoritas, momentos especiales y prohibidas.',
  },
  {
    clave: 'cliente-fotos-video',
    titulo: 'Fotos, muro y recuerdos en el portal',
    grupo: 'Cliente',
    descripcion: 'Cómo ver y descargar fotos y videos de tu evento.',
  },
  {
    clave: 'video-vida',
    titulo: 'Video de Vida (subir fotos)',
    grupo: 'Cliente',
    descripcion: 'Cómo subir y ordenar las fotos para tu Video de Vida.',
  },
  {
    clave: 'decoracion',
    titulo: 'Diseño y propuesta de decoración',
    grupo: 'Cliente',
    descripcion: 'Cómo revisar los colores, el plano 3D y aprobar la decoración.',
  },
  {
    clave: 'moodboard',
    titulo: 'Moodboard e inspiración visual',
    grupo: 'Cliente',
    descripcion: 'Cómo guardar ideas y marcar tus referencias favoritas.',
  },
  {
    clave: 'cliente-menu',
    titulo: 'Menú e itinerario',
    grupo: 'Cliente',
    descripcion: 'Cómo revisar platos elegidos y los horarios del cronograma.',
  },
  {
    clave: 'cliente-mensajes',
    titulo: 'Mensajes y dudas con el equipo',
    grupo: 'Cliente',
    descripcion: 'Cómo escribirnos y consultar preguntas frecuentes dentro del portal.',
  },
  {
    clave: 'cliente-pagina-publica',
    titulo: 'Página pública e invitación digital',
    grupo: 'Cliente',
    descripcion: 'Cómo compartir el enlace y configurar la web de tu fiesta.',
  },
  {
    clave: 'mercado-pago',
    titulo: 'Pago online con Mercado Pago',
    grupo: 'Cliente',
    descripcion: 'Cómo funciona el estado y confirmación del pago online.',
  },
  {
    clave: 'encuesta',
    titulo: 'Encuesta de satisfacción',
    grupo: 'Cliente',
    descripcion: 'Cómo dejar tu valoración después de la fiesta.',
  },
  {
    clave: 'post-fiesta',
    titulo: 'Resumen y recuerdos post-fiesta',
    grupo: 'Cliente',
    descripcion: 'Cómo ver el álbum, video recuerdo y resumen final después del evento.',
  },

  // --- Invitado ---
  {
    clave: 'portal-invitado',
    titulo: 'Portal personal del invitado',
    grupo: 'Invitado',
    descripcion: 'Cómo usar tu pase con mesa, QR, fotos y actividades.',
  },
  {
    clave: 'invitacion',
    titulo: 'Invitación digital',
    grupo: 'Invitado',
    descripcion: 'Cómo ver ubicación, horario, vestimenta y confirmar lugar.',
  },
  {
    clave: 'confirmar-asistencia',
    titulo: 'Confirmar asistencia (RSVP)',
    grupo: 'Invitado',
    descripcion: 'Cómo confirmar si asistís, avisar acompañantes y restricciones de comida.',
  },
  {
    clave: 'mi-mesa',
    titulo: 'Buscar mi mesa',
    grupo: 'Invitado',
    descripcion: 'Cómo encontrar rápido en qué mesa te sentás.',
  },
  {
    clave: 'subir-fotos-videos',
    titulo: 'Subir fotos y videos al muro / zona digital',
    grupo: 'Invitado',
    descripcion: 'Cómo mandar tus fotos y videos para verlos en pantalla gigante y álbum.',
  },
  {
    clave: 'buzon',
    titulo: 'Buzón de dedicatorias',
    grupo: 'Invitado',
    descripcion: 'Cómo grabar un saludo de audio o video o dejar una dedicatoria.',
  },
  {
    clave: 'pedir-trago',
    titulo: 'Pedir trago en la barra',
    grupo: 'Invitado',
    descripcion: 'Cómo elegir tu trago desde el celular y ver cuándo está listo.',
  },
  {
    clave: 'pedir-cancion',
    titulo: 'Pedir canción al DJ',
    grupo: 'Invitado',
    descripcion: 'Cómo sugerir un tema musical para la pista.',
  },
  {
    clave: 'fotocabina',
    titulo: 'Fotocabina',
    grupo: 'Invitado',
    descripcion: 'Cómo sacarte la tira de fotos y llevarte tu copia digital.',
  },
  {
    clave: 'plataforma-360',
    titulo: 'Plataforma 360',
    grupo: 'Invitado',
    descripcion: 'Cómo grabar tu video 360 y escanear el QR para descargarlo.',
  },
  {
    clave: 'espejo-magico',
    titulo: 'Espejo Mágico',
    grupo: 'Invitado',
    descripcion: 'Cómo sacarte la foto con filtros, firma y descarga rápida.',
  },
  {
    clave: 'vogue',
    titulo: 'Cabina Vogue',
    grupo: 'Invitado',
    descripcion: 'Cómo posar para la toma estilo editorial y descargar tu video.',
  },
  {
    clave: 'touchpix',
    titulo: 'TouchPix',
    grupo: 'Invitado',
    descripcion: 'Cómo usar la cámara interactiva para fotos, GIF o boomerang.',
  },
  {
    clave: 'realidad-aumentada',
    titulo: 'Realidad Aumentada (AR)',
    grupo: 'Invitado',
    descripcion: 'Cómo activar la experiencia interactiva desde la cámara del celular.',
  },
  {
    clave: 'en-vivo',
    titulo: 'Transmisión, trivia y show en vivo',
    grupo: 'Invitado',
    descripcion: 'Cómo participar de la trivia y sincronización de luces en vivo.',
  },
  {
    clave: 'buscarme',
    titulo: 'Buscarme en las fotos (selfie)',
    grupo: 'Invitado',
    descripcion: 'Cómo encontrar todas las fotos donde aparecés sacándote una selfie.',
  },
  {
    clave: 'album',
    titulo: 'Álbum digital de la fiesta',
    grupo: 'Invitado',
    descripcion: 'Cómo recorrer y descargar las fotos compartidas de la fiesta.',
  },
  {
    clave: 'video-recuerdo',
    titulo: 'Video recuerdo de la fiesta',
    grupo: 'Invitado',
    descripcion: 'Cómo ver y descargar el video resumen del evento.',
  },
  {
    clave: 'hub',
    titulo: 'Puerta de la fiesta (Hub)',
    grupo: 'Invitado',
    descripcion: 'Cómo acceder rápido a menú, mesa, fotos, barra y música desde el QR.',
  },
  {
    clave: 'bienvenida-salon',
    titulo: 'Cartelera de bienvenida en el salón',
    grupo: 'Invitado',
    descripcion: 'Cómo acceder a la pantalla de recepción y bienvenida de la fiesta.',
  },

  // --- Proveedor y personal ---
  {
    clave: 'portal-proveedor',
    titulo: 'Portal para proveedores externos',
    grupo: 'Proveedor y personal',
    descripcion: 'Cómo consultar horarios, carga operativa e indicaciones del evento.',
  },
  {
    clave: 'acceso-personal',
    titulo: 'Acceso del personal y recibos',
    grupo: 'Proveedor y personal',
    descripcion: 'Cómo ver horario de llegada, registrar asistencia y firmar recibos.',
  },
  {
    clave: 'staff-cronograma',
    titulo: 'Cronograma, accesos y logística en el salón',
    grupo: 'Proveedor y personal',
    descripcion: 'Cómo consultar la hoja de horarios, accesos y lista de materiales.',
  },

  // --- Equipo en el salón ---
  {
    clave: 'barman',
    titulo: 'Pantalla del barman y estadísticas de barra',
    grupo: 'Equipo en el salón',
    descripcion: 'Cómo recibir pedidos de tragos, marcarlos listos y ver el consumo.',
  },
  {
    clave: 'recepcion',
    titulo: 'Recepción y check-in en puerta',
    grupo: 'Equipo en el salón',
    descripcion: 'Cómo escanear QR o buscar invitados en puerta para marcar ingreso.',
  },
  {
    clave: 'moderacion',
    titulo: 'Moderación del muro en vivo',
    grupo: 'Equipo en el salón',
    descripcion: 'Cómo aprobar o ocultar fotos y dedicatorias antes de mostrarlas.',
  },
  {
    clave: 'control-pantalla',
    titulo: 'Control de pantalla gigante y en vivo',
    grupo: 'Equipo en el salón',
    descripcion: 'Cómo cambiar vistas, activar juegos y manejar lo que sale en pantalla.',
  },
  {
    clave: 'impresion',
    titulo: 'Estación de impresión de fotos',
    grupo: 'Equipo en el salón',
    descripcion: 'Cómo revisar la cola e imprimir fotos de cabina y espejo.',
  },
  {
    clave: 'totem',
    titulo: 'Tótem interactivo del salón',
    grupo: 'Equipo en el salón',
    descripcion: 'Cómo operar la estación táctil de recepción y autoservicio en el salón.',
  },
] as const;

export const CLAVES_TEMAS_TUTORIAL = new Set(TEMAS_TUTORIAL.map((t) => t.clave));

export function esClaveTemaTutorial(clave: string): boolean {
  return CLAVES_TEMAS_TUTORIAL.has(clave);
}

/**
 * Valida y extrae el ID de YouTube únicamente de los cuatro formatos permitidos:
 * - youtube.com/watch?v=...
 * - youtu.be/...
 * - youtube.com/shorts/...
 * - youtube.com/embed/...
 * Acepta videos ocultos (no listados). Cualquier otra dirección o texto devuelve null.
 */
export function extraerYoutubeVideoIdTutorial(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const conEsquema = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(conEsquema);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  let candidateId: string | null = null;

  if (host === 'youtu.be' || host === 'www.youtu.be') {
    const seg = parsed.pathname.split('/').filter(Boolean);
    if (seg.length === 1) {
      candidateId = seg[0];
    }
  } else if (
    host === 'youtube.com' ||
    host === 'www.youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'www.youtube-nocookie.com' ||
    host === 'youtube-nocookie.com'
  ) {
    const pathname = parsed.pathname;
    if (pathname === '/watch') {
      candidateId = parsed.searchParams.get('v');
    } else if (pathname.startsWith('/shorts/')) {
      const seg = pathname.slice('/shorts/'.length).split('/').filter(Boolean);
      if (seg.length >= 1) candidateId = seg[0];
    } else if (pathname.startsWith('/embed/')) {
      const seg = pathname.slice('/embed/'.length).split('/').filter(Boolean);
      if (seg.length >= 1) candidateId = seg[0];
    }
  }

  if (!candidateId || !/^[A-Za-z0-9_-]{3,32}$/.test(candidateId)) {
    return null;
  }

  return candidateId;
}

export function validarEnlaceYoutubeTutorial(url: string): {
  ok: boolean;
  videoId?: string;
  youtubeUrl?: string;
  error?: string;
} {
  const trimmed = (url || '').trim();
  if (!trimmed) {
    return { ok: true };
  }
  const videoId = extraerYoutubeVideoIdTutorial(trimmed);
  if (!videoId) {
    return { ok: false, error: 'Pegá un enlace de YouTube' };
  }
  return {
    ok: true,
    videoId,
    youtubeUrl: trimmed,
  };
}
