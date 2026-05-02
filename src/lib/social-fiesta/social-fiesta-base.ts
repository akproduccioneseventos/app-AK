export type FiestaSocialStage = 'previa' | 'en_vivo' | 'post_evento';

export type FiestaSocialRole = 'organizador' | 'cliente' | 'invitado' | 'dj' | 'fotografo';

export type FiestaSocialPrivacyMode = 'privada' | 'solo_invitados' | 'publica_con_link';

export type FiestaSocialModerationMode = 'seguro' | 'automatico' | 'privado';

export type FiestaSocialFeatureFlags = {
  feedPrevia: boolean;
  invitacionConectada: boolean;
  muroEnVivo: boolean;
  fotos: boolean;
  videosCortos: boolean;
  mensajes: boolean;
  audiosPrivados: boolean;
  juegos: boolean;
  sorteos: boolean;
  pedidosMusica: boolean;
  albumFinalWfolio: boolean;
};

export type FiestaSocialTheme = {
  nombreEvento?: string;
  protagonistaNombre?: string;
  portadaUrl?: string;
  colorPrincipal: string;
  colorSecundario: string;
  colorAcento: string;
  logoUrl?: string;
  hashtag?: string;
};

export type FiestaSocialConfig = {
  enabled: boolean;
  fiestaId: string;
  stage: FiestaSocialStage;
  privacyMode: FiestaSocialPrivacyMode;
  moderationMode: FiestaSocialModerationMode;
  theme: FiestaSocialTheme;
  features: FiestaSocialFeatureFlags;
  createdAt: string;
  updatedAt: string;
};

export const DEFAULT_FIESTA_SOCIAL_FEATURES: FiestaSocialFeatureFlags = {
  feedPrevia: true,
  invitacionConectada: true,
  muroEnVivo: true,
  fotos: true,
  videosCortos: true,
  mensajes: true,
  audiosPrivados: true,
  juegos: true,
  sorteos: true,
  pedidosMusica: true,
  albumFinalWfolio: true,
};

export function createDefaultFiestaSocialConfig(input: {
  fiestaId: string;
  nombreEvento?: string;
  protagonistaNombre?: string;
  portadaUrl?: string;
  colorPrincipal?: string;
  colorSecundario?: string;
  colorAcento?: string;
  logoUrl?: string;
  hashtag?: string;
  now?: string;
}): FiestaSocialConfig {
  const now = input.now ?? new Date().toISOString();
  return {
    enabled: true,
    fiestaId: input.fiestaId,
    stage: 'previa',
    privacyMode: 'solo_invitados',
    moderationMode: 'seguro',
    theme: {
      nombreEvento: input.nombreEvento,
      protagonistaNombre: input.protagonistaNombre,
      portadaUrl: input.portadaUrl,
      colorPrincipal: input.colorPrincipal ?? '#7c3aed',
      colorSecundario: input.colorSecundario ?? '#111827',
      colorAcento: input.colorAcento ?? '#f59e0b',
      logoUrl: input.logoUrl,
      hashtag: input.hashtag,
    },
    features: DEFAULT_FIESTA_SOCIAL_FEATURES,
    createdAt: now,
    updatedAt: now,
  };
}

export function getFiestaSocialStageLabel(stage: FiestaSocialStage): string {
  const labels: Record<FiestaSocialStage, string> = {
    previa: 'Previa de la fiesta',
    en_vivo: 'Fiesta en vivo',
    post_evento: 'Recuerdos y album final',
  };
  return labels[stage];
}

export function canRolePublish(role: FiestaSocialRole, stage: FiestaSocialStage): boolean {
  if (role === 'organizador' || role === 'cliente') return true;
  if (role === 'invitado') return stage !== 'post_evento';
  if (role === 'dj') return stage === 'en_vivo';
  return false;
}
