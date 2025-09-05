
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ListaComprasObsoletoPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/fiestas/nueva/catering/lista-compras');
    }, [router]);
    
    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="max-w-xl text-center">
                <CardHeader>
                    <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                    <CardTitle className="font-headline text-2xl mt-4">Redirigiendo...</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-muted-foreground">
                        La lista de compras gastronómicas ahora se encuentra dentro del módulo de Catering del planificador de fiestas.
                    </p>
                </CardContent>
                 <CardFooter className="justify-center">
                    <Link href="/fiestas/nueva/catering/lista-compras" passHref>
                        <Button variant="link">
                            Si no eres redirigido, haz clic aquí.
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
