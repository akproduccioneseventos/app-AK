import type {
  AnuncioGenerado,
  ObjetivoAnuncio,
  TipoEventoAnuncio,
  TonoAnuncio,
  GuionReelsTikTok,
  SugerenciaVisual,
  PublicoObjetivoSugerido,
} from './creador-anuncios-tipos';

interface OpcionesGeneracion {
  tipoEvento: TipoEventoAnuncio;
  objetivo: ObjetivoAnuncio;
  tono: TonoAnuncio;
  beneficioDestacado?: string;
  salonNombre?: string;
  descuentoTexto?: string;
  contactoWhatsApp?: string;
}

const PLANTILLAS_EVENTOS: Record<
  TipoEventoAnuncio,
  {
    ganchos: string[];
    copys: string[];
    llamadosAccion: string[];
    sugerenciasVisuales: SugerenciaVisual[];
    publicos: PublicoObjetivoSugerido;
    guiones: GuionReelsTikTok[];
  }
> = {
  '15_anos': {
    ganchos: [
      '¿Tu hija cumple 15 en 2026/2027 y no sabés por dónde arrancar a organizar?',
      'El secreto de las fiestas de 15 donde la pista NUNCA se vacía 💃✨',
      'Tu hija sólo cumple 15 una vez: cómo lograr una noche inolvidable sin volverte loca',
      '¿Presupuesto cerrado sin sorpresas? Así organizamos los 15 soñados en Salto',
    ],
    copys: [
      `Sabemos que planear los 15 de tu hija es una mezcla hermosa de emoción y mil detalles por resolver. 💖\n\nEn AK Producciones nos encargamos de TODO para que ustedes sólo disfruten:\n✨ Salones exclusivos ambientados a su estilo\n🎧 DJ y pista LED de última generación para que no paren de bailar\n📸 Cobertura fotográfica y video cinematográfico\n🍹 Barra de tragos sin alcohol y catering premium\n\n👉 Entrá al simulador interactivo y armá su propuesta personalizada en 2 minutos sin compromiso.`,
      `El verdadero valor de una fiesta de 15 no está en los cables ni en las luces: está en la cara de felicidad de tu hija cuando entra al salón y ve a toda su gente esperándola. ✨👑\n\nDejá la logística, el sonido, la pantalla gigante y la coordinación en manos de profesionales.\n\n📱 Hacé clic y chateá con nuestro equipo para congelar la fecha y recibir una propuesta a medida.`,
    ],
    llamadosAccion: ['Armar Presupuesto Online', 'Consultar Disponibilidad de Fecha', 'Ver Fotos y Salones en WhatsApp'],
    sugerenciasVisuales: [
      {
        tipoImagen: 'Foto real de quinceañera en pista con bengalas frías y amigos bailando',
        elementosRecomendados: ['Sonrisas genuinas', 'Luces cálidas y pista LED', 'Logo sutil de AK en esquina'],
        textoSuperpuesto: 'XV AÑOS INOLVIDABLES · SALTO 2026',
      },
    ],
    publicos: {
      edad: '38 a 54 años (Madres y Padres)',
      intereses: ['Fiesta de quince años', 'Organización de eventos', 'Fotografía', 'Vestidos de fiesta'],
      ubicacion: 'Salto, Paysandú, Concordia y alrededores (radio 50km)',
      consejoSegmentacion: 'Apuntá a mujeres de 40 a 50 años que son las principales decisoras en los 15 de sus hijas.',
    },
    guiones: [
      {
        duracionSegundos: 15,
        musicaSugerida: 'Pop acústico alegre / Tendencia suave de Reels',
        escenas: [
          {
            segundo: '0-3s',
            visual: 'Primer plano de la quinceañera emocionada abrazando a sus amigas con chispas de fondo.',
            textoPantalla: '¿Tu hija cumple 15 pronto? ✨',
            audioLocucion: 'Organizar los 15 de tu hija no tiene por qué ser estresante.',
          },
          {
            segundo: '4-9s',
            visual: 'Transición rápida: salón decorado, barra de tragos y pista llena de gente saltando.',
            textoPantalla: 'Nosotros nos ocupamos de TODO 👑',
            audioLocucion: 'En AK Producciones cuidamos cada detalle: salón, sonido, luces y fotos.',
          },
          {
            segundo: '10-15s',
            visual: 'Pantalla con el simulador interactivo en celular y logo de AK.',
            textoPantalla: 'Cotizá en 2 min en el link 👇',
            audioLocucion: 'Tocá el enlace y calculá tu presupuesto en 2 minutos.',
          },
        ],
      },
    ],
  },
  bodas: {
    ganchos: [
      'El día de tu boda tenés que ser la protagonista, no la coordinadora del salón 💍✨',
      '¿Se casan en 2026? La guía para que su fiesta sea perfecta y sin estrés',
      'La fiesta con la que siempre soñaron, con presupuesto transparente desde el día 1',
    ],
    copys: [
      `El día de su casamiento pasa volando. Por eso, lo más valioso es poder vivir cada minuto con la tranquilidad de que un equipo profesional está detrás de cada momento. 👰🤵\n\nEn AK Producciones diseñamos bodas integrales:\n🥂 Recepción elegante y ambientación a medida\n🎶 Música curada y momentos emotivos perfectamente sincronizados\n📸 Recuerdos para toda la vida en alta definición\n\n👉 Tocá el botón para agendar una reunión sin cargo o simular su presupuesto online.`,
    ],
    llamadosAccion: ['Agendar Asesoría Gratuita', 'Calcular Boda Online', 'Escribir por WhatsApp'],
    sugerenciasVisuales: [
      {
        tipoImagen: 'Pareja de novios brindando bajo guirnaldas de luces en salón o jardín',
        elementosRecomendados: ['Iluminación cálida', 'Momento espontáneo', 'Detalles florales elegantes'],
        textoSuperpuesto: 'BODAS INOLVIDABLES · AK PRODUCCIONES',
      },
    ],
    publicos: {
      edad: '24 a 42 años (Parejas y Comprometidos)',
      intereses: ['Compromiso', 'Planificación de bodas', 'Vestidos de novia', 'Luna de miel'],
      ubicacion: 'Salto y Litoral Norte',
      consejoSegmentacion: 'Filtrar por estado de relación "Comprometido/a" o personas interesadas en casamientos.',
    },
    guiones: [
      {
        duracionSegundos: 15,
        musicaSugerida: 'Instrumental emotivo y alegre',
        escenas: [
          {
            segundo: '0-3s',
            visual: 'Novios entrando a la fiesta sonriendo, invitados aplaudiendo.',
            textoPantalla: 'El día de tu boda sólo tenés que disfrutar 💍',
            audioLocucion: 'El casamiento de tus sueños existe, y organizarlo puede ser un placer.',
          },
          {
            segundo: '4-10s',
            visual: 'Mesa de novios, brindis, iluminación ambiental y pista encendida.',
            textoPantalla: 'Diseño integral de bodas en Salto ✨',
            audioLocucion: 'Coordinamos cada instante para que sólo te preocupes por brindar.',
          },
          {
            segundo: '11-15s',
            visual: 'Logo AK Producciones con botón de contacto.',
            textoPantalla: 'Agendá tu charla sin cargo 👇',
            audioLocucion: 'Escribinos y coordinemos una charla sin compromiso.',
          },
        ],
      },
    ],
  },
  cumpleanos: {
    ganchos: [
      'Cumplir años y no tener que limpiar ni cocinar: el verdadero regalo 🎉🍻',
      'Festejá tus 30, 40 o 50 como te merecés: salón, barra y música listos para vos',
      '¿Buscando salón y fiesta completa para tu cumple en Salto? Mirá esto 👇',
    ],
    copys: [
      `La vida merece celebrarse a lo grande. Si estás por cumplir años, olvidate del estrés de coordinar proveedores por separado. 🥳\n\nTe armamos el combo ideal:\n🍕 Comida rica y picadas para todos los gustos\n🍺 Barra de tragos y cerveza tirada\n🎵 El DJ que sabe poner la música que a vos te gusta\n🏠 Salón cerrado y climatizado\n\n👉 Tocá acá y cotizá tu cumple en 1 minuto.`,
    ],
    llamadosAccion: ['Cotizar Cumpleaños', 'Consultar Fechas Disponibles', 'Escribir al WhatsApp'],
    sugerenciasVisuales: [
      {
        tipoImagen: 'Grupo de amigos brindando con cerveza y picada en salón iluminado',
        elementosRecomendados: ['Ambiente distendido', 'Buena iluminación', 'Momento de risas'],
        textoSuperpuesto: 'TU CUMPLE SIN PREOCUPACIONES · AK EVENTOS',
      },
    ],
    publicos: {
      edad: '22 a 60 años',
      intereses: ['Cumpleaños', 'Música', 'Gastronomía', 'Eventos sociales'],
      ubicacion: 'Salto y alrededores',
      consejoSegmentacion: 'Segmentar a personas que cumplen años en los próximos 30-60 días o a sus amigos cercanos.',
    },
    guiones: [
      {
        duracionSegundos: 12,
        musicaSugerida: 'Ritmo festivo y enérgico',
        escenas: [
          {
            segundo: '0-3s',
            visual: 'Torta con bengala y amigos cantando el feliz cumpleaños.',
            textoPantalla: '¿Cumplís años pronto? 🎉',
            audioLocucion: 'Dejá de cocinar y limpiar en tu propio cumple.',
          },
          {
            segundo: '4-8s',
            visual: 'DJ en vivo, barra de tragos y comida servida.',
            textoPantalla: 'Paquetes completos con salón y barra 🍹',
            audioLocucion: 'En AK te armamos la fiesta completa para que sólo vengas a pasarla bien.',
          },
          {
            segundo: '9-12s',
            visual: 'Placa final con WhatsApp y enlace.',
            textoPantalla: 'Tocá el link y reservá fecha 👇',
            audioLocucion: 'Tocá el botón y reservá tu fecha.',
          },
        ],
      },
    ],
  },
  empresarial: {
    ganchos: [
      'Eventos corporativos que dejan huella en tus clientes y colaboradores 🏢🤝',
      'Fin de año, aniversarios y conferencias en Salto con equipamiento audiovisual de primer nivel',
      '¿Tu empresa busca salón y técnica integral para su próximo evento?',
    ],
    copys: [
      `La imagen de tu empresa se refleja en cada evento. Desde conferencias y presentaciones de producto hasta la gran fiesta de fin de año. 💼🏆\n\nEn AK Producciones te garantizamos:\n📽️ Pantallas LED gigantes y microfonía profesional\n🍽️ Servicio de coffee break y catering corporativo\n🏛️ Salones acústicos y climatizados\n🧾 Facturación oficial con RUT y contratos formales\n\n👉 Solicitá tu propuesta corporativa al instante.`,
    ],
    llamadosAccion: ['Solicitar Propuesta Corporativa', 'Agendar Visita a Salón', 'Contactar Ejecutivo Comercial'],
    sugerenciasVisuales: [
      {
        tipoImagen: 'Salón corporativo con pantalla LED gigante proyectando logo y mesas impecables',
        elementosRecomendados: ['Orden profesional', 'Iluminación sobria', 'Equipamiento tecnológico visible'],
        textoSuperpuesto: 'EVENTOS CORPORATIVOS & CONFERENCIAS · AK',
      },
    ],
    publicos: {
      edad: '28 a 65 años (Dueños de empresa, RRHH, Gerentes de Marketing)',
      intereses: ['Negocios', 'Gestión de recursos humanos', 'Marketing empresarial', 'Cámara de comercio'],
      ubicacion: 'Salto, Paysandú y Montevideo',
      consejoSegmentacion: 'Segmentar por cargos (Directores, Dueños, Gerentes de RRHH y Administradores).',
    },
    guiones: [
      {
        duracionSegundos: 15,
        musicaSugerida: 'Corporativa moderna y tecnológica',
        escenas: [
          {
            segundo: '0-4s',
            visual: 'Auditorio con pantalla LED encendida y puesta técnica impecable.',
            textoPantalla: 'Eventos Corporativos de Alto Impacto 📊',
            audioLocucion: 'Elevá el estándar del próximo evento de tu empresa.',
          },
          {
            segundo: '5-10s',
            visual: 'Catering corporativo, sonido nítido y ejecutivos conversando cómodos.',
            textoPantalla: 'Técnica + Salón + Catering con factura formal 💼',
            audioLocucion: 'Técnica de última generación, salones acústicos y facturación formal con RUT.',
          },
          {
            segundo: '11-15s',
            visual: 'Logo AK Producciones Corporativo y contacto directo.',
            textoPantalla: 'Pedí tu propuesta corporativa 👇',
            audioLocucion: 'Contactanos hoy y recibí una cotización formal.',
          },
        ],
      },
    ],
  },
  promocion_temporada: {
    ganchos: [
      '🔥 Promo Anticipada: Congelá el precio de tu fiesta hoy y asegurá tu fecha para 2026/2027',
      '¿Querés servicios bonificados de regalo en tu fiesta? Mirá esta promo por tiempo limitado 🎁',
      'El momento de reservar tu salón es hoy: precios congelados y financiación a medida',
    ],
    copys: [
      `Sabemos que la inflación hace que los precios suban todos los meses. Si reservás tu fecha este mes en AK Producciones, te congelamos el 100% de la técnica y el salón. 🛡️✨\n\nAdemás, con esta promo te llevás:\n🎁 Barra de tragos o pista LED con bonificación especial\n💳 Financiación en cuotas fijas hasta el día de tu evento\n🤝 Contrato garantizado y asesoría personalizada\n\n⚠️ Cupos limitados por calendario. ¡No dejes que te ganen la fecha!`,
    ],
    llamadosAccion: ['Congelar Precio Ahora', 'Consultar Cupos de Promo', 'Reclamar Bonificación'],
    sugerenciasVisuales: [
      {
        tipoImagen: 'Banner dinámico con fiesta encendida y sello dorado de PRECIO CONGELADO',
        elementosRecomendados: ['Colores contrastantes', 'Sensación de oportunidad', 'Badge de Garantía AK'],
        textoSuperpuesto: 'PROMO ANTICIPADA · PRECIO CONGELADO 2026/2027',
      },
    ],
    publicos: {
      edad: '22 a 58 años',
      intereses: ['Eventos', 'Casamientos', 'Quince años', 'Ahorro'],
      ubicacion: 'Salto y Litoral Norte',
      consejoSegmentacion: 'Campaña amplia de tráfico local para captar leads que están en etapa de decisión temprana.',
    },
    guiones: [
      {
        duracionSegundos: 12,
        musicaSugerida: 'Ritmo dinámico y atrapante',
        escenas: [
          {
            segundo: '0-3s',
            visual: 'Texto en grande "¡CONGELÁ EL PRECIO DE TU FIESTA!" con fondo de fiesta real.',
            textoPantalla: '¡Promo Anticipada 2026/2027! 🔥',
            audioLocucion: '¿Tenés fiesta en los próximos meses? Esto te interesa.',
          },
          {
            segundo: '4-8s',
            visual: 'Fiesta con luces, barra y gente disfrutando.',
            textoPantalla: 'Congelá hoy y pagá en cuotas fijas 🎁',
            audioLocucion: 'Reservá tu fecha hoy, congelá el precio y llevate servicios bonificados.',
          },
          {
            segundo: '9-12s',
            visual: 'Botón de WhatsApp parpadeando.',
            textoPantalla: 'Tocá el link antes de que se agoten los cupos 👇',
            audioLocucion: 'Tocá el enlace y asegurá tu lugar antes de que suban las fechas.',
          },
        ],
      },
    ],
  },
};

export function generarAnuncioCompleto(opciones: OpcionesGeneracion): AnuncioGenerado {
  const plantilla = PLANTILLAS_EVENTOS[opciones.tipoEvento] || PLANTILLAS_EVENTOS['15_anos'];
  const index = Math.floor(Math.random() * plantilla.ganchos.length);
  const ganchoBase = plantilla.ganchos[index] || plantilla.ganchos[0];
  const copyBase = plantilla.copys[0] || '';
  const ctaBase = plantilla.llamadosAccion[0] || 'Más Información';
  const guion = plantilla.guiones[0] || { duracionSegundos: 15, musicaSugerida: 'Música pop alegre', escenas: [] };
  const visual = plantilla.sugerenciasVisuales[0] || { tipoImagen: 'Foto real', elementosRecomendados: [], textoSuperpuesto: '' };

  // Construir URL de destino inteligente (Embudo Invisible)
  let enlaceDestino = 'https://akproducciones.uy/simulador';
  if (opciones.objetivo === 'whatsapp') {
    const telefono = opciones.contactoWhatsApp || '59899123456';
    const mensajeWpp = encodeURIComponent(
      `Hola AK Producciones! Vi su anuncio para ${opciones.tipoEvento.replace('_', ' ')} y me gustaría recibir una propuesta.`
    );
    enlaceDestino = `https://wa.me/${telefono}?text=${mensajeWpp}`;
  } else if (opciones.objetivo === 'simulador') {
    enlaceDestino = `https://akproducciones.uy/simulador?origen=ad_${opciones.tipoEvento}`;
  }

  // Personalización por tono
  let textoFinal = copyBase;
  if (opciones.beneficioDestacado) {
    textoFinal = `${textoFinal}\n\n⭐ *Beneficio destacado:* ${opciones.beneficioDestacado}`;
  }
  if (opciones.descuentoTexto) {
    textoFinal = `${textoFinal}\n🎁 *Bonificación especial:* ${opciones.descuentoTexto}`;
  }

  return {
    id: `ad_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tipoEvento: opciones.tipoEvento,
    objetivo: opciones.objetivo,
    tono: opciones.tono,
    tituloGancho: ganchoBase,
    textoPrincipal: textoFinal,
    llamadoAccion: ctaBase,
    enlaceDestino,
    guionReelsTikTok: guion,
    sugerenciaVisual: visual,
    publicoObjetivoSugerido: plantilla.publicos,
    creadoEn: new Date().toISOString(),
  };
}

