import { Metadata } from 'next';
import { getPublicSocialPosts, getPublicSocialEvent } from '@/app/actions/social-gallery';
import { notFound } from 'next/navigation';
import { VideoRecuerdoClient } from './video-recuerdo-client';
import { ShieldAlert } from 'lucide-react';
import type { RecapPhotoItem } from '@/lib/recap/recap-engine';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { hasPublicGuestAccess } from '@/lib/guest-portal-public-data';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string; guestId?: string; token?: string }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params;
  const { t } = await searchParams;
  const event = await getPublicSocialEvent(id, t);
  return {
    title: event ? `Recuerdos de ${event.configuracion.nombreEvento}` : 'Video Recuerdo - AK Producciones',
  };
}

export default async function VideoRecuerdoPage({ params, searchParams }: Props) {
  const { id: fiestaId } = await params;
  const { t: accessKey, guestId: guestIdPedido = '', token = '' } = await searchParams;

  // 1. Validar evento público o con token
  const event = await getPublicSocialEvent(fiestaId, accessKey);
  if (!event) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md space-y-4">
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto" />
          <h1 className="text-2xl font-bold">Evento no disponible</h1>
          <p className="text-slate-400">Este evento no existe o no tenés permiso para ver sus recuerdos.</p>
        </div>
      </div>
    );
  }

  // 1.b Sólo se arma "tu recuerdo" si la persona trae SU enlace personal. Con el
  // identificador solo, cualquiera pondría el de otro invitado y vería marcadas
  // como suyas las fotos de esa persona. Si no comprueba, no se rompe nada: se
  // le muestra el recuerdo de la fiesta entera, que igual es lindo.
  const fiestaCompleta = await getFiestaById(fiestaId);
  const invitado = fiestaCompleta?.invitados?.find((item) => item.id === guestIdPedido);
  const guestId = hasPublicGuestAccess(invitado, guestIdPedido, token) ? guestIdPedido : '';

  // 2. Traer las fotos públicas (ya filtradas por moderationStatus === 'approved')
  const posts = await getPublicSocialPosts(fiestaId);
  const imagePosts = posts.filter((p) => p.mediaType === 'image');

  // 3. Filtrar fotos del invitado primero si hay guestId, y completar con las más queridas de la fiesta
  let sortedPhotos: RecapPhotoItem[] = [];
  let isPersonalized = false;

  if (guestId) {
    const userPhotos = imagePosts
      .filter((p) => p.guestId === guestId)
      .map((p) => ({ ...p, esTuFoto: true }));

    if (userPhotos.length > 0) {
      isPersonalized = true;
      sortedPhotos.push(...userPhotos);

      // Si tiene menos de 10, completamos con las más votadas de la noche
      const userPhotoIds = new Set(userPhotos.map((p) => p.id));
      const generalPhotos = imagePosts
        .filter((p) => !userPhotoIds.has(p.id))
        .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
        .map((p) => ({ ...p, esTuFoto: false }));

      sortedPhotos.push(...generalPhotos.slice(0, 10 - userPhotos.length));
    }
  }

  if (sortedPhotos.length === 0) {
    // Si no sacó fotos o no hay guestId, mostrar las fotos de la fiesta
    sortedPhotos = imagePosts
      .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
      .slice(0, 12)
      .map((p) => ({ ...p, esTuFoto: false }));
  }

  // 4. Fallback si hay muy pocas fotos en total en el evento
  if (sortedPhotos.length < 3) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center space-y-4">
        <h1 className="text-3xl font-dancing_script">Recuerdos de {event.configuracion.nombreEvento}</h1>
        <p className="text-slate-400 max-w-sm">
          Todavía se están procesando las fotos o no hay suficientes recuerdos aprobados para armar el video. 
          ¡Volvé a entrar más tarde!
        </p>
      </div>
    );
  }

  // 5. Renderizar el reproductor interactivo y generador de video vertical
  return (
    <VideoRecuerdoClient
      eventName={event.configuracion.nombreEvento}
      eventDate={event.configuracion.fechaEvento}
      images={sortedPhotos}
      isPersonalized={isPersonalized}
      fiestaId={fiestaId}
    />
  );
}
