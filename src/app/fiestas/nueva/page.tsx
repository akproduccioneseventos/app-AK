
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction } from 'lucide-react';
import Link from 'next/link';

export default function CrearNuevaFiestaPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Crear Nueva Fiesta
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
          <Construction className="w-16 h-16 mx-auto text-primary mb-4" />
          <CardTitle className="font-headline text-2xl">Página en Construcción</CardTitle>
          <CardDescription className="text-lg">
            La creación de fiestas estará disponible próximamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            Estamos trabajando para que puedas planificar y presupuestar tus fiestas directamente desde aquí.
          </p>
          <img
            src="https://placehold.co/600x400.png"
            alt="Página de creación de fiesta en construcción"
            className="mt-6 rounded-md shadow-md mx-auto"
            data-ai-hint="party planning construction"
          />
        </CardContent>
      </Card>
    </div>
  );
}
