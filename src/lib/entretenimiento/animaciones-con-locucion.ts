/**
 * Módulo de Animaciones con Locución para Espejo Mágico (estilo Mirror Me).
 *
 * Cada paso del flujo (saludar, pedir pose, cuenta regresiva, despedida)
 * cuenta con una animación visual atractiva en pantalla acompañada
 * de locución sintetizada en voz alta para interactuar con los invitados.
 */

export type MomentoAnimacion = 'saludo' | 'pose' | 'cuenta' | 'despedida';

export interface AnimacionConLocucion {
  id: string;
  cuando: MomentoAnimacion;
  textoHablado: string;
  animacion: string;
  titulo: string;
  subtitulo?: string;
  emoji?: string;
  tiposFiesta?: string[];
  motionConfig?: {
    initial: Record<string, any>;
    animate: Record<string, any>;
    exit?: Record<string, any>;
    transition: Record<string, any>;
  };
}

export const ANIMACIONES_CON_LOCUCION: AnimacionConLocucion[] = [
  // --- SALUDO (5 animaciones) ---
  {
    id: 'bienvenida-elegante',
    cuando: 'saludo',
    textoHablado: '¡Hola! Te doy la bienvenida al espejo mágico. Tocá la pantalla para empezar a brillar.',
    animacion: 'animate-pulse scale-105 transition-all duration-700',
    titulo: '¡TOCÁ LA PANTALLA!',
    subtitulo: 'Acercate y comenzá la magia',
    emoji: '✨',
    tiposFiesta: ['general', 'boda', '15anos', 'corporativo'],
    motionConfig: {
      initial: { opacity: 0, scale: 0.85, y: 20 },
      animate: { opacity: 1, scale: [1, 1.05, 1], y: [0, -6, 0] },
      exit: { opacity: 0, scale: 0.9, y: -20 },
      transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    id: 'saludo-boda',
    cuando: 'saludo',
    textoHablado: '¡Qué lindo verte acá! Bienvenidos a celebrar este amor con todo. Tocá la pantalla para dejarles un recuerdo.',
    animacion: 'animate-pulse scale-110 duration-700',
    titulo: '¡NOCHE DE CELEBRACIÓN!',
    subtitulo: 'Dejales tu mejor recuerdo a los novios',
    emoji: '💍',
    tiposFiesta: ['boda'],
    motionConfig: {
      initial: { opacity: 0, scale: 0.8, y: 25 },
      animate: {
        opacity: 1,
        scale: [1, 1.06, 1],
        filter: [
          'drop-shadow(0 0 0px rgba(251,191,36,0))',
          'drop-shadow(0 0 16px rgba(251,191,36,0.6))',
          'drop-shadow(0 0 0px rgba(251,191,36,0))',
        ],
      },
      exit: { opacity: 0, scale: 0.9, y: -15 },
      transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    id: 'saludo-15anos',
    cuando: 'saludo',
    textoHablado: '¡Che, qué facha que tenés! Acercate al espejo y preparate para brillar en esta noche inolvidable.',
    animacion: 'animate-bounce transition-transform duration-600',
    titulo: '¡FIESTA DE 15!',
    subtitulo: 'Tocá la pantalla y empezá',
    emoji: '👑',
    tiposFiesta: ['15anos'],
    motionConfig: {
      initial: { opacity: 0, scale: 0.75, y: 30 },
      animate: { opacity: 1, scale: [1, 1.08, 1], y: [0, -10, 0] },
      exit: { opacity: 0, scale: 0.85, y: -20 },
      transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    id: 'saludo-cumpleanos',
    cuando: 'saludo',
    textoHablado: '¡Qué alegría que viniste a festejar! Ponete frente al espejo que hoy se baila y se festeja fuerte.',
    animacion: 'scale-105 duration-600',
    titulo: '¡A FESTEJAR EL CUMPLE!',
    subtitulo: 'Tocá la pantalla para tu foto',
    emoji: '🎂',
    tiposFiesta: ['cumpleanos'],
    motionConfig: {
      initial: { opacity: 0, rotate: -3, scale: 0.85 },
      animate: { opacity: 1, rotate: [-2, 2, -2], scale: [1, 1.04, 1] },
      exit: { opacity: 0, scale: 0.9 },
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    id: 'saludo-rioplatense',
    cuando: 'saludo',
    textoHablado: '¡Buenas, che! Qué buena onda que tenés. Tocá la pantalla que el espejo te está esperando.',
    animacion: 'animate-pulse scale-105 duration-500',
    titulo: '¡QUÉ BUENA ONDA!',
    subtitulo: 'Acercate y sacate un fotón',
    emoji: '🥂',
    tiposFiesta: ['general', 'cumpleanos', '15anos'],
    motionConfig: {
      initial: { opacity: 0, scale: 0.8, y: 15 },
      animate: { opacity: 1, scale: 1, y: [0, -8, 0] },
      exit: { opacity: 0, scale: 0.9, y: -15 },
      transition: { duration: 1.9, repeat: Infinity, ease: 'easeInOut' },
    },
  },

  // --- POSE (5 animaciones) ---
  {
    id: 'pose-estrella',
    cuando: 'pose',
    textoHablado: '¡Qué elegancia! Mirá al espejo y mostrá tu pose de estrella.',
    animacion: 'animate-bounce transition-transform duration-500',
    titulo: '¡MOSTRÁ TU MEJOR POSE!',
    subtitulo: 'Sonreí, estás por salir espectacular',
    emoji: '📸',
    tiposFiesta: ['general', '15anos', 'boda', 'cumpleanos'],
    motionConfig: {
      initial: { opacity: 0, scale: 0.7, y: 20 },
      animate: { opacity: 1, scale: [1, 1.12, 1], y: [0, -12, 0] },
      exit: { opacity: 0, scale: 0.9 },
      transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    id: 'pose-divertida',
    cuando: 'pose',
    textoHablado: '¡Momento divertido! Hacé una mueca o pose graciosa con tus amigos.',
    animacion: 'animate-spin-slow duration-1000',
    titulo: '¡POSE DIVERTIDA!',
    subtitulo: '¡Soltate y disfrutá!',
    emoji: '🤪',
    tiposFiesta: ['cumpleanos', '15anos'],
    motionConfig: {
      initial: { opacity: 0, rotate: -8, scale: 0.8 },
      animate: { opacity: 1, rotate: [-6, 6, -6], scale: [1, 1.07, 1] },
      exit: { opacity: 0, scale: 0.8, rotate: 10 },
      transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    id: 'pose-boda-romance',
    cuando: 'pose',
    textoHablado: '¡Puro glamour! Mirá a la cámara con tu mejor sonrisa romántica.',
    animacion: 'scale-105 duration-600',
    titulo: '¡PURO GLAMOUR Y AMOR!',
    subtitulo: 'Mirá la cámara con tu mejor perfil',
    emoji: '💖',
    tiposFiesta: ['boda'],
    motionConfig: {
      initial: { opacity: 0, scale: 0.85, y: 15 },
      animate: {
        opacity: 1,
        scale: [1, 1.05, 1],
        filter: [
          'drop-shadow(0 0 0px rgba(244,114,182,0))',
          'drop-shadow(0 0 18px rgba(244,114,182,0.7))',
          'drop-shadow(0 0 0px rgba(244,114,182,0))',
        ],
      },
      exit: { opacity: 0, scale: 0.9 },
      transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    id: 'pose-15anos-actitud',
    cuando: 'pose',
    textoHablado: '¡Mucha actitud! Tirale un beso al espejo o meté una pose canchera.',
    animacion: 'scale-110 duration-600',
    titulo: '¡METELE ACTITUD!',
    subtitulo: 'Pose canchera para la cámara',
    emoji: '💃',
    tiposFiesta: ['15anos'],
    motionConfig: {
      initial: { opacity: 0, scale: 0.7, y: 25 },
      animate: { opacity: 1, scale: [1, 1.1, 1], rotate: [-2, 2, -2] },
      exit: { opacity: 0, scale: 0.85, y: -15 },
      transition: { duration: 1.7, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    id: 'pose-facha-rioplatense',
    cuando: 'pose',
    textoHablado: '¡Mirá qué facha! Acomodate el pelo, levantá la copa y mirá al frente.',
    animacion: 'duration-500',
    titulo: '¡MIRÁ QUÉ FACHA!',
    subtitulo: 'Levantá la mirada y sonreí',
    emoji: '🕶️',
    tiposFiesta: ['general', 'cumpleanos'],
    motionConfig: {
      initial: { opacity: 0, scale: 0.8, y: 15 },
      animate: { opacity: 1, scale: [1, 1.06, 1], y: [0, -7, 0] },
      exit: { opacity: 0, scale: 0.9 },
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
  },

  // --- CUENTA REGRESIVA (5 animaciones) ---
  {
    id: 'cuenta-emocion',
    cuando: 'cuenta',
    textoHablado: '¡Tres, dos, uno, sonrisa inolvidable!',
    animacion: 'animate-ping duration-700',
    titulo: '¡PREPARATE!',
    subtitulo: 'La foto se toma en un segundo',
    emoji: '🎉',
    tiposFiesta: ['general', '15anos', 'cumpleanos'],
    motionConfig: {
      initial: { opacity: 0, scale: 0.6 },
      animate: { opacity: 1, scale: [0.9, 1.15, 1], y: [0, -6, 0] },
      exit: { opacity: 0, scale: 1.2 },
      transition: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    id: 'cuenta-boda-magica',
    cuando: 'cuenta',
    textoHablado: '¡Atención todos! Tres, dos, uno... ¡sonrían con el corazón!',
    animacion: 'duration-600',
    titulo: '¡SONREÍ CON EL CORAZÓN!',
    subtitulo: 'Tres, dos, uno...',
    emoji: '👰',
    tiposFiesta: ['boda'],
    motionConfig: {
      initial: { opacity: 0, scale: 0.75 },
      animate: {
        opacity: 1,
        scale: [1, 1.08, 1],
        filter: [
          'drop-shadow(0 0 0px rgba(251,191,36,0))',
          'drop-shadow(0 0 20px rgba(251,191,36,0.75))',
          'drop-shadow(0 0 0px rgba(251,191,36,0))',
        ],
      },
      exit: { opacity: 0, scale: 1.1 },
      transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    id: 'cuenta-15anos-brillo',
    cuando: 'cuenta',
    textoHablado: '¡Dale que sale! Tres, dos, uno... ¡a brillar!',
    animacion: 'duration-500',
    titulo: '¡DALE QUE SALE!',
    subtitulo: 'Tres, dos, uno... ¡flash!',
    emoji: '⭐',
    tiposFiesta: ['15anos'],
    motionConfig: {
      initial: { opacity: 0, scale: 0.65, rotate: -10 },
      animate: { opacity: 1, scale: [0.95, 1.18, 1], rotate: [-4, 4, -4] },
      exit: { opacity: 0, scale: 1.2 },
      transition: { duration: 0.85, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    id: 'cuenta-cumpleanos-alegria',
    cuando: 'cuenta',
    textoHablado: '¡Todos listos! Tres, dos, uno... ¡gritá fuerte de alegría!',
    animacion: 'duration-500',
    titulo: '¡LISTOS PARA EL FLASH!',
    subtitulo: 'Tres, dos, uno... ¡sonrisa!',
    emoji: '🥳',
    tiposFiesta: ['cumpleanos'],
    motionConfig: {
      initial: { opacity: 0, scale: 0.7, y: 15 },
      animate: { opacity: 1, scale: [1, 1.14, 1], y: [0, -10, 0] },
      exit: { opacity: 0, scale: 1.15 },
      transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    id: 'cuenta-rioplatense-listos',
    cuando: 'cuenta',
    textoHablado: '¡Ojo que dispara! Tres, dos, uno... ¡foto!',
    animacion: 'duration-500',
    titulo: '¡OJO QUE SALE LA FOTO!',
    subtitulo: 'Tres, dos, uno...',
    emoji: '⚡',
    tiposFiesta: ['general', 'cumpleanos', 'boda'],
    motionConfig: {
      initial: { opacity: 0, scale: 0.6 },
      animate: { opacity: 1, scale: [0.9, 1.16, 1] },
      exit: { opacity: 0, scale: 1.25 },
      transition: { duration: 0.75, repeat: Infinity, ease: 'easeInOut' },
    },
  },

  // --- DESPEDIDA (5 animaciones) ---
  {
    id: 'despedida-vip',
    cuando: 'despedida',
    textoHablado: '¡Quedó espectacular! Escaneá el código QR en pantalla y llevate tu recuerdo ya.',
    animacion: 'animate-fade-in transition-opacity duration-1000',
    titulo: '¡FOTO ESPECTACULAR!',
    subtitulo: 'Escaneá el QR para descargar tu foto',
    emoji: '🌟',
    tiposFiesta: ['general', 'boda', '15anos', 'corporativo'],
    motionConfig: {
      initial: { opacity: 0, scale: 0.8, y: 20 },
      animate: { opacity: 1, scale: [1, 1.04, 1], y: [0, -5, 0] },
      exit: { opacity: 0, scale: 0.9, y: -20 },
      transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    id: 'despedida-boda-recuerdo',
    cuando: 'despedida',
    textoHablado: '¡Hermoso recuerdo de boda! Llevatelo en tu celular escaneando el código QR.',
    animacion: 'duration-800',
    titulo: '¡RECUERDO INOLVIDABLE!',
    subtitulo: 'Escaneá el QR y guardalo en tu cel',
    emoji: '💌',
    tiposFiesta: ['boda'],
    motionConfig: {
      initial: { opacity: 0, scale: 0.85, y: 15 },
      animate: {
        opacity: 1,
        scale: [1, 1.05, 1],
        filter: [
          'drop-shadow(0 0 0px rgba(251,191,36,0))',
          'drop-shadow(0 0 16px rgba(251,191,36,0.6))',
          'drop-shadow(0 0 0px rgba(251,191,36,0))',
        ],
      },
      exit: { opacity: 0, scale: 0.9 },
      transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    id: 'despedida-15anos-foton',
    cuando: 'despedida',
    textoHablado: '¡Qué fotón, por favor! Escaneá el QR y subilo directo a tus redes.',
    animacion: 'duration-800',
    titulo: '¡QUÉ FOTÓN!',
    subtitulo: 'Escaneá el QR y compartilo',
    emoji: '🔥',
    tiposFiesta: ['15anos'],
    motionConfig: {
      initial: { opacity: 0, scale: 0.75, y: 20 },
      animate: { opacity: 1, scale: [1, 1.08, 1], y: [0, -8, 0] },
      exit: { opacity: 0, scale: 0.85 },
      transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    id: 'despedida-cumpleanos-fiesta',
    cuando: 'despedida',
    textoHablado: '¡Salieron geniales! Escaneá el código y seguí disfrutando la fiesta.',
    animacion: 'duration-800',
    titulo: '¡SALIERON GENIALES!',
    subtitulo: 'Llevate tu foto con el QR',
    emoji: '🎈',
    tiposFiesta: ['cumpleanos'],
    motionConfig: {
      initial: { opacity: 0, scale: 0.8, rotate: -2 },
      animate: { opacity: 1, scale: [1, 1.05, 1], rotate: [-2, 2, -2] },
      exit: { opacity: 0, scale: 0.9 },
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  {
    id: 'despedida-rioplatense-crack',
    cuando: 'despedida',
    textoHablado: '¡Sos un crack! Tu foto ya está lista. Escaneá el QR y seguí bailando.',
    animacion: 'duration-800',
    titulo: '¡SOS UN CRACK!',
    subtitulo: 'Escaneá el QR y a seguir la fiesta',
    emoji: '🏆',
    tiposFiesta: ['general', 'cumpleanos', '15anos'],
    motionConfig: {
      initial: { opacity: 0, scale: 0.8, y: 15 },
      animate: {
        opacity: 1,
        scale: [1, 1.06, 1],
        y: [0, -6, 0],
        filter: [
          'drop-shadow(0 0 0px rgba(251,191,36,0))',
          'drop-shadow(0 0 14px rgba(251,191,36,0.65))',
          'drop-shadow(0 0 0px rgba(251,191,36,0))',
        ],
      },
      exit: { opacity: 0, scale: 0.9 },
      transition: { duration: 2.1, repeat: Infinity, ease: 'easeInOut' },
    },
  },
];

/**
 * Obtiene las animaciones con locución permitidas para la fiesta,
 * filtradas opcionalmente por allowedTemplateIds configurados.
 */
export function obtenerAnimacionesParaFiesta(
  allowedTemplateIds?: string[],
  tipoCelebracion?: string
): AnimacionConLocucion[] {
  let lista = ANIMACIONES_CON_LOCUCION;

  if (tipoCelebracion) {
    const tipoNorm = tipoCelebracion.toLowerCase();
    const filtradasPorTipo = lista.filter(
      (a) => !a.tiposFiesta || a.tiposFiesta.includes(tipoNorm) || a.tiposFiesta.includes('general')
    );
    if (filtradasPorTipo.length > 0) {
      lista = filtradasPorTipo;
    }
  }

  if (allowedTemplateIds && allowedTemplateIds.length > 0) {
    const filtradas = lista.filter((a) => allowedTemplateIds.includes(a.id));
    if (filtradas.length > 0) {
      lista = filtradas;
    }
  }

  return lista;
}

/**
 * Obtiene la animación con locución activa para el momento actual del espejo,
 * alternando según el índice de rotación si se proporciona.
 */
export function obtenerAnimacionPorMomento(
  momento: MomentoAnimacion,
  allowedTemplateIds?: string[],
  tipoCelebracion?: string,
  indiceRotacion?: number
): AnimacionConLocucion | undefined {
  const disponibles = obtenerAnimacionesParaFiesta(allowedTemplateIds, tipoCelebracion).filter(
    (a) => a.cuando === momento
  );

  if (disponibles.length > 0) {
    if (typeof indiceRotacion === 'number' && Number.isFinite(indiceRotacion)) {
      const idx = Math.abs(indiceRotacion) % disponibles.length;
      return disponibles[idx];
    }
    return disponibles[0];
  }

  const fallback = ANIMACIONES_CON_LOCUCION.filter((a) => a.cuando === momento);
  if (fallback.length > 0) {
    if (typeof indiceRotacion === 'number' && Number.isFinite(indiceRotacion)) {
      const idx = Math.abs(indiceRotacion) % fallback.length;
      return fallback[idx];
    }
    return fallback[0];
  }

  return undefined;
}

/**
 * Estructura de plantillas predefinidas para la ronda interactiva "¿Quién lo dijo?".
 */
export interface RondaPredefinidaTrivia {
  id: string;
  tipoCelebracion: 'boda' | '15anos' | 'cumpleanos' | 'general';
  tituloRonda: string;
  subtitulo: string;
  descripcion: string;
  opcionesDefault: { id: string; text: string; emoji?: string }[];
  preguntas: {
    id: string;
    question: string;
    options: { id: string; text: string; emoji?: string }[];
    correctOptionId: string;
  }[];
}

export const RONDAS_PREDEFINIDAS_TRIVIA: RondaPredefinidaTrivia[] = [
  {
    id: 'quien-lo-dijo-boda',
    tipoCelebracion: 'boda',
    tituloRonda: '¿Quién lo dijo? ¿Él o Ella?',
    subtitulo: 'Ronda especial de parejas',
    descripcion: 'Adiviná quién dijo cada frase o quién tiene cada costumbre en la pareja.',
    opcionesDefault: [
      { id: 'el', text: 'Él', emoji: '🤵' },
      { id: 'ella', text: 'Ella', emoji: '👰' },
      { id: 'ambos', text: 'Los dos por igual', emoji: '💕' },
    ],
    preguntas: [
      {
        id: 'boda-q1',
        question: '¿Quién dijo "te amo" primero?',
        options: [
          { id: 'el', text: 'Él', emoji: '🤵' },
          { id: 'ella', text: 'Ella', emoji: '👰' },
          { id: 'ambos', text: 'Los dos a la vez', emoji: '💕' },
        ],
        correctOptionId: 'el',
      },
      {
        id: 'boda-q2',
        question: '¿Quién tarda más en cambiarse para salir?',
        options: [
          { id: 'el', text: 'Él', emoji: '🤵' },
          { id: 'ella', text: 'Ella', emoji: '👰' },
          { id: 'ambos', text: 'Empate total', emoji: '⏰' },
        ],
        correctOptionId: 'ella',
      },
      {
        id: 'boda-q3',
        question: '¿Quién es más probable que se pierda manejando con el GPS?',
        options: [
          { id: 'el', text: 'Él', emoji: '🤵' },
          { id: 'ella', text: 'Ella', emoji: '👰' },
          { id: 'ambos', text: 'Ninguno de los dos', emoji: '🧭' },
        ],
        correctOptionId: 'el',
      },
      {
        id: 'boda-q4',
        question: '¿Quién dio el paso para el primer beso?',
        options: [
          { id: 'el', text: 'Él', emoji: '🤵' },
          { id: 'ella', text: 'Ella', emoji: '👰' },
          { id: 'ambos', text: 'Fue mutuo y mágico', emoji: '💋' },
        ],
        correctOptionId: 'ella',
      },
      {
        id: 'boda-q5',
        question: '¿Quién es el chef estrella en la cocina de todos los días?',
        options: [
          { id: 'el', text: 'Él', emoji: '🤵' },
          { id: 'ella', text: 'Ella', emoji: '👰' },
          { id: 'ambos', text: 'Delivery siempre', emoji: '🍕' },
        ],
        correctOptionId: 'el',
      },
    ],
  },
  {
    id: 'quien-lo-dijo-15anos',
    tipoCelebracion: '15anos',
    tituloRonda: '¿Quién lo dijo? ¿La quinceañera o la familia?',
    subtitulo: 'Ronda especial de 15',
    descripcion: 'Descubrí los secretos más divertidos entre la quinceañera y su familia.',
    opcionesDefault: [
      { id: 'quinceanera', text: 'La quinceañera', emoji: '👑' },
      { id: 'familia', text: 'La familia / Papás', emoji: '👨‍👩‍👧' },
      { id: 'amigos', text: 'Los amigos', emoji: '🎉' },
    ],
    preguntas: [
      {
        id: '15-q1',
        question: '¿Quién estaba más nervioso antes de entrar al salón?',
        options: [
          { id: 'quinceanera', text: 'La quinceañera', emoji: '👑' },
          { id: 'familia', text: 'La familia / Papás', emoji: '👨‍👩‍👧' },
          { id: 'amigos', text: 'Los amigos', emoji: '🎉' },
        ],
        correctOptionId: 'familia',
      },
      {
        id: '15-q2',
        question: '¿Quién duerme hasta más tarde los domingos?',
        options: [
          { id: 'quinceanera', text: 'La quinceañera', emoji: '👑' },
          { id: 'familia', text: 'Los papás', emoji: '😴' },
          { id: 'amigos', text: 'Todos por igual', emoji: '🛌' },
        ],
        correctOptionId: 'quinceanera',
      },
      {
        id: '15-q3',
        question: '¿Quién eligió los temas principales de la playlist de baile?',
        options: [
          { id: 'quinceanera', text: 'La quinceañera', emoji: '👑' },
          { id: 'familia', text: 'La familia', emoji: '🎶' },
          { id: 'amigos', text: 'Los amigos', emoji: '🔥' },
        ],
        correctOptionId: 'quinceanera',
      },
      {
        id: '15-q4',
        question: '¿Quién lloró primero al ver el video emotivo?',
        options: [
          { id: 'quinceanera', text: 'La quinceañera', emoji: '👑' },
          { id: 'familia', text: 'Los papás', emoji: '🥺' },
          { id: 'amigos', text: 'Todos juntos', emoji: '🤧' },
        ],
        correctOptionId: 'familia',
      },
      {
        id: '15-q5',
        question: '¿Quién es más adicto al celular y las redes?',
        options: [
          { id: 'quinceanera', text: 'La quinceañera', emoji: '📱' },
          { id: 'familia', text: 'Los papás', emoji: '🤳' },
          { id: 'amigos', text: 'Empate rotundo', emoji: '⚡' },
        ],
        correctOptionId: 'quinceanera',
      },
    ],
  },
  {
    id: 'quien-lo-dijo-cumpleanos',
    tipoCelebracion: 'cumpleanos',
    tituloRonda: '¿Quién lo dijo? ¿El agasajado o los amigos?',
    subtitulo: 'Ronda especial de cumpleaños',
    descripcion: 'Poné a prueba cuánto conocés al cumpleañero y sus mejores anécdotas.',
    opcionesDefault: [
      { id: 'agasajado', text: 'El agasajado', emoji: '🎂' },
      { id: 'amigos', text: 'Los amigos', emoji: '🥳' },
      { id: 'familia', text: 'La familia', emoji: '🏡' },
    ],
    preguntas: [
      {
        id: 'cumple-q1',
        question: '¿Quién es el primero en abrir la pista de baile hoy?',
        options: [
          { id: 'agasajado', text: 'El agasajado', emoji: '🎂' },
          { id: 'amigos', text: 'Los amigos', emoji: '🥳' },
          { id: 'familia', text: 'La familia', emoji: '💃' },
        ],
        correctOptionId: 'agasajado',
      },
      {
        id: 'cumple-q2',
        question: '¿Quién dijo "hoy me voy temprano" y siempre se queda hasta el final?',
        options: [
          { id: 'agasajado', text: 'El agasajado', emoji: '🎂' },
          { id: 'amigos', text: 'Los amigos', emoji: '🥳' },
          { id: 'familia', text: 'Todos', emoji: '🍻' },
        ],
        correctOptionId: 'agasajado',
      },
      {
        id: 'cumple-q3',
        question: '¿Quién organizó la mayor sorpresa de este festejo?',
        options: [
          { id: 'agasajado', text: 'El agasajado', emoji: '🎂' },
          { id: 'amigos', text: 'Los amigos', emoji: '🎁' },
          { id: 'familia', text: 'La familia', emoji: '❤️' },
        ],
        correctOptionId: 'amigos',
      },
      {
        id: 'cumple-q4',
        question: '¿Quién tiene las anécdotas más insólitas para contar?',
        options: [
          { id: 'agasajado', text: 'El agasajado', emoji: '🎂' },
          { id: 'amigos', text: 'Los amigos', emoji: '😂' },
          { id: 'familia', text: 'La familia', emoji: '🤫' },
        ],
        correctOptionId: 'amigos',
      },
      {
        id: 'cumple-q5',
        question: '¿Quién va a cantar el feliz cumpleaños más fuerte?',
        options: [
          { id: 'agasajado', text: 'El agasajado emocionado', emoji: '🎂' },
          { id: 'amigos', text: 'La banda de amigos', emoji: '🎤' },
          { id: 'familia', text: 'Toda la sala a coro', emoji: '🎉' },
        ],
        correctOptionId: 'amigos',
      },
    ],
  },
];
