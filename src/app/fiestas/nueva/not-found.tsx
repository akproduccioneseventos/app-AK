import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function FiestaPlannerNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="w-full max-w-lg text-center rounded-3xl">
        <CardHeader>
          <div className="mx-auto p-4 bg-destructive/10 rounded-2xl w-fit mb-4">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-headline">Evento no encontrado</CardTitle>
          <CardDescription>
            El módulo del planificador que intentaste abrir no existe o no está disponible para este evento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/eventos">
            <Button variant="outline" className="rounded-xl">
              Volver a Eventos
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
