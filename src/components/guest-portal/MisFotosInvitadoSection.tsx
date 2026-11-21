'use client';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react';
import { Bell, Camera, Download, ExternalLink, Loader2, Sparkles, Trash2 } from 'lucide-react';
import {
  borrarCaraInvitado,
  obtenerMisFotosInvitado,
} from '@/app/actions/social-gallery';
import { withGuestAccess } from '@/lib/guest-portal/public-event-navigation';
import type { SocialGalleryPost } from '@/types/social-gallery';

interface MisFotosInvitadoSectionProps {
  fiestaId: string;
  guestId: string;
  guestAccessToken: string;
}

export function MisFotosInvitadoSection({
  fiestaId,
  guestId,
  guestAccessToken,
}: MisFotosInvitadoSectionProps) {
  const [fotos, setFotos] = useState<SocialGalleryPost[]>([]);
  const [tieneCaraRegistrada, setTieneCaraRegistrada] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [borrando, setBorrando] = useState(false);

  useEffect(() => {
    let active = true;
    obtenerMisFotosInvitado(fiestaId, guestId, guestAccessToken)
      .then((res) => {
        if (!active) return;
        if (res.success) {
          setFotos(res.fotos || []);
          setTieneCaraRegistrada(Boolean(res.tieneCaraRegistrada));
          setError(null);
        } else {
          setError(res.error || 'No pudimos cargar tus fotos.');
        }
      })
      .catch((err) => {
        console.warn('[MisFotosInvitadoSection] Error cargando Mis fotos:', err);
        if (active) setError('No pudimos cargar tus fotos ahora.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fiestaId, guestId, guestAccessToken]);

  const handleBorrarCara = async () => {
    setBorrando(true);
    try {
      const res = await borrarCaraInvitado({ fiestaId, guestId, guestAccessToken });
      if (res.success) {
        setTieneCaraRegistrada(false);
      }
    } catch (err) {
      console.warn('[MisFotosInvitadoSection] Error borrando cara:', err);
    } finally {
      setBorrando(false);
    }
  };

  const gallerySelfieHref = `${withGuestAccess(`/evento/galeria/${fiestaId}`, guestId, guestAccessToken)}&buscarme=1`;

  return (
    <section
      id="mis-fotos"
      data-testid="mis-fotos-invitado"
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-950">Mis fotos</h2>
            <p className="text-xs text-slate-600">
              {tieneCaraRegistrada
                ? 'Tu cara está anotada: tus fotos nuevas de todas las cámaras y del fotógrafo llegan acá solas.'
                : 'Todas tus fotos de la fiesta en un solo lugar, incluidas las del fotógrafo.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={gallerySelfieHref}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-rose-600 px-4 text-xs font-black text-white transition hover:bg-rose-500"
          >
            <Camera className="h-4 w-4" />
            {tieneCaraRegistrada ? 'Buscarme con selfie' : 'Sacarme selfie y recibir mis fotos'}
          </a>
          {tieneCaraRegistrada && (
            <button
              type="button"
              disabled={borrando}
              onClick={handleBorrarCara}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
              Borrar mi cara
            </button>
          )}
        </div>
      </div>

      {!tieneCaraRegistrada && (
        <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-6 py-3 text-xs text-amber-900">
          <Bell className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            Todavía no dejaste tu selfie. Tocá <strong>&ldquo;Sacarme selfie y recibir mis fotos&rdquo;</strong> para que te avisemos en cuanto aparezcas en una foto (se guardan sólo números, nunca tu selfie).
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Buscando tus fotos...</span>
        </div>
      ) : error ? (
        <p className="p-6 text-sm text-rose-700">{error}</p>
      ) : fotos.length === 0 ? (
        <p className="p-6 text-sm text-slate-600">
          Todavía no encontramos fotos tuyas aprobadas en esta fiesta. A medida que entren del muro, las cabinas o el fotógrafo van a aparecer acá.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-3">
          {fotos.map((foto) => (
            <div
              key={foto.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 flex flex-col"
            >
              <div className="aspect-square overflow-hidden bg-slate-200">
                <img
                  src={foto.thumbnailUrl || foto.imageUrl}
                  alt={foto.authorName || 'Foto de la fiesta'}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex items-center justify-between gap-2 p-2.5 text-xs">
                <a
                  href={foto.imageUrl}
                  download={`mi-foto-${foto.id}.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-slate-800 hover:underline"
                >
                  <Download className="h-3.5 w-3.5" />
                  Bajar
                </a>
                {foto.wfolioUrl && (
                  <a
                    href={foto.wfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-amber-700 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Wfolio
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
