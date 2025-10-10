
'use client';

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

// This page is obsolete and has been replaced by specific edit pages for each module.
export default function DeprecatedGeneralEditPage() {
    const router = useRouter();

    useEffect(() => {
        // Fallback redirection for a deprecated route
        router.replace('/empresa');

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
                        La edición de ítems ha sido reestructurada. Serás redirigido.
                    </p>
                </CardContent>
                 <CardFooter className="justify-center">
                    <Button variant="link" onClick={() => router.back()}>
                       Volver
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
