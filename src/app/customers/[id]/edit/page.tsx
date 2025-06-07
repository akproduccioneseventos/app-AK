import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction } from 'lucide-react';
import Link from 'next/link';

export default function EditCustomerPage({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Editar Cliente #{params.id}
          </h1>
        <Link href="/customers" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Clientes
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <Construction className="w-16 h-16 mx-auto text-primary mb-4" />
          <CardTitle className="font-headline text-2xl">Página en Construcción</CardTitle>
          <CardDescription className="text-lg">
            La edición de clientes estará disponible próximamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            Estamos trabajando para que puedas modificar los datos de tus clientes directamente desde aquí.
          </p>
          <img 
            src="https://placehold.co/600x400.png" 
            alt="Formulario de edición en construcción" 
            className="mt-6 rounded-md shadow-md mx-auto"
            data-ai-hint="form under construction"
          />
        </CardContent>
      </Card>
    </div>
  );
}
