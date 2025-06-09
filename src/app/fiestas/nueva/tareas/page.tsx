
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ListChecks } from 'lucide-react';
import Link from 'next/link';

export default function TareasEventoPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Gestión de Tareas del Evento
        </h1>
        <Link href="/fiestas/nueva" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Planificador
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <ListChecks className="w-16 h-16 mx-auto text-primary mb-4" />
          <CardTitle className="font-headline text-2xl">Página en Construcción</CardTitle>
          <CardDescription className="text-lg">
            La gestión de tareas del evento estará disponible próximamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            Estamos trabajando para que puedas crear, asignar y seguir el progreso de todas las tareas de tu fiesta.
          </p>
          <img 
            src="https://placehold.co/600x400.png" 
            alt="Gestión de tareas en construcción" 
            className="mt-6 rounded-md shadow-md mx-auto"
            data-ai-hint="tasks checklist construction"
          />
        </CardContent>
      </Card>
    </div>
  );
}
