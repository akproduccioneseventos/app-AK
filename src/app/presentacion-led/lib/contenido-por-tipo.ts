export interface ContenidoTipoFiesta {
  tagline: string;
  subtitulo: string;
  emoji: string;
  categoriasDestacadas: string[];
  mensajeRegalos: string;
  mensajeCierre: string;
  colorAcento: string;
}

const DEFAULT: ContenidoTipoFiesta = {
  tagline: 'Tu evento soñado, hecho realidad',
  subtitulo: 'Servicio integral, personalizado y de primer nivel',
  emoji: '🎉',
  categoriasDestacadas: [],
  mensajeRegalos: 'Al contratar hoy, te incluimos beneficios exclusivos que hacen único tu evento.',
  mensajeCierre: 'Estamos listos para hacer de tu celebración un recuerdo imborrable.',
  colorAcento: 'from-indigo-500 to-emerald-500',
};

const CONTENIDO_POR_TIPO: Record<string, ContenidoTipoFiesta> = {
  '15 años': {
    tagline: 'Tu noche de quince, perfecta en cada detalle',
    subtitulo: 'Hacemos que este momento único brille para siempre',
    emoji: '👑',
    categoriasDestacadas: ['Decoración', 'DJ', 'Fotografía', 'Catering', 'Show'],
    mensajeRegalos: 'Por contratar el servicio integral de tu fiesta de 15, te regalamos sorpresas que van a emocionar a la cumpleañera.',
    mensajeCierre: 'Cada detalle de tu noche de quince merece ser perfecto. Nosotros nos encargamos de todo.',
    colorAcento: 'from-pink-500 to-rose-500',
  },
  'Cumpleaños 15': {
    tagline: 'Tu noche de quince, perfecta en cada detalle',
    subtitulo: 'Hacemos que este momento único brille para siempre',
    emoji: '👑',
    categoriasDestacadas: ['Decoración', 'DJ', 'Fotografía', 'Catering', 'Show'],
    mensajeRegalos: 'Por contratar el servicio integral de tu fiesta de 15, te regalamos sorpresas que van a emocionar a la cumpleañera.',
    mensajeCierre: 'Cada detalle de tu noche de quince merece ser perfecto. Nosotros nos encargamos de todo.',
    colorAcento: 'from-pink-500 to-rose-500',
  },
  'Casamiento': {
    tagline: 'El día más especial de su vida, en las mejores manos',
    subtitulo: 'Cada detalle coordinado para que solo disfruten su amor',
    emoji: '💍',
    categoriasDestacadas: ['Decoración', 'Catering', 'Fotografía', 'DJ', 'Coordinación'],
    mensajeRegalos: 'Para los novios que eligen nuestro servicio integral, preparamos regalos que hacen el gran día aún más memorable.',
    mensajeCierre: 'Su boda merece lo mejor. Con AK Producciones, cada momento es perfecto.',
    colorAcento: 'from-amber-400 to-rose-500',
  },
  'Boda': {
    tagline: 'El día más especial de su vida, en las mejores manos',
    subtitulo: 'Cada detalle coordinado para que solo disfruten su amor',
    emoji: '💍',
    categoriasDestacadas: ['Decoración', 'Catering', 'Fotografía', 'DJ', 'Coordinación'],
    mensajeRegalos: 'Para los novios que eligen nuestro servicio integral, preparamos regalos que hacen el gran día aún más memorable.',
    mensajeCierre: 'Su boda merece lo mejor. Con AK Producciones, cada momento es perfecto.',
    colorAcento: 'from-amber-400 to-rose-500',
  },
  'Cumpleaños adultos': {
    tagline: 'Una celebración que no se va a olvidar',
    subtitulo: 'Porque cada año que pasa merece festejarse en grande',
    emoji: '🎂',
    categoriasDestacadas: ['Decoración', 'DJ', 'Catering', 'Fotografía'],
    mensajeRegalos: 'Al elegir AK para tu cumpleaños, te incluimos sorpresas que elevan la experiencia de toda tu noche.',
    mensajeCierre: 'Tu cumpleaños es una sola vez al año. Hacelo especial con nosotros.',
    colorAcento: 'from-violet-500 to-indigo-500',
  },
  'Cumpleaños infantil': {
    tagline: 'La fiesta que los chicos van a recordar siempre',
    subtitulo: 'Magia, diversión y colores para el cumple más feliz',
    emoji: '🎈',
    categoriasDestacadas: ['Decoración', 'Entretenimiento', 'Catering', 'Fotografía'],
    mensajeRegalos: 'Para los cumpleaños infantiles, tenemos regalos y sorpresas pensadas para que los chicos vivan algo mágico.',
    mensajeCierre: 'La felicidad en los ojos de los chicos no tiene precio. Nosotros nos encargamos de crear esos momentos.',
    colorAcento: 'from-yellow-400 to-orange-500',
  },
  'Baby shower': {
    tagline: 'Celebrá la llegada de la nueva vida con todo el amor',
    subtitulo: 'Un momento único para mamá y toda la familia',
    emoji: '🍼',
    categoriasDestacadas: ['Decoración', 'Catering', 'Fotografía'],
    mensajeRegalos: 'Para el baby shower, tenemos detalles especiales que hacen de este momento algo memorable para mamá.',
    mensajeCierre: 'La llegada de un bebé es el evento más especial. Nosotros lo hacemos perfecto.',
    colorAcento: 'from-sky-400 to-blue-500',
  },
  'Bautismo': {
    tagline: 'Un día sagrado y especial para toda la familia',
    subtitulo: 'Celebrá este momento de amor y fe en grande',
    emoji: '🕊️',
    categoriasDestacadas: ['Decoración', 'Catering', 'Fotografía'],
    mensajeRegalos: 'Para el bautismo, preparamos detalles especiales que hacen de esta celebración un recuerdo imborrable.',
    mensajeCierre: 'El bautismo es uno de los momentos más importantes. Hacémoslo perfecto junto a vos.',
    colorAcento: 'from-sky-400 to-indigo-500',
  },
  'Comunión': {
    tagline: 'Un hito especial que merece celebrarse en grande',
    subtitulo: 'Hacemos de la primera comunión un día para recordar',
    emoji: '✨',
    categoriasDestacadas: ['Decoración', 'Catering', 'Fotografía'],
    mensajeRegalos: 'Para la comunión, tenemos sorpresas especiales que completan esta celebración familiar.',
    mensajeCierre: 'La primera comunión es un momento único. Con AK, queda perfecto.',
    colorAcento: 'from-indigo-400 to-purple-500',
  },
  'Graduación': {
    tagline: 'El logro de años de esfuerzo, celebrado a lo grande',
    subtitulo: 'La fiesta de egresados que van a recordar toda la vida',
    emoji: '🎓',
    categoriasDestacadas: ['DJ', 'Decoración', 'Catering', 'Fotografía'],
    mensajeRegalos: 'Para la graduación, preparamos regalos y sorpresas que hacen de esta noche algo épico.',
    mensajeCierre: 'La graduación es el comienzo de todo. Celebrala como se merece.',
    colorAcento: 'from-emerald-500 to-teal-500',
  },
  'Aniversario': {
    tagline: 'Años juntos que merecen celebrarse como el primer día',
    subtitulo: 'Una noche especial para renovar el amor',
    emoji: '💑',
    categoriasDestacadas: ['Decoración', 'Catering', 'Fotografía', 'DJ'],
    mensajeRegalos: 'Para el aniversario, preparamos detalles románticos que hacen la noche inolvidable.',
    mensajeCierre: 'El amor se celebra. Dejá que nosotros hagamos de este aniversario un momento mágico.',
    colorAcento: 'from-rose-500 to-pink-500',
  },
  'Empresarial': {
    tagline: 'Eventos corporativos que proyectan profesionalismo',
    subtitulo: 'Cada detalle pensado para el éxito de tu empresa',
    emoji: '🏆',
    categoriasDestacadas: ['Catering', 'Sonido', 'Decoración', 'Coordinación'],
    mensajeRegalos: 'Para eventos empresariales, incluimos servicios adicionales que elevan la imagen de tu empresa.',
    mensajeCierre: 'Un evento empresarial exitoso comienza con la organización correcta. Nosotros somos esa organización.',
    colorAcento: 'from-slate-400 to-indigo-500',
  },
};

export function getContenidoPorTipo(tipoFiesta: string): ContenidoTipoFiesta {
  if (!tipoFiesta) return DEFAULT;
  const found = CONTENIDO_POR_TIPO[tipoFiesta];
  if (found) return found;
  // Try partial match
  const lower = tipoFiesta.toLowerCase();
  for (const [key, value] of Object.entries(CONTENIDO_POR_TIPO)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return value;
    }
  }
  return DEFAULT;
}

export const TIPOS_FIESTA = [
  'Cumpleaños 15',
  'Casamiento',
  'Boda',
  'Cumpleaños adultos',
  'Cumpleaños infantil',
  'Baby shower',
  'Bautismo',
  'Comunión',
  'Graduación',
  'Aniversario',
  'Empresarial',
  'Otro',
];
