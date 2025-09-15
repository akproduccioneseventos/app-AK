
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SimuladorDePresupuestoPage() {
    const router = useRouter();

    // The client-facing simulator is now replaced by a shareable link from the manual builder.
    // For now, redirecting to the main budget page.
    useEffect(() => {
        router.replace('/presupuestos');
    }, [router]);
    
    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="max-w-xl text-center">
                <CardHeader>
                    <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                    <CardTitle className="font-headline text-2xl mt-4">Página Actualizada</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        El simulador de cliente ha sido integrado en la nueva Central de Presupuestos.
                    </p>
                </CardContent>
                 <CardFooter className="justify-center">
                    <Link href="/presupuestos" passHref>
                        <Button variant="link">
                           Ir a la Central de Presupuestos
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
