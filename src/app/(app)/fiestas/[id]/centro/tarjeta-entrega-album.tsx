'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy, ExternalLink, Loader2, MessageCircle, Sparkles, AlertCircle, Images } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  isValidWfolioUrl,
  buildWfolioDelivery,
  getAlbumDeliveryStatus,
  buildClientAlbumDeliveryMessage,
  type WfolioAlbumDelivery,
  type AlbumDeliveryStatus,
} from '@/lib/social-fiesta/wfolio-album-delivery';
import { guardarAlbumWfolioAction } from '@/app/actions/fiesta/fiesta.actions';
import { toWhatsAppDigits } from '@/lib/commercial/contact';

interface Props {
  fiestaId: string;
  eventName: string;
  clientName?: string;
  clientPhone?: string;
  initialWfolioUrl?: string;
  initialDelivery?: WfolioAlbumDelivery;
}

const STATUS_LABELS: Record<AlbumDeliveryStatus, { label: string; badge: string }> = {
  entregado_cliente: { label: 'Álbum entregado al cliente', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  vence_pronto: { label: 'Vence pronto (< 15 días)', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  vencido: { label: 'Álbum vencido en Wfolio', badge: 'bg-red-500/20 text-red-300 border-red-500/30' },
  subiendo_wfolio: { label: 'Subiendo a Wfolio', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  muro_descargable: { label: 'Muro descargable', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  descargado_por_ak: { label: 'Descargado por AK', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  temporales_borrados: { label: 'Temporales borrados', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  pendiente: { label: 'Pendiente de entrega', badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
};

export function TarjetaEntregaAlbum({
  fiestaId,
  eventName,
  clientName,
  clientPhone,
  initialWfolioUrl = '',
  initialDelivery,
}: Props) {
  const { toast } = useToast();
  const [wfolioUrl, setWfolioUrl] = useState(initialWfolioUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedDelivery, setSavedDelivery] = useState<WfolioAlbumDelivery | undefined>(initialDelivery);

  const currentDelivery = buildWfolioDelivery({
    fiestaId,
    eventName,
    clientName,
    wfolioUrl: wfolioUrl.trim(),
  });

  const deliveryStatus = getAlbumDeliveryStatus({ delivery: savedDelivery || currentDelivery });
  const isUrlValid = isValidWfolioUrl(wfolioUrl.trim());
  const statusInfo = STATUS_LABELS[deliveryStatus] || STATUS_LABELS.pendiente;

  const handleSave = async () => {
    const urlLimpia = wfolioUrl.trim();
    if (!urlLimpia) {
      toast({
        title: 'Falta el enlace',
        description: 'Ingresá el enlace del álbum en Wfolio para guardarlo.',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidWfolioUrl(urlLimpia)) {
      toast({
        title: 'Enlace no válido',
        description: 'El enlace debe pertenecer a wfolio.com o wfolio.pro.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await guardarAlbumWfolioAction(fiestaId, urlLimpia);
      if (res.success && res.delivery) {
        setSavedDelivery(res.delivery);
        toast({
          title: '✅ Álbum guardado',
          description: 'El enlace del álbum Wfolio quedó registrado en la fiesta.',
        });
      } else {
        toast({
          title: 'Error al guardar',
          description: res.error || 'No se pudo guardar el álbum.',
          variant: 'destructive',
        });
      }
    } catch (e: any) {
      toast({
        title: 'Error inesperado',
        description: e.message || 'Ocurrió un error al guardar.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const mensajePreparado = buildClientAlbumDeliveryMessage({
    delivery: savedDelivery || currentDelivery,
  });

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(mensajePreparado);
    } catch {
      toast({
        title: 'No se pudo copiar',
        description: 'El teléfono no dejó copiar. Seleccioná el mensaje de abajo y copialo a mano.',
        variant: 'destructive',
      });
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    toast({
      title: 'Mensaje copiado',
      description: 'El mensaje preparado está listo para pegar en WhatsApp o correo.',
    });
  };

  const whatsappHref = clientPhone
    ? `https://wa.me/${toWhatsAppDigits(clientPhone)}?text=${encodeURIComponent(mensajePreparado)}`
    : `https://wa.me/?text=${encodeURIComponent(mensajePreparado)}`;

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 space-y-4" data-testid="tarjeta-entrega-album">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/20 text-indigo-300">
            <Images className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight text-white md:text-lg">Entrega del álbum</h2>
            <p className="text-xs font-semibold text-slate-400">Entrega de fotos profesionales por Wfolio</p>
          </div>
        </div>
        <span
          data-testid="album-delivery-status-badge"
          className={`text-xs font-bold px-3 py-1 rounded-full border ${statusInfo.badge}`}
        >
          {statusInfo.label}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="wfolio-album-url" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            Enlace de Wfolio (wfolio.com / wfolio.pro)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="wfolio-album-url"
              data-testid="input-wfolio-url"
              placeholder="https://tu-estudio.wfolio.com/album o .wfolio.pro"
              value={wfolioUrl}
              onChange={(e) => setWfolioUrl(e.target.value)}
              className="bg-slate-900 border-white/20 text-white placeholder:text-slate-500 flex-1 rounded-xl h-11"
            />
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !wfolioUrl.trim()}
              data-testid="btn-guardar-album-wfolio"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-5 shrink-0"
            >
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Guardar álbum
            </Button>
          </div>
          {wfolioUrl && !isUrlValid && (
            <p className="mt-1 text-xs text-amber-300 flex items-center gap-1 font-medium">
              <AlertCircle className="h-3.5 w-3.5" /> El enlace debe ser de wfolio.com o wfolio.pro
            </p>
          )}
        </div>

        {/* Acciones para mandarle el enlace al cliente */}
        <div className="pt-2 flex flex-wrap gap-2.5 items-center">
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 font-bold text-xs h-10"
          >
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" data-testid="btn-enviar-album-whatsapp">
              <MessageCircle className="h-4 w-4 mr-2" /> Mandarle el enlace al cliente
            </a>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleCopyMessage}
            className="rounded-xl border-white/20 bg-white/5 text-slate-200 hover:bg-white/10 font-bold text-xs h-10"
            data-testid="btn-copiar-mensaje-album"
          >
            {copied ? <Check className="h-4 w-4 mr-2 text-emerald-400" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Mensaje copiado' : 'Copiar mensaje preparado'}
          </Button>

          {isUrlValid && (
            <Button
              asChild
              variant="ghost"
              className="rounded-xl text-slate-400 hover:text-white font-semibold text-xs h-10 ml-auto"
            >
              <a href={wfolioUrl.trim()} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1.5" /> Abrir Wfolio
              </a>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
