'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { ScreenPlaylistAdmin } from '@/components/screen/ScreenPlaylistAdmin';
import { SocialScreenConfigPanel } from '@/components/screen/SocialScreenConfigPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

export default function PlaylistPantallaPage() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!fiestaId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getFiestaById(fiestaId)
      .then((data) => {
        if (active) setFiesta(data);
      })
      .catch(() => {
        if (active) setFiesta(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fiestaId]);

  if (!fiestaId) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">Elegí una fiesta para configurar su pantalla en vivo.</p>
            <Button asChild><Link href="/eventos">Ir a eventos</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
