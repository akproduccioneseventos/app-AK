import { Metadata } from 'next';
import { getPublicSocialPosts, getPublicSocialEvent } from '@/app/actions/social-gallery';
import { notFound } from 'next/navigation';
import { VideoRecuerdoClient } from './video-recuerdo-client';
import { ShieldAlert } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
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
  const { t: accessKey } = await searchParams;

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

  // 2. Traer las fotos públicas (ya filtradas por moderationStatus === 'approved')
  // Solo queremos imágenes, no videos pesados que compliquen el slideshow.
  const posts = await getPublicSocialPosts(fiestaId);
  const images = posts
    .filter(p => p.mediaType === 'image')
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // 3. Fallback si hay muy pocas fotos
  if (images.length < 5) {
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

  // 4. Renderizar el componente cliente que hace la magia de animación
  return <VideoRecuerdoClient eventName={event.configuracion.nombreEvento} images={images} />;
}
