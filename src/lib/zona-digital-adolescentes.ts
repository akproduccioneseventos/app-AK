import type {
  FiestaEnPlanificacion,
  ModulosContratados,
  ZonaDigitalAdolescentesSettings,
  ZonaDigitalChallenge,
  ZonaDigitalEmojiReaction,
  ZonaDigitalFeatureId,
  ZonaDigitalFeatureToggle,
  ZonaDigitalGame,
  ZonaDigitalSocialNetwork,
} from '@/types/fiesta';

const feature = (
  id: ZonaDigitalFeatureId,
  label: string,
  description: string,
  options: Partial<ZonaDigitalFeatureToggle> = {}
): ZonaDigitalFeatureToggle => ({
  id,
  label,
  description,
  enabled: true,
  visibleForGuests: true,
  ...options,
});

export const defaultZonaDigitalFeatures: ZonaDigitalFeatureToggle[] = [
  feature('muro_social', 'Muro social', 'Suben fotos, videos, comentarios y aparecen en pantalla.', { linkedModuleId: 'muroSocial' }),
  feature('retos', 'Retos de la fiesta', 'Misiones rapidas para sacar fotos, grabar clips y sumar puntos.'),
  feature('juegos', 'Juegos en vivo', 'Trivia, votaciones, emoji battle y baile con ranking.'),
  feature('fotocabina', 'Fotocabina', 'Plantillas, marcos, stickers y descarga con marca del evento.', { linkedModuleId: 'entretenimiento', requiresHardware: true }),
  feature('plataforma360', 'Plataforma 360', 'Clips verticales con intro, musica, efecto y salida social.', { linkedModuleId: 'entretenimiento', requiresHardware: true }),
  feature('bogue', 'Bogue / Boomerang', 'Loops cortos tipo social, pensados para compartir rapido.', { linkedModuleId: 'entretenimiento', requiresHardware: true }),
  feature('espejo_magico', 'Espejo magico', 'Pantalla tactil con firma, dibujo, props y salida premium.', { linkedModuleId: 'entretenimiento', requiresHardware: true }),
  feature('barra', 'Barra interactiva', 'Eligen tragos, ven ingredientes, video y pasan a pantalla del barman.', { linkedModuleId: 'barraTecnologica' }),
  feature('totems', 'Totems sincronizados', 'Pantallas con QR, fotos, retos y fondos animados.', { linkedModuleId: 'pantallasTotem', requiresHardware: true }),
  feature('audioritmico', 'Modo baile audiorritmico', 'Visuales de discoteca con fotos, QR y movimiento.', { linkedModuleId: 'muroSocial' }),
  feature('ranking', 'Ranking por puntos', 'Leaderboard por invitado, mesa o grupo.'),
  feature('recap', 'Resumen final', 'Cierre con mejores fotos, retos y momentos compartibles.'),
];

export const defaultZonaDigitalChallenges: ZonaDigitalChallenge[] = [
  { id: 'selfie_protagonista', title: 'Selfie con la protagonista', description: 'Subi una foto con la cumpleanera, novios o protagonista.', emoji: '🤳', points: 120, enabled: true, featured: true },
  { id: 'mesa_mas_divertida', title: 'Mesa mas divertida', description: 'Foto grupal de tu mesa con la mejor pose.', emoji: '🎉', points: 90, enabled: true, featured: true },
  { id: 'look_party', title: 'Look de fiesta', description: 'Mostra tu outfit con el marco oficial del evento.', emoji: '✨', points: 70, enabled: true },
  { id: 'paso_baile', title: 'Paso de baile', description: 'Graba un mini clip bailando y sumalo al muro.', emoji: '🕺', points: 110, enabled: true },
  { id: 'barra_favorito', title: 'Trago favorito', description: 'Elegi tu trago o mocktail favorito en la barra digital.', emoji: '🍹', points: 60, enabled: true },
  { id: 'mensaje_lindo', title: 'Mensaje lindo', description: 'Deja una dedicatoria corta para pantalla.', emoji: '💬', points: 50, enabled: true },
  { id: 'foto_360', title: 'Momento 360', description: 'Subi tu mejor clip de plataforma 360.', emoji: '🎥', points: 150, enabled: true },
  { id: 'emoji_mood', title: 'Emoji mood', description: 'Vota el emoji que mejor representa la fiesta.', emoji: '🔥', points: 30, enabled: true },
];

export const defaultZonaDigitalGames: ZonaDigitalGame[] = [
  { id: 'emoji_battle', type: 'emoji_battle', title: 'Emoji Battle', prompt: 'Que emoji gana este momento?', emoji: '🔥', enabled: true, screenMode: 'ambos', points: 30, options: ['🔥', '💎', '😂', '❤️'] },
  { id: 'trivia_protagonista', type: 'trivia', title: 'Trivia de la fiesta', prompt: 'Quien conoce mas a la protagonista?', emoji: '🧠', enabled: true, screenMode: 'pantalla', points: 80, options: ['Opcion A', 'Opcion B', 'Opcion C'] },
  { id: 'votacion_tema', type: 'votacion', title: 'Votacion de tema', prompt: 'Que tema tiene que sonar despues?', emoji: '🎧', enabled: true, screenMode: 'ambos', points: 40, options: ['Reggaeton', 'Cumbia', 'Pop', 'Electronica'] },
  { id: 'busqueda_foto', type: 'busqueda', title: 'Busqueda fotografica', prompt: 'Encontra una foto con algo rojo, una risa y una pose rara.', emoji: '🔎', enabled: true, screenMode: 'mobile', points: 120 },
  { id: 'duelo_baile', type: 'baile', title: 'Duelo de baile', prompt: 'Dos mesas, una cancion, gana la mas votada.', emoji: '🪩', enabled: true, screenMode: 'pantalla', points: 150 },
  { id: 'dedicatoria_flash', type: 'dedicatoria', title: 'Dedicatoria flash', prompt: 'Escribi un mensaje corto para que salga en pantalla.', emoji: '💌', enabled: true, screenMode: 'mobile', points: 40 },
];

export const defaultZonaDigitalSocialNetworks: ZonaDigitalSocialNetwork[] = [
  { id: 'instagram', label: 'Instagram', handle: '@akproduccionesfiestasyeventos', url: 'https://www.instagram.com/akproduccionesfiestasyeventos/', enabled: true, requireBeforeDownload: true },
  { id: 'tiktok', label: 'TikTok', handle: '@akproduccioneseve', url: 'https://www.tiktok.com/@akproduccioneseve', enabled: true, requireBeforeDownload: false },
  { id: 'facebook', label: 'Facebook', handle: 'AK Producciones Eventos', url: 'https://www.facebook.com/akproduccionessalto/', enabled: false },
  { id: 'whatsapp', label: 'WhatsApp', handle: 'AK Producciones', url: 'https://wa.me/59898355530', enabled: true },
];

export const defaultZonaDigitalAdolescentesSettings: ZonaDigitalAdolescentesSettings = {
  enabled: true,
  title: 'Zona Digital AK',
  subtitle: 'Retos, fotos, juegos, pantallas y momentos para compartir.',
  accessMode: 'qr_abierto',
  primaryColor: '#111827',
  accentColor: '#dc2626',
  backgroundStyle: 'glass_party',
  hashtag: '#AKProducciones',
  moderationRequired: true,
  showLeaderboard: true,
  showPoints: true,
  showEmojiBar: true,
  showSocialFollowGate: true,
  allowNicknames: true,
  allowAvatarUpload: true,
  allowComments: true,
  allowDedications: true,
  allowSongVotes: true,
  autoRotateOnScreens: true,
  syncWithMuroSocial: true,
  syncWithTotems: true,
  syncWithBarra: true,
  syncWithEntretenimiento: true,
  recapEnabled: true,
  features: defaultZonaDigitalFeatures,
  challenges: defaultZonaDigitalChallenges,
  games: defaultZonaDigitalGames,
  socialNetworks: defaultZonaDigitalSocialNetworks,
  emojiReactions: [
    { emoji: '🔥', label: 'Fuego', enabled: true },
    { emoji: '❤️', label: 'Me encanta', enabled: true },
    { emoji: '😂', label: 'Risa', enabled: true },
    { emoji: '💎', label: 'Premium', enabled: true },
    { emoji: '🪩', label: 'Baile', enabled: true },
    { emoji: '👏', label: 'Aplauso', enabled: true },
  ],
  safetyRules: [
    'Todo contenido puede ser moderado por AK antes de aparecer en pantalla.',
    'No se muestran datos privados: solo apodo, foto o mensaje autorizado.',
    'Los retos se pueden pausar en cualquier momento desde el panel interno.',
    'Si una estacion no esta contratada, se apaga y desaparece del celular del invitado.',
  ],
};

function mergeById<T extends { id: string }>(defaults: T[], current?: T[]): T[] {
  const currentMap = new Map((current ?? []).map(item => [item.id, item]));
  const merged = defaults.map(item => ({ ...item, ...(currentMap.get(item.id) ?? {}) }));
  const extra = (current ?? []).filter(item => !defaults.some(def => def.id === item.id));
  return [...merged, ...extra];
}

function mergeEmojiReactions(
  defaults: ZonaDigitalEmojiReaction[],
  current?: ZonaDigitalEmojiReaction[]
): ZonaDigitalEmojiReaction[] {
  const currentMap = new Map((current ?? []).map(item => [item.emoji, item]));
  const merged = defaults.map(item => ({ ...item, ...(currentMap.get(item.emoji) ?? {}) }));
  const extra = (current ?? []).filter(item => !defaults.some(def => def.emoji === item.emoji));
  return [...merged, ...extra];
}

export function withZonaDigitalDefaults(
  settings?: Partial<ZonaDigitalAdolescentesSettings>
): ZonaDigitalAdolescentesSettings {
  return {
    ...defaultZonaDigitalAdolescentesSettings,
    ...(settings ?? {}),
    features: mergeById(defaultZonaDigitalFeatures, settings?.features),
    challenges: mergeById(defaultZonaDigitalChallenges, settings?.challenges),
    games: mergeById(defaultZonaDigitalGames, settings?.games),
    socialNetworks: mergeById(defaultZonaDigitalSocialNetworks, settings?.socialNetworks),
    emojiReactions: mergeEmojiReactions(defaultZonaDigitalAdolescentesSettings.emojiReactions, settings?.emojiReactions),
    safetyRules: settings?.safetyRules?.length ? settings.safetyRules : defaultZonaDigitalAdolescentesSettings.safetyRules,
  };
}

export function getVisibleZonaDigitalFeatures(
  settings: ZonaDigitalAdolescentesSettings,
  modulos?: ModulosContratados
) {
  return settings.features.filter(featureItem => {
    if (!settings.enabled || !featureItem.enabled || !featureItem.visibleForGuests) return false;
    if (!featureItem.linkedModuleId) return true;
    return modulos?.[featureItem.linkedModuleId] !== false;
  });
}

export function buildZonaDigitalPublicUrl(fiestaId: string) {
  return `/evento/zona-digital/${encodeURIComponent(fiestaId)}`;
}

export function buildZonaDigitalScore(fiesta: FiestaEnPlanificacion) {
  const settings = withZonaDigitalDefaults(fiesta.zonaDigitalAdolescentes);
  const visibleFeatures = getVisibleZonaDigitalFeatures(settings, fiesta.modulosContratados);
  const activeChallenges = settings.challenges.filter(item => item.enabled);
  const activeGames = settings.games.filter(item => item.enabled);
  const activeSocialNetworks = settings.socialNetworks.filter(item => item.enabled);
  const activeEmojis = settings.emojiReactions.filter(item => item.enabled);
  const score = Math.min(
    100,
    Math.round(
      (settings.enabled ? 20 : 0) +
      Math.min(25, visibleFeatures.length * 3) +
      Math.min(20, activeChallenges.length * 3) +
      Math.min(15, activeGames.length * 3) +
      Math.min(10, activeSocialNetworks.length * 4) +
      Math.min(10, activeEmojis.length * 2)
    )
  );

  return {
    score,
    visibleFeatures,
    activeChallenges,
    activeGames,
    activeSocialNetworks,
    activeEmojis,
    missing: [
      !settings.enabled ? 'Activar la zona digital' : '',
      visibleFeatures.length < 5 ? 'Activar mas experiencias visibles' : '',
      activeChallenges.length < 4 ? 'Dejar al menos 4 retos activos' : '',
      activeGames.length < 3 ? 'Dejar al menos 3 juegos activos' : '',
      activeSocialNetworks.length < 2 ? 'Configurar redes sociales' : '',
    ].filter(Boolean),
  };
}
