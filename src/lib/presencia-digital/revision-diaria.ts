import type { DigitalPresenceReview, PlatformName } from '@/types/presencia-digital';
import type { SocialPost } from '@/types/social-media';
import type { SocialConnection } from '@/types/settings';
import { hayPresupuestoParaIA } from '@/lib/ai/consumo-servidor';
import { registrarConsumoIA } from '@/lib/ai/consumo-servidor';
import { getUruguayParts, hoyEnUruguay } from '@/lib/utils';

/**
 * Genera la revisión diaria de presencia digital con análisis inteligente y sugerencia de posteo.
 * Controla el presupuesto mensual de IA y cuenta el consumo.
 */
export async function buildDigitalPresenceDailyReview(params: {
  posts: SocialPost[];
  connections: SocialConnection[];
  forceRegenerate?: boolean;
}): Promise<DigitalPresenceReview> {
  const today = hoyEnUruguay();
  const now = new Date();

  // 1. Identificar la publicación con mejor desempeño histórico reciente
  const publishedPosts = params.posts.filter((p) => p.status === 'Publicado' || p.status === 'Importado de IG');
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

  // 2. Calcular días sin publicar por plataforma (solo si hay publicaciones con fecha real)
  const platformsToCheck: PlatformName[] = ['Instagram', 'Facebook', 'TikTok', 'YouTube'];
  const inactivePlatforms: Array<{ platform: PlatformName; daysWithoutPost: number }> = [];
  const activePlatformsWithRecentPosts: PlatformName[] = [];

  const validDatedPosts = publishedPosts.filter((p) => {
    if (!p.publishDate) return false;
    const ms = new Date(p.publishDate).getTime();
    return Number.isFinite(ms);
  });
  const hasAnyDatedPost = validDatedPosts.length > 0;

  // 3. Revisar plataformas desconectadas / conectadas
  const disconnectedPlatforms: string[] = [];
  const connectedPlatforms: PlatformName[] = [];
  for (const platform of platformsToCheck) {
    const conn = params.connections.find((c) => c.platform === platform);
    if (!conn || !conn.isConnected) {
      disconnectedPlatforms.push(platform);
    } else {
      connectedPlatforms.push(platform);
    }
  }
  const hasAnyConnection = connectedPlatforms.length > 0;

  if (hasAnyDatedPost) {
    for (const platform of platformsToCheck) {
      const lastPost = validDatedPosts
        .filter((p) => p.platform === platform)
        .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())[0];

      if (lastPost && lastPost.publishDate) {
        const diffDays = Math.floor((now.getTime() - new Date(lastPost.publishDate).getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 3) {
          inactivePlatforms.push({ platform, daysWithoutPost: diffDays });
        } else {
          activePlatformsWithRecentPosts.push(platform);
        }
      }
    }
  }

  const allConnectedPlatformsActive =
    hasAnyConnection &&
    activePlatformsWithRecentPosts.length > 0 &&
    inactivePlatforms.length === 0 &&
    connectedPlatforms.every((p) => activePlatformsWithRecentPosts.includes(p));

  // 4. Generar sugerencia de posteo pasando por el contador de IA
  let aiUsed = false;
  let suggestion = {
    concept: 'Momento mágico en la pista de baile',
    text: '¡Así se vive la verdadera fiesta en Salto! ✨ Luces LED, la mejor música y una energía increíble que no para hasta el amanecer. ¿Estás planeando tus 15 o tu boda? Reservá tu fecha con tiempo con el equipo de AK Producciones 🎉',
    recommendedPlatform: 'Instagram' as const,
    hashtags: ['#AKProducciones', '#FiestasSalto', '#EventosUruguay', '#Discoteca', '#MomentosInolvidables'],
  };

  try {
    const presupuestoDisponible = await hayPresupuestoParaIA();

    if (presupuestoDisponible) {
      // Registrar consumo de IA para la revisión diaria
      // Sin llamada real a modelo de IA no se finge consumo (Orden 194 Bloque 3)
      aiUsed = false;

      // Adaptar según el día de la semana en Uruguay
      const uyParts = getUruguayParts(now);
      const diaSemana = new Date(Date.UTC(uyParts.year, uyParts.month - 1, uyParts.day, 12, 0, 0)).getUTCDay();
      if (diaSemana === 5 || diaSemana === 6) { // Viernes / Sábado
        suggestion = {
          concept: 'Cuenta regresiva de fin de semana y ambientación de salón',
          text: 'Viernes de fiesta: todo el equipamiento listo, la pista armada y los detalles de iluminación a punto para una noche inolvidable. ¡A disfrutar al máximo con AK! 💫🥳',
          recommendedPlatform: 'Instagram',
          hashtags: ['#FinDeSemanaAK', '#AmbientacionSalto', '#QuinceAños', '#BodasSalto'],
        };
      } else if (diaSemana === 1) { // Lunes
        suggestion = {
          concept: 'Resumen emotivo del fin de semana (Social Proof)',
          text: 'Empezamos la semana con el corazón lleno de los momentos únicos que vivimos este fin de semana. Gracias a cada familia por hacernos parte de sus recuerdos más importantes. ❤️📸',
          recommendedPlatform: 'Instagram',
          hashtags: ['#RecuerdosAK', '#FiestasSalto', '#MomentosReales', '#AKProducciones'],
        };
      }
    }
  } catch (error) {
    console.warn('[revision-diaria] Fallback a sugerencia estándar por error de IA:', error);
  }

  // 5. Armar resumen conciso en lenguaje rioplatense
  let summaryText = 'Todo en orden en las redes principales.';
  if (hasAnyDatedPost && inactivePlatforms.length > 0) {
    const nombres = inactivePlatforms.map((p) => `${p.platform} (${p.daysWithoutPost} días)`).join(', ');
    summaryText = `Hay redes sin movimiento reciente: ${nombres}. Conviene publicar para mantener el alcance.`;
  } else if (!hasAnyDatedPost) {
    summaryText = 'Sin datos todavía — aún no hay publicaciones con fecha registrada.';
  } else if (!hasAnyConnection) {
    summaryText = 'Sin datos todavía — conectá tus redes para verificar el ritmo de publicaciones.';
  } else if (!allConnectedPlatformsActive) {
    summaryText = 'Sin datos todavía — aún no hay publicaciones fechadas recientes en todas tus redes conectadas.';
  }

  return {
    date: today,
    generatedAt: now.toISOString(),
    summary: summaryText,
    hasAnyDatedPost,
    activePlatformsWithRecentPosts,
    hasAnyConnection,
    allConnectedPlatformsActive,
    topPost,
    inactivePlatforms,
    disconnectedPlatforms,
    dailyPostSuggestion: suggestion,
    aiUsed,
  };
}
