'use client';

import { Star, MapPin, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const GOOGLE_MAPS_URL = process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL
  || 'https://maps.google.com/?q=AK+Producciones+Eventos+Montevideo';

export function GoogleBusinessProfileWidget() {
  return (
    <Card className="border-amber-200/50 bg-gradient-to-br from-slate-900 via-zinc-900 to-black text-white overflow-hidden shadow-xl">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-400" />
            <div>
              <p className="font-black text-base text-amber-300">AK Producciones Eventos</p>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                Montevideo, Uruguay
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ficha Verificada
          </span>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400" />
            ))}
          </div>
          <span className="font-black text-sm text-white">5.0 / 5.0</span>
          <span className="text-xs text-slate-400">(Google Business Profile)</span>
        </div>

        <div className="pt-1 flex items-center justify-between text-xs">
          <span className="text-slate-400">Sincronizado con Google Maps</span>
          <a
            href={GOOGLE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-amber-300 font-bold hover:underline"
          >
            Ver en Google Maps <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
