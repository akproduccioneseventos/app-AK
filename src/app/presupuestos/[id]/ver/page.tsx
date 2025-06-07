import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction } from 'lucide-react';
import Link from 'next/link';

export default function VerPresupuestoPage({ params }: { params: { id: string } }) {
  // En una aplicación real, aquí se buscarían los datos del presupuesto por params.id
  // const presupuesto = await getPresupuestoById(params.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/presupuestos" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Presupuestos
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <Construction className="w-16 h-16 mx-auto text-primary mb-4" />
          <CardTitle className="font-headline text-2xl">Ver Presupuesto #{params.id}</CardTitle>
          <CardDescription className="text-lg">
            Funcionalidad en desarrollo.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            Próximamente podrás ver aquí todos los detalles del presupuesto seleccionado.
          </p>
          <img 
            src="https://placehold.co/600x400.png" 
            alt="Detalle de Presupuesto en construcción" 
            className="mt-6 rounded-md shadow-md mx-auto"
            data-ai-hint="document construction"
          />
        </CardContent>
      </Card>
    </div>
  );
}
