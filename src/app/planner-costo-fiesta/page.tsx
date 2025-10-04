
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

// This page is obsolete. Its functionality has been moved to the event planner itself.
// We redirect to the new central page for this functionality.
export default function DeprecatedPlannerHubPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/fiestas/nueva/catering');
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
                        El Planificador Gastronómico ahora está integrado en el planificador del evento. Serás redirigido.
                    </p>
                </CardContent>
                 <CardFooter className="justify-center">
                    <Link href="/fiestas/nueva/catering" passHref>
                        <Button variant="link">
                            Si no eres redirigido, haz clic aquí.
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
