'use client';

import { Star, MapPin, ExternalLink, MessageSquarePlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AK_SOCIAL_LINKS } from '@/lib/public-contact';

/**
 * La ficha de Google de la empresa, adentro del panel.
 *
 * **Nada de datos inventados.** Este bloque llego escrito con un identificador de
 * Google y un cartel de "ficha verificada" puestos a mano, sin nada detras que lo
 * respalde. Un cartel que dice "verificada" cuando no se sabe es peor que no
 * mostrar nada: el dueno deja de revisar algo que en realidad esta sin hacer.
 *
 * Regla: **el puntaje y las opiniones se muestran solo si llegan medidos**. Si no
 * llegan, la tarjeta dice que falta conectar la cuenta y ofrece el enlace para
 * buscar la ficha. El enlace para pedir resenas sale de Ajustes; si el dueno
 * todavia no lo cargo, se cae a una busqueda de Google, que siempre funciona.
 */
interface GoogleBusinessProfileProps {
  rating?: number | null;
  reviewsCount?: number | null;
  /** Enlace corto para pedir resenas, el que da Google en la ficha. Viene de Ajustes. */
  reviewsUrl?: string;
}

export function GoogleBusinessProfileWidget({
  rating = null,
  reviewsCount = null,
  reviewsUrl,
}: GoogleBusinessProfileProps) {
  const mapsUrl = AK_SOCIAL_LINKS.googleMaps;
  const enlaceParaResenas = reviewsUrl?.trim() || mapsUrl;
  const hayMedicion = rating !== null;

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-slate-900 via-zinc-950 to-black text-white overflow-hidden shadow-xl">
      <CardContent className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black text-base md:text-lg text-amber-300">
                AK Producciones Eventos
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                Servicio completo para fiestas • Salto, Uruguay
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border self-start sm:self-auto ${
              hayMedicion
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-white/5 text-slate-300 border-white/10'
            }`}
          >
            {hayMedicion ? 'Ficha conectada' : 'Sin conectar todavia'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            {hayMedicion ? (
              <>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.round(rating) ? 'fill-amber-400' : 'text-slate-600'}`}
                    />
                  ))}
                </div>
                <span className="font-black text-sm text-white">{rating.toFixed(1)} / 5.0</span>
                <span className="text-xs text-slate-400">({reviewsCount ?? 0} opiniones)</span>
              </>
            ) : (
              <div className="text-xs text-slate-300">
                <span className="font-bold text-white block">Todavia no vemos tu puntaje</span>
                Es lo que mas pesa para aparecer primero en Salto. Se ve aca cuando
                conectes la cuenta de Google en Ajustes.
              </div>
            )}
          </div>

          <a
            href={enlaceParaResenas}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition shrink-0"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            Pedir resena a un cliente
          </a>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs border-t border-white/10 text-slate-400">
          <span>Una resena por fiesta, siempre a todos por igual y sin premio.</span>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-amber-300 font-bold hover:underline"
          >
            Abrir en Google Maps <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
