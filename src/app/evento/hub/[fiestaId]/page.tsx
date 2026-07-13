'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Instagram, Facebook } from 'lucide-react';
import { getPublicEntertainmentEvent } from '@/app/actions/fiesta/entretenimiento.actions';
import { getSocialPosts } from '@/app/actions/social-gallery';
import type { PublicEntertainmentEvent } from '@/lib/entertainment/station-config';
import { canUseNextImage } from '@/lib/next-image-url';

export default function EventoHubPage() {
  const params = useParams();
  const fiestaId = params.fiestaId as string;
  
  const [fiesta, setFiesta] = useState<PublicEntertainmentEvent | null>(null);
  const [stats, setStats] = useState({ photos: 0, likes: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getPublicEntertainmentEvent(fiestaId, 'fotocabina');
        setFiesta(result.success ? result.event || null : null);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [fiestaId]);

  useEffect(() => {
    async function loadStats() {
      try {
        const posts = await getSocialPosts(fiestaId);
        const totalLikes = posts.reduce((acc, p) => acc + (p.likes ?? 0), 0);
        setStats({ photos: posts.length, likes: totalLikes });
      } catch (err) {}
    }
    loadStats();
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, [fiestaId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!fiesta) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-white">
        <p>Evento no encontrado.</p>
      </div>
    );
  }

  const coverImage = fiesta.coverImageUrl;
  const eventName = fiesta.eventName || 'Fiesta Privada';
  
  const instagramUrl = fiesta.socialLinks.instagram;
  const facebookUrl = fiesta.socialLinks.facebook;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-purple-500/30">
      {/* HERO HEADER */}
      <div className="relative w-full h-[40vh] md:h-[50vh] flex flex-col items-center justify-end pb-12 px-4 text-center overflow-hidden">
        {coverImage ? (canUseNextImage(coverImage) ? (
          <Image
            src={coverImage}
            alt="Portada del evento"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-50"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- Event media may use an external host outside Next's allowlist.
          <img src={coverImage} alt="Portada del evento" className="absolute inset-0 w-full h-full object-cover opacity-50" />
        )
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 to-purple-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-purple-400">AK Producciones</p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white drop-shadow-lg">
            {eventName}
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 font-medium">¡Bienvenido/a a la Zona Digital!</p>
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="w-full bg-white/5 border-y border-white/10 py-3 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-2 text-sm font-semibold text-zinc-300">
          <span className="text-purple-400">🔥</span>
          <span>{stats.photos} fotos subidas</span>
          <span className="text-zinc-600">·</span>
          <span>{stats.likes} likes</span>
          <span className="text-zinc-600">·</span>
          <span>¡La fiesta explota!</span>
        </div>
      </div>

      {/* FEATURE GRID */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          
          <Link href={`/evento/fotocabina/${fiestaId}`} className="group relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between aspect-square md:col-span-2 md:aspect-[2/1] bg-gradient-to-br from-amber-500 to-orange-600 shadow-2xl hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(245,158,11,0.3)] transition-all duration-300">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10 flex justify-between items-start">
              <span className="text-6xl drop-shadow-md group-hover:scale-110 transition-transform duration-300">📸</span>
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white shadow-inner">DESTACADO</div>
            </div>
            <div className="relative z-10 mt-auto pt-4">
              <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-1">Fotocabina</h2>
              <p className="text-amber-100 font-medium">Sacate fotos con marcos del evento</p>
            </div>
          </Link>

          <Link href={`/evento/social/${fiestaId}`} className="group relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between aspect-square bg-gradient-to-br from-purple-600 to-pink-600 shadow-xl hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(219,39,119,0.3)] transition-all duration-300">
            <div className="relative z-10 flex justify-between items-start">
              <span className="text-5xl drop-shadow-md group-hover:scale-110 transition-transform duration-300">🖼️</span>
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-inner">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                EN VIVO
              </div>
            </div>
            <div className="relative z-10 mt-auto pt-4">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">Mural en Vivo</h2>
              <p className="text-pink-100 font-medium text-sm leading-tight">Subí fotos y reaccioná en tiempo real</p>
            </div>
          </Link>

          <Link href={`/evento/plataforma-360/${fiestaId}`} className="group relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between aspect-square bg-gradient-to-br from-blue-600 to-cyan-500 shadow-xl hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all duration-300">
            <div className="relative z-10">
              <span className="text-5xl drop-shadow-md group-hover:scale-110 transition-transform duration-300 inline-block group-hover:rotate-180">🌐</span>
            </div>
            <div className="relative z-10 mt-auto pt-4">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">Plataforma 360</h2>
              <p className="text-cyan-100 font-medium text-sm leading-tight">Subí tu video 360 o boomerang</p>
            </div>
          </Link>

          <Link href={`/evento/espejo-magico/${fiestaId}`} className="group relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between aspect-square bg-gradient-to-br from-rose-500 to-pink-600 shadow-xl hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(244,63,94,0.3)] transition-all duration-300">
            <div className="relative z-10">
              <span className="text-5xl drop-shadow-md group-hover:scale-110 transition-transform duration-300">✨</span>
            </div>
            <div className="relative z-10 mt-auto pt-4">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">Espejo Mágico</h2>
              <p className="text-rose-100 font-medium text-sm leading-tight">Filtros y efectos en vivo</p>
            </div>
          </Link>

          <Link href={`/evento/touchpix/${fiestaId}`} className="group relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between aspect-square bg-gradient-to-br from-fuchsia-600 to-purple-800 shadow-xl hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(217,70,239,0.4)] transition-all duration-300">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10 flex justify-between items-start">
              <span className="text-5xl drop-shadow-md group-hover:scale-110 transition-transform duration-300">🪄</span>
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-inner">
                <span className="animate-pulse">✨</span>
                CON IA
              </div>
            </div>
            <div className="relative z-10 mt-auto pt-4">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">Touchpix</h2>
              <p className="text-fuchsia-100 font-medium text-sm leading-tight">7 temas + Face Swap con IA</p>
            </div>
          </Link>

          {fiesta.showBuzon && (
            <Link href={`/evento/buzon/${fiestaId}`} className="group relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between aspect-square bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-xl hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(139,92,246,0.3)] transition-all duration-300">
              <div className="relative z-10">
                <span className="text-5xl drop-shadow-md group-hover:scale-110 transition-transform duration-300">🎙️</span>
              </div>
              <div className="relative z-10 mt-auto pt-4">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">Buzón de Recuerdos</h2>
                <p className="text-violet-100 font-medium text-sm leading-tight">Dejá tu saludo de voz, audio o video</p>
              </div>
            </Link>
          )}

          <Link href={`/evento/dj/${fiestaId}`} className="group relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between aspect-square bg-gradient-to-br from-green-600 to-emerald-500 shadow-xl hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all duration-300">
            <div className="relative z-10">
              <span className="text-5xl drop-shadow-md group-hover:scale-110 transition-transform duration-300">🎵</span>
            </div>
            <div className="relative z-10 mt-auto pt-4">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">Pedir Canción</h2>
              <p className="text-emerald-100 font-medium text-sm leading-tight">Sugerile un tema al DJ</p>
            </div>
          </Link>

          <Link href={`/evento/barra/${fiestaId}`} className="group relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between aspect-square bg-gradient-to-br from-indigo-600 to-violet-600 shadow-xl hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(139,92,246,0.3)] transition-all duration-300">
            <div className="relative z-10">
              <span className="text-5xl drop-shadow-md group-hover:scale-110 transition-transform duration-300">🍹</span>
            </div>
            <div className="relative z-10 mt-auto pt-4">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">Barra</h2>
              <p className="text-violet-100 font-medium text-sm leading-tight">Pedí tu trago desde el celu</p>
            </div>
          </Link>

          <Link href={`/evento/galeria/${fiestaId}`} className="group relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between aspect-square bg-gradient-to-br from-slate-600 to-zinc-700 shadow-xl hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(113,113,122,0.3)] transition-all duration-300">
            <div className="relative z-10">
              <span className="text-5xl drop-shadow-md group-hover:scale-110 transition-transform duration-300">📷</span>
            </div>
            <div className="relative z-10 mt-auto pt-4">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">Galería</h2>
              <p className="text-zinc-300 font-medium text-sm leading-tight">Todas las fotos de la fiesta</p>
            </div>
          </Link>

          <Link href={`/evento/zona-digital/${fiestaId}`} className="group relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between aspect-square bg-gradient-to-br from-red-600 to-rose-600 shadow-xl hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(225,29,72,0.3)] transition-all duration-300">
            <div className="relative z-10">
              <span className="text-5xl drop-shadow-md group-hover:scale-110 transition-transform duration-300">🏆</span>
            </div>
            <div className="relative z-10 mt-auto pt-4">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">Juegos</h2>
              <p className="text-rose-100 font-medium text-sm leading-tight">Jugá y ganá premios</p>
            </div>
          </Link>
          
        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-auto py-12 px-4 text-center border-t border-white/5 bg-zinc-950">
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm mb-6">Seguinos en redes</p>
        <div className="flex items-center justify-center gap-4 mb-8">
          {instagramUrl && (
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-zinc-900 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
              <Instagram className="w-5 h-5" />
            </a>
          )}
          {facebookUrl && (
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-zinc-900 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
              <Facebook className="w-5 h-5" />
            </a>
          )}
        </div>
        <p className="text-zinc-600 text-xs">Experiencia digital por AK Producciones · Salto, Uruguay</p>
      </footer>
    </div>
  );
}
