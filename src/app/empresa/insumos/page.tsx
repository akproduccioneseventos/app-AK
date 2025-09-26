'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function InsumosPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Gestión de Insumos e Ingredientes
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/empresa" passHref>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
      </div>
      <CardDescription>
        Gestiona tu inventario de consumibles (ingredientes, bebidas, descartables, etc.).
      </CardDescription>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full inline-block mb-4">
            <ShoppingCart className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Módulo en Reconstrucción</CardTitle>
          <CardDescription className="text-lg">
            Esta sección está siendo mejorada para asegurar su correcto funcionamiento.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Para resolver un error persistente, esta área ha sido simplificada temporalmente. La funcionalidad completa de gestión de insumos será restaurada en breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
