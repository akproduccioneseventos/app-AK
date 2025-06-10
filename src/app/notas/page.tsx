
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, StickyNote } from 'lucide-react';
import Link from 'next/link';

export default function NotasPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Bloc de Notas
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
            <StickyNote className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Página en Construcción</CardTitle>
          <CardDescription className="text-lg">
            Un espacio para tus notas rápidas y recordatorios estará disponible aquí.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Estamos preparando un sistema sencillo para que puedas anotar ideas, tareas sueltas o cualquier información relevante.
          </p>
          <img 
            src="https://placehold.co/600x300.png" 
            alt="Bloc de notas en construcción" 
            className="mt-6 rounded-md shadow-md mx-auto"
            data-ai-hint="notes app construction"
          />
           <p className="text-sm text-muted-foreground pt-4">
            Mientras tanto, puedes usar la sección de "Notas" dentro de cada reunión en el planificador de la fiesta actual.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
