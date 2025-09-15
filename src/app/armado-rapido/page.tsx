
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ArmadoRapidoObsoletoPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/simulador-de-presupuesto');
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
                        Esta página ha sido actualizada. Serás redirigido al nuevo "Simulador de Presupuesto".
                    </p>
                </CardContent>
                 <CardFooter className="justify-center">
                    <Link href="/simulador-de-presupuesto" passHref>
                        <Button variant="link">
                            Si no eres redirigido, haz clic aquí.
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
