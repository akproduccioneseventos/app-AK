import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getPublicSocialPosts } from '@/app/actions/social-gallery';
import { quienEsElEquipo } from '@/lib/auth/equipo-de-la-fiesta';
import { LECTURA_COMPLETA } from '@/lib/fiesta/lectura-completa';
import { verifyPortalSession } from '@/lib/security/portal-session';
import { FaceGalleryStrip } from '@/components/entertainment/FaceGalleryStrip';
import { QuienEsQuienCarasPanel } from '@/components/portal/QuienEsQuienCarasPanel';

type Props = {
  params: Promise<{
    fiestaId: string;
    module: string;
  }>;
};

const moduleRedirects: Record<string, (fiestaId: string) => string> = {
  'tareas': (fiestaId) => `/portal?fiestaId=${fiestaId}`,
  'musica': (fiestaId) => `/portal-cliente/${fiestaId}/musica`,
  'video-vida': (fiestaId) => `/portal-cliente/${fiestaId}/fotos-video`,
  'documentos': (fiestaId) => `/portal/${fiestaId}/contrato`,
  'fotografia': (fiestaId) => `/portal-cliente/${fiestaId}/fotos-video`,
};

const FACE_PORTAL_MODULES = new Set(['recuerdo', 'recuerdos', 'galeria', 'quien-es-quien']);

export default async function LegacyPortalModuleRedirectPage(props: Props) {
  const params = await props.params;
  const buildDestination = moduleRedirects[params.module];
  if (buildDestination) {
    redirect(buildDestination(params.fiestaId));
  }

  if (FACE_PORTAL_MODULES.has(params.module)) {
    const fiesta = await getFiestaById(params.fiestaId);
    if (!fiesta) {
      notFound();
    }
    const posts = await getPublicSocialPosts(params.fiestaId).catch((err) => {
      console.warn('[portal/module] No se pudieron cargar fotos:', err);
      return [];
    });

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-rose-700">
                Portal del Cliente
              </p>
              <h1 className="text-2xl font-black text-slate-950">
                Recuerdos y ¿Quién es quién?
              </h1>
              <p className="text-sm text-slate-600">
                {fiesta.configuracion?.nombreEvento || 'Tu fiesta'}
              </p>
            </div>
            <Link
              href={`/portal-cliente/${encodeURIComponent(params.fiestaId)}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al portal
            </Link>
          </div>

          <QuienEsQuienCarasPanel fiestaId={params.fiestaId} />

          <FaceGalleryStrip posts={posts} />
        </div>
      </main>
    );
  }

  if (params.module === 'notas' || params.module === 'pagina-publica') {
    const esCliente = await verifyPortalSession(params.fiestaId).catch(() => false);
    const decideEquipo = await quienEsElEquipo().catch(() => () => false);
    const fiestaPublica = await getFiestaById(params.fiestaId);
    if (!fiestaPublica) {
      notFound();
    }

    if (esCliente || decideEquipo(fiestaPublica)) {
      const fiestaCompleta = await getFiestaById(params.fiestaId, LECTURA_COMPLETA);
      const accessKey = fiestaCompleta?.clientPortalSettings?.accessKey;
      if (accessKey) {
        redirect(`/portal/c/${accessKey}`);
      }
    }

    redirect(`/portal?fiestaId=${params.fiestaId}`);
  }

  notFound();
}
