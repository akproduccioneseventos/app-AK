import { Metadata } from 'next';
import { getFiestaBySlug } from '@/app/actions/fiesta/fiesta.actions';
import { getSocialConnections } from '@/app/actions/social-connections';
import { buildInvitacionConfigFromFiesta, TIPO_EVENTO_LABELS } from '@/lib/invitacion-config-defaults';
import { InvitacionPublicaClient } from '@/app/invitacion/[fiestaId]/invitacion-publica-client';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const fiesta = await getFiestaBySlug(params.slug);
    if (!fiesta) return { title: 'Invitación no encontrada' };

    const config = buildInvitacionConfigFromFiesta(fiesta, fiesta.invitacionConfig);
    const title = config.nombreHomenajeada
      ? `${TIPO_EVENTO_LABELS[config.tipoEvento]} - ${config.nombreHomenajeada}`
      : fiesta.configuracion.nombreEvento || 'Invitación Digital';
    const description = config.textoBienvenida || `¡Estás invitado/a a ${title}!`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        ...(config.fotoPortada ? { images: [{ url: config.fotoPortada, width: 1200, height: 630 }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(config.fotoPortada ? { images: [config.fotoPortada] } : {}),
      },
    };
  } catch {
    return { title: 'Invitación Digital' };
  }
}

export default async function InvitacionSlugPage({ params }: PageProps) {
  const [fiesta, socialConnections] = await Promise.all([
    getFiestaBySlug(params.slug),
    getSocialConnections().catch(() => [] as import('@/types/settings').SocialConnection[]),
  ]);

  if (!fiesta) {
    notFound();
  }

  const config = buildInvitacionConfigFromFiesta(fiesta, fiesta.invitacionConfig);

  return <InvitacionPublicaClient config={config} fiestaId={fiesta.id} socialConnections={socialConnections} />;
}
