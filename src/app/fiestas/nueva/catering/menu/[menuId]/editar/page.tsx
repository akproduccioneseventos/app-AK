
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction, Utensils } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function EditarMenuEspecificoPage({ params }: { params: { menuId: string } }) {
  // En una aplicación real, aquí buscarías los datos del menú por params.menuId
  // y los pasarías a un formulario de edición (similar a la página de creación de menús).

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Editando Menú: <span className="text-primary">{params.menuId}</span>
        </h1>
        <Link href="/fiestas/nueva/catering/modificar-menu" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Selección de Menús
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full inline-block mb-4">
            <Utensils className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Página en Construcción</CardTitle>
          <CardDescription className="text-lg">
            La edición detallada de menús personalizados estará disponible próximamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Estamos trabajando para que puedas modificar aquí todos los platos, ingredientes
            y costos del menú seleccionado "{params.menuId}".
          </p>
          <Image 
            src="https://placehold.co/600x300.png" 
            alt="Edición de menú en construcción" 
            width={500}
            height={250}
            className="mt-6 rounded-md shadow-md mx-auto"
            data-ai-hint="menu editing construction detailed"
          />
          <p className="text-sm text-muted-foreground pt-4">
            ¡Vuelve pronto para esta funcionalidad! Por ahora, puedes volver a la selección o crear un nuevo menú.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
