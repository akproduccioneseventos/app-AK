
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Info } from 'lucide-react';
import Link from 'next/link';

export default function RedirectToChecklistPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
       <div className="flex items-center gap-3">
          <Info className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Página Reubicada
          </h1>
        </div>
      <Card className="shadow-lg border-primary/50">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Gestión de Checklist Movida</CardTitle>
          <CardDescription>
            Para mejorar la organización, la gestión del checklist del cliente ahora se encuentra dentro del módulo "Página Pública y Portal".
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
                Desde allí podrás gestionar todas las secciones que tu cliente y sus invitados ven.
            </p>
        </CardContent>
        <CardFooter>
            <Link href="/fiestas/nueva/portal-cliente" passHref>
                <Button>
                    Ir al Nuevo Módulo de Gestión <ArrowRight className="w-4 h-4 ml-2"/>
                </Button>
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
