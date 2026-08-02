import { Metadata } from 'next';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getSocialConnections } from '@/app/actions/social-connections';
import { buildInvitacionConfigFromFiesta, TIPO_EVENTO_LABELS } from '@/lib/invitacion-config-defaults';
import { InvitacionPublicaClient } from './invitacion-publica-client';

interface PageProps {
  params: Promise<{ fiestaId: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  try {
    const fiesta = await getFiestaById(params.fiestaId);
    if (!fiesta) return { title: 'Invitación no encontrada' };

    const config = buildInvitacionConfigFromFiesta(fiesta, fiesta.invitacionConfig);

    // La tarjeta que aparece al pegar el enlace en WhatsApp decia "Evento
    // Especial - Valentina" para una fiesta llamada "XV de Valentina": se
    // armaba con una etiqueta generica en vez del nombre real del evento.
    // Ahora manda el nombre que cargo el equipo, y la etiqueta generica queda
    // solo para cuando no hay nombre.
    const etiquetaTipo = TIPO_EVENTO_LABELS[config.tipoEvento];
    const nombreDelEvento = fiesta.configuracion?.nombreEvento?.trim();
    const title = nombreDelEvento
      || (config.nombreHomenajeada ? `${etiquetaTipo} - ${config.nombreHomenajeada}` : 'Invitación Digital');
    const description = config.textoBienvenida || `¡Estás invitado/a a ${title}!`;

    // Sin imagen, WhatsApp muestra el enlace pelado. Si no hay foto de portada
    // cargada, sirve la del protagonista.
    const imagen = config.fotoPortada || fiesta.configuracion?.protagonistaFotoUrl || '';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        ...(imagen ? { images: [{ url: imagen, width: 1200, height: 630 }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(imagen ? { images: [imagen] } : {}),
      },
    };
  } catch {
    return { title: 'Invitación Digital' };
  }
}

export default async function InvitacionPublicaPage(props: PageProps) {
  const params = await props.params;
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
