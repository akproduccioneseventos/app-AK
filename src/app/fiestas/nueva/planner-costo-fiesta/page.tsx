
'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

// This page is obsolete. Its functionality has been moved to the event planner itself.
// We redirect to the new central page for this functionality.
function RedirectToCatering() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fiestaId = searchParams.get('fiestaId');

    useEffect(() => {
        router.replace(`/fiestas/nueva/catering?fiestaId=${fiestaId || ''}`);
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
                        El Planificador Gastronómico ahora está integrado en el módulo de Catering. Serás redirigido.
                    </p>
                </CardContent>
                 <CardFooter className="justify-center">
                    <Link href={`/fiestas/nueva/catering?fiestaId=${fiestaId || ''}`} passHref>
                        <Button variant="link">
                            Si no eres redirigido, haz clic aquí.
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}


export default function DeprecatedPlannerCostoPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <RedirectToCatering />
        </Suspense>
    );
}
