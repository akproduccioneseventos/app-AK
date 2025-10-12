
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingCart, ChefHat, Palette, HardHat } from 'lucide-react';

export default function ComprasPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              Compras y Checklist
            </h1>
        </div>
        <Link href="/" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Menú Principal
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">Módulo de Compras Centralizado</CardTitle>
          <CardDescription className="text-lg">
            Accede a las listas de compras generadas por cada módulo del planificador.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/fiestas/nueva/catering/lista-compras" passHref>
                <Card className="hover:shadow-xl transition-shadow cursor-pointer h-full">
                    <CardHeader><CardTitle className="flex items-center gap-2"><ChefHat className="text-primary"/>Compras de Catering</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground">Ver la lista consolidada de ingredientes y bebidas.</p></CardContent>
                </Card>
            </Link>
             <Link href="/fiestas/nueva/decoracion" passHref>
                <Card className="hover:shadow-xl transition-shadow cursor-pointer h-full">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="text-primary"/>Compras de Decoración</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground">Gestionar y adquirir los elementos decorativos.</p></CardContent>
                </Card>
            </Link>
             <Link href="/empresa/activos-fijos" passHref>
                <Card className="hover:shadow-xl transition-shadow cursor-pointer h-full">
                    <CardHeader><CardTitle className="flex items-center gap-2"><HardHat className="text-primary"/>Adquisición de Activos</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground">Gestionar la compra de activos fijos para la empresa.</p></CardContent>
                </Card>
            </Link>
        </CardContent>
      </Card>
       <p className="text-xs text-center text-muted-foreground">
        Este módulo centraliza los accesos a las diferentes áreas de compra para una gestión más eficiente.
      </p>
    </div>
  );
}
