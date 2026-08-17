'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { marcarLlegadaPersonal } from '@/app/actions/personal-fiestas';

interface Props {
  fiestaId: string;
  equipo: {
    empleadoId: string;
    nombre: string;
    rol: string;
    llegada?: string;
  }[];
}

export function EquipoCheckIn({ fiestaId, equipo: initialEquipo }: Props) {
  const [equipo, setEquipo] = useState(initialEquipo);
  const [loading, setLoading] = useState<string | null>(null);

  const handleLlegada = async (empleadoId: string) => {
    setLoading(empleadoId);
    const ok = await marcarLlegadaPersonal(fiestaId, empleadoId);
    if (ok) {
      setEquipo(prev => prev.map(p => 
        p.empleadoId === empleadoId ? { ...p, llegada: new Date().toISOString() } : p
      ));
    }
    setLoading(null);
  };

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
      <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Quién trabaja esta noche</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {equipo.map((persona) => {
          const yaLlego = Boolean(persona.llegada);
          return (
            <div 
              key={persona.empleadoId} 
              className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${yaLlego ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}
            >
              <div>
                <p className="text-sm font-bold text-white">{persona.nombre}</p>
                <p className="text-xs font-semibold text-slate-400">{persona.rol}</p>
              </div>
              
              {yaLlego ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <Check className="h-4 w-4" />
                </div>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="rounded-lg border-white/20 bg-transparent hover:bg-emerald-500 hover:text-white"
                  disabled={loading === persona.empleadoId}
                  onClick={() => handleLlegada(persona.empleadoId)}
                >
                  Llegué
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
