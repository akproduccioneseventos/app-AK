import { Metadata } from 'next';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getSocialConnections } from '@/app/actions/social-connections';
import { buildInvitacionConfigFromFiesta, TIPO_EVENTO_LABELS } from '@/lib/invitacion-config-defaults';
import { InvitacionPublicaClient } from './invitacion-publica-client';

interface PageProps {
  params: { fiestaId: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const fiesta = await getFiestaById(params.fiestaId);
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

export default async function InvitacionPublicaPage({ params }: PageProps) {
  const [fiesta, socialConnections] = await Promise.all([
    getFiestaById(params.fiestaId),
    getSocialConnections().catch((err) => {
      console.error('[InvitacionPublicaPage] Failed to fetch social connections:', err);
      return [] as import('@/types/settings').SocialConnection[];
    }),
  ]);

  if (!fiesta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-2xl font-bold text-gray-800">Invitación no encontrada</h1>
          <p className="text-gray-500">El enlace puede haber expirado o ser incorrecto.</p>
        </div>
      </div>
    );
  }

  const config = buildInvitacionConfigFromFiesta(fiesta, fiesta.invitacionConfig);

  return <InvitacionPublicaClient config={config} fiestaId={params.fiestaId} socialConnections={socialConnections} />;
}
