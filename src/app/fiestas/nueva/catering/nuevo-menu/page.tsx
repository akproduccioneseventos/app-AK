
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UtensilsCrossed, Construction } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function NuevoMenuPersonalizadoPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Crear Nuevo Menú Personalizado
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
          <Construction className="w-16 h-16 mx-auto text-primary mb-4" />
          <CardTitle className="font-headline text-2xl">Página en Construcción</CardTitle>
          <CardDescription className="text-lg">
            Estamos preparando el formulario para que puedas crear tus menús detallados.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Próximamente, aquí podrás:
          </p>
          <ul className="list-disc list-inside text-left text-muted-foreground inline-block">
            <li>Darle un nombre a tu nuevo menú.</li>
            <li>Añadir entradas y platos principales.</li>
            <li>Detallar cada ingrediente con su cantidad y costo.</li>
            <li>Ver el costo total calculado para tu menú.</li>
          </ul>
          <Image 
            src="https://placehold.co/600x300.png" 
            alt="Formulario de creación de menú en construcción" 
            width={500}
            height={250}
            className="mt-6 rounded-md shadow-md mx-auto"
            data-ai-hint="menu form construction"
          />
        </CardContent>
      </Card>
    </div>
  );
}
