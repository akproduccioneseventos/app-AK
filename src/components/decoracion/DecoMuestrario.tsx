'use client';

import React, { useState, useEffect } from 'react';
import { getHistorialFiestas } from '@/app/actions/fiesta-actual';
import { Button } from '@/components/ui/button';
import { Loader2, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FiestaEnPlanificacion, ElementoDecorativo } from '@/types/fiesta';

interface DecoMuestrarioProps {
  onLoadDecoracion: (elementos: ElementoDecorativo[]) => void;
}

export default function DecoMuestrario({ onLoadDecoracion }: DecoMuestrarioProps) {
  const [fiestas, setFiestas] = useState<FiestaEnPlanificacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    getHistorialFiestas()
      .then(data => setFiestas((data || []).filter(f => (f.decoracion?.vistaDecorativa?.elementos?.length ?? 0) > 0)))
      .catch(() => setFiestas([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
        <span className="text-sm text-slate-500">Cargando muestrario...</span>
      </div>
    );
  }

  if (fiestas.length === 0) {
    return (
      <div className="text-center py-16 opacity-50">
        <LayoutDashboard className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p className="font-bold text-slate-500 text-sm">No hay decoraciones anteriores</p>
        <p className="text-xs text-slate-400 mt-1">Cuando guardes decoraciones en eventos futuros, aparecerán acá.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100">
        <p className="text-xs text-blue-700">
          💡 Estas son decoraciones que ya hicimos. Podés partir de una y cambiar lo que necesites.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fiestas.map(fiesta => {
          const elementos = fiesta.decoracion?.vistaDecorativa?.elementos ?? [];
          const paleta = fiesta.decoracion?.paletaColores;
          const colores = paleta ? [paleta.primary, paleta.secondary, paleta.accent] : [];
          const fecha = fiesta.configuracion?.fechaEvento
            ? new Date(fiesta.configuracion.fechaEvento).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'Sin fecha';

          return (
            <div
              key={fiesta.id}
              className={cn(
                "rounded-2xl border-2 p-4 cursor-pointer transition-all hover:shadow-md",
                selectedId === fiesta.id ? "border-primary shadow-md shadow-primary/10" : "border-slate-100 bg-white"
              )}
              onClick={() => setSelectedId(fiesta.id)}
            >
              {/* Color palette preview */}
              {colores.length > 0 && (
                <div className="flex gap-1.5 mb-3">
                  {colores.map((c, i) => (
                    <div key={i} className="flex-1 h-3 rounded-full shadow-sm" style={{ background: c }} />
                  ))}
                </div>
              )}
              <p className="font-bold text-sm text-slate-700 truncate">{fiesta.configuracion?.nombreEvento || fiesta.configuracion?.tipoCelebracion || 'Evento'}</p>
              <p className="text-xs text-slate-400 mt-0.5">{fecha} · {elementos.length} elementos</p>
              {selectedId === fiesta.id && (
                <Button
                  type="button"
                  size="sm"
                  className="mt-3 w-full rounded-xl shadow-lg shadow-primary/20 text-xs"
                  onClick={(e) => { e.stopPropagation(); onLoadDecoracion(elementos); }}
                >
                  Cargar esta decoración
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
