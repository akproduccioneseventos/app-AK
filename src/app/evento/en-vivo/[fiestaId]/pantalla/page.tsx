'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getEventoEnVivoData } from '@/app/actions/evento-en-vivo';
import type { EventoEnVivoData, FotoEnVivo, MensajeEnVivo, VotacionEnVivo, FiestaEnPlanificacion, PlaylistItem, SocialScreenConfig } from '@/types/fiesta';
import { Instagram, Facebook, MessageCircle, QrCode } from 'lucide-react';

const REFRESH_INTERVAL = 20_000;
const DEFAULT_ROTATE_INTERVAL = 5_000;

type SlideType =
  | { type: 'photos'; items: FotoEnVivo[] }
  | { type: 'message'; item: MensajeEnVivo }
  | { type: 'votacion'; item: VotacionEnVivo }
  | { type: 'redes-sociales'; config: SocialScreenConfig };

function buildSlides(data: EventoEnVivoData): SlideType[] {
  const slides: SlideType[] = [];

  const recentPhotos = [...data.fotos].slice(-5);
  if (recentPhotos.length > 0) {
    slides.push({ type: 'photos', items: recentPhotos });
  }

  const destacados = data.mensajes.filter(m => m.destacado);
  for (const m of destacados) {
    slides.push({ type: 'message', item: m });
  }

  const activeVotaciones = data.votaciones.filter(v => v.activa);
  for (const v of activeVotaciones) {
    slides.push({ type: 'votacion', item: v });
  }

  return slides;
}

function PhotosSlide({ items }: { items: FotoEnVivo[] }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 gap-6">
      <h2 className="text-3xl font-bold text-white/80 tracking-wide uppercase">📸 Fotos del evento</h2>
      <div
        className={`grid gap-4 w-full max-w-5xl ${
          items.length === 1
            ? 'grid-cols-1 max-w-lg'
            : items.length <= 2
            ? 'grid-cols-2'
            : items.length <= 4
            ? 'grid-cols-2'
            : 'grid-cols-3'
        }`}
      >
        {items.map(foto => (
          <div key={foto.id} className="relative rounded-2xl overflow-hidden aspect-square shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={foto.url} alt={foto.autor} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3">
              <p className="text-white font-semibold text-sm">{foto.autor}</p>
              {foto.mensaje && <p className="text-white/80 text-xs">{foto.mensaje}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessageSlide({ item }: { item: MensajeEnVivo }) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-12 text-center">
      <div className="max-w-3xl">
        <div className="text-6xl mb-8">💬</div>
        <blockquote className="text-4xl sm:text-5xl font-light text-white leading-snug mb-8 italic">
          &ldquo;{item.mensaje}&rdquo;
        </blockquote>
        <p className="text-2xl text-purple-300 font-semibold">— {item.autor}</p>
      </div>
    </div>
  );
}

function VotacionSlide({ item }: { item: VotacionEnVivo }) {
  const totalVotos = item.opciones.reduce((sum, o) => sum + o.votos, 0);
  const maxVotos = Math.max(...item.opciones.map(o => o.votos), 1);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8">
      <div className="max-w-3xl w-full">
        <div className="text-5xl text-center mb-6">🗳️</div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-8">{item.pregunta}</h2>
        <div className="space-y-5">
          {item.opciones.map(o => {
            const pct = totalVotos > 0 ? Math.round((o.votos / totalVotos) * 100) : 0;
            const isLeading = o.votos === maxVotos && o.votos > 0;
            return (
              <div key={o.id} className="space-y-2">
                <div className="flex justify-between text-lg font-medium">
                  <span className={`text-white ${isLeading ? 'font-bold' : ''}`}>{o.texto}</span>
                  <span className="text-purple-300 tabular-nums">{o.votos} ({pct}%)</span>
                </div>
                <div className="h-6 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      isLeading ? 'bg-yellow-400' : 'bg-purple-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-center text-white/50 text-sm mt-6">Total de votos: {totalVotos}</p>
      </div>
    </div>
  );
}

function RedesSocialesSlide({ config }: { config: SocialScreenConfig }) {
  const { template, customTitle, instagramHandle, tiktokHandle, facebookHandle, whatsappNumber, showQR, qrUrl, visibleNetworks } = config;

  const networks = [
    { id: 'instagram' as const, icon: Instagram, handle: instagramHandle, color: 'text-pink-400', label: 'Instagram', isComponent: true },
    { id: 'tiktok' as const, icon: () => <span className="text-3xl" role="img" aria-label="TikTok">🎵</span>, handle: tiktokHandle, color: 'text-white', label: 'TikTok', isComponent: false },
    { id: 'facebook' as const, icon: Facebook, handle: facebookHandle, color: 'text-blue-400', label: 'Facebook', isComponent: true },
    { id: 'whatsapp' as const, icon: MessageCircle, handle: whatsappNumber, color: 'text-green-400', label: 'WhatsApp', isComponent: true },
  ].filter(n => visibleNetworks.includes(n.id) && n.handle);

  let bgClass = 'from-white to-gray-100';
  let textClass = 'text-gray-900';
  if (template === 'gradient') {
    bgClass = 'from-purple-500 via-pink-500 to-rose-500';
    textClass = 'text-white';
  } else if (template === 'dark-luxury') {
    bgClass = 'from-black via-gray-900 to-gray-950';
    textClass = 'text-amber-400';
  }

  return (
    <div className={`flex flex-col items-center justify-center h-full w-full p-12 bg-gradient-to-br ${bgClass}`}>
      <div className="max-w-4xl w-full text-center space-y-8">
        {customTitle && (
          <h2 className={`text-4xl sm:text-5xl font-black ${textClass} mb-6`}>{customTitle}</h2>
        )}
        <div className="grid grid-cols-2 gap-6">
          {networks.map(network => {
            const Icon = network.icon;
            return (
              <div
                key={network.id}
                className={`flex items-center gap-4 p-6 rounded-2xl ${template === 'minimal' ? 'bg-white border-2 border-gray-200' : 'bg-white/10 backdrop-blur'}`}
              >
                <div className={`${network.color}`}>
                  {network.isComponent ? <Icon className="w-10 h-10" /> : <Icon />}
                </div>
                <div className="text-left">
                  <p className={`text-sm font-semibold ${template === 'minimal' ? 'text-gray-600' : 'text-white/70'}`}>
                    {network.label}
                  </p>
                  <p className={`text-xl font-black ${template === 'minimal' ? 'text-gray-900' : 'text-white'}`}>
                    {network.handle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {showQR && qrUrl && (
          <div className="flex flex-col items-center gap-3 mt-8">
            <div className="p-4 bg-white rounded-2xl shadow-xl">
              <QrCode className="w-32 h-32 text-gray-900" />
            </div>
            <p className={`text-sm ${template === 'minimal' ? 'text-gray-600' : 'text-white/70'}`}>Escaneá el código QR</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PantallaPage() {
  const { fiestaId } = useParams<{ fiestaId: string }>();

  const [fiestaName, setFiestaName] = useState('');
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [data, setData] = useState<EventoEnVivoData>({
    fotos: [],
    solicitudesCanciones: [],
    mensajes: [],
    votaciones: [],
  });
  const [slides, setSlides] = useState<SlideType[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visible, setVisible] = useState(true);
  const [playlistMode, setPlaylistMode] = useState(false);
  const [playlistSlides, setPlaylistSlides] = useState<{ type: PlaylistItem['type']; duration: number; config?: SocialScreenConfig }[]>([]);

  const fetchData = useCallback(async () => {
    const [fiestaData, eventoData] = await Promise.all([
      getFiestaById(fiestaId),
      getEventoEnVivoData(fiestaId),
    ]);
    if (fiestaData) {
      setFiesta(fiestaData);
      setFiestaName(fiestaData.configuracion?.nombreEvento || fiestaData.configuracion?.nombreAgasajado || 'Evento');
      
      // Check for playlist
      const playlist = fiestaData.screenPlaylist;
      if (playlist && playlist.isPlaying && playlist.items.length > 0) {
        const enabledItems = playlist.items.filter(i => i.enabled);
        if (enabledItems.length > 0) {
          setPlaylistMode(true);
          setPlaylistSlides(enabledItems.map(item => ({
            type: item.type,
            duration: item.durationSeconds,
            config: item.type === 'redes-sociales' ? fiestaData.socialScreenConfig : undefined,
          })));
          return; // skip rebuilding legacy slides when playlist is active
        }
      }
      setPlaylistMode(false);
    }
    // Only build legacy slides when not in playlist mode
    setSlides(buildSlides(eventoData));
    setData(eventoData);
  }, [fiestaId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Auto-rotate slides
  useEffect(() => {
    if (playlistMode && playlistSlides.length > 0) {
      const currentDuration = (playlistSlides[currentSlide]?.duration || 5) * 1000;
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          setCurrentSlide(prev => (prev + 1) % playlistSlides.length);
          setVisible(true);
        }, 600);
      }, currentDuration);
      return () => clearTimeout(timer);
    } else if (!playlistMode && slides.length > 1) {
      const interval = setInterval(() => {
        setVisible(false);
        setTimeout(() => {
          setCurrentSlide(prev => (prev + 1) % slides.length);
          setVisible(true);
        }, 600);
      }, DEFAULT_ROTATE_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [slides.length, currentSlide, playlistMode, playlistSlides]);

  // Reset slide index when slides array changes
  useEffect(() => {
    setCurrentSlide(0);
  }, [slides.length, playlistSlides.length]);

  const renderSlide = () => {
    if (playlistMode && playlistSlides.length > 0) {
      const playlistItem = playlistSlides[currentSlide];
      if (!playlistItem) return null;

      switch (playlistItem.type) {
        case 'muro-fotos':
          const recentPhotos = [...data.fotos].slice(-5);
          return recentPhotos.length > 0 ? <PhotosSlide items={recentPhotos} /> : null;
        case 'redes-sociales':
          return playlistItem.config ? <RedesSocialesSlide config={playlistItem.config} /> : null;
        case 'votacion':
          const activeVotacion = data.votaciones.find(v => v.activa);
          return activeVotacion ? <VotacionSlide item={activeVotacion} /> : null;
        default:
          return (
            <div className="text-center text-white/40 space-y-4">
              <p className="text-xl">Tipo de slide: {playlistItem.type}</p>
            </div>
          );
      }
    } else {
      const currentSlideData = slides[currentSlide];
      if (!currentSlideData) {
        return (
          <div className="text-center text-white/40 space-y-4">
            <div className="text-8xl">🎉</div>
            <p className="text-2xl font-light">Esperando contenido...</p>
            <p className="text-sm">{fiestaName}</p>
          </div>
        );
      }

      switch (currentSlideData.type) {
        case 'photos':
          return <PhotosSlide items={currentSlideData.items} />;
        case 'message':
          return <MessageSlide item={currentSlideData.item} />;
        case 'votacion':
          return <VotacionSlide item={currentSlideData.item} />;
        case 'redes-sociales':
          return <RedesSocialesSlide config={currentSlideData.config} />;
        default:
          return null;
      }
    }
  };

  const orientation = fiesta?.screenPlaylist?.orientation || 'landscape';
  const wrapperClass = orientation === 'portrait' ? 'max-w-[56.25vh] mx-auto' : '';

  return (
    <div className={`fixed inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 overflow-hidden ${wrapperClass}`}>
      {/* Event name badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
        <div className="bg-black/40 backdrop-blur px-4 py-2 rounded-full">
          <span className="text-white font-bold text-sm sm:text-base">{fiestaName}</span>
        </div>
        <div className="bg-red-600 px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
          <span className="w-2 h-2 bg-white rounded-full" />
          <span className="text-white text-xs font-bold uppercase tracking-wider">En Vivo</span>
        </div>
      </div>

      {/* Slide content */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-opacity duration-600"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {renderSlide()}
      </div>

      {/* Slide indicators */}
      {((playlistMode && playlistSlides.length > 1) || (!playlistMode && slides.length > 1)) && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
          {(playlistMode ? playlistSlides : slides).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide ? 'w-8 bg-white' : 'w-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
