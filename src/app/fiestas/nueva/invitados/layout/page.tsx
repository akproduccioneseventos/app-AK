
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Ban } from 'lucide-react';

export default function SalonLayoutRemovedPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit">
            <Ban className="w-12 h-12 text-destructive" />
          </div>
          <CardTitle className="mt-4 font-headline text-2xl">Módulo Deshabilitado</CardTitle>
          <CardDescription>
            Esta funcionalidad ha sido removida para resolver un problema técnico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Lamentamos los inconvenientes. Puedes volver al planificador de eventos.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/fiestas/nueva" passHref>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Planificador
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
