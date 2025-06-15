
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HardHat, Calculator } from 'lucide-react';
import Image from 'next/image';

export default function PlannerCostoFiestaPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Planner Costo-Fiesta
          </h1>
        </div>
        <Link href="/eventos" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Gestor de Fiestas
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full inline-block mb-4">
            <HardHat className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Módulo en Construcción</CardTitle>
          <CardDescription className="text-lg">
            El "Planner Costo-Fiesta" está actualmente en desarrollo.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Próximamente, aquí podrás calcular y gestionar proporciones, costos, precios y logística de servicios gastronómicos y de bebidas para tus eventos.
          </p>
          <Image
            src="https://placehold.co/600x300.png"
            alt="Módulo en construcción"
            width={500}
            height={250}
            className="mt-6 rounded-md shadow-md mx-auto"
            data-ai-hint="planning tools construction"
          />
        </CardContent>
      </Card>
    </div>
  );
}
