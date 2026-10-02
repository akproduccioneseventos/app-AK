'use client';

import React, { useState } from 'react';
import { Volume2, Sparkles, ArrowRight, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { ParteDeLaManana } from '@/lib/automatico/parte-manana';
import Link from 'next/link';

export function ParteDeLaMananaPlayer({ parte }: { parte: ParteDeLaManana }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const hablarConNavegador = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPlaying(false);
      return;
    }
    const frase = new SpeechSynthesisUtterance(parte.textoHablado);
    frase.lang = 'es-UY';
    frase.onend = () => setIsPlaying(false);
    frase.onerror = () => setIsPlaying(false);
    window.speechSynthesis.cancel();
    setIsPlaying(true);
    window.speechSynthesis.speak(frase);
  };

  const toggleHablar = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);

    try {
      const res = await fetch(`/api/asistente/voz-parte?texto=${encodeURIComponent(parte.textoHablado)}`);
      if (res.ok) {
        const blob = await res.blob();
        if (blob.size > 100) {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => {
            setIsPlaying(false);
            URL.revokeObjectURL(url);
            audioRef.current = null;
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            audioRef.current = null;
            hablarConNavegador();
          };
          await audio.play();
          return;
        }
      }
    } catch {
      // Continuar al fallback de navegador
    }

    hablarConNavegador();
  };

  return (
    <Card className="rounded-2xl border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-md overflow-hidden">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600/30 text-red-400 border border-red-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-red-400">El Encargado</p>
              <h3 className="text-sm font-bold text-slate-100">Parte de la mañana</h3>
            </div>
          </div>

          <Button
            size="sm"
            onClick={toggleHablar}
            className="rounded-xl font-black text-xs bg-red-600 hover:bg-red-500 text-white gap-2 shadow-sm"
          >
            {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-3.5 h-3.5" />}
            {isPlaying ? 'Detener voz' : 'Escuchar el parte'}
          </Button>
        </div>

        <p className="text-sm text-slate-200 leading-relaxed font-medium">
          {parte.textoHablado}
        </p>

        {parte.itemsPrincipales.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            {parte.itemsPrincipales.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 text-xs bg-white/5 rounded-xl p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-100">{item.titulo}</p>
                  <p className="text-slate-400 truncate">{item.detalle}</p>
                </div>
                {item.accionHref && (
                  <Button asChild size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-white/10 h-7 text-xs font-bold shrink-0">
                    <Link href={item.accionHref}>
                      {item.accionTexto || 'Ver'}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
