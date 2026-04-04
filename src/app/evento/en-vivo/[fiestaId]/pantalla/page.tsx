'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getEventoEnVivoData } from '@/app/actions/evento-en-vivo';
import type { EventoEnVivoData, FotoEnVivo, MensajeEnVivo, VotacionEnVivo } from '@/types/fiesta';

const REFRESH_INTERVAL = 20_000;
const ROTATE_INTERVAL = 5_000;

type SlideType =
  | { type: 'photos'; items: FotoEnVivo[] }
  | { type: 'message'; item: MensajeEnVivo }
  | { type: 'votacion'; item: VotacionEnVivo };

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

export default function PantallaPage() {
  const { fiestaId } = useParams<{ fiestaId: string }>();

  const [fiestaName, setFiestaName] = useState('');
  const [data, setData] = useState<EventoEnVivoData>({
    fotos: [],
    solicitudesCanciones: [],
    mensajes: [],
    votaciones: [],
  });
  const [slides, setSlides] = useState<SlideType[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visible, setVisible] = useState(true);

  const fetchData = useCallback(async () => {
    const [fiesta, eventoData] = await Promise.all([
      getFiestaById(fiestaId),
      getEventoEnVivoData(fiestaId),
    ]);
    if (fiesta) setFiestaName(fiesta.configuracion?.nombreEvento || fiesta.configuracion?.nombreAgasajado || 'Evento');
    setData(eventoData);
    setSlides(buildSlides(eventoData));
  }, [fiestaId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Auto-rotate slides with fade
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length);
        setVisible(true);
      }, 600);
    }, ROTATE_INTERVAL);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Reset slide index when slides array changes
  useEffect(() => {
    setCurrentSlide(0);
  }, [slides.length]);

  const currentSlideData = slides[currentSlide];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 overflow-hidden">
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
        {!currentSlideData ? (
          <div className="text-center text-white/40 space-y-4">
            <div className="text-8xl">🎉</div>
            <p className="text-2xl font-light">Esperando contenido...</p>
            <p className="text-sm">{fiestaName}</p>
          </div>
        ) : currentSlideData.type === 'photos' ? (
          <PhotosSlide items={currentSlideData.items} />
        ) : currentSlideData.type === 'message' ? (
          <MessageSlide item={currentSlideData.item} />
        ) : (
          <VotacionSlide item={currentSlideData.item} />
        )}
      </div>

      {/* Slide indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
          {slides.map((_, i) => (
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
