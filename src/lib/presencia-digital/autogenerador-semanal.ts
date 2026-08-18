import 'server-only';

import type { SocialPost } from '@/types/social-media';
import { readData, writeData } from '@/lib/data-service';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';
import { chatWithMarketingAgent } from '@/ai/flows/marketing-agent-flow';

const POSTS_FILE = 'social-posts.json';

export interface AutoGeneracionSemanasResult {
  success: boolean;
  createdCount: number;
  tipoOrigen: 'fiesta_reciente' | 'preguntas_frecuentes' | 'sin_material';
  motivo?: string;
  posts: SocialPost[];
}

const TEMAS_PREGUNTAS_FRECUENTES = [
  {
    tema: '¿Qué incluye el servicio completo para fiestas en Salto?',
    angulos: [
      {
        platform: 'Instagram' as const,
        text: '¿Estás organizando tu fiesta en Salto y no sabés por dónde arrancar? 🤔🎉\n\nEn AK Producciones te resolvemos todo en un solo lugar: discoteca con sonido profesional, iluminación de pista, ambientación, fotocabina y coordinación del evento para que vos solo te dediques a disfrutar.\n\nEscribinos por WhatsApp al 098 355 530 y armamos la propuesta a tu medida. 📲✨\n\n#AKProducciones #EventosSalto #FiestasUruguay #OrganizacionDeEventos',
      },
      {
        platform: 'Facebook' as const,
        text: 'Planificar una fiesta no tiene por qué ser estresante. 💡\n\nCon nuestro servicio integral para cumpleaños de 15, bodas y aniversarios en Salto, tenés el respaldo de un equipo con años de experiencia en la noche.\n\nConsultanos disponibilidad de fechas para este año o el próximo enviando un mensaje directo. 📩\n\n#SaltoUY #AKProducciones #FiestasSalto #DiscotecaSalto',
      },
    ],
  },
  {
    tema: 'Cómo elegir el salón y calcular la capacidad en Salto',
    angulos: [
      {
        platform: 'Instagram' as const,
        text: '¿Club Uruguay, Haras de Quiroga o salón privado? 🏛️✨\n\nConocemos al detalle la acústica, los accesos y los espacios de cada salón de eventos en Salto para diseñar la puesta de luces y sonido perfecta.\n\nTe asesoramos desde el día uno para aprovechar al máximo cada rincón del lugar elegido. 💫\n\n#SalonesSalto #AKProducciones #AmbientacionSalto #BodasSalto',
      },
    ],
  },
  {
    tema: '¿Con cuánta anticipación conviene reservar la fecha?',
    angulos: [
      {
        platform: 'Instagram' as const,
        text: 'Las fechas más pedidas de primavera y fin de año se reservan con meses de anticipación. 📅⏳\n\nSi ya tenés tu fecha pensada para 15 años o casamiento, no te quedes sin tu equipo de confianza.\n\nIngresá a nuestra web y probá el simulador de presupuesto en 1 minuto. 📲✨\n\n#QuinceAñosSalto #BodasUY #AKProducciones #PresupuestoFiesta',
      },
    ],
  },
];

/**
 * Llena el calendario semanal de redes de forma desatendida:
 * - Si hubo fiesta en los últimos 7 días: toma sus fotos.
 * - Si es una semana floja (sin fiestas recientes): genera posteos educativos y preguntas frecuentes con fotos de archivo.
 * - Si no hay ninguna foto en el sistema: informa sin inventar.
 */
export async function autoGenerarBorradoresSemanales(): Promise<AutoGeneracionSemanasResult> {
  const existingPosts = await readData<SocialPost[]>(POSTS_FILE, []);
  const allFiestas = await getFiestas(true).catch(() => []);

  const ahora = new Date();
  const hace7Dias = new Date();
  hace7Dias.setDate(ahora.getDate() - 7);

  // 1. Buscar si hay fiesta terminada en los últimos 7 días con fotos
  let fiestaRecienteConFotos: { fiesta: any; fotos: string[] } | null = null;
  let fotosHistoricasDisponibles: string[] = [];

  for (const fiesta of allFiestas) {
    const fechaStr = fiesta.configuracion?.fechaEvento;
    const fotos: string[] = [];

    if (fiesta.invitacionConfig?.galeriaFotos) {
      fotos.push(...fiesta.invitacionConfig.galeriaFotos);
    }
    if (fiesta.invitacionDigital?.galeria?.fotos) {
      fotos.push(...fiesta.invitacionDigital.galeria.fotos);
    }
    if (fiesta.galeriaUrl) {
      fotos.push(fiesta.galeriaUrl);
    }

    if (fotos.length > 0) {
      fotosHistoricasDisponibles.push(...fotos);

      if (fechaStr) {
        const fecha = new Date(fechaStr);
        if (!isNaN(fecha.getTime()) && fecha >= hace7Dias && fecha <= ahora && !fiestaRecienteConFotos) {
          fiestaRecienteConFotos = { fiesta, fotos };
        }
      }
    }
  }

  // Si no hay ninguna foto en ninguna fiesta
  if (fotosHistoricasDisponibles.length === 0 && !fiestaRecienteConFotos) {
    return {
      success: true,
      createdCount: 0,
      tipoOrigen: 'sin_material',
      motivo: 'No se encontraron fotos en las fiestas registradas para ilustrar los posteos.',
      posts: [],
    };
  }

  const canUseAI = await hayPresupuestoParaIA().catch(() => false);
  const nuevosBorradores: SocialPost[] = [];

  if (fiestaRecienteConFotos) {
    // Caso 1: Fiesta reciente
    const { fiesta, fotos } = fiestaRecienteConFotos;
    const nombre = fiesta.configuracion?.nombreEvento || 'la fiesta';
    const tipo = fiesta.configuracion?.tipoCelebracion || 'evento';
    const salon = fiesta.configuracion?.nombreLugar || 'Salto';

    const selectedPhotos = fotos.slice(0, 3);

    for (let i = 0; i < selectedPhotos.length; i++) {
      const photoUrl = selectedPhotos[i];
      const platform = i % 2 === 0 ? 'Instagram' : 'Facebook';
      let postText = `¡Así se vivió ${nombre}! 📸✨\n\nUna noche inolvidable en ${salon} junto a familia y amigos. ¡Gracias por confiar en AK Producciones para hacerla realidad! 🎉\n\n#AKProducciones #EventosSalto #FiestasUY`;

      if (canUseAI) {
        try {
          const aiRes = await chatWithMarketingAgent({
            request: `Escribí un posteo corto y emocionante para ${platform} sobre la fiesta de ${nombre} en ${salon}. Tono rioplatense (uruguayo). Agradecé y destacá la diversión.`,
            context: `Fiesta: ${nombre}. Salón: ${salon}. Tipo: ${tipo}.`,
            platform,
            eventType: tipo,
          });
          if (aiRes?.content && aiRes.content.trim().length > 20) {
            postText = aiRes.content.trim();
          }
        } catch {
          // Fallback a texto fijo
        }
      }

      const scheduledDate = new Date(ahora.getTime() + (i + 1) * 86400000);
      nuevosBorradores.push({
        id: `autodraft_${fiesta.id}_${Date.now()}_${i}`,
        platform,
        isGeneralCampaign: false,
        eventId: fiesta.id,
        eventName: nombre,
        publishDate: scheduledDate.toISOString(),
        text: postText,
        mediaUrl: photoUrl,
        mediaType: 'image',
        status: 'Borrador',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (canUseAI && nuevosBorradores.length > 0) {
      await registrarConsumoIA('material-post-evento', nuevosBorradores.length).catch(() => {});
    }

    const postsCombinados = [...nuevosBorradores, ...existingPosts];
    await writeData(POSTS_FILE, postsCombinados, (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

    return {
      success: true,
      createdCount: nuevosBorradores.length,
      tipoOrigen: 'fiesta_reciente',
      posts: nuevosBorradores,
    };
  }

  // Caso 2: Semana floja -> Generar propuestas de Preguntas Frecuentes
  const templateGroup = TEMAS_PREGUNTAS_FRECUENTES[Math.floor(Math.random() * TEMAS_PREGUNTAS_FRECUENTES.length)];
  const fotoArchivo = fotosHistoricasDisponibles[Math.floor(Math.random() * fotosHistoricasDisponibles.length)];

  templateGroup.angulos.forEach((item, idx) => {
    const scheduledDate = new Date(ahora.getTime() + (idx + 2) * 86400000);
    nuevosBorradores.push({
      id: `faqdraft_${Date.now()}_${idx}`,
      platform: item.platform,
      isGeneralCampaign: true,
      publishDate: scheduledDate.toISOString(),
      text: item.text,
      mediaUrl: fotoArchivo,
      mediaType: 'image',
      status: 'Borrador',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  const postsCombinados = [...nuevosBorradores, ...existingPosts];
  await writeData(POSTS_FILE, postsCombinados, (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

  return {
    success: true,
    createdCount: nuevosBorradores.length,
    tipoOrigen: 'preguntas_frecuentes',
    posts: nuevosBorradores,
  };
}
