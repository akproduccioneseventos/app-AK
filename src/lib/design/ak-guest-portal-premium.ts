import {
  getAkPublicExperienceActions,
  getAkPublicExperienceSections,
  getAkPublicExperienceStyle,
} from './ak-public-experience-presets';

export type AkGuestPortalStatus = 'confirmado' | 'pendiente' | 'cancelado' | 'tal_vez';

export type AkGuestPortalPremiumInput = {
  eventName: string;
  guestName: string;
  eventDateLabel?: string;
  eventPlace?: string;
  tableLabel?: string;
  status: AkGuestPortalStatus;
  accentColor?: string;
  primaryColor?: string;
  hasQr: boolean;
  hasMap: boolean;
  hasSocialWall: boolean;
  hasMusic: boolean;
};

export type AkGuestPortalHeroModel = {
  label: string;
  title: string;
  subtitle: string;
  statusLabel: string;
  statusTone: 'success' | 'warning' | 'danger' | 'neutral';
  meta: string[];
  className: string;
  style: Record<string, string>;
};

export type AkGuestPortalQuickAction = {
  id: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
  primary: boolean;
};

export type AkGuestPortalPremiumModel = {
  hero: AkGuestPortalHeroModel;
  quickActions: AkGuestPortalQuickAction[];
  sections: { id: string; title: string; description: string; priority: number }[];
  emptyStateMessage?: string;
};

function buildStatus(input: AkGuestPortalStatus): { label: string; tone: AkGuestPortalHeroModel['statusTone'] } {
  if (input === 'confirmado') return { label: 'Asistencia confirmada', tone: 'success' };
  if (input === 'cancelado') return { label: 'Asistencia cancelada', tone: 'danger' };
  if (input === 'tal_vez') return { label: 'Respuesta: tal vez', tone: 'warning' };
  return { label: 'Confirmación pendiente', tone: 'warning' };
}

export function buildAkGuestPortalPremiumModel(input: AkGuestPortalPremiumInput): AkGuestPortalPremiumModel {
  const style = getAkPublicExperienceStyle('guestPortal', {
    primary: input.primaryColor,
    accent: input.accentColor,
  });
  const status = buildStatus(input.status);
  const meta = [input.eventDateLabel, input.eventPlace, input.tableLabel].filter(Boolean) as string[];
  const actions = getAkPublicExperienceActions('guestPortal').map(action => ({
    id: action.id,
    label: action.label,
    description: action.description,
    icon: action.icon,
    enabled:
      action.id === 'qr'
        ? input.hasQr
        : action.id === 'map'
          ? input.hasMap
          : action.id === 'wall'
            ? input.hasSocialWall
            : action.id === 'music'
              ? input.hasMusic
              : true,
    primary: action.priority === 1,
  }));

  return {
    hero: {
      label: 'Portal del Invitado',
      title: input.eventName,
      subtitle: `Hola ${input.guestName}, acá tenés todo lo importante para disfrutar la fiesta sin perderte nada.`,
      statusLabel: status.label,
      statusTone: status.tone,
      meta,
      className: `ak-premium-page ${style.className}`,
      style: style.style,
    },
    quickActions: actions,
    sections: getAkPublicExperienceSections('guestPortal').map(section => ({
      id: section.id,
      title: section.title,
      description: section.description,
      priority: section.priority,
    })),
    emptyStateMessage: actions.every(action => !action.enabled)
      ? 'El organizador todavía no activó las herramientas interactivas para este evento.'
      : undefined,
  };
}

export function buildGuestPortalPremiumChecklist(): string[] {
  return [
    'Portada fuerte con foto/video del evento y color personalizado.',
    'QR como acción principal solo cuando la asistencia esté confirmada.',
    'Ubicación, mesa y hora visibles sin abrir menús largos.',
    'Muro social, música y juegos como botones grandes para celular.',
    'Marca AK sutil al final: experiencia, organización y tecnología.',
  ];
}
