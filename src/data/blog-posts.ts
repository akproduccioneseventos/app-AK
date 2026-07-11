import type { BlogPost } from '@/types/blog';

export const blogPosts: BlogPost[] = [
  {
    slug: 'como-empezar-a-organizar-una-fiesta-sin-estres',
    title: 'Cómo empezar a organizar una fiesta sin estrés',
    excerpt: 'El orden correcto para pasar de una idea suelta a una fiesta posible, con fecha, invitados, prioridades y presupuesto claro.',
    category: 'Organizacion',
    readTime: '5 min',
    publishedAt: '2026-06-01',
    accent: 'from-purple-700 to-slate-950',
    icon: 'CalendarCheck',
    takeaway: 'Primero se define fecha, cantidad de invitados y prioridades. Despues se habla de decoracion, musica y extras.',
    sections: [
      {
        heading: 'Empeza por las decisiones que bloquean todo lo demas',
        body: [
          'Antes de mirar ideas de decoracion o elegir colores, conviene cerrar tres datos: fecha tentativa, cantidad estimada de invitados y tipo de evento. Esos datos cambian el salon, el catering, el personal y el presupuesto.',
          'Cuando esos puntos no estan claros, todo parece posible y nada se puede cotizar bien. Por eso la primera reunion tiene que ordenar la base, no venderte cosas al azar.',
        ],
      },
      {
        heading: 'Separar lo imprescindible de lo lindo',
        body: [
          'Una fiesta puede tener muchos detalles, pero no todos tienen el mismo peso. Hay servicios que sostienen la experiencia: salon, comida, sonido, iluminacion, coordinacion y personal.',
          'Despues vienen los extras que hacen diferencia: video, show, souvenirs, pantalla, cabina de fotos o ambientaciones especiales. El secreto es elegirlos cuando el presupuesto principal ya esta sano.',
        ],
      },
      {
        heading: 'Por que conviene centralizar la organizacion',
        body: [
          'Cuando cada proveedor trabaja por separado, la familia termina haciendo de coordinador. Eso consume tiempo y genera errores de comunicacion.',
          'Un equipo integral reduce ese desgaste porque una sola persona controla horarios, entregas, armado, comida, musica y cambios de ultimo momento.',
        ],
      },
    ],
    checklist: [
      'Definir fecha tentativa y una segunda opcion.',
      'Estimar adultos, ninos y adolescentes por separado.',
      'Elegir tres prioridades reales para la fiesta.',
      'Consultar disponibilidad antes de prometer una fecha.',
    ],
    relatedSlugs: ['presupuesto-de-fiesta-que-debe-incluir', 'checklist-final-antes-del-evento'],
  },
  {
    slug: 'presupuesto-de-fiesta-que-debe-incluir',
    title: 'Qué debe incluir un presupuesto de fiesta bien hecho',
    excerpt: 'Los puntos que tienen que estar claros para comparar propuestas sin caer en precios incompletos o sorpresas de ultimo momento.',
    category: 'Presupuesto',
    readTime: '6 min',
    publishedAt: '2026-06-01',
    accent: 'from-slate-900 to-emerald-800',
    icon: 'CreditCard',
    takeaway: 'Un presupuesto profesional no solo dice el total: explica servicios, cantidades, regalos, seña, saldo y validez.',
    sections: [
      {
        heading: 'El total solo no alcanza',
        body: [
          'Dos presupuestos pueden tener el mismo precio y ofrecer cosas muy distintas. Por eso hay que revisar cantidades, servicios incluidos, servicios regalados y condiciones de pago.',
          'Tambien importa saber que pasa si cambia la cantidad de invitados, si se agregan horas o si el evento es para otro ano.',
        ],
      },
      {
        heading: 'Servicios pagos y regalos deben estar separados',
        body: [
          'Cuando algo se regala, debe figurar como regalo. Si no queda escrito, despues puede olvidarse o cobrarse por error.',
          'La claridad evita discusiones y ayuda al equipo a preparar todo lo prometido.',
        ],
      },
      {
        heading: 'Fechas futuras y ajustes',
        body: [
          'Para eventos 2027 o 2028, el cliente necesita ver el precio vigente y una referencia de ajuste futuro. Mezclar ambos numeros confunde.',
          'Lo mas transparente es guardar el precio actual como base y aclarar que el ajuste se revisa al confirmar o actualizar la propuesta.',
        ],
      },
    ],
    checklist: [
      'Cliente, fecha, salon y cantidad de invitados.',
      'Adultos, ninos y adolescentes separados.',
      'Items pagos, regalos, descuentos, seña y saldo.',
      'Validez del presupuesto y condiciones de reserva.',
    ],
    relatedSlugs: ['como-empezar-a-organizar-una-fiesta-sin-estres', 'como-elegir-el-menu-para-un-evento'],
  },
  {
    slug: 'como-elegir-el-menu-para-un-evento',
    title: 'Cómo elegir el menú para un evento sin equivocarte',
    excerpt: 'Una guia simple para elegir comida abundante, ordenada y acorde al tipo de fiesta, sin perder control del costo.',
    category: 'Catering',
    readTime: '5 min',
    publishedAt: '2026-06-01',
    accent: 'from-amber-700 to-red-800',
    icon: 'Utensils',
    takeaway: 'El menu se elige por tipo de evento, horario, duracion, publico y presupuesto. No solo por el plato que mas gusta.',
    sections: [
      {
        heading: 'La comida tiene que acompañar el ritmo de la fiesta',
        body: [
          'No es lo mismo un cumpleanos corto, una fiesta de XV, una boda o un evento empresarial. Cada formato tiene horarios, energia y publico distinto.',
          'Una entrada fuerte puede funcionar perfecto en una fiesta larga, pero ser demasiado para un evento breve. Un menu infantil tambien debe calcularse aparte para no sobrar o faltar.',
        ],
      },
      {
        heading: 'Adultos, ninos y adolescentes no consumen igual',
        body: [
          'Separar invitados por grupo ayuda a calcular comida, vajilla, bebida y personal. Si todos se cargan como un numero unico, el presupuesto puede quedar mal armado.',
          'Para eventos familiares conviene confirmar cuantos ninos y adolescentes realmente comen menu infantil o menu adulto.',
        ],
      },
      {
        heading: 'Fotos ayudan a vender, pero el numero manda',
        body: [
          'Ver fotos del menu ayuda al cliente a imaginar la fiesta y elegir mejor. Pero cada plato tambien debe tener precio por persona y costo controlado.',
          'La mejor propuesta combina imagen clara, descripcion simple y total transparente.',
        ],
      },
    ],
    checklist: [
      'Definir horario y duracion del evento.',
      'Separar adultos y menores.',
      'Elegir entrada, principal y menu infantil si corresponde.',
      'Revisar que el menu entre en el presupuesto general.',
    ],
    relatedSlugs: ['presupuesto-de-fiesta-que-debe-incluir', 'ideas-para-fiesta-de-xv-en-salto'],
  },
  {
    slug: 'ideas-para-fiesta-de-xv-en-salto',
    title: 'Ideas para una fiesta de XV en Salto con personalidad',
    excerpt: 'Como elegir estilo, momentos especiales y servicios sin copiar una fiesta que no representa a la quinceanera.',
    category: 'XV anos',
    readTime: '4 min',
    publishedAt: '2026-06-01',
    accent: 'from-fuchsia-700 to-purple-950',
    icon: 'PartyPopper',
    takeaway: 'Una fiesta de XV funciona mejor cuando el estilo, la musica, la entrada y los detalles cuentan algo de la quinceanera.',
    sections: [
      {
        heading: 'El estilo no empieza en Pinterest',
        body: [
          'Las referencias sirven, pero la fiesta tiene que representar a la quinceanera. Colores, musica, entrada, torta y fotos deben tener una misma idea.',
          'Antes de elegir decoracion, conviene conversar sobre gustos, personalidad y momentos que quiere vivir esa noche.',
        ],
      },
      {
        heading: 'Momentos que no pueden quedar improvisados',
        body: [
          'Entrada, vals, brindis, torta, video de vida, cambio de zapatos y fotos familiares necesitan horario y responsable.',
          'Si esos momentos no estan planificados, el evento se desordena y la familia termina resolviendo durante la fiesta.',
        ],
      },
      {
        heading: 'Los regalos tienen que estar escritos',
        body: [
          'Video de vida, pantalla, invitacion digital o efectos especiales deben figurar en el presupuesto y en la planificacion.',
          'Eso asegura que el equipo lo prepare y que el cliente sepa exactamente que incluye su propuesta.',
        ],
      },
    ],
    checklist: [
      'Elegir estilo general y colores.',
      'Definir entrada, vals y momentos especiales.',
      'Confirmar musica obligatoria y temas prohibidos.',
      'Registrar regalos y servicios incluidos.',
    ],
    relatedSlugs: ['checklist-final-antes-del-evento', 'como-elegir-el-menu-para-un-evento'],
  },
  {
    slug: 'errores-comunes-al-organizar-una-boda',
    title: 'Errores comunes al organizar una boda',
    excerpt: 'Los descuidos que mas estres generan en una boda y como evitarlos desde la primera reunion.',
    category: 'Bodas',
    readTime: '5 min',
    publishedAt: '2026-06-01',
    accent: 'from-rose-700 to-slate-900',
    icon: 'Heart',
    takeaway: 'La boda necesita un plan operativo, no solo una lista de deseos. Horarios, responsables y pagos deben estar cerrados.',
    sections: [
      {
        heading: 'Elegir proveedores sin una linea comun',
        body: [
          'Cuando cada proveedor entiende una cosa distinta, la boda se fragmenta. Decoracion, musica, catering y fotografia tienen que trabajar con un mismo itinerario.',
          'Una coordinacion central evita que los novios tengan que dar indicaciones durante la fiesta.',
        ],
      },
      {
        heading: 'No definir prioridades de presupuesto',
        body: [
          'Algunas parejas prefieren invertir mas en comida y musica; otras en decoracion, fotografia o ceremonia. Ninguna decision esta mal si esta ordenada.',
          'El problema aparece cuando se contrata todo sin mirar el total real.',
        ],
      },
      {
        heading: 'Dejar pagos y saldos para ultimo momento',
        body: [
          'Los pagos deben estar registrados y confirmados. Un comprobante pendiente no es lo mismo que un ingreso confirmado.',
          'Cerrar saldos antes del evento baja estres y permite que el dia de la boda sea para disfrutar.',
        ],
      },
    ],
    checklist: [
      'Armar itinerario de ceremonia y fiesta.',
      'Definir responsable de cada proveedor.',
      'Registrar pagos, señas y saldos.',
      'Preparar lista de carga y montaje.',
    ],
    relatedSlugs: ['presupuesto-de-fiesta-que-debe-incluir', 'checklist-final-antes-del-evento'],
  },
  {
    slug: 'checklist-final-antes-del-evento',
    title: 'Checklist final antes del evento',
    excerpt: 'Una lista practica para revisar la semana previa: pagos, invitados, menu, personal, musica, decoracion y carga.',
    category: 'Checklists',
    readTime: '4 min',
    publishedAt: '2026-06-01',
    accent: 'from-blue-800 to-slate-950',
    icon: 'ClipboardCheck',
    takeaway: 'La semana previa no es para inventar la fiesta: es para confirmar que todo lo prometido esta listo.',
    sections: [
      {
        heading: 'Revisar lo que afecta a todos los equipos',
        body: [
          'Cantidad de invitados, horario, salon y menu impactan en cocina, mozos, vajilla, decoracion, musica y logistica.',
          'Si esos datos cambian, todos tienen que enterarse. Por eso deben estar registrados en una sola fuente.',
        ],
      },
      {
        heading: 'Confirmar pagos y servicios prometidos',
        body: [
          'El presupuesto aceptado, la seña, el saldo y los regalos deben coincidir con la planificacion del evento.',
          'Si hay un pago pendiente de confirmacion, conviene resolverlo antes del dia de la fiesta.',
        ],
      },
      {
        heading: 'Preparar la carga operativa',
        body: [
          'La lista de carga evita olvidos: vajilla, manteleria, cables, herramientas, decoracion, bebidas, comida, luces, pantalla y repuestos.',
          'El dia del evento no deberia depender de la memoria de una persona.',
        ],
      },
    ],
    checklist: [
      'Pagos confirmados y saldo claro.',
      'Cantidad de invitados actualizada.',
      'Menu, decoracion y musica aprobados.',
      'Personal asignado con horarios.',
      'Lista de carga revisada.',
    ],
    relatedSlugs: ['como-empezar-a-organizar-una-fiesta-sin-estres', 'errores-comunes-al-organizar-una-boda'],
  },
];

export function getBlogPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug) || null;
}

export function getRelatedPosts(post: BlogPost) {
  const related = (post.relatedSlugs || [])
    .map(getBlogPostBySlug)
    .filter((item): item is BlogPost => Boolean(item));

  if (related.length > 0) return related;
  return blogPosts.filter((item) => item.slug !== post.slug && item.category === post.category).slice(0, 2);
}

const postImages: Record<string, string> = {
  'como-empezar-a-organizar-una-fiesta-sin-estres': '/media/catalogo-servicios/blog_presupuesto.png',
  'presupuesto-de-fiesta-que-debe-incluir': '/media/catalogo-servicios/blog_presupuesto.png',
  'como-elegir-el-menu-para-un-evento': '/media/catalogo-servicios/blog_comida.png',
  'ideas-para-fiesta-de-xv-en-salto': '/media/catalogo-servicios/quinceanera_persuasiva.png',
  'errores-comunes-al-organizar-una-boda': '/media/catalogo-servicios/boda_persuasiva.png',
  'checklist-final-antes-del-evento': '/media/catalogo-servicios/tecnologia_fiesta.png',
};

export function getPostImage(slug: string, title?: string, category?: string): string {
  if (postImages[slug]) return postImages[slug];

  const text = `${slug} ${title || ''} ${category || ''}`.toLowerCase();

  if (text.includes('trago') || text.includes('barra') || text.includes('bebida') || text.includes('coctel') || text.includes('coctelería')) {
    return '/media/catalogo-servicios/blog_bebidas.png';
  }
  if (text.includes('catering') || text.includes('comida') || text.includes('plato') || text.includes('menú') || text.includes('finger') || text.includes('gastro')) {
    return '/media/catalogo-servicios/blog_comida.png';
  }
  if (text.includes('luz') || text.includes('luces') || text.includes('pantalla') || text.includes('led') || text.includes('robotizada') || text.includes('disco') || text.includes('pista')) {
    return '/media/catalogo-servicios/blog_iluminacion.png';
  }
  if (text.includes('salón') || text.includes('salon') || text.includes('club') || text.includes('uruguay') || text.includes('lugar') || text.includes('espacio') || text.includes('acústica')) {
    return '/media/catalogo-servicios/blog_salon.png';
  }
  if (text.includes('presupuesto') || text.includes('planific') || text.includes('calcular') || text.includes('estrés') || text.includes('organizar') || text.includes('checklist') || text.includes('semana') || text.includes('costo')) {
    return '/media/catalogo-servicios/blog_presupuesto.png';
  }
  if (text.includes('boda') || text.includes('casamiento') || text.includes('novia')) {
    return '/media/catalogo-servicios/boda_persuasiva.png';
  }
  if (text.includes('15') || text.includes('quince') || text.includes('xv')) {
    return '/media/catalogo-servicios/quinceanera_persuasiva.png';
  }

  return '/media/catalogo-servicios/blog_salon.png';
}
