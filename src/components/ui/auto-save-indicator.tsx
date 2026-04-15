import { Loader2, Check, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  saveError: string | null;
  className?: string;
}

export function AutoSaveIndicator({ isSaving, lastSaved, saveError, className }: AutoSaveIndicatorProps) {
  if (isSaving) {
    return (
      <span className={cn('flex items-center gap-1.5 text-xs text-slate-400', className)}>
        <Loader2 className="w-3 h-3 animate-spin" />
        Guardando...
      </span>
    );
  }
  if (saveError) {
    return (
      <span className={cn('flex items-center gap-1.5 text-xs text-rose-500', className)}>
        <AlertCircle className="w-3 h-3" />
        Error al guardar
      </span>
    );
  }
  if (lastSaved) {
    return (
      <span className={cn('flex items-center gap-1.5 text-xs text-emerald-600', className)}>
        <Check className="w-3 h-3" />
        Guardado
      </span>
    );
  }
  return (
    <span className={cn('flex items-center gap-1.5 text-xs text-amber-500', className)}>
      <Clock className="w-3 h-3" />
      Sin guardar
    </span>
  );
}
