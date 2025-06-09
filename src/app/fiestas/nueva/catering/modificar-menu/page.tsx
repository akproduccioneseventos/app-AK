
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction, ListFilter } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function ModificarMenuPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Seleccionar Menú para Modificar
        </h1>
        <Link href="/fiestas/nueva/catering" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Catering
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full inline-block mb-4">
            <ListFilter className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Página en Construcción</CardTitle>
          <CardDescription className="text-lg">
            La selección y edición de menús existentes estará disponible próximamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Estamos trabajando para que puedas ver aquí una lista de todos tus menús personalizados guardados
            y seleccionar uno para editar sus platos, ingredientes y costos.
          </p>
          <Image 
            src="https://placehold.co/600x300.png" 
            alt="Edición de menús en construcción" 
            width={500}
            height={250}
            className="mt-6 rounded-md shadow-md mx-auto"
            data-ai-hint="menu editing construction"
          />
          <p className="text-sm text-muted-foreground pt-4">
            ¡Vuelve pronto para esta funcionalidad!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
