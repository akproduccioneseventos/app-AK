// This file is obsolete. The functionality has been moved to /app/portal/page.tsx.
// It will be removed in a future commit.

'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, Globe } from 'lucide-react';

export default function OldPortalPage() {
    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="max-w-xl text-center">
                <CardHeader>
                    <Info className="w-12 h-12 mx-auto text-primary" />
                    <CardTitle className="font-headline text-2xl mt-4">Página Reubicada</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        La configuración del portal ahora se gestiona desde el Hub del Planificador, y el portal en sí ahora se encuentra en una nueva ubicación para facilitar el acceso del cliente.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Link href="/fiestas/nueva" passHref>
                        <Button>
                            <ArrowLeft className="mr-2" /> Ir al Planificador
                        </Button>
                    </Link>
                     <Link href="/portal" passHref>
                        <Button variant="secondary">
                            <Globe className="mr-2" /> Ir al Nuevo Portal de Cliente
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
