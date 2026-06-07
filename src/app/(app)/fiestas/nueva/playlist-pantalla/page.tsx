import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { ScreenPlaylistAdmin } from '@/components/screen/ScreenPlaylistAdmin';
import { SocialScreenConfigPanel } from '@/components/screen/SocialScreenConfigPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ fiestaId?: string }>;
}

export default async function PlaylistPantallaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const fiestaId = params.fiestaId;

  if (!fiestaId) {
    redirect('/fiestas/nueva');
  }

  const fiesta = await getFiestaById(fiestaId);

  if (!fiesta) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Fiesta no encontrada.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configuración de Pantalla en Vivo</h1>
        <p className="text-muted-foreground">
          Evento: <span className="font-semibold">{fiesta.configuracion?.nombreEvento || 'Sin nombre'}</span>
        </p>
      </div>

      <ScreenPlaylistAdmin fiestaId={fiestaId} />
      
      <SocialScreenConfigPanel fiestaId={fiestaId} />
    </div>
  );
}
