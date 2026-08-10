import { Loader2 } from 'lucide-react';

export function ReconnectingIndicator({ isReconnecting }: { isReconnecting: boolean }) {
  if (!isReconnecting) return null;
  
  return (
    <div className="absolute bottom-4 right-4 z-50 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full shadow-lg">
      <Loader2 className="w-4 h-4 text-white/80 animate-spin" />
      <span className="text-white/80 text-xs font-medium">Reconectando...</span>
    </div>
  );
}
