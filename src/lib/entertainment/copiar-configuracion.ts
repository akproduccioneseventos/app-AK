import type { FiestaEnPlanificacion, SocialGallerySettings } from '@/types/fiesta';

/**
 * Copia configuraciones técnicas y de diseño de entretenimiento de una fiesta a otra.
 *
 * SÍ se copia:
 * - Módulos activados con sus ajustes técnicos (fotosPorTanda, copias, filtros, etc.)
 * - Diseños del muro social: fondo, layout, tamaño de fotos, segundos por foto, colores
 * - Carteleras (ledMarquee, marketingTicker)
 * - Tótems configurados (ajustes visuales y modos)
 * - Límites y marcos de impresión
 *
 * NUNCA se copian personas ni recuerdos:
 * - Fotos, videos, publicaciones del muro
 * - Invitados, clientes o datos de contacto
 * - Mensajes del libro de firmas / cápsula del tiempo
 * - Ganadores de juegos o sorteos
 * - Checklists marcadas (se desmarcan para el nuevo evento)
 */
export function copiarConfiguracion(
  origen: Partial<FiestaEnPlanificacion>,
  destino: Partial<FiestaEnPlanificacion> = {}
): Partial<FiestaEnPlanificacion> {
  const resultado: Partial<FiestaEnPlanificacion> = {
    ...destino,
  };

  // 1. Limpieza y copia de módulos de entretenimiento
  if (origen.others?.entretenimiento?.modules) {
    const origModules = origen.others.entretenimiento.modules;
    const cleanModules: Record<string, any> = {};

    for (const [key, mod] of Object.entries(origModules)) {
      if (!mod || typeof mod !== 'object') continue;
      const modCopy: any = { ...mod };

      // Vaciar recuerdos, fotos y capturas
      if ('media' in modCopy) {
        modCopy.media = [];
      }
      if ('capturas' in modCopy) {
        delete modCopy.capturas;
      }
      if ('totalCapturas' in modCopy) {
        modCopy.totalCapturas = 0;
      }
      if ('firmas' in modCopy) {
        modCopy.firmas = [];
      }

      // Reiniciar checklist de operador
      if (Array.isArray(modCopy.checklist)) {
        modCopy.checklist = modCopy.checklist.map((item: any) => ({
          ...item,
          done: false,
        }));
      }

      cleanModules[key] = modCopy;
    }

    resultado.others = {
      ...(resultado.others || {}),
      entretenimiento: {
        ...(resultado.others?.entretenimiento || {}),
        modules: cleanModules,
      },
    };
  }

  // 2. Copia de configuraciones de diseño del muro social y pantallas
  if (origen.socialGallerySettings) {
    const origSocial: any = origen.socialGallerySettings;
    const destSocial: any = resultado.socialGallerySettings || {};

    const cleanTotems = Array.isArray(origSocial.totemScreens)
      ? origSocial.totemScreens.map((t: any) => {
          const { qrUrl, ...resto } = t;
          return {
            ...resto,
          };
        })
      : destSocial.totemScreens;

    const cleanSocialSettings: any = {
      ...destSocial,
      enabled: origSocial.enabled ?? destSocial.enabled ?? true,
      allowLikes: origSocial.allowLikes ?? destSocial.allowLikes ?? true,
      allowComments: origSocial.allowComments ?? destSocial.allowComments ?? true,
      uploadsActive: origSocial.uploadsActive ?? destSocial.uploadsActive ?? true,
      requireApproval: origSocial.requireApproval ?? destSocial.requireApproval ?? false,
      theme: origSocial.theme ?? destSocial.theme,
      accentColor: origSocial.accentColor ?? destSocial.accentColor,
      primaryColor: origSocial.primaryColor ?? destSocial.primaryColor,
      secondaryColor: origSocial.secondaryColor ?? destSocial.secondaryColor,
      fondoMuro: origSocial.fondoMuro ?? destSocial.fondoMuro,
      fondoMuroImagenUrl: origSocial.fondoMuroImagenUrl ?? destSocial.fondoMuroImagenUrl,
      currentLayout: origSocial.currentLayout ?? destSocial.currentLayout,
      tamanoFotosMosaico: origSocial.tamanoFotosMosaico ?? destSocial.tamanoFotosMosaico,
      segundosPorFoto: origSocial.segundosPorFoto ?? destSocial.segundosPorFoto,
      maxImpresionesPorPersona: origSocial.maxImpresionesPorPersona ?? destSocial.maxImpresionesPorPersona,
      marcoEnImpresion: origSocial.marcoEnImpresion ?? destSocial.marcoEnImpresion,
      ledMarqueeText: origSocial.ledMarqueeText ?? destSocial.ledMarqueeText,
      ledMarqueeSpeed: origSocial.ledMarqueeSpeed ?? destSocial.ledMarqueeSpeed,
      ledMarqueeEnabled: origSocial.ledMarqueeEnabled ?? destSocial.ledMarqueeEnabled,
      marketingTickerActive: origSocial.marketingTickerActive ?? destSocial.marketingTickerActive,
      marketingTickerText: origSocial.marketingTickerText ?? destSocial.marketingTickerText,
      marketingTickerSpeed: origSocial.marketingTickerSpeed ?? destSocial.marketingTickerSpeed,
      marketingTickerEnabled: origSocial.marketingTickerEnabled ?? destSocial.marketingTickerEnabled,
      totemScreens: cleanTotems,
    };

    // Asegurarse de que NUNCA haya datos personales en socialGallerySettings
    delete cleanSocialSettings.posts;
    delete cleanSocialSettings.sorteoGanadores;
    delete cleanSocialSettings.activeGame;
    delete cleanSocialSettings.dedications;
    delete cleanSocialSettings.messages;

    resultado.socialGallerySettings = cleanSocialSettings as SocialGallerySettings;
  }

  // 3. Los datos personales de destino (invitados, clientes, presupuestos, notas, etc.) se preservan intactos
  // y NUNCA se pisan con los del origen
  resultado.invitados = destino.invitados || [];
  if (destino.configuracion) {
    resultado.configuracion = {
      ...destino.configuracion,
    };
  }

  return resultado;
}
