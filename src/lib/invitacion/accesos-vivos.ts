import type { FiestaEnPlanificacion, ZonaDigitalFeatureId } from '@/types/fiesta';
import { withZonaDigitalDefaults } from '@/lib/zona-digital-adolescentes';

export interface InvitacionAccesosVivos {
  muroSocialActivo: boolean;
  miMesaActivo: boolean;
  menuDigitalActivo: boolean;
  menuDigitalUrl: string;
  albumActivo: boolean;
  albumUrl: string;
  recapActivo: boolean;
  recapUrl: string;
}

function isZonaFeatureActive(
  fiesta: Pick<FiestaEnPlanificacion, 'zonaDigitalAdolescentes' | 'modulosContratados'>,
  featureId: ZonaDigitalFeatureId
): boolean {
  const zona = fiesta.zonaDigitalAdolescentes;
  if (!zona) return true;
  if (zona.enabled === false) return false;
  const merged = withZonaDigitalDefaults(zona);
  const feat = merged.features.find((f) => f.id === featureId);
  if (!feat) return true;
  if (!feat.enabled || !feat.visibleForGuests) return false;
  if (feat.linkedModuleId && fiesta.modulosContratados?.[feat.linkedModuleId] === false) {
    return false;
  }
  return true;
}

function hasDigitalMenuConfigured(
  fiesta: Pick<FiestaEnPlanificacion, 'menuAsignadoId' | 'menuMesa' | 'menuSeleccionPortal' | 'modulosContratados'>
): boolean {
  if (fiesta.modulosContratados?.catering === false) return false;
  if (fiesta.modulosContratados?.menuMesa === false) return false;
  if (fiesta.menuAsignadoId && fiesta.menuAsignadoId.trim().length > 0) return true;
  const mesa = fiesta.menuMesa;
  if (mesa && (mesa.entrada || mesa.platoPrincipal || mesa.adolescentes || mesa.postres || mesa.bebidas)) {
    return true;
  }
  const portalMenu = fiesta.menuSeleccionPortal;
  if (portalMenu && (portalMenu.entrada || portalMenu.principal || portalMenu.postre || portalMenu.bebidas)) {
    return true;
  }
  return false;
}

export function buildAccesosVivosInvitacion(
  fiesta: Pick<
    FiestaEnPlanificacion,
    | 'id'
    | 'modulosContratados'
    | 'socialGallerySettings'
    | 'zonaDigitalAdolescentes'
    | 'guestPortalSettings'
    | 'menuAsignadoId'
    | 'menuMesa'
    | 'menuSeleccionPortal'
    | 'galeriaUrl'
  >,
  fiestaId?: string
): InvitacionAccesosVivos {
  const id = encodeURIComponent(fiestaId || fiesta.id || '');
  const muroContratado = fiesta.modulosContratados?.muroSocial !== false;
  const muroPrendido = fiesta.socialGallerySettings?.enabled !== false;
  const zonaMuroActiva = isZonaFeatureActive(fiesta, 'muro_social');

  const miMesaActivo =
    fiesta.modulosContratados?.disenoSalon !== false &&
    fiesta.modulosContratados?.invitados !== false &&
    fiesta.guestPortalSettings?.showMesaAsignada !== false;

  const menuDigitalActivo = hasDigitalMenuConfigured(fiesta);

  const albumActivo =
    fiesta.modulosContratados?.muroSocial !== false ||
    fiesta.modulosContratados?.fotografia !== false ||
    Boolean(fiesta.galeriaUrl);

  const recapActivo =
    fiesta.zonaDigitalAdolescentes?.recapEnabled !== false &&
    isZonaFeatureActive(fiesta, 'recap');

  return {
    muroSocialActivo: muroContratado && muroPrendido && zonaMuroActiva,
    miMesaActivo,
    menuDigitalActivo,
    menuDigitalUrl: `/evento/hub/${id}#menu-noche-title`,
    albumActivo,
    albumUrl: fiesta.galeriaUrl || `/evento/album/${id}`,
    recapActivo,
    recapUrl: `/invitacion/${id}/recap`,
  };
}
