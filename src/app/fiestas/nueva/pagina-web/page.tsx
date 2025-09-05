
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, Globe, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function PaginaWebObsoletoPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the new page immediately
        router.replace('/fiestas/nueva/portal-cliente');
    }, [router]);

    // Render a loading/redirecting state to avoid a blank page flash
    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="max-w-xl text-center">
                <CardHeader>
                    <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                    <CardTitle className="font-headline text-2xl mt-4">Redirigiendo...</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Esta sección ha sido movida. Serás redirigido a la nueva página de "Página Pública y Portal".
                    </p>
                </CardContent>
                <CardFooter className="justify-center">
                    <Link href="/fiestas/nueva/portal-cliente" passHref>
                        <Button variant="link">
                            Si no eres redirigido, haz clic aquí.
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
