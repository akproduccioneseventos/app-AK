import { redirect, notFound } from 'next/navigation';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';

type Props = {
  params: {
    fiestaId: string;
    module: string;
  };
};

const moduleRedirects: Record<string, string> = {
  'tareas': '/fiestas/nueva/tareas',
  'musica': '/fiestas/nueva/musica',
  'video-vida': '/fiestas/nueva/video-vida',
  'documentos': '/fiestas/nueva/gestion-documental',
  'fotografia': '/fiestas/nueva/fotografia',
};

export default async function LegacyPortalModuleRedirectPage({ params }: Props) {
  const destination = moduleRedirects[params.module];
  if (destination) {
    redirect(`${destination}?fiestaId=${params.fiestaId}`);
  }

  if (params.module === 'notas' || params.module === 'pagina-publica') {
    const fiesta = await getFiestaById(params.fiestaId);
    if (!fiesta) {
      notFound();
    }

    const accessKey = fiesta.clientPortalSettings?.accessKey;

    if (accessKey) {
      redirect(`/portal/c/${accessKey}`);
    }

    redirect(`/portal?fiestaId=${params.fiestaId}`);
  }

  notFound();
}
