'use client';

import InvitadoPage from '@/app/invitacion/[fiestaId]/invitado/[guestId]/page';
import { VideoDeAyuda } from '@/components/ayuda/VideoDeAyuda';

export default function PortalInvitadoPage() {
  return (
    <>
      <div className="fixed top-3 right-3 z-40">
        <VideoDeAyuda lugar="portal-invitado" />
      </div>
      <InvitadoPage />
    </>
  );
}
