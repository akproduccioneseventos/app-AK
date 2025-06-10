
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarClock } from 'lucide-react';
import Link from 'next/link';

export default function EventosPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Gestión de Eventos
        </h1>
        <Link href="/" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full inline-block mb-4">
            <CalendarClock className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Página en Construcción</CardTitle>
          <CardDescription className="text-lg">
            La gestión general de múltiples eventos estará disponible próximamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Estamos trabajando para que puedas administrar todos tus eventos pasados, presentes y futuros desde un solo lugar.
          </p>
          <img 
            src="https://placehold.co/600x300.png" 
            alt="Gestión de eventos en construcción" 
            className="mt-6 rounded-md shadow-md mx-auto"
            data-ai-hint="event management construction"
          />
          <p className="text-sm text-muted-foreground pt-4">
            Mientras tanto, puedes seguir planificando tu evento actual desde la sección "Crear Fiesta".
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
