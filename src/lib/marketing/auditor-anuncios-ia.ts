import type { AuditoriaAnuncio } from './creador-anuncios-tipos';

interface OpcionesAuditoria {
  textoAnuncio: string;
  plataforma?: 'instagram' | 'facebook' | 'tiktok' | 'otra';
  objetivo?: 'leads' | 'mensajes_wpp' | 'visitas_web';
  presupuestoActual?: number;
}

export function auditarAnuncioConIA(opciones: OpcionesAuditoria): AuditoriaAnuncio {
  const texto = opciones.textoAnuncio.trim();
  const lower = texto.toLowerCase();

  const fallasCriticas: string[] = [];
  const consejosSinGastarMas: string[] = [];
  const palabrasEmocionalesEncontradas: string[] = [];

  // 1. ANÁLISIS DEL GANCHO (HOOK)
  const primerRenglon = texto.split('\n')[0] || '';
  let puntajeGancho = 10;
  let obsGancho = 'Gancho atractivo y directo al grano.';

  const ganchosAburridos = [
    'ofrecemos',
    'somos una empresa',
    'tenemos los mejores',
    'servicio de',
    'alquiler de',
    'hola a todos',
    'buenas tardes',
    'promo:',
  ];

  const tieneGanchoAburrido = ganchosAburridos.some((g) => primerRenglon.toLowerCase().startsWith(g));
  const tienePreguntaOEmocion = primerRenglon.includes('?') || primerRenglon.includes('¿') || primerRenglon.includes('✨') || primerRenglon.includes('🔥');

  if (tieneGanchoAburrido || (!tienePreguntaOEmocion && primerRenglon.length < 20)) {
    puntajeGancho = 4;
    obsGancho = 'El gancho inicial es débil o corporativo. En redes sociales la gente hace scroll rápido; si los primeros 3 segundos no plantean una pregunta o un dolor real, el anuncio se ignora.';
    fallasCriticas.push('El primer renglón no frena el scroll: le habla al producto ("ofrecemos...") en vez de hablarle al deseo o problema del cliente.');
    consejosSinGastarMas.push('Cambiá la primera línea por una pregunta directa a la persona que decide (ej. "¿Tu hija cumple 15 en 2026 y no sabés por dónde arrancar?").');
  } else if (!tienePreguntaOEmocion) {
    puntajeGancho = 7;
    obsGancho = 'El gancho es claro pero podría generar mayor curiosidad o impacto emocional.';
  }

  // 2. ANÁLISIS DE NEUROVENTAS (EMOCIÓN VS EQUIPOS)
  let puntajeNeuro = 10;
  let obsNeuro = 'Excelente enfoque en beneficios emocionales y tranquilidad del cliente.';

  const terminosTecnicos = ['watts', 'pulgadas', 'dmx', 'consolas', 'parlantes', 'luces móviles', 'truss', 'proyector'];
  const terminosEmocionales = ['inolvidable', 'tranquilidad', 'disfrutar', 'recuerdos', 'fiesta soñada', 'emoción', 'familia', 'amigos', 'sin preocupaciones', 'magia', 'experiencia'];

  const conteoTecnico = terminosTecnicos.filter((t) => lower.includes(t)).length;
  const conteoEmocional = terminosEmocionales.filter((e) => {
    if (lower.includes(e)) {
      palabrasEmocionalesEncontradas.push(e);
      return true;
    }
    return false;
  }).length;

  if (conteoTecnico > 0 && conteoEmocional === 0) {
    puntajeNeuro = 3;
    obsNeuro = 'El anuncio cae en la trampa de "vender cables y cajas": la gente no compra parlantes ni luces, compra la diversión de sus invitados y la tranquilidad de que nada falle.';
    fallasCriticas.push('Exceso de tecnicismos: el cliente no evalúa potencia en watts, evalúa si sus invitados la van a pasar increíble.');
    consejosSinGastarMas.push('Reemplazá la lista de equipamiento por el resultado vivencial: en vez de "sonido 2000W", poné "música que hace que la pista esté llena toda la noche".');
  } else if (conteoEmocional === 0) {
    puntajeNeuro = 5;
    obsNeuro = 'Falta conexión emocional. El texto describe lo que hacés, pero no transmite la paz mental ni el estatus de contratar una productora profesional.';
    fallasCriticas.push('Falta justificación emocional: el cerebro decide por emoción y justifica por lógica.');
    consejosSinGastarMas.push('Agregá palabras de alivio como "sin estrés", "presupuesto cerrado garantizado" o "coordinación integral".');
  }

  // 3. ANÁLISIS DE OFERTA Y FRICCIÓN (CALL TO ACTION)
  let puntajeOferta = 10;
  let obsOferta = 'Llamado a la acción claro y de baja fricción.';

  const tieneCtaVago = lower.includes('consultas por privado') || lower.includes('inbox') || lower.includes('al dm') || lower.includes('comunicate');
  const tieneEnlaceClaro = lower.includes('link') || lower.includes('simulador') || lower.includes('whatsapp') || lower.includes('hacé clic') || lower.includes('tocá');

  if (tieneCtaVago) {
    puntajeOferta = 3;
    obsOferta = '"Consultas por privado" o "al inbox" genera fricción y desconfianza. El cliente siente pereza de iniciar una conversación sin saber qué esperar.';
    fallasCriticas.push('Llamado a la acción con alta fricción ("por privado"). La gente prefiere probar un simulador o tocar un link directo a WhatsApp.');
    consejosSinGastarMas.push('Eliminá el "consultas al inbox" y poné un enlace directo con mensaje pre-armado o acceso al cotizador online.');
  } else if (!tieneEnlaceClaro) {
    puntajeOferta = 6;
    obsOferta = 'El llamado a la acción no está del todo explícito. Decile exactamente qué botón tocar y qué va a pasar después.';
    consejosSinGastarMas.push('Indicá con un emoji claro hacia dónde ir (ej. "👉 Tocá el botón de abajo y calculá tu presupuesto en 2 min").');
  }

  // Si no hay fallas críticas detectadas
  if (fallasCriticas.length === 0) {
    fallasCriticas.push('Ninguna falla grave detectada. El texto está bien estructurado.');
  }
  if (consejosSinGastarMas.length === 0) {
    consejosSinGastarMas.push('Mantené el anuncio fresco cambiando la imagen o video cada 3 semanas para evitar fatiga de audiencia.');
    consejosSinGastarMas.push('Probá hacer un Reel corto leyendo este mismo copy con fotos reales de fondo.');
  }

  // CÁLCULO DEL PUNTAJE GLOBAL
  const puntajeGlobal = Math.round((puntajeGancho * 0.35 + puntajeNeuro * 0.35 + puntajeOferta * 0.3) * 10) / 10;

  // GENERAR RESUMEN DIAGNÓSTICO SINCERO (ANTI-META)
  let diagnosticoResumen = '';
  if (puntajeGlobal >= 8.5) {
    diagnosticoResumen = '¡Excelente anuncio! Tiene gancho claro, emoción y baja fricción. El algoritmo de Meta te pediría más plata, pero este copy ya está optimizado para convertir con tu presupuesto actual.';
  } else if (puntajeGlobal >= 6) {
    diagnosticoResumen = 'El anuncio tiene potencial pero pierde clientes en el gancho o en el cierre. Corrigiendo el primer renglón y el llamado a la acción vas a duplicar los contactos sin poner un peso extra en Meta.';
  } else {
    diagnosticoResumen = 'El anuncio está quemando presupuesto porque parece un folleto tradicional. Meta te diría "invertí el doble", pero el problema real es que el texto aburre y la gente sigue de largo. Abajo tenés la versión reescrita lista para usar.';
  }

  // GENERAR VERSIÓN REESCRITA OPTIMIZADA
  const tituloMejorado = '¿Organizando tu fiesta soñada sin saber por dónde empezar? ✨';
  const copyOptimizado = `Sabemos que planear una fiesta inolvidable lleva tiempo, dudas y mil decisiones.\n\nEn AK Producciones nos encargamos de TODO para que ustedes sólo disfruten con su gente:\n✨ Salones exclusivos y ambientación integral\n🎧 Pista encendida toda la noche con DJ y técnica de primer nivel\n🍹 Barras y gastronomía coordinada al detalle\n\n👉 Tocá acá y calculá tu presupuesto cerrado en 2 minutos sin compromiso.`;

  return {
    id: `audit_${Date.now()}`,
    puntajeGlobal,
    diagnosticoResumen,
    evaluacionGancho: {
      puntaje: puntajeGancho,
      observaciones: obsGancho,
      ganchoMejorado: 'El secreto de las fiestas donde la gente no para de bailar (y cómo lograrlo sin estrés) 👇',
    },
    evaluacionNeuroventas: {
      puntaje: puntajeNeuro,
      observaciones: obsNeuro,
      palabrasClaveEmocionales: palabrasEmocionalesEncontradas.length > 0 ? palabrasEmocionalesEncontradas : ['tranquilidad', 'inolvidable', 'fiesta soñada'],
    },
    evaluacionOfertaFriccion: {
      puntaje: puntajeOferta,
      observaciones: obsOferta,
      ctaRecomendado: '👉 Entrá al simulador online y armá tu fiesta a medida en 2 minutos',
    },
    fallasCriticas,
    consejosOptimizacionSinGastarMas: consejosSinGastarMas,
    anuncioReescritoOptimizado: {
      tituloGancho: tituloMejorado,
      copyCompleto: copyOptimizado,
      llamadoAccion: 'Calcular Presupuesto Online',
      porQueEstaVersionConvierteMejor: 'Frena el scroll con una pregunta empática, elimina tecnicismos fríos para hablarle al deseo de disfrutar sin estrés, y ofrece una salida de baja fricción (simulador online) en vez de "pedir precio por privado".',
    },
    analizadoEn: new Date().toISOString(),
  };
}

