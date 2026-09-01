'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Camera, Printer, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPublicSocialEvent } from '@/app/actions/social-gallery';
import type { PublicSocialEvent } from '@/lib/social-fiesta/public-event';
import Link from 'next/link';

export default function AficheMuroPage() {
  const params = useParams();
  const fiestaId = params.fiestaId as string;
  const [event, setEvent] = useState<PublicSocialEvent | null>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    if (fiestaId) {
      getPublicSocialEvent(fiestaId).then(setEvent).catch(() => {});
    }
  }, [fiestaId]);

  const qrUrl = `${origin}/evento/social/${fiestaId}`;
  const eventName = event?.configuracion?.nombreEvento || 'Nuestra Fiesta';
  const primaryColor = event?.socialGallerySettings?.accentColor || '#d97706';

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-8 print:p-0 print:bg-white text-slate-900">
      {/* Controles en pantalla no visibles al imprimir */}
      <div className="w-full max-w-lg mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/evento/muro-en-vivo/${fiestaId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al muro
        </Link>
        <Button onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800 text-white gap-2 shadow-md">
          <Printer className="w-4 h-4" /> Imprimir Afiches para Mesas
        </Button>
      </div>

      {/* Tarjeta / Afiche A4 para doblar o colocar en soporte de mesa */}
      <div
        className="w-full max-w-md bg-white border-2 border-slate-200 rounded-3xl p-8 sm:p-10 shadow-2xl print:shadow-none print:border-4 print:border-slate-900 text-center space-y-6 print:m-0 print:rounded-2xl"
        style={{ borderColor: primaryColor }}
      >
        <div className="space-y-2">
          <span
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-white shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            <Sparkles className="w-3.5 h-3.5" /> Pantalla en Vivo
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {eventName}
          </h1>
          <p className="text-sm font-medium text-slate-600">
            ¡Sé parte de los recuerdos de esta noche!
          </p>
        </div>

        {/* QR Grande */}
        <div className="flex justify-center p-4">
          <div
            className="p-5 rounded-3xl bg-white border-4 shadow-xl inline-block"
            style={{ borderColor: primaryColor }}
          >
            {qrUrl ? (
              <QRCodeSVG
                value={qrUrl}
                size={220}
                level="H"
                includeMargin={false}
                fgColor="#0f172a"
              />
            ) : (
              <div className="w-[220px] h-[220px] bg-slate-100 flex items-center justify-center">
                <Camera className="w-12 h-12 text-slate-400" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
            Escaneá con la cámara de tu celular
          </h2>
          <p className="text-sm font-medium text-slate-600 max-w-xs mx-auto">
            Subí tus fotos y mensajes en directo para que salgan en la pantalla gigante.
          </p>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider pt-2">
            No requiere descargar ninguna app
          </p>
        </div>
      </div>
    </div>
  );
}
