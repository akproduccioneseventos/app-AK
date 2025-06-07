import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction } from 'lucide-react';
import Link from 'next/link';

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
       <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Editar Factura #{params.id}
        </h1>
        <Link href={`/invoices/${params.id}`} passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a la Factura
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <Construction className="w-16 h-16 mx-auto text-primary mb-4" />
          <CardTitle className="font-headline text-2xl">Página en Construcción</CardTitle>
          <CardDescription className="text-lg">
            La edición de facturas estará disponible próximamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            Estamos trabajando para que puedas modificar los detalles de tus facturas directamente desde aquí.
          </p>
          <img 
            src="https://placehold.co/600x400.png" 
            alt="Formulario de edición de factura en construcción" 
            className="mt-6 rounded-md shadow-md mx-auto"
            data-ai-hint="invoice form construction"
          />
        </CardContent>
      </Card>
    </div>
  );
}
