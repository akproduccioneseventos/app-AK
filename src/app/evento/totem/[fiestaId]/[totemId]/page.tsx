'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import NextImage from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Maximize, QrCode, Sparkles } from 'lucide-react';
import { getPublicSocialEvent, getPublicSocialPosts } from '@/app/actions/social-gallery';
import type { TotemScreenSettings } from '@/types/fiesta';
import type { SocialGalleryPost } from '@/types/social-gallery';
import type { PublicSocialEvent } from '@/lib/social-fiesta/public-event';
import { cn } from '@/lib/utils';

const REFRESH_MS = 2500;

function fallbackTotem(fiesta: PublicSocialEvent, totemId: string, origin = ''): TotemScreenSettings {
  const socialUrl = origin ? `${origin}/evento/social/${fiesta.id}` : `/evento/social/${fiesta.id}`;
  return {
    id: totemId,
    enabled: true,
    title: 'Bienvenidos',
    subtitle: 'Escaneá el QR y compartí tus fotos en la pantalla.',
    honoreeName: fiesta.configuracion?.nombreEvento || 'Fiesta AK',
    backgroundMode: 'aurora',
    layout: 'portrait',
    accentColor: '#dc2626',
    qrUrl: socialUrl,
    qrLabel: 'Subí tu foto al muro',
    showQr: true,
    showLatestPhotos: true,
    syncedWithSocialWall: true,
    audioReactive: false,
  };
}

function isVideoUrl(url?: string) {
  return Boolean(url && /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url));
}

export default function TotemPublicPage() {
  const params = useParams();
  const fiestaId = params.fiestaId as string;
  const totemId = params.totemId as string;

  const [fiesta, setFiesta] = useState<PublicSocialEvent | null>(null);
  const [totem, setTotem] = useState<TotemScreenSettings | null>(null);
  const [posts, setPosts] = useState<SocialGalleryPost[]>([]);
  const [origin, setOrigin] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0.35);
  const prefersReducedMotion = useReducedMotion();
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const [heroPhotoIndex, setHeroPhotoIndex] = useState(0);

  const heroPhotos = useMemo(() => {
    if (!totem?.heroPhotoUrl) return [];
    return totem.heroPhotoUrl
      .split(/[\n,]+/)
      .map((url) => url.trim())
      .filter((url) => url.length > 0);
  }, [totem?.heroPhotoUrl]);

  useEffect(() => {
    if (prefersReducedMotion || heroPhotos.length <= 1) return;
    const interval = window.setInterval(() => setHeroPhotoIndex((current) => (current + 1) % heroPhotos.length), 4200);
    return () => window.clearInterval(interval);
  }, [heroPhotos.length, prefersReducedMotion]);

  const loadData = useCallback(async () => {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    setOrigin(currentOrigin);
    const [fiestaData, socialPosts] = await Promise.all([
      getPublicSocialEvent(fiestaId),
      getPublicSocialPosts(fiestaId).catch(() => []),
    ]);
    if (!fiestaData) {
      setIsLoaded(true);
      return;
    }
    const selected = fiestaData.socialGallerySettings?.totemScreens?.find((item) => item.id === totemId)
      || fallbackTotem(fiestaData, totemId, currentOrigin);
    setFiesta(fiestaData);
    setTotem(selected);
    setPosts(
      socialPosts
        .filter((post) => (post.moderationStatus ?? 'approved') === 'approved')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 18)
    );
    setIsLoaded(true);
  }, [fiestaId, totemId]);

  useEffect(() => {
    loadData();
    const interval = window.setInterval(loadData, REFRESH_MS);
    return () => window.clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (prefersReducedMotion || posts.length <= 1) return;
    const interval = window.setInterval(() => setPhotoIndex((current) => (current + 1) % posts.length), 4200);
    return () => window.clearInterval(interval);
  }, [posts.length, prefersReducedMotion]);

  useEffect(() => {
    if (!totem?.audioReactive) return;
    let stopped = false;
    const tick = () => {
      const analyzer = analyzerRef.current;
      if (analyzer) {
        const data = new Uint8Array(analyzer.frequencyBinCount);
        analyzer.getByteFrequencyData(data);
        const average = data.reduce((sum, value) => sum + value, 0) / Math.max(1, data.length);
        setAudioLevel(Math.max(0.18, Math.min(1, average / 140)));
      } else {
        setAudioLevel(0.35 + Math.sin(Date.now() / 220) * 0.22);
      }
      if (!stopped) rafRef.current = window.requestAnimationFrame(tick);
    };
    tick();
    return () => {
      stopped = true;
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [totem?.audioReactive]);

  const activateAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
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

  const qrUrl = useMemo(() => {
    if (totem?.qrUrl) return totem.qrUrl;
    if (!origin) return '';
    return `${origin}/evento/social/${fiestaId}`;
  }, [fiestaId, origin, totem?.qrUrl]);

  if (!isLoaded) {
    return <div className="fixed inset-0 flex items-center justify-center bg-slate-950 text-white">Cargando tótem AK...</div>;
  }

  if (!fiesta || !totem || totem.enabled === false) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950 p-8 text-center text-white">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.35em] text-white/40">Pantalla AK</p>
          <h1 className="mt-3 text-5xl font-black">Tótem no disponible</h1>
        </div>
      </div>
    );
  }

  const activePost = posts[photoIndex] ?? posts[0];
  const isPortrait = totem.layout === 'portrait';
  const isSquare = totem.layout === 'square';
  const accent = totem.accentColor || '#dc2626';

  return (
    <main
      data-reduced-motion={prefersReducedMotion ? 'true' : 'false'}
      data-totem-id={totem.id}
      className={cn(
        'fixed inset-0 overflow-hidden bg-slate-950 text-white',
        isPortrait && 'flex items-center justify-center bg-black',
        isSquare && 'flex items-center justify-center bg-slate-950'
      )}
      style={{ ['--totem-accent' as string]: accent, ['--audio-level' as string]: String(audioLevel) }}
    >
      <div className={cn('relative h-full w-full overflow-hidden', isPortrait && 'max-w-[56.25vh]', isSquare && 'aspect-square max-h-screen max-w-screen')}>
        <AnimatedBackground mode={totem.backgroundMode} mediaUrl={totem.backgroundMediaUrl} accent={accent} posts={posts} />

        <button
          onClick={() => document.documentElement.requestFullscreen?.().catch(() => undefined)}
          className="absolute right-5 top-5 z-30 rounded-lg border border-white/10 bg-black/30 p-3 text-white/65 backdrop-blur transition hover:text-white motion-reduce:transition-none"
          aria-label="Pantalla completa"
        >
          <Maximize className="h-5 w-5" />
        </button>

        <section className="relative z-10 grid h-full grid-rows-[1fr_auto] p-6 sm:p-10">
          <div className="grid min-h-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]">
            <div className="flex min-h-0 flex-col justify-center">
              {totem.logoUrl && (
                  <div className="relative mb-6 h-16 w-40 overflow-hidden rounded-lg bg-white/90 p-2">
                  <NextImage src={totem.logoUrl} alt="Logo" fill className="object-contain" unoptimized />
                </div>
              )}
              <motion.p
                animate={{ opacity: [0.65, 1, 0.65] }}
                transition={{ duration: 2.4, repeat: Infinity }}
                className="text-xs font-black uppercase tracking-[0.4em]"
                style={{ color: accent }}
              >
                Experiencia tecnológica AK
              </motion.p>
              <h1 className="mt-4 max-w-4xl text-[clamp(3rem,10vw,9rem)] font-black leading-[0.9] tracking-tight">
                {totem.honoreeName || totem.title}
              </h1>
              <p className="mt-5 max-w-2xl text-[clamp(1rem,2vw,2rem)] font-semibold text-white/72">{totem.subtitle}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {totem.audioReactive && (
                  <button onClick={activateAudio} className="rounded-lg border border-white/15 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-wider backdrop-blur">
                    Activar audio
                  </button>
                )}
                {totem.showQr && qrUrl && (
                  <div className="rounded-lg border border-white/15 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-wider backdrop-blur">
                    <QrCode className="mr-2 inline h-4 w-4" /> {totem.qrLabel || 'Escaneá y participá'}
                  </div>
                )}
              </div>
            </div>

            <div className="relative flex min-h-0 items-center justify-center">
              {heroPhotos.length > 0 ? (
                heroPhotos.length === 1 ? (
                  <motion.div
                    animate={{ y: [0, -14, 0], rotate: [-1, 1.5, -1] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative aspect-[4/5] w-full max-w-[46vh] overflow-hidden rounded-lg border border-white/20 bg-black shadow-2xl"
                  >
                    <NextImage src={heroPhotos[0]} alt={totem.honoreeName || 'Tótem AK'} fill className="object-cover" unoptimized priority />
                  </motion.div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={heroPhotos[heroPhotoIndex]}
                      initial={{ opacity: 0, scale: 0.94, rotate: -2 }}
                      animate={{ opacity: 1, scale: 1, rotate: 1 }}
                      exit={{ opacity: 0, scale: 1.04, rotate: 3 }}
                      transition={{ duration: 0.7 }}
                      className="relative aspect-[4/5] w-full max-w-[46vh] overflow-hidden rounded-lg border-[10px] border-white bg-white shadow-2xl"
                    >
                      <div className="relative h-full w-full">
                        <NextImage src={heroPhotos[heroPhotoIndex]} alt={totem.honoreeName || 'Tótem AK'} fill className="object-cover" unoptimized priority />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )
              ) : activePost && totem.showLatestPhotos ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePost.id}
                    initial={{ opacity: 0, scale: 0.94, rotate: -2 }}
                    animate={{ opacity: 1, scale: 1, rotate: 1 }}
                    exit={{ opacity: 0, scale: 1.04, rotate: 3 }}
                    transition={{ duration: 0.7 }}
                    className="relative aspect-[4/5] w-full max-w-[46vh] overflow-hidden rounded-lg border-[10px] border-white bg-white shadow-2xl"
                  >
                    <MediaPreview post={activePost} />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/65 p-5">
                      <p className="text-sm font-black uppercase tracking-wider text-white/90">{activePost.authorName}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                  <div className="flex aspect-square w-full max-w-sm items-center justify-center rounded-lg border border-white/15 bg-white/10">
                  <Sparkles className="h-24 w-24" style={{ color: accent }} />
                </div>
              )}
            </div>
          </div>

          <footer className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="overflow-hidden rounded-lg border border-white/10 bg-black/35 px-5 py-3 backdrop-blur">
              <motion.div
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                className="whitespace-nowrap text-sm font-black uppercase tracking-[0.26em] text-white/70"
              >
                {[totem.title, 'Subí tu foto', 'Mirate en pantalla', 'Etiquetá a AK Producciones', totem.title].map((text, index) => (
                  <span key={`${text}-${index}`} className="mx-8">{text}</span>
                ))}
              </motion.div>
            </div>
            {totem.showQr && qrUrl && (
              <div className="flex items-center gap-4 rounded-lg border border-white/12 bg-white/95 p-4 text-slate-950 shadow-2xl">
                <QRCodeSVG value={qrUrl} size={132} includeMargin />
                <div className="max-w-[180px]">
                  <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: accent }}>{totem.qrLabel || 'Participá'}</p>
                  <p className="mt-1 text-sm font-bold text-slate-600">Escaneá desde tu celular y subí tu foto.</p>
                </div>
              </div>
            )}
          </footer>
        </section>

        {totem.audioReactive && <AudioPulseOverlay accent={accent} level={audioLevel} />}
      </div>
      <style jsx global>{`
        @media (prefers-reduced-motion: reduce) {
          [data-reduced-motion='true'] *, [data-reduced-motion='true'] *::before, [data-reduced-motion='true'] *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
        @keyframes totemDrift {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(2%, -2%, 0) scale(1.04); }
        }
      `}</style>
    </main>
  );
}

function AnimatedBackground({ mode, mediaUrl, accent, posts }: { mode: TotemScreenSettings['backgroundMode']; mediaUrl?: string; accent: string; posts: SocialGalleryPost[] }) {
  return (
    <div className="absolute inset-0">
      {mediaUrl && isVideoUrl(mediaUrl) && <video src={mediaUrl} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-55" />}
      {mediaUrl && !isVideoUrl(mediaUrl) && <NextImage src={mediaUrl} alt="" fill className="object-cover opacity-55" unoptimized aria-hidden />}
      <div className="absolute inset-0 bg-slate-950/55" />
      {mode === 'aurora' && <div className="absolute inset-0 bg-slate-950/20" style={{ borderTop: `8px solid ${accent}55` }} />}
      {mode === 'spotlights' && <div className="absolute inset-x-1/4 top-1/2 h-1/2 border-x-4 border-white/10" />}
      {mode === 'particles' && <ParticleField accent={accent} />}
      {(mode === 'photo-float' || mode === 'social-rain') && posts.length > 0 && <FloatingPhotos posts={posts} rain={mode === 'social-rain'} />}
      <div className="absolute inset-0 bg-black/15" />
    </div>
  );
}

function ParticleField({ accent }: { accent: string }) {
  return (
    <>
      {Array.from({ length: 18 }).map((_, index) => (
        <motion.div
          key={index}
          className="absolute rounded-lg"
          style={{
            width: 8 + (index % 5) * 7,
            height: 8 + (index % 5) * 7,
            backgroundColor: index % 3 === 0 ? accent : '#ffffff',
            left: `${(index * 17) % 100}%`,
            top: `${(index * 29) % 100}%`,
            opacity: 0.25,
          }}
          animate={{ y: [0, -40, 0], opacity: [0.18, 0.55, 0.18] }}
          transition={{ duration: 3 + (index % 6), repeat: Infinity, delay: index * 0.12 }}
        />
      ))}
    </>
  );
}

function FloatingPhotos({ posts, rain }: { posts: SocialGalleryPost[]; rain: boolean }) {
  return (
    <>
      {posts.slice(0, 10).map((post, index) => (
        <motion.div
          key={post.id}
          className="absolute overflow-hidden rounded-lg border border-white/15 bg-white/10 shadow-2xl"
          style={{ width: rain ? 110 : 150, aspectRatio: '4/5', left: `${(index * 13) % 88}%`, top: rain ? '-20%' : `${(index * 19) % 80}%`, opacity: 0.28 }}
          animate={rain ? { y: ['0vh', '130vh'], rotate: [-6, 8, -4] } : { y: [0, -24, 0], rotate: [-3, 3, -3] }}
          transition={{ duration: rain ? 10 + (index % 5) : 5 + (index % 4), repeat: Infinity, delay: index * 0.5, ease: 'linear' }}
        >
          <MediaPreview post={post} />
        </motion.div>
      ))}
    </>
  );
}

function MediaPreview({ post }: { post: SocialGalleryPost }) {
  const isVideo = post.mediaType === 'video' || isVideoUrl(post.imageUrl);
  if (isVideo) return <video src={post.imageUrl} className="h-full w-full object-cover" autoPlay muted loop playsInline />;
  return <NextImage src={post.imageUrl} alt={post.authorName} fill className="object-cover" unoptimized />;
}

function AudioPulseOverlay({ accent, level }: { accent: string; level: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {Array.from({ length: 9 }).map((_, index) => (
        <motion.div
          key={index}
          className="absolute left-1/2 top-1/2 rounded-lg border"
          style={{
            width: `${18 + index * 9}vw`,
            height: `${18 + index * 9}vw`,
            marginLeft: `${-(18 + index * 9) / 2}vw`,
            marginTop: `${-(18 + index * 9) / 2}vw`,
            borderColor: index % 2 === 0 ? `${accent}55` : 'rgba(255,255,255,0.18)',
          }}
          animate={{ scale: [1, 1 + level * 0.35, 1], opacity: [0.1, 0.34, 0.1] }}
          transition={{ duration: 0.7 + index * 0.06, repeat: Infinity }}
        />
      ))}
    </div>
  );
}
