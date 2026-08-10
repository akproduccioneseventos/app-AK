'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Heart, ArrowLeft, Loader2, Play, ChevronLeft, ChevronRight, X, ImageIcon } from 'lucide-react';
import { getPublicSocialEvent, getPublicSocialPosts } from '@/app/actions/social-gallery';
import type { PublicSocialEvent } from '@/lib/social-fiesta/public-event';
import type { SocialGalleryPost } from '@/types/social-gallery';

type FilterTab = 'todas' | 'fotocabina' | '360' | 'espejo' | 'invitados';

export default function GaleriaPage() {
  const params = useParams();
  const router = useRouter();
  const fiestaId = params.fiestaId as string;
  
  const [fiesta, setFiesta] = useState<PublicSocialEvent | null>(null);
  const [posts, setPosts] = useState<SocialGalleryPost[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('todas');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    getPublicSocialEvent(fiestaId).then(setFiesta).catch(() => {});
  }, [fiestaId]);

  const loadPosts = useCallback(async () => {
    try {
      setHasError(false);
      setPosts(await getPublicSocialPosts(fiestaId));
    } catch (e) {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    loadPosts();
    const interval = setInterval(loadPosts, 10000);
    return () => clearInterval(interval);
  }, [loadPosts]);

  const filteredPosts = useMemo(() => {
    if (activeTab === 'todas') return posts;
    if (activeTab === 'fotocabina') return posts.filter(p => p.sourceModule === 'fotocabina');
    if (activeTab === '360') return posts.filter(p => p.sourceModule === 'plataforma360' || p.sourceModule === 'plataforma_360');
    if (activeTab === 'espejo') {
      return posts.filter(p =>
        p.sourceModule === 'espejoMagico' ||
        p.sourceModule === 'espejo_magico' ||
        p.sourceModule === 'espejoMagicoFoto' ||
        p.sourceModule === 'espejoMagicoFirma' ||
        p.sourceModule === 'espejoMagicoIA'
      );
    }
    if (activeTab === 'invitados') return posts.filter(p => p.source === 'guest');
    return posts;
  }, [posts, activeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') {
        setLightboxIndex(index => index === null ? null : Math.max(0, index - 1));
      }
      if (e.key === 'ArrowRight') {
        setLightboxIndex(index => index === null ? null : Math.min(filteredPosts.length - 1, index + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredPosts.length, lightboxIndex]);

  const totalLikes = useMemo(() => posts.reduce((sum, p) => sum + (p.likes || 0), 0), [posts]);
  const totalComments = useMemo(() => posts.reduce((sum, p) => sum + Object.keys(p.comments || {}).length, 0), [posts]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Galería de la Fiesta', url });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Enlace copiado al portapapeles');
      }
    } catch (e) {}
  };

  const showNext = () => {
    if (lightboxIndex !== null && lightboxIndex < filteredPosts.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  const showPrev = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const isVideo = (url: string) => url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.mov') || url.toLowerCase().includes('video');

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-white/30">
      
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button aria-label="Volver al evento" onClick={() => router.back()} className="p-2 -ml-2 text-zinc-400 hover:text-white transition">
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <h1 className="text-lg font-black tracking-widest uppercase">Galería Oficial</h1>
            {fiesta && <p className="text-xs text-zinc-400 font-medium">{fiesta.configuracion?.nombreEvento}</p>}
          </div>

          <button aria-label="Compartir galería" onClick={handleShare} className="p-2 -mr-2 text-zinc-400 hover:text-white transition">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* STATS BAR */}
        <div className="flex items-center justify-center gap-4 py-2 border-t border-white/5 bg-white/5 text-xs font-bold text-zinc-300">
          <span>{posts.length} fotos</span>
          <span className="text-zinc-600">·</span>
          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-500" /> {totalLikes}</span>
          <span className="text-zinc-600">·</span>
          <span>{totalComments} comentarios</span>
        </div>

        {/* FILTER TABS */}
        <div className="px-4 py-3 overflow-x-auto hide-scrollbar flex gap-2">
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'fotocabina', label: '📸 Fotocabina' },
            { id: '360', label: '🌐 360°' },
            { id: 'espejo', label: '✨ Espejo' },
            { id: 'invitados', label: '📱 Invitados' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as FilterTab)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                activeTab === tab.id 
                  ? 'bg-white text-zinc-950 border-white' 
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* GALLERY GRID */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading && posts.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
          </div>
        ) : hasError && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center text-zinc-500">
            <p className="text-lg font-medium text-red-400">No se pudieron cargar las fotos.</p>
            <p className="text-sm mt-1">Hubo un problema de conexión.</p>
            <button onClick={loadPosts} className="mt-6 px-6 py-2 bg-white text-zinc-950 rounded-full text-sm font-bold hover:bg-zinc-200 transition">
              Reintentar
            </button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center text-zinc-500">
            <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Aún no hay fotos en esta categoría.</p>
            <p className="text-sm">¡Sé el primero en compartir un momento!</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {filteredPosts.map((post, index) => {
              const video = isVideo(post.imageUrl);
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="break-inside-avoid relative group rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 cursor-zoom-in"
                  onClick={() => setLightboxIndex(index)}
                >
                  {video ? (
                    <>
                      <video src={post.imageUrl} className="w-full h-auto" autoPlay muted loop playsInline />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-1.5 rounded-full">
                        <Play className="w-3 h-3 text-white" />
                      </div>
                    </>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- Guest media has variable dimensions and may be a data URL.
                    <img src={post.imageUrl} alt={post.authorName || 'Foto'} className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  )}
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-sm font-bold truncate">{post.authorName || 'Invitado'}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-zinc-300"><Heart className="w-3 h-3 text-rose-500" /> {post.likes || 0}</span>
                      {post.sourceModule && <span className="text-xs text-zinc-400 capitalize bg-white/10 px-2 py-0.5 rounded-full">{post.sourceModule.replace('_', ' ')}</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center"
          >
            {/* Top Bar */}
            <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent pt-safe">
              <div className="text-left">
                <p className="font-bold">{filteredPosts[lightboxIndex].authorName || 'Invitado'}</p>
                <p className="text-xs text-zinc-400">{new Date(filteredPosts[lightboxIndex].timestamp || Date.now()).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-4">
                <a 
                  href={filteredPosts[lightboxIndex].imageUrl} 
                  download 
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Descargar archivo"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button aria-label="Cerrar galería" onClick={() => setLightboxIndex(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Navigation Left */}
            {lightboxIndex > 0 && (
              <button aria-label="Foto anterior" onClick={(e) => { e.stopPropagation(); showPrev(); }} className="absolute left-2 p-3 bg-black/60 hover:bg-white/10 rounded-full text-white transition z-10 md:left-4">
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            {/* Media */}
            <div className="w-full h-full p-4 md:p-12 flex items-center justify-center relative" onClick={() => setLightboxIndex(null)}>
              {isVideo(filteredPosts[lightboxIndex].imageUrl) ? (
                <video 
                  src={filteredPosts[lightboxIndex].imageUrl} 
                  controls 
                  autoPlay 
                  loop 
                  playsInline
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- Full-size guest media preserves its original dimensions.
                <img 
                  src={filteredPosts[lightboxIndex].imageUrl} 
                  alt="Ampliada" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  onClick={e => e.stopPropagation()}
                />
              )}
            </div>

            {/* Navigation Right */}
            {lightboxIndex < filteredPosts.length - 1 && (
              <button aria-label="Foto siguiente" onClick={(e) => { e.stopPropagation(); showNext(); }} className="absolute right-2 p-3 bg-black/60 hover:bg-white/10 rounded-full text-white transition z-10 md:right-4">
                <ChevronRight className="w-8 h-8" />
              </button>
            )}

            {/* Bottom Bar (Mobile swipe hint / Info) */}
            <div className="absolute bottom-4 inset-x-0 text-center z-10 md:hidden pointer-events-none">
              <span className="bg-black/60 px-4 py-1.5 rounded-full text-xs font-bold text-zinc-300">
                {lightboxIndex + 1} de {filteredPosts.length}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
