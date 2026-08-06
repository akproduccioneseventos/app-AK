'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PartyPopper, MonitorPlay, ScanFace, Camera } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function ModoFiestaPanel({ fiestaId }: { fiestaId: string }) {
  const [open, setOpen] = useState(false);

  const enlaces = [
    {
      titulo: 'Plataforma 360',
      ruta: `/evento/plataforma-360/${encodeURIComponent(fiestaId)}`,
      icono: Camera,
      color: 'bg-emerald-600',
    },
    {
      titulo: 'Espejo Mágico',
      ruta: `/evento/espejo-magico/${encodeURIComponent(fiestaId)}`,
      icono: ScanFace,
      color: 'bg-purple-600',
    },
    {
      titulo: 'Muro Social',
      ruta: `/evento/muro-en-vivo/${encodeURIComponent(fiestaId)}`,
      icono: MonitorPlay,
      color: 'bg-blue-600',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="group relative flex h-72 w-full max-w-md flex-col items-center justify-center gap-6 rounded-[2rem] bg-gradient-to-br from-red-600 to-amber-600 p-8 text-white shadow-2xl shadow-red-900/40 transition-all hover:scale-105 hover:shadow-red-900/60 active:scale-95"
        >
          <PartyPopper className="h-24 w-24 animate-bounce" />
          <span className="text-4xl font-black uppercase tracking-wider text-center leading-tight">
            Iniciar Modo Fiesta
          </span>
          <div className="absolute inset-0 rounded-[2rem] ring-4 ring-white/20 transition-all group-hover:ring-white/40" />
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-3xl bg-slate-950 border-white/10 text-white rounded-[2rem] p-8">
        <DialogTitle className="text-3xl font-black mb-2 flex items-center gap-3">
          <PartyPopper className="h-8 w-8 text-red-500" />
          Totems Modo Fiesta
        </DialogTitle>
        <DialogDescription className="text-slate-400 text-lg mb-8">
          Abrí estos accesos directos en pantalla completa en cada uno de los dispositivos correspondientes.
        </DialogDescription>
        
        <div className="grid gap-4 sm:grid-cols-3">
          {enlaces.map((enlace) => {
            const Icono = enlace.icono;
            return (
              <Link
                key={enlace.titulo}
                href={enlace.ruta}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center justify-center gap-5 rounded-3xl border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/10 hover:border-white/20 hover:scale-105 active:scale-95"
              >
                <div className={`grid h-24 w-24 place-items-center rounded-2xl ${enlace.color} shadow-lg transition-transform group-hover:scale-110`}>
                  <Icono className="h-12 w-12 text-white" />
                </div>
                <span className="text-center font-black text-xl leading-tight">
                  {enlace.titulo}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full">
                  Abrir Link
                </span>
              </Link>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
