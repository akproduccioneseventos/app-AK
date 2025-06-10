
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function ProveedoresGeneralPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Gestión General de Proveedores
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
            <Briefcase className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Página en Construcción</CardTitle>
          <CardDescription className="text-lg">
            Un directorio centralizado para todos tus proveedores estará disponible próximamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Aquí podrás listar, categorizar y gestionar la información de contacto y servicios de todos tus proveedores habituales.
          </p>
          <img 
            src="https://placehold.co/600x300.png" 
            alt="Gestión de proveedores en construcción" 
            className="mt-6 rounded-md shadow-md mx-auto"
            data-ai-hint="vendor directory construction"
          />
          <p className="text-sm text-muted-foreground pt-4">
            Mientras tanto, puedes usar la sección de "Proveedores y Servicios" dentro del planificador de la fiesta actual para gestionar los proveedores de ese evento específico.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
