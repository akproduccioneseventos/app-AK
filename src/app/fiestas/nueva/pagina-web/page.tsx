
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Info } from 'lucide-react';
import Link from 'next/link';

export default function RedirectToNewWebSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Optional: immediate redirect
    // router.replace('/fiestas/nueva/portal-cliente');
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
       <div className="flex items-center gap-3">
          <Info className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Página Actualizada
          </h1>
        </div>
      <Card className="shadow-lg border-primary/50">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Gestión de Página Web Movida</CardTitle>
          <CardDescription>
            Para mejorar la organización, la configuración de la página web del evento ahora se encuentra dentro del nuevo "Portal del Cliente".
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
                Desde allí podrás gestionar tanto la página pública para invitados como las secciones privadas que ve tu cliente.
            </p>
        </CardContent>
        <CardFooter>
            <Link href="/fiestas/nueva/portal-cliente" passHref>
                <Button>
                    Ir a la Nueva Página de Gestión <ArrowRight className="w-4 h-4 ml-2"/>
                </Button>
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
