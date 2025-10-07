
'use client';

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

// This page is obsolete. Its functionality has been moved to a central module.
export default function DeprecatedEditarMenuIdPage({ params: paramsProp }: { params: { menuId: string } }) {
    const params = use(paramsProp);
    const router = useRouter();
    const { menuId } = params;

    useEffect(() => {
        if (menuId) {
            router.replace(`/empresa/menus/${menuId}/editar`);
        } else {
            router.replace('/empresa/menus');
        }
    }, [router, menuId]);

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="max-w-xl text-center">
                <CardHeader>
                    <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                    <CardTitle className="font-headline text-2xl mt-4">Redirigiendo...</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-muted-foreground">
                        La edición de menús ahora es centralizada. Serás redirigido a la nueva página de gestión de menús.
                    </p>
                </CardContent>
                 <CardFooter className="justify-center">
                    <Link href={menuId ? `/empresa/menus/${menuId}/editar` : '/empresa/menus'} passHref>
                        <Button variant="link">
                            Si no eres redirigido, haz clic aquí.
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
