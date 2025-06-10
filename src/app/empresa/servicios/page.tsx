
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Construction } from 'lucide-react';
import Link from 'next/link';

export default function ServiciosEmpresaPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Servicios de la Empresa
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
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Página en Construcción</CardTitle>
          <CardDescription className="text-lg">
            La gestión de servicios ofrecidos por la empresa estará disponible aquí.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Próximamente podrás detallar y administrar los diferentes servicios que tu empresa ofrece a los clientes.
          </p>
          <Construction className="w-24 h-24 text-primary/70 my-6 mx-auto" />
           <img 
            src="https://placehold.co/600x300.png" 
            alt="Gestión de servicios en construcción" 
            className="mt-6 rounded-md shadow-md mx-auto"
            data-ai-hint="services list construction"
          />
        </CardContent>
      </Card>
    </div>
  );
}
