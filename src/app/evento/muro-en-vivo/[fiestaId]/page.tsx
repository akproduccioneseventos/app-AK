'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { getSocialPosts, getChatMessages } from '@/app/actions/social-gallery';
import type { SocialGalleryPost, Dedication, SocialComment, ChatMessage } from '@/types/social-gallery';
import { motion, AnimatePresence } from 'framer-motion';
import NextImage from 'next/image';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getActivePoll, getDedications } from '@/app/actions/social-interactive';
import { getCompanyInfo, getInvoiceTemplateSettings } from '@/app/actions/settings';
import { getSocialConnections } from '@/app/actions/social-connections';
import type { ActiveGameData, ScreenPlaylistItem, SocialGallerySettings, SocialGalleryBrand } from '@/types/fiesta';
import { DEFAULT_MARKETING_TICKER_TEXT } from '@/lib/social-wall-defaults';
import type { SocialConnection } from '@/types/settings';
import { Facebook, Instagram, MessageCircle, Music2, Maximize } from 'lucide-react';

const REFRESH_INTERVAL_MS = 2000;
const MOMENT_DISPLAY_DURATION_MS = 15000;
const SORTEO_DISPLAY_DURATION_MS = 20000;
/** Window in which a sorteo spin animation is shown on the big screen (before the winner is revealed) */
const SORTEO_SPIN_DISPLAY_DURATION_MS = 7000;
const FRESH_POST_POLAROID_DURATION_MS = 20000;
const MARQUEE_REPEAT_COUNT = 3;
const LED_MARQUEE_ANIMATION_CLASS = 'animate-[marquee_22s_linear_infinite]';
const MARKETING_MARQUEE_ANIMATION_CLASS = 'animate-[marquee_28s_linear_infinite]';
const GAME_OVERLAY_CLASS =
  'w-full flex flex-col items-center justify-center gap-5';

type MomentData = { id: string; nombre: string; emoji: string; timestamp: string };
type PollData = { id: string; question: string; options: { id: string; text: string; votes: number }[] };

function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}


export default function MuroEnVivoPage() {
  const params = useParams();
  const fiestaId = params.fiestaId as string;

  const [posts, setPosts] = useState<SocialGalleryPost[]>([]);
  const [eventName, setEventName] = useState<string>('');
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
  const [sorteoActiveOnScreen, setSorteoActiveOnScreen] = useState(false);
  const [sorteoSpinActive, setSorteoSpinActive] = useState(false);
  const [sorteoSpinWheelAngle, setSorteoSpinWheelAngle] = useState(0);
  const [highlightedDedications, setHighlightedDedications] = useState<Dedication[]>([]);
  const [highlightedComments, setHighlightedComments] = useState<{ postId: string; comment: SocialComment }[]>([]);
  const [liveChatMessages, setLiveChatMessages] = useState<ChatMessage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [localPlaylistIndex, setLocalPlaylistIndex] = useState(0);
  const [playlistTick, setPlaylistTick] = useState<number>(Date.now());

  const postsRef = useRef<SocialGalleryPost[]>([]);

  const fetchData = useCallback(async () => {
    if (!fiestaId) return;
    try {
      const [fetchedPosts, fiestaData, pollData, companyInfo, templateSettings, connections, dedicationsData, chatData] = await Promise.all([
        getSocialPosts(fiestaId),
        getFiestaById(fiestaId),
        getActivePoll(fiestaId),
        getCompanyInfo(),
        getInvoiceTemplateSettings(),
        getSocialConnections(),
        getDedications(fiestaId),
        getChatMessages(fiestaId),
      ]);

      const sorted = [...fetchedPosts].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Update if post count or the latest post ID changes
      const latestId = sorted[0]?.id ?? '';
      const prevLatestId = postsRef.current[0]?.id ?? '';
      if (sorted.length !== postsRef.current.length || latestId !== prevLatestId) {
        postsRef.current = sorted;
        setPosts(sorted);
      }

      if (fiestaData && !eventName) {
        setEventName(fiestaData.configuracion?.nombreEvento || '');
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

        // Sorteo winner display (TTL: SORTEO_DISPLAY_DURATION_MS)
        const sorteoTs = fiestaData.socialGallerySettings.activeSorteoTimestamp;
        const sorteoWinner = fiestaData.socialGallerySettings.activeSorteoWinner;
        const sorteoIsFresh =
          sorteoTs && sorteoWinner &&
          Date.now() - new Date(sorteoTs).getTime() < SORTEO_DISPLAY_DURATION_MS;
        setActiveSorteoWinner(sorteoIsFresh ? sorteoWinner : null);

        // Sorteo on-screen flag: show wheel waiting for spin
        setSorteoActiveOnScreen(!!fiestaData.socialGallerySettings.sorteoActiveOnScreen && !sorteoIsFresh);

        // Sorteo spin animation (shows wheel spinning on big screen)
        const spinTs = fiestaData.socialGallerySettings.sorteoSpinStartedAt;
        const spinIsFresh = spinTs && Date.now() - new Date(spinTs).getTime() < SORTEO_SPIN_DISPLAY_DURATION_MS;
        if (spinIsFresh && !sorteoIsFresh) {
          setSorteoSpinActive(true);
          setSorteoSpinWheelAngle(prev => prev + 3600 + Math.floor(Math.random() * 1440));
          setTimeout(() => setSorteoSpinActive(false), 6500);
        }
      }
      if (pollData) {
        setActivePoll({ id: pollData.id, question: pollData.question, options: pollData.options });
      } else {
        setActivePoll(null);
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
      // Show the 5 most recent live chat messages on the big screen
      const recentChat = [...(chatData ?? [])].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 5).reverse();
      setLiveChatMessages(recentChat);
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
      // Silent fail for projection wall
    } finally {
      if (!isLoaded) setIsLoaded(true);
    }
  }, [fiestaId, eventName, isLoaded]);

  // Initial load and polling
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  const enabledPlaylist = (settings.screenMode?.playlist ?? []).filter((item) => item.enabled);
  const activeScreenItem: ScreenPlaylistItem | null = enabledPlaylist.length > 0
    ? enabledPlaylist[localPlaylistIndex % enabledPlaylist.length]
    : null;

  useEffect(() => {
    if (typeof settings.screenMode?.currentItemIndex === 'number') {
      setLocalPlaylistIndex(settings.screenMode.currentItemIndex);
    }
  }, [settings.screenMode?.currentItemIndex]);

  useEffect(() => {
    if (!settings.screenMode?.isPlaying) return;
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
  }, [activeScreenItem, enabledPlaylist.length, settings.screenMode?.isPlaying, settings.screenMode?.loop, playlistTick]);

  // Whether to show a right side panel (poll or game overlay)
  const hasSidePanel =
    (activeGame !== null && activeScreenItem?.type !== 'juego') ||
    (activePoll !== null && settings.showPolls !== false && !activeGame);

  return (
    <div className={`fixed inset-0 overflow-hidden select-none flex flex-col ${settings.screenDarkMode !== false ? 'bg-slate-950' : 'bg-white'}`}>
      {/* Ambient gradient background */}
      {settings.screenDarkMode !== false ? (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(120,60,200,0.15),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(20,100,200,0.12),transparent_60%)]" />
      ) : (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(120,60,200,0.05),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(20,100,200,0.05),transparent_60%)]" />
      )}

      {/* Header bar — in flow so it doesn't float over content */}
      <header className={`relative z-20 shrink-0 flex items-center justify-between px-8 py-3 backdrop-blur-sm border-b ${settings.screenDarkMode !== false ? 'bg-slate-950/90 border-white/10' : 'bg-white/90 border-slate-200'}`}>
        <div className="flex items-center gap-3">
          {companyLogoUrl && (
            <div className="relative h-8 w-20 overflow-hidden rounded bg-white/90 p-1">
              <NextImage src={companyLogoUrl} alt={`Logo de ${companyName}`} fill className="object-contain" />
            </div>
          )}
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className={`text-sm font-medium tracking-widest uppercase ${settings.screenDarkMode !== false ? 'text-white/60' : 'text-slate-500'}`}>En Vivo</span>
        </div>
        {eventName && (
          <span className={`text-sm font-semibold tracking-wide ${settings.screenDarkMode !== false ? 'text-white/40' : 'text-slate-400'}`}>{eventName}</span>
        )}
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen?.().catch(() => {});
              } else {
                document.exitFullscreen?.().catch(() => {});
              }
            }}
            className={`p-1.5 rounded-lg transition-colors ${settings.screenDarkMode !== false ? 'text-white/40 hover:text-white/80 hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
            title="Pantalla completa"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </header>

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
          {isLoaded && (activeScreenItem?.type !== 'video' && activeScreenItem?.type !== 'redes' && activeScreenItem?.type !== 'juego') && posts.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
              <div className="text-8xl opacity-20">📸</div>
              <div className="text-center space-y-2">
                <p className={`text-2xl font-light tracking-widest uppercase ${settings.screenDarkMode !== false ? 'text-white/50' : 'text-slate-400'}`}>Muro Social</p>
                <p className={`text-base ${settings.screenDarkMode !== false ? 'text-white/30' : 'text-slate-300'}`}>Las fotos de los invitados aparecerán aquí.</p>
              </div>
            </div>
          )}

          {/* Mural / photo slideshow */}
          {isLoaded && (!activeScreenItem || activeScreenItem.type === 'mural') && posts.length > 0 && (
            <SlideshowLayout posts={posts} />
          )}

          {/* Juego slide */}
          {isLoaded && activeScreenItem?.type === 'juego' && (
            activeGame
              ? <GameSlide game={activeGame} posts={posts} />
              : posts.length > 0
                ? <SlideshowLayout posts={posts} />
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
            <ScreenMediaSlide item={activeScreenItem} fallbackPosts={posts} />
          )}

          {/* Redes slide */}
          {isLoaded && activeScreenItem?.type === 'redes' && (
            <SocialTemplateSlide item={activeScreenItem} eventName={eventName} brand={settings.brand} />
          )}

          {/* Dedications overlay — left side, only shown when no side panel */}
          {isLoaded && highlightedDedications.length > 0 && !activePoll && !hasSidePanel && (
            <div className="absolute left-6 top-6 z-10 w-[32vw] max-w-sm space-y-3">
              {highlightedDedications.slice(0, 3).map(d => (
                <div key={d.id} className="rounded-2xl border border-amber-300/60 bg-black/70 px-5 py-4 shadow-lg backdrop-blur-md">
                  <p className="text-base font-semibold leading-snug text-white">"{d.message}"</p>
                  <p className="mt-1.5 text-xs font-bold tracking-widest text-amber-300 uppercase">— {d.authorName}</p>
                </div>
              ))}
            </div>
          )}

          {/* Comments overlay — left side, only shown when no side panel and no dedications */}
          {isLoaded && highlightedComments.length > 0 && settings.allowComments && !activePoll && highlightedDedications.length === 0 && !hasSidePanel && (
            <div className="absolute left-6 top-6 z-10 w-[32vw] max-w-sm space-y-3">
              {highlightedComments.slice(0, 3).map(({ comment }) => (
                <div key={comment.id} className="rounded-2xl border border-sky-300/60 bg-black/70 px-5 py-4 shadow-lg backdrop-blur-md">
                  <p className="text-base font-semibold leading-snug text-white">"{comment.text}"</p>
                  <p className="mt-1.5 text-xs font-bold tracking-widest text-sky-300 uppercase">— {comment.authorName}</p>
                </div>
              ))}
            </div>
          )}

          {/* Live chat overlay — shown when chat is enabled and there are messages, and no dedications/comments */}
          {(() => {
            const shouldShowLiveChat =
              isLoaded &&
              liveChatMessages.length > 0 &&
              settings.chatEnabled !== false &&
              !activePoll &&
              highlightedDedications.length === 0 &&
              highlightedComments.length === 0 &&
              !hasSidePanel;
            if (!shouldShowLiveChat) return null;
            return (
              <div className="absolute left-6 top-6 z-10 w-[32vw] max-w-sm space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sky-300 mb-3">💬 Chat en Vivo</p>
                {liveChatMessages.map(msg => (
                  <div key={msg.id} className="rounded-2xl border border-sky-300/40 bg-black/70 px-4 py-3 shadow-lg backdrop-blur-md">
                    <p className="text-sm font-semibold leading-snug text-white">{msg.text}</p>
                    <p className="mt-1 text-[10px] font-bold tracking-widest text-sky-300 uppercase">— {msg.authorName}</p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* ── Right side panel: poll or game overlay ── */}
        {hasSidePanel && isLoaded && (
          <div className="w-[38%] shrink-0 flex flex-col items-center justify-center gap-5 p-6 bg-black/65 border-l border-white/10 backdrop-blur-md overflow-y-auto">
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

      {/* ── Bottom bar — in flow ── */}
      <div className="relative z-30 shrink-0">
        {socialConnections.length > 0 && (
          <div className={`flex items-center justify-center gap-6 border-t px-6 py-2.5 backdrop-blur-sm ${settings.screenDarkMode !== false ? 'border-white/10 bg-black/70' : 'border-slate-200 bg-white/80'}`}>
            {socialConnections.map((connection) => {
              const Icon = connection.platform === 'Instagram'
                ? Instagram
                : connection.platform === 'Facebook'
                ? Facebook
                : connection.platform === 'TikTok'
                ? Music2
                : MessageCircle;
              const handle = connection.username || connection.phoneNumber || '';
              return (
                <div key={connection.platform} className={`flex items-center gap-2 ${settings.screenDarkMode !== false ? 'text-white/90' : 'text-slate-700'}`}>
                  <Icon className={`h-5 w-5 flex-shrink-0 ${settings.screenDarkMode !== false ? 'text-white/70' : 'text-slate-500'}`} />
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-bold">{handle || connection.platform}</span>
                    <span className={`text-[10px] uppercase tracking-wider ${settings.screenDarkMode !== false ? 'text-white/50' : 'text-slate-400'}`}>Suscríbete</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
              style={{ color: settings.ledMarqueeColor || '#f0abfc' }}
            >
              {renderMarqueeText(settings.ledMarqueeText)}
            </div>
          </div>
        )}
        {settings.marketingTickerEnabled !== false && (settings.marketingTickerText || companyMarketingText) && (
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
              style={{ color: settings.marketingTickerColor || '#e0f2fe' }}
            >
              {renderMarqueeText(settings.marketingTickerText || companyMarketingText)}
            </div>
          </div>
        )}
      </div>

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

        {/* Sorteo "ready" overlay — shows when the operator transferred the sorteo to screen
            but hasn't pressed "Girar" yet.  Gives the audience a moment to see the wheel. */}
        <AnimatePresence>
          {sorteoActiveOnScreen && !sorteoSpinActive && !activeSorteoWinner && (
            <motion.div
              key="sorteo-ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[44] flex flex-col items-center justify-center bg-black/85 text-center"
            >
              <motion.p
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mb-6 text-2xl font-black uppercase tracking-[0.5em] text-yellow-300"
              >
                🎲 ¡Sorteo Sorpresa! 🎲
              </motion.p>
              {/* Static wheel */}
              <div className="relative w-72 h-72">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 w-0 h-0"
                  style={{ borderLeft: '14px solid transparent', borderRight: '14px solid transparent', borderTop: '28px solid #eab308' }} />
                <div
                  className="w-72 h-72 rounded-full border-8 border-yellow-400 shadow-2xl"
                  style={{ background: 'conic-gradient(#f43f5e, #f97316, #eab308, #22c55e, #06b6d4, #6366f1, #ec4899, #f43f5e, #f97316, #eab308, #22c55e, #06b6d4)' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white border-4 border-yellow-400 flex items-center justify-center shadow-inner">
                    <span className="text-2xl font-black text-yellow-600">AK</span>
                  </div>
                </div>
              </div>
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="mt-8 text-xl font-bold text-white/80"
              >
                ⏳ Esperando el giro…
              </motion.p>
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
              className="absolute inset-0 z-[45] flex flex-col items-center justify-center bg-black/85 text-center"
            >
              <p className="mb-6 text-2xl font-black uppercase tracking-[0.5em] text-yellow-300">🎰 ¡Sorteando! 🎰</p>
              {/* SVG Wheel */}
              <div className="relative w-72 h-72">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 w-0 h-0"
                  style={{ borderLeft: '14px solid transparent', borderRight: '14px solid transparent', borderTop: '28px solid #eab308' }} />
                <div
                  className="w-72 h-72 rounded-full border-8 border-yellow-400 shadow-2xl"
                  style={{
                    transform: `rotate(${sorteoSpinWheelAngle}deg)`,
                    transition: 'transform 6s cubic-bezier(0.17, 0.67, 0.12, 0.99)',
                    background: 'conic-gradient(#f43f5e, #f97316, #eab308, #22c55e, #06b6d4, #6366f1, #ec4899, #f43f5e, #f97316, #eab308, #22c55e, #06b6d4)',
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white border-4 border-yellow-400 flex items-center justify-center shadow-inner">
                    <span className="text-2xl font-black text-yellow-600">AK</span>
                  </div>
                </div>
              </div>
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="mt-6 text-xl font-bold text-white/70"
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

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
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

function ScreenMediaSlide({ item, fallbackPosts }: { item: ScreenPlaylistItem; fallbackPosts: SocialGalleryPost[] }) {
  if (!item.mediaUrl) {
    // No media uploaded: show slideshow if there are posts, otherwise a placeholder
    if (fallbackPosts.length > 0) {
      return <SlideshowLayout posts={fallbackPosts} />;
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
      {isVideo ? (
        <video
          src={item.mediaUrl}
          autoPlay
          muted
          loop
          playsInline
          className={portrait ? 'h-full w-auto max-w-full object-cover' : 'w-full h-full object-cover'}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.mediaUrl}
          alt={item.title}
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

const SLIDESHOW_DURATION_MS = 6000;

function SlideshowLayout({ posts }: { posts: SocialGalleryPost[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const prevLengthRef = useRef(posts.length);

  // When a new post arrives (length increases), jump to the newest photo (index 0)
  useEffect(() => {
    if (posts.length > prevLengthRef.current) {
      setCurrentIndex(0);
    }
    prevLengthRef.current = posts.length;
  }, [posts.length]);

  // Auto-advance slideshow
  useEffect(() => {
    if (posts.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % posts.length);
    }, SLIDESHOW_DURATION_MS);
    return () => clearInterval(timer);
  }, [posts.length]);

  if (posts.length === 0) return null;

  const post = posts[currentIndex] ?? posts[0];

  return (
    <div className="absolute inset-0 bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={post.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <NextImage
            src={post.imageUrl}
            alt={post.authorName}
            fill
            className="object-cover"
            unoptimized
            priority
          />
          {/* Slide counter dots — only shown when posts fit within the dot limit */}
          {posts.length > 1 && posts.length <= 12 && (
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
              {posts.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentIndex
                      ? 'w-6 bg-white'
                      : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function MasonryLayout({ posts }: { posts: SocialGalleryPost[] }) {
  const numCols = Math.min(posts.length, 3);

  // For 1 or 2 posts use a simple non-scrolling layout; for 3+ use the scrolling masonry.
  if (numCols < 3) {
    return (
      <div className="absolute inset-0 pt-14 pb-16 px-3 flex items-center justify-center">
        <div
          className="h-full w-full grid gap-3"
          style={{ gridTemplateColumns: `repeat(${numCols}, 1fr)` }}
        >
          {posts.map((post, i) => (
            <MasonryCard key={post.id} post={post} index={i} />
          ))}
        </div>
      </div>
    );
  }

  // 3+ photos: scrolling masonry with 3 columns
  const columns = [0, 1, 2].map(colIndex =>
    posts.filter((_, i) => i % 3 === colIndex)
  );

  return (
    <div className="absolute inset-0 pt-14 pb-4 px-3 overflow-hidden">
      <div className="h-full grid grid-cols-3 gap-3">
        {columns.map((colPosts, colIndex) => (
          <div
            key={colIndex}
            className="flex flex-col gap-3 overflow-hidden"
            style={{
              animationName: colIndex % 2 === 0 ? 'scrollUp' : 'scrollDown',
              animationDuration: `${30 + colIndex * 10}s`,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
            }}
          >
            {/* Duplicate for seamless loop */}
            {[...colPosts, ...colPosts].map((post, i) => (
              <MasonryCard key={`${post.id}-${i}`} post={post} index={i} />
            ))}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes scrollUp {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes scrollDown {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function MasonryCard({ post, index }: { post: SocialGalleryPost; index: number }) {
  const [imgError, setImgError] = useState(false);
  const isFreshPost = Date.now() - new Date(post.timestamp).getTime() < FRESH_POST_POLAROID_DURATION_MS;
  const polaroidRotation = ((index % 7) - 3) * 1.8;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.05 }}
      className="relative overflow-hidden bg-slate-900 shadow-2xl flex-shrink-0 group rounded-xl"
      style={{
        aspectRatio: index % 3 === 0 ? '4/5' : index % 3 === 1 ? '1/1' : '3/4',
        transform: isFreshPost ? `rotate(${polaroidRotation}deg)` : undefined,
        border: isFreshPost ? '10px solid rgba(255,255,255,0.95)' : undefined,
        borderBottomWidth: isFreshPost ? '24px' : undefined,
      }}
    >
      {!imgError ? (
        <NextImage
          src={post.imageUrl}
          alt={post.authorName}
          fill
          sizes="(max-width: 1920px) 33vw"
          className="object-cover transition-transform duration-[8000ms] group-hover:scale-105"
          onError={() => setImgError(true)}
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <span className="text-4xl opacity-20">📷</span>
        </div>
      )}

      {/* Gradient overlay with author name */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
        <p className="text-white text-xs font-semibold truncate">{post.authorName}</p>
      </div>

      {/* New post flash effect */}
      <AnimatePresence>
        {isFreshPost && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 2, delay: 1 }}
            className="absolute inset-0 border-2 border-white/60 rounded-2xl pointer-events-none"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────── GAME COMPONENTS ───────────────────────────

const GAME_TYPE_META: Record<string, { emoji: string; label: string; bg: string }> = {
  siONo:           { emoji: '🤔', label: '¿Sí o No?',           bg: 'from-violet-900 via-indigo-900 to-purple-900' },
  trivia:          { emoji: '🧠', label: 'Trivia',               bg: 'from-blue-900 via-cyan-900 to-teal-900' },
  encuesta:        { emoji: '📊', label: 'Encuesta',             bg: 'from-amber-900 via-orange-900 to-red-900' },
  baileLibre:      { emoji: '🕺', label: '¡Baile libre!',        bg: 'from-fuchsia-900 via-pink-900 to-rose-900' },
  verdadODesafio:  { emoji: '🎯', label: 'Verdad o Desafío',     bg: 'from-green-900 via-emerald-900 to-teal-900' },
  preguntaAbierta: { emoji: '💬', label: 'Pregunta abierta',     bg: 'from-slate-800 via-slate-900 to-neutral-900' },
};

const MAX_GAME_OPTIONS_PER_ROW = 2;

/** Full-screen game slide for 'juego' playlist items */
function GameSlide({ game, posts }: { game: ActiveGameData; posts: SocialGalleryPost[] }) {
  const meta = GAME_TYPE_META[game.type] ?? { emoji: '🎮', label: 'Juego', bg: 'from-slate-900 to-slate-800' };

  // baileLibre: show a fun full-screen dance overlay with photo wall behind
  if (game.type === 'baileLibre') {
    return (
      <div className="absolute inset-0">
        {posts.length > 0 && <MasonryLayout posts={posts} />}
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
        {game.options && game.options.length > 0 && (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(game.options.length, MAX_GAME_OPTIONS_PER_ROW)}, 1fr)` }}>
            {game.options.map((option, idx) => {
              const totalVotes = (game.options ?? []).reduce((s, o) => s + (o.votes ?? 0), 0);
              const pct = totalVotes > 0 ? Math.round(((option.votes ?? 0) / totalVotes) * 100) : 0;
              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className="rounded-3xl border-2 border-white/30 bg-white/10 px-8 py-5 backdrop-blur-sm overflow-hidden relative"
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

