'use client';

import { useState } from 'react';
import { Share2, MessageCircle, Facebook, Copy, Check } from 'lucide-react';

interface CompartirArticuloProps {
  title: string;
  slug: string;
}

export function CompartirArticulo({ title, slug }: CompartirArticuloProps) {
  const [copiado, setCopiado] = useState(false);

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/public/blog/${slug}`
    : `https://akproducciones.uy/public/blog/${slug}`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Mirá este artículo de AK Producciones: ${title} ${url}`)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  const handleCopiar = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      }
    } catch {
      // Ignorar fallback
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700">
        <Share2 className="w-4 h-4 text-red-600" />
        Compartir artículo
      </div>
      <div className="flex items-center gap-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-[#25D366] hover:bg-[#1eb356] text-white text-xs font-bold transition shadow-sm"
          title="Compartir por WhatsApp"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </a>
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold transition shadow-sm"
          title="Compartir en Facebook"
        >
          <Facebook className="w-3.5 h-3.5" />
          Facebook
        </a>
        <button
          type="button"
          onClick={handleCopiar}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition shadow-sm"
          title="Copiar enlace"
        >
          {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copiado ? '¡Copiado!' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}
