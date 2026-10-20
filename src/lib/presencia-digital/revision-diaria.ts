import type {
  DigitalPresenceReview,
  PlatformName,
  DigitalPresenceFinding,
  DigitalPresenceAlert,
  DailyPostRecommendation,
} from '@/types/presencia-digital';
import type { SocialPost } from '@/types/social-media';
import type { SocialConnection } from '@/types/settings';
import type { CrmLead } from '@/types/crm';
import type { Presupuesto } from '@/types/presupuesto';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { SocialComment } from '@/types/comentarios-redes';
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';
import { hoyEnUruguay } from '@/lib/utils';
import { generateWithGeminiFallback, geminiMarketingModel } from '@/ai/genkit';

export interface BuildDailyReviewParams {
  posts: SocialPost[];
  connections: SocialConnection[];
  leads?: CrmLead[];
  budgets?: Presupuesto[];
  fiestas?: FiestaEnPlanificacion[];
  comments?: SocialComment[];
  forceRegenerate?: boolean;
}

/**
 * Motor del Ayudante Diario de Redes Sociales y Presencia Digital con IA.
 * Analiza métricas reales del negocio (leads de CRM, presupuestos firmados, fiestas y comentarios)
 * para identificar lo que funciona, lo que no y generar 3 publicaciones listas para hoy.
 */
export async function buildDigitalPresenceDailyReview(
  params: BuildDailyReviewParams
): Promise<DigitalPresenceReview> {
  const today = hoyEnUruguay();
  const now = new Date();
  const leads = params.leads || [];
  const budgets = params.budgets || [];
  const fiestas = params.fiestas || [];
  const comments = params.comments || [];
  const publishedPosts = params.posts.filter((p) => p.status === 'Publicado' || p.status === 'Importado de IG');

  // 1. Mejor publicación histórica reciente (por interacciones + likes)
  let topPost: DigitalPresenceReview['topPost'] = null;
  if (publishedPosts.length > 0) {
    const sorted = [...publishedPosts].sort((a, b) => {
      const scoreA = (a.performance?.interactions || 0) * 2 + (a.performance?.likes || 0);
      const scoreB = (b.performance?.interactions || 0) * 2 + (b.performance?.likes || 0);
      return scoreB - scoreA;
    });

    const best = sorted[0];
    topPost = {
      id: best.id,
      platform: best.platform,
      text: best.text,
      likes: best.performance?.likes || 0,
      interactions: best.performance?.interactions || 0,
      mediaUrl: best.mediaUrl,
    };
  }

  // 2. Días sin publicar por plataforma
  const platformsToCheck: PlatformName[] = ['Instagram', 'Facebook', 'TikTok', 'YouTube'];
  const inactivePlatforms: Array<{ platform: PlatformName; daysWithoutPost: number }> = [];

  for (const platform of platformsToCheck) {
    const lastPost = publishedPosts
      .filter((p) => p.platform === platform && p.publishDate)
      .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())[0];

    if (lastPost && lastPost.publishDate) {
      const diffDays = Math.floor((now.getTime() - new Date(lastPost.publishDate).getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 3) {
        inactivePlatforms.push({ platform, daysWithoutPost: diffDays });
      }
    } else {
      inactivePlatforms.push({ platform, daysWithoutPost: 15 });
    }
  }

  // 3. Plataformas desconectadas
  const disconnectedPlatforms: string[] = [];
  for (const platform of platformsToCheck) {
    const conn = params.connections.find((c) => c.platform === platform);
    if (!conn || !conn.isConnected) {
      disconnectedPlatforms.push(platform);
    }
  }

  // 4. Análisis real de canales de adquisición (últimos 30 días)
  const cutoff30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentLeads = leads.filter((l) => !l.createdAt || new Date(l.createdAt) >= cutoff30d);

  const channelStats: Record<string, { leads: number; closed: number }> = {
    instagram: { leads: 0, closed: 0 },
    facebook: { leads: 0, closed: 0 },
    tiktok: { leads: 0, closed: 0 },
    whatsapp: { leads: 0, closed: 0 },
    web_directo: { leads: 0, closed: 0 },
    otros: { leads: 0, closed: 0 },
  };

  const eventTypeCount: Record<string, number> = {};

  for (const lead of recentLeads) {
    const src = (lead.acquisition?.source || 'direct').toLowerCase();
    let channelKey = 'otros';
    if (src.includes('instagram')) channelKey = 'instagram';
    else if (src.includes('facebook')) channelKey = 'facebook';
    else if (src.includes('tiktok')) channelKey = 'tiktok';
    else if (src.includes('whatsapp')) channelKey = 'whatsapp';
    else if (['direct', 'landing', 'portal_led'].some((k) => src.includes(k))) channelKey = 'web_directo';

    channelStats[channelKey].leads += 1;

    const isClosed =
      lead.presupuestoEstado === 'Aceptado' ||
      lead.presupuestoEstado === 'Facturado' ||
      Boolean(lead.invoiceId);
    if (isClosed) {
      channelStats[channelKey].closed += 1;
    }

    const tipo = lead.partyType || '15 Años';
    eventTypeCount[tipo] = (eventTypeCount[tipo] || 0) + 1;
  }

  // Encontrar el tipo de evento más consultado
  let topEventType = '15 Años';
  let maxTypeCount = 0;
  for (const [tipo, count] of Object.entries(eventTypeCount)) {
    if (count > maxTypeCount) {
      maxTypeCount = count;
      topEventType = tipo;
    }
  }

  // Encontrar el canal que más consultas trae
  let bestChannelName = 'Instagram';
  let bestChannelLeads = channelStats.instagram.leads;
  const channelDisplayNames: Record<string, string> = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    tiktok: 'TikTok',
    whatsapp: 'WhatsApp Directo',
    web_directo: 'Web AK',
    otros: 'Otras fuentes',
  };

  for (const [key, stat] of Object.entries(channelStats)) {
    if (stat.leads > bestChannelLeads) {
      bestChannelLeads = stat.leads;
      bestChannelName = channelDisplayNames[key] || key;
    }
  }

  // 5. Análisis de comentarios reales
  const positiveComments = comments.filter((c) => c.sentiment === 'positivo' || c.intentCategory === 'elogio');
  const questionComments = comments.filter(
    (c) =>
      c.esPregunta ||
      c.intentCategory === 'precio_presupuesto' ||
      c.intentCategory === 'fecha_disponibilidad' ||
      c.intentCategory === 'consulta_general'
  );

  // 6. Fiestas recientes completadas (últimos 30 días)
  const recentCompletedFiestas = fiestas.filter((f) => {
    const fecha = f.configuracion?.fechaEvento;
    if (!fecha) return false;
    const fiestaDate = new Date(fecha);
    return fiestaDate <= now && fiestaDate >= cutoff30d;
  });

  // 7. Construir "Lo que funciona" con datos reales verificados
  const loQueFunciona: DigitalPresenceFinding[] = [];

  if (bestChannelLeads > 0) {
    loQueFunciona.push({
      id: 'f_channel_lead',
      tipo: 'red_lider',
      titulo: `${bestChannelName} es tu canal con más consultas`,
      detalle: `Generó ${bestChannelLeads} consultas reales en los últimos 30 días. Conviene priorizar publicaciones en este canal.`,
      metrica: `${bestChannelLeads} consultas (30d)`,
    });
  } else {
    loQueFunciona.push({
      id: 'f_channel_lead_base',
      tipo: 'red_lider',
      titulo: 'Instagram y WhatsApp concentran el mayor interés',
      detalle: 'Son los puntos donde las familias uruguayas inician contacto directo para pedir presupuestos y fechas.',
      metrica: 'Canales clave',
    });
  }

  loQueFunciona.push({
    id: 'f_top_event_type',
    tipo: 'tipo_evento_demanda',
    titulo: `Mayor demanda actual: ${topEventType}`,
    detalle: `Las consultas más frecuentes están orientadas a ${topEventType}. Es el momento ideal para mostrar pistas de baile, iluminación y ambientaciones de este formato.`,
    metrica: maxTypeCount > 0 ? `${maxTypeCount} consultas recientes` : 'Alta demanda',
  });

  if (topPost) {
    loQueFunciona.push({
      id: 'f_top_post',
      tipo: 'formato_exitoso',
      titulo: `Publicación destacada en ${topPost.platform}`,
      detalle: `Tu posteo con mayor impacto generó ${topPost.interactions} interacciones y ${topPost.likes} me gusta. Los momentos de fiesta real en pista son los que más conectan.`,
      metrica: `${topPost.interactions} interacciones`,
    });
  }

  if (positiveComments.length > 0) {
    const ultimoElogio = positiveComments[0];
    loQueFunciona.push({
      id: 'f_positive_comment',
      tipo: 'comentarios_positivos',
      titulo: 'Elogios y prueba social real',
      detalle: `Comentarios como "${ultimoElogio.text.slice(0, 90)}..." de ${ultimoElogio.authorName} son testimonios ideales para transformar en historias y publicaciones.`,
      metrica: `${positiveComments.length} comentarios positivos`,
    });
  }

  // 8. Construir "Lo que no funciona / Alertas de hoy"
  const loQueNoFunciona: DigitalPresenceAlert[] = [];

  if (inactivePlatforms.length > 0) {
    for (const p of inactivePlatforms) {
      loQueNoFunciona.push({
        id: `alert_inactive_${p.platform.toLowerCase()}`,
        severidad: p.daysWithoutPost >= 7 ? 'alta' : 'media',
        titulo: `${p.platform} lleva ${p.daysWithoutPost} días sin publicaciones`,
        detalle: `Cuando dejás más de 3 días sin publicar, el algoritmo reduce el alcance y los clientes potenciales dejan de ver tus novedades en Salto.`,
        accionSugerida: `Subir hoy una publicación o Reel en ${p.platform} usando una de las 3 propuestas sugeridas.`,
      });
    }
  }

  if (questionComments.length > 0) {
    loQueNoFunciona.push({
      id: 'alert_pending_questions',
      severidad: 'media',
      titulo: `${questionComments.length} preguntas de clientes en comentarios`,
      detalle: 'Hay consultas sobre presupuestos, fechas y qué incluye el servicio que aún no fueron abordadas con un posteo explicativo.',
      accionSugerida: 'Publicar una respuesta en video corto o carrusel respondiendo la duda más repetida.',
    });
  }

  if (recentCompletedFiestas.length > 0) {
    const fReciente = recentCompletedFiestas[0];
    const nombreF = fReciente.configuracion?.nombreEvento || 'Fiesta reciente';
    loQueNoFunciona.push({
      id: 'alert_unused_party_media',
      severidad: 'baja',
      titulo: `Material de ${nombreF} sin aprovechar en redes`,
      detalle: 'Tuviste un evento exitoso en los últimos días y todavía no se compartió el resumen o detrás de escena en las redes.',
      accionSugerida: 'Aprovechar las fotos de la pista y cabinas para publicar prueba social fresca.',
    });
  }

  // 9. Generar 3 propuestas de publicaciones nuevas + Consejo Estratégico del Día
  let aiUsed = false;
  let consejoEstrategico = `Hoy conviene reforzar ${bestChannelName} con un posteo de ${topEventType}. Mantené las redes con fotos reales de tus fiestas para que las familias vean cómo se vive la experiencia en vivo.`;

  // Plantillas determinísticas ricas con el método AK (Dolor -> Solución Integral AK -> WhatsApp 098 355 530)
  let propuestas: DailyPostRecommendation[] = [
    {
      id: `prop_1_${today}`,
      titulo: `Reel de Autoridad: Cómo armar una fiesta de ${topEventType} sin estrés`,
      redRecomendada: 'Instagram',
      formato: 'Reel / TikTok (Video corto de 25s)',
      porQueFunciona: `Porque ${bestChannelName} es tu red con más consultas y ${topEventType} concentra la mayor demanda de este mes.`,
      guionVisual:
        'Tomas rápidas: 1) DJ ajustando la consola y luces encendiéndose, 2) Pista llena bailando, 3) Vos o el equipo sonriendo listos para recibir a los invitados.',
      textoListo: `Organizar una fiesta de ${topEventType} no tiene por qué ser un dolor de cabeza coordinando 10 proveedores distintos.\n\nEn AK Producciones nos encargamos de todo de forma integral: discoteca, iluminación robótica de última generación, pantallas LED, cabinas interactivas y animación profesional.\n\nVos solo te dedicás a disfrutar con tu familia. Cada detalle corre por nuestra cuenta.\n\n📲 Escribinos al WhatsApp 098 355 530 y coordinemos una reunión para reservar tu fecha con tiempo.`,
      hashtags: ['#AKProducciones', '#FiestasSalto', `#${topEventType.replace(/\s+/g, '')}Salto`, '#EventosUruguay', '#DiscotecaPro'],
    },
    {
      id: `prop_2_${today}`,
      titulo: 'Prueba Social: La energía de la pista en nuestra última fiesta',
      redRecomendada: 'Multi',
      formato: 'Carrusel de 3 a 5 Fotos de Fiesta Real',
      porQueFunciona: 'La prueba social visual es lo que más confianza genera en madres, padres y parejas que buscan salón y discoteca en Salto.',
      guionVisual:
        'Foto 1: Pista de baile explotada con cotillón y luces LED. Foto 2: Invitados disfrutando de la cabina de fotos o plataforma 360. Foto 3: El protagonista sonriendo en su momento cumbre.',
      textoListo: `¡Así se vive una verdadera fiesta cuando la música y la iluminación están sincronizadas al milímetro! 💫🎉\n\nNuestra mayor satisfacción es ver la pista llena desde el primer tema hasta el amanecer.\n\nGracias a cada familia por confiar en el equipo de AK Producciones para crear recuerdos imborrables.\n\n¿Estás pensando en tu fiesta para este año o el próximo? Dejanos tu comentario o mandanos un mensaje directo y te armamos una propuesta a tu medida. 📲 WhatsApp: 098 355 530`,
      hashtags: ['#MomentosAK', '#FiestasReales', '#SaltoUruguay', '#PistaLlena', '#EventosInolvidables'],
    },
    {
      id: `prop_3_${today}`,
      titulo: 'Pregunta Frecuente: ¿Con cuántos meses de anticipación conviene reservar?',
      redRecomendada: 'Facebook',
      formato: 'Posteo con Imagen de Ambientación / Placa limpia',
      porQueFunciona: 'Ataca directamente la duda más repetida en comentarios y genera urgencia sana en clientes indecisos.',
      guionVisual:
        'Placa gráfica elegante en tonos oscuros y dorados con el texto "¿Cuándo reservar tu fecha?" sobre una foto tenue de salón ambientado.',
      textoListo: `Una de las preguntas que más nos hacen por mensaje privado es: "¿Con cuánto tiempo de anticipación tengo que reservar mi fecha?"\n\nNuestra recomendación siempre es entre 6 y 12 meses antes, sobre todo para fechas clave de primavera y fines de semana.\n\nAl reservar con tiempo asegurás tu fecha con el equipo completo de AK Producciones y podés abonar en cómodas cuotas sin sorpresas.\n\nConsultanos hoy mismo disponibilidad para tu fecha escribiéndonos al WhatsApp 098 355 530. ¡Te esperamos!`,
      hashtags: ['#AKProducciones', '#TipsDeEventos', '#ReservaTuFecha', '#FiestasSalto', '#BodasY15'],
    },
  ];

  // 10. Intentar enriquecer con IA (Google Gemini) si hay presupuesto
  try {
    const presupuestoDisponible = await hayPresupuestoParaIA();
    if (presupuestoDisponible) {
      await registrarConsumoIA('revision-diaria');
      aiUsed = true;

      const aiPrompt = `Actuá como el Director de Marketing y Redes Sociales de AK Producciones (empresa líder de eventos, discoteca, 15 años y bodas en Salto, Uruguay).
Hablá en español rioplatense (uruguayo: "vos", "bo", "che"), directo, profesional y enfocado en vender sin vender.

DATOS REALES DEL DÍA:
- Red líder con más consultas: ${bestChannelName} (${bestChannelLeads} consultas en 30 días).
- Tipo de evento más cotizado: ${topEventType}.
- Redes sin publicar: ${inactivePlatforms.map((p) => `${p.platform} (${p.daysWithoutPost} días)`).join(', ') || 'Ninguna'}.
- Preguntas frecuentes en comentarios: ${questionComments.slice(0, 3).map((c) => c.text).join(' | ') || 'Precios y reservas'}.
- Elogios recientes: ${positiveComments.slice(0, 2).map((c) => c.text).join(' | ') || 'Excelente fiesta y música'}.

Devolvé UNICAMENTE un objeto JSON válido con este formato:
{
  "consejoEstrategico": "Consejo directo de 2 renglones para el dueño hoy",
  "propuestas": [
    {
      "titulo": "Título de la propuesta 1 (Autoridad / Detrás de escena)",
      "redRecomendada": "Instagram",
      "formato": "Reel / TikTok (Video corto)",
      "porQueFunciona": "Por qué funciona con los datos de hoy",
      "guionVisual": "Qué grabar o mostrar en 2 renglones",
      "textoListo": "Texto completo listo para publicar con método AK (Dolor/Dificultad -> Solución Integral AK -> WhatsApp 098 355 530)",
      "hashtags": ["#AKProducciones", "#FiestasSalto"]
    },
    {
      "titulo": "Título de la propuesta 2 (Prueba Social / Testimonio)",
      "redRecomendada": "Multi",
      "formato": "Carrusel de Fotos",
      "porQueFunciona": "Explicación",
      "guionVisual": "Guion",
      "textoListo": "Texto completo con WhatsApp 098 355 530",
      "hashtags": ["#AKProducciones"]
    },
    {
      "titulo": "Título de la propuesta 3 (Conversión / Pregunta Frecuente)",
      "redRecomendada": "Facebook",
      "formato": "Posteo explicativo",
      "porQueFunciona": "Explicación",
      "guionVisual": "Guion",
      "textoListo": "Texto completo con WhatsApp 098 355 530",
      "hashtags": ["#AKProducciones"]
    }
  ]
}`;

      const aiResponse = await generateWithGeminiFallback({
        model: geminiMarketingModel,
        prompt: aiPrompt,
        config: { maxOutputTokens: 2048 },
      });

      const rawText = aiResponse.text?.trim() || '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.consejoEstrategico && typeof parsed.consejoEstrategico === 'string') {
          consejoEstrategico = parsed.consejoEstrategico;
        }
        if (Array.isArray(parsed.propuestas) && parsed.propuestas.length >= 3) {
          propuestas = parsed.propuestas.slice(0, 3).map((p: any, idx: number) => ({
            id: `prop_ai_${idx + 1}_${today}`,
            titulo: p.titulo || propuestas[idx].titulo,
            redRecomendada: (p.redRecomendada === 'Facebook' ? 'Facebook' : p.redRecomendada === 'Multi' ? 'Multi' : 'Instagram') as PlatformName | 'Multi',
            formato: p.formato || propuestas[idx].formato,
            porQueFunciona: p.porQueFunciona || propuestas[idx].porQueFunciona,
            guionVisual: p.guionVisual || propuestas[idx].guionVisual,
            textoListo: p.textoListo || propuestas[idx].textoListo,
            hashtags: Array.isArray(p.hashtags) ? p.hashtags : propuestas[idx].hashtags,
          }));
        }
      }
    }
  } catch (error) {
    console.warn('[revision-diaria] Fallback a motor determinístico de marketing por error de IA:', error);
  }

  // 11. Resumen conciso
  let summaryText = 'Redes al día y con actividad.';
  if (inactivePlatforms.length > 0) {
    const nombres = inactivePlatforms.map((p) => `${p.platform} (${p.daysWithoutPost}d)`).join(', ');
    summaryText = `Hay redes sin publicar: ${nombres}. Te armamos 3 propuestas listas para activar hoy.`;
  } else {
    summaryText = `Tus redes principales tienen actividad reciente. Hoy el foco está en potenciar ${topEventType} en ${bestChannelName}.`;
  }

  // Mantener compatibilidad con dailyPostSuggestion existente
  const primaryProposal = propuestas[0];
  const legacySuggestion = {
    concept: primaryProposal.titulo,
    text: primaryProposal.textoListo,
    recommendedPlatform: primaryProposal.redRecomendada === 'Facebook' ? ('Facebook' as const) : primaryProposal.redRecomendada === 'Multi' ? ('Multi' as const) : ('Instagram' as const),
    hashtags: primaryProposal.hashtags,
  };

  return {
    date: today,
    generatedAt: now.toISOString(),
    summary: summaryText,
    consejoEstrategicoDelDia: consejoEstrategico,
    loQueFunciona,
    loQueNoFunciona,
    nuevasPublicacionesRecomendadas: propuestas,
    topPost,
    inactivePlatforms,
    disconnectedPlatforms,
    dailyPostSuggestion: legacySuggestion,
    aiUsed,
  };
}
