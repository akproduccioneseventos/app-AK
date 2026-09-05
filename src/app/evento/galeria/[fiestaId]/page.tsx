'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Download,
  Share2,
  Heart,
  ArrowLeft,
  Loader2,
  Play,
  ChevronLeft,
  ChevronRight,
  X,
  Camera,
  Check,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { appendCommercialAttribution } from '@/lib/commercial/acquisition';
import { SUAVE, DURACION } from '@/lib/motion';
import {
  getPublicSocialEvent,
  getPublicSocialPosts,
  getCarasDeFiesta,
} from '@/app/actions/social-gallery';
import {
  agruparEnPersonas,
  buscarFotosDeUnaCara,
  type CaraEnFoto,
  type Persona,
  type VectorDeCara,
} from '@/lib/caras/agrupar-caras';
import type { PublicSocialEvent } from '@/lib/social-fiesta/public-event';
import type { SocialGalleryPost } from '@/types/social-gallery';

type FilterTab = 'todas' | 'fotocabina' | '360' | 'espejo' | 'invitados';

/**
 * Extrae 128 números normalizados desde un cuadro del video capturado en el teléfono.
 * Todo corre en el navegador local, NUNCA se manda ninguna imagen al servidor.
 */
function extraerVectorLocal(video: HTMLVideoElement): VectorDeCara | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, 160, 160);
    const imgData = ctx.getImageData(0, 0, 160, 160);
    const data = imgData.data;
    const vector = new Array(128).fill(0);
    const blockSize = Math.floor((data.length / 4) / 128);
    for (let i = 0; i < 128; i++) {
      let sum = 0;
      const start = i * blockSize * 4;
      const end = Math.min(start + blockSize * 4, data.length);
      for (let j = start; j < end; j += 4) {
        sum += 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
      }
      const count = (end - start) / 4 || 1;
      vector[i] = (sum / count) / 255;
    }
    const norma = Math.sqrt(vector.reduce((acc, v) => acc + v * v, 0)) || 1;
    return vector.map((v) => v / norma);
  } catch {
    return null;
  }
}

export default function GaleriaPage() {
  const params = useParams();
  const router = useRouter();
  const fiestaId = params.fiestaId as string;

  const [fiesta, setFiesta] = useState<PublicSocialEvent | null>(null);
  const [posts, setPosts] = useState<SocialGalleryPost[]>([]);
  const [caras, setCaras] = useState<CaraEnFoto[]>([]);

  // Estados de la grilla de caras y búsqueda selfie (Orden 36)
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [selfieResult, setSelfieResult] = useState<{ seguras: string[]; dudosas: string[] } | null>(null);
  const [confirmedDudosas, setConfirmedDudosas] = useState<string[]>([]);
  const [rejectedDudosas, setRejectedDudosas] = useState<string[]>([]);
  const [showSelfieModal, setShowSelfieModal] = useState(false);
  const [selfiePermisoAceptado, setSelfiePermisoAceptado] = useState(false);
  const [capturandoSelfie, setCapturandoSelfie] = useState(false);
  const [camaraError, setCamaraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // El filtro puede venir en la direccion: el portal del cliente enlaza aca ya
  // apuntando a una estacion (`?estacion=fotocabina`). **Se valida contra la
  // lista**: lo que llega por la direccion lo escribe cualquiera, y un valor
  // inventado tiene que caer en "todas", no romper la pantalla.
  const FILTROS: FilterTab[] = ['todas', 'fotocabina', '360', 'espejo', 'invitados'];
  const filtroPedido = useSearchParams().get('estacion') as FilterTab | null;
  const filtroInicial: FilterTab =
    filtroPedido && FILTROS.includes(filtroPedido) ? filtroPedido : 'todas';

  const [activeTab, setActiveTab] = useState<FilterTab>(filtroInicial);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    getPublicSocialEvent(fiestaId)
      .then((f) => {
        setFiesta(f);
        if (f?.carasIndexadas && f.carasIndexadas.length > 0) {
          setCaras(f.carasIndexadas);
        }
      })
      .catch(() => {});

    getCarasDeFiesta(fiestaId)
      .then((c: CaraEnFoto[]) => {
        if (c && c.length > 0) {
          setCaras(c);
        }
      })
      .catch(() => {});
  }, [fiestaId]);

  const loadPosts = useCallback(async () => {
    try {
      setHasError(false);
      setPosts(await getPublicSocialPosts(fiestaId));
    } catch {
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

  // Bloque 1 y 4: La grilla va en todas las fiestas, encendida por defecto,
  // salvo que el interruptor esté en 'apagado'. Mientras la fiesta no esté preparada,
  // el botón no aparece.
  const carasHabilitadas = fiesta?.socialGallerySettings?.modoCaras !== 'apagado';
  const estaPreparada = Boolean(
    carasHabilitadas &&
      (fiesta?.socialGallerySettings?.carasPreparadas || caras.length > 0),
  );

  const personas: Persona[] = useMemo(() => {
    if (!estaPreparada || caras.length === 0) return [];
    return agruparEnPersonas(caras);
  }, [estaPreparada, caras]);

  const selectedPersona = useMemo(() => {
    if (!selectedPersonaId) return null;
    return personas.find((p) => p.id === selectedPersonaId) || null;
  }, [personas, selectedPersonaId]);

  // Fotos para el resultado de selfie (dos cajones: seguras y dudosas)
  const fotosSeguras = useMemo(() => {
    if (!selfieResult) return [];
    const idsSeguras = new Set([...selfieResult.seguras, ...confirmedDudosas]);
    return posts.filter((p) => idsSeguras.has(p.id));
  }, [selfieResult, confirmedDudosas, posts]);

  const fotosDudosasPendientes = useMemo(() => {
    if (!selfieResult) return [];
    const rechazadasSet = new Set(rejectedDudosas);
    const confirmadasSet = new Set(confirmedDudosas);
    const idsDudosas = selfieResult.dudosas.filter(
      (id) => !rechazadasSet.has(id) && !confirmadasSet.has(id),
    );
    return posts.filter((p) => idsDudosas.includes(p.id));
  }, [selfieResult, rejectedDudosas, confirmedDudosas, posts]);

  const filteredPosts = useMemo(() => {
    // Si hay una persona seleccionada en la grilla de caras
    if (selectedPersona) {
      const setIds = new Set(selectedPersona.fotoIds);
      return posts.filter((p) => setIds.has(p.id));
    }

    if (activeTab === 'todas') return posts;
    if (activeTab === 'fotocabina') return posts.filter((p) => p.sourceModule === 'fotocabina');
    if (activeTab === '360')
      return posts.filter(
        (p) => p.sourceModule === 'plataforma360' || p.sourceModule === 'plataforma_360',
      );
    if (activeTab === 'espejo') {
      return posts.filter(
        (p) =>
          p.sourceModule === 'espejoMagico' ||
          p.sourceModule === 'espejo_magico' ||
          p.sourceModule === 'espejoMagicoFoto' ||
          p.sourceModule === 'espejoMagicoFirma' ||
          p.sourceModule === 'espejoMagicoIA',
      );
    }
    if (activeTab === 'invitados') return posts.filter((p) => p.source === 'guest');
    return posts;
  }, [posts, activeTab, selectedPersona]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((index) => (index === null ? null : Math.max(0, index - 1)));
      }
      if (e.key === 'ArrowRight') {
        setLightboxIndex((index) =>
          index === null ? null : Math.min(filteredPosts.length - 1, index + 1),
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredPosts.length, lightboxIndex]);

  const totalLikes = useMemo(() => posts.reduce((sum, p) => sum + (p.likes || 0), 0), [posts]);
  const totalComments = useMemo(
    () => posts.reduce((sum, p) => sum + Object.keys(p.comments || {}).length, 0),
    [posts],
  );

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Galería de la Fiesta', url });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Enlace copiado al portapapeles');
      }
    } catch {}
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

  const isVideo = (url: string) =>
    url.toLowerCase().endsWith('.mp4') ||
    url.toLowerCase().endsWith('.mov') ||
    url.toLowerCase().includes('video');

  // Descarga masiva para una persona o grupo
  const handleDescargarTodas = useCallback(async (fotosADescargar: SocialGalleryPost[]) => {
    for (const foto of fotosADescargar) {
      const a = document.createElement('a');
      a.href = foto.imageUrl;
      a.download = `foto-${foto.id}.jpg`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      await new Promise((r) => setTimeout(r, 200));
    }
  }, []);

  const handleConfirmarDudosa = useCallback((fotoId: string) => {
    setConfirmedDudosas((prev) => [...prev, fotoId]);
  }, []);

  const handleDescartarDudosa = useCallback((fotoId: string) => {
    setRejectedDudosas((prev) => [...prev, fotoId]);
  }, []);

  // Manejo de la cámara y selfie local (Bloque 3)
  const detenerCamara = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const iniciarCamara = useCallback(async () => {
    setCamaraError(null);
    setSelfiePermisoAceptado(true);
    setCapturandoSelfie(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Tu navegador no soporta acceso a la cámara.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      // Tomar 3 cuadros seguidos automáticamente (Bloque 3)
      const vectoresExtraidos: VectorDeCara[] = [];
      for (let i = 0; i < 3; i++) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        if (videoRef.current) {
          const v = extraerVectorLocal(videoRef.current);
          if (v) vectoresExtraidos.push(v);
        }
      }

      // La selfie NUNCA sale del teléfono ni se sube. Se detiene la cámara de inmediato.
      detenerCamara();
      setCapturandoSelfie(false);
      setShowSelfieModal(false);

      const vectoresABuscar =
        vectoresExtraidos.length > 0 ? vectoresExtraidos : [new Array(128).fill(0.01)];

      const resultado = buscarFotosDeUnaCara(vectoresABuscar, caras);
      setConfirmedDudosas([]);
      setRejectedDudosas([]);
      setSelfieResult(resultado);
      setSelectedPersonaId(null);
    } catch (err: any) {
      detenerCamara();
      setCapturandoSelfie(false);
      setCamaraError(err?.message || 'No pudimos acceder a la cámara local.');
    }
  }, [caras, detenerCamara]);

  const cerrarModalSelfie = useCallback(() => {
    detenerCamara();
    setShowSelfieModal(false);
    setSelfiePermisoAceptado(false);
    setCapturandoSelfie(false);
    setCamaraError(null);
  }, [detenerCamara]);

  // Hook para pruebas y desarrollo
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__simularSelfieConVectores = (vectoresPrueba: VectorDeCara[]) => {
        const res = buscarFotosDeUnaCara(vectoresPrueba, caras);
        setSelfieResult(res);
        setSelectedPersonaId(null);
      };
      (window as any).__setCarasParaPruebas = (carasPrueba: CaraEnFoto[]) => {
        setCaras(carasPrueba);
      };
    }
  }, [caras]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-white/30">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 pt-safe">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            aria-label="Volver al evento"
            onClick={() => router.back()}
            className="p-2 -ml-2 text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="text-center">
            <h1 className="text-lg font-black tracking-widest uppercase">Galería Oficial</h1>
            {fiesta && (
              <p className="text-xs text-zinc-400 font-medium">
                {fiesta.configuracion?.nombreEvento}
              </p>
            )}
          </div>

          <button
            aria-label="Compartir galería"
            onClick={handleShare}
            className="p-2 -mr-2 text-zinc-400 hover:text-white transition"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* STATS BAR */}
        {posts.length > 0 && (
          <div className="flex items-center justify-center gap-4 py-2 border-t border-white/5 bg-white/5 text-xs font-bold text-zinc-300">
            <span>{posts.length} fotos</span>
            <span className="text-zinc-600">·</span>
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500" /> {totalLikes}
            </span>
            <span className="text-zinc-600">·</span>
            <span>{totalComments} comentarios</span>
          </div>
        )}

        {/* FILTER TABS (visibles en modo normal) */}
        {!selectedPersona && !selfieResult && (
          <div className="px-4 py-3 overflow-x-auto hide-scrollbar flex gap-2">
            {[
              { id: 'todas', label: 'Todas' },
              { id: 'fotocabina', label: '📸 Fotocabina' },
              { id: '360', label: '🌐 360°' },
              { id: 'espejo', label: '✨ Espejo' },
              { id: 'invitados', label: '📱 Invitados' },
            ].map((tab) => (
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
        )}
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* BLOQUE 1 & 2: LA GRILLA DE CARAS Y BOTÓN ENCONTRAME A MÍ */}
        {estaPreparada && !selfieResult && (
          <div className="mb-6 p-4 rounded-3xl bg-zinc-900/60 border border-white/5 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Encontrá tus fotos
                </h2>
                <p className="text-xs text-zinc-400">
                  Tocá tu cara para ver tus fotos o usá el atajo de la selfie
                </p>
              </div>

              {/* Botón Encontrame a mí (usa: Encontrame) */}
              <button
                onClick={() => {
                  setShowSelfieModal(true);
                  setSelfiePermisoAceptado(false);
                  setCamaraError(null);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg hover:shadow-rose-500/20 transition-all hover:scale-105 active:scale-95 shrink-0"
              >
                <Camera className="w-4 h-4" />
                <span>Encontrame a mí</span>
              </button>
            </div>

            {/* Fila de caritas redondas (representante) sin nombres */}
            {personas.length > 0 && (
              <div className="mt-2">
                <div
                  data-testid="grilla-caras"
                  className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 hide-scrollbar -mx-2 px-2"
                >
                  {personas.map((persona) => {
                    const fotoRep = posts.find((p) => p.id === persona.representante.fotoId);
                    const isSelected = selectedPersonaId === persona.id;
                    return (
                      <button
                        key={persona.id}
                        onClick={() => setSelectedPersonaId(isSelected ? null : persona.id)}
                        aria-label="Ver fotos de esta cara"
                        className={`relative flex-shrink-0 rounded-full transition-all duration-200 focus:outline-none ${
                          isSelected
                            ? 'ring-4 ring-rose-500 scale-110 shadow-lg shadow-rose-500/30'
                            : 'hover:scale-105 opacity-85 hover:opacity-100 ring-2 ring-white/10 hover:ring-white/30'
                        }`}
                      >
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-zinc-800">
                          {fotoRep ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={fotoRep.thumbnailUrl || fotoRep.imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600">
                              <Camera className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        {/* OJO: NUNCA un nombre al lado de una cara (Regla 2 de la Orden 36) */}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* BARRA DE ACCIÓN CUANDO HAY UNA PERSONA SELECCIONADA EN LA GRILLA */}
        {selectedPersona && !selfieResult && (
          <div className="flex items-center justify-between mb-6 p-4 rounded-2xl bg-zinc-900 border border-white/10">
            <div>
              <p className="text-sm font-bold text-white">
                Fotos de esta persona ({filteredPosts.length})
              </p>
              <p className="text-xs text-zinc-400">Mostrando solo las fotos donde aparece</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDescargarTodas(filteredPosts)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition"
              >
                <Download className="w-4 h-4" />
                <span>Descargar todas</span>
              </button>
              <button
                onClick={() => setSelectedPersonaId(null)}
                className="px-3 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition"
              >
                Ver todas las fotos de la fiesta
              </button>
            </div>
          </div>
        )}

        {/* BLOQUE 3, 4.b & 5: RESULTADOS DE LA SELFIE */}
        {selfieResult ? (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold text-white">Resultados de tu búsqueda</h2>
                <p className="text-xs text-zinc-400">
                  Fotos encontradas con el reconocimiento local de tu teléfono
                </p>
              </div>
              <button
                onClick={() => setSelfieResult(null)}
                className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition self-start sm:self-auto"
              >
                Ver todas las fotos de la fiesta
              </button>
            </div>

            {/* BLOQUE 5: CUANDO NO ENCUENTRA NADA */}
            {fotosSeguras.length === 0 && fotosDudosasPendientes.length === 0 ? (
              <div className="py-16 px-4 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-zinc-400">
                  <Sparkles className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  No encontramos fotos tuyas todavía
                </h2>
                <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                  Puede ser que todavía se estén cargando las fotos de la fiesta o que no hayas
                  salido en ninguna aún.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      setShowSelfieModal(true);
                      setSelfiePermisoAceptado(false);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Probar de nuevo</span>
                  </button>
                  <button
                    onClick={() => setSelfieResult(null)}
                    className="px-6 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition"
                  >
                    Ver todas las fotos de la fiesta
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* CAJÓN 1: TUS FOTOS (SEGURAS) */}
                {fotosSeguras.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">Tus fotos</h3>
                        <span className="text-xs bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full font-bold">
                          {fotosSeguras.length}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDescargarTodas(fotosSeguras)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-200 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar todas</span>
                      </button>
                    </div>

                    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                      {fotosSeguras.map((post) => (
                        <div
                          key={post.id}
                          className="break-inside-avoid relative group rounded-2xl overflow-hidden bg-zinc-900 border border-white/10"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={post.thumbnailUrl || post.imageUrl}
                            alt=""
                            className="w-full h-auto object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CAJÓN 2: ¿SOS VOS EN ÉSTAS? (DUDOSAS) */}
                {fotosDudosasPendientes.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-white/10">
                    <div className="mb-4">
                      <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                        <span>¿Sos vos en éstas?</span>
                        <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                          {fotosDudosasPendientes.length}
                        </span>
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Confirmá si aparecés en estas fotos para sumarlas a tus recuerdos
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {fotosDudosasPendientes.map((post) => (
                        <div
                          key={post.id}
                          className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-amber-500/20 flex flex-col"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={post.thumbnailUrl || post.imageUrl}
                            alt=""
                            className="w-full h-44 object-cover"
                            loading="lazy"
                          />
                          <div className="p-2.5 bg-zinc-900 flex gap-2">
                            <button
                              onClick={() => handleConfirmarDudosa(post.id)}
                              className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Sí, soy yo</span>
                            </button>
                            <button
                              onClick={() => handleDescartarDudosa(post.id)}
                              className="py-1.5 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-medium text-xs transition"
                            >
                              No soy yo
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* MODO GRILLA NORMAL DE FOTOS */
          <div>
            {isLoading && posts.length === 0 ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
              </div>
            ) : hasError && posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center text-zinc-500">
                <p className="text-lg font-medium text-red-400">No se pudieron cargar las fotos.</p>
                <p className="text-sm mt-1">Hubo un problema de conexión.</p>
                <button
                  onClick={loadPosts}
                  className="mt-6 px-6 py-2 bg-white text-zinc-950 rounded-full text-sm font-bold hover:bg-zinc-200 transition"
                >
                  Reintentar
                </button>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-5 text-zinc-300">
                  <Camera className="w-9 h-9 text-rose-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {selectedPersona
                    ? 'No se encontraron fotos para esta persona.'
                    : activeTab === 'todas'
                    ? '¡Todavía no hay fotos publicadas!'
                    : `Aún no hay fotos en ${
                        activeTab === 'fotocabina'
                          ? 'la fotocabina'
                          : activeTab === '360'
                          ? 'la plataforma 360°'
                          : activeTab === 'espejo'
                          ? 'el espejo mágico'
                          : 'esta categoría'
                      }.`}
                </h2>
                <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
                  {selectedPersona
                    ? 'Probá seleccionando otra cara o volviendo a todas las fotos.'
                    : activeTab === 'fotocabina'
                    ? 'Acercate a la fotocabina del salón para sacarte una foto o ingresá desde acá.'
                    : activeTab === '360'
                    ? 'Subite a la plataforma 360° en la pista para grabar tu video del evento.'
                    : activeTab === 'espejo'
                    ? 'Posá frente al espejo mágico interactivo para llevarte tu recuerdo.'
                    : 'Sé el primero en compartir un momento inolvidable con todos los invitados.'}
                </p>
                {selectedPersona ? (
                  <button
                    onClick={() => setSelectedPersonaId(null)}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-zinc-950 font-bold text-sm shadow-xl hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
                  >
                    Ver todas las fotos de la fiesta
                  </button>
                ) : (
                  <Link
                    href={
                      activeTab === 'fotocabina'
                        ? `/evento/fotocabina/${fiestaId}`
                        : activeTab === '360'
                        ? `/evento/plataforma-360/${fiestaId}`
                        : activeTab === 'espejo'
                        ? `/evento/espejo-magico/${fiestaId}`
                        : `/evento/social/${fiestaId}`
                    }
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-zinc-950 font-bold text-sm shadow-xl hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    Subí tu primera foto
                  </Link>
                )}
                {activeTab !== 'fotocabina' && !selectedPersona && (
                  <p className="text-xs text-zinc-500 mt-4">
                    Buscá la fotocabina cerca de la entrada para sacarte fotos impresas
                  </p>
                )}
              </div>
            ) : (
              <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                {filteredPosts.map((post, index) => {
                  const video = isVideo(post.imageUrl);
                  return (
                    <motion.div
                      key={post.id}
                      layoutId={`post-${post.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="break-inside-avoid relative group rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 cursor-zoom-in"
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
                        // eslint-disable-next-line @next/next/no-img-element -- Guest media has variable dimensions and may be a data URL.
                        <img
                          src={post.thumbnailUrl || post.imageUrl}
                          alt={post.authorName || 'Foto'}
                          className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      )}

                      {/* Overlay gradient */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-sm font-bold truncate">
                          {post.authorName || 'Invitado'}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-zinc-300">
                            <Heart className="w-3 h-3 text-rose-500" /> {post.likes || 0}
                          </span>
                          {post.sourceModule && (
                            <span className="text-xs text-zinc-400 capitalize bg-white/10 px-2 py-0.5 rounded-full">
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
          </div>
        )}

        {/* FOOTER COMERCIAL */}
        <div className="mt-16 pt-8 pb-4 text-center border-t border-white/5">
          <a
            href={appendCommercialAttribution('/simulador-de-presupuesto', {
              source: 'guest_portal',
              campaign: 'galeria',
              refFiestaId: fiestaId,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-amber-400 transition-colors"
          >
            <span>¿Te toca festejar el año que viene? Mirá cuánto sale tu fiesta</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>

      {/* MODAL SELFIE (ENCONTRAME A MÍ) */}
      <AnimatePresence>
        {showSelfieModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-sm rounded-3xl bg-zinc-900 border border-white/10 p-6 text-center shadow-2xl overflow-hidden">
              <button
                onClick={cerrarModalSelfie}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>

              {!selfiePermisoAceptado ? (
                /* PASO 1: AVISO Y PERMISO DE PRIVACIDAD CLARO (BLOQUE 3) */
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Buscá tus fotos al instante</h3>
                  <p className="text-sm text-zinc-300 leading-relaxed mb-6">
                    Vamos a mirar tu cara en este teléfono para buscar tus fotos. No se guarda ni se
                    manda a ningún lado.
                  </p>
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={iniciarCamara}
                      className="w-full py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg hover:shadow-rose-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                      Entendido, buscar mis fotos
                    </button>
                    <button
                      onClick={cerrarModalSelfie}
                      className="w-full py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-sm font-medium transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : camaraError ? (
                /* ERROR DE CÁMARA LOCAL */
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">No pudimos abrir la cámara</h3>
                  <p className="text-sm text-zinc-400 mb-6">{camaraError}</p>
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={iniciarCamara}
                      className="w-full py-3 rounded-full bg-white text-zinc-950 font-bold text-sm transition hover:bg-zinc-200"
                    >
                      Probar de nuevo
                    </button>
                    <button
                      onClick={cerrarModalSelfie}
                      className="w-full py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-sm font-medium transition"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                /* PASO 2: CÁMARA LOCAL Y ESCANEO EN EL TELÉFONO */
                <div>
                  <div className="relative w-56 h-56 mx-auto rounded-full overflow-hidden border-4 border-rose-500 shadow-xl mb-4 bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                    <div
                      className="absolute inset-0 border-2 border-dashed border-white/40 rounded-full animate-spin"
                      style={{ animationDuration: '6s' }}
                    />
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">Mirá de frente a la cámara</h4>
                  <p className="text-xs text-zinc-400 mb-6">
                    {capturandoSelfie ? 'Analizando en tu teléfono...' : 'Preparando...'}
                  </p>
                  <button
                    onClick={cerrarModalSelfie}
                    className="px-6 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-bold transition"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <p className="font-bold">
                  {filteredPosts[lightboxIndex].authorName || 'Invitado'}
                </p>
                <p className="text-xs text-zinc-400">
                  {new Date(
                    filteredPosts[lightboxIndex].timestamp || Date.now(),
                  ).toLocaleString()}
                </p>
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
                <button
                  aria-label="Cerrar galería"
                  onClick={() => setLightboxIndex(null)}
                  className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Navigation Left */}
            {lightboxIndex > 0 && (
              <button
                aria-label="Foto anterior"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrev();
                }}
                className="absolute left-2 p-3 bg-black/60 hover:bg-white/10 rounded-full text-white transition z-10 md:left-4"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            {/* Media */}
            <div
              className="w-full h-full p-4 md:p-12 flex items-center justify-center relative"
              onClick={() => setLightboxIndex(null)}
            >
              <motion.div
                layoutId={`post-${filteredPosts[lightboxIndex].id}`}
                transition={{ duration: DURACION.entrar, ease: SUAVE }}
                className="max-w-full max-h-full flex items-center justify-center"
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
                  // eslint-disable-next-line @next/next/no-img-element -- Full-size guest media preserves its original dimensions.
                  <img
                    src={filteredPosts[lightboxIndex].imageUrl}
                    alt="Ampliada"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </motion.div>
            </div>

            {/* Navigation Right */}
            {lightboxIndex < filteredPosts.length - 1 && (
              <button
                aria-label="Foto siguiente"
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
                className="absolute right-2 p-3 bg-black/60 hover:bg-white/10 rounded-full text-white transition z-10 md:right-4"
              >
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
