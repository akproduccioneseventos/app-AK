
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

// This page is now obsolete as its functionality has been moved.
// It now redirects to the new public-facing simulator page.
export default function SimuladorObsoletoPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the new public simulator page.
        router.replace('/armado-rapido');
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
                        Esta página ha sido movida. Serás redirigido al nuevo simulador de presupuestos.
                    </p>
                </CardContent>
                 <CardFooter className="justify-center">
                    <Link href="/armado-rapido" passHref>
                        <Button variant="link">
                            Si no eres redirigido, haz clic aquí.
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
