
'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';


function RedirectToCatering() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fiestaId = searchParams.get('fiestaId');
    
    useEffect(() => {
        const destination = `/fiestas/nueva/catering${fiestaId ? `?fiestaId=${fiestaId}` : ''}`;
        router.replace(destination);
    }, [router, fiestaId]);

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="max-w-xl text-center">
                <CardHeader>
                    <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                    <CardTitle className="font-headline text-2xl mt-4">Redirigiendo...</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-muted-foreground">
                        La gestión de Bebidas ahora es parte del Planificador Gastronómico. Serás redirigido.
                    </p>
                </CardContent>
                 <CardFooter className="justify-center">
                    <Link href={`/fiestas/nueva/catering${fiestaId ? `?fiestaId=${fiestaId}` : ''}`} passHref>
                        <Button variant="link">
                            Si no eres redirigido, haz clic aquí.
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function DeprecatedBebidasPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
      <RedirectToCatering />
    </Suspense>
  );
}

