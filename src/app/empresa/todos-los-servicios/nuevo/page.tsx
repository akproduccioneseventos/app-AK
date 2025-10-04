
'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

// This page is obsolete and will redirect to the correct "new" page based on a query parameter.
function NuevoItemRedirectContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const type = searchParams.get('type');

    useEffect(() => {
        let destination = '/empresa'; // Fallback
        if (type === 'Servicio') {
            destination = '/empresa/servicios/nuevo';
        } else if (type === 'Activo Fijo') {
            destination = '/empresa/activos-fijos/nuevo';
        } else if (type === 'Insumo/Ingrediente') {
            destination = '/empresa/insumos/nuevo';
        }
        
        router.replace(destination);
    }, [router, type]);

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="max-w-xl text-center">
                <CardHeader>
                    <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                    <CardTitle className="font-headline text-2xl mt-4">Redirigiendo...</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-muted-foreground">
                        La creación de ítems ha sido reorganizada. Serás redirigido al formulario correcto.
                    </p>
                </CardContent>
                 <CardFooter className="justify-center">
                    <Link href="/empresa" passHref>
                        <Button variant="link">
                            Si no eres redirigido, haz clic aquí.
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}


export default function NuevoItemRedirectPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <NuevoItemRedirectContent/>
        </Suspense>
    )
}
