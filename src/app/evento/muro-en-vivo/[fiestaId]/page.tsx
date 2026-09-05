'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { soloAprobados, esAprobadoParaMostrar } from '@/lib/social-fiesta/visibilidad';
import { useParams } from 'next/navigation';
import { getPublicSocialEvent, getPublicSocialPosts, getChatMessages, getPublicInstagramFeedAction as getPublicInstagramFeed } from '@/app/actions/social-gallery';
import type { SocialGalleryPost, Dedication, SocialComment, ChatMessage } from '@/types/social-gallery';
import { motion, AnimatePresence } from 'framer-motion';
import NextImage from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { getActivePoll, getDedications } from '@/app/actions/social-interactive';
import { getCompanyInfoPublica, getInvoiceTemplateSettings } from '@/app/actions/settings';
import { getSocialConnectionsPublicas } from '@/app/actions/social-connections';
import type { ActiveGameData, AudioRhythmSettings, ScreenPlaylistItem, ScreenPlaylistItemType, SocialGallerySettings, SocialGalleryBrand } from '@/types/fiesta';
import { DEFAULT_MARKETING_TICKER_TEXT } from '@/lib/social-wall-defaults';
import {
  waitForInitialPublicLoad,
  withPublicRequestTimeout,
} from '@/lib/public-experience/wait-for-initial-public-load';
import type { SocialConnection } from '@/types/settings';
import { Facebook, Instagram, MessageCircle, Music2, Maximize, Camera, QrCode } from 'lucide-react';
import { ReconnectingIndicator } from '@/components/entretenimiento/ReconnectingIndicator';
import { getSongRequests } from '@/app/actions/social-interactive';
import type { SongRequest } from '@/types/social-gallery';

const REFRESH_INTERVAL_MS = 2000;
const MOMENT_DISPLAY_DURATION_MS = 15000;
const SORTEO_DISPLAY_DURATION_MS = 20000;
/** Window in which a sorteo spin animation is shown on the big screen (before the winner is revealed) */
const SORTEO_SPIN_DISPLAY_DURATION_MS = 7000;
const MARQUEE_REPEAT_COUNT = 3;
const LED_MARQUEE_ANIMATION_CLASS = 'animate-[marquee_22s_linear_infinite] motion-reduce:animate-none';
const MARKETING_MARQUEE_ANIMATION_CLASS = 'animate-[marquee_28s_linear_infinite] motion-reduce:animate-none';
const GAME_OVERLAY_CLASS =
  'w-full flex flex-col items-center justify-center gap-5';
const SORTEO_WHEEL_GRADIENT =
  'conic-gradient(#f43f5e 0deg, #f43f5e 30deg, #f97316 30deg, #f97316 60deg, #eab308 60deg, #eab308 90deg, #22c55e 90deg, #22c55e 120deg, #06b6d4 120deg, #06b6d4 150deg, #6366f1 150deg, #6366f1 180deg, #ec4899 180deg, #ec4899 210deg, #f43f5e 210deg, #f43f5e 240deg, #f97316 240deg, #f97316 270deg, #eab308 270deg, #eab308 300deg, #22c55e 300deg, #22c55e 330deg, #06b6d4 330deg, #06b6d4 360deg)';

type MomentData = { id: string; nombre: string; emoji: string; timestamp: string };
type PollData = { id: string; question: string; options: { id: string; text: string; votes: number }[] };

function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

function isPostApprovedForScreen(post: SocialGalleryPost) {
  return esAprobadoParaMostrar(post);
}


const FONDOS_MURO: Record<string, { id: string; nombre: string; estilo: string; cssBackground: string }> = {
  predeterminado: {
    id: 'predeterminado',
    nombre: 'Degradado Dinámico',
    estilo: 'degradado',
    cssBackground: 'linear-gradient(135deg, #020617, #0f172a 52%, #020617)',
  },
  'estrellas-vip': {
    id: 'estrellas-vip',
    nombre: 'Noche Estelar VIP',
    estilo: 'estrellas',
    cssBackground: 'radial-gradient(circle at 50% 50%, #1e1b4b 0%, #09090b 100%)',
  },
  'dorado-glamour': {
    id: 'dorado-glamour',
    nombre: 'Oro Glamour',
    estilo: 'dorado',
    cssBackground: 'radial-gradient(ellipse at bottom, #451a03 0%, #0c0a09 100%)',
  },
  'ondas-neon': {
    id: 'ondas-neon',
    nombre: 'Neón Fiesta',
    estilo: 'neon',
    cssBackground: 'linear-gradient(125deg, #2e026d 0%, #030712 60%, #172554 100%)',
  },
  'vintage-boda': {
    id: 'vintage-boda',
    nombre: 'Romántico Elegante',
    estilo: 'vintage',
    cssBackground: 'radial-gradient(circle at 20% 80%, #3f182c 0%, #09090b 80%)',
  },
  'dark-techno': {
    id: 'dark-techno',
    nombre: 'Black Minimal',
    estilo: 'minimal',
    cssBackground: '#02040a',
  },
};

export default function MuroEnVivoPage() {
  const params = useParams();
  const fiestaId = params.fiestaId as string;

  const [posts, setPosts] = useState<SocialGalleryPost[]>([]);
  const [eventName, setEventName] = useState<string>('');
  const [fondoMuro, setFondoMuro] = useState<string>('predeterminado');
  const [staticBranding, setStaticBranding] = useState<{
    companyInfo: any;
    templateSettings: any;
    connections: any[];
  } | null>(null);

  useEffect(() => {
    async function loadStaticBranding() {
      try {
        const [info, template, conns] = await Promise.all([
          getCompanyInfoPublica(),
          getInvoiceTemplateSettings(),
          getSocialConnectionsPublicas(),
        ]);
        setStaticBranding({
          companyInfo: info,
          templateSettings: template,
          connections: conns || [],
        });
      } catch (err) {
        console.error('Failed to load static branding:', err);
      }
    }
    loadStaticBranding();
  }, []);
  const [settings, setSettings] = useState<SocialGallerySettings>({
    enabled: true,
    allowLikes: true,
    allowComments: true,
    uploadsActive: true,
    showPolls: true,
    marketingTickerText: '',
    ledMarqueeText: '',
  });
  const [companyMarketingText, setCompanyMarketingText] = useState<string>(DEFAULT_MARKETING_TICKER_TEXT);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('AK Producciones');
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [activeMoment, setActiveMoment] = useState<MomentData | null>(null);
  const [activePoll, setActivePoll] = useState<PollData | null>(null);
  const [activeGame, setActiveGame] = useState<ActiveGameData | null>(null);
  const [activeSorteoWinner, setActiveSorteoWinner] = useState<string | null>(null);
  const [sorteoSpinActive, setSorteoSpinActive] = useState(false);
  const [sorteoSpinWheelAngle, setSorteoSpinWheelAngle] = useState(0);
  const [highlightedDedications, setHighlightedDedications] = useState<Dedication[]>([]);
  const [highlightedComments, setHighlightedComments] = useState<{ postId: string; comment: SocialComment }[]>([]);
  const [recentChatMessages, setRecentChatMessages] = useState<ChatMessage[]>([]);
  const [recentSongRequests, setRecentSongRequests] = useState<SongRequest[]>([]);
  const [sorteoOnScreen, setSorteoOnScreen] = useState(false);
  const [eventPrograma, setEventPrograma] = useState<any[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);
  const [localPlaylistIndex, setLocalPlaylistIndex] = useState(0);
  const [playlistTick, setPlaylistTick] = useState<number>(Date.now());
  const [qrUrl, setQrUrl] = useState<string>('');
  const [showCameraFlash, setShowCameraFlash] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const prevPostsCountRef = useRef(0);
  const pollingRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setQrUrl(`${window.location.origin}/evento/social/${fiestaId}`);
    }
  }, [fiestaId]);

  useEffect(() => {
    if (isLoaded && posts.length > 0) {
      if (prevPostsCountRef.current > 0 && posts.length > prevPostsCountRef.current) {
        setShowCameraFlash(true);
        const timer = setTimeout(() => setShowCameraFlash(false), 500);
        prevPostsCountRef.current = posts.length;
        return () => clearTimeout(timer);
      }
      prevPostsCountRef.current = posts.length;
    }
  }, [posts.length, isLoaded]);

  const footerSocials = useMemo(() => {
    const brand = settings.brand;
    const list = [];

    // Instagram
    const ig = brand?.instagramHandle?.trim() || '@akproducciones';
    list.push({
      platform: 'Instagram',
      handle: ig,
      url: `https://instagram.com/${ig.replace('@', '')}`
    });

    // Facebook
    const fb = brand?.facebookHandle?.trim() || 'akproducciones';
    list.push({
      platform: 'Facebook',
      handle: fb,
      url: `https://facebook.com/${fb}`
    });

    // TikTok
    const tt = brand?.tiktokHandle?.trim() || '@akproducciones';
    list.push({
      platform: 'TikTok',
      handle: tt,
      url: `https://tiktok.com/${tt}`
    });

    // WhatsApp is shown only when there is a usable destination.
    const wa = brand?.whatsappNumber?.trim();
    const waDigits = wa?.replace(/\D/g, '');
    if (wa && waDigits) {
      list.push({
        platform: 'WhatsApp',
        handle: wa,
        url: `https://wa.me/${waDigits}`,
      });
    }

    return list;
  }, [settings.brand]);

  const postsRef = useRef<SocialGalleryPost[]>([]);
  // Track whether we already triggered the spin angle for the current sorteoSpinActive session
  const sorteoSpinTriggeredRef = useRef(false);
  // Track the spin timestamp we last processed to avoid re-triggering
  const lastSpinTsRef = useRef<string | null>(null);

  // When sorteoSpinActive becomes true, defer the angle change to after mount
  // so the CSS transition actually plays (element must exist at start angle first).
  useEffect(() => {
    if (sorteoSpinActive && !sorteoSpinTriggeredRef.current) {
      sorteoSpinTriggeredRef.current = true;
      // Double RAF ensures the wheel element is painted at rotate(0deg) before applying the
      // spin angle, allowing the CSS transition to trigger correctly.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSorteoSpinWheelAngle(prev => prev + 3600 + Math.floor(Math.random() * 1440));
        });
      });
    }
    if (!sorteoSpinActive) {
      sorteoSpinTriggeredRef.current = false;
    }
  }, [sorteoSpinActive]);

  const fetchData = useCallback(async (allowHidden = false) => {
    if (!fiestaId || pollingRef.current || (!allowHidden && document.visibilityState !== 'visible')) return;
    pollingRef.current = true;
    const requestTask = Promise.all([
      getPublicSocialPosts(fiestaId),
      getPublicSocialEvent(fiestaId),
      getActivePoll(fiestaId),
      getDedications(fiestaId),
      getChatMessages(fiestaId).catch((err) => { console.warn('[MuroEnVivo] getChatMessages failed:', err); return []; }),
      getSongRequests(fiestaId).catch((err) => { console.warn('[MuroEnVivo] getSongRequests failed:', err); return []; }),
    ]);

    // El timeout visual no cancela las Server Actions que ya salieron. La traba se
    // libera cuando la solicitud real termina para no saturar la pantalla ni Firebase.
    void requestTask.finally(() => {
      pollingRef.current = false;
    }).catch(() => undefined);

    try {
      const [fetchedPosts, fiestaData, pollData, dedicationsData, chatData, songData] = await withPublicRequestTimeout(requestTask);

      setIsReconnecting(false);

      const sorted = [...fetchedPosts].filter(isPostApprovedForScreen).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Update if post count or the latest post ID changes
      const latestId = sorted[0]?.id ?? '';
      const prevLatestId = postsRef.current[0]?.id ?? '';
      if (sorted.length !== postsRef.current.length || latestId !== prevLatestId) {
        postsRef.current = sorted;
        setPosts(sorted);
      }

      if (fiestaData) {
        if (!eventName) setEventName(fiestaData.configuracion?.nombreEvento || '');
        if (fiestaData.programa) setEventPrograma(fiestaData.programa);
        if (fiestaData.socialGallerySettings?.mobileControlCoverUrl) {
          setCoverImageUrl(fiestaData.socialGallerySettings.mobileControlCoverUrl);
        }
        const fMuro = (fiestaData as any)?.station?.fondoMuro || (fiestaData.socialGallerySettings as any)?.fondoMuro;
        if (fMuro) setFondoMuro(fMuro);
      }
      if (fiestaData?.socialGallerySettings) {
        setSettings((prev) => ({ ...prev, ...fiestaData.socialGallerySettings }));
        const latestMoment = [...(fiestaData.socialGallerySettings.momentosActivos ?? [])]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        const momentIsFresh =
          latestMoment && Date.now() - new Date(latestMoment.timestamp).getTime() < MOMENT_DISPLAY_DURATION_MS;
        setActiveMoment(momentIsFresh ? latestMoment : null);
        // Sync active game
        setActiveGame(fiestaData.socialGallerySettings.activeGame ?? null);

        // Sorteo static preview on screen (wheel shown before spinning)
        setSorteoOnScreen(fiestaData.socialGallerySettings.sorteoOnScreen === true);

        // Sorteo winner display (TTL: SORTEO_DISPLAY_DURATION_MS)
        const sorteoTs = fiestaData.socialGallerySettings.activeSorteoTimestamp;
        const sorteoWinner = fiestaData.socialGallerySettings.activeSorteoWinner;
        const sorteoIsFresh =
          sorteoTs && sorteoWinner &&
          Date.now() - new Date(sorteoTs).getTime() < SORTEO_DISPLAY_DURATION_MS;
        setActiveSorteoWinner(sorteoIsFresh ? sorteoWinner : null);

        // Sorteo spin animation — only trigger once per unique spin timestamp
        const spinTs = fiestaData.socialGallerySettings.sorteoSpinStartedAt;
        const spinIsFresh = spinTs && Date.now() - new Date(spinTs).getTime() < SORTEO_SPIN_DISPLAY_DURATION_MS;
        if (spinIsFresh && !sorteoIsFresh && spinTs !== lastSpinTsRef.current) {
          lastSpinTsRef.current = spinTs;
          // Reset wheel angle to 0 so the new spin starts fresh
          setSorteoSpinWheelAngle(0);
          setSorteoSpinActive(true);
          // Trigger spin rotation to a large random angle after a brief layout transition
          setTimeout(() => {
            const randomOffset = Math.floor(Math.random() * 360);
            setSorteoSpinWheelAngle(1800 + randomOffset); // 5 full spins + offset
          }, 50);
          setTimeout(() => setSorteoSpinActive(false), 6800);
        }
      }
      if (pollData) {
        setActivePoll({ id: pollData.id, question: pollData.question, options: pollData.options });
      } else {
        setActivePoll(null);
      }
      // Update recent chat messages: keep only the last 3 for display on screen
      if (chatData && chatData.length > 0) {
        const recent = [...chatData]
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .slice(-3);
        setRecentChatMessages(recent);
      } else {
        setRecentChatMessages([]);
      }
      // Show the 3 most recent song requests on screen
      if (songData && songData.length > 0) {
        const recentSongs = [...songData]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 3);
        setRecentSongRequests(recentSongs);
      } else {
        setRecentSongRequests([]);
      }
      setHighlightedDedications((dedicationsData ?? []).filter(d => d.highlighted));
      // Extract comments for the live wall: prefer operator-highlighted comments; fall back
      // to the 3 most recent comments across all posts so that comments are visible by default.
      const hComments: { postId: string; comment: SocialComment }[] = [];
      const allComments: { postId: string; comment: SocialComment }[] = [];
      for (const p of sorted) {
        for (const c of (p.comments ?? [])) {
          allComments.push({ postId: p.id, comment: c });
          if (c.highlighted) hComments.push({ postId: p.id, comment: c });
        }
      }
      if (hComments.length > 0) {
        setHighlightedComments(hComments);
      } else {
        // Show the most recent 3 comments when none are highlighted
        const recent = allComments.sort(
          (a, b) => new Date(b.comment.timestamp).getTime() - new Date(a.comment.timestamp).getTime()
        ).slice(0, 3);
        setHighlightedComments(recent);
      }

      const companyInfo = staticBranding?.companyInfo;
      const templateSettings = staticBranding?.templateSettings;
      const connections = staticBranding?.connections || [];

      setCompanyMarketingText(
        companyInfo?.companyName
          ? `Seguinos y etiquetanos · ${companyInfo.companyName}${companyInfo.companyContact ? ` · ${companyInfo.companyContact}` : ''}`
          : DEFAULT_MARKETING_TICKER_TEXT
      );
      // Use socialGallerySettings.brand as primary branding source, fall back to company settings
      const brand = fiestaData?.socialGallerySettings?.brand;
      setCompanyName(brand?.companyName || companyInfo?.companyName || 'AK Producciones');
      setCompanyLogoUrl(brand?.logoUrl || templateSettings?.logoUrl || null);
      // Build social connections: brand has priority; global connections are used only as fallback
      // for platforms not covered by brand.
      const brandConnections: SocialConnection[] = [];
      if (brand?.instagramHandle?.trim()) {
        brandConnections.push({
          platform: 'Instagram',
          isConnected: true,
          username: brand.instagramHandle,
          profileUrl: `https://instagram.com/${brand.instagramHandle.replace('@', '')}`,
        });
      }
      if (brand?.facebookHandle?.trim()) {
        brandConnections.push({
          platform: 'Facebook',
          isConnected: true,
          username: brand.facebookHandle,
          profileUrl: `https://facebook.com/${brand.facebookHandle}`,
        });
      }
      if (brand?.tiktokHandle?.trim()) {
        brandConnections.push({
          platform: 'TikTok',
          isConnected: true,
          username: brand.tiktokHandle,
        });
      }
      if (brand?.whatsappNumber?.trim()) {
        brandConnections.push({
          platform: 'WhatsApp',
          isConnected: true,
          phoneNumber: brand.whatsappNumber,
        });
      }
      // Add global connections only for platforms not already covered by brand
      const coveredPlatforms = new Set(brandConnections.map(c => c.platform));
      const globalFallbacks = connections.filter(c => c.isConnected && !coveredPlatforms.has(c.platform));
      setSocialConnections([...brandConnections, ...globalFallbacks]);
    } catch (_) {
      setIsReconnecting(true);
    } finally {
      if (!isLoaded) setIsLoaded(true);
    }
  }, [fiestaId, eventName, isLoaded, staticBranding]);

  // Initial load and polling
  useEffect(() => {
    // Enriquecer el muro con publicaciones públicas vía getPublicInstagramFeed
    getPublicInstagramFeed().catch(() => null);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void fetchData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    void waitForInitialPublicLoad(fetchData(true)).then(() => {
      setIsLoaded(true);
    });
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData]);

  // Playlist is only active when screenMode.enabled is explicitly true.
  // Using `!== false` is intentional: when enabled is undefined (legacy events that never set it),
  // we treat the playlist as active so existing behaviour is preserved (opt-out semantics).
  // New events can explicitly set enabled=false to disable the playlist.
  const enabledPlaylist = useMemo(() => {
    if (settings.screenMode?.enabled === false) return [];
    let list = (settings.screenMode?.playlist ?? []).filter((item) => {
      if (!item.enabled) return false;
      if (item.type === 'canciones' && settings.showSongRequests === false) return false;
      if (item.type === 'dedicaciones' && settings.showDedications === false) return false;
      if (item.type === 'chat' && settings.chatEnabled === false) return false;
      if (item.type === 'juego' && settings.showPolls === false) return false;
      if (item.type === 'cronograma' && (!eventPrograma || eventPrograma.length === 0)) return false;
      return true;
    });

    // Auto-include cronograma if event has programa and it is not in the playlist
    if (eventPrograma && eventPrograma.length > 0 && !list.some(i => i.type === 'cronograma')) {
      list = [...list, { id: 'auto_cronograma', type: 'cronograma' as ScreenPlaylistItemType, title: 'Qué viene ahora', durationSeconds: 15, enabled: true }];
    }

    return list;
  }, [
    settings.screenMode?.enabled,
    settings.screenMode?.playlist,
    settings.showSongRequests,
    settings.showDedications,
    settings.chatEnabled,
    settings.showPolls,
    eventPrograma,
  ]);
  // Remote forced item overrides the auto playlist rotation
  const activeScreenItem = useMemo<ScreenPlaylistItem | null>(() => {
    return settings.forcedScreenItem
      ? {
          id: 'forced_item',
          type: settings.forcedScreenItem as ScreenPlaylistItemType,
          title: 'Forced Item',
          durationSeconds: 15,
          enabled: true
        }
      : enabledPlaylist.length > 0
      ? enabledPlaylist[localPlaylistIndex % enabledPlaylist.length]
      : null;
  }, [settings.forcedScreenItem, enabledPlaylist, localPlaylistIndex]);

  useEffect(() => {
    if (typeof settings.screenMode?.currentItemIndex === 'number') {
      setLocalPlaylistIndex(settings.screenMode.currentItemIndex);
    }
  }, [settings.screenMode?.currentItemIndex]);

  useEffect(() => {
    if (!settings.screenMode?.isPlaying) return;
    if (settings.playlistPlaying === false) return; // Operator paused the playlist
    if (settings.forcedScreenItem) return; // Fixed screen mode, do not advance
    if (!activeScreenItem || enabledPlaylist.length === 0) return;
    const timeoutMs = Math.max(5, activeScreenItem.durationSeconds || 15) * 1000;
    const timeout = setTimeout(() => {
      setLocalPlaylistIndex((prev) => {
        const next = prev + 1;
        if (settings.screenMode?.loop === false) return Math.min(next, enabledPlaylist.length - 1);
        return next % enabledPlaylist.length;
      });
      setPlaylistTick(Date.now());
    }, timeoutMs);
    return () => clearTimeout(timeout);
  }, [activeScreenItem, enabledPlaylist.length, settings.screenMode?.isPlaying, settings.screenMode?.loop, playlistTick, settings.playlistPlaying, settings.forcedScreenItem]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'c') {
        setSettings((prev) => ({ ...prev, cinemaMode: !prev.cinemaMode }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Whether to show a right side panel (poll or game overlay)
  const hasSidePanel =
    settings.cinemaMode !== true &&
    ((activeGame !== null && activeScreenItem?.type !== 'juego') ||
    (activePoll !== null && settings.showPolls !== false && !activeGame));

  const fondoConfig = FONDOS_MURO[fondoMuro] || FONDOS_MURO.predeterminado;

  return (
    <div
      className="ak-live-stage fixed inset-0 flex select-none flex-col overflow-hidden text-white"
      data-fondo-muro={fondoMuro}
      style={{
        background: fondoConfig.cssBackground,
      }}
    >

      {/* Efecto destello cámara en pantalla completa al entrar foto nueva */}
      {showCameraFlash && <div className="ak-live-flash-overlay" />}

      {/* Orbes/partículas flotantes de luz 3D (fireflies) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      </div>

      {/* Header bar — in flow so it doesn't float over content (oculto en Modo Cine) */}
      {settings.cinemaMode !== true && (
        <header className="relative z-20 flex shrink-0 items-center justify-between border-b border-white/10 bg-slate-950 px-6 py-3">
          <div className="flex items-center gap-3">
            {companyLogoUrl && (
              <div className="relative h-8 w-20 overflow-hidden rounded bg-white/90 p-1">
                <NextImage src={companyLogoUrl} alt={`Logo de ${companyName}`} fill className="object-contain" />
              </div>
            )}
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-sm font-medium uppercase text-white/70">En vivo</span>
          </div>
          {eventName && (
            <span className="text-sm font-semibold text-white/65">{eventName}</span>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen?.().catch(() => {});
                } else {
                  document.exitFullscreen?.().catch(() => {});
                }
              }}
              className="grid h-9 w-9 place-items-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              title="Pantalla completa"
              aria-label="Pantalla completa"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* Main content row — fills all space between header and bottom bar */}
      <div className="relative flex-1 flex overflow-hidden">

        {/* ── Left / main content pane ── */}
        <div className="relative flex-1 overflow-hidden">

          {/* Loading state */}
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="space-y-4 text-center">
                <div className={`w-16 h-16 mx-auto rounded-full border-4 animate-spin ${settings.screenDarkMode !== false ? 'border-white/10 border-t-white/60' : 'border-slate-200 border-t-slate-600'}`} />
                <p className={`text-sm tracking-widest uppercase ${settings.screenDarkMode !== false ? 'text-white/40' : 'text-slate-400'}`}>Cargando muro…</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {/* 'dedicaciones' NO va en esta lista: su bloque esta desactivado mas
              abajo, asi que sin esto la pantalla del salon quedaba en blanco
              cada vez que la rotacion llegaba a esa diapositiva. */}
          {isLoaded && settings.privateDedicationsMode !== true && !['video', 'redes', 'juego', 'chat', 'canciones', 'audioritmico', 'pauta', 'cronograma', 'patrocinador'].includes(activeScreenItem?.type ?? '') && posts.length === 0 && settings.enabled !== false && (
            <EmptyWallState eventName={eventName} qrUrl={qrUrl} coverImageUrl={coverImageUrl} />
          )}

          {/* Muro apagado para esta fiesta. Sin este cartel la pantalla del salon
              quedaba completamente en blanco y nadie sabia por que. */}
          {isLoaded && settings.enabled === false && settings.privateDedicationsMode !== true && (
            <section
              data-testid="live-wall-disabled"
              className="absolute inset-0 grid place-items-center bg-slate-950 px-8 text-center text-white"
              aria-live="polite"
            >
              <div className="max-w-2xl space-y-5">
                <Camera className="mx-auto h-14 w-14 text-red-300" aria-hidden="true" />
                <h1 className="text-4xl font-black leading-tight sm:text-5xl">
                  {eventName || 'Muro social en vivo'}
                </h1>
                <p className="text-lg text-slate-300">
                  El muro de fotos está apagado para esta fiesta. Se enciende desde el panel del
                  muro, en la configuración del evento.
                </p>
              </div>
            </section>
          )}

          {/* Private Greetings Mailbox Mode ("PALABRAS Y AUDIOS PARA SIEMPRE") */}
          {isLoaded && settings.privateDedicationsMode === true &&
            (!activeScreenItem || ['mural', 'dedicaciones', 'chat'].includes(activeScreenItem.type)) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white animate-fade-in">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_60%)] animate-pulse" />
                <div className="relative z-10 text-center max-w-4xl space-y-8">
                  {/* Floating icons animations */}
                  <div className="flex justify-center gap-8 mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-4xl shadow-xl shadow-indigo-500/5 backdrop-blur-md animate-bounce" style={{ animationDelay: '0s' }}>
                      💬
                    </div>
                    <div className="w-24 h-24 rounded-3xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-5xl shadow-xl shadow-purple-500/10 backdrop-blur-md animate-bounce" style={{ animationDelay: '0.2s' }}>
                      🎙️
                    </div>
                    <div className="w-20 h-20 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-4xl shadow-xl shadow-pink-500/5 backdrop-blur-md animate-bounce" style={{ animationDelay: '0.4s' }}>
                      🔒
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-bold text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-[0.2em] uppercase">
                      Palabras y Audios Para Siempre
                    </span>
                    <h1 className="text-5xl md:text-6xl font-black leading-tight bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent drop-shadow-sm">
                      Buzón de Mensajes Privado
                    </h1>
                  </div>

                  <p className="text-lg md:text-xl text-slate-300/95 max-w-2xl mx-auto font-light leading-relaxed">
                    Recibí mensajes de texto y audios directo en tu celular sin que pasen por la pantalla.
                    Los saludos se envían en un buzón de mensajes 100% privado solo para los anfitriones.
                  </p>

                  <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-sm">
                    <span className="text-xl">✨</span>
                    <span className="text-sm font-semibold tracking-wide text-indigo-200">¡Escaneá el QR en tu mesa para participar y enviar tu mensaje privado!</span>
                  </div>
                </div>
              </div>
          )}

          {/* Mural / photo slideshow — only shown when wall is enabled */}
          {isLoaded && settings.privateDedicationsMode !== true && settings.enabled !== false && (!activeScreenItem || activeScreenItem.type === 'mural') && posts.length > 0 && (
            settings.currentLayout === 'masonry'
              ? <MasonryLayout posts={posts} qrUrl={qrUrl} settings={settings} />
              : <SlideshowLayout posts={posts} qrUrl={qrUrl} settings={settings} />
          )}

          {/* Juego slide */}
          {isLoaded && activeScreenItem?.type === 'juego' && (
            activeGame
              ? <GameSlide game={activeGame} posts={posts} qrUrl={qrUrl} settings={settings} />
              : posts.length > 0 && settings.privateDedicationsMode !== true
                ? (
                    settings.currentLayout === 'masonry'
                      ? <MasonryLayout posts={posts} qrUrl={qrUrl} settings={settings} />
                      : <SlideshowLayout posts={posts} qrUrl={qrUrl} settings={settings} />
                  )
                : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                    <div className="text-9xl">🎮</div>
                    <p className="text-white/50 text-2xl font-light tracking-widest uppercase">Zona de juegos</p>
                    <p className="text-white/30 text-base">El operador activará el juego en breve…</p>
                  </div>
                )
          )}

          {/* Video slide */}
          {isLoaded && activeScreenItem?.type === 'video' && (
            <ScreenMediaSlide item={activeScreenItem} fallbackPosts={posts} qrUrl={qrUrl} settings={settings} />
          )}

          {/* Pauta publicitaria slide */}
          {isLoaded && activeScreenItem?.type === 'pauta' && (
            <ScreenMediaSlide item={activeScreenItem} fallbackPosts={posts} qrUrl={qrUrl} settings={settings} />
          )}

          {/* Redes slide */}
          {isLoaded && activeScreenItem?.type === 'redes' && (
            posts.length > 0 ? (
              <SlideshowLayout posts={posts} qrUrl={qrUrl} settings={settings} />
            ) : <EmptyWallState eventName={eventName} qrUrl={qrUrl} />
          )}

          {/* Dedicatorias en la pantalla grande.
              Estuvo apagada con un `false` clavado mientras el operador tenia el control
              para encenderla: el ajuste `showDedications`, el item 'dedicaciones' de la
              lista de la pantalla y el boton para forzarlo desde el celular. Tocaba y no
              pasaba nada, y el invitado escribia dedicatorias que no veia nadie.
              Ahora manda el operador: sale solo si la puso en la lista o la forzo. */}
          {isLoaded && settings.privateDedicationsMode !== true && activeScreenItem?.type === 'dedicaciones' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 p-12 overflow-hidden">
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-400 mb-2">💌 Dedicatorias</p>
              {highlightedDedications.length > 0 ? (
                <div className="space-y-6 w-full max-w-2xl">
                  {highlightedDedications.slice(0, 5).map(d => (
                    <div key={d.id} className="rounded-3xl border border-amber-300/60 bg-black/70 px-8 py-6 shadow-xl backdrop-blur-md text-center">
                      <p className="text-2xl font-semibold leading-snug text-white">"{d.message}"</p>
                      <p className="mt-3 text-sm font-bold tracking-widest text-amber-300 uppercase">— {d.authorName}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-8xl opacity-30">💌</div>
                  <p className="text-white/40 text-xl">Las dedicatorias de los invitados aparecerán aquí</p>
                </div>
              )}
            </div>
          )}

          {/* Chat en Vivo full-screen slide */}
          {isLoaded && settings.privateDedicationsMode !== true && activeScreenItem?.type === 'chat' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-12 overflow-hidden">
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-sky-400 mb-2">💬 Chat en Vivo</p>
              {recentChatMessages.length > 0 ? (
                <div className="space-y-4 w-full max-w-2xl">
                  {recentChatMessages.map(msg => (
                    <div key={msg.id} className="rounded-3xl border border-sky-300/40 bg-black/70 px-8 py-5 shadow-xl backdrop-blur-md">
                      <span className="text-sm font-black text-sky-300 mr-2">{msg.authorName}:</span>
                      <span className="text-xl text-white/90 leading-snug">{msg.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-8xl opacity-30">💬</div>
                  <p className="text-white/40 text-xl">Los mensajes del chat en vivo aparecerán aquí</p>
                </div>
              )}
            </div>
          )}

          {/* Canciones full-screen slide */}
          {isLoaded && activeScreenItem?.type === 'canciones' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-12 overflow-hidden">
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-green-400 mb-2">🎵 Pedidos de Canciones</p>
              {recentSongRequests.length > 0 ? (
                <div className="space-y-4 w-full max-w-2xl">
                  {recentSongRequests.map(req => (
                    <div key={req.id} className="rounded-3xl border border-green-400/40 bg-black/70 px-8 py-5 shadow-xl backdrop-blur-md">
                      <p className="text-2xl font-bold text-green-300">{req.song}</p>
                      <p className="text-sm text-white/50 mt-1">Pedido por {req.requestedBy}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-8xl opacity-30">🎵</div>
                  <p className="text-white/40 text-xl">Los pedidos de canciones aparecerán aquí</p>
                </div>
              )}
            </div>
          )}

          {/* Pantalla audiorritmica para momentos de baile */}
          {isLoaded && activeScreenItem?.type === 'audioritmico' && (
            <AudioRhythmSlide
              settings={settings.audioRhythm}
              posts={posts}
              eventName={eventName}
              fallbackQrUrl={`/evento/social/${fiestaId}`}
              fondoMuro={fondoMuro}
            />
          )}

          {/* Cronograma / Qué viene ahora (Bloque 2) */}
          {isLoaded && activeScreenItem?.type === 'cronograma' && eventPrograma.length > 0 && (
            <CronogramaSlide programa={eventPrograma} />
          )}

          {/* Patrocinador / Salón de eventos (Bloque 5) */}
          {isLoaded && activeScreenItem?.type === 'patrocinador' && (
            <PatrocinadorSlide brand={settings.brand} staticBranding={staticBranding} />
          )}

          {/* Dedications overlay - Omitted as memories go in a separate module */}
          {false && isLoaded && settings.privateDedicationsMode !== true && highlightedDedications.length > 0 && !activePoll && (
            <div className={`absolute left-6 top-6 z-10 space-y-3 ${hasSidePanel ? 'w-[28vw] max-w-xs' : 'w-[32vw] max-w-sm'}`}>
              {highlightedDedications.slice(0, 3).map(d => (
                <div key={d.id} className="ak-live-panel px-5 py-4">
                  <p className="text-base font-semibold leading-snug text-white">"{d.message}"</p>
                  <p className="mt-1.5 text-xs font-bold tracking-widest text-amber-300 uppercase">— {d.authorName}</p>
                </div>
              ))}
            </div>
          )}

          {/* Comments overlay — shown when chat is enabled and no dedications */}
          {isLoaded && settings.privateDedicationsMode !== true && highlightedComments.length > 0 && settings.allowComments && !activePoll && highlightedDedications.length === 0 && (
            <div className={`absolute left-6 top-6 z-10 space-y-3 ${hasSidePanel ? 'w-[28vw] max-w-xs' : 'w-[32vw] max-w-sm'}`}>
              {highlightedComments.slice(0, 3).map(({ comment }) => (
                <div key={comment.id} className="ak-live-panel px-5 py-4">
                  <p className="text-base font-semibold leading-snug text-white">"{comment.text}"</p>
                  <p className="mt-1.5 text-xs font-bold tracking-widest text-sky-300 uppercase">— {comment.authorName}</p>
                </div>
              ))}
            </div>
          )}

          {/* Live chat messages overlay — bottom-left, always shown when chat is enabled (oculto en Modo Cine) */}
          {isLoaded && settings.cinemaMode !== true && settings.privateDedicationsMode !== true && settings.chatEnabled !== false && recentChatMessages.length > 0 && !activePoll && (
            <div className={`absolute left-6 bottom-6 z-10 space-y-2 ${hasSidePanel ? 'w-[28vw] max-w-sm' : 'w-[32vw] max-w-sm'}`}>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-white/70 mb-2">💬 Chat en Vivo</p>
              {recentChatMessages.map(msg => (
                <div key={msg.id} className="rounded-xl border border-white/25 bg-black/70 px-4 py-2.5 shadow-md backdrop-blur-sm">
                  <span className="text-base font-black text-sky-300 mr-1.5">{msg.authorName}:</span>
                  <span className="text-base text-white leading-snug">{msg.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Song requests overlay — bottom-right corner (oculto en Modo Cine) */}
          {isLoaded && settings.cinemaMode !== true && settings.showSongRequests !== false && recentSongRequests.length > 0 && !activePoll && (
            <div className="absolute right-6 bottom-6 z-10 w-[28vw] max-w-sm space-y-2">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-white/70 mb-2">🎵 Pedidos de Canciones</p>
              {recentSongRequests.map(req => (
                <div key={req.id} className="rounded-xl border border-green-400/40 bg-black/70 px-4 py-2.5 shadow-md backdrop-blur-sm">
                  <span className="text-base font-bold text-green-300 mr-1.5">{req.song}</span>
                  <span className="text-sm text-white/75">— {req.requestedBy}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right side panel: poll or game overlay ── */}
        {hasSidePanel && isLoaded && (
          <div className="ak-live-panel w-[38%] shrink-0 flex flex-col items-center justify-center gap-5 overflow-y-auto border-y-0 border-r-0 p-6">
            {/* Active game (when playlist is not on 'juego' slide) */}
            {activeGame && activeScreenItem?.type !== 'juego' && (
              <div className={GAME_OVERLAY_CLASS}>
                <GameOverlayContent game={activeGame} />
              </div>
            )}
            {/* Active poll */}
            {activePoll && settings.showPolls !== false && !activeGame && (
              <div className="w-full space-y-5">
                <p className="text-center text-sm font-black tracking-[0.35em] text-yellow-300 uppercase">🎮 Juego en Vivo</p>
                <h2 className="text-center text-3xl font-black leading-tight text-white">{activePoll.question}</h2>
                <div className="space-y-4">
                  {activePoll.options.map((option) => {
                    const totalVotes = activePoll.options.reduce((acc, opt) => acc + opt.votes, 0);
                    const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                    return (
                      <div key={option.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-white">
                          <span className="text-xl font-extrabold">{option.text}</span>
                          <span className="text-2xl font-black text-yellow-300">{percentage}%</span>
                        </div>
                        <div className="h-6 rounded-full bg-white/20">
                          <div className="h-full rounded-full bg-yellow-300 transition-all duration-500" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom bar — in flow (oculto en Modo Cine) ── */}
      {settings.cinemaMode !== true && (
        <div className="relative z-30 shrink-0">
          <div className={`flex items-center justify-center gap-8 border-t px-6 py-3 backdrop-blur-md ${settings.screenDarkMode !== false ? 'border-white/10 bg-black/75' : 'border-slate-200 bg-white/90'}`}>
            {footerSocials.map((social) => {
              const Icon = social.platform === 'Instagram'
                ? Instagram
                : social.platform === 'Facebook'
                ? Facebook
                : social.platform === 'TikTok'
                ? Music2
                : MessageCircle;
              return (
                <div key={social.platform} className={`flex items-center gap-3 transition-all duration-300 hover:scale-105 ${settings.screenDarkMode !== false ? 'text-white/90' : 'text-slate-800'}`}>
                  <div className={`p-1.5 rounded-lg ${settings.screenDarkMode !== false ? 'bg-white/5 border border-white/10 text-indigo-400' : 'bg-slate-100 border border-slate-200 text-indigo-600'}`}>
                    <Icon className="h-4 w-4 flex-shrink-0" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold tracking-wide">{social.handle}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${settings.screenDarkMode !== false ? 'text-indigo-300/60' : 'text-indigo-600/65'}`}>{social.platform}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {settings.ledMarqueeEnabled !== false && settings.ledMarqueeText && (
            <div
              className="overflow-hidden border-y py-2"
              style={{
                borderColor: settings.ledMarqueeBgColor
                  ? `${settings.ledMarqueeBgColor}60`
                  : 'rgba(217,70,239,0.4)',
                backgroundColor: settings.ledMarqueeBgColor
                  ? `${settings.ledMarqueeBgColor}30`
                  : 'rgba(168,85,247,0.15)',
              }}
            >
              <div
                className={`whitespace-nowrap text-2xl font-black uppercase tracking-wider ${LED_MARQUEE_ANIMATION_CLASS}`}
                style={{
                  color: settings.ledMarqueeColor || '#f0abfc',
                  willChange: 'transform',
                  transform: 'translateZ(0)'
                }}
              >
                {renderMarqueeText(settings.ledMarqueeText)}
              </div>
            </div>
          )}
          {posts.length > 0 && settings.marketingTickerEnabled !== false && (settings.marketingTickerText || companyMarketingText) && (
            <div
              className="overflow-hidden border-t py-2"
              style={{
                backgroundColor: settings.marketingTickerBgColor || '#000000a0',
                borderColor: settings.marketingTickerBgColor
                  ? `${settings.marketingTickerBgColor}80`
                  : 'rgba(255,255,255,0.15)',
              }}
            >
              <div
                className={`whitespace-nowrap text-lg font-bold ${MARKETING_MARQUEE_ANIMATION_CLASS}`}
                style={{
                  color: settings.marketingTickerColor || '#e0f2fe',
                  willChange: 'transform',
                  transform: 'translateZ(0)'
                }}
              >
                {renderMarqueeText(settings.marketingTickerText || companyMarketingText)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Full-screen overlays (moment, sorteo) — still absolute/z-40+ ── */}
      <AnimatePresence>
        {/* Active moment overlay — only shown when no sorteo winner is active */}
        {activeMoment && !activeSorteoWinner && (
          <motion.div
            key={activeMoment.timestamp}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/85 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -8 }}
              animate={{ scale: [0.95, 1.05, 1], rotate: [0, 5, -3, 0] }}
              transition={{ duration: 1.2 }}
              className="mb-6 text-9xl"
            >
              {activeMoment.emoji}
            </motion.div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.5em] text-amber-300">Momento especial</p>
            <h1 className="text-7xl font-black uppercase text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.3)]">
              {activeMoment.nombre}
            </h1>
          </motion.div>
        )}

        {/* Sorteo static preview — shows the wheel on screen before spinning starts */}
        <AnimatePresence>
          {sorteoOnScreen && !sorteoSpinActive && !activeSorteoWinner && (
            <motion.div
              key="sorteo-preview"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-[44] flex flex-col items-center justify-center bg-black/85 text-center overflow-hidden"
            >
              <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 text-3xl font-black uppercase tracking-[0.4em] text-yellow-300 drop-shadow-[0_0_12px_rgba(234,179,8,0.6)]"
              >
                🎡 Sorteo Sorpresa 🎡
              </motion.p>
              {/* Slowly rotating preview wheel */}
              <div className="relative w-80 h-80">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-20 w-0 h-0"
                  style={{ borderLeft: '16px solid transparent', borderRight: '16px solid transparent', borderTop: '32px solid #eab308', filter: 'drop-shadow(0 0 8px rgba(234,179,8,0.8))' }} />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="w-80 h-80 rounded-full border-[10px] border-yellow-400 shadow-[0_0_40px_rgba(234,179,8,0.4)]"
                  style={{
                    background: SORTEO_WHEEL_GRADIENT,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-24 h-24 rounded-full bg-white border-4 border-yellow-400 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                    <span className="text-3xl font-black text-yellow-600 drop-shadow">AK</span>
                  </div>
                </div>
              </div>
              <motion.p
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mt-6 text-xl font-bold text-white/70"
              >
                🎁 ¡Sorteando en breve!
              </motion.p>
              {settings.sorteoPremio && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-4 rounded-2xl border-2 border-yellow-400/50 bg-yellow-400/10 px-8 py-3 backdrop-blur-sm"
                >
                  <p className="text-sm font-black text-yellow-300 uppercase tracking-widest mb-1">🎁 Premio</p>
                  <p className="text-2xl font-black text-white">{settings.sorteoPremio}</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sorteo spinning wheel overlay */}
        <AnimatePresence>
          {sorteoSpinActive && !activeSorteoWinner && (
            <motion.div
              key="sorteo-spin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[45] flex flex-col items-center justify-center bg-black/85 text-center overflow-hidden"
            >
              {/* Floating emoji particles */}
              {['🎰', '✨', '🎲', '⭐', '🎊', '💫', '🏆', '🎉'].map((e, i) => (
                <motion.div
                  key={i}
                  className="absolute text-4xl pointer-events-none select-none"
                  style={{ left: `${8 + i * 11}%`, bottom: '-10%' }}
                  animate={{ y: [0, '-110vh'] }}
                  transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * 0.4, ease: 'linear' }}
                >
                  {e}
                </motion.div>
              ))}
              <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 text-3xl font-black uppercase tracking-[0.4em] text-yellow-300 drop-shadow-[0_0_12px_rgba(234,179,8,0.6)]"
              >
                🎰 ¡Sorteando! 🎰
              </motion.p>
              {/* Spinning wheel */}
              <div className="relative w-80 h-80">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-20 w-0 h-0"
                  style={{ borderLeft: '16px solid transparent', borderRight: '16px solid transparent', borderTop: '32px solid #eab308', filter: 'drop-shadow(0 0 8px rgba(234,179,8,0.8))' }} />
                {/* Wheel disc */}
                <div
                  className="w-80 h-80 rounded-full border-[10px] border-yellow-400 shadow-[0_0_40px_rgba(234,179,8,0.4)]"
                  style={{
                    transform: `rotate(${sorteoSpinWheelAngle}deg) translateZ(0)`,
                    transition: sorteoSpinActive
                      ? 'transform 7s cubic-bezier(0.08, 0.82, 0.17, 1)'
                      : 'none',
                    willChange: 'transform',
                    background: SORTEO_WHEEL_GRADIENT,
                  }}
                />
                {/* Center hub */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-24 h-24 rounded-full bg-white border-4 border-yellow-400 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                    <span className="text-3xl font-black text-yellow-600 drop-shadow">AK</span>
                  </div>
                </div>
              </div>
              <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="mt-8 text-2xl font-bold text-white/70"
              >
                🎲 Eligiendo ganador…
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {activeSorteoWinner && (
          <motion.div
            key={`sorteo-${activeSorteoWinner}`}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 text-center"
          >
            {/* Confetti-like decorative elements */}
            {['🎉', '🎊', '⭐', '✨', '🏆', '🎈'].map((e, i) => (
              <motion.div
                key={i}
                className="absolute text-5xl pointer-events-none"
                initial={{ opacity: 0, y: -20, x: (i - 2.5) * 120 }}
                animate={{ opacity: [0, 1, 1, 0], y: [0, -60, -120, -200] }}
                transition={{ delay: 0.3 + i * 0.1, duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
                style={{ top: '30%', left: '50%' }}
              >
                {e}
              </motion.div>
            ))}
            <motion.div
              initial={{ scale: 0.5, y: 40 }}
              animate={{ scale: [0.8, 1.1, 1], y: 0 }}
              transition={{ duration: 1.0 }}
              className="mb-4 text-9xl"
            >
              🎉
            </motion.div>
            <p className="mb-2 text-sm font-black uppercase tracking-[0.6em] text-yellow-300">¡Ganador del Sorteo!</p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(255,215,0,0.5)] px-8"
            >
              {activeSorteoWinner}
            </motion.h1>
            {settings.sorteoPremio && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="mt-5 rounded-2xl border-2 border-yellow-400 bg-yellow-400/20 px-8 py-3 backdrop-blur-sm"
              >
                <p className="text-sm font-black text-yellow-300 uppercase tracking-widest mb-1">🎁 Premio</p>
                <p className="text-3xl font-black text-white">{settings.sorteoPremio}</p>
              </motion.div>
            )}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 text-xl font-bold text-yellow-200/80 tracking-widest"
            >
              🏆 ¡Felicitaciones! 🏆
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flash de cámara de fotos */}
      <AnimatePresence>
        {showCameraFlash && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed inset-0 bg-white z-[100] pointer-events-none"
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ak-live-stage *, .ak-live-stage *::before, .ak-live-stage *::after {
            animation: none !important;
            transition-duration: 0ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <FloatingReactionsLayer fiestaId={fiestaId} />
      <ReconnectingIndicator isReconnecting={isReconnecting} />
    </div>
  );
}

function EmptyWallState({ eventName, qrUrl, coverImageUrl }: { eventName: string; qrUrl: string; coverImageUrl?: string }) {
  return (
    <section
      data-testid="live-wall-empty"
      className="absolute inset-0 grid place-items-center overflow-hidden bg-slate-950 px-8 py-10 text-white"
      aria-live="polite"
    >
      {coverImageUrl && (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverImageUrl} alt="" className="w-full h-full object-cover opacity-20 filter blur-sm scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/50" />
        </div>
      )}

      <div className="relative z-10 grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
        <div className="max-w-3xl">
          <div className="mb-6 flex items-center gap-3 text-red-300">
            <Camera className="h-8 w-8" aria-hidden="true" />
            <p className="text-base font-black uppercase tracking-[0.28em]">Muro social en vivo</p>
          </div>
          <h1 className="text-5xl font-black leading-tight sm:text-6xl lg:text-7xl">
            {eventName || 'Compartí este momento'}
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-slate-300 lg:text-2xl">
            Todavía no hay publicaciones. Escaneá el código, subí tu foto y aparecé en esta pantalla.
          </p>
        </div>

        {qrUrl ? (
          <div className="flex min-w-[250px] flex-col items-center rounded-lg border border-white/15 bg-white p-5 text-center text-slate-950 shadow-2xl">
            <QRCodeSVG value={qrUrl} size={190} includeMargin={false} />
            <p className="mt-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider">
              <QrCode className="h-4 w-4" aria-hidden="true" /> Escaneá para participar
            </p>
          </div>
        ) : (
          <div className="grid h-56 w-56 place-items-center rounded-lg border border-white/15 bg-white/5 text-white/35">
            <QrCode className="h-24 w-24" aria-hidden="true" />
          </div>
        )}
      </div>
    </section>
  );
}

function CronogramaSlide({ programa }: { programa: any[] }) {
  if (!programa || programa.length === 0) return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 p-12 overflow-hidden bg-slate-950 text-white">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-[0.3em]">
        🕒 Qué viene ahora en la fiesta
      </div>

      <div className="w-full max-w-3xl space-y-4">
        {programa.slice(0, 4).map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-between p-6 rounded-2xl border backdrop-blur-md transition-all ${
              idx === 0
                ? 'bg-amber-500/20 border-amber-400/60 shadow-2xl scale-105'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl ${
                idx === 0 ? 'bg-amber-400 text-black font-black' : 'bg-white/10 text-white'
              }`}>
                {item.hora || `${22 + idx}:00`}
              </span>
              <span className={`text-xl font-bold ${idx === 0 ? 'text-amber-200' : 'text-white'}`}>
                {item.titulo || item.descripcion}
              </span>
            </div>
            {idx === 0 && (
              <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Ahora
              </span>
            )}
            {idx === 1 && (
              <span className="text-xs font-semibold uppercase text-slate-400">
                Siguiente
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PatrocinadorSlide({ brand, staticBranding }: { brand?: any; staticBranding?: any }) {
  const name = brand?.name || staticBranding?.companyInfo?.nombre || 'AK Producciones';
  const logo = brand?.logoUrl || staticBranding?.companyInfo?.logoUrl;
  const tagline = brand?.tagline || staticBranding?.companyInfo?.tagline || 'Experiencia & Entretenimiento para tu Fiesta';

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-12 overflow-hidden bg-slate-950 text-white text-center">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-black uppercase tracking-[0.3em]">
        ✨ Presentado por
      </div>
      {logo && (
        <div className="relative w-48 h-28 my-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={name} className="w-full h-full object-contain filter drop-shadow-xl" />
        </div>
      )}
      <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight">{name}</h2>
      <p className="text-lg sm:text-xl text-slate-300 max-w-xl mx-auto font-medium">{tagline}</p>
    </div>
  );
}

function FloatingReactionsLayer({ fiestaId }: { fiestaId: string }) {
  const [reactions, setReactions] = useState<{ id: string; emoji: string; left: number }[]>([]);
  const lastTimestampRef = useRef<number>(Date.now() - 5000);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const { getPublicLiveReactions } = await import('@/app/actions/social-interactive');
        const list = await getPublicLiveReactions(fiestaId, lastTimestampRef.current);
        if (list.length > 0 && active) {
          lastTimestampRef.current = Date.now();
          const newItems = list.map((item) => ({
            id: item.id,
            emoji: item.emoji || '👏',
            left: Math.floor(Math.random() * 80) + 10,
          }));
          setReactions((prev) => [...prev.slice(-30), ...newItems]);
        }
      } catch {}
    };

    const interval = setInterval(poll, 1500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [fiestaId]);

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 100, scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], y: -800, scale: [0.5, 1.3, 1.1, 0.8] }}
            transition={{ duration: 4, ease: 'easeOut' }}
            className="absolute text-5xl sm:text-7xl select-none"
            style={{ left: `${r.left}%`, bottom: '20px' }}
          >
            {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function AudioRhythmSlide({
  settings,
  posts,
  eventName,
  fallbackQrUrl,
  fondoMuro,
}: {
  settings?: AudioRhythmSettings;
  posts: SocialGalleryPost[];
  eventName: string;
  fallbackQrUrl: string;
  fondoMuro?: string;
}) {
  const config = {
    enabled: settings?.enabled ?? true,
    title: settings?.title ?? 'Modo discoteca',
    subtitle: settings?.subtitle ?? 'Luces, fotos y energia en vivo.',
    visualStyle: settings?.visualStyle ?? 'neon-bars',
    accentColor: settings?.accentColor ?? '#dc2626',
    secondaryColor: settings?.secondaryColor ?? '#06b6d4',
    intensity: settings?.intensity ?? 80,
    showPhotos: settings?.showPhotos ?? true,
    showQr: settings?.showQr ?? true,
    qrUrl: settings?.qrUrl || fallbackQrUrl,
  };
  const [audioLevel, setAudioLevel] = useState(0.45);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const visiblePosts = posts.slice(0, 9);

  useEffect(() => {
    if (!config.enabled) return;
    let stopped = false;
    const tick = () => {
      const analyzer = analyzerRef.current;
      if (analyzer) {
        const data = new Uint8Array(analyzer.frequencyBinCount);
        analyzer.getByteFrequencyData(data);
        const average = data.reduce((sum, value) => sum + value, 0) / Math.max(1, data.length);
        setAudioLevel(Math.max(0.18, Math.min(1, average / 150)));
      } else {
        setAudioLevel(0.42 + Math.sin(Date.now() / 180) * 0.2 + Math.sin(Date.now() / 430) * 0.12);
      }
      if (!stopped) rafRef.current = window.requestAnimationFrame(tick);
    };
    tick();
    return () => {
      stopped = true;
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    };
  }, [config.enabled]);

  const activateAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      mediaStreamRef.current = stream;
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      const context = new AudioContextCtor();
      const source = context.createMediaStreamSource(stream);
      const analyzer = context.createAnalyser();
      analyzer.fftSize = 128;
      source.connect(analyzer);
      analyzerRef.current = analyzer;
    } catch {
      analyzerRef.current = null;
    }
  };

  if (!config.enabled) {
    return posts.length > 0 ? <SlideshowLayout posts={posts} /> : null;
  }

  const intensity = Math.max(0.4, Math.min(1.6, config.intensity / 80));
  const barCount = config.visualStyle === 'equalizer' ? 54 : 36;
  const fondoEstilo = fondoMuro && fondoMuro !== 'predeterminado' && FONDOS_MURO[fondoMuro]
    ? FONDOS_MURO[fondoMuro].cssBackground
    : `radial-gradient(circle at 18% 18%, ${config.accentColor}44, transparent 32%), radial-gradient(circle at 82% 16%, ${config.secondaryColor}44, transparent 28%), linear-gradient(135deg, #020617, #0f172a 52%, #020617)`;

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-slate-950 text-white"
      style={{
        background: fondoEstilo,
      }}
    >
      <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '54px 54px' }} />

      {config.visualStyle === 'orbits' && (
        <div className="absolute inset-0 flex items-center justify-center">
          {[0, 1, 2, 3].map((index) => (
            <motion.div
              key={index}
              className="absolute rounded-full border"
              style={{
                width: `${30 + index * 16}vw`,
                height: `${30 + index * 16}vw`,
                borderColor: index % 2 === 0 ? `${config.accentColor}70` : `${config.secondaryColor}70`,
              }}
              animate={{ rotate: index % 2 === 0 ? 360 : -360, scale: [1, 1 + audioLevel * 0.12 * intensity, 1] }}
              transition={{ rotate: { duration: 12 + index * 4, repeat: Infinity, ease: 'linear' }, scale: { duration: 0.8, repeat: Infinity } }}
            />
          ))}
        </div>
      )}

      {config.visualStyle === 'waves' && (
        <div className="absolute inset-0 flex items-center justify-center">
          {Array.from({ length: 12 }).map((_, index) => (
            <motion.div
              key={index}
              className="absolute rounded-full border"
              style={{ borderColor: index % 2 === 0 ? `${config.accentColor}55` : `${config.secondaryColor}55` }}
              animate={{
                width: [`${8 + index * 8}vw`, `${12 + index * 10 + audioLevel * 18}vw`],
                height: [`${8 + index * 8}vw`, `${12 + index * 10 + audioLevel * 18}vw`],
                opacity: [0.35, 0.05],
              }}
              transition={{ duration: 1.4 + index * 0.1, repeat: Infinity, delay: index * 0.08 }}
            />
          ))}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex h-[42vh] items-end justify-center gap-1 px-8">
        {Array.from({ length: barCount }).map((_, index) => {
          const wave = Math.abs(Math.sin(index * 0.45 + Date.now() / 260));
          const height = 18 + (wave * 58 + audioLevel * 44) * intensity;
          return (
            <motion.div
              key={index}
              className="w-full max-w-[18px] rounded-t-full"
              style={{
                height: `${Math.min(96, height)}%`,
                background: index % 2 === 0 ? config.accentColor : config.secondaryColor,
                boxShadow: `0 0 ${18 + audioLevel * 28}px ${index % 2 === 0 ? config.accentColor : config.secondaryColor}`,
              }}
              animate={{ scaleY: [0.9, 1 + audioLevel * 0.45, 0.9], opacity: [0.62, 1, 0.62] }}
              transition={{ duration: 0.5 + (index % 5) * 0.06, repeat: Infinity }}
            />
          );
        })}
      </div>

      {config.showPhotos && visiblePosts.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {visiblePosts.map((post, index) => (
            <motion.div
              key={post.id}
              className="absolute overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-2xl"
              style={{
                width: `${9 + (index % 3) * 2}vw`,
                aspectRatio: '4/5',
                left: `${8 + ((index * 13) % 78)}%`,
                top: `${12 + ((index * 19) % 58)}%`,
              }}
              animate={{ y: [0, -20 - audioLevel * 35, 0], rotate: [-3, 3, -3], opacity: [0.38, 0.78, 0.38] }}
              transition={{ duration: 4 + (index % 4), repeat: Infinity, delay: index * 0.25 }}
            >
              {post.mediaType === 'video' || isVideoUrl(post.imageUrl) ? (
                <video src={post.imageUrl} className="h-full w-full object-cover" autoPlay muted loop playsInline />
              ) : (
                <NextImage src={post.imageUrl} alt={post.authorName} fill className="object-cover" unoptimized />
              )}
            </motion.div>
          ))}
        </div>
      )}

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-12 text-center">
        {eventName && <p className="mb-4 text-sm font-black uppercase tracking-[0.45em] text-white/45">{eventName}</p>}
        <motion.h1
          animate={{ scale: [1, 1 + audioLevel * 0.05, 1], textShadow: [`0 0 20px ${config.accentColor}`, `0 0 44px ${config.secondaryColor}`, `0 0 20px ${config.accentColor}`] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="max-w-5xl text-[clamp(4rem,11vw,11rem)] font-black uppercase leading-[0.88]"
        >
          {config.title}
        </motion.h1>
        <p className="mt-6 max-w-3xl text-[clamp(1.25rem,2.4vw,2.4rem)] font-semibold text-white/70">{config.subtitle}</p>
        <button
          onClick={activateAudio}
          className="mt-8 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-black uppercase tracking-[0.22em] text-white/80 backdrop-blur transition hover:bg-white/20"
        >
          Activar audio real
        </button>
      </div>

      {config.showQr && config.qrUrl && (
        <div className="absolute bottom-8 right-8 z-20 flex items-center gap-4 rounded-[2rem] border border-white/20 bg-white/95 p-4 text-slate-950 shadow-2xl">
          <QRCodeSVG value={config.qrUrl} size={124} includeMargin />
          <div className="max-w-[190px] text-left">
            <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: config.accentColor }}>Participa</p>
            <p className="mt-1 text-sm font-bold text-slate-600">Subi tu foto y mirate en la pantalla.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function renderMarqueeText(text: string) {
  return Array.from({ length: MARQUEE_REPEAT_COUNT }, (_, index) => (
    <span key={index} className="mx-8">
      {text}
    </span>
  ));
}

function ScreenMediaSlide({
  item,
  fallbackPosts,
  qrUrl = '',
  settings = { enabled: true }
}: {
  item: ScreenPlaylistItem;
  fallbackPosts: SocialGalleryPost[];
  qrUrl?: string;
  settings?: any;
}) {
  const [mediaLoaded, setMediaLoaded] = useState(false);

  useEffect(() => {
    setMediaLoaded(false);
  }, [item.mediaUrl]);

  if (!item.mediaUrl) {
    // No media uploaded: show slideshow if there are posts, otherwise a placeholder
    if (fallbackPosts.length > 0) {
      return <SlideshowLayout posts={fallbackPosts} qrUrl={qrUrl} settings={settings} />;
    }
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div className="text-8xl opacity-20">🎬</div>
        <p className="text-white/40 text-lg tracking-widest uppercase text-center">
          Subí un video o imagen<br />para esta diapositiva
        </p>
      </div>
    );
  }
  const isVideo = item.type === 'video' || isVideoUrl(item.mediaUrl);
  const portrait = item.layout === 'portrait';
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      {!mediaLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/90 text-white/50">
          <div className="space-y-3 text-center">
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-white/10 border-t-indigo-500 animate-spin" />
            <p className="text-xs font-black uppercase tracking-[0.25em] text-white/40">Cargando diapositiva…</p>
          </div>
        </div>
      )}
      {isVideo ? (
        <video
          src={item.mediaUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onPlay={() => setMediaLoaded(true)}
          onLoadedData={() => setMediaLoaded(true)}
          className={portrait ? 'h-full w-auto max-w-full object-cover' : 'w-full h-full object-cover'}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.mediaUrl}
          alt={item.title}
          onLoad={() => setMediaLoaded(true)}
          className={portrait ? 'h-full w-auto max-w-full object-cover' : 'w-full h-full object-cover'}
        />
      )}
    </div>
  );
}

function SocialTemplateSlide({ item, eventName, brand }: { item: ScreenPlaylistItem; eventName: string; brand?: SocialGalleryBrand }) {
  const template = item.socialTemplate;
  const templateClass =
    template?.templateId === 'neon'
      ? 'from-fuchsia-700 via-purple-900 to-cyan-900'
      : template?.templateId === 'minimal'
      ? 'from-slate-900 via-slate-800 to-slate-900'
      : 'from-neutral-900 via-amber-900 to-neutral-900';

  // Brand has priority over template; template provides screen-specific overrides only when brand lacks the value.
  // If neither brand nor template has a value, omit the row entirely (no generic placeholders).
  const instagramHandle = brand?.instagramHandle?.trim() || template?.instagramHandle?.trim();
  const tiktokHandle = brand?.tiktokHandle?.trim() || template?.tiktokHandle?.trim();
  const whatsappHandle = brand?.whatsappNumber?.trim() || template?.whatsappHandle?.trim();
  const facebookHandle = brand?.facebookHandle?.trim() || template?.facebookHandle?.trim();
  const landingUrl = brand?.landingUrl?.trim() || template?.qrUrl?.trim();
  const ctaText = brand?.ctaText?.trim() || template?.ctaText?.trim();

  const rows = [
    instagramHandle ? `Instagram: ${instagramHandle}` : null,
    tiktokHandle ? `TikTok: ${tiktokHandle}` : null,
    whatsappHandle ? `WhatsApp: ${whatsappHandle}` : null,
    facebookHandle ? `Facebook: ${facebookHandle}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${templateClass}`}>
      <div className="text-center text-white px-8 max-w-3xl w-full">
        {eventName && (
          <p className="text-sm uppercase tracking-[0.4em] opacity-70 mb-3">{eventName}</p>
        )}
        <h2 className="text-6xl font-black mb-5">Redes Sociales</h2>
        {ctaText && (
          <p className="text-2xl font-semibold mb-4">{ctaText}</p>
        )}
        {rows.length > 0 && (
          <div className="space-y-1 text-2xl mb-4">
            {rows.map((row) => (
              <p key={row}>{row}</p>
            ))}
          </div>
        )}
        {landingUrl && (
          <div className="mt-6 inline-block rounded-2xl border border-white/30 bg-white/10 px-6 py-3 backdrop-blur-sm">
            <p className="text-sm uppercase tracking-widest opacity-70 mb-1">Visitanos en</p>
            <p className="text-lg font-bold break-all">{landingUrl}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function QRFloatingCard({ qrUrl, settings }: { qrUrl: string; settings: any }) {
  if (!qrUrl) return null;
  const brand = settings?.brand;
  const instagram = brand?.instagramHandle?.trim() || '@akproducciones';

  return (
    <div className="absolute bottom-5 right-5 z-30 flex items-center gap-3 rounded-md border border-white/20 bg-slate-950/95 p-3 text-white">
      <div className="bg-white p-2 rounded-md">
        <QRCodeSVG value={qrUrl} size={90} includeMargin={false} />
      </div>
      <div className="max-w-[160px] text-left flex flex-col justify-center">
        <div className="flex items-center gap-1.5 text-amber-300">
          <Camera className="h-3.5 w-3.5" />
          <span className="text-[10px] font-black uppercase">Subí tu foto</span>
        </div>
        <p className="mt-1 text-xs font-bold leading-snug text-white/90">Escaneá para salir en la pantalla en vivo</p>
        {instagram && (
          <p className="mt-1.5 text-[10px] font-bold text-amber-300/75 truncate">{instagram}</p>
        )}
      </div>
    </div>
  );
}

const SLIDESHOW_DURATION_MS = 6000;

function SlideshowLayout({
  posts,
  qrUrl = '',
  settings = { enabled: true }
}: {
  posts: SocialGalleryPost[];
  qrUrl?: string;
  settings?: any;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const prevLengthRef = useRef(posts.length);

  const post = posts[currentIndex] ?? posts[0];
  const isVideo = post ? (post.mediaType === 'video' || isVideoUrl(post.imageUrl)) : false;
  const captionText = post ? (post.dedication || post.caption || post.momentTag) : '';

  useEffect(() => {
    setMediaLoaded(false);
  }, [currentIndex, posts]);

  useEffect(() => {
    if (posts.length > prevLengthRef.current) {
      setCurrentIndex(0);
    }
    prevLengthRef.current = posts.length;
  }, [posts.length]);

  const advance = useCallback(() => {
    if (posts.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % posts.length);
  }, [posts.length]);

  const isMission = post?.momentTag?.toLowerCase().includes('misión') || post?.momentTag?.toLowerCase().includes('mision') || captionText?.toLowerCase().includes('misión') || captionText?.toLowerCase().includes('mision');

  // Bloque F: Detección de la foto más querida de la noche y mesas destacadas
  const topLikedPost = useMemo(() => {
    const withLikes = posts.filter((p) => (p.likes || 0) > 0);
    if (withLikes.length === 0) return null;
    return [...withLikes].sort((a, b) => (b.likes || 0) - (a.likes || 0))[0];
  }, [posts]);

  // Mesas / Grupos más participativos (sin nombres propios ni perdedores)
  const participatingGroups = useMemo(() => {
    const tableCounts: Record<string, number> = {};
    posts.forEach((p) => {
      const text = `${p.caption || ''} ${p.dedication || ''} ${p.momentTag || ''}`;
      const match = text.match(/mesa\s*([0-9]+|[a-zA-Záéíóúñ]+)/i);
      const groupName = match ? `Mesa ${match[1].toUpperCase()}` : 'Mesa General';
      tableCounts[groupName] = (tableCounts[groupName] || 0) + 1;
    });
    return Object.entries(tableCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .filter(([name]) => name !== 'Mesa General' || Object.keys(tableCounts).length === 1);
  }, [posts]);

  // Mostrar slide especial de ranking cada 6 publicaciones si hay una foto con corazones
  const isRankingSlide = Boolean(
    topLikedPost &&
    posts.length >= 3 &&
    currentIndex % 6 === 5
  );

  // Auto-advance slideshow (dinámico si es ranking, video o imagen)
  useEffect(() => {
    if (posts.length <= 1) return;

    const duration = isRankingSlide
      ? 8000
      : isVideo
        ? 35000
        : SLIDESHOW_DURATION_MS;

    const timer = setTimeout(advance, duration);
    return () => clearTimeout(timer);
  }, [posts.length, currentIndex, isVideo, isRankingSlide, advance]);

  if (posts.length === 0) return null;

  if (isRankingSlide && topLikedPost) {
    return (
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-slate-950 p-6">
        <div className="relative h-full w-full max-w-[min(100%,1500px)] overflow-hidden rounded-2xl bg-gradient-to-b from-amber-950/80 via-slate-900 to-black border-2 border-amber-400/60 shadow-[0_0_60px_rgba(251,191,36,0.25)] flex flex-col items-center justify-between p-6">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-widest">
              <span>⭐</span> MOMENTO ESTELAR DE LA NOCHE <span>⭐</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              La Foto Más Querida de la Fiesta
            </h2>
          </div>

          {/* Center: Top Image */}
          <div className="relative flex-1 w-full max-w-2xl my-4 rounded-xl overflow-hidden shadow-2xl border border-amber-300/30 bg-black/50">
            <NextImage
              src={topLikedPost.imageUrl}
              alt="Foto más querida"
              fill
              className="object-contain"
              unoptimized
              priority
            />
            <div className="absolute top-4 right-4 bg-red-600/95 text-white px-4 py-2 rounded-full font-black text-lg shadow-lg flex items-center gap-2 backdrop-blur-sm animate-pulse">
              <span>❤️</span> {topLikedPost.likes} {topLikedPost.likes === 1 ? 'corazón' : 'corazones'}
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 text-white text-center">
              <p className="text-lg font-bold">
                {topLikedPost.caption || topLikedPost.dedication || '¡El momento más votado por todos!'}
              </p>
            </div>
          </div>

          {/* Footer: Participación colectiva */}
          <div className="w-full max-w-2xl flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white">
            <div className="text-left">
              <p className="text-xs uppercase font-black text-amber-400 tracking-wider">
                Mesas con más buena onda
              </p>
              <p className="text-sm font-semibold text-slate-300">
                {participatingGroups.length > 0
                  ? participatingGroups.map(([mesa, count]) => `${mesa} (${count} momentos)`).join(' • ')
                  : '¡Gracias a todas las mesas por festejar con nosotros!'}
              </p>
            </div>
            <div className="text-xs font-bold text-amber-300/80 shrink-0">
              🎉 ¡Festejamos juntos!
            </div>
          </div>
        </div>
        {qrUrl && <QRFloatingCard qrUrl={qrUrl} settings={settings} />}
      </div>
    );
  }

  const isCinema = settings?.cinemaMode === true;
  const accentColor = settings?.accentColor || '#fbbf24';

  return (
    <div className={`absolute inset-0 flex items-center justify-center overflow-hidden bg-slate-950 ${isCinema ? 'p-0' : 'p-4 sm:p-6 md:p-8'}`}>
      {!mediaLoaded && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-slate-950 text-sm text-white/60">
          Cargando publicación...
        </div>
      )}

      {/* ── FONDO AMBIENTAL DIFUMINADO (Bloque 7: Fotos verticales sin deformar) ── */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.imageUrl}
          alt=""
          className="w-full h-full object-cover opacity-30 filter blur-3xl scale-125 select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/80" />
      </div>

      {/* ── CONTENEDOR PRINCIPAL CON EFECTO KEN BURNS (Bloque 7: Movimiento suave) ── */}
      <motion.div
        key={post.id}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{
          opacity: 1,
          scale: settings?.kenBurnsEffect !== false ? [1, 1.05] : 1,
          x: settings?.kenBurnsEffect !== false ? [0, currentIndex % 2 === 0 ? 10 : -10] : 0,
          y: settings?.kenBurnsEffect !== false ? [0, currentIndex % 3 === 0 ? 8 : -8] : 0,
        }}
        exit={{ opacity: 0 }}
        transition={{
          opacity: { duration: 0.7 },
          scale: { duration: 7, ease: 'linear' },
          x: { duration: 7, ease: 'linear' },
          y: { duration: 7, ease: 'linear' },
        }}
        className="relative z-10 w-full h-full flex items-center justify-center"
      >
        <div
          className={`relative max-w-full max-h-full flex items-center justify-center ${
            isMission ? 'ring-4 ring-amber-400/90 shadow-[0_0_50px_rgba(251,191,36,0.5)] rounded-2xl' : ''
          }`}
        >
          {isMission && (
            <div className="absolute top-4 inset-x-0 mx-auto max-w-md bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-amber-950 font-black text-center py-2 px-6 rounded-full uppercase tracking-widest text-sm shadow-xl z-30">
              ⭐ Misión Cumplida ⭐
            </div>
          )}

          {isVideo ? (
            <video
              src={post.imageUrl}
              className={`max-h-[85vh] max-w-[94vw] object-contain rounded-2xl shadow-2xl border border-white/10 ${
                isCinema ? 'max-h-[92vh] max-w-[96vw]' : ''
              }`}
              autoPlay
              muted
              playsInline
              preload="auto"
              onPlay={() => setMediaLoaded(true)}
              onLoadedData={() => setMediaLoaded(true)}
              onEnded={advance}
            />
          ) : (
            <div
              className={`relative max-h-[85vh] max-w-[94vw] overflow-hidden rounded-2xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.85)] bg-black/40 ${
                isCinema ? 'max-h-[92vh] max-w-[96vw]' : ''
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.imageUrl}
                alt={post.authorName || 'Foto de la fiesta'}
                className="max-h-[85vh] max-w-[94vw] object-contain rounded-2xl"
                onLoad={() => setMediaLoaded(true)}
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* ── TEXTOS A 5 METROS Y MÁRGENES DE SEGURIDAD (Bloque 7) ── */}
      <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none p-8 sm:p-12 md:p-16 bg-gradient-to-t from-black/95 via-black/60 to-transparent">
        <div className="max-w-5xl mx-auto space-y-2 text-left">
          {captionText && (
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
              "{captionText}"
            </h2>
          )}
          <div className="flex items-center gap-3 pt-1">
            <span
              className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-widest drop-shadow-md"
              style={{ color: accentColor }}
            >
              — {post.authorName || 'Invitado'}
            </span>
            {post.likes && post.likes > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-600/90 text-white text-sm sm:text-base font-black shadow-lg">
                ❤️ {post.likes} {post.likes === 1 ? 'corazón' : 'corazones'}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Indicador de progreso de fotos en el carrusel */}
      {posts.length > 1 && posts.length <= 16 && (
        <div className="absolute left-8 top-8 z-30 flex gap-2 pointer-events-none">
          {posts.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? 'w-8 bg-white shadow-md'
                  : 'w-3 bg-white/30'
              }`}
              style={i === currentIndex ? { backgroundColor: accentColor } : undefined}
            />
          ))}
        </div>
      )}

      {/* Tarjeta flotante de QR (Oculta en Modo Cine) */}
      {!isCinema && qrUrl && <QRFloatingCard qrUrl={qrUrl} settings={settings} />}
    </div>
  );
}

function MasonryLayout({
  posts,
  qrUrl = '',
  settings = { enabled: true }
}: {
  posts: SocialGalleryPost[];
  qrUrl?: string;
  settings?: any;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black p-5">
      <div className="grid h-full grid-cols-2 gap-3 lg:grid-cols-3">
        {posts.slice(0, 6).map((post, index) => (
          <MasonryCard key={post.id} post={post} index={index} />
        ))}
      </div>
      {qrUrl && <QRFloatingCard qrUrl={qrUrl} settings={settings} />}
    </div>
  );
}

function MasonryCard({ post, index }: { post: SocialGalleryPost; index: number }) {
  const [imgError, setImgError] = useState(false);
  const isVideo = post.mediaType === 'video' || isVideoUrl(post.imageUrl);
  const isMission = post.momentTag?.toLowerCase().includes('misión') || post.momentTag?.toLowerCase().includes('mision') || post.caption?.toLowerCase().includes('misión') || post.caption?.toLowerCase().includes('mision') || post.dedication?.toLowerCase().includes('misión') || post.dedication?.toLowerCase().includes('mision');

  return (
    <article
      className={`relative mb-4 break-inside-avoid overflow-hidden rounded-xl bg-slate-900 shadow-xl ${isMission ? 'ring-4 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]' : ''}`}
      style={{
        animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
      }}
    >
      {isMission && (
        <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-amber-950 font-black text-center py-1 uppercase tracking-widest text-[10px] shadow-sm z-10">
          ⭐ Misión Secreta ⭐
        </div>
      )}
      <div className={`relative ${isMission ? 'pt-6' : ''}`}>
        {post.mediaType === 'video' || isVideoUrl(post.imageUrl) ? (
          <video
            src={post.imageUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full"
            onError={() => setImgError(true)}
          />
        ) : !imgError ? (
          <NextImage
            src={post.imageUrl}
            alt={post.authorName}
            fill
            sizes="(max-width: 1920px) 33vw"
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <span className="text-4xl opacity-20">📷</span>
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-black/75 px-3 py-2 z-10">
        <p className="truncate text-sm font-semibold text-white">{post.authorName}</p>
      </div>
    </article>
  );
}

// ─────────────────────────── GAME COMPONENTS ───────────────────────────

const GAME_TYPE_META: Record<string, { emoji: string; label: string; bg: string }> = {
  siONo:           { emoji: '🤔', label: '¿Sí o No?',           bg: 'from-violet-900 via-indigo-900 to-purple-900' },
  trivia:          { emoji: '🧠', label: 'Trivia',               bg: 'from-blue-900 via-cyan-900 to-teal-900' },
  encuesta:        { emoji: '📊', label: 'Encuesta',             bg: 'from-amber-900 via-orange-900 to-slate-950' },
  baileLibre:      { emoji: '🕺', label: '¡Baile libre!',        bg: 'from-fuchsia-900 via-indigo-900 to-slate-950' },
  verdadODesafio:  { emoji: '🎯', label: 'Verdad o Desafío',     bg: 'from-green-900 via-emerald-900 to-teal-900' },
  preguntaAbierta: { emoji: '💬', label: 'Pregunta abierta',     bg: 'from-slate-800 via-slate-900 to-neutral-900' },
};

const MAX_GAME_OPTIONS_PER_ROW = 2;

/** Full-screen game slide for 'juego' playlist items */
function GameSlide({
  game,
  posts,
  qrUrl = '',
  settings = { enabled: true }
}: {
  game: ActiveGameData;
  posts: SocialGalleryPost[];
  qrUrl?: string;
  settings?: any;
}) {
  const meta = GAME_TYPE_META[game.type] ?? { emoji: '🎮', label: 'Juego', bg: 'from-slate-900 to-slate-800' };

  const [timeLeft, setTimeLeft] = useState(15);
  useEffect(() => {
    if (game.type !== 'trivia' || !game.launchedAt || game.isFinished) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(game.launchedAt).getTime()) / 1000);
      setTimeLeft(Math.max(0, 15 - elapsed));
    }, 1000);
    return () => clearInterval(interval);
  }, [game.type, game.launchedAt, game.isFinished]);

  if (game.type === 'trivia' && game.tableLeaderboard && game.isFinished) {
    return (
      <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${meta.bg}`}>
        <div className="w-full max-w-5xl px-12 text-center">
          <motion.h1 className="text-[6vw] font-black leading-tight text-white mb-12 drop-shadow-lg">
            Podio por Mesa 🏆
          </motion.h1>
          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            {game.tableLeaderboard.slice(0, 5).map((t, idx) => (
              <motion.div
                key={t.tableNumber}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.2 }}
                className={`rounded-3xl border-2 flex items-center justify-between px-8 py-5 backdrop-blur-sm ${idx === 0 ? 'bg-amber-400/20 border-amber-400/50 shadow-[0_0_30px_rgba(251,191,36,0.3)]' : idx === 1 ? 'bg-slate-300/20 border-slate-300/50' : idx === 2 ? 'bg-amber-700/20 border-amber-700/50' : 'bg-white/5 border-white/20'}`}
              >
                <span className="text-[3vw] font-black text-white drop-shadow-md">Mesa {t.tableNumber}</span>
                <span className="text-[3vw] font-black text-yellow-300 drop-shadow-md">{t.score} pts</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // baileLibre: show a fun full-screen dance overlay with photo wall behind
  if (game.type === 'baileLibre') {
    return (
      <div className="absolute inset-0">
        {posts.length > 0 && <MasonryLayout posts={posts} qrUrl={qrUrl} settings={settings} />}
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-6 overflow-hidden">
          {/* Pulsing colored lights */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full opacity-20 pointer-events-none"
              style={{
                width: `${200 + i * 80}px`,
                height: `${200 + i * 80}px`,
                background: ['#f43f5e', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ec4899'][i],
                left: `${[10, 70, 40, 5, 80, 50][i]}%`,
                top: `${[20, 15, 60, 70, 65, 40][i]}%`,
              }}
              animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.35, 0.15] }}
              transition={{ duration: 1.5 + i * 0.3, repeat: Infinity, repeatType: 'loop', delay: i * 0.25 }}
            />
          ))}
          {/* Floating emojis */}
          {['🕺', '💃', '🎵', '🎶', '✨', '🔥', '💫', '🎉'].map((emoji, i) => (
            <motion.div
              key={emoji}
              className="absolute text-4xl pointer-events-none"
              style={{ left: `${10 + i * 11}%`, bottom: '-10%' }}
              animate={{ y: [0, -1000] }}
              transition={{ duration: 4 + (i % 3), repeat: Infinity, delay: i * 0.6, ease: 'linear' }}
            >
              {emoji}
            </motion.div>
          ))}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: [1, 1.08, 0.96, 1], rotate: [-3, 3, -3] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatType: 'loop' }}
            className="text-[14vw] leading-none relative z-10"
          >
            {meta.emoji}
          </motion.div>
          <h1 className="text-[8vw] font-black uppercase text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] text-center relative z-10">
            {game.title}
          </h1>
          {game.subtitle && (
            <motion.p
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-[3vw] text-white/80 font-semibold text-center max-w-4xl relative z-10"
            >
              {game.subtitle}
            </motion.p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${meta.bg}`}>
      <div className="w-full max-w-5xl px-12 text-center">
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 text-base font-black tracking-[0.5em] text-yellow-300 uppercase"
        >
          {meta.emoji} {meta.label}
        </motion.p>
        <motion.h1
          key={game.title}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-[5.5vw] font-black leading-tight text-white mb-8"
        >
          {game.title}
        </motion.h1>
        {game.subtitle && (
          <p className="text-[2.5vw] text-white/70 font-semibold mb-10">{game.subtitle}</p>
        )}
        {game.type === 'trivia' && !game.correctOptionId && !game.isFinished && (
           <div className="absolute top-10 right-10 flex items-center justify-center w-32 h-32 rounded-full border-4 border-yellow-300/50 bg-black/40 backdrop-blur-md shadow-2xl">
             <span className={`text-6xl font-black ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-yellow-300'}`}>{timeLeft}</span>
           </div>
        )}
        {game.options && game.options.length > 0 && (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(game.options.length, MAX_GAME_OPTIONS_PER_ROW)}, 1fr)` }}>
            {game.options.map((option, idx) => {
              const totalVotes = (game.options ?? []).reduce((s, o) => s + (o.votes ?? 0), 0);
              const pct = totalVotes > 0 ? Math.round(((option.votes ?? 0) / totalVotes) * 100) : 0;
              const isCorrect = option.id === game.correctOptionId;
              const isWrong = game.correctOptionId && option.id !== game.correctOptionId;
              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className={`rounded-3xl border-2 ${isCorrect ? 'border-emerald-500/80 bg-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.3)]' : isWrong ? 'border-rose-500/30 bg-rose-500/10 opacity-50' : 'border-white/30 bg-white/10'} px-8 py-5 backdrop-blur-sm overflow-hidden relative`}
                >
                  {/* Progress bar background */}
                  <div
                    className="absolute inset-0 rounded-3xl bg-yellow-400/20 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                  <p className="text-[2.8vw] font-black text-white relative z-10">
                    {option.emoji && <span className="mr-3">{option.emoji}</span>}
                    {option.text}
                  </p>
                  {totalVotes > 0 && (
                    <p className="mt-1 text-yellow-300 text-[1.8vw] font-black relative z-10">
                      {pct}% · {option.votes ?? 0} votos
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Compact overlay shown when a game is active on non-juego slides */
function GameOverlayContent({ game }: { game: ActiveGameData }) {
  const meta = GAME_TYPE_META[game.type] ?? { emoji: '🎮', label: 'Juego', bg: '' };
  const totalVotes = (game.options ?? []).reduce((s, o) => s + (o.votes ?? 0), 0);
  return (
    <>
      <p className="mb-3 text-center text-sm font-black tracking-[0.35em] text-yellow-300 uppercase">
        {meta.emoji} {meta.label}
      </p>
      <h2 className="mb-4 text-center text-3xl font-black leading-tight text-white">{game.title}</h2>
      {game.subtitle && (
        <p className="mb-4 text-center text-lg text-white/70">{game.subtitle}</p>
      )}
      {game.options && game.options.length > 0 && (
        <div className="space-y-2 w-full">
          {game.options.map((option) => {
            const pct = totalVotes > 0 ? Math.round(((option.votes ?? 0) / totalVotes) * 100) : 0;
            return (
              <div key={option.id} className="relative rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white text-xl font-bold overflow-hidden">
                <div className="absolute inset-0 bg-yellow-400/20 transition-all duration-700" style={{ width: `${pct}%` }} />
                <div className="relative z-10 flex justify-between items-center">
                  <span>
                    {option.emoji && <span className="mr-2">{option.emoji}</span>}
                    {option.text}
                  </span>
                  {totalVotes > 0 && <span className="text-yellow-300 text-sm font-black ml-2">{pct}%</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
