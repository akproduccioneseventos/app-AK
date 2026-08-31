'use client';

import React, { useState } from 'react';
import { Share2, MessageCircle, Facebook, Copy, Check } from 'lucide-react';

interface Props {
  title: string;
  url?: string;
}

export function CompartirArticulo({ title, url }: Props) {
  const [copiado, setCopiado] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? (url || window.location.href) : (url || 'https://akproducciones.uy');

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Mirá este artículo: ${title}\n${currentUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank');
  };

  const copiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-3 pt-4 border-t border-zinc-800/80">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-400">
        <Share2 className="w-4 h-4 text-amber-500" />
        <span>Compartir este artículo</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={shareWhatsApp}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-colors"
          title="Compartir por WhatsApp"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </button>

        <button
          onClick={shareFacebook}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold transition-colors"
          title="Compartir en Facebook"
        >
          <Facebook className="w-3.5 h-3.5" />
          <span>Facebook</span>
        </button>

        <button
          onClick={copiarEnlace}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
          title="Copiar enlace"
        >
          {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiado ? '¡Copiado!' : 'Copiar enlace'}</span>
        </button>
      </div>
    </div>
  );
}
