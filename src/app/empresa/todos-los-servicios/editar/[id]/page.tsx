
'use client';

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

// This page is obsolete. Its functionality has been moved.
// We redirect to the new central hub for enterprise management.
export default function DeprecatedGeneralEditIdPage({ params: paramsProp }: { params: { id: string } }) {
    const params = use(paramsProp);
    const router = useRouter();

    useEffect(() => {
        // A more robust solution would be to fetch the item type and redirect accordingly.
        // For now, redirecting to the main assets page is a safe fallback.
        if(params.id) {
            router.replace(`/empresa/activos-fijos/editar/${params.id}`);
        } else {
            router.replace('/empresa');
        }
    }, [router, params.id]);

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="max-w-xl text-center">
                <CardHeader>
                    <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                    <CardTitle className="font-headline text-2xl mt-4">Redirigiendo...</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-muted-foreground">
                        La edición de ítems ha sido reorganizada. Serás redirigido a la página correcta.
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
