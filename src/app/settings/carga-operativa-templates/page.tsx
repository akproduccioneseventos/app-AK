
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

// This page is obsolete. Its functionality has been moved to `/empresa/todos-los-servicios`.
// We redirect to keep any old bookmarks working and maintain a clear structure.
export default function DeprecatedCargaOperativaTemplatesPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/empresa/todos-los-servicios');
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
                        La gestión de inventario y carga ahora se centraliza en la página de "Activos Fijos". Serás redirigido.
                    </p>
                </CardContent>
                 <CardFooter className="justify-center">
                    <Link href="/empresa/todos-los-servicios" passHref>
                        <Button variant="link">
                            Si no eres redirigido, haz clic aquí.
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
