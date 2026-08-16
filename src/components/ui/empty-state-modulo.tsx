import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, Store } from 'lucide-react';

interface EmptyStateModuloProps {
  titulo: string;
  descripcion: string;
  fiestaId: string;
}

export function EmptyStateModulo({ titulo, descripcion, fiestaId }: EmptyStateModuloProps) {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Planificador
          </Link>
        </Button>
      </div>
      <Card className="border-dashed border-2 bg-slate-50">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 mb-2">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            Módulo no contratado: {titulo}
          </h2>
          <p className="text-slate-500 max-w-md">
            {descripcion}
          </p>
          <div className="pt-4 flex items-center gap-4">
            <Button asChild variant="default">
              <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
                Volver al panel
              </Link>
            </Button>
            <Button asChild variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
              <Link href={`/tienda?fiestaId=${fiestaId}`}>
                <Store className="h-4 w-4 mr-2" />
                Ir a la tienda
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
