import { redirect, notFound } from 'next/navigation';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { moduleRedirects } from '@/lib/portal/portal-redirects';

type Props = {
  params: Promise<{
    fiestaId: string;
    module: string;
  }>;
};

export default async function LegacyPortalModuleRedirectPage(props: Props) {
  const params = await props.params;
  const buildDestination = moduleRedirects[params.module];
  if (buildDestination) {
    redirect(buildDestination(params.fiestaId));
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
