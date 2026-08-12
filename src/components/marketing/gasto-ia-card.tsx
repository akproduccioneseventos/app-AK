'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getGastoDeIA, setTopeDeIA } from '@/app/actions/ai-consumo';
import type { ResumenDeGasto } from '@/lib/ai/consumo';

/**
 * Cuánto va gastado del mes en los efectos de las fotos, y el tope.
 *
 * Los topes por invitado frenan el abuso de una persona; esto es lo otro: saber
 * cuánto se lleva consumido antes de que llegue la factura.
 */

const COLORES: Record<ResumenDeGasto['estado'], string> = {
  'sin-tope': 'border-slate-200 bg-slate-50/70 text-slate-900',
  tranquilo: 'border-emerald-100 bg-emerald-50/60 text-emerald-950',
  'cerca-del-tope': 'border-amber-200 bg-amber-50/70 text-amber-950',
  pasado: 'border-rose-200 bg-rose-50/70 text-rose-950',
};

const BARRA: Record<ResumenDeGasto['estado'], string> = {
  'sin-tope': 'bg-slate-400',
  tranquilo: 'bg-emerald-500',
  'cerca-del-tope': 'bg-amber-500',
  pasado: 'bg-rose-500',
};

export function GastoIaCard() {
  const { toast } = useToast();
  const [resumen, setResumen] = useState<ResumenDeGasto | null>(null);
  const [topeInput, setTopeInput] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vigente = true;
    getGastoDeIA()
      .then((valor) => {
        if (!vigente) return;
        setResumen(valor);
        setTopeInput(valor.topeUYU > 0 ? String(valor.topeUYU) : '');
      })
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, []);

  const guardarTope = async () => {
    const limpio = topeInput.trim();
    const valor = limpio === '' ? 0 : Number(limpio);
    if (!Number.isFinite(valor) || valor < 0) {
      toast({
        variant: 'destructive',
        title: 'Ese número no sirve',
        description: 'Poné cuántos pesos como máximo, o dejalo vacío para no poner tope.',
      });
      return;
    }

    setGuardando(true);
    try {
      const resultado = await setTopeDeIA(valor);
      if (!resultado.success || !resultado.resumen) {
        toast({
          variant: 'destructive',
          title: 'No se pudo guardar',
          description: resultado.error || 'Probá de nuevo en un momento.',
        });
        return;
      }
      setResumen(resultado.resumen);
      toast({
        title: valor > 0 ? 'Tope guardado' : 'Tope sacado',
        description:
          valor > 0
            ? `Cuando el mes llegue a $${valor}, los efectos de las fotos se apagan solos.`
            : 'No hay tope: se gasta lo que haga falta.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'No se pudo guardar',
        description: 'Revisá la conexión y probá de nuevo.',
      });
    } finally {
      setGuardando(false);
    }
  };

  if (!resumen) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando el gasto del mes…
      </div>
    );
  }

  const ancho = resumen.topeUYU > 0 ? Math.min(100, resumen.porcentaje) : 0;

  return (
    <div className={`space-y-4 rounded-2xl border p-4 text-sm ${COLORES[resumen.estado]}`}>
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-bold">
          <Sparkles className="h-4 w-4 shrink-0" />
          Gasto del mes en los efectos de las fotos
        </div>
        <p className="text-xs opacity-90">{resumen.mensaje}</p>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-wider">
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">
          {resumen.generaciones} fotos con efecto
        </span>
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">
          ${resumen.gastadoUYU} estimados
        </span>
      </div>

      {resumen.topeUYU > 0 && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/80">
          <div
            className={`h-full rounded-full transition-all ${BARRA[resumen.estado]}`}
            style={{ width: `${ancho}%` }}
          />
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="tope-ia" className="text-xs font-semibold">
            Tope del mes, en pesos
          </Label>
          <Input
            id="tope-ia"
            inputMode="numeric"
            placeholder="Sin tope"
            value={topeInput}
            onChange={(e) => setTopeInput(e.target.value)}
            className="h-9 w-40 bg-white"
          />
        </div>
        <Button
          onClick={guardarTope}
          disabled={guardando}
          className="h-9 rounded-xl font-bold"
          variant="outline"
        >
          {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar tope'}
        </Button>
      </div>

      <p className="text-xs opacity-80">
        Al llegar al tope, la fotocabina y el espejo <strong>siguen andando</strong>: sacan
        la foto igual, con un efecto simple, sin gastar. Dejalo vacío si no querés tope.
      </p>
    </div>
  );
}
