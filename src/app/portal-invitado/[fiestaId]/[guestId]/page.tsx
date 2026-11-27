'use client';

import InvitadoPage from '@/app/invitacion/[fiestaId]/invitado/[guestId]/page';
import { VideoDeAyuda } from '@/components/ayuda/VideoDeAyuda';
import { BotonComoFunciona } from '@/components/tutorial/BotonComoFunciona';

export default function PortalInvitadoPage() {
  return (
    <>
      <a
        href="#mis-fotos"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-xs focus:font-bold focus:text-slate-950 focus:shadow"
      >
        Mis fotos
      </a>
      <div className="fixed top-3 right-3 z-40 flex items-center gap-2">
        <BotonComoFunciona clave="portal-invitado" variant="compact" />
        <VideoDeAyuda lugar="portal-invitado" />
      </div>
      <InvitadoPage />
    </>
  );
}
