'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Share2,
  Heart,
  Loader2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  X,
  Camera,
  Sparkles,
  Calendar,
  Check,
  BookOpen,
  LayoutGrid,
  PartyPopper,
  ExternalLink,
  Star,
  MessageCircle,
  Music,
} from 'lucide-react';
import { getPublicSocialEvent, getPublicSocialPosts } from '@/app/actions/social-gallery';
import { getDedications } from '@/app/actions/social-interactive';
import { getEnlaceDeResenaPublico } from '@/app/actions/feedback';
import type { PublicSocialEvent } from '@/lib/social-fiesta/public-event';
import type { SocialGalleryPost, Dedication } from '@/types/social-gallery';
import { appendCommercialAttribution } from '@/lib/commercial/acquisition';
import { buildAkWhatsAppUrl } from '@/lib/public-contact';
import { useToast } from '@/hooks/use-toast';
import { armarAlbumInteligente, type AlbumDigitalCompleto, type RecuerdoAlbum } from '@/lib/album/armar-album';

type ViewMode = 'libro' | 'cuadricula';
type FilterTab = 'todas' | 'fotocabina' | '360' | 'espejo' | 'bogue' | 'buzon' | 'invitados' | 'mensajes';

function isVideo(url: string = ''): boolean {
  return url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('video');
}

export default function PublicAlbumPage() {
  const params = useParams();
  const { toast } = useToast();
  const fiestaId = params.fiestaId as string;

  const [fiesta, setFiesta] = useState<PublicSocialEvent | null>(null);
  const [posts, setPosts] = useState<SocialGalleryPost[]>([]);
  const [dedications, setDedications] = useState<Dedication[]>([]);
  const [enlaceResena, setEnlaceResena] = useState<string>('');
  const [activeTab, setActiveTab] = useState<FilterTab>('todas');
  const [viewMode, setViewMode] = useState<ViewMode>('libro');
  const [paginaActual, setPaginaActual] = useState<number>(0); // 0 = Portada, 1..N = Páginas
  const [audioReproduciendo, setAudioReproduciendo] = useState<string | null>(null);
  const [musicaActiva, setMusicaActiva] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cancionFiesta =
    fiesta?.cancionUrl ||
    fiesta?.socialGallerySettings?.cancionUrl ||
    fiesta?.socialGallerySettings?.musicaFondoUrl;

  const toggleMusica = useCallback(() => {
    if (!audioRef.current) return;
    if (musicaActiva) {
      audioRef.current.pause();
      setMusicaActiva(false);
    } else {
      audioRef.current.play()
        .then(() => setMusicaActiva(true))
        .catch((err) => {
          console.error('Error al reproducir música del álbum:', err);
        });
    }
  }, [musicaActiva]);

  useEffect(() => {
    const elementoAudio = audioRef.current;
    return () => {
      if (elementoAudio) {
        elementoAudio.pause();
      }
    };
  }, []);


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
      const [data, deds] = await Promise.all([
        getPublicSocialPosts(fiestaId),
        getDedications(fiestaId).catch(() => []),
      ]);
      setPosts(data);
      setDedications(deds);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Armar álbum digital con selección inteligente
  const albumDigital: AlbumDigitalCompleto = useMemo(() => {
    return armarAlbumInteligente({
      posts,
      dedicatorias: dedications,
      fiesta: fiesta as any,
      maxRecuerdos: 40,
    });
  }, [posts, dedications, fiesta]);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const title = fiesta?.configuracion?.nombreEvento || 'Álbum del Evento';
    const text = `Mirá las fotos y recuerdos de ${title} en el álbum oficial.`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {}
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
      if (lightboxIndex !== null) {
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();
        if (e.key === 'Escape') setLightboxIndex(null);
      } else if (viewMode === 'libro') {
        if (e.key === 'ArrowRight' && paginaActual < albumDigital.totalPaginas) {
          setPaginaActual((p) => p + 1);
        }
        if (e.key === 'ArrowLeft' && paginaActual > 0) {
          setPaginaActual((p) => p - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, showNext, showPrev, viewMode, paginaActual, albumDigital.totalPaginas]);

  const nombreFiesta = fiesta?.configuracion?.nombreEvento || 'Álbum del Evento';
  const fechaFiesta = fiesta?.configuracion?.fechaEvento
    ? new Date(fiesta.configuracion.fechaEvento).toLocaleDateString('es-UY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const paginaItems = paginaActual > 0 ? albumDigital.paginas[paginaActual - 1]?.recuerdos || [] : [];

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-amber-500 selection:text-zinc-950">
      {/* Top Bar / Header */}
      <header className="relative border-b border-white/10 bg-zinc-950/80 backdrop-blur-md pt-8 pb-8 px-4 sm:px-6">
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

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex rounded-full bg-zinc-900 p-1 border border-white/10">
              <button
                onClick={() => setViewMode('libro')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  viewMode === 'libro'
                    ? 'bg-amber-400 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Libro de Recuerdos
              </button>
              <button
                onClick={() => setViewMode('cuadricula')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  viewMode === 'cuadricula'
                    ? 'bg-amber-400 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Galería Completa
              </button>
            </div>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all shadow-lg active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  Compartir álbum
                </>
              )}
            </button>

            {/* Música de fondo del álbum: solo aparece si la fiesta tiene canción cargada */}
            {cancionFiesta && (
              <button
                onClick={toggleMusica}
                aria-label={musicaActiva ? 'Silenciar música' : 'Activar música de fondo'}
                data-testid="boton-musica-album"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all shadow-md active:scale-95 border ${
                  musicaActiva
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-zinc-900 border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {musicaActiva ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>Música sonando</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Música de fondo</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {isLoading && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center text-zinc-500">
            <Loader2 className="w-10 h-10 animate-spin text-amber-400 mb-4" />
            <p className="text-sm font-medium">Cargando los recuerdos de la fiesta...</p>
          </div>
        ) : hasError && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center text-zinc-500">
            <p className="text-lg font-bold text-red-400">No se pudieron cargar los recuerdos.</p>
          </div>
        ) : viewMode === 'libro' ? (
          /* MODO LIBRO INTERACTIVO DE RECUERDOS */
          <div className="space-y-6">
            <div className="relative min-h-[500px] sm:min-h-[600px] rounded-3xl bg-zinc-900/90 border border-white/10 shadow-2xl p-6 sm:p-10 flex flex-col justify-between overflow-hidden">
              <AnimatePresence mode="wait">
                {paginaActual === 0 ? (
                  /* PORTADA DEL ÁLBUM */
                  <motion.div
                    key="portada"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.04 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center justify-center text-center my-auto py-12 space-y-6"
                  >
                    {albumDigital.portada.fotoPortadaUrl && (
                      <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 mx-auto group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={albumDigital.portada.fotoPortadaUrl}
                          alt={nombreFiesta}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                    )}

                    <div className="space-y-2 max-w-xl">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                        Edición Especial
                      </span>
                      <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                        {albumDigital.portada.titulo}
                      </h2>
                      <p className="text-sm sm:text-base text-zinc-300">
                        {albumDigital.portada.subtitulo}
                      </p>
                      <p className="text-xs text-zinc-500 font-medium">
                        {albumDigital.portada.fecha} · {albumDigital.totalRecuerdos} recuerdos seleccionados
                      </p>
                    </div>

                    <button
                      onClick={() => setPaginaActual(1)}
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-sm transition-all shadow-xl shadow-amber-400/20 active:scale-95"
                    >
                      Abrir Álbum <ChevronRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                ) : (
                  /* PÁGINAS DEL ÁLBUM (2 RECUERDOS POR PÁGINA) */
                  <motion.div
                    key={`pagina-${paginaActual}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="grid sm:grid-cols-2 gap-6 my-auto"
                  >
                    {paginaItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col bg-zinc-950/70 border border-white/10 rounded-2xl p-4 shadow-lg space-y-3 justify-between"
                      >
                        {item.tipo === 'audio' || item.audioUrl ? (
                          /* TARJETA DE AUDIO DE BUZÓN */
                          <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-4 text-center my-auto">
                            <div className="w-14 h-14 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center mx-auto shadow-lg">
                              <Volume2 className="w-7 h-7" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                                🎙️ Mensaje de Voz del Buzón
                              </span>
                              <p className="text-sm font-semibold text-white mt-1">
                                {item.autor}
                              </p>
                              {item.mensaje && (
                                <p className="text-xs text-zinc-300 italic mt-2">
                                  "{item.mensaje}"
                                </p>
                              )}
                            </div>
                            {item.audioUrl && (
                              <audio
                                src={item.audioUrl}
                                controls
                                className="w-full h-10 mt-2 rounded-lg"
                              />
                            )}
                          </div>
                        ) : item.tipo === 'video' ? (
                          <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                            <video
                              src={item.imageUrl}
                              controls
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="relative rounded-xl overflow-hidden bg-zinc-900 aspect-[4/3] group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.imageUrl}
                              alt={item.autor}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                              <p className="text-xs font-bold text-white truncate">{item.autor}</p>
                              {item.mensaje && (
                                <p className="text-[11px] text-zinc-300 line-clamp-2">{item.mensaje}</p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                          <span className="font-semibold text-zinc-300 truncate">
                            {item.autor}
                          </span>
                          {item.modulo && (
                            <span className="capitalize bg-white/10 px-2 py-0.5 rounded-full text-[10px]">
                              {item.modulo.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CONTROLES DE PAGINACIÓN */}
              <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-6">
                <button
                  onClick={() => setPaginaActual((p) => Math.max(0, p - 1))}
                  disabled={paginaActual === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>

                <span className="text-xs font-semibold text-zinc-400">
                  {paginaActual === 0
                    ? 'Portada'
                    : `Página ${paginaActual} de ${albumDigital.totalPaginas}`}
                </span>

                <button
                  onClick={() => setPaginaActual((p) => Math.min(albumDigital.totalPaginas, p + 1))}
                  disabled={paginaActual >= albumDigital.totalPaginas}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* MODO CUADRÍCULA CON SOLAPAS DE ESTACIÓN */
          <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
              {[
                { id: 'todas', label: `Todas (${posts.length})` },
                { id: 'fotocabina', label: '📸 Fotocabina' },
                { id: '360', label: '🌐 360°' },
                { id: 'espejo', label: '✨ Espejo' },
                { id: 'bogue', label: '⚡ Boomerang' },
                { id: 'buzon', label: '🎙️ Buzón' },
                { id: 'invitados', label: '📱 Invitados' },
                { id: 'mensajes', label: `💌 Mensajes (${dedications.length})` },
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

            {activeTab === 'mensajes' ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dedications.map((ded) => (
                  <div
                    key={ded.id}
                    className="p-6 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-3 shadow-lg"
                  >
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                      💌 Dedicatoria
                    </span>
                    <p className="text-base font-medium text-white/90 leading-relaxed italic">
                      "{ded.message}"
                    </p>
                    <p className="text-xs font-bold text-zinc-400 tracking-wider uppercase">
                      — {ded.authorName || 'Invitado'}
                    </p>
                    {ded.audioUrl && (
                      <audio src={ded.audioUrl} controls className="w-full h-8 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Camera className="w-12 h-12 text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-400">No hay fotos en esta sección todavía.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {filteredPosts.map((post, idx) => (
                  <div
                    key={post.id}
                    onClick={() => setLightboxIndex(idx)}
                    className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 cursor-pointer aspect-square"
                  >
                    {isVideo(post.imageUrl) ? (
                      <video
                        src={post.imageUrl}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={post.imageUrl}
                        alt={post.authorName || 'Recuerdo'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                      <p className="text-xs font-bold text-white truncate">{post.authorName || 'Invitado'}</p>
                      {post.caption && (
                        <p className="text-[10px] text-zinc-300 line-clamp-1">{post.caption}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Banner de reseña de Google para invitados */}
        {enlaceResena ? (
          <div className="mt-12 p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              Tu opinión nos ayuda a crecer
            </span>
            <h3 className="text-xl font-bold text-white">
              ¿Disfrutaste de la fiesta?
            </h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Contanos cómo la pasaste en Google y compartí tu experiencia con otros invitados y familias.
            </p>
            <div className="pt-2">
              <a
                href={enlaceResena}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs transition-all shadow-lg active:scale-95"
              >
                Contanos cómo la pasaste en Google <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer comercial */}
      <footer className="mt-16 border-t border-white/10 bg-zinc-950/90 py-8 px-4 text-center text-xs text-zinc-400">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="font-semibold text-zinc-300">
            Organizado y capturado por AK Producciones
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href={buildAkWhatsAppUrl(`Hola! Vi el álbum del evento ${nombreFiesta} y quiero consultar para mi fiesta.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Escribinos por WhatsApp
            </a>
          </div>
        </div>
      </footer>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && filteredPosts[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          >
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <button
              onClick={showPrev}
              className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={showNext}
              className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div className="max-w-4xl max-h-[85vh] flex flex-col items-center">
              {isVideo(filteredPosts[lightboxIndex].imageUrl) ? (
                <video
                  src={filteredPosts[lightboxIndex].imageUrl}
                  controls
                  autoPlay
                  className="max-h-[75vh] w-auto rounded-xl object-contain"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={filteredPosts[lightboxIndex].imageUrl}
                  alt="Recuerdo en grande"
                  className="max-h-[75vh] w-auto rounded-xl object-contain shadow-2xl"
                />
              )}
              <div className="mt-4 text-center space-y-1">
                <p className="text-sm font-bold text-white">
                  {filteredPosts[lightboxIndex].authorName || 'Invitado'}
                </p>
                {filteredPosts[lightboxIndex].caption && (
                  <p className="text-xs text-zinc-300 italic">
                    "{filteredPosts[lightboxIndex].caption}"
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Música de fondo del álbum: usa la canción de la fiesta y arranca en silencio */}
      {cancionFiesta && (
        <audio
          ref={audioRef}
          src={cancionFiesta}
          loop
          preload="auto"
          data-testid="audio-fondo-album"
        />
      )}
    </div>
  );
}

