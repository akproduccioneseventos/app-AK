
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

function RedirectToInsumos() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/empresa/insumos');
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
                        La gestión de Insumos ahora es parte del Planificador Gastronómico Maestro. Serás redirigido.
                    </p>
                </CardContent>
                 <CardFooter className="justify-center">
                    <Link href="/empresa/insumos">
                        <Button variant="link">
                            Si no eres redirigido, haz clic aquí.
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function DeprecatedServiciosSubcategoriaPage() {
    return <RedirectToInsumos />;
}
