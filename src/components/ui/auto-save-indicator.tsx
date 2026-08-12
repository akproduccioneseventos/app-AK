'use client';

import { Loader2, Check, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  saveError: string | null;
  className?: string;
}

export function AutoSaveIndicator({ isSaving, lastSaved, saveError, className }: AutoSaveIndicatorProps) {
  const { toast } = useToast();

  if (isSaving) {
    return (
      <span
        title="Guardando..."
        className={cn('flex items-center gap-1.5 text-xs text-slate-400', className)}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        <span className="hidden sm:inline">Guardando...</span>
      </span>
    );
  }
  if (saveError) {
    return (
      <span
        title={`Error al guardar: ${saveError}`}
        onClick={() =>
          toast({
            variant: 'destructive',
            title: 'No se pudo guardar',
            description: `${saveError} Volvé a intentarlo; si sigue igual, revisá la conexión antes de cerrar la pantalla.`,
          })
        }
        className={cn('flex items-center gap-1.5 text-xs text-rose-500 font-medium cursor-pointer', className)}
      >
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Error al guardar</span>
      </span>
    );
  }
  if (lastSaved) {
    return (
      <span
        title={`Guardado a las ${lastSaved.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
        className={cn('flex items-center gap-1.5 text-xs text-emerald-600', className)}
      >
        <Check className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">Guardado</span>
      </span>
    );
  }
  return (
    <span
      title="Sin guardar"
      className={cn('flex items-center gap-1.5 text-xs text-amber-500', className)}
    >
      <Clock className="w-3.5 h-3.5 shrink-0" />
      <span className="hidden sm:inline">Sin guardar</span>
    </span>
  );
}
