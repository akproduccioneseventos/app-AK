
'use client';

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

// This page is obsolete and has been replaced by specific edit pages for each module.
export default function DeprecatedGeneralEditPage({ params: paramsProp }: { params: { id: string } }) {
    const params = use(paramsProp);
    const router = useRouter();
    const { id } = params;

    useEffect(() => {
        // A simple redirect logic. A more robust solution might check the item type first.
        // For now, we assume it's either a service or an asset.
        // A better approach would be a server-side redirect or a more intelligent client-side one.
        if (id.startsWith('serv_')) {
            router.replace(`/empresa/servicios/${id}/editar`);
        } else if (id.startsWith('insumo_')) {
            router.replace(`/empresa/insumos/${id}/editar`);
        } else {
            router.replace(`/empresa/activos-fijos/${id}/editar`);
        }
    }, [router, id]);

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="max-w-xl text-center">
                <CardHeader>
                    <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                    <CardTitle className="font-headline text-2xl mt-4">Redirigiendo...</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-muted-foreground">
                        La edición de ítems ha sido reestructurada. Serás redirigido a la página de edición correcta.
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
