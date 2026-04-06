'use client';

import { Play } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { GaleriaVideo } from '@/types/galeria';

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  youtubeId?: string;
  embedUrl?: string;
  categoria?: string;
}

const DEFAULT_VIDEOS: VideoItem[] = [
  {
    id: 'v1',
    title: 'Boda Soñada en Uruguay',
    description: 'Una tarde mágica que se convirtió en el día más memorable para Valentina y Rodrigo.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80&auto=format&fit=crop',
    youtubeId: 'dQw4w9WgXcQ',
    categoria: 'Bodas',
  },
  {
    id: 'v2',
    title: 'XV Años — Florencia',
    description: 'Una fiesta de cuento de hadas para los 15 años de Florencia, llena de color y alegría.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80&auto=format&fit=crop',
    youtubeId: 'dQw4w9WgXcQ',
    categoria: 'XV Años',
  },
  {
    id: 'v3',
    title: 'Evento Corporativo Gala',
    description: 'Producción integral para gala empresarial con más de 200 invitados.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80&auto=format&fit=crop',
    youtubeId: 'dQw4w9WgXcQ',
    categoria: 'Eventos Corporativos',
  },
];

function galeriaVideoToVideoItem(video: GaleriaVideo): VideoItem {
  return {
    id: video.id,
    title: video.titulo,
    description: video.descripcion ?? '',
    thumbnailUrl: video.thumbnailUrl,
    youtubeId: video.youtubeId,
    categoria: video.categoria,
  };
}

interface VideoCardProps {
  video: VideoItem;
  onPlay: (video: VideoItem) => void;
}

function VideoCard({ video, onPlay }: VideoCardProps) {
  return (
    <div className="group relative rounded-3xl overflow-hidden bg-slate-800 shadow-2xl cursor-pointer" onClick={() => onPlay(video)}>
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
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
    </div>
  );
}

interface VideoSectionProps {
  videos?: VideoItem[];
  galeriaVideos?: GaleriaVideo[];
}

export function VideoSection({ videos, galeriaVideos }: VideoSectionProps) {
  const dynamicVideos: VideoItem[] = galeriaVideos?.map(galeriaVideoToVideoItem) ?? [];
  const allVideos: VideoItem[] = dynamicVideos.length > 0 ? dynamicVideos : videos ?? DEFAULT_VIDEOS;

  // Sort: destacados first using a Map for O(n) performance
  const destacadaMap = new Map(galeriaVideos?.map((v) => [v.id, v.destacada]));
  const sortedVideos = [...allVideos].sort(
    (a, b) => (destacadaMap.get(b.id) ? 1 : 0) - (destacadaMap.get(a.id) ? 1 : 0)
  );

  // Build dynamic categories
  const uniqueCategories = Array.from(
    new Set(sortedVideos.map((v) => v.categoria).filter(Boolean))
  ) as string[];
  const categories = ['Todos', ...uniqueCategories];

  const [activeCategory, setActiveCategory] = useState('Todos');
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  const filtered = activeCategory === 'Todos'
    ? sortedVideos
    : sortedVideos.filter((v) => v.categoria === activeCategory);

  const embedSrc = activeVideo?.youtubeId
    ? `https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0`
    : activeVideo?.embedUrl ?? '';

  return (
    <section id="videos" className="py-24 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-fuchsia-400 mb-4">Momentos reales</p>
          <h2 className="font-headline text-5xl sm:text-6xl font-black text-white leading-tight mb-6">
            Nuestros Videos
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
            <VideoCard key={video.id} video={video} onPlay={setActiveVideo} />
          ))}
        </div>

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
            className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={embedSrc}
              title={activeVideo.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
          <button
            onClick={() => setActiveVideo(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Cerrar video"
          >
            ✕
          </button>
        </div>
      )}
    </section>
  );
}
