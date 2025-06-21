
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ListChecks, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function ComprasPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Compras y Checklist
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
            <ShoppingCart className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Página en Construcción</CardTitle>
          <CardDescription className="text-lg">
            La gestión de compras y checklist detallados estará disponible próximamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Podrás llevar un control de todas las compras necesarias para tus eventos y crear listas de verificación personalizadas.
          </p>
           <p className="text-sm text-muted-foreground pt-4">
            Por ahora, puedes usar la sección de "Tareas del Evento" dentro del planificador de la fiesta actual.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
