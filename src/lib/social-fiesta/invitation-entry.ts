import type { FiestaSocialConfig, FiestaSocialRole } from './social-fiesta-base';

export type FiestaSocialEntryPoint =
  | 'invitacion_digital'
  | 'portal_cliente'
  | 'qr_mesa'
  | 'qr_pantalla'
  | 'link_whatsapp';

export type FiestaSocialInvitationAccess = {
  fiestaId: string;
  guestId?: string;
  role: FiestaSocialRole;
  entryPoint: FiestaSocialEntryPoint;
  href: string;
  label: string;
  description: string;
  requiresRsvp: boolean;
  canPublish: boolean;
  canUploadMedia: boolean;
  canComment: boolean;
  canVote: boolean;
};

export type FiestaSocialInvitationCta = {
  title: string;
  subtitle: string;
  buttonLabel: string;
  href: string;
  helperText: string;
  badge?: string;
};

function buildQuery(params: Record<string, string | undefined>): string {
  const query = Object.entries(params)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value ?? '')}`)
    .join('&');
  return query ? `?${query}` : '';
}

export function buildFiestaSocialHref(input: {
  fiestaId: string;
  guestId?: string;
  accessKey?: string;
  entryPoint: FiestaSocialEntryPoint;
}): string {
  return `/fiestas/social/${encodeURIComponent(input.fiestaId)}${buildQuery({
    guestId: input.guestId,
    accessKey: input.accessKey,
    from: input.entryPoint,
  })}`;
}

export function buildFiestaSocialInvitationAccess(input: {
  config: FiestaSocialConfig;
  guestId?: string;
  accessKey?: string;
  role?: FiestaSocialRole;
  entryPoint?: FiestaSocialEntryPoint;
}): FiestaSocialInvitationAccess {
  const role = input.role ?? 'invitado';
  const entryPoint = input.entryPoint ?? 'invitacion_digital';
  const enabled = input.config.enabled && input.config.features.invitacionConectada;
  return {
    fiestaId: input.config.fiestaId,
    guestId: input.guestId,
    role,
    entryPoint,
    href: buildFiestaSocialHref({
      fiestaId: input.config.fiestaId,
      guestId: input.guestId,
      accessKey: input.accessKey,
      entryPoint,
    }),
    label: enabled ? 'Entrar a la red social de la fiesta' : 'Red social no activa',
    description: enabled
      ? 'Confirmá, comentá, mirá avisos y participá de la previa de la fiesta.'
      : 'La red social de la fiesta todavía no está activa para invitados.',
    requiresRsvp: true,
    canPublish: enabled && role !== 'fotografo',
    canUploadMedia: enabled && input.config.features.fotos,
    canComment: enabled,
    canVote: enabled && input.config.features.juegos,
  };
}

export function buildInvitationSocialCta(access: FiestaSocialInvitationAccess): FiestaSocialInvitationCta {
  if (!access.canComment) {
    return {
      title: 'Red social de la fiesta',
      subtitle: 'Este espacio se activará cuando el organizador lo habilite.',
      buttonLabel: 'Todavía no disponible',
      href: '#',
      helperText: 'AK Producciones prepara este espacio para conectar invitación, previa y muro en vivo.',
      badge: 'Próximamente',
    };
  }

  return {
    title: 'La fiesta ya empezó en la previa',
    subtitle: 'Entrá al espacio privado del evento: comentá, reaccioná, respondé encuestas y participá de los juegos.',
    buttonLabel: access.label,
    href: access.href,
    helperText: 'Una experiencia digital creada por AK Producciones para vivir la fiesta antes, durante y después.',
    badge: 'Red privada del evento',
  };
}

export function buildInvitationSoftSellingText(input: {
  eventName?: string;
  companyName?: string;
}): string {
  const eventName = input.eventName || 'esta fiesta';
  const company = input.companyName || 'AK Producciones';
  return `${eventName} tiene su propia red social privada. ${company} conecta invitación, invitados, juegos, muro en vivo y recuerdos en un solo lugar.`;
}
