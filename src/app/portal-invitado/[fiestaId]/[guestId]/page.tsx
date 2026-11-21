'use client';

import InvitadoPage from '@/app/invitacion/[fiestaId]/invitado/[guestId]/page';
import { VideoDeAyuda } from '@/components/ayuda/VideoDeAyuda';

export default function PortalInvitadoPage() {
  return (
    <>
      <a
        href="#mis-fotos"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-xs focus:font-bold focus:text-slate-950 focus:shadow"
      >
        Mis fotos
      </a>
      <div className="fixed top-3 right-3 z-40">
        <VideoDeAyuda lugar="portal-invitado" />
      </div>
      <InvitadoPage />
    </>
  );
}
