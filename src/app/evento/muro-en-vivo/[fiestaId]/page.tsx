'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { getSocialPosts } from '@/app/actions/social-gallery';
import type { SocialGalleryPost, Dedication, SocialComment } from '@/types/social-gallery';
import { motion, AnimatePresence } from 'framer-motion';
import NextImage from 'next/image';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getActivePoll, getDedications } from '@/app/actions/social-interactive';
import { getCompanyInfo, getInvoiceTemplateSettings } from '@/app/actions/settings';
import { getSocialConnections } from '@/app/actions/social-connections';
import type { ActiveGameData, ScreenPlaylistItem, SocialGallerySettings, SocialGalleryBrand } from '@/types/fiesta';
import { DEFAULT_MARKETING_TICKER_TEXT } from '@/lib/social-wall-defaults';
import type { SocialConnection } from '@/types/settings';
import { Facebook, Instagram, MessageCircle, Music2 } from 'lucide-react';

const REFRESH_INTERVAL_MS = 2000;
const MOMENT_DISPLAY_DURATION_MS = 15000;
const SORTEO_DISPLAY_DURATION_MS = 20000;
const FRESH_POST_POLAROID_DURATION_MS = 20000;
const MARQUEE_REPEAT_COUNT = 3;
const LED_MARQUEE_ANIMATION_CLASS = 'animate-[marquee_22s_linear_infinite]';
const MARKETING_MARQUEE_ANIMATION_CLASS = 'animate-[marquee_28s_linear_infinite]';
const GAME_OVERLAY_CLASS =
  'absolute right-6 top-20 z-30 w-[38vw] max-w-3xl rounded-3xl border-2 border-yellow-300/70 bg-black/70 p-6 shadow-[0_0_60px_rgba(255,215,0,0.35)] backdrop-blur-md';

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
  const [highlightedDedications, setHighlightedDedications] = useState<Dedication[]>([]);
  const [highlightedComments, setHighlightedComments] = useState<{ postId: string; comment: SocialComment }[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [localPlaylistIndex, setLocalPlaylistIndex] = useState(0);
  const [playlistTick, setPlaylistTick] = useState<number>(Date.now());

  const postsRef = useRef<SocialGalleryPost[]>([]);

  const fetchData = useCallback(async () => {
    if (!fiestaId) return;
    try {
      const [fetchedPosts, fiestaData, pollData, companyInfo, templateSettings, connections, dedicationsData] = await Promise.all([
        getSocialPosts(fiestaId),
        getFiestaById(fiestaId),
        getActivePoll(fiestaId),
        getCompanyInfo(),
        getInvoiceTemplateSettings(),
        getSocialConnections(),
        getDedications(fiestaId),
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

  return (
    <div className="fixed inset-0 bg-slate-950 overflow-hidden select-none">
      {/* Ambient gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(120,60,200,0.15),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(20,100,200,0.12),transparent_60%)]" />

      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-4 bg-gradient-to-b from-slate-950/90 to-transparent">
        <div className="flex items-center gap-3">
          {companyLogoUrl && (
            <div className="relative h-10 w-24 overflow-hidden rounded bg-white/90 p-1">
              <NextImage src={companyLogoUrl} alt={`Logo de ${companyName}`} fill className="object-contain" />
            </div>
          )}
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white/60 text-sm font-medium tracking-widest uppercase">En Vivo</span>
        </div>
        {eventName && (
          <span className="text-white/40 text-sm font-semibold tracking-wide">{eventName}</span>
        )}
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      </div>

      {socialConnections.length > 0 && (
        <div className="absolute top-16 right-6 z-30 flex flex-col gap-1.5 rounded-2xl border border-white/20 bg-black/50 px-4 py-3 backdrop-blur-md min-w-[160px]">
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
              <span key={connection.platform} className="inline-flex items-center gap-2 text-sm text-white/90">
                <Icon className="h-5 w-5 flex-shrink-0 text-white/70" />
                <span className="font-semibold truncate max-w-[120px]">{handle || connection.platform}</span>
              </span>
            );
          })}
        </div>
      )}

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-full border-4 border-white/10 border-t-white/60 animate-spin" />
            <p className="text-white/40 text-sm tracking-widest uppercase">Cargando muro…</p>
          </div>
        </div>
      )}

      {isLoaded && (activeScreenItem?.type !== 'video' && activeScreenItem?.type !== 'redes' && activeScreenItem?.type !== 'juego') && posts.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
          <div className="text-8xl opacity-20">📸</div>
          <div className="text-center space-y-2">
            <p className="text-white/50 text-2xl font-light tracking-widest uppercase">Muro Social</p>
            <p className="text-white/30 text-base">Las fotos de los invitados aparecerán aquí.</p>
          </div>
        </div>
      )}

      {isLoaded && (!activeScreenItem || activeScreenItem.type === 'mural') && posts.length > 0 && (
        <MasonryLayout posts={posts} />
      )}

      {isLoaded && activeScreenItem?.type === 'juego' && (
        activeGame
          ? <GameSlide game={activeGame} posts={posts} />
          : posts.length > 0
            ? <MasonryLayout posts={posts} />
            : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                <div className="text-9xl">🎮</div>
                <p className="text-white/50 text-2xl font-light tracking-widest uppercase">Zona de juegos</p>
                <p className="text-white/30 text-base">El operador activará el juego en breve…</p>
              </div>
            )
      )}

      {isLoaded && activeScreenItem?.type === 'video' && (
        <ScreenMediaSlide item={activeScreenItem} fallbackPosts={posts} />
      )}

      {isLoaded && activeScreenItem?.type === 'redes' && (
        <SocialTemplateSlide item={activeScreenItem} eventName={eventName} brand={settings.brand} />
      )}

      {/* Active game overlay — shown on all slide types when a game is active */}
      {activeGame && activeScreenItem?.type !== 'juego' && (
        <div className={GAME_OVERLAY_CLASS}>
          <GameOverlayContent game={activeGame} />
        </div>
      )}

      {/* Poll overlay — shown when there is an active poll and no active game overlay */}
      {activePoll && settings.showPolls && !activeGame && (
        <div className={GAME_OVERLAY_CLASS}>
          <p className="mb-3 text-center text-base font-black tracking-[0.35em] text-yellow-300 uppercase">🎮 Juego en Vivo</p>
          <h2 className="mb-5 text-center text-4xl font-black leading-tight text-white">{activePoll.question}</h2>
          <div className="space-y-4">
            {activePoll.options.map((option) => {
              const totalVotes = activePoll.options.reduce((acc, opt) => acc + opt.votes, 0);
              const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
              return (
                <div key={option.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-white">
                    <span className="text-2xl font-extrabold">{option.text}</span>
                    <span className="text-3xl font-black text-yellow-300">{percentage}%</span>
                  </div>
                  <div className="h-7 rounded-full bg-white/20">
                    <div className="h-full rounded-full bg-yellow-300 transition-all duration-500" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {highlightedDedications.length > 0 && !activePoll && (
        <div className="absolute left-6 top-20 z-30 w-[32vw] max-w-sm space-y-3">
          {highlightedDedications.slice(0, 3).map(d => (
            <div key={d.id} className="rounded-2xl border border-amber-300/60 bg-black/70 px-5 py-4 shadow-lg backdrop-blur-md">
              <p className="text-base font-semibold leading-snug text-white">"{d.message}"</p>
              <p className="mt-1.5 text-xs font-bold tracking-widest text-amber-300 uppercase">— {d.authorName}</p>
            </div>
          ))}
        </div>
      )}

      {highlightedComments.length > 0 && settings.allowComments && !activePoll && highlightedDedications.length === 0 && (
        <div className="absolute left-6 top-20 z-30 w-[32vw] max-w-sm space-y-3">
          {highlightedComments.slice(0, 3).map(({ postId, comment }) => (
            <div key={comment.id} className="rounded-2xl border border-sky-300/60 bg-black/70 px-5 py-4 shadow-lg backdrop-blur-md">
              <p className="text-base font-semibold leading-snug text-white">"{comment.text}"</p>
              <p className="mt-1.5 text-xs font-bold tracking-widest text-sky-300 uppercase">— {comment.authorName}</p>
            </div>
          ))}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-30 space-y-1">
        {settings.ledMarqueeText && (
          <div className="overflow-hidden border-y border-fuchsia-300/40 bg-fuchsia-500/15 py-2">
            <div className={`whitespace-nowrap text-2xl font-black uppercase tracking-wider text-fuchsia-200 ${LED_MARQUEE_ANIMATION_CLASS}`}>
              {renderMarqueeText(settings.ledMarqueeText)}
            </div>
          </div>
        )}
        <div className="overflow-hidden border-t border-white/15 bg-black/65 py-2">
          <div className={`whitespace-nowrap text-lg font-bold text-cyan-100 ${MARKETING_MARQUEE_ANIMATION_CLASS}`}>
            {renderMarqueeText(settings.marketingTickerText || companyMarketingText)}
          </div>
        </div>
      </div>

      {/* Overlay display priority: sorteo winner (z-50) > active moment (z-40) > poll (z-30) > dedications/comments (z-30) */}
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

        {activeSorteoWinner && (
          <motion.div
            key={`sorteo-${activeSorteoWinner}`}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 text-center"
          >
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
    // No media uploaded: show mural if there are posts, otherwise a placeholder
    if (fallbackPosts.length > 0) {
      return <MasonryLayout posts={fallbackPosts} />;
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
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-6">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: [1, 1.08, 0.96, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, repeatType: 'loop' }}
            className="text-[14vw] leading-none"
          >
            {meta.emoji}
          </motion.div>
          <h1 className="text-[8vw] font-black uppercase text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] text-center">
            {game.title}
          </h1>
          {game.subtitle && (
            <p className="text-[3vw] text-white/70 font-semibold text-center max-w-4xl">{game.subtitle}</p>
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
            {game.options.map((option, idx) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="rounded-3xl border-2 border-white/30 bg-white/10 px-8 py-5 backdrop-blur-sm"
              >
                <p className="text-[2.8vw] font-black text-white">
                  {option.emoji && <span className="mr-3">{option.emoji}</span>}
                  {option.text}
                </p>
                {option.votes !== undefined && option.votes > 0 && (
                  <p className="mt-1 text-yellow-300 text-[1.8vw] font-bold">{option.votes} votos</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Compact overlay shown when a game is active on non-juego slides */
function GameOverlayContent({ game }: { game: ActiveGameData }) {
  const meta = GAME_TYPE_META[game.type] ?? { emoji: '🎮', label: 'Juego', bg: '' };
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
        <div className="space-y-2">
          {game.options.map((option) => (
            <div key={option.id} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white text-xl font-bold">
              {option.emoji && <span className="mr-2">{option.emoji}</span>}
              {option.text}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

