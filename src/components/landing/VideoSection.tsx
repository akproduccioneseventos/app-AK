'use client';

import { Play, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { canUseNextImage } from '@/lib/next-image-url';
import type { GaleriaVideo } from '@/types/galeria';

const DIRECT_VIDEO_PATTERN = /\.(mp4|webm|ogg)(\?|$)/i;

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  youtubeId?: string;
  embedUrl?: string;
  externalUrl?: string;
  categoria?: string;
}

function VideoThumbnail({ src, alt }: { src: string; alt: string }) {
  if (canUseNextImage(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element -- Editor content may use an external host outside Next's allowlist.
  return <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />;
}

function galeriaVideoToVideoItem(video: GaleriaVideo): VideoItem {
  const isDirectVideo = DIRECT_VIDEO_PATTERN.test(video.youtubeUrl);
  const isInstagram = video.youtubeUrl?.includes('instagram.com');
  const embedUrl = video.embedUrl
    || (video.plataforma === 'vimeo' ? `https://player.vimeo.com/video/${video.youtubeId}` : undefined)
    || (isDirectVideo ? video.youtubeUrl : undefined);
  return {
    id: video.id,
    title: video.titulo,
    description: video.descripcion ?? '',
    thumbnailUrl: video.thumbnailUrl,
    youtubeId: (video.plataforma === 'youtube' || (!video.plataforma && !isInstagram && !isDirectVideo)) ? video.youtubeId : undefined,
    embedUrl,
    externalUrl: isInstagram ? video.youtubeUrl : undefined,
    categoria: video.categoria,
  };
}

interface VideoCardProps {
  video: VideoItem;
  onPlay: (video: VideoItem) => void;
}

function VideoCard({ video, onPlay }: VideoCardProps) {
  return (
    <button
      type="button"
      className="group relative w-full rounded-3xl overflow-hidden bg-slate-800 shadow-2xl cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      onClick={() => onPlay(video)}
      aria-label={`Reproducir video: ${video.title}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <VideoThumbnail src={video.thumbnailUrl} alt={video.title} />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            'w-16 h-16 rounded-full bg-white/90 flex items-center justify-center',
            'shadow-2xl group-hover:scale-110 transition-transform duration-300',
            'group-hover:bg-white'
          )}>
            <Play className="w-7 h-7 text-primary fill-primary ml-1" />
          </div>
        </div>
        {video.categoria && (
          <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
            {video.categoria}
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-5">
        <h4 className="font-headline text-lg font-black text-white mb-1">{video.title}</h4>
        {video.description && (
          <p className="text-slate-400 text-sm leading-relaxed">{video.description}</p>
        )}
      </div>
    </button>
  );
}

interface VideoSectionProps {
  videos?: VideoItem[];
  galeriaVideos?: GaleriaVideo[];
  channelUrl?: string;
}

export function VideoSection({ videos, galeriaVideos, channelUrl }: VideoSectionProps) {
  const dynamicVideos: VideoItem[] = galeriaVideos?.map(galeriaVideoToVideoItem) ?? [];
  const allVideos: VideoItem[] = dynamicVideos.length > 0 ? dynamicVideos : videos ?? [];

  // El título puede repetirse; la identidad estable es la plataforma o URL de origen.
  const seenVideos = new Set<string>();
  const uniqueVideos: VideoItem[] = [];
  for (const video of allVideos) {
    const identity = video.youtubeId
      ? `youtube:${video.youtubeId}`
      : video.externalUrl
        ? `external:${video.externalUrl.split(/[?#]/, 1)[0]}`
        : video.embedUrl
          ? `embed:${video.embedUrl.split(/[?#]/, 1)[0]}`
          : `id:${video.id}`;
    if (!seenVideos.has(identity)) {
      seenVideos.add(identity);
      uniqueVideos.push(video);
    }
  }

  const [activeCategory, setActiveCategory] = useState('Todos');
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!activeVideo) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = requestAnimationFrame(() => closeButtonRef.current?.focus());
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveVideo(null);
        return;
      }
      if (e.key !== 'Tab') return;
      const dialog = closeButtonRef.current?.closest('[role="dialog"]');
      if (!(dialog instanceof HTMLElement)) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], iframe, video[controls], [tabindex]:not([tabindex="-1"])'));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      requestAnimationFrame(() => previousFocusRef.current?.focus());
    };
  }, [activeVideo]);

  // Sort: destacados first using a Map for O(n) performance
  const destacadaMap = new Map(galeriaVideos?.map((v) => [v.id, v.destacada]));
  const sortedVideos = [...uniqueVideos].sort(
    (a, b) => (destacadaMap.get(b.id) ? 1 : 0) - (destacadaMap.get(a.id) ? 1 : 0)
  );

  // Build dynamic categories
  const uniqueCategories = Array.from(
    new Set(sortedVideos.map((v) => v.categoria).filter(Boolean))
  ) as string[];
  const categories = ['Todos', ...uniqueCategories];

  if (uniqueVideos.length === 0) {
    return (
      <section id="videos" data-testid="video-section" className="py-24 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-[0.4em] text-fuchsia-400 mb-4">Momentos reales</p>
            <h2 className="font-headline text-5xl sm:text-6xl font-black text-white leading-tight mb-6">
              Historias en movimiento
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Revivimos cada evento. Mirá el trabajo que ponemos en cada celebración.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-800/60 py-16 px-6 text-center">
            <Play className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-300 font-semibold">Próximamente agregaremos videos de nuestros eventos.</p>
          </div>
        </div>
      </section>
    );
  }

  const filtered = activeCategory === 'Todos'
    ? sortedVideos
    : sortedVideos.filter((v) => v.categoria === activeCategory);

  const handlePlay = (video: VideoItem) => {
    if (!video.youtubeId && !video.embedUrl && video.externalUrl) {
      window.open(video.externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setActiveVideo(video);
  };

  const embedSrc = activeVideo?.youtubeId
    ? `https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0`
    : activeVideo?.embedUrl ?? '';
  const isDirectVideoSrc = !!embedSrc && DIRECT_VIDEO_PATTERN.test(embedSrc);

  return (
    <section id="videos" data-testid="video-section" className="py-24 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-fuchsia-400 mb-4">Momentos reales</p>
          <h2 className="font-headline text-5xl sm:text-6xl font-black text-white leading-tight mb-6">
            Historias en movimiento
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Revivimos cada evento. Mirá el trabajo que ponemos en cada celebración.
          </p>
        </div>

        {/* Category filter */}
        {categories.length > 2 && (
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-5 py-2 rounded-full text-sm font-black uppercase tracking-wider transition-all duration-200',
                  activeCategory === cat
                    ? 'bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30 scale-105'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Video grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((video) => (
            <VideoCard key={video.id} video={video} onPlay={handlePlay} />
          ))}
        </div>

        {channelUrl && (
          <div className="mt-10 text-center">
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/30 px-6 text-sm font-black uppercase tracking-widest text-white transition hover:bg-white/10"
            >
              Ver canal oficial en YouTube
            </a>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            No hay videos en esta categoría todavía.
          </div>
        )}
      </div>

      {/* Video modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setActiveVideo(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-modal-title"
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="video-modal-title" className="sr-only">{activeVideo.title}</h2>
            <div className="aspect-video overflow-hidden rounded-2xl shadow-2xl">
              {isDirectVideoSrc ? (
                <video src={embedSrc} controls autoPlay className="w-full h-full bg-black" />
              ) : (
                <iframe
                  src={embedSrc}
                  title={activeVideo.title}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              )}
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setActiveVideo(null)}
              className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Cerrar video"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
