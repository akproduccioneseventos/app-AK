"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Play, X } from "lucide-react";
import Image from "next/image";
import { canUseNextImage } from "@/lib/next-image-url";
import { cn } from "@/lib/utils";
import type { GaleriaVideo } from "@/types/galeria";

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
  platform?: "youtube" | "instagram" | "vimeo" | "file" | "external";
  featured?: boolean;
}

export interface VideoPlaybackSource {
  kind: "iframe" | "video" | "external";
  src: string;
}

function getInstagramContentIdentity(url: string) {
  const match = url.match(/instagram\.com\/(p|reel|tv)\/([^/?#]+)/i);
  return match ? `instagram:${match[1].toLowerCase()}:${match[2]}` : null;
}

function getInstagramEmbedUrl(url: string) {
  const match = url.match(/instagram\.com\/(p|reel|tv)\/([^/?#]+)/i);
  return match ? `https://www.instagram.com/${match[1]}/${match[2]}/embed` : undefined;
}

function normaliseUrl(url: string) {
  return url.trim().split(/[?#]/, 1)[0].toLowerCase();
}

function videoIdentity(video: VideoItem) {
  if (video.youtubeId) return `youtube:${video.youtubeId.toLowerCase()}`;
  const instagramIdentity = [video.externalUrl, video.embedUrl]
    .map((url) => (url ? getInstagramContentIdentity(url) : null))
    .find(Boolean);
  if (instagramIdentity) return instagramIdentity;
  if (video.externalUrl) return `external:${normaliseUrl(video.externalUrl)}`;
  if (video.embedUrl) return `embed:${normaliseUrl(video.embedUrl)}`;
  return `id:${video.id}`;
}

export function dedupeVideoItems(items: VideoItem[]) {
  const byIdentity = new Map<string, VideoItem>();
  for (const item of items) {
    const identity = videoIdentity(item);
    const existing = byIdentity.get(identity);
    if (!existing) {
      byIdentity.set(identity, item);
      continue;
    }

    byIdentity.set(identity, {
      ...existing,
      title: existing.title || item.title,
      description: existing.description || item.description,
      thumbnailUrl: existing.thumbnailUrl || item.thumbnailUrl,
      youtubeId: existing.youtubeId || item.youtubeId,
      embedUrl: existing.embedUrl || item.embedUrl,
      externalUrl: existing.externalUrl || item.externalUrl,
      categoria: existing.categoria || item.categoria,
      platform: existing.platform || item.platform,
      featured: Boolean(existing.featured || item.featured),
    });
  }
  return Array.from(byIdentity.values());
}

export function getVideoPlaybackSource(video: VideoItem): VideoPlaybackSource | null {
  if (video.youtubeId) {
    return {
      kind: "iframe",
      src: `https://www.youtube.com/embed/${encodeURIComponent(video.youtubeId)}?autoplay=1&rel=0`,
    };
  }
  if (video.embedUrl) {
    return {
      kind: DIRECT_VIDEO_PATTERN.test(video.embedUrl) ? "video" : "iframe",
      src: video.embedUrl,
    };
  }
  if (video.externalUrl) return { kind: "external", src: video.externalUrl };
  return null;
}

function VideoThumbnail({ src, alt }: { src: string; alt: string }) {
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-zinc-500">
        <Play className="h-10 w-10" />
      </div>
    );
  }
  if (canUseNextImage(src)) {
    return (
        <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.03] motion-reduce:transition-none"
      />
    );
  }

  // Editor content may use an external host outside Next's image allowlist.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.03] motion-reduce:transition-none" />;
}

export function galeriaVideoToVideoItem(video: GaleriaVideo): VideoItem {
  const isDirectVideo = DIRECT_VIDEO_PATTERN.test(video.youtubeUrl);
  const isInstagram = /instagram\.com/i.test(video.youtubeUrl);
  const isYoutube = video.plataforma === "youtube" || (!video.plataforma && Boolean(video.youtubeId) && !isDirectVideo && !isInstagram);
  const isVimeo = video.plataforma === "vimeo";
  const embedUrl = video.embedUrl
    || (isInstagram ? getInstagramEmbedUrl(video.youtubeUrl) : undefined)
    || (isVimeo && video.youtubeId ? `https://player.vimeo.com/video/${video.youtubeId}` : undefined)
    || (isDirectVideo ? video.youtubeUrl : undefined);

  return {
    id: video.id,
    title: video.titulo,
    description: video.descripcion ?? "",
    thumbnailUrl: video.thumbnailUrl || (isYoutube && video.youtubeId ? `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg` : ""),
    youtubeId: isYoutube ? video.youtubeId : undefined,
    embedUrl,
    externalUrl: isInstagram ? video.youtubeUrl : undefined,
    categoria: video.categoria,
    platform: isInstagram ? "instagram" : isYoutube ? "youtube" : isVimeo ? "vimeo" : isDirectVideo ? "file" : "external",
    featured: video.destacada,
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
      className="group relative overflow-hidden rounded-lg border border-white/10 bg-zinc-900 text-left transition-colors hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
      onClick={() => onPlay(video)}
      aria-label={`Reproducir video: ${video.title}`}
    >
      <div className="relative aspect-video overflow-hidden bg-zinc-800">
        <VideoThumbnail src={video.thumbnailUrl} alt={video.title} />
        <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/45" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-white text-zinc-950 shadow-lg motion-safe:transition-transform motion-safe:group-hover:scale-105 motion-reduce:transition-none">
            <Play className="ml-0.5 h-6 w-6 fill-current" />
          </span>
        </span>
        {video.categoria && (
          <span className="absolute left-3 top-3 rounded-sm bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            {video.categoria}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-headline text-lg font-black text-white">{video.title}</h3>
        {video.description && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-400">{video.description}</p>}
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
  const allVideos = useMemo(() => {
    const fromGaleria = (galeriaVideos ?? []).map(galeriaVideoToVideoItem);
    return dedupeVideoItems([...(videos ?? []), ...fromGaleria]).sort(
      (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
    );
  }, [galeriaVideos, videos]);
  const [activeCategory, setActiveCategory] = useState("Todos");
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

  const categories = [
    "Todos",
    ...Array.from(new Set(allVideos.map((video) => video.categoria).filter(Boolean))) as string[],
  ];
  const filtered = activeCategory === "Todos"
    ? allVideos
    : allVideos.filter((video) => video.categoria === activeCategory);
  const playbackSource = activeVideo ? getVideoPlaybackSource(activeVideo) : null;

  const handlePlay = (video: VideoItem) => {
    const source = getVideoPlaybackSource(video);
    if (source?.kind === "external") {
      window.open(source.src, "_blank", "noopener,noreferrer");
      return;
    }
    if (source) {
      previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setActiveVideo(video);
    }
  };

  return (
    <section id="videos" data-testid="video-section" className="border-y border-white/10 bg-zinc-900 py-20 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-red-400">
            <Play className="h-4 w-4" /> Momentos reales
          </p>
          <h2 className="font-headline text-4xl font-black leading-tight sm:text-5xl">Historias en movimiento</h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Reproducí trabajos y momentos de eventos de AK Producciones.
          </p>
        </div>

        {allVideos.length === 0 ? (
          <div className="border border-white/10 bg-white/[0.03] px-6 py-16 text-center text-zinc-400">
            <Play className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
            Todavía no hay videos publicados.
          </div>
        ) : (
          <>
            {categories.length > 2 && (
              <div className="mb-8 flex flex-wrap gap-2 border-b border-white/10 pb-4">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-xs font-bold transition-colors",
                      activeCategory === category
                        ? "border-white bg-white text-zinc-950"
                        : "border-white/15 text-zinc-400 hover:border-white/40 hover:text-white",
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}

            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((video) => <VideoCard key={video.id} video={video} onPlay={handlePlay} />)}
              </div>
            ) : (
              <div className="border border-white/10 px-6 py-14 text-center text-zinc-500">No hay videos en esta categoría todavía.</div>
            )}
          </>
        )}

        {channelUrl && (
          <div className="mt-8">
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/20 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:border-white/50 hover:bg-white/10"
            >
              Ver canal oficial <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}
      </div>

      {activeVideo && playbackSource && playbackSource.kind !== "external" && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setActiveVideo(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-modal-title"
            className="relative w-full max-w-4xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="video-modal-title" className="sr-only">{activeVideo.title}</h2>
            <div className="relative aspect-video overflow-hidden rounded-lg border border-white/15 bg-black">
              {playbackSource.kind === "video" ? (
                <video src={playbackSource.src} controls autoPlay className="h-full w-full bg-black" />
              ) : (
                <iframe
                  src={playbackSource.src}
                  title={activeVideo.title}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="h-full w-full"
                />
              )}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 bg-zinc-900 px-4 py-3">
              <p className="truncate text-sm font-bold text-white">{activeVideo.title}</p>
              {activeVideo.externalUrl && (
                <a
                  href={activeVideo.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-zinc-300 hover:text-white"
                >
                  Ver original <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setActiveVideo(null)}
              className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
