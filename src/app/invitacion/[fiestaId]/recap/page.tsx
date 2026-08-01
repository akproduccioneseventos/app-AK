import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Camera, Clock3, MapPin } from 'lucide-react';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getPublicSocialPosts } from '@/app/actions/social-gallery';
import { buildPublicGuestPortalData } from '@/lib/guest-portal-public-data';
import { withGuestAccess } from '@/lib/guest-portal/public-event-navigation';
import { buildMorningRecap, isRecapAvailable } from '@/lib/recap/recap-engine';

interface MorningRecapPageProps {
  params: Promise<{ fiestaId: string }>;
  searchParams: Promise<{ guestId?: string; token?: string }>;
}

function formatDate(value: string): string {
  if (!value) return 'Fecha no informada';
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-UY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export default async function MorningRecapPage({ params, searchParams }: MorningRecapPageProps) {
  const { fiestaId: encodedFiestaId } = await params;
  const { guestId = '', token = '' } = await searchParams;
  const fiestaId = decodeURIComponent(encodedFiestaId);
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) notFound();

  const portal = buildPublicGuestPortalData(fiesta, guestId, token);
  if (!portal) notFound();

  const backHref = withGuestAccess(
    `/invitacion/${fiestaId}/invitado/${guestId}`,
    guestId,
    token,
  );

  if (!isRecapAvailable(portal.fiesta)) {
    return (
      <main className="grid min-h-screen place-items-center bg-stone-50 p-6 text-stone-900">
        <div className="max-w-xl text-center">
          <Clock3 className="mx-auto h-12 w-12 text-stone-400" />
          <p className="mt-5 text-xs font-bold uppercase text-stone-500">Recapitulador del evento</p>
          <h1 className="mt-2 text-3xl font-black">Disponible después de la fiesta</h1>
          <p className="mt-3 text-stone-600">Cuando termine el evento vas a encontrar acá las fotos aprobadas y los momentos publicados.</p>
          <Link href={backHref} className="mt-7 inline-flex min-h-11 items-center gap-2 font-bold text-red-700">
            <ArrowLeft className="h-4 w-4" /> Volver a mi portal
          </Link>
        </div>
      </main>
    );
  }

  const posts = await getPublicSocialPosts(fiestaId);
  const recap = buildMorningRecap(portal.fiesta, posts);

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-8 text-stone-950 sm:px-8 sm:py-12">
      <article className="mx-auto max-w-5xl">
        <Link href={backHref} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-red-700">
          <ArrowLeft className="h-4 w-4" /> Volver a mi portal
        </Link>

        <header className="mt-6 border-y-4 border-double border-stone-800 py-8 text-center">
          <p className="text-xs font-bold uppercase text-stone-500">Edición especial · Recuerdos reales</p>
          <h1 className="mt-3 text-4xl font-black uppercase sm:text-6xl">{recap.eventName}</h1>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-stone-600">
            <span>{formatDate(recap.eventDate)}</span>
            {recap.venueName && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{recap.venueName}</span>}
            <span className="inline-flex items-center gap-1"><Camera className="h-4 w-4" />{recap.photoCount} fotos publicadas</span>
          </div>
        </header>

        {recap.programHighlights.length > 0 && (
          <section className="border-b border-stone-300 py-7">
            <h2 className="text-xl font-black">Programa publicado</h2>
            <p className="mt-2 leading-relaxed text-stone-700">{recap.programHighlights.join(' · ')}</p>
          </section>
        )}

        <section className="py-8">
          <h2 className="text-2xl font-black">Fotos compartidas</h2>
          {recap.photos.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {recap.photos.map((post) => (
                <figure key={post.id} className="min-w-0">
                  <div className="relative aspect-square overflow-hidden bg-stone-200">
                    <Image src={post.imageUrl} alt={post.dedication || `Foto compartida por ${post.authorName}`} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" unoptimized />
                  </div>
                  <figcaption className="mt-2 truncate text-xs font-semibold text-stone-600">{post.authorName}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="mt-4 border-y border-stone-300 py-8 text-stone-600">Todavía no hay fotos aprobadas para mostrar.</p>
          )}
        </section>
      </article>
    </main>
  );
}
