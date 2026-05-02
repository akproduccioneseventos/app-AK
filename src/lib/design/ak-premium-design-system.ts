export type AkPremiumSurface = 'public' | 'client' | 'guest' | 'operator' | 'internal' | 'liveWall';

export type AkPremiumTone = 'neutral' | 'celebration' | 'luxury' | 'romantic' | 'neon' | 'success' | 'warning' | 'danger';

export type AkPremiumSection = {
  id: string;
  title: string;
  description: string;
  priority: number;
  surface: AkPremiumSurface;
};

export type AkPremiumTheme = {
  surface: AkPremiumSurface;
  tone: AkPremiumTone;
  primary: string;
  accent: string;
  background: string;
  foreground: string;
  card: string;
  muted: string;
  ring: string;
  heroGradient: string;
  className: string;
};

export type AkPremiumClassSet = {
  page: string;
  shell: string;
  hero: string;
  card: string;
  cardInteractive: string;
  section: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  buttonPrimary: string;
  buttonSecondary: string;
  badge: string;
  stat: string;
};

export const AK_PREMIUM_THEMES: Record<AkPremiumTone, Omit<AkPremiumTheme, 'surface' | 'tone' | 'className'>> = {
  neutral: {
    primary: '#4f46e5', accent: '#f59e0b', background: '#f8fafc', foreground: '#0f172a', card: '#ffffff', muted: '#64748b', ring: '#818cf8',
    heroGradient: 'linear-gradient(135deg, #111827 0%, #4f46e5 52%, #7c3aed 100%)',
  },
  celebration: {
    primary: '#7c3aed', accent: '#f59e0b', background: '#faf7ff', foreground: '#1e1b4b', card: '#ffffff', muted: '#6b7280', ring: '#a78bfa',
    heroGradient: 'linear-gradient(135deg, #1e1b4b 0%, #7c3aed 50%, #f59e0b 100%)',
  },
  luxury: {
    primary: '#111827', accent: '#d4af37', background: '#f8f5ef', foreground: '#111827', card: '#fffdf7', muted: '#6b6256', ring: '#d4af37',
    heroGradient: 'linear-gradient(135deg, #030712 0%, #111827 55%, #d4af37 100%)',
  },
  romantic: {
    primary: '#be185d', accent: '#fb7185', background: '#fff1f2', foreground: '#3f0f1f', card: '#fff7fb', muted: '#7f1d1d', ring: '#f9a8d4',
    heroGradient: 'linear-gradient(135deg, #831843 0%, #be185d 55%, #fb7185 100%)',
  },
  neon: {
    primary: '#0f172a', accent: '#22d3ee', background: '#020617', foreground: '#f8fafc', card: '#0f172a', muted: '#94a3b8', ring: '#22d3ee',
    heroGradient: 'linear-gradient(135deg, #020617 0%, #7c3aed 48%, #22d3ee 100%)',
  },
  success: {
    primary: '#047857', accent: '#34d399', background: '#ecfdf5', foreground: '#064e3b', card: '#ffffff', muted: '#047857', ring: '#6ee7b7',
    heroGradient: 'linear-gradient(135deg, #064e3b 0%, #047857 55%, #34d399 100%)',
  },
  warning: {
    primary: '#b45309', accent: '#f59e0b', background: '#fffbeb', foreground: '#451a03', card: '#ffffff', muted: '#92400e', ring: '#fbbf24',
    heroGradient: 'linear-gradient(135deg, #451a03 0%, #b45309 55%, #f59e0b 100%)',
  },
  danger: {
    primary: '#be123c', accent: '#fb7185', background: '#fff1f2', foreground: '#4c0519', card: '#ffffff', muted: '#9f1239', ring: '#fda4af',
    heroGradient: 'linear-gradient(135deg, #4c0519 0%, #be123c 55%, #fb7185 100%)',
  },
};

export const AK_PREMIUM_CLASS_SET: AkPremiumClassSet = {
  page: 'ak-premium-page',
  shell: 'ak-premium-shell',
  hero: 'ak-premium-hero',
  card: 'ak-premium-card',
  cardInteractive: 'ak-premium-card ak-premium-card-interactive',
  section: 'ak-premium-section',
  eyebrow: 'ak-premium-eyebrow',
  title: 'ak-premium-title',
  subtitle: 'ak-premium-subtitle',
  buttonPrimary: 'ak-premium-button-primary',
  buttonSecondary: 'ak-premium-button-secondary',
  badge: 'ak-premium-badge',
  stat: 'ak-premium-stat',
};

export const AK_PREMIUM_SURFACE_SECTIONS: Record<AkPremiumSurface, AkPremiumSection[]> = {
  public: [
    { id: 'hero', title: 'Portada emocional', description: 'Foto o video, nombre del evento, fecha y CTA principal.', priority: 1, surface: 'public' },
    { id: 'rsvp', title: 'Confirmación clara', description: 'Confirmar asistencia sin fricción y sin acompañantes libres.', priority: 2, surface: 'public' },
    { id: 'social', title: 'Red social de la fiesta', description: 'Entrada a juegos, muro, mensajes y experiencia AK.', priority: 3, surface: 'public' },
  ],
  client: [
    { id: 'vip-hero', title: 'Portal VIP', description: 'Portada personalizada con color, foto y próximo paso.', priority: 1, surface: 'client' },
    { id: 'finance', title: 'Pagos y contrato', description: 'Estado financiero visual, documentos y plan de pagos.', priority: 2, surface: 'client' },
    { id: 'organization', title: 'Organización', description: 'Tareas, reuniones, música, fotos, decoración y cronograma.', priority: 3, surface: 'client' },
  ],
  guest: [
    { id: 'confirm', title: 'Confirmar', description: 'Acción rápida principal para el invitado.', priority: 1, surface: 'guest' },
    { id: 'event-info', title: 'Datos del evento', description: 'Hora, ubicación, vestimenta y cuenta regalo.', priority: 2, surface: 'guest' },
    { id: 'participate', title: 'Participar', description: 'Muro, juegos, música y mensajes.', priority: 3, surface: 'guest' },
  ],
  operator: [
    { id: 'queue', title: 'Cola de revisión', description: 'Pendientes, aprobados y destacados.', priority: 1, surface: 'operator' },
    { id: 'screen', title: 'Pantalla gigante', description: 'Qué aparece y qué queda oculto.', priority: 2, surface: 'operator' },
    { id: 'warnings', title: 'Alertas', description: 'Riesgos visuales, contenido pendiente y acciones urgentes.', priority: 3, surface: 'operator' },
  ],
  internal: [
    { id: 'mission-control', title: 'Mission Control', description: 'Vista operativa diaria clara y accionable.', priority: 1, surface: 'internal' },
    { id: 'modules', title: 'Módulos ordenados', description: 'Menos ruido, más jerarquía y navegación clara.', priority: 2, surface: 'internal' },
    { id: 'alerts', title: 'Alertas inteligentes', description: 'Estados visuales para pagos, tareas, riesgos y pendientes.', priority: 3, surface: 'internal' },
  ],
  liveWall: [
    { id: 'stage', title: 'Pantalla de impacto', description: 'Mosaico, carrusel, ranking, sorteo y QR.', priority: 1, surface: 'liveWall' },
    { id: 'branding', title: 'Marca AK sutil', description: 'Vender sin vender dentro de la experiencia.', priority: 2, surface: 'liveWall' },
    { id: 'safe-content', title: 'Contenido seguro', description: 'Solo lo aprobado aparece en pantalla.', priority: 3, surface: 'liveWall' },
  ],
};

export function buildAkPremiumTheme(input: { surface: AkPremiumSurface; tone?: AkPremiumTone; primaryOverride?: string; accentOverride?: string }): AkPremiumTheme {
  const tone = input.tone ?? (input.surface === 'liveWall' ? 'neon' : input.surface === 'public' ? 'luxury' : 'celebration');
  const base = AK_PREMIUM_THEMES[tone];
  return { ...base, surface: input.surface, tone, primary: input.primaryOverride ?? base.primary, accent: input.accentOverride ?? base.accent, className: `ak-premium-theme ak-premium-theme-${tone} ak-premium-surface-${input.surface}` };
}

export function buildAkPremiumStyleVars(theme: AkPremiumTheme): Record<string, string> {
  return {
    '--ak-premium-primary': theme.primary,
    '--ak-premium-accent': theme.accent,
    '--ak-premium-background': theme.background,
    '--ak-premium-foreground': theme.foreground,
    '--ak-premium-card': theme.card,
    '--ak-premium-muted': theme.muted,
    '--ak-premium-ring': theme.ring,
    '--ak-premium-hero-gradient': theme.heroGradient,
  };
}

export function getAkPremiumSections(surface: AkPremiumSurface): AkPremiumSection[] {
  return [...AK_PREMIUM_SURFACE_SECTIONS[surface]].sort((a, b) => a.priority - b.priority);
}

export function getAkPremiumPrioritySummary(surface: AkPremiumSurface): string {
  return getAkPremiumSections(surface).map(section => `${section.priority}. ${section.title}`).join(' · ');
}

export function buildAkPremiumPageClass(surface: AkPremiumSurface, tone?: AkPremiumTone): string {
  const theme = buildAkPremiumTheme({ surface, tone });
  return `${AK_PREMIUM_CLASS_SET.page} ${theme.className}`;
}
