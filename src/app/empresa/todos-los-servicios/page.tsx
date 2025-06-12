
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function TodosLosServiciosPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Todos los Servicios de la Empresa
        </h1>
        <Link href="/" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Menú Principal
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full inline-block mb-4">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Catálogo General de Servicios</CardTitle>
          <CardDescription className="text-lg">
            Esta sección te permitirá gestionar y visualizar todos los servicios que ofrece tu empresa.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Próximamente podrás añadir, editar y categorizar todos los servicios que ofreces,
            desde alquiler de equipos hasta servicios de personal y más.
          </p>
          <Image
            src="https://placehold.co/600x300.png"
            alt="Gestión de servicios de la empresa en construcción"
            width={600}
            height={300}
            className="mt-6 rounded-md shadow-md mx-auto"
            data-ai-hint="company services management"
          />
        </CardContent>
      </Card>
    </div>
  );
}
