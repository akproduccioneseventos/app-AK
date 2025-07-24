
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PageContent() {
    const searchParams = useSearchParams();
    const presupuestoId = searchParams.get('id');

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-lg text-center shadow-2xl p-8">
                <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4"/>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold font-headline text-green-700">¡Presupuesto Generado con Éxito!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg text-muted-foreground">
                        Gracias por tu interés. Hemos generado un presupuesto inicial para tu evento. Un asesor de nuestro equipo se pondrá en contacto contigo a la brevedad para refinar los detalles y seleccionar el menú.
                    </p>
                </CardContent>
                 <CardFooter className="justify-center mt-4">
                    <p className="text-sm text-muted-foreground">
                       Mientras esperas, puedes volver a la página principal.
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}

export default function SolicitudEnviadaPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <PageContent />
        </Suspense>
    )
}
