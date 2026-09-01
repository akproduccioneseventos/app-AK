'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Share2,
  Heart,
  Loader2,
  Play,
  ChevronLeft,
  ChevronRight,
  X,
  Camera,
  Sparkles,
  Calendar,
  Check,
  PartyPopper,
  ExternalLink,
  Star,
  MessageCircle,
} from 'lucide-react';
import { getPublicSocialEvent, getPublicSocialPosts } from '@/app/actions/social-gallery';
import { getEnlaceDeResenaPublico } from '@/app/actions/feedback';
import type { PublicSocialEvent } from '@/lib/social-fiesta/public-event';
import type { SocialGalleryPost } from '@/types/social-gallery';
import { appendCommercialAttribution } from '@/lib/commercial/acquisition';
import { buildAkWhatsAppUrl } from '@/lib/public-contact';
import { useToast } from '@/hooks/use-toast';

type FilterTab = 'todas' | 'fotocabina' | '360' | 'espejo' | 'bogue' | 'buzon' | 'invitados';

function isVideo(url: string = ''): boolean {
  return url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('video');
}

export default function PublicAlbumPage() {
  const params = useParams();
  const { toast } = useToast();
  const fiestaId = params.fiestaId as string;

  const [fiesta, setFiesta] = useState<PublicSocialEvent | null>(null);
  const [posts, setPosts] = useState<SocialGalleryPost[]>([]);
  const [enlaceResena, setEnlaceResena] = useState<string>('');
  const [activeTab, setActiveTab] = useState<FilterTab>('todas');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [copied, setCopied] = useState(false);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    getPublicSocialEvent(fiestaId).then(setFiesta).catch(() => {});
    getEnlaceDeResenaPublico().then(setEnlaceResena).catch(() => {});
  }, [fiestaId]);

  const loadPosts = useCallback(async () => {
    try {
      setHasError(false);
      const data = await getPublicSocialPosts(fiestaId);
      setPosts(data);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const title = fiesta?.configuracion?.nombreEvento || 'Álbum del Evento';
    const text = `Mirá las fotos y recuerdos de ${title} en el álbum oficial.`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: '¡Enlace copiado!',
        description: 'Ya podés pegarlo en WhatsApp para compartirlo con tu familia y amigos.',
      });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const filteredPosts = useMemo(() => {
    if (activeTab === 'todas') return posts;
    if (activeTab === 'fotocabina') return posts.filter((p) => p.sourceModule === 'fotocabina');
    if (activeTab === '360') return posts.filter((p) => p.sourceModule === 'plataforma_360');
    if (activeTab === 'espejo') return posts.filter((p) => p.sourceModule === 'espejo_magico');
    if (activeTab === 'bogue') return posts.filter((p) => p.sourceModule === 'bogue' || p.sourceModule === 'boomerang');
    if (activeTab === 'buzon') return posts.filter((p) => p.sourceModule === 'buzon' || p.sourceModule === 'capsulaTiempo');
    if (activeTab === 'invitados') {
      return posts.filter((p) => !p.sourceModule || p.sourceModule === 'muro' || p.sourceModule === 'invitado');
    }
    return posts;
  }, [posts, activeTab]);

  const showNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev !== null && prev < filteredPosts.length - 1 ? prev + 1 : 0));
  }, [lightboxIndex, filteredPosts.length]);

  const showPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredPosts.length - 1));
  }, [lightboxIndex, filteredPosts.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') showNext();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'Escape') setLightboxIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, showNext, showPrev]);

  const nombreFiesta = fiesta?.configuracion?.nombreEvento || 'Álbum del Evento';
  const fechaFiesta = fiesta?.configuracion?.fechaEvento
    ? new Date(fiesta.configuracion.fechaEvento).toLocaleDateString('es-UY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-amber-500 selection:text-zinc-950">
      {/* Top Bar / Header */}
      <header className="relative border-b border-white/10 bg-zinc-950/80 backdrop-blur-md pt-8 pb-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Álbum Oficial de Recuerdos
          </span>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl">
            {nombreFiesta}
          </h1>

          {fechaFiesta && (
            <p className="flex items-center gap-2 text-sm sm:text-base text-zinc-400 font-medium">
              <Calendar className="w-4 h-4 text-amber-400" />
              {fechaFiesta}
            </p>
          )}

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-zinc-950 font-bold text-sm hover:bg-zinc-200 transition-all shadow-lg hover:shadow-white/10 active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  ¡Enlace copiado!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Compartir álbum
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      {posts.length > 0 && (
        <div className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md border-b border-white/5 py-3 px-4">
          <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto hide-scrollbar justify-center sm:justify-start">
            {[
              { id: 'todas', label: `Todas (${posts.length})` },
              { id: 'fotocabina', label: '📸 Fotocabina' },
              { id: '360', label: '🌐 360°' },
              { id: 'espejo', label: '✨ Espejo' },
              { id: 'bogue', label: '⚡ Boomerang' },
              { id: 'buzon', label: '🎙️ Buzón' },
              { id: 'invitados', label: '📱 Invitados' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FilterTab)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  activeTab === tab.id
                    ? 'bg-amber-400 text-zinc-950 border-amber-400'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gallery Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {isLoading && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center text-zinc-500">
            <Loader2 className="w-10 h-10 animate-spin text-amber-400 mb-4" />
            <p className="text-sm font-medium">Abriendo el álbum de fotos...</p>
          </div>
        ) : hasError && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center text-zinc-500">
            <p className="text-lg font-bold text-red-400">No se pudieron cargar los recuerdos.</p>
            <p className="text-sm mt-1">Por favor verificá tu conexión a internet.</p>
            <button
              onClick={loadPosts}
              className="mt-6 px-6 py-2 bg-white text-zinc-950 rounded-full text-sm font-bold hover:bg-zinc-200 transition"
            >
              Reintentar
            </button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-amber-400">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Aún no hay fotos en este álbum</h3>
            <p className="text-sm text-zinc-400 max-w-md">
              Apenas el fotógrafo o los invitados capturen recuerdos en la fiesta, las fotos aprobadas se mostrarán acá en alta definición.
            </p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
            {filteredPosts.map((post, index) => {
              const video = isVideo(post.imageUrl);
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.5) }}
                  className="break-inside-avoid relative group rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 cursor-zoom-in shadow-md hover:shadow-2xl transition-all"
                  onClick={() => setLightboxIndex(index)}
                >
                  {video ? (
                    <>
                      <video
                        src={post.imageUrl}
                        className="w-full h-auto"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-1.5 rounded-full">
                        <Play className="w-3 h-3 text-white" />
                      </div>
                    </>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.imageUrl}
                      alt={post.authorName || 'Foto del evento'}
                      className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}

                  {/* Gradient Info Overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-sm font-bold truncate text-white">
                      {post.authorName || 'Invitado'}
                    </p>
                    {post.caption && (
                      <p className="text-xs text-zinc-300 line-clamp-2 mt-0.5">
                        {post.caption}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-300">
                      {post.likes ? (
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-rose-500 fill-current" /> {post.likes}
                        </span>
                      ) : null}
                      {post.sourceModule && (
                        <span className="capitalize bg-white/10 px-2 py-0.5 rounded-full text-[10px]">
                          {post.sourceModule.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Botón de Reseña de Google para Invitado (Orden 6) */}
        {enlaceResena ? (
          <div className="mt-14 max-w-md mx-auto px-4">
            <a
              href={enlaceResena}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/50 transition group"
            >
              <div className="flex items-center gap-3 text-left">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-amber-500/10 text-amber-400">
                  <Star className="h-5 w-5 fill-current" />
                </span>
                <div>
                  <p className="font-bold text-white text-sm">¿Te gustaron las fotos?</p>
                  <p className="text-xs text-zinc-400">Contanos cómo la pasaste en Google</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 flex-none text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-amber-400" />
            </a>
          </div>
        ) : null}

        {/* Footer Comercial: Contacto directo para invitados */}
        <footer className="mt-20 pt-10 pb-12 text-center border-t border-white/10 space-y-6">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-zinc-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Organizado y capturado por AK Producciones</span>
            </div>
            <p className="text-sm font-semibold text-white">¿Querés que tu fiesta tenga esta tecnología y momentos?</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={buildAkWhatsAppUrl(
                `¡Hola AK Producciones! Estuve viendo el álbum de fotos de ${
                  fiesta?.configuracion?.nombreEvento || 'la fiesta'
                } y me encantó. Quería consultarles para mi propio evento.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all hover:scale-105"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Escribinos por WhatsApp</span>
            </a>

            <a
              href={appendCommercialAttribution('/simulador-de-presupuesto', {
                source: 'guest_portal',
                campaign: 'album_publico',
                refFiestaId: fiestaId,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white font-semibold text-xs border border-white/10 transition-all"
            >
              <span>Calcular presupuesto online</span>
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </footer>
      </main>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && filteredPosts[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center"
          >
            {/* Top Bar */}
            <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
              <div className="text-left">
                <p className="font-bold text-white">
                  {filteredPosts[lightboxIndex].authorName || 'Invitado'}
                </p>
                <p className="text-xs text-zinc-400">
                  {new Date(
                    filteredPosts[lightboxIndex].timestamp || Date.now()
                  ).toLocaleDateString('es-UY', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Enlace directo a propósito (YA-RESUELTO.md) */}
                <a
                  href={filteredPosts[lightboxIndex].imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="p-2.5 bg-white/10 rounded-full hover:bg-white/20 text-white transition"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Descargar foto"
                  title="Descargar foto"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button
                  aria-label="Cerrar"
                  onClick={() => setLightboxIndex(null)}
                  className="p-2.5 bg-white/10 rounded-full hover:bg-white/20 text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Left Button */}
            {filteredPosts.length > 1 && (
              <button
                aria-label="Foto anterior"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrev();
                }}
                className="absolute left-3 p-3 bg-black/60 hover:bg-white/10 rounded-full text-white transition z-10 md:left-6"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            {/* Media Canvas */}
            <div
              className="w-full h-full p-4 md:p-12 flex items-center justify-center relative select-none"
              onClick={() => setLightboxIndex(null)}
            >
              {isVideo(filteredPosts[lightboxIndex].imageUrl) ? (
                <video
                  src={filteredPosts[lightboxIndex].imageUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={filteredPosts[lightboxIndex].imageUrl}
                  alt="Recuerdo en tamaño completo"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>

            {/* Right Button */}
            {filteredPosts.length > 1 && (
              <button
                aria-label="Foto siguiente"
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
                className="absolute right-3 p-3 bg-black/60 hover:bg-white/10 rounded-full text-white transition z-10 md:right-6"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}

            {/* Bottom Counter */}
            <div className="absolute bottom-4 inset-x-0 text-center z-10 pointer-events-none">
              <span className="bg-black/70 px-4 py-1.5 rounded-full text-xs font-bold text-zinc-300 backdrop-blur-sm border border-white/10">
                {lightboxIndex + 1} de {filteredPosts.length}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
