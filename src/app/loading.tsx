import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
        Cargando...
      </p>
    </div>
  );
}
